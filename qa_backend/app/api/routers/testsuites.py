from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.schemas.core_schemas import APIResponse, TestSuiteResponse
from app.services import testsuite_service

router = APIRouter(prefix="/testsuites", tags=["Test Suites"])

@router.get("", response_model=APIResponse[List[TestSuiteResponse]])
async def get_testsuites(db: AsyncSession = Depends(get_db)):
    suites = await testsuite_service.get_list_with_cases(db)
    return APIResponse(success=True, data=suites)
