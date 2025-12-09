from fastapi import Depends, HTTPException, Header, Security, status
from fastapi_azure_auth.user import User as AzureUser
import jwt
from datetime import datetime, timezone

JWT_SECRET = "fallback_secret_key_2025"
JWT_ALGORITHM = "HS256"

async def get_current_user_unified(
    authorization: str = Header(None),
    azure_user: AzureUser = Security(lambda: None, scopes=[])
) -> dict:
    """
    Unified authentication: Accepts both Azure AD tokens and legacy JWT tokens
    """
    
    # Import here to avoid circular dependency
    from server import db
    import os
    import uuid
    
    # Try Azure AD first
    if azure_user and hasattr(azure_user, 'claims'):
        try:
            # Extract claims from Azure AD token
            email = azure_user.claims.get("preferred_username") or azure_user.claims.get("email") or azure_user.claims.get("upn")
            name = azure_user.claims.get("name", email)
            oid = azure_user.claims.get("oid", "")
            
            if not email:
                raise HTTPException(status_code=401, detail="Email not found in Azure AD token")
            
            # Check if user exists in MongoDB
            existing_user = await db.users.find_one({"email": email}, {"_id": 0})
            
            if existing_user:
                # Update last login
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
                    "role": new_user["role"],
                    "oid": oid
                }
        except Exception as e:
            # If Azure AD fails, try legacy JWT
            pass
    
    # Fallback to legacy JWT authentication
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        # Try to decode as JWT
        JWT_SECRET_ENV = os.environ.get('JWT_SECRET', JWT_SECRET)
        payload = jwt.decode(token, JWT_SECRET_ENV, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

async def require_admin_unified(current_user: dict = Depends(get_current_user_unified)) -> dict:
    """Require admin role - works with both Azure AD and legacy auth"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
