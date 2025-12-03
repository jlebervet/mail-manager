#!/usr/bin/env python3
"""Initialize the database with sample data"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent / 'backend'))

ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def init_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Initializing database with sample data...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.services.delete_many({})
    await db.correspondents.delete_many({})
    await db.mails.delete_many({})
    
    # Create users
    users = [
        {
            "id": "admin-001",
            "email": "admin@mairie.fr",
            "name": "Admin Principal",
            "password": "admin123",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "user-001",
            "email": "user@mairie.fr",
            "name": "Jean Dupont",
            "password": "user123",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "user-002",
            "email": "marie.martin@mairie.fr",
            "name": "Marie Martin",
            "password": "marie123",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "user-003",
            "email": "pierre.bernard@mairie.fr",
            "name": "Pierre Bernard",
            "password": "pierre123",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.users.insert_many(users)
    print(f"✓ Created {len(users)} users")
    
    # Create services with sub-services
    services = [
        {
            "id": "service-001",
            "name": "Services Techniques",
            "sub_services": [
                {"id": "sub-001", "name": "Urbanisme"},
                {"id": "sub-002", "name": "Voirie"},
                {"id": "sub-003", "name": "Espaces Verts"},
                {"id": "sub-004", "name": "SCHS"},
                {"id": "sub-005", "name": "CTM"}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "service-002",
            "name": "Affaires Administratives",
            "sub_services": [
                {"id": "sub-006", "name": "État Civil"},
                {"id": "sub-007", "name": "Élections"},
                {"id": "sub-008", "name": "Archives"}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "service-003",
            "name": "Finances",
            "sub_services": [
                {"id": "sub-009", "name": "Comptabilité"},
                {"id": "sub-010", "name": "Budget"}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "service-004",
            "name": "Action Sociale",
            "sub_services": [
                {"id": "sub-011", "name": "CCAS"},
                {"id": "sub-012", "name": "Petite Enfance"}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.services.insert_many(services)
    print(f"✓ Created {len(services)} services")
    
    # Create correspondents (fictitious)
    correspondents = [
        {
            "id": "corr-001",
            "name": "Sophie Lefebvre",
            "email": "sophie.lefebvre@entreprise.fr",
            "organization": "Entreprise BTP Construction",
            "phone": "+33 1 45 67 89 01",
            "address": "15 Rue de la Paix, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-002",
            "name": "Michel Dubois",
            "email": "michel.dubois@gmail.com",
            "organization": "Association des Riverains",
            "phone": "+33 6 12 34 56 78",
            "address": "23 Avenue Victor Hugo, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-003",
            "name": "Christine Moreau",
            "email": "christine.moreau@prefecture.gouv.fr",
            "organization": "Préfecture de Paris",
            "phone": "+33 1 23 45 67 89",
            "address": "1 Place de la Préfecture, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-004",
            "name": "Laurent Petit",
            "email": "laurent.petit@entreprise.com",
            "organization": "Cabinet d'Architectes Petit & Associés",
            "phone": "+33 1 98 76 54 32",
            "address": "45 Boulevard Haussmann, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-005",
            "name": "Isabelle Roux",
            "email": "isabelle.roux@yahoo.fr",
            "organization": None,
            "phone": "+33 6 87 65 43 21",
            "address": "78 Rue de la République, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-006",
            "name": "François Simon",
            "email": "francois.simon@conseil-regional.fr",
            "organization": "Conseil Régional d'Île-de-France",
            "phone": "+33 1 55 44 33 22",
            "address": "2 Rue Simone Veil, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-007",
            "name": "Nathalie Laurent",
            "email": "nathalie.laurent@hotmail.com",
            "organization": "Comité des Fêtes",
            "phone": "+33 6 11 22 33 44",
            "address": "12 Place du Marché, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-008",
            "name": "Thierry Blanc",
            "email": "thierry.blanc@notaire.fr",
            "organization": "Étude Notariale Blanc",
            "phone": "+33 1 77 88 99 00",
            "address": "8 Rue du Notariat, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-009",
            "name": "Valérie Garnier",
            "email": "valerie.garnier@education.gouv.fr",
            "organization": "Inspection Académique",
            "phone": "+33 1 44 55 66 77",
            "address": "30 Rue de l'Éducation, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "corr-010",
            "name": "Olivier Vincent",
            "email": "olivier.vincent@orange.fr",
            "organization": "Club Sportif Municipal",
            "phone": "+33 6 99 88 77 66",
            "address": "50 Avenue du Sport, 75000 Paris",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.correspondents.insert_many(correspondents)
    print(f"✓ Created {len(correspondents)} correspondents")
    
    # Create sample mails
    mails = [
        {
            "id": "mail-001",
            "type": "entrant",
            "reference": "MAIL-2025-00001",
            "subject": "Demande de permis de construire",
            "content": "Je souhaite déposer une demande de permis de construire pour un projet d'extension de ma maison située au 15 Rue de la Paix.",
            "correspondent_id": "corr-001",
            "correspondent_name": "Sophie Lefebvre",
            "service_id": "service-001",
            "service_name": "Services Techniques",
            "sub_service_id": "sub-001",
            "sub_service_name": "Urbanisme",
            "assigned_to_id": None,
            "assigned_to_name": None,
            "status": "recu",
            "workflow": [
                {
                    "status": "recu",
                    "user_id": "admin-001",
                    "user_name": "Admin Principal",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "comment": None
                }
            ],
            "attachments": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "opened_by_id": None,
            "opened_by_name": None,
            "opened_at": None
        },
        {
            "id": "mail-002",
            "type": "entrant",
            "reference": "MAIL-2025-00002",
            "subject": "Réclamation concernant l'état de la voirie",
            "content": "Je tiens à signaler le mauvais état de la chaussée sur l'Avenue Victor Hugo. Plusieurs nids-de-poule rendent la circulation dangereuse.",
            "correspondent_id": "corr-002",
            "correspondent_name": "Michel Dubois",
            "service_id": "service-001",
            "service_name": "Services Techniques",
            "sub_service_id": "sub-002",
            "sub_service_name": "Voirie",
            "assigned_to_id": None,
            "assigned_to_name": None,
            "status": "recu",
            "workflow": [
                {
                    "status": "recu",
                    "user_id": "admin-001",
                    "user_name": "Admin Principal",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "comment": None
                }
            ],
            "attachments": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "opened_by_id": None,
            "opened_by_name": None,
            "opened_at": None
        },
        {
            "id": "mail-003",
            "type": "sortant",
            "reference": "MAIL-2025-00003",
            "subject": "Réponse à la demande d'autorisation d'occupation du domaine public",
            "content": "Suite à votre demande du 15 janvier, nous avons le plaisir de vous informer que l'autorisation vous est accordée.",
            "correspondent_id": "corr-004",
            "correspondent_name": "Laurent Petit",
            "service_id": "service-001",
            "service_name": "Services Techniques",
            "sub_service_id": "sub-001",
            "sub_service_name": "Urbanisme",
            "assigned_to_id": "user-001",
            "assigned_to_name": "Jean Dupont",
            "status": "traite",
            "workflow": [
                {
                    "status": "recu",
                    "user_id": "user-001",
                    "user_name": "Jean Dupont",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "comment": None
                },
                {
                    "status": "traite",
                    "user_id": "user-001",
                    "user_name": "Jean Dupont",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "comment": "Autorisation envoyée"
                }
            ],
            "attachments": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "opened_by_id": "user-001",
            "opened_by_name": "Jean Dupont",
            "opened_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.mails.insert_many(mails)
    print(f"✓ Created {len(mails)} mails")
    
    print("\n✅ Database initialization completed successfully!")
    print("\nTest accounts:")
    print("  Admin: admin@mairie.fr / admin123")
    print("  User: user@mairie.fr / user123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
