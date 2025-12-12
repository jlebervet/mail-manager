"""
Dépendances d'authentification Azure AD pour FastAPI
Gère la validation des tokens et la création automatique des utilisateurs
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi_azure_auth import SingleTenantAzureAuthorizationCodeBearer
from fastapi_azure_auth.user import User as AzureUser
from motor.motor_asyncio import AsyncIOMotorDatabase
from azure_config import settings
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Schéma de sécurité HTTP Bearer
security = HTTPBearer()

# Configuration Azure AD
azure_scheme = SingleTenantAzureAuthorizationCodeBearer(
    app_client_id=settings.AZURE_CLIENT_ID,
    tenant_id=settings.AZURE_TENANT_ID,
    scopes={
        settings.AZURE_SCOPE: "Accès à l'API en tant qu'utilisateur",
    },
    allow_guest_users=False,
)

async def get_or_create_user_from_azure(azure_user: AzureUser, db: AsyncIOMotorDatabase) -> dict:
    """
    Récupère ou crée un utilisateur basé sur les informations Azure AD
    
    Args:
        azure_user: Objet utilisateur Azure AD
        db: Instance de base de données MongoDB
    
    Returns:
        dict: Informations utilisateur (id, email, name, role, etc.)
    """
    try:
        # Extraire les informations de l'utilisateur Azure AD
        azure_id = azure_user.oid  # Object ID Azure AD
        email = azure_user.preferred_username or azure_user.email
        name = azure_user.name or email.split('@')[0]
        
        logger.info(f"Tentative de connexion pour: {email} (Azure ID: {azure_id})")
        
        # Chercher l'utilisateur existant par Azure ID
        existing_user = await db.users.find_one({"azure_id": azure_id}, {"_id": 0})
        
        if existing_user:
            # Mettre à jour la dernière connexion
            await db.users.update_one(
                {"azure_id": azure_id},
                {
                    "$set": {
                        "last_login": datetime.now(timezone.utc).isoformat(),
                        "email": email,  # Mettre à jour l'email si changé
                        "name": name,  # Mettre à jour le nom si changé
                    }
                }
            )
            
            logger.info(f"Utilisateur existant connecté: {email}")
            return existing_user
        
        # Créer un nouvel utilisateur
        # Le premier utilisateur devient admin, les suivants sont users
        user_count = await db.users.count_documents({})
        is_first_user = user_count == 0
        
        new_user = {
            "id": azure_id,  # Utiliser l'Azure ID comme ID principal
            "azure_id": azure_id,
            "email": email,
            "name": name,
            "role": "admin" if is_first_user else "user",
            "service_id": None,
            "sub_service_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat(),
            "password": None,  # Pas de mot de passe pour les utilisateurs Azure AD
        }
        
        await db.users.insert_one(new_user)
        
        logger.info(f"Nouvel utilisateur créé: {email} (role: {new_user['role']})")
        
        if is_first_user:
            logger.warning(f"Premier utilisateur créé avec rôle ADMIN: {email}")
        
        # Retourner sans le champ _id de MongoDB
        return {k: v for k, v in new_user.items() if k != "_id"}
        
    except Exception as e:
        logger.error(f"Erreur lors de la création/récupération de l'utilisateur: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la gestion de l'utilisateur: {str(e)}"
        )

async def get_current_user_azure(azure_user: AzureUser = Depends(azure_scheme)) -> dict:
    """
    Dépendance FastAPI pour obtenir l'utilisateur courant depuis Azure AD
    Crée automatiquement l'utilisateur s'il n'existe pas
    """
    # Cette fonction sera appelée avec la base de données injectée
    # Pour l'instant, elle retourne les informations basiques
    return {
        "sub": azure_user.oid,
        "email": azure_user.preferred_username or azure_user.email,
        "name": azure_user.name,
    }

async def require_admin_azure(current_user: dict) -> dict:
    """
    Vérifie que l'utilisateur a le rôle admin
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès admin requis"
        )
    return current_user
