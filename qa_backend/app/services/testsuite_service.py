from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.core_models import TestSuite

async def get_list_with_cases(db: AsyncSession):
    result = await db.execute(
        select(TestSuite).options(selectinload(TestSuite.test_cases)).order_by(TestSuite.id)
    )
    return result.scalars().all()
