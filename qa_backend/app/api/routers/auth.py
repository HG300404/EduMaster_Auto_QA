from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import hashlib
import jwt
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.core_models import User, AuditLog
from app.schemas.core_schemas import APIResponse, UserRegister, UserLogin, TokenResponse, AuditLogResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = "edumaster_secure_secret_key_9831"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 1

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def hash_password(password: str) -> str:
    # Secure SHA-256 password hashing using standard library
    salt = "edumaster_secure_salt_9831"
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return hashed

@router.post("/register", response_model=APIResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create new user
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role="admin" if user_data.email.endswith("@edumaster.com") else "user"
    )
    db.add(new_user)
    await db.flush()  # Get id
    
    # Create Audit Log
    audit = AuditLog(
        user_id=new_user.id,
        action="User Registered",
        details=f"User {new_user.full_name} ({new_user.email}) successfully registered."
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)
    
    # Generate token
    token = create_access_token(data={"sub": str(new_user.id)})
    
    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=token,
            user=new_user
        ),
        message="Registration successful"
    )

@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalars().first()
    if not user or user.hashed_password != hash_password(login_data.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    # Create Audit Log
    audit = AuditLog(
        user_id=user.id,
        action="User Logged In",
        details=f"User {user.full_name} ({user.email}) successfully logged in."
    )
    db.add(audit)
    await db.commit()
    
    # Generate token
    token = create_access_token(data={"sub": str(user.id)})
    
    return APIResponse(
        success=True,
        data=TokenResponse(
            access_token=token,
            user=user
        ),
        message="Login successful"
    )

@router.get("/audit", response_model=APIResponse[List[AuditLogResponse]])
async def get_audit_logs(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).offset(offset))
    logs = result.scalars().all()
    return APIResponse(
        success=True,
        data=logs,
        message="Audit logs retrieved successfully"
    )
