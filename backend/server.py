from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import hashlib
import re
import math
from collections import Counter
import aiohttp
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'securevision_secret')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str = "user"
    preferred_language: str = "en"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: User

class URLScanRequest(BaseModel):
    url: str

class IPScanRequest(BaseModel):
    ip_address: str

class ScanResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    scan_type: str
    target: str
    risk_level: str
    risk_score: float
    confidence: float
    explanation: str
    details: dict = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DashboardStats(BaseModel):
    total_scans: int
    safe_count: int
    suspicious_count: int
    malicious_count: int
    recent_scans: List[ScanResult]

class AdminStats(BaseModel):
    total_users: int
    total_scans: int
    scans_today: int
    threat_distribution: dict
    user_list: List[User]

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_jwt(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_data:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user_data)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_url_entropy(url: str) -> float:
    if not url:
        return 0.0
    counter = Counter(url)
    length = len(url)
    entropy = -sum((count/length) * math.log2(count/length) for count in counter.values())
    return entropy

def extract_url_features(url: str) -> dict:
    features = {
        "length": len(url),
        "has_https": url.startswith("https://"),
        "has_ip": bool(re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url)),
        "subdomain_count": url.count('.'),
        "entropy": calculate_url_entropy(url),
        "suspicious_keywords": any(kw in url.lower() for kw in ['login', 'verify', 'account', 'secure', 'update', 'confirm', 'banking', 'paypal'])
    }
    return features

async def analyze_with_ai(prompt: str, scan_type: str) -> dict:
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"threat_scan_{uuid.uuid4()}",
            system_message="You are a cybersecurity threat analyst. Analyze the provided data and respond in JSON format with: prediction (Safe/Suspicious/Malicious), confidence (0-1), and explanation (why)."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        try:
            result = json.loads(response)
        except:
            # Fallback parsing
            prediction = "Suspicious"
            confidence = 0.7
            explanation = response[:200] if response else "Analysis completed"
            result = {"prediction": prediction, "confidence": confidence, "explanation": explanation}
        
        return result
    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        return {"prediction": "Suspicious", "confidence": 0.5, "explanation": "Unable to complete AI analysis"}

# Auth Endpoints
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role if user_data.role else "user"
    )
    
    user_doc = user.model_dump()
    user_doc["password"] = hash_password(user_data.password)
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt(user.id, user.email, user.role)
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_data = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_data["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**{k: v for k, v in user_data.items() if k != "password"})
    token = create_jwt(user.id, user.email, user.role)
    return TokenResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Scan Endpoints
@api_router.post("/scan/url", response_model=ScanResult)
async def scan_url(request: URLScanRequest, current_user: User = Depends(get_current_user)):
    features = extract_url_features(request.url)
    
    # Build AI prompt
    prompt = f"""Analyze this URL for security threats:
URL: {request.url}
Features:
- Length: {features['length']}
- HTTPS: {features['has_https']}
- Contains IP: {features['has_ip']}
- Entropy: {features['entropy']:.2f}
- Suspicious Keywords: {features['suspicious_keywords']}

Provide analysis in JSON: {{"prediction": "Safe|Suspicious|Malicious", "confidence": 0.0-1.0, "explanation": "reason"}}"""
    
    ai_result = await analyze_with_ai(prompt, "url")
    
    risk_level = ai_result.get("prediction", "Suspicious")
    confidence = float(ai_result.get("confidence", 0.7))
    explanation = ai_result.get("explanation", "Analysis completed")
    
    risk_score = confidence * 100 if risk_level == "Malicious" else (confidence * 60 if risk_level == "Suspicious" else confidence * 20)
    
    scan_result = ScanResult(
        user_id=current_user.id,
        scan_type="url",
        target=request.url,
        risk_level=risk_level,
        risk_score=risk_score,
        confidence=confidence,
        explanation=explanation,
        details=features
    )
    
    result_doc = scan_result.model_dump()
    result_doc["timestamp"] = result_doc["timestamp"].isoformat()
    await db.scans.insert_one(result_doc)
    
    return scan_result

@api_router.post("/scan/ip", response_model=ScanResult)
async def scan_ip(request: IPScanRequest, current_user: User = Depends(get_current_user)):
    ip = request.ip_address
    
    # Get IP info from ipapi.co
    ip_info = {}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"https://ipapi.co/{ip}/json/") as resp:
                if resp.status == 200:
                    ip_info = await resp.json()
    except Exception as e:
        logger.error(f"IP API error: {str(e)}")
        ip_info = {"country": "Unknown", "city": "Unknown"}
    
    # AI analysis
    prompt = f"""Analyze this IP address for security threats:
IP: {ip}
Location: {ip_info.get('city', 'Unknown')}, {ip_info.get('country_name', 'Unknown')}
Org: {ip_info.get('org', 'Unknown')}

Provide analysis in JSON: {{"prediction": "Safe|Suspicious|Malicious", "confidence": 0.0-1.0, "explanation": "reason"}}"""
    
    ai_result = await analyze_with_ai(prompt, "ip")
    
    risk_level = ai_result.get("prediction", "Safe")
    confidence = float(ai_result.get("confidence", 0.8))
    explanation = ai_result.get("explanation", "IP analysis completed")
    
    risk_score = confidence * 100 if risk_level == "Malicious" else (confidence * 60 if risk_level == "Suspicious" else confidence * 20)
    
    scan_result = ScanResult(
        user_id=current_user.id,
        scan_type="ip",
        target=ip,
        risk_level=risk_level,
        risk_score=risk_score,
        confidence=confidence,
        explanation=explanation,
        details=ip_info
    )
    
    result_doc = scan_result.model_dump()
    result_doc["timestamp"] = result_doc["timestamp"].isoformat()
    await db.scans.insert_one(result_doc)
    
    return scan_result

