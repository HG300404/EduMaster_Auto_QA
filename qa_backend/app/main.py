from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.session import engine
from app.db.base import Base
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
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(title="TMS Backend API", lifespan=lifespan)

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
