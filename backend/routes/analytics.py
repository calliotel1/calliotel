from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict
import logging
from datetime import datetime, timezone, timedelta
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
from collections import defaultdict

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.get("/empire")
async def get_empire_analytics(
    timeframe: str = "all",  # all, today, week, month
    current_user = Depends(get_current_user)
):
    """
    Empire Analytics Dashboard
    Shows SMM revenue vs Telecom revenue with 100% markup visibility
    """
    try:
        # Calculate date range based on timeframe
        now = datetime.now(timezone.utc)
        if timeframe == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif timeframe == "week":
            start_date = now - timedelta(days=7)
        elif timeframe == "month":
            start_date = now - timedelta(days=30)
        else:
            start_date = datetime(2020, 1, 1, tzinfo=timezone.utc)  # All time
        
        # Aggregate SMM orders
        smm_stats_result = await db.smm_orders.aggregate([
            {"$match": {"created_at": {"$gte": start_date.isoformat()}}},
            {
                "$group": {
                    "_id": None,
                    "total_orders": {"$sum": 1},
                    "total_revenue": {"$sum": "$amount"},
                    "total_cost": {"$sum": "$provider_cost"}
                }
            }
        ]).to_list(1)
        
        if smm_stats_result:
            smm_revenue = smm_stats_result[0].get("total_revenue", 0)
            smm_cost = smm_stats_result[0].get("total_cost", 0)
            smm_orders = smm_stats_result[0].get("total_orders", 0)
            smm_profit = smm_revenue - smm_cost
        else:
            smm_revenue = smm_cost = smm_orders = smm_profit = 0
        
        # Aggregate Sonetel subscriptions
        telecom_stats_result = await db.sonetel_subscriptions.aggregate([
            {
                "$match": {
                    "purchase_date": {"$gte": start_date.isoformat()},
                    "status": "active"
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_subscriptions": {"$sum": 1},
                    "total_revenue": {"$sum": "$monthly_cost"},
                    "total_cost": {"$sum": "$provider_cost"}
                }
            }
        ]).to_list(1)
        
        if telecom_stats_result:
            telecom_revenue = telecom_stats_result[0].get("total_revenue", 0)
            telecom_cost = telecom_stats_result[0].get("total_cost", 0)
            telecom_subscriptions = telecom_stats_result[0].get("total_subscriptions", 0)
            telecom_profit = telecom_revenue - telecom_cost
        else:
            telecom_revenue = telecom_cost = telecom_subscriptions = telecom_profit = 0
        
        # Total empire metrics
        total_revenue = smm_revenue + telecom_revenue
        total_cost = smm_cost + telecom_cost
        total_profit = smm_profit + telecom_profit
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Get top SMM services
        top_services = await db.smm_orders.aggregate([
            {"$match": {"created_at": {"$gte": start_date.isoformat()}}},
            {
                "$group": {
                    "_id": "$service_name",
                    "orders": {"$sum": 1},
                    "revenue": {"$sum": "$amount"}
                }
            },
            {"$sort": {"revenue": -1}},
            {"$limit": 5}
        ]).to_list(5)
        
        # Active users count
        active_users = await db.users.count_documents({
            "last_login": {"$gte": start_date.isoformat()}
        })
        
        return {
            "timeframe": timeframe,
            "period_start": start_date.isoformat(),
            "period_end": now.isoformat(),
            "total_revenue": round(total_revenue, 2),
            "total_cost": round(total_cost, 2),
            "total_profit": round(total_profit, 2),
            "profit_margin_percent": round(profit_margin, 2),
            "smm": {
                "revenue": round(smm_revenue, 2),
                "cost": round(smm_cost, 2),
                "profit": round(smm_profit, 2),
                "orders": smm_orders,
                "markup_percent": round((smm_profit / smm_cost * 100) if smm_cost > 0 else 0, 2)
            },
            "telecom": {
                "revenue": round(telecom_revenue, 2),
                "cost": round(telecom_cost, 2),
                "profit": round(telecom_profit, 2),
                "subscriptions": telecom_subscriptions,
                "markup_percent": round((telecom_profit / telecom_cost * 100) if telecom_cost > 0 else 0, 2)
            },
            "top_services": [
                {"service": s["_id"], "orders": s["orders"], "revenue": round(s["revenue"], 2)}
                for s in top_services
            ],
            "active_users": active_users
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching empire analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")



@router.get("/sms-stats")
async def get_sms_stats(days: int = 30, current_user = Depends(get_current_user)):
    """
    Get SMS statistics for the specified period.
    """
    try:
        user_id = current_user["_id"]
        
        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Get user's phone numbers
        user_numbers = await db.purchased_numbers.find(
            {"user_id": user_id},
            {"phone_number": 1}
        ).to_list(100)
        
        number_list = [n["phone_number"] for n in user_numbers]
        
        if not number_list:
            return {
                "total_sent": 0,
                "total_received": 0,
                "daily_activity": [],
                "top_contacts": [],
                "response_rate": 0,
                "avg_response_time": 0
            }
        
        # Get sent messages
        sent_messages = await db.messages.find({
            "from_number": {"$in": number_list},
            "direction": "outbound",
            "timestamp": {"$gte": start_date.isoformat()}
        }, {"_id": 0}).to_list(10000)
        
        # Get received messages  
        received_messages = await db.messages.find({
            "to_number": {"$in": number_list},
            "direction": "inbound",
            "timestamp": {"$gte": start_date.isoformat()}
        }, {"_id": 0}).to_list(10000)
        
        # Calculate daily activity
        daily_sent = defaultdict(int)
        daily_received = defaultdict(int)
        
        for msg in sent_messages:
            date = datetime.fromisoformat(msg["timestamp"].replace('Z', '+00:00')).date()
            daily_sent[str(date)] += 1
        
        for msg in received_messages:
            date = datetime.fromisoformat(msg["timestamp"].replace('Z', '+00:00')).date()
            daily_received[str(date)] += 1
        
        # Generate daily activity for all days in range
        daily_activity = []
        current_date = start_date.date()
        while current_date <= end_date.date():
            date_str = str(current_date)
            daily_activity.append({
                "date": date_str,
                "sent": daily_sent.get(date_str, 0),
                "received": daily_received.get(date_str, 0)
            })
            current_date += timedelta(days=1)
        
        # Calculate top contacts
        contact_activity = defaultdict(lambda: {"sent": 0, "received": 0})
        
        for msg in sent_messages:
            contact = msg.get("to_number", "Unknown")
            contact_activity[contact]["sent"] += 1
        
        for msg in received_messages:
            contact = msg.get("from_number", "Unknown")
            contact_activity[contact]["received"] += 1
        
        top_contacts = [
            {
                "number": contact,
                "sent": data["sent"],
                "received": data["received"],
                "total": data["sent"] + data["received"]
            }
            for contact, data in contact_activity.items()
        ]
        top_contacts.sort(key=lambda x: x["total"], reverse=True)
        top_contacts = top_contacts[:10]
        
        # Calculate response rate (simplified)
        total_conversations = len(contact_activity)
        responded_conversations = sum(1 for data in contact_activity.values() if data["sent"] > 0 and data["received"] > 0)
        response_rate = (responded_conversations / total_conversations * 100) if total_conversations > 0 else 0
        
        return {
            "total_sent": len(sent_messages),
            "total_received": len(received_messages),
            "daily_activity": daily_activity,
            "top_contacts": top_contacts,
            "response_rate": round(response_rate, 2),
            "period_days": days
        }
    except Exception as e:
        logger.error(f"Error getting SMS stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get SMS statistics")

@router.get("/usage-stats")
async def get_usage_stats(current_user = Depends(get_current_user)):
    """
    Get overall usage statistics.
    """
    try:
        user_id = current_user["_id"]
        
        # Get counts
        numbers_count = await db.purchased_numbers.count_documents({"user_id": user_id})
        contacts_count = await db.contacts.count_documents({"user_id": user_id})
        friends_count = await db.friendships.count_documents({
            "$or": [{"user1_id": user_id}, {"user2_id": user_id}]
        })
        
        # Get wallet info
        wallet = await db.wallets.find_one({"user_id": user_id})
        balance = wallet.get("balance", 0) if wallet else 0
        
        # Get transaction totals
        transactions = await db.transactions.find({"user_id": user_id}).to_list(1000)
        total_spent = sum(t["amount"] for t in transactions if t["type"] == "debit")
        total_earned = sum(t["amount"] for t in transactions if t["type"] == "credit")
        
        # Get referral stats
        referrals_count = await db.users.count_documents({"referred_by": user_id})
        
        return {
            "phone_numbers": numbers_count,
            "contacts": contacts_count,
            "friends": friends_count,
            "balance": balance,
            "total_spent": total_spent,
            "total_earned": total_earned,
            "referrals": referrals_count
        }
    except Exception as e:
        logger.error(f"Error getting usage stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get usage statistics")

@router.get("/activity-heatmap")
async def get_activity_heatmap(current_user = Depends(get_current_user)):
    """
    Get hourly activity heatmap for SMS.
    """
    try:
        user_id = current_user["_id"]
        
        # Get user's numbers
        user_numbers = await db.purchased_numbers.find(
            {"user_id": user_id},
            {"phone_number": 1}
        ).to_list(100)
        
        number_list = [n["phone_number"] for n in user_numbers]
        
        if not number_list:
            return {"heatmap": []}
        
        # Get last 7 days of messages
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=7)
        
        messages = await db.messages.find({
            "$or": [
                {"from_number": {"$in": number_list}},
                {"to_number": {"$in": number_list}}
            ],
            "timestamp": {"$gte": start_date.isoformat()}
        }, {"timestamp": 1}).to_list(10000)
        
        # Create heatmap (day of week x hour)
        heatmap = [[0 for _ in range(24)] for _ in range(7)]
        
        for msg in messages:
            dt = datetime.fromisoformat(msg["timestamp"].replace('Z', '+00:00'))
            day_of_week = dt.weekday()  # 0=Monday, 6=Sunday
            hour = dt.hour
            heatmap[day_of_week][hour] += 1
        
        # Format for frontend
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        formatted_heatmap = []
        
        for day_idx, day_name in enumerate(days):
            for hour in range(24):
                formatted_heatmap.append({
                    "day": day_name,
                    "hour": hour,
                    "count": heatmap[day_idx][hour]
                })
        
        return {"heatmap": formatted_heatmap}
    except Exception as e:
        logger.error(f"Error getting activity heatmap: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get activity heatmap")

