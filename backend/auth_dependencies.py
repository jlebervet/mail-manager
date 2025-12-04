from fastapi import Depends, HTTPException, status
from fastapi_azure_auth.user import User as AzureUser
from motor.motor_asyncio import AsyncIOMotorClient
import os

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def get_or_create_user_from_azure(azure_user: AzureUser) -> dict:
    """
    Get or create user from Azure AD claims and sync with MongoDB
    """
    try:
        # Extract claims from Azure AD token
        email = azure_user.claims.get("preferred_username") or azure_user.claims.get("email") or azure_user.claims.get("upn")
        name = azure_user.claims.get("name", email)
        oid = azure_user.claims.get("oid", "")  # Azure AD Object ID
        
        if not email:
            raise HTTPException(
                status_code=401,
                detail="Email not found in Azure AD token"
            )
        
        # Check if user exists in MongoDB
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            # Update last login and Azure AD OID if needed
            if "oid" not in existing_user or existing_user.get("oid") != oid:
                await db.users.update_one(
                    {"email": email},
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
            # Create new user in MongoDB
            from datetime import datetime, timezone
            import uuid
            
            new_user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "name": name,
                "role": "user",  # Default role, can be changed by admin
                "oid": oid,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "password": ""  # No password for Azure AD users
            }
            
            await db.users.insert_one(new_user)
            
            return {
                "id": new_user["id"],
                "email": new_user["email"],
                "name": new_user["name"],
                "role": new_user["role"],
                "oid": oid
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Failed to authenticate user: {str(e)}"
        )

async def get_current_user_azure(azure_user: AzureUser = Depends()) -> dict:
    """
    Dependency to get current authenticated user from Azure AD
    """
    return await get_or_create_user_from_azure(azure_user)

async def require_admin(current_user: dict = Depends(get_current_user_azure)) -> dict:
    """
    Dependency to require admin role
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
