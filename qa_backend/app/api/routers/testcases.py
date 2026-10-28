from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.schemas.core_schemas import APIResponse, TestCaseCreate, TestCaseResponse
from app.services import testcase_service
from app.api.routers.auth import get_current_user
from app.models.core_models import User

router = APIRouter(prefix="/testcases", tags=["Test Cases"])

@router.get("", response_model=APIResponse[List[TestCaseResponse]])
async def get_testcases(
    limit: int = 100, 
    offset: int = 0, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    testcases = await testcase_service.get_list(db, limit, offset)
    return APIResponse(success=True, data=testcases)

@router.get("/{id}", response_model=APIResponse[TestCaseResponse])
async def get_testcase(
    id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    testcase = await testcase_service.get_by_id(db, id)
    return APIResponse(success=True, data=testcase)

@router.post("", response_model=APIResponse[TestCaseResponse])
async def create_testcase(
    payload: TestCaseCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    testcase = await testcase_service.create(db, payload)
    return APIResponse(success=True, data=testcase, message="TestCase created successfully")
