"""
Script de migration : Lier un compte Azure AD à un utilisateur existant
Usage: python link_azure_account.py <email> <azure_oid>
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
from datetime import datetime, timezone

async def link_azure_account():
    """Lier un compte Azure AD à un utilisateur existant"""
    
    if len(sys.argv) < 3:
        print("Usage: python link_azure_account.py <email> <azure_oid>")
        print("\nExemple:")
        print("  python link_azure_account.py admin@mairie.fr abc123-def456-...")
        print("\nUtilisateurs actuels:")
        
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["test_database"]
        users = await db.users.find({}, {"email": 1, "name": 1, "role": 1, "azure_id": 1, "_id": 0}).to_list(100)
        for u in users:
            azure_status = "✅ Lié" if u.get('azure_id') else "❌ Non lié"
            print(f"  {u['email']} ({u['name']}) - Role: {u['role']} - Azure: {azure_status}")
        client.close()
        return
    
    email = sys.argv[1]
    azure_oid = sys.argv[2]
    
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Vérifier si l'utilisateur existe
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"❌ Utilisateur {email} non trouvé")
        client.close()
        return
    
    # Vérifier si l'Azure ID est déjà utilisé
    existing_azure = await db.users.find_one({"azure_id": azure_oid})
    if existing_azure and existing_azure['email'] != email:
        print(f"❌ Cet Azure ID est déjà lié à {existing_azure['email']}")
        client.close()
        return
    
    # Lier le compte Azure AD
    result = await db.users.update_one(
        {"email": email},
        {
            "$set": {
                "azure_id": azure_oid,
                "id": azure_oid,  # Utiliser l'Azure ID comme ID principal
                "last_login": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count > 0:
        print(f"✅ Compte Azure AD lié avec succès !")
        updated_user = await db.users.find_one({"email": email}, {"_id": 0})
        print(f"\nInformations mises à jour:")
        print(f"  Email: {updated_user['email']}")
        print(f"  Nom: {updated_user['name']}")
        print(f"  Role: {updated_user['role']}")
        print(f"  Azure ID: {updated_user['azure_id']}")
        print(f"\nVous pouvez maintenant vous connecter avec Microsoft et conserver votre rôle et vos données.")
    else:
        print(f"❌ Erreur lors de la liaison")
    
    client.close()

asyncio.run(link_azure_account())
