from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.core_models import TestSuite
from app.schemas.core_schemas import TestSuiteResponse
from app.services.testcase_service import get_latest_runs_by_case_ids, to_testcase_response


async def get_list_with_cases(db: AsyncSession):
    result = await db.execute(
        select(TestSuite).options(selectinload(TestSuite.test_cases)).order_by(TestSuite.id)
    )
    suites = result.scalars().all()
    case_ids = [tc.id for suite in suites for tc in suite.test_cases]
    latest_runs = await get_latest_runs_by_case_ids(db, case_ids)

    return [
        TestSuiteResponse(
            id=suite.id,
            name=suite.name,
            description=suite.description,
            test_cases=[
                to_testcase_response(tc, latest_runs.get(tc.id))
                for tc in suite.test_cases
            ],
        )
        for suite in suites
    ]
