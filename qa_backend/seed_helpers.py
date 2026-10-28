"""Shared helpers for QA database seeding (non-destructive upsert)."""

from __future__ import annotations

from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.core_models import TestCase, TestCaseStatus, TestSuite

UpsertAction = Literal["created", "updated", "skipped"]


async def get_or_create_suite(
    db: AsyncSession,
    name: str,
    description: str,
) -> tuple[TestSuite, UpsertAction]:
    result = await db.execute(select(TestSuite).where(TestSuite.name == name))
    suite = result.scalar_one_or_none()

    if suite:
        if suite.description != description:
            suite.description = description
            return suite, "updated"
        return suite, "skipped"

    suite = TestSuite(name=name, description=description)
    db.add(suite)
    await db.flush()
    return suite, "created"


async def upsert_test_case(
    db: AsyncSession,
    suite_id: int,
    *,
    title: str,
    file_path: str,
    function_name: str | None,
    expected_result: str,
    status: str = "active",
) -> tuple[TestCase, UpsertAction]:
    result = await db.execute(
        select(TestCase).where(TestCase.suite_id == suite_id, TestCase.title == title)
    )
    existing = result.scalar_one_or_none()
    desired_status = TestCaseStatus.active if status == "active" else TestCaseStatus.draft

    if existing:
        changed = False
        if existing.file_path != file_path:
            existing.file_path = file_path
            changed = True
        if existing.function_name != function_name:
            existing.function_name = function_name
            changed = True
        if existing.expected_result != expected_result:
            existing.expected_result = expected_result
            changed = True
        if existing.status != desired_status:
            existing.status = desired_status
            changed = True
        return existing, "updated" if changed else "skipped"

    test_case = TestCase(
        suite_id=suite_id,
        title=title,
        file_path=file_path,
        function_name=function_name,
        expected_result=expected_result,
        status=desired_status,
    )
    db.add(test_case)
    await db.flush()
    return test_case, "created"
