import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

async def init_database():
    """Initialize database with default data"""
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ.get('DB_NAME', 'mail_management_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Créer les services par défaut
    services_data = [
        {
            "id": "service-1",
            "name": "Services Techniques",
            "sub_services": [
                {"id": "sub-1-1", "name": "Urbanisme"},
                {"id": "sub-1-2", "name": "Voirie"},
                {"id": "sub-1-3", "name": "Espaces Verts"}
            ],
            "archived": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "service-2",
            "name": "État Civil",
            "sub_services": [],
            "archived": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "service-3",
            "name": "Finances",
            "sub_services": [
                {"id": "sub-3-1", "name": "Comptabilité"},
                {"id": "sub-3-2", "name": "Budget"}
            ],
            "archived": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "service-4",
            "name": "Ressources Humaines",
            "sub_services": [],
            "archived": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "service-5",
            "name": "Communication",
            "sub_services": [],
            "archived": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Vérifier si les services existent déjà
    existing_services = await db.services.count_documents({})
    if existing_services == 0:
        await db.services.insert_many(services_data)
        print(f"✅ Services créés : {len(services_data)}")
    else:
        print(f"ℹ️  Services déjà existants : {existing_services}")
    
    # Créer des correspondants par défaut
    correspondents_data = [
        {
            "id": "corr-1",
            "name": "Michel Dubois",
            "email": "michel.dubois@example.com",
            "phone": "0123456789",
            "address": "12 Rue de la République, 95880 Enghien-les-Bains",
            "organization": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-2",
            "name": "Sophie Lefebvre",
            "email": "sophie.lefebvre@example.com",
            "phone": "0145678901",
            "address": "45 Avenue de la Liberté, 95880 Enghien-les-Bains",
            "organization": "Association Locale",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-3",
            "name": "Marie Martin",
            "email": "marie.martin@example.com",
            "phone": "0167890123",
            "address": "8 Place du Marché, 95880 Enghien-les-Bains",
            "organization": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    existing_correspondents = await db.correspondents.count_documents({})
    if existing_correspondents == 0:
        await db.correspondents.insert_many(correspondents_data)
        print(f"✅ Correspondants créés : {len(correspondents_data)}")
    else:
        print(f"ℹ️  Correspondants déjà existants : {existing_correspondents}")
    
    print("\n✅ Initialisation terminée !")
    print(f"Base de données : {db_name}")
    print(f"Services : {await db.services.count_documents({})}")
    print(f"Correspondants : {await db.correspondents.count_documents({})}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
