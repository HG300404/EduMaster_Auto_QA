from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models.core_models import TestCase, TestSuite
from app.schemas.core_schemas import TestCaseCreate

async def get_list(db: AsyncSession, limit: int = 100, offset: int = 0):
    result = await db.execute(select(TestCase).offset(offset).limit(limit))
    return result.scalars().all()

async def get_by_id(db: AsyncSession, id: int):
    result = await db.execute(select(TestCase).where(TestCase.id == id))
    testcase = result.scalars().first()
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")
    return testcase

async def create(db: AsyncSession, payload: TestCaseCreate):
    # Verify suite exists
    suite_result = await db.execute(select(TestSuite).where(TestSuite.id == payload.suite_id))
    if not suite_result.scalars().first():
        raise HTTPException(status_code=404, detail="TestSuite not found")
    
    new_testcase = TestCase(**payload.model_dump())
    db.add(new_testcase)
    await db.commit()
    await db.refresh(new_testcase)
    return new_testcase