@router.get("/cost-breakdown")
async def get_cost_breakdown(current_user = Depends(get_current_user)):
    """
    Get cost breakdown by category.
    """
    try:
        user_id = current_user["_id"]
        
        # Get all transactions
        transactions = await db.transactions.find(
            {"user_id": user_id, "type": "debit"},
            {"_id": 0}
        ).to_list(1000)
        
        # Categorize by description keywords
        categories = {
            "Phone Numbers": 0,
            "SMS": 0,
            "Calls": 0,
            "Transfers": 0,
            "Other": 0
        }
        
        for txn in transactions:
            desc = txn.get("description", "").lower()
            amount = abs(txn["amount"])
            
            if "number" in desc or "purchased" in desc:
                categories["Phone Numbers"] += amount
            elif "sms" in desc or "message" in desc:
                categories["SMS"] += amount
            elif "call" in desc:
                categories["Calls"] += amount
            elif "transfer" in desc:
                categories["Transfers"] += amount
            else:
                categories["Other"] += amount
        
        # Format for pie chart
        breakdown = [
            {"category": cat, "amount": amount}
            for cat, amount in categories.items()
            if amount > 0
        ]
        
        return {"breakdown": breakdown}
    except Exception as e:
        logger.error(f"Error getting cost breakdown: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get cost breakdown")

