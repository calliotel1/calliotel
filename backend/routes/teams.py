from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Models
class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None

class TeamMemberInvite(BaseModel):
    email: str
    role: str  # admin, member, viewer

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Team Management
@router.post("/create")
async def create_team(team: TeamCreate, current_user = Depends(get_current_user)):
    """
    Create a new team/workspace.
    """
    try:
        user_id = current_user["_id"]
        
        team_doc = {
            "id": str(uuid.uuid4()),
            "name": team.name,
            "description": team.description,
            "owner_id": user_id,
            "members": [{
                "user_id": user_id,
                "email": current_user["email"],
                "role": "owner",
                "joined_at": datetime.now(timezone.utc).isoformat()
            }],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "settings": {
                "shared_numbers": True,
                "shared_contacts": True,
                "shared_wallet": False
            }
        }
        
        await db.teams.insert_one(team_doc)
        
        return {
            "success": True,
            "team_id": team_doc["id"],
            "message": "Team created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create team")

@router.get("/my-teams")
async def get_my_teams(current_user = Depends(get_current_user)):
    """
    Get all teams user is part of.
    """
    try:
        user_id = current_user["_id"]
        
        teams = await db.teams.find({
            "members.user_id": user_id
        }, {"_id": 0}).to_list(100)
        
        # Add role info for current user
        for team in teams:
            user_member = next((m for m in team["members"] if m["user_id"] == user_id), None)
            if user_member:
                team["my_role"] = user_member["role"]
        
        return {
            "success": True,
            "teams": teams,
            "total": len(teams)
        }
    except Exception as e:
        logger.error(f"Error getting teams: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get teams")

