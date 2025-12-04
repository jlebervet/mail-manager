import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def set_first_admin():
    """Set JLeBervet as the first admin"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Find user by name or email containing "JLeBervet"
    user = await db.users.find_one({
        "$or": [
            {"name": {"$regex": "JLeBervet", "$options": "i"}},
            {"email": {"$regex": "JLeBervet", "$options": "i"}}
        ]
    })
    
    if user:
        # Update role to admin
        result = await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"role": "admin"}}
        )
        print(f"✅ User '{user['name']}' ({user['email']}) is now an admin!")
        print(f"   Updated: {result.modified_count} document(s)")
    else:
        print("⚠️  User 'JLeBervet' not found in database.")
        print("   Please log in once with Microsoft to create the user account,")
        print("   then run this script again.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(set_first_admin())
