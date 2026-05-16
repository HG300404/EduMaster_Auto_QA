from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.core_models import TestRun, TestCase, TestRunStatus, TestResult, TestSuite

async def create_test_run(db: AsyncSession, testcase_id: int, user_id: int = None):
    # Get test case
    result = await db.execute(select(TestCase).where(TestCase.id == testcase_id))
    testcase = result.scalars().first()
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")
    
    new_run = TestRun(
        test_case_id=testcase_id,
        user_id=user_id,
        status=TestRunStatus.pending,
        started_at=datetime.now(timezone.utc)
    )
    db.add(new_run)
    await db.commit()
    await db.refresh(new_run)
    
    return new_run, testcase.file_path, testcase.function_name

async def get_list(db: AsyncSession, limit: int = 100, offset: int = 0):
    result = await db.execute(
        select(TestRun)
        .options(
            selectinload(TestRun.test_results),
            selectinload(TestRun.test_case)
        )
        .order_by(TestRun.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()

async def get_history_list(db: AsyncSession, limit: int = 100, offset: int = 0):
    result = await db.execute(
        select(TestRun)
        .options(
            selectinload(TestRun.test_results),
            selectinload(TestRun.test_case).selectinload(TestCase.suite)
        )
        .order_by(TestRun.id.desc())
        .limit(limit)
        .offset(offset)
    )
    runs = result.scalars().all()
    history_items = []
    for run in runs:
        if run.status == TestRunStatus.completed:
            status_str = "Passed"
        elif run.status == TestRunStatus.failed:
            status_str = "Failed"
        elif run.status == TestRunStatus.running:
            status_str = "Running"
        else:
            status_str = "Pending"
            
        if run.started_at:
            date_str = run.started_at.strftime("%b %d, %Y · %H:%M")
        else:
            date_str = "Just now"
            
        if run.finished_at and run.started_at:
            seconds = int((run.finished_at - run.started_at).total_seconds())
            if seconds >= 60:
                mins = seconds // 60
                secs = seconds % 60
                duration_str = f"{mins}m {secs}s"
            else:
                duration_str = f"{seconds}s"
        else:
            duration_str = "--:--"
            
        suite_name = run.test_case.suite.name if (run.test_case and run.test_case.suite) else "Automated Pytest Suite"
        target_title = run.test_case.title if run.test_case else "API Scenario"
        
        env_str = "Production"
        if run.test_case and run.test_case.file_path:
            fp = run.test_case.file_path.lower()
            if "staging" in fp or "ui" in fp:
                env_str = "Staging"
            
        history_items.append({
            "id": run.id,
            "display_id": f"TR-{run.id}",
            "suite_name": suite_name,
            "target_title": target_title,
            "environment": env_str,
            "status": status_str,
            "date_formatted": date_str,
            "duration_formatted": duration_str,
            "duration_seconds": seconds if (run.finished_at and run.started_at) else 0
        })
    return history_items

async def get_by_id(db: AsyncSession, run_id: int):
    import os
    result = await db.execute(
        select(TestRun)
        .options(
            selectinload(TestRun.test_results),
            selectinload(TestRun.test_case)
        )
        .where(TestRun.id == run_id)
    )
    test_run = result.scalars().first()
    if not test_run:
        raise HTTPException(status_code=404, detail="TestRun not found")
        
    # Dynamically read local log file lines if available
    logs = []
    log_file_path = f"/app/tests/logs/run_{run_id}.log"
    if os.path.exists(log_file_path):
        try:
            with open(log_file_path, "r", encoding="utf-8") as f:
                logs = [line.rstrip("\n") for line in f.readlines()]
        except Exception:
            pass
    test_run.logs = logs
    
    return test_run