@router.get("/{team_id}")
async def get_team(team_id: str, current_user = Depends(get_current_user)):
    """
    Get team details.
    """
    try:
        user_id = current_user["_id"]
        
        team = await db.teams.find_one({"id": team_id}, {"_id": 0})
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if user is a member
        is_member = any(m["user_id"] == user_id for m in team["members"])
        
        if not is_member:
            raise HTTPException(status_code=403, detail="Not a team member")
        
        # Get team stats
        team_numbers = await db.team_numbers.count_documents({"team_id": team_id})
        team_contacts = await db.team_contacts.count_documents({"team_id": team_id})
        
        team["stats"] = {
            "members_count": len(team["members"]),
            "numbers_count": team_numbers,
            "contacts_count": team_contacts
        }
        
        return {
            "success": True,
            "team": team
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get team")

@router.put("/{team_id}")
async def update_team(team_id: str, updates: TeamUpdate, current_user = Depends(get_current_user)):
    """
    Update team details (owner/admin only).
    """
    try:
        user_id = current_user["_id"]
        
        team = await db.teams.find_one({"id": team_id})
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if user is owner or admin
        user_member = next((m for m in team["members"] if m["user_id"] == user_id), None)
        
        if not user_member or user_member["role"] not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        
        if update_data:
            await db.teams.update_one(
                {"id": team_id},
                {"$set": update_data}
            )
        
        return {
            "success": True,
            "message": "Team updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update team")

# Team Members
@router.post("/{team_id}/invite")
async def invite_member(team_id: str, invite: TeamMemberInvite, current_user = Depends(get_current_user)):
    """
    Invite a new member to the team.
    """
    try:
        user_id = current_user["_id"]
        
        team = await db.teams.find_one({"id": team_id})
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check permissions
        user_member = next((m for m in team["members"] if m["user_id"] == user_id), None)
        
        if not user_member or user_member["role"] not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Find user to invite
        invitee = await db.users.find_one({"email": invite.email})
        
        if not invitee:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already a member
        if any(m["user_id"] == invitee["_id"] for m in team["members"]):
            raise HTTPException(status_code=400, detail="User is already a team member")
        
        # Add member
        new_member = {
            "user_id": invitee["_id"],
            "email": invitee["email"],
            "role": invite.role,
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.teams.update_one(
            {"id": team_id},
            {"$push": {"members": new_member}}
        )
        
        return {
            "success": True,
            "message": f"{invite.email} added to team"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to invite member")

@router.delete("/{team_id}/members/{member_user_id}")
async def remove_member(team_id: str, member_user_id: str, current_user = Depends(get_current_user)):
    """
    Remove a member from the team.
    """
    try:
        user_id = current_user["_id"]
        
        team = await db.teams.find_one({"id": team_id})
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check permissions
        user_member = next((m for m in team["members"] if m["user_id"] == user_id), None)
        
        if not user_member or user_member["role"] not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Can't remove owner
        if team["owner_id"] == member_user_id:
            raise HTTPException(status_code=400, detail="Cannot remove team owner")
        
        # Remove member
        await db.teams.update_one(
            {"id": team_id},
            {"$pull": {"members": {"user_id": member_user_id}}}
        )
        
        return {
            "success": True,
            "message": "Member removed from team"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove member")

# Team Resources
@router.post("/{team_id}/numbers/{number_id}/share")
async def share_number_with_team(team_id: str, number_id: str, current_user = Depends(get_current_user)):
    """
    Share a phone number with the team.
    """
    try:
        user_id = current_user["_id"]
        
        # Verify ownership
        number = await db.purchased_numbers.find_one({
            "id": number_id,
            "user_id": user_id
        })
        
        if not number:
            raise HTTPException(status_code=404, detail="Number not found or not owned by you")
        
        # Verify team membership
        team = await db.teams.find_one({"id": team_id, "members.user_id": user_id})
        
        if not team:
            raise HTTPException(status_code=403, detail="Not a team member")
        
        # Share number
        team_number = {
            "id": str(uuid.uuid4()),
            "team_id": team_id,
            "number_id": number_id,
            "phone_number": number["phone_number"],
            "shared_by": user_id,
            "shared_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.team_numbers.insert_one(team_number)
        
        return {
            "success": True,
            "message": "Number shared with team"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sharing number: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to share number")

@router.get("/{team_id}/numbers")
async def get_team_numbers(team_id: str, current_user = Depends(get_current_user)):
    """
    Get all numbers shared with the team.
    """
    try:
        user_id = current_user["_id"]
        
        # Verify team membership
        team = await db.teams.find_one({"id": team_id, "members.user_id": user_id})
        
        if not team:
            raise HTTPException(status_code=403, detail="Not a team member")
        
        # Get team numbers
        team_numbers = await db.team_numbers.find(
            {"team_id": team_id},
            {"_id": 0}
        ).to_list(100)
        
        return {
            "success": True,
            "numbers": team_numbers,
            "total": len(team_numbers)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting team numbers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get team numbers")

@router.get("/{team_id}/activity")
async def get_team_activity(team_id: str, current_user = Depends(get_current_user)):
    """
    Get team activity feed.
    """
    try:
        user_id = current_user["_id"]
        
        # Verify team membership
        team = await db.teams.find_one({"id": team_id, "members.user_id": user_id})
        
        if not team:
            raise HTTPException(status_code=403, detail="Not a team member")
        
        # Get recent activity (example: messages sent by team)
        # In production, track team actions in an activity log
        
        return {
            "success": True,
            "activity": [],
            "message": "Team activity tracking coming soon"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting team activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get team activity")

@router.delete("/{team_id}")
async def delete_team(team_id: str, current_user = Depends(get_current_user)):
    """
    Delete a team (owner only).
    """
    try:
        user_id = current_user["_id"]
        
        team = await db.teams.find_one({"id": team_id})
        
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        if team["owner_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only team owner can delete the team")
        
        # Delete team and all related data
        await db.teams.delete_one({"id": team_id})
        await db.team_numbers.delete_many({"team_id": team_id})
        await db.team_contacts.delete_many({"team_id": team_id})
        
        return {
            "success": True,
            "message": "Team deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete team")
