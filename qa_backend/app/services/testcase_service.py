from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException
from typing import Dict, List, Optional

from app.models.core_models import TestCase, TestSuite, TestRun, TestRunStatus
from app.schemas.core_schemas import TestCaseCreate, TestCaseResponse, RecentRunSummary

_RUN_STATUS_TO_RESULT = {
    TestRunStatus.completed: "passed",
    TestRunStatus.failed: "failed",
    TestRunStatus.running: "running",
    TestRunStatus.pending: "pending",
}


async def get_latest_runs_by_case_ids(
    db: AsyncSession, case_ids: List[int]
) -> Dict[int, TestRun]:
    if not case_ids:
        return {}

    latest_run_subq = (
        select(
            TestRun.test_case_id,
            func.max(TestRun.id).label("latest_run_id"),
        )
        .where(TestRun.test_case_id.in_(case_ids))
        .group_by(TestRun.test_case_id)
        .subquery()
    )
    result = await db.execute(
        select(TestRun).join(
            latest_run_subq, TestRun.id == latest_run_subq.c.latest_run_id
        )
    )
    return {run.test_case_id: run for run in result.scalars().all()}


def to_testcase_response(
    testcase: TestCase, latest_run: Optional[TestRun] = None
) -> TestCaseResponse:
    recent_result = None
    if latest_run:
        run_at = latest_run.finished_at or latest_run.started_at
        if run_at:
            recent_result = RecentRunSummary(
                test_run_id=latest_run.id,
                status=_RUN_STATUS_TO_RESULT.get(latest_run.status, "pending"),
                run_at=run_at,
            )

    return TestCaseResponse(
        id=testcase.id,
        suite_id=testcase.suite_id,
        title=testcase.title,
        status=testcase.status,
        file_path=testcase.file_path,
        function_name=testcase.function_name,
        expected_result=testcase.expected_result,
        created_at=testcase.created_at,
        recent_result=recent_result,
    )


async def get_list(db: AsyncSession, limit: int = 100, offset: int = 0):
    result = await db.execute(select(TestCase).offset(offset).limit(limit))
    testcases = result.scalars().all()
    latest_runs = await get_latest_runs_by_case_ids(db, [tc.id for tc in testcases])
    return [
        to_testcase_response(tc, latest_runs.get(tc.id)) for tc in testcases
    ]


async def get_by_id(db: AsyncSession, id: int):
    result = await db.execute(select(TestCase).where(TestCase.id == id))
    testcase = result.scalars().first()
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")

    latest_runs = await get_latest_runs_by_case_ids(db, [testcase.id])
    return to_testcase_response(testcase, latest_runs.get(testcase.id))


async def create(db: AsyncSession, payload: TestCaseCreate):
    suite_result = await db.execute(select(TestSuite).where(TestSuite.id == payload.suite_id))
    if not suite_result.scalars().first():
        raise HTTPException(status_code=404, detail="TestSuite not found")

    new_testcase = TestCase(**payload.model_dump())
    db.add(new_testcase)
    await db.commit()
    await db.refresh(new_testcase)
    return to_testcase_response(new_testcase)
