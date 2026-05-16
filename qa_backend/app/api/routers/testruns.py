from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.schemas.core_schemas import APIResponse, TestRunResponse, TestRunDetailResponse, TestRunHistoryItem
from app.services import testrun_service
from app.tasks.test_tasks import execute_test_case
from app.api.routers.auth import get_current_user
from app.models.core_models import User

router = APIRouter(prefix="/testruns", tags=["Test Runs"])

@router.post("/{testcase_id}/run", status_code=status.HTTP_202_ACCEPTED)
async def trigger_test_run(
    testcase_id: int, 
    background_tasks: BackgroundTasks, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    test_run, file_path, function_name = await testrun_service.create_test_run(db, testcase_id, current_user.id)
    
    # Run Pytest directly inside a background thread of the FastAPI process
    background_tasks.add_task(execute_test_case, test_run.id, file_path, function_name)
    
    return APIResponse(
        success=True, 
        data={"test_run_id": test_run.id, "status": test_run.status},
        message="Test run triggered successfully"
    )

@router.get("", response_model=APIResponse[List[TestRunDetailResponse]])
async def get_test_runs(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    runs = await testrun_service.get_list(db, limit, offset)
    return APIResponse(success=True, data=runs)

@router.get("/history", response_model=APIResponse[List[TestRunHistoryItem]])
async def get_test_runs_history(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    history_items = await testrun_service.get_history_list(db, limit, offset)
    return APIResponse(success=True, data=history_items)

@router.get("/{id}", response_model=APIResponse[TestRunDetailResponse])
async def get_test_run(id: int, db: AsyncSession = Depends(get_db)):
    run = await testrun_service.get_by_id(db, id)
    return APIResponse(success=True, data=run)
