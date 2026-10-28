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
from app.schemas.core_schemas import APIResponse, UserRegister, UserLogin, TokenResponse, AuditLogResponse, UserResponse, UserUpdateRole

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

async def verify_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin role required"
        )
    return current_user

@router.get("/audit", response_model=APIResponse[List[AuditLogResponse]])
async def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).offset(offset))
    logs = result.scalars().all()
    return APIResponse(
        success=True,
        data=logs,
        message="Audit logs retrieved successfully"
    )

@router.get("/users", response_model=APIResponse[List[UserResponse]])
async def get_users(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(User.id.desc()).limit(limit).offset(offset))
    users = result.scalars().all()
    return APIResponse(
        success=True,
        data=users,
        message="Users retrieved successfully"
    )

@router.put("/users/{user_id}/role", response_model=APIResponse[UserResponse])
async def update_user_role(
    user_id: int,
    payload: UserUpdateRole,
    current_user: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_role = user.role
    user.role = payload.role
    
    audit = AuditLog(
        user_id=current_user.id,
        action="Update User Role",
        details=f"Admin {current_user.email} updated role of user {user.email} from {old_role} to {payload.role}."
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)
    
    return APIResponse(
        success=True,
        data=user,
        message=f"User role updated successfully to {payload.role}"
    )

@router.delete("/users/{user_id}", response_model=APIResponse[dict])
async def delete_user(
    user_id: int,
    current_user: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_email = user.email
    await db.delete(user)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="Delete User",
        details=f"Admin {current_user.email} deleted user account {user_email} (ID: {user_id})."
    )
    db.add(audit)
    await db.commit()
    
    return APIResponse(
        success=True,
        data={"user_id": user_id},
        message="User deleted successfully"
    )
