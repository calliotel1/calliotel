from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime, timezone
from routes.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
import os
import csv
import io
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class Contact(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class CreateContactRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    notes: Optional[str] = None

class UpdateContactRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

@router.get("/")
async def get_contacts(current_user = Depends(get_current_user)):
    """
    Get all contacts for the current user.
    """
    try:
        contacts = await db.contacts.find(
            {"user_id": current_user["_id"]},
            {"_id": 0}
        ).sort("name", 1).to_list(1000)
        
        return {"contacts": contacts, "total": len(contacts)}
    except Exception as e:
        logger.error(f"Error fetching contacts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch contacts")

@router.post("/")
async def create_contact(request: CreateContactRequest, current_user = Depends(get_current_user)):
    """
    Create a new contact.
    """
    try:
        # Check if contact already exists with this phone
        existing = await db.contacts.find_one({
            "user_id": current_user["_id"],
            "phone": request.phone
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Contact with this phone number already exists")
        
        contact = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["_id"],
            "name": request.name,
            "phone": request.phone,
            "email": request.email,
            "notes": request.notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.contacts.insert_one(contact)
        
        # Remove MongoDB _id for response
        contact.pop("_id", None)
        contact.pop("user_id", None)
        
        return {"success": True, "contact": contact}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating contact: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create contact")

@router.put("/{contact_id}")
async def update_contact(contact_id: str, request: UpdateContactRequest, current_user = Depends(get_current_user)):
    """
    Update an existing contact.
    """
    try:
        contact = await db.contacts.find_one({
            "id": contact_id,
            "user_id": current_user["_id"]
        })
        
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        update_data = {k: v for k, v in request.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.contacts.update_one(
            {"id": contact_id, "user_id": current_user["_id"]},
            {"$set": update_data}
        )
        
        updated_contact = await db.contacts.find_one(
            {"id": contact_id},
            {"_id": 0, "user_id": 0}
        )
        
        return {"success": True, "contact": updated_contact}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contact: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update contact")

@router.delete("/{contact_id}")
async def delete_contact(contact_id: str, current_user = Depends(get_current_user)):
    """
    Delete a contact.
    """
    try:
        result = await db.contacts.delete_one({
            "id": contact_id,
            "user_id": current_user["_id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return {"success": True, "message": "Contact deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contact: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete contact")

@router.post("/upload")
async def upload_contacts(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    """
    Upload contacts from CSV or vCard file.
    Supported formats:
    - CSV: name,phone,email,notes
    - vCard: .vcf files
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        filename = file.filename.lower()
        
        if filename.endswith('.csv'):
            # Parse CSV
            content = await file.read()
            text = content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(text))
            
            contacts_to_add = []
            errors = []
            
            for row_num, row in enumerate(csv_reader, start=2):
                try:
                    name = row.get('name', '').strip()
                    phone = row.get('phone', '').strip()
                    
                    if not name or not phone:
                        errors.append(f"Row {row_num}: Missing name or phone")
                        continue
                    
                    # Check if already exists
                    existing = await db.contacts.find_one({
                        "user_id": current_user["_id"],
                        "phone": phone
                    })
                    
                    if existing:
                        errors.append(f"Row {row_num}: Contact with phone {phone} already exists")
                        continue
                    
                    contact = {
                        "id": str(uuid.uuid4()),
                        "user_id": current_user["_id"],
                        "name": name,
                        "phone": phone,
                        "email": row.get('email', '').strip() or None,
                        "notes": row.get('notes', '').strip() or None,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    contacts_to_add.append(contact)
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            if contacts_to_add:
                await db.contacts.insert_many(contacts_to_add)
            
            return {
                "success": True,
                "contacts_added": len(contacts_to_add),
                "errors": errors if errors else None,
                "message": f"Successfully uploaded {len(contacts_to_add)} contacts"
            }
            
        elif filename.endswith('.vcf'):
            # Parse vCard
            content = await file.read()
            text = content.decode('utf-8')
            
            contacts_to_add = []
            errors = []
            
            # Simple vCard parser
            vcards = text.split('BEGIN:VCARD')
            
            for idx, vcard in enumerate(vcards[1:], start=1):  # Skip first empty split
                try:
                    name = None
                    phone = None
                    email = None
                    
                    for line in vcard.split('\n'):
                        line = line.strip()
                        if line.startswith('FN:'):
                            name = line[3:].strip()
                        elif line.startswith('TEL'):
                            phone = line.split(':')[-1].strip()
                        elif line.startswith('EMAIL'):
                            email = line.split(':')[-1].strip()
                    
                    if not name or not phone:
                        errors.append(f"vCard {idx}: Missing name or phone")
                        continue
                    
                    # Check if already exists
                    existing = await db.contacts.find_one({
                        "user_id": current_user["_id"],
                        "phone": phone
                    })
                    
                    if existing:
                        errors.append(f"vCard {idx}: Contact with phone {phone} already exists")
                        continue
                    
                    contact = {
                        "id": str(uuid.uuid4()),
                        "user_id": current_user["_id"],
                        "name": name,
                        "phone": phone,
                        "email": email,
                        "notes": None,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    contacts_to_add.append(contact)
                    
                except Exception as e:
                    errors.append(f"vCard {idx}: {str(e)}")
            
            if contacts_to_add:
                await db.contacts.insert_many(contacts_to_add)
            
            return {
                "success": True,
                "contacts_added": len(contacts_to_add),
                "errors": errors if errors else None,
                "message": f"Successfully uploaded {len(contacts_to_add)} contacts"
            }
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or vCard (.vcf) files")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading contacts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload contacts: {str(e)}")

@router.get("/export")
async def export_contacts(current_user = Depends(get_current_user)):
    """
    Export contacts as CSV.
    """
    try:
        contacts = await db.contacts.find(
            {"user_id": current_user["_id"]},
            {"_id": 0, "user_id": 0, "id": 0}
        ).sort("name", 1).to_list(1000)
        
        if not contacts:
            return {"success": True, "csv": "", "message": "No contacts to export"}
        
        # Create CSV
        output = io.StringIO()
        fieldnames = ['name', 'phone', 'email', 'notes']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        
        writer.writeheader()
        for contact in contacts:
            writer.writerow({
                'name': contact.get('name', ''),
                'phone': contact.get('phone', ''),
                'email': contact.get('email', ''),
                'notes': contact.get('notes', '')
            })
        
        csv_content = output.getvalue()
        
        return {
            "success": True,
            "csv": csv_content,
            "total_contacts": len(contacts)
        }
    except Exception as e:
        logger.error(f"Error exporting contacts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export contacts")
