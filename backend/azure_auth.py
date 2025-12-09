from fastapi import Depends, HTTPException, Security, status
from fastapi_azure_auth.user import User as AzureUser
from typing import Optional
import uuid
from datetime import datetime, timezone

async def get_current_user_azure(azure_user: AzureUser) -> dict:
    """
    Extract and sync user from Azure AD token
    Returns user dict with MongoDB data
    """
    # Import db here to avoid circular dependency
    from server import db
    
    try:
        # Extract claims from Azure AD
        email = azure_user.claims.get("preferred_username") or azure_user.claims.get("email") or azure_user.claims.get("upn")
        name = azure_user.claims.get("name", email or "Unknown")
        oid = azure_user.claims.get("oid", "")
        
        if not email:
            raise HTTPException(status_code=401, detail="Email not found in token")
        
        # Find or create user in MongoDB
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            # Update OID if needed
            if existing_user.get("oid") != oid:
                await db.users.update_one(
                    {"id": existing_user["id"]},
                    {"$set": {"oid": oid, "name": name}}
                )
                existing_user["oid"] = oid
                existing_user["name"] = name
            
            return {
                "id": existing_user["id"],
                "email": existing_user["email"],
                "name": existing_user["name"],
                "role": existing_user.get("role", "user"),
                "oid": oid
            }
        else:
            # Create new user
            new_user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "role": "user",
                "oid": oid,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "password": ""
            }
            
            await db.users.insert_one(new_user)
            
            return {
                "id": new_user["id"],
                "email": new_user["email"],
                "name": new_user["name"],
                "role": "user",
                "oid": oid
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Failed to authenticate: {str(e)}"
        )

async def require_admin_azure(current_user: dict = Depends(get_current_user_azure)) -> dict:
    """Require admin role for Azure AD authenticated users"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user
