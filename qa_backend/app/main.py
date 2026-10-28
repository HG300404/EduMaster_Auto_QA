from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.db.session import engine
from app.db.base import Base
import os
# Import models to ensure they are registered with Base
from app.models import core_models
from app.api.routers import testcases, testruns, auth, testsuites

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Auto-migration: safely add columns to test_runs if they don't exist
        try:
            from sqlalchemy import text
            await conn.execute(text("ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS test_case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE"))
            await conn.execute(text("ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL"))
        except Exception as e:
            print(f"Automatic migration failed: {e}")
            
    # Create default admin user if not exists
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.core_models import User
        from app.api.routers.auth import hash_password
        from sqlalchemy.future import select
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == "admin@edumaster.com"))
            admin = result.scalars().first()
            if not admin:
                new_admin = User(
                    full_name="System Administrator",
                    email="admin@edumaster.com",
                    hashed_password=hash_password("admin123"),
                    role="admin"
                )
                db.add(new_admin)
                await db.commit()
                print("Default admin user created successfully (admin@edumaster.com / admin123)")
    except Exception as e:
        print(f"Error seeding default admin: {e}")
        
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(title="TMS Backend API", lifespan=lifespan)

report_dir = os.getenv("REPORT_DIR", "/app/qa_core/reports")
os.makedirs(report_dir, exist_ok=True)
app.mount("/reports", StaticFiles(directory=report_dir), name="reports")

# Setup CORS for development
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(testcases.router)
app.include_router(testruns.router)
app.include_router(testsuites.router)

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "TMS Backend"}
