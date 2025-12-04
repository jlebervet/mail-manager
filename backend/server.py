from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Header, Security
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import base64
from fastapi_azure_auth import SingleTenantAzureAuthorizationCodeBearer
from azure_config import settings

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(
    swagger_ui_oauth2_redirect_url="/oauth2-redirect",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
        "clientId": settings.AZURE_CLIENT_ID,
    },
)
api_router = APIRouter(prefix="/api")

# Azure AD Authentication Configuration
azure_scheme = SingleTenantAzureAuthorizationCodeBearer(
    app_client_id=settings.AZURE_CLIENT_ID,
    tenant_id=settings.AZURE_TENANT_ID,
    scopes={
        settings.AZURE_SCOPE: settings.SCOPE_DESCRIPTION,
    },
    allow_guest_users=False,
)

# ===== MODELS =====

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password: str  # In production, this would be hashed
    role: str = "user"  # "user" or "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "user"

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

class SubService(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    sub_services: List[SubService] = []
    archived: bool = False
    archived_at: Optional[datetime] = None
    archived_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    sub_services: List[SubService] = []

class Correspondent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CorrespondentCreate(BaseModel):
    name: str
    email: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Attachment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    content_type: str
    size: int
    data: str  # Base64 encoded

class WorkflowStep(BaseModel):
    status: str  # "recu", "traitement", "traite", "archive"
    user_id: str
    user_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    comment: Optional[str] = None

class Mail(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "entrant" or "sortant"
    reference: str  # Auto-generated reference number
    subject: str
    content: str
    correspondent_id: str
    correspondent_name: str
    service_id: str
    service_name: str
    sub_service_id: Optional[str] = None
    sub_service_name: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    status: str = "recu"  # "recu", "traitement", "traite", "archive"
    workflow: List[WorkflowStep] = []
    attachments: List[Attachment] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    opened_by_id: Optional[str] = None
    opened_by_name: Optional[str] = None
    opened_at: Optional[datetime] = None
    parent_mail_id: Optional[str] = None  # For replies
    parent_mail_reference: Optional[str] = None
    related_mails: List[dict] = []  # List of related mails (responses)
    # New fields
    message_type: str = "courrier"  # "courrier", "email", "depot_main_propre", "colis"
    is_registered: bool = False  # Recommandé
    registered_number: Optional[str] = None  # Numéro de recommandé ou code-barres

class MailCreate(BaseModel):
    type: str
    subject: str
    content: str
    correspondent_id: str
    correspondent_name: str
    service_id: str
    service_name: str
    sub_service_id: Optional[str] = None
    sub_service_name: Optional[str] = None
    parent_mail_id: Optional[str] = None
    parent_mail_reference: Optional[str] = None
    message_type: str = "courrier"
    is_registered: bool = False
    registered_number: Optional[str] = None

class MailUpdate(BaseModel):
    subject: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    comment: Optional[str] = None

# ===== AUTH HELPERS =====

def create_token(user_data: dict) -> str:
    """Create a mocked Azure AD JWT token"""
    payload = {
        "sub": user_data["id"],
        "email": user_data["email"],
        "name": user_data["name"],
        "role": user_data["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify mocked Azure AD token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)) -> dict:
    """Dependency to get current user from token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        user_data = verify_token(token)
        return user_data
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

async def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ===== AUTH ROUTES =====

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """Mocked Azure AD login"""
    # Find user in database
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password (in production, use proper hashing)
    if user_doc["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert datetime strings back
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    # Create token
    token = create_token(user_doc)
    
    # Return token and user info (without password)
    user_info = {k: v for k, v in user_doc.items() if k != "password"}
    
    return LoginResponse(token=token, user=user_info)

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@api_router.post("/auth/register", response_model=User)
async def register(user_create: UserCreate, admin_user: dict = Depends(require_admin)):
    """Register a new user (admin only)"""
    # Check if user already exists
    existing = await db.users.find_one({"email": user_create.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = User(**user_create.model_dump())
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user

# ===== SERVICES ROUTES =====

@api_router.get("/services", response_model=List[Service])
async def get_services(
    include_archived: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get all services (exclude archived by default)"""
    query = {} if include_archived else {"archived": {"$ne": True}}
    services = await db.services.find(query, {"_id": 0}).to_list(1000)
    
    for service in services:
        if isinstance(service.get('created_at'), str):
            service['created_at'] = datetime.fromisoformat(service['created_at'])
        if isinstance(service.get('archived_at'), str):
            service['archived_at'] = datetime.fromisoformat(service['archived_at'])
    
    return services

@api_router.post("/services", response_model=Service)
async def create_service(service_create: ServiceCreate, admin_user: dict = Depends(require_admin)):
    """Create a new service (admin only)"""
    service = Service(**service_create.model_dump())
    doc = service.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.services.insert_one(doc)
    return service

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_update: ServiceCreate, admin_user: dict = Depends(require_admin)):
    """Update a service (admin only)"""
    service = Service(id=service_id, **service_update.model_dump())
    doc = service.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    result = await db.services.replace_one({"id": service_id}, doc)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return service

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, admin_user: dict = Depends(require_admin)):
    """Archive a service (admin only) - soft delete"""
    # Check if service has associated mails
    mails_count = await db.mails.count_documents({"service_id": service_id})
    
    # Update service to archived status
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": {
            "archived": True,
            "archived_at": datetime.now(timezone.utc).isoformat(),
            "archived_by": admin_user['name']
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Archive all mails associated with this service
    if mails_count > 0:
        await db.mails.update_many(
            {"service_id": service_id, "status": {"$ne": "archive"}},
            {"$set": {"status": "archive"}}
        )
    
    return {
        "message": "Service archived", 
        "archived_mails": mails_count,
        "can_restore": True
    }

@api_router.post("/services/{service_id}/restore")
async def restore_service(service_id: str, admin_user: dict = Depends(require_admin)):
    """Restore an archived service (admin only)"""
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": {
            "archived": False,
            "archived_at": None,
            "archived_by": None
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service restored"}

# ===== CORRESPONDENTS ROUTES =====

@api_router.get("/correspondents", response_model=List[Correspondent])
async def get_correspondents(search: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all correspondents with optional search"""
    query = {}
    if search:
        # Search by name, email, or organization (case-insensitive)
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"organization": {"$regex": search, "$options": "i"}}
            ]
        }
    
    correspondents = await db.correspondents.find(query, {"_id": 0}).to_list(1000)
    
    for corr in correspondents:
        if isinstance(corr.get('created_at'), str):
            corr['created_at'] = datetime.fromisoformat(corr['created_at'])
    
    return correspondents

@api_router.post("/correspondents", response_model=Correspondent)
async def create_correspondent(correspondent_create: CorrespondentCreate, current_user: dict = Depends(get_current_user)):
    """Create a new correspondent"""
    correspondent = Correspondent(**correspondent_create.model_dump())
    doc = correspondent.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.correspondents.insert_one(doc)
    return correspondent

@api_router.put("/correspondents/{correspondent_id}", response_model=Correspondent)
async def update_correspondent(correspondent_id: str, correspondent_update: CorrespondentCreate, current_user: dict = Depends(get_current_user)):
    """Update a correspondent"""
    correspondent = Correspondent(id=correspondent_id, **correspondent_update.model_dump())
    doc = correspondent.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    result = await db.correspondents.replace_one({"id": correspondent_id}, doc)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Correspondent not found")
    
    return correspondent

@api_router.delete("/correspondents/{correspondent_id}")
async def delete_correspondent(correspondent_id: str, admin_user: dict = Depends(require_admin)):
    """Delete a correspondent (admin only)"""
    result = await db.correspondents.delete_one({"id": correspondent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Correspondent not found")
    return {"message": "Correspondent deleted"}

# ===== MAILS ROUTES =====

@api_router.get("/mails", response_model=List[Mail])
async def get_mails(
    type: Optional[str] = None,
    status: Optional[str] = None,
    service_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all mails with optional filters"""
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    if service_id:
        query["service_id"] = service_id
    
    mails = await db.mails.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for mail in mails:
        if isinstance(mail.get('created_at'), str):
            mail['created_at'] = datetime.fromisoformat(mail['created_at'])
        if isinstance(mail.get('opened_at'), str):
            mail['opened_at'] = datetime.fromisoformat(mail['opened_at'])
        # Convert workflow timestamps
        for step in mail.get('workflow', []):
            if isinstance(step.get('timestamp'), str):
                step['timestamp'] = datetime.fromisoformat(step['timestamp'])
    
    return mails

@api_router.get("/mails/{mail_id}", response_model=Mail)
async def get_mail(mail_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific mail and mark as opened"""
    mail_doc = await db.mails.find_one({"id": mail_id}, {"_id": 0})
    
    if not mail_doc:
        raise HTTPException(status_code=404, detail="Mail not found")
    
    # Convert datetime strings
    if isinstance(mail_doc.get('created_at'), str):
        mail_doc['created_at'] = datetime.fromisoformat(mail_doc['created_at'])
    if isinstance(mail_doc.get('opened_at'), str):
        mail_doc['opened_at'] = datetime.fromisoformat(mail_doc['opened_at'])
    for step in mail_doc.get('workflow', []):
        if isinstance(step.get('timestamp'), str):
            step['timestamp'] = datetime.fromisoformat(step['timestamp'])
    
    # Auto-assign to user who opens it first
    if not mail_doc.get('opened_by_id'):
        mail_doc['opened_by_id'] = current_user['sub']
        mail_doc['opened_by_name'] = current_user['name']
        mail_doc['opened_at'] = datetime.now(timezone.utc).isoformat()
        mail_doc['assigned_to_id'] = current_user['sub']
        mail_doc['assigned_to_name'] = current_user['name']
        
        # Update in database
        await db.mails.update_one(
            {"id": mail_id},
            {"$set": {
                "opened_by_id": mail_doc['opened_by_id'],
                "opened_by_name": mail_doc['opened_by_name'],
                "opened_at": mail_doc['opened_at'],
                "assigned_to_id": mail_doc['assigned_to_id'],
                "assigned_to_name": mail_doc['assigned_to_name']
            }}
        )
    
    # Get related mails (responses and parent)
    related_mails = []
    
    # Get child mails (responses to this mail)
    child_mails = await db.mails.find(
        {"parent_mail_id": mail_id}, 
        {"_id": 0, "id": 1, "reference": 1, "type": 1, "subject": 1, "created_at": 1, "status": 1}
    ).to_list(100)
    
    for child in child_mails:
        if isinstance(child.get('created_at'), str):
            child['created_at'] = datetime.fromisoformat(child['created_at'])
        related_mails.append(child)
    
    # Get parent mail if this is a response
    if mail_doc.get('parent_mail_id'):
        parent_mail = await db.mails.find_one(
            {"id": mail_doc['parent_mail_id']},
            {"_id": 0, "id": 1, "reference": 1, "type": 1, "subject": 1, "created_at": 1, "status": 1}
        )
        if parent_mail:
            if isinstance(parent_mail.get('created_at'), str):
                parent_mail['created_at'] = datetime.fromisoformat(parent_mail['created_at'])
            related_mails.insert(0, parent_mail)
    
    mail_doc['related_mails'] = related_mails
    
    return Mail(**mail_doc)

@api_router.post("/mails", response_model=Mail)
async def create_mail(mail_create: MailCreate, current_user: dict = Depends(get_current_user)):
    """Create a new mail"""
    # Generate reference number
    count = await db.mails.count_documents({})
    reference = f"MAIL-{datetime.now(timezone.utc).year}-{count + 1:05d}"
    
    mail = Mail(
        **mail_create.model_dump(),
        reference=reference,
        workflow=[
            WorkflowStep(
                status="recu",
                user_id=current_user['sub'],
                user_name=current_user['name']
            )
        ]
    )
    
    doc = mail.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    # Convert workflow timestamps
    for step in doc['workflow']:
        step['timestamp'] = step['timestamp'].isoformat()
    
    await db.mails.insert_one(doc)
    
    # If this is a reply to another mail, update the parent mail's related_mails
    if mail_create.parent_mail_id:
        await db.mails.update_one(
            {"id": mail_create.parent_mail_id},
            {"$push": {"related_mails": {
                "id": mail.id,
                "reference": mail.reference,
                "type": mail.type,
                "subject": mail.subject,
                "created_at": doc['created_at'],
                "status": mail.status
            }}}
        )
    
    return mail

@api_router.put("/mails/{mail_id}", response_model=Mail)
async def update_mail(mail_id: str, mail_update: MailUpdate, current_user: dict = Depends(get_current_user)):
    """Update a mail"""
    mail_doc = await db.mails.find_one({"id": mail_id}, {"_id": 0})
    
    if not mail_doc:
        raise HTTPException(status_code=404, detail="Mail not found")
    
    # Convert datetime strings
    if isinstance(mail_doc.get('created_at'), str):
        mail_doc['created_at'] = datetime.fromisoformat(mail_doc['created_at'])
    if isinstance(mail_doc.get('opened_at'), str):
        mail_doc['opened_at'] = datetime.fromisoformat(mail_doc['opened_at'])
    for step in mail_doc.get('workflow', []):
        if isinstance(step.get('timestamp'), str):
            step['timestamp'] = datetime.fromisoformat(step['timestamp'])
    
    # Update fields
    update_data = mail_update.model_dump(exclude_unset=True)
    
    # If status changed, add workflow step
    if "status" in update_data and update_data["status"] != mail_doc["status"]:
        workflow_step = WorkflowStep(
            status=update_data["status"],
            user_id=current_user['sub'],
            user_name=current_user['name'],
            comment=update_data.get("comment")
        )
        mail_doc['workflow'].append(workflow_step.model_dump())
        mail_doc['workflow'][-1]['timestamp'] = mail_doc['workflow'][-1]['timestamp'].isoformat()
    
    # Remove comment from update_data as it's only for workflow
    update_data.pop("comment", None)
    
    # Update mail document
    for key, value in update_data.items():
        mail_doc[key] = value
    
    # Prepare for MongoDB
    doc = mail_doc.copy()
    if isinstance(doc['created_at'], datetime):
        doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('opened_at') and isinstance(doc['opened_at'], datetime):
        doc['opened_at'] = doc['opened_at'].isoformat()
    
    await db.mails.replace_one({"id": mail_id}, doc)
    
    return Mail(**mail_doc)

@api_router.post("/mails/{mail_id}/attachments")
async def add_attachment(mail_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Add attachment to a mail"""
    # Read file content
    content = await file.read()
    
    # Create attachment
    attachment = Attachment(
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size=len(content),
        data=base64.b64encode(content).decode('utf-8')
    )
    
    # Add to mail
    result = await db.mails.update_one(
        {"id": mail_id},
        {"$push": {"attachments": attachment.model_dump()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mail not found")
    
    return attachment

@api_router.delete("/mails/{mail_id}")
async def delete_mail(mail_id: str, admin_user: dict = Depends(require_admin)):
    """Delete a mail (admin only)"""
    result = await db.mails.delete_one({"id": mail_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mail not found")
    return {"message": "Mail deleted"}

# ===== USERS ROUTES (Admin) =====

@api_router.get("/users", response_model=List[User])
async def get_users(admin_user: dict = Depends(require_admin)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

@api_router.put("/users/{user_id}")
async def update_user_role(user_id: str, role: str, admin_user: dict = Depends(require_admin)):
    """Update user role (admin only)"""
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User role updated"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin_user: dict = Depends(require_admin)):
    """Delete a user (admin only)"""
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ===== STATS ROUTES =====

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    total_mails = await db.mails.count_documents({})
    entrant_mails = await db.mails.count_documents({"type": "entrant"})
    sortant_mails = await db.mails.count_documents({"type": "sortant"})
    
    status_counts = {}
    for status in ["recu", "traitement", "traite", "archive"]:
        status_counts[status] = await db.mails.count_documents({"status": status})
    
    assigned_to_me = await db.mails.count_documents({"assigned_to_id": current_user['sub']})
    
    return {
        "total_mails": total_mails,
        "entrant_mails": entrant_mails,
        "sortant_mails": sortant_mails,
        "status_counts": status_counts,
        "assigned_to_me": assigned_to_me
    }

# ===== IMPORT ROUTES =====

class ImportStats(BaseModel):
    correspondents_created: int
    correspondents_updated: int
    mails_created: int
    errors: List[str]

@api_router.post("/import/csv", response_model=ImportStats)
async def import_csv(
    file: UploadFile = File(...),
    admin_user: dict = Depends(require_admin)
):
    """Import correspondents and mails from CSV (admin only)"""
    import csv
    import io
    
    stats = {
        "correspondents_created": 0,
        "correspondents_updated": 0,
        "mails_created": 0,
        "errors": []
    }
    
    try:
        # Read CSV file
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        # Get default service for imported mails
        default_service = await db.services.find_one({}, {"_id": 0})
        if not default_service:
            raise HTTPException(status_code=400, detail="Aucun service disponible. Créez au moins un service avant d'importer.")
        
        row_number = 0
        for row in csv_reader:
            row_number += 1
            try:
                # Extract correspondent data
                nom = row.get('nom', '').strip()
                prenom = row.get('prenom', '').strip()
                tel_fixe = row.get('telephone_fixe', '').strip()
                tel_mobile = row.get('telephone_mobile', '').strip()
                email = row.get('adresse_mail', '').strip()
                adresse = row.get('adresse_postale', '').strip()
                
                # Extract message data
                titre = row.get('titre_message', '').strip()
                type_msg = row.get('type', 'entrant').strip().lower()
                statut = row.get('statut', 'en_cours').strip().lower()
                
                # Validate required fields
                if not nom or not titre:
                    stats["errors"].append(f"Ligne {row_number}: nom et titre_message sont requis")
                    continue
                
                # Create full name
                full_name = f"{prenom} {nom}".strip() if prenom else nom
                
                # Check if correspondent exists
                correspondent = await db.correspondents.find_one(
                    {"name": full_name},
                    {"_id": 0}
                )
                
                if correspondent:
                    # Update existing correspondent
                    update_data = {}
                    if email and not correspondent.get('email'):
                        update_data['email'] = email
                    if tel_fixe or tel_mobile:
                        phone = tel_mobile if tel_mobile else tel_fixe
                        if not correspondent.get('phone'):
                            update_data['phone'] = phone
                    if adresse and not correspondent.get('address'):
                        update_data['address'] = adresse
                    
                    if update_data:
                        await db.correspondents.update_one(
                            {"id": correspondent["id"]},
                            {"$set": update_data}
                        )
                        stats["correspondents_updated"] += 1
                    
                    correspondent_id = correspondent["id"]
                else:
                    # Create new correspondent
                    phone = tel_mobile if tel_mobile else tel_fixe
                    correspondent_data = Correspondent(
                        name=full_name,
                        email=email if email else None,
                        phone=phone if phone else None,
                        address=adresse if adresse else None,
                        organization=None
                    )
                    
                    doc = correspondent_data.model_dump()
                    doc['created_at'] = doc['created_at'].isoformat()
                    await db.correspondents.insert_one(doc)
                    
                    correspondent_id = correspondent_data.id
                    stats["correspondents_created"] += 1
                
                # Determine status
                if statut in ['archivé', 'archive', 'archivés']:
                    mail_status = 'archive'
                elif statut in ['en_cours', 'en cours', 'recu', 'reçu']:
                    mail_status = 'recu'
                else:
                    mail_status = 'recu'
                
                # Determine type
                if type_msg in ['sortant', 'envoyé', 'envoye', 'out']:
                    mail_type = 'sortant'
                else:
                    mail_type = 'entrant'
                
                # Generate reference
                count = await db.mails.count_documents({})
                reference = f"MAIL-{datetime.now(timezone.utc).year}-{count + 1:05d}"
                
                # Create mail
                mail = Mail(
                    type=mail_type,
                    reference=reference,
                    subject=titre,
                    content=f"Message importé depuis CSV\n\nTitre: {titre}",
                    correspondent_id=correspondent_id,
                    correspondent_name=full_name,
                    service_id=default_service['id'],
                    service_name=default_service['name'],
                    status=mail_status,
                    workflow=[
                        WorkflowStep(
                            status=mail_status,
                            user_id=admin_user['sub'],
                            user_name=admin_user['name'],
                            comment="Import CSV"
                        )
                    ],
                    message_type="courrier",
                    is_registered=False
                )
                
                doc = mail.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                for step in doc['workflow']:
                    step['timestamp'] = step['timestamp'].isoformat()
                
                await db.mails.insert_one(doc)
                stats["mails_created"] += 1
                
            except Exception as e:
                stats["errors"].append(f"Ligne {row_number}: {str(e)}")
                continue
        
        return ImportStats(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors du traitement du fichier: {str(e)}")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def load_azure_config():
    """Load Azure AD OpenID configuration on startup"""
    await azure_scheme.openid_config.load_config()
    logger.info("Azure AD configuration loaded successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
