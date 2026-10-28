"""
Incremental QA seed — safe to re-run.

Unlike seed.py (full reset + TRUNCATE), this script only upserts suites/test cases.
Existing test runs, results, and unrelated records are preserved.

Usage (inside qa-backend container):
    python3 seed_incremental.py

Usage (host, mapped DB port):
    DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/qa_db python3 seed_incremental.py
"""

from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models.core_models import TestCase
from seed_helpers import get_or_create_suite, upsert_test_case

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5433/qa_db",
)

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ---------------------------------------------------------------------------
# Add new suites / test cases here when extending automation coverage.
# Re-running this file is idempotent (matched by suite.name + testcase.title).
# ---------------------------------------------------------------------------
INCREMENTAL_SEED: list[dict] = [
    {
        "suite_name": "UI Attendance (Class Attendance)",
        "suite_description": "Kiem thu giao dien tinh nang diem danh, xem ma QR cho tung lop hoc.",
        "test_cases": [
            {
                "title": "TC-UI-ATT-03: Mark student as Absent",
                "file_path": "ui/specs/class-attendance.spec.ts",
                "function_name": "should mark student as Absent and save",
                "expected_result": "Trang thai Absent duoc luu va hien thi tren bang diem danh.",
            },
            {
                "title": "TC-UI-ATT-04: Mark student as Late",
                "file_path": "ui/specs/class-attendance.spec.ts",
                "function_name": "should mark student as Late and save",
                "expected_result": "Trang thai Late duoc luu va hien thi tren bang diem danh.",
            },
            {
                "title": "TC-UI-ATT-05: View attendance report",
                "file_path": "ui/specs/class-attendance.spec.ts",
                "function_name": "should display attendance report after saving session",
                "expected_result": "Tab Reports hien thi Attendance Summary va nut Export CSV.",
            },
        ],
    },
    {
        "suite_name": "API LMS (Learning Management System API)",
        "suite_description": "Kiem thu cac Endpoint API quan ly he thong hoc tap, bai giang, khoa hoc.",
        "test_cases": [
            {
                "title": "TC-LMS-04: Verify creating a video lesson",
                "file_path": "api/test_lms.py",
                "function_name": "test_create_video_lesson",
                "expected_result": "He thong phan hoi HTTP 201 Created voi content_type video.",
            },
            {
                "title": "TC-LMS-05: Verify assigning quiz to lesson",
                "file_path": "api/test_lms.py",
                "function_name": "test_create_quiz_for_lesson",
                "expected_result": "He thong phan hoi HTTP 201 Created va gan quiz vao lesson_id.",
            },
        ],
    },
    {
        "suite_name": "UI LMS (Lesson Management)",
        "suite_description": "Kiem thu giao dien tao bai giang, upload file hoc lieu trong he thong LMS.",
        "test_cases": [
            {
                "title": "TC-UI-LMS-03: Create a video lesson",
                "file_path": "ui/specs/lms-lesson.spec.ts",
                "function_name": "should create a video lesson successfully",
                "expected_result": "Bai giang video duoc luu voi external URL thanh cong.",
            },
        ],
    },
    {
        "suite_name": "API CRM (Lead Management API)",
        "suite_description": "Kiem thu API quan ly lead, phan bo sales va cap nhat trang thai cham soc.",
        "test_cases": [
            {
                "title": "TC-CRM-01: Verify creating a lead from web source",
                "file_path": "api/test_crm.py",
                "function_name": "test_create_lead",
                "expected_result": "He thong phan hoi HTTP 201 voi source Website va status New.",
            },
            {
                "title": "TC-CRM-02: Verify filtering leads by status",
                "file_path": "api/test_crm.py",
                "function_name": "test_list_leads_with_status_filter",
                "expected_result": "GET /api/crm/leads?status=Contacted tra ve lead da cap nhat.",
            },
            {
                "title": "TC-CRM-03: Verify updating lead care status",
                "file_path": "api/test_crm.py",
                "function_name": "test_update_lead_status",
                "expected_result": "Cap nhat status Interested thanh cong qua PUT /api/crm/leads/{id}.",
            },
            {
                "title": "TC-CRM-04: Verify manual lead assignment",
                "file_path": "api/test_crm.py",
                "function_name": "test_assign_lead_to_staff",
                "expected_result": "Lead duoc gan assigned_to_id cho nhan vien sales.",
            },
            {
                "title": "TC-CRM-05: Verify CRM assignment settings",
                "file_path": "api/test_crm.py",
                "function_name": "test_update_crm_assignment_settings",
                "expected_result": "PUT/GET /api/crm/settings luu va tra ve auto_assignment_rule.",
            },
        ],
    },
    {
        "suite_name": "UI CRM (Lead Flow)",
        "suite_description": "Kiem thu giao dien tiep nhan lead, cap nhat trang thai va phan bo sales.",
        "test_cases": [
            {
                "title": "TC-UI-CRM-01: Create lead from website source",
                "file_path": "ui/specs/crm-lead-flow.spec.ts",
                "function_name": "should create a lead from website source",
                "expected_result": "Lead moi hien thi tren bang Lead Management sau khi tao.",
            },
            {
                "title": "TC-UI-CRM-02: Update lead status to Contacted",
                "file_path": "ui/specs/crm-lead-flow.spec.ts",
                "function_name": "should update lead status to Contacted",
                "expected_result": "Trang chi tiet lead hien thi status Contacted sau khi luu.",
            },
            {
                "title": "TC-UI-CRM-03: Assign lead to sales staff",
                "file_path": "ui/specs/crm-lead-flow.spec.ts",
                "function_name": "should assign lead to sales staff",
                "expected_result": "Trang chi tiet lead hien thi ten nhan vien duoc phan cong.",
            },
        ],
    },
    {
        "suite_name": "API Finance (Invoicing API)",
        "suite_description": "Kiem thu API tao hoa don hoc phi, ghi nhan thanh toan va danh sach hoa don.",
        "test_cases": [
            {
                "title": "TC-FIN-01: Verify creating a tuition invoice",
                "file_path": "api/test_finance.py",
                "function_name": "test_create_invoice",
                "expected_result": "He thong phan hoi HTTP 201 voi invoice Unpaid va line items.",
            },
            {
                "title": "TC-FIN-02: Verify retrieving invoice details",
                "file_path": "api/test_finance.py",
                "function_name": "test_get_invoice_detail",
                "expected_result": "GET /api/finance/invoices/{id} tra ve balance bang total_amount.",
            },
            {
                "title": "TC-FIN-03: Verify recording full payment",
                "file_path": "api/test_finance.py",
                "function_name": "test_record_payment",
                "expected_result": "Sau khi ghi nhan thanh toan, invoice chuyen sang status Paid.",
            },
            {
                "title": "TC-FIN-04: Verify paginated invoice listing",
                "file_path": "api/test_finance.py",
                "function_name": "test_list_invoices",
                "expected_result": "GET /api/finance/invoices tra ve danh sach co invoice vua tao.",
            },
        ],
    },
    {
        "suite_name": "UI Finance (Invoicing)",
        "suite_description": "Kiem thu giao dien tao hoa don hoc phi, ghi nhan thanh toan va tai PDF bien lai.",
        "test_cases": [
            {
                "title": "TC-UI-FIN-01: Create tuition invoice via UI",
                "file_path": "ui/specs/finance-invoicing.spec.ts",
                "function_name": "should create a tuition invoice via UI",
                "expected_result": "Hoa don moi duoc tao voi student va line item da nhap.",
            },
            {
                "title": "TC-UI-FIN-02: Record payment and mark invoice Paid",
                "file_path": "ui/specs/finance-invoicing.spec.ts",
                "function_name": "should record payment and mark invoice as Paid",
                "expected_result": "Sau khi ghi nhan thanh toan, trang chi tiet hien thi status Paid.",
            },
            {
                "title": "TC-UI-FIN-03: Download invoice PDF receipt",
                "file_path": "ui/specs/finance-invoicing.spec.ts",
                "function_name": "should download invoice PDF receipt",
                "expected_result": "Nut Download PDF tai file invoice_*.pdf thanh cong.",
            },
        ],
    },
    {
        "suite_name": "API File Upload (File Manager API)",
        "suite_description": "Kiem thu API upload file qua MinIO, quan ly thu muc va xoa file.",
        "test_cases": [
            {
                "title": "TC-FILE-01: Verify creating a file manager folder",
                "file_path": "api/test_file_upload.py",
                "function_name": "test_create_folder",
                "expected_result": "POST /api/files/folders tra ve HTTP 201 voi ten folder.",
            },
            {
                "title": "TC-FILE-02: Verify uploading a file to MinIO",
                "file_path": "api/test_file_upload.py",
                "function_name": "test_upload_file",
                "expected_result": "POST /api/files/upload luu file PDF thanh cong.",
            },
            {
                "title": "TC-FILE-03: Verify listing folders and files",
                "file_path": "api/test_file_upload.py",
                "function_name": "test_list_folders_and_files",
                "expected_result": "GET /api/files/folders tra ve file vua upload.",
            },
            {
                "title": "TC-FILE-04: Verify retrieving file download URL",
                "file_path": "api/test_file_upload.py",
                "function_name": "test_get_file_download_url",
                "expected_result": "Ghi nhan hanh vi SUT: presigned URL co the 500 (known limitation, khong sua edumaster).",
            },
            {
                "title": "TC-FILE-05: Verify deleting an uploaded file",
                "file_path": "api/test_file_upload.py",
                "function_name": "test_delete_file",
                "expected_result": "DELETE /api/files/{id} xoa file khoi danh sach.",
            },
        ],
    },
    {
        "suite_name": "UI File Upload (File Manager)",
        "suite_description": "Kiem thu giao dien upload file, tao thu muc va xoa file tren File Manager.",
        "test_cases": [
            {
                "title": "TC-UI-FILE-01: Upload file and display in manager",
                "file_path": "ui/specs/file-upload.spec.ts",
                "function_name": "should upload a file and display it in file manager",
                "expected_result": "File PDF hien thi tren luoi File Manager sau khi upload.",
            },
            {
                "title": "TC-UI-FILE-02: Create folder in file manager",
                "file_path": "ui/specs/file-upload.spec.ts",
                "function_name": "should create a folder in file manager",
                "expected_result": "Folder moi hien thi tren luoi sau khi tao.",
            },
            {
                "title": "TC-UI-FILE-03: Delete uploaded file",
                "file_path": "ui/specs/file-upload.spec.ts",
                "function_name": "should delete an uploaded file",
                "expected_result": "File bien mat khoi UI sau khi xoa.",
            },
        ],
    },
    {
        "suite_name": "API Reporting (Dashboard API)",
        "suite_description": "Kiem thu API bao cao JSON — dashboard, revenue trend, lead source, revenue report.",
        "test_cases": [
            {
                "title": "TC-RPT-01: Verify dashboard overview JSON",
                "file_path": "api/test_reporting.py",
                "function_name": "test_dashboard_stats_json",
                "expected_result": "GET /api/reporting/dashboard tra ve cac chi so tong quan.",
            },
            {
                "title": "TC-RPT-02: Verify revenue trend JSON",
                "file_path": "api/test_reporting.py",
                "function_name": "test_revenue_trend_json",
                "expected_result": "GET /api/reporting/revenue-trend tra ve mang du lieu JSON.",
            },
            {
                "title": "TC-RPT-03: Verify lead source JSON",
                "file_path": "api/test_reporting.py",
                "function_name": "test_lead_source_json",
                "expected_result": "GET /api/reporting/lead-source tra ve breakdown JSON.",
            },
            {
                "title": "TC-RPT-04: Verify revenue report JSON metrics",
                "file_path": "api/test_reporting.py",
                "function_name": "test_revenue_report_json",
                "expected_result": "GET /api/reporting/finance/revenue-report tra ve total_collected/invoiced/debt.",
            },
        ],
    },
    {
        "suite_name": "UI Reporting (Dashboard)",
        "suite_description": "Kiem thu giao dien hien thi bao cao JSON — khong test export CSV/Excel.",
        "test_cases": [
            {
                "title": "TC-UI-RPT-01: Display center overview statistics",
                "file_path": "ui/specs/reporting.spec.ts",
                "function_name": "should display center overview statistics",
                "expected_result": "Trang overview hien thi Total Students, Revenue, Lead Conversion.",
            },
            {
                "title": "TC-UI-RPT-02: Display revenue trend charts",
                "file_path": "ui/specs/reporting.spec.ts",
                "function_name": "should display revenue trend and lead source charts",
                "expected_result": "Trang overview hien thi Revenue Growth Trend va Lead Sources.",
            },
            {
                "title": "TC-UI-RPT-03: Display revenue report metrics",
                "file_path": "ui/specs/reporting.spec.ts",
                "function_name": "should display financial revenue report metrics",
                "expected_result": "Trang revenue report hien thi Total Invoiced/Collected/Debt.",
            },
        ],
    },
    {
        "suite_name": "API Study Abroad (Du hoc / XKLD API)",
        "suite_description": "Kiem thu API ung vien, doi tac, don hang, workflow ho so va matching XKLD.",
        "test_cases": [
            {
                "title": "TC-SA-01: Verify creating a study abroad candidate",
                "file_path": "api/test_study_abroad.py",
                "function_name": "test_create_candidate",
                "expected_result": "POST /api/study-abroad/candidates tra ve HTTP 201 va full_name dung.",
            },
            {
                "title": "TC-SA-02: Verify creating partner and job order",
                "file_path": "api/test_study_abroad.py",
                "function_name": "test_create_partner_and_job_order",
                "expected_result": "POST partner + order thanh cong; GET order co min_height va required_jlpt.",
            },
            {
                "title": "TC-SA-03: Verify creating application workflow",
                "file_path": "api/test_study_abroad.py",
                "function_name": "test_create_application",
                "expected_result": "Application khoi tao 7 stage; stage dau la In Progress.",
            },
            {
                "title": "TC-SA-04: Verify advance application checklist",
                "file_path": "api/test_study_abroad.py",
                "function_name": "test_advance_application_checklist",
                "expected_result": "Advance bi chan khi checklist chua xong; sau khi hoan thanh chuyen sang School Selection.",
            },
            {
                "title": "TC-SA-05: Verify match and assign candidate to job order",
                "file_path": "api/test_study_abroad.py",
                "function_name": "test_match_candidates_to_order",
                "expected_result": "Auto-match tra ve is_match=true; assign tao match record tren don hang.",
            },
        ],
    },
    {
        "suite_name": "UI Study Abroad (Application Workflow)",
        "suite_description": "Kiem thu UI tao ho so du hoc va advance workflow tren Applications board.",
        "test_cases": [
            {
                "title": "TC-UI-SA-01: Create application and advance workflow stage",
                "file_path": "ui/specs/study-abroad-workflow.spec.ts",
                "function_name": "should create application and advance workflow stage",
                "expected_result": "Tao application tu UI, hoan thanh checklist Initial Consultation va chuyen sang School Selection.",
            },
        ],
    },
    {
        "suite_name": "API Auth Profile (User Profile API)",
        "suite_description": "Kiem thu cap nhat profile va doi mat khau qua /api/auth/*.",
        "test_cases": [
            {
                "title": "TC-AUTH-PROF-01: Verify updating profile full name",
                "file_path": "api/test_auth_profile.py",
                "function_name": "test_update_profile",
                "expected_result": "PUT /api/auth/profile cap nhat full_name thanh cong.",
            },
            {
                "title": "TC-AUTH-PROF-02: Verify changing password",
                "file_path": "api/test_auth_profile.py",
                "function_name": "test_change_password_success",
                "expected_result": "POST /api/auth/change-password tra ve 200; login duoc voi mat khau moi.",
            },
            {
                "title": "TC-AUTH-PROF-03: Verify wrong old password rejected",
                "file_path": "api/test_auth_profile.py",
                "function_name": "test_change_password_wrong_old",
                "expected_result": "POST change-password voi old_password sai tra ve 400 Incorrect password.",
            },
            {
                "title": "TC-AUTH-PROF-04: Forgot password API not implemented",
                "file_path": "api/test_auth_profile.py",
                "function_name": "test_forgot_password_api_not_implemented",
                "expected_result": "xfail: khong co POST /api/auth/forgot-password; UI /forgot-password la mock.",
            },
        ],
    },
    {
        "suite_name": "UI User Profile (Profile & Security)",
        "suite_description": "Kiem thu UI cap nhat profile, doi mat khau va trang forgot-password (mock).",
        "test_cases": [
            {
                "title": "TC-UI-PROF-01: Update profile full name",
                "file_path": "ui/specs/user-profile.spec.ts",
                "function_name": "should update profile full name",
                "expected_result": "Cap nhat full name tren /admin/profile va hien thi tren trang.",
            },
            {
                "title": "TC-UI-PROF-02: Change password from security tab",
                "file_path": "ui/specs/user-profile.spec.ts",
                "function_name": "should change password from profile security tab",
                "expected_result": "Doi mat khau thanh cong; login lai duoc; restore mat khau cu qua API.",
            },
            {
                "title": "TC-UI-PROF-03: Forgot password mock UI flow",
                "file_path": "ui/specs/user-profile.spec.ts",
                "function_name": "should show mock success on forgot password page",
                "expected_result": "Trang /forgot-password hien thi message mock reset link (chua co BE that).",
            },
        ],
    },
]