@router.get("/engagement-metrics")
async def get_engagement_metrics(days: int = 30, current_user = Depends(get_current_user)):
    """
    Get comprehensive engagement metrics including messages, stories, voice notes.
    """
    try:
        user_id = current_user["_id"]
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Messages sent (chat)
        messages_sent = await db.messages.count_documents({
            "sender_id": user_id,
            "timestamp": {"$gte": start_date.isoformat()}
        })
        
        # Stories posted
        stories_posted = await db.stories.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": start_date}
        })
        
        # Voice notes sent
        voice_notes_sent = await db.voice_notes.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": start_date}
        })
        
        # Story views received
        story_views = await db.story_views.count_documents({
            "story_owner_id": user_id,
            "viewed_at": {"$gte": start_date}
        })
        
        # Friends added
        friends_added = await db.friendships.count_documents({
            "$or": [{"user1_id": user_id}, {"user2_id": user_id}],
            "created_at": {"$gte": start_date}
        })
        
        # Calculate daily activity trend
        daily_activity = []
        current_date = start_date.date()
        
        while current_date <= end_date.date():
            next_date = current_date + timedelta(days=1)
            
            day_messages = await db.messages.count_documents({
                "sender_id": user_id,
                "timestamp": {
                    "$gte": datetime.combine(current_date, datetime.min.time(), tzinfo=timezone.utc).isoformat(),
                    "$lt": datetime.combine(next_date, datetime.min.time(), tzinfo=timezone.utc).isoformat()
                }
            })
            
            day_stories = await db.stories.count_documents({
                "user_id": user_id,
                "created_at": {
                    "$gte": datetime.combine(current_date, datetime.min.time(), tzinfo=timezone.utc),
                    "$lt": datetime.combine(next_date, datetime.min.time(), tzinfo=timezone.utc)
                }
            })
            
            daily_activity.append({
                "date": str(current_date),
                "messages": day_messages,
                "stories": day_stories,
                "total": day_messages + day_stories
            })
            
            current_date = next_date
        
        return {
            "messages_sent": messages_sent,
            "stories_posted": stories_posted,
            "voice_notes_sent": voice_notes_sent,
            "story_views_received": story_views,
            "friends_added": friends_added,
            "daily_activity": daily_activity,
            "avg_messages_per_day": round(messages_sent / days, 1) if days > 0 else 0,
            "avg_stories_per_day": round(stories_posted / days, 1) if days > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error getting engagement metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get engagement metrics")

@router.get("/gamification-analytics")
async def get_gamification_analytics(current_user = Depends(get_current_user)):
    """
    Get gamification analytics including XP trends, level progress, achievements.
    """
    try:
        user_id = current_user["_id"]
        
        # Get current profile
        profile = await db.gamification_profiles.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        if not profile:
            return {
                "total_xp": 0,
                "level": 1,
                "achievements_unlocked": 0,
                "xp_trend": [],
                "top_activities": []
            }
        
        # Get XP history (from stats)
        stats = profile.get("stats", {})
        
        # Calculate XP breakdown by activity
        xp_breakdown = {
            "Messages": stats.get("messages_sent", 0) * 1,  # 1 XP per message
            "Stories": stats.get("stories_posted", 0) * 10,  # 10 XP per story
            "Voice Notes": stats.get("voice_notes_sent", 0) * 5,  # 5 XP per voice note
            "Friends": stats.get("friends_added", 0) * 20,  # 20 XP per friend
            "AI Features": stats.get("ai_features_used", 0) * 3  # 3 XP per AI usage
        }
        
        top_activities = [
            {"activity": k, "xp": v}
            for k, v in sorted(xp_breakdown.items(), key=lambda x: x[1], reverse=True)
            if v > 0
        ]
        
        # Achievements unlocked
        achievements_count = len(profile.get("achievements", []))
        
        # Mock XP trend for last 7 days (in production, would track XP changes)
        xp_trend = []
        total_xp = profile.get("total_points", 0)
        
        for i in range(7):
            date = (datetime.now(timezone.utc) - timedelta(days=6-i)).date()
            # Distribute XP across days (simple approximation)
            xp_trend.append({
                "date": str(date),
                "xp": round(total_xp / 7)
            })
        
        return {
            "total_xp": profile.get("total_points", 0),
            "level": profile.get("level", 1),
            "achievements_unlocked": achievements_count,
            "xp_trend": xp_trend,
            "top_activities": top_activities[:5]
        }
    except Exception as e:
        logger.error(f"Error getting gamification analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get gamification analytics")

@router.get("/social-metrics")
async def get_social_metrics(days: int = 30, current_user = Depends(get_current_user)):
    """
    Get social interaction metrics.
    """
    try:
        user_id = current_user["_id"]
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Total friends
        total_friends = await db.friendships.count_documents({
            "$or": [{"user1_id": user_id}, {"user2_id": user_id}]
        })
        
        # New friends in period
        new_friends = await db.friendships.count_documents({
            "$or": [{"user1_id": user_id}, {"user2_id": user_id}],
            "created_at": {"$gte": start_date}
        })
        
        # Chat interactions
        messages_received = await db.messages.count_documents({
            "receiver_id": user_id,
            "timestamp": {"$gte": start_date.isoformat()}
        })
        
        messages_sent = await db.messages.count_documents({
            "sender_id": user_id,
            "timestamp": {"$gte": start_date.isoformat()}
        })
        
        # Story interactions
        story_views_given = await db.story_views.count_documents({
            "viewer_id": user_id,
            "viewed_at": {"$gte": start_date}
        })
        
        story_views_received = await db.story_views.count_documents({
            "story_owner_id": user_id,
            "viewed_at": {"$gte": start_date}
        })
        
        # Most active friends (top 5)
        message_pipeline = [
            {
                "$match": {
                    "$or": [
                        {"sender_id": user_id},
                        {"receiver_id": user_id}
                    ],
                    "timestamp": {"$gte": start_date.isoformat()}
                }
            },
            {
                "$project": {
                    "friend_id": {
                        "$cond": {
                            "if": {"$eq": ["$sender_id", user_id]},
                            "then": "$receiver_id",
                            "else": "$sender_id"
                        }
                    }
                }
            },
            {
                "$group": {
                    "_id": "$friend_id",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        
        top_friends_data = await db.messages.aggregate(message_pipeline).to_list(5)
        
        # Get friend names
        top_friends = []
        for friend_data in top_friends_data:
            friend_id = friend_data["_id"]
            friend = await db.users.find_one(
                {"_id": friend_id},
                {"_id": 0, "full_name": 1, "email": 1}
            )
            
            if friend:
                top_friends.append({
                    "name": friend.get("full_name") or friend.get("email", "Unknown"),
                    "interactions": friend_data["count"]
                })
        
        # Get user's channel activity (posts per channel)
        posts_by_channel = await db.posts.aggregate([
            {
                "$match": {
                    "author_id": user_id,
                    "created_at": {"$gte": start_date.isoformat()}
                }
            },
            {
                "$group": {
                    "_id": "$channel_id",
                    "post_count": {"$sum": 1}
                }
            },
            {"$sort": {"post_count": -1}},
            {"$limit": 5}
        ]).to_list(5)
        
        # Get channel details and engagement
        top_channels = []
        for channel_data in posts_by_channel:
            channel_id = channel_data["_id"]
            channel = await db.channels.find_one(
                {"channel_id": channel_id},
                {"_id": 0, "name": 1}
            )
            
            if channel:
                # Get engagement for user's posts in this channel
                user_posts_in_channel = await db.posts.find(
                    {
                        "channel_id": channel_id,
                        "author_id": user_id
                    },
                    {"_id": 0, "post_id": 1}
                ).to_list(1000)
                
                post_ids = [p["post_id"] for p in user_posts_in_channel]
                
                # Count likes and comments
                total_likes = await db.post_likes.count_documents({
                    "post_id": {"$in": post_ids}
                })
                total_comments = await db.comments.count_documents({
                    "post_id": {"$in": post_ids}
                })
                
                engagement = total_likes + total_comments
                
                top_channels.append({
                    "name": channel["name"],
                    "post_count": channel_data["post_count"],
                    "engagement": engagement,
                    "score": channel_data["post_count"] * 10 + engagement
                })
        
        # Get total channels joined
        channels_joined = await db.channel_members.count_documents({
            "user_id": user_id
        })
        
        # Get total posts created
        posts_created = await db.posts.count_documents({
            "author_id": user_id
        })
        
        # Calculate avg engagement rate
        if posts_created > 0:
            all_user_posts = await db.posts.find(
                {"author_id": user_id},
                {"_id": 0, "post_id": 1}
            ).to_list(1000)
            
            all_post_ids = [p["post_id"] for p in all_user_posts]
            
            total_likes_all = await db.post_likes.count_documents({
                "post_id": {"$in": all_post_ids}
            })
            total_comments_all = await db.comments.count_documents({
                "post_id": {"$in": all_post_ids}
            })
            
            avg_engagement_rate = round(
                ((total_likes_all + total_comments_all) / posts_created) * 100,
                1
            )
        else:
            avg_engagement_rate = 0
        
        return {
            "total_friends": total_friends,
            "new_friends": new_friends,
            "messages_sent": messages_sent,
            "messages_received": messages_received,
            "story_views_given": story_views_given,
            "story_views_received": story_views_received,
            "interaction_rate": round((messages_sent + messages_received) / max(total_friends, 1), 1),
            "top_friends": top_friends,
            "channels_joined": channels_joined,
            "posts_created": posts_created,
            "avg_engagement_rate": avg_engagement_rate,
            "top_channels": top_channels
        }
    except Exception as e:
        logger.error(f"Error getting social metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get social metrics")

@router.get("/export-data")
async def export_analytics_data(format: str = "json", current_user = Depends(get_current_user)):
    """
    Export all analytics data in specified format (json or csv).
    """
    try:
        user_id = current_user["_id"]
        
        # Gather all data
        engagement = await get_engagement_metrics(30, current_user)
        social = await get_social_metrics(30, current_user)
        gamification = await get_gamification_analytics(current_user)
        
        export_data = {
            "user_id": user_id,
            "export_date": datetime.now(timezone.utc).isoformat(),
            "engagement_metrics": engagement,
            "social_metrics": social,
            "gamification_analytics": gamification
        }
        
        return export_data
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export data")
