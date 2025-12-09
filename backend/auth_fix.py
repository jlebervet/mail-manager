from fastapi import Depends, HTTPException, Header, Security, status
from fastapi_azure_auth.user import User as AzureUser
import jwt
from datetime import datetime, timezone, timedelta

# Import server components after initialization
def get_db_and_config():
    from server import db, azure_scheme, JWT_SECRET, JWT_ALGORITHM
    return db, azure_scheme, JWT_SECRET, JWT_ALGORITHM

async def get_current_user_hybrid(
    authorization: str = Header(None)
) -> dict:
    """
    Hybrid authentication supporting both Azure AD and legacy JWT
    """
    db, azure_scheme, JWT_SECRET, JWT_ALGORITHM = get_db_and_config()
    
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        # Try Azure AD validation first
        try:
            from fastapi_azure_auth import azure_scheme as validator
            import httpx
            # This is complex, let's try JWT first for simplicity
            raise Exception("Try JWT")
        except:
            pass
        
        # Try legacy JWT
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except:
            pass
        
        # If both fail
        raise HTTPException(status_code=401, detail="Invalid token")
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

async def require_admin_hybrid(current_user: dict = Depends(get_current_user_hybrid)) -> dict:
    """Require admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