async def seed_incremental() -> None:
    stats = {"suite_created": 0, "suite_updated": 0, "suite_skipped": 0,
             "case_created": 0, "case_updated": 0, "case_skipped": 0}

    async with AsyncSessionLocal() as db:
        print("Incremental seed started (no TRUNCATE — existing runs are preserved).")

        for block in INCREMENTAL_SEED:
            suite, suite_action = await get_or_create_suite(
                db,
                block["suite_name"],
                block["suite_description"],
            )
            stats[f"suite_{suite_action}"] += 1
            print(f"  Suite [{suite_action}]: {suite.name}")

            for case_data in block["test_cases"]:
                _, case_action = await upsert_test_case(
                    db,
                    suite.id,
                    title=case_data["title"],
                    file_path=case_data["file_path"],
                    function_name=case_data.get("function_name"),
                    expected_result=case_data["expected_result"],
                    status=case_data.get("status", "active"),
                )
                stats[f"case_{case_action}"] += 1
                print(f"    TestCase [{case_action}]: {case_data['title']}")

        await db.commit()

    print("\nIncremental seed completed.")
    print(
        "  Suites  — created: {suite_created}, updated: {suite_updated}, skipped: {suite_skipped}".format(
            **stats
        )
    )
    print(
        "  Cases   — created: {case_created}, updated: {case_updated}, skipped: {case_skipped}".format(
            **stats
        )
    )


if __name__ == "__main__":
    asyncio.run(seed_incremental())