@api_router.post("/scan/file", response_model=ScanResult)
async def scan_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    file_size = len(content)
    
    file_details = {
        "filename": file.filename,
        "size": file_size,
        "sha256": file_hash,
        "content_type": file.content_type
    }
    
    # AI analysis
    prompt = f"""Analyze this file for malware:
Filename: {file.filename}
Size: {file_size} bytes
Type: {file.content_type}
SHA-256: {file_hash}

Provide analysis in JSON: {{"prediction": "Safe|Suspicious|Malicious", "confidence": 0.0-1.0, "explanation": "reason"}}"""
    
    ai_result = await analyze_with_ai(prompt, "file")
    
    risk_level = ai_result.get("prediction", "Suspicious")
    confidence = float(ai_result.get("confidence", 0.6))
    explanation = ai_result.get("explanation", "File analysis completed")
    
    risk_score = confidence * 100 if risk_level == "Malicious" else (confidence * 60 if risk_level == "Suspicious" else confidence * 20)
    
    scan_result = ScanResult(
        user_id=current_user.id,
        scan_type="file",
        target=file.filename,
        risk_level=risk_level,
        risk_score=risk_score,
        confidence=confidence,
        explanation=explanation,
        details=file_details
    )
    
    result_doc = scan_result.model_dump()
    result_doc["timestamp"] = result_doc["timestamp"].isoformat()
    await db.scans.insert_one(result_doc)
    
    return scan_result

# Dashboard Endpoints
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    scans = await db.scans.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for scan in scans:
        if isinstance(scan.get('timestamp'), str):
            scan['timestamp'] = datetime.fromisoformat(scan['timestamp'])
    
    scan_objects = [ScanResult(**s) for s in scans]
    
    safe_count = sum(1 for s in scan_objects if s.risk_level == "Safe")
    suspicious_count = sum(1 for s in scan_objects if s.risk_level == "Suspicious")
    malicious_count = sum(1 for s in scan_objects if s.risk_level == "Malicious")
    
    recent = sorted(scan_objects, key=lambda x: x.timestamp, reverse=True)[:10]
    
    return DashboardStats(
        total_scans=len(scan_objects),
        safe_count=safe_count,
        suspicious_count=suspicious_count,
        malicious_count=malicious_count,
        recent_scans=recent
    )

@api_router.get("/scans/history", response_model=List[ScanResult])
async def get_scan_history(current_user: User = Depends(get_current_user)):
    scans = await db.scans.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    for scan in scans:
        if isinstance(scan.get('timestamp'), str):
            scan['timestamp'] = datetime.fromisoformat(scan['timestamp'])
    
    scan_objects = [ScanResult(**s) for s in scans]
    return sorted(scan_objects, key=lambda x: x.timestamp, reverse=True)

# Admin Endpoints
@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    user_objects = [User(**u) for u in users]
    
    all_scans = await db.scans.find({}, {"_id": 0}).to_list(10000)
    for scan in all_scans:
        if isinstance(scan.get('timestamp'), str):
            scan['timestamp'] = datetime.fromisoformat(scan['timestamp'])
    
    today = datetime.now(timezone.utc).date()
    scans_today = sum(1 for s in all_scans if s['timestamp'].date() == today)
    
    threat_dist = {
        "Safe": sum(1 for s in all_scans if s['risk_level'] == "Safe"),
        "Suspicious": sum(1 for s in all_scans if s['risk_level'] == "Suspicious"),
        "Malicious": sum(1 for s in all_scans if s['risk_level'] == "Malicious")
    }
    
    return AdminStats(
        total_users=len(user_objects),
        total_scans=len(all_scans),
        scans_today=scans_today,
        threat_distribution=threat_dist,
        user_list=user_objects
    )

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.scans.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()