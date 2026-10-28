import os
import sys
import asyncio

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.models.core_models import TestSuite, TestCase

# Get from env if available (inside container), otherwise use host mapped port
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/qa_db")

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed():
    async with AsyncSessionLocal() as db:
        print("WARNING: Full reset seed — TRUNCATE will delete all suites, cases, runs, and results.")
        print("         For adding new test cases without data loss, use: python3 seed_incremental.py")
        print("Cleaning up existing Test Suites and Test Cases to avoid duplication...")
        # Clear existing suites and test cases safely with CASCADE
        await db.execute(text("TRUNCATE test_suites, test_cases, test_runs, test_results RESTART IDENTITY CASCADE;"))
        await db.commit()

        # =========================================================
        # SUITE 1: API Login (Authentication API)
        # Maps to: qa_core/tests/api/test_login.py
        # =========================================================
        suite_auth_api = TestSuite(
            name="API Login (Authentication API)", 
            description="Bao gom cac kich ban kiem thu bao mat, dinh danh va xac thuc tai khoan thong qua API."
        )
        db.add(suite_auth_api)
        await db.flush()
        
        tc_auth_1 = TestCase(
            suite_id=suite_auth_api.id, 
            title="TC-AUTH-01: Dang nhap thanh cong (Positive case)", 
            file_path="api/test_login.py", 
            function_name="test_login_success",
            expected_result="He thong phan hoi HTTP 200 OK va tra ve Access Token hop le.",
            status="active"
        )
        tc_auth_2 = TestCase(
            suite_id=suite_auth_api.id, 
            title="TC-AUTH-02: Dang nhap that bai do sai mat khau (Negative case)", 
            file_path="api/test_login.py", 
            function_name="test_login_invalid_password",
            expected_result="He thong phan hoi HTTP 401 Unauthorized voi thong bao loi 'Bad email or password'.",
            status="active"
        )
        tc_auth_3 = TestCase(
            suite_id=suite_auth_api.id, 
            title="TC-AUTH-03: Dang nhap that bai voi tai khoan khong ton tai (Negative case)", 
            file_path="api/test_login.py", 
            function_name="test_login_non_existent_user",
            expected_result="He thong phan hoi HTTP 401 Unauthorized.",
            status="active"
        )
        tc_auth_4 = TestCase(
            suite_id=suite_auth_api.id, 
            title="TC-AUTH-04: Lay thong tin ca nhan sau khi dang nhap thanh cong", 
            file_path="api/test_login.py", 
            function_name="test_get_me_after_login",
            expected_result="He thong phan hoi HTTP 200 OK chua thong tin tai khoan dang nhap.",
            status="active"
        )
        db.add_all([tc_auth_1, tc_auth_2, tc_auth_3, tc_auth_4])

        # =========================================================
        # SUITE 2: API Class Management
        # Maps to: qa_core/tests/api/test_classes.py
        # =========================================================
        suite_class_api = TestSuite(
            name="API Class (Class Management API)", 
            description="Kiem thu cac Endpoint API quan ly lop hoc bao gom tao moi, tra cuu va cap nhat lop hoc."
        )
        db.add(suite_class_api)
        await db.flush()

        tc_class_1 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-01: Tao lop hoc moi (day du prerequisites)",
            file_path="api/test_classes.py",
            function_name="test_create_class_full_flow",
            expected_result="He thong phan hoi HTTP 201 Created, validate dung schema ClassSchema.",
            status="active"
        )
        tc_class_2 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-02: Them hoc sinh vao lop hoc",
            file_path="api/test_classes.py",
            function_name="test_enroll_student_to_class",
            expected_result="He thong phan hoi HTTP 200 OK va thong bao 'added'.",
            status="active"
        )
        tc_class_3 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-03: Cap nhat trang thai nhap hoc",
            file_path="api/test_classes.py",
            function_name="test_update_enrollment_status",
            expected_result="He thong phan hoi HTTP 200 OK va thong bao 'updated'.",
            status="active"
        )
        tc_class_4 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-04: Diem danh hoc sinh",
            file_path="api/test_classes.py",
            function_name="test_take_attendance_flow",
            expected_result="He thong phan hoi HTTP 200 OK va thong bao chua 'saved'.",
            status="active"
        )
        tc_class_5 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-05: Lay bao cao diem danh",
            file_path="api/test_classes.py",
            function_name="test_get_class_attendance_report",
            expected_result="He thong phan hoi HTTP 200 OK va tra ve du lieu diem danh.",
            status="active"
        )
        db.add_all([tc_class_1, tc_class_2, tc_class_3, tc_class_4, tc_class_5])

        # =========================================================
        # SUITE 3: API Student Management
        # Maps to: qa_core/tests/api/test_students.py
        # =========================================================
        suite_student_api = TestSuite(
            name="API Student (Student Management API)", 
            description="Kiem thu cac Endpoint API quan ly ho so hoc sinh, tiep nhan hoc sinh moi va phan chia lop hoc."
        )
        db.add(suite_student_api)
        await db.flush()

        tc_student_1 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-01: Tiep nhan hoc sinh moi va validate schema",
            file_path="api/test_students.py",
            function_name="test_create_student_and_validate_schema",
            expected_result="He thong phan hoi HTTP 201 Created va ghi nhan hoc sinh moi vao DB.",
            status="active"
        )
        tc_student_2 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-02: Tra cuu thong tin hoc sinh theo ID",
            file_path="api/test_students.py",
            function_name="test_get_student_detail",
            expected_result="He thong phan hoi HTTP 200 OK chua thong tin day du cua hoc sinh.",
            status="active"
        )
        tc_student_3 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-03: Lay danh sach hoc sinh co phan trang",
            file_path="api/test_students.py",
            function_name="test_list_students_pagination",
            expected_result="He thong phan hoi HTTP 200 OK va tra ve danh sach hoc sinh kem thong tin phan trang.",
            status="active"
        )
        tc_student_4 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-04: Cap nhat thong tin hoc sinh",
            file_path="api/test_students.py",
            function_name="test_update_student_profile",
            expected_result="He thong phan hoi HTTP 200 OK va phan anh thong tin da cap nhat.",
            status="active"
        )
        tc_student_5 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-05: Xoa hoc sinh va kiem tra cascade",
            file_path="api/test_students.py",
            function_name="test_delete_student_cascade",
            expected_result="He thong phan hoi HTTP 200 OK va khong tim thay hoc sinh sau do.",
            status="active"
        )
        tc_student_6 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-06: Bao loi khi tao hoc sinh trung Email",
            file_path="api/test_students.py",
            function_name="test_create_duplicate_email_error",
            expected_result="He thong phan hoi HTTP 400 Bad Request va canh bao email da ton tai.",
            status="active"
        )
        db.add_all([tc_student_1, tc_student_2, tc_student_3, tc_student_4, tc_student_5, tc_student_6])

        # =========================================================
        # SUITE 4: UI Login
        # Maps to: qa_core/tests/ui/specs/auth.spec.ts
        # STRATEGY: function_name = Playwright test title (dung truc tiep voi -g filter)
        # =========================================================
        suite_ui_login = TestSuite(
            name="UI Login (Authentication User Interface)", 
            description="Kiem thu giao dien nguoi dung cho trang dang nhap cua cong quan tri EduMaster."
        )
        db.add(suite_ui_login)
        await db.flush()

        tc_ui_login_1 = TestCase(
            suite_id=suite_ui_login.id,
            title="TC-UI-LOG-01: Dang nhap thanh cong va dieu huong",
            file_path="ui/specs/auth.spec.ts",
            function_name="should login successfully with valid credentials",
            expected_result="Nguoi dung duoc chuyen huong den /admin va thay 'Dashboard Overview'.",
            status="active"
        )
        tc_ui_login_2 = TestCase(
            suite_id=suite_ui_login.id,
            title="TC-UI-LOG-02: Dang nhap that bai hien thi loi",
            file_path="ui/specs/auth.spec.ts",
            function_name="should show error with invalid credentials",
            expected_result="Hien thi thong bao loi 'Login failed. Please check your credentials.'",
            status="active"
        )
        tc_ui_login_3 = TestCase(
            suite_id=suite_ui_login.id,
            title="TC-UI-LOG-03: Kiem tra Validation form",
            file_path="ui/specs/auth.spec.ts",
            function_name="should show validation errors for empty fields",
            expected_result="Hien thi thong bao yeu cau nhap Email va Password.",
            status="active"
        )
        db.add_all([tc_ui_login_1, tc_ui_login_2, tc_ui_login_3])

        # =========================================================
        # SUITE 5: UI Student Management
        # Maps to: qa_core/tests/ui/specs/student.spec.ts
        # STRATEGY: function_name = Playwright test title (independent tests)
        # =========================================================
        suite_ui_student = TestSuite(
            name="UI Student (Student Management User Interface)", 
            description="Kiem thu giao dien quan ly ho so hoc sinh, tim kiem nang cao."
        )
        db.add(suite_ui_student)
        await db.flush()

        tc_ui_student_1 = TestCase(
            suite_id=suite_ui_student.id,
            title="TC-UI-STU-01: Them hoc sinh moi qua UI thanh cong",
            file_path="ui/specs/student.spec.ts",
            function_name="should create a new student successfully",
            expected_result="Hoc sinh moi xuat hien trong bang sau khi tao.",
            status="active"
        )
        tc_ui_student_2 = TestCase(
            suite_id=suite_ui_student.id,
            title="TC-UI-STU-02: Tim kiem hoc sinh (seed API truoc khi search)",
            file_path="ui/specs/student.spec.ts",
            function_name="should search for a student provisioned via API",
            expected_result="Ket qua tim kiem hien thi dung hoc sinh da seed qua API.",
            status="active"
        )
        db.add_all([tc_ui_student_1, tc_ui_student_2])

        # =========================================================
        # SUITE 6: UI Class Management
        # Maps to: qa_core/tests/ui/specs/class.spec.ts
        # STRATEGY: describe.serial -> phai chay ca suite theo thu tu
        # function_name = None -> chay ca spec file, khong dung -g filter
        # =========================================================
        suite_ui_class = TestSuite(
            name="UI Class (Class Management User Interface)", 
            description="Kiem thu flow quan ly lop hoc (serial: Tao -> Enroll -> Diem danh -> Xoa)."
        )
        db.add(suite_ui_class)
        await db.flush()

        tc_ui_class_1 = TestCase(
            suite_id=suite_ui_class.id,
            title="TC-UI-CLS-01: Full flow quan ly lop hoc (Create -> Enroll -> Attendance -> Delete)",
            file_path="ui/specs/class.spec.ts",
            function_name=None,
            expected_result="Toan bo flow tao lop, enroll hoc sinh, diem danh va xoa lop thanh cong.",
            status="active"
        )
        db.add_all([tc_ui_class_1])

        # =========================================================
        # SUITE 7: API LMS Management
        # Maps to: qa_core/tests/api/test_lms.py
        # =========================================================
        suite_api_lms = TestSuite(
            name="API LMS (Learning Management System API)", 
            description="Kiem thu cac Endpoint API quan ly he thong hoc tap, bai giang, khoa hoc."
        )
        db.add(suite_api_lms)
        await db.flush()

        tc_api_lms_1 = TestCase(
            suite_id=suite_api_lms.id,
            title="TC-LMS-01: Verify creating a text lesson in LMS",
            file_path="api/test_lms.py",
            function_name="test_create_text_lesson",
            expected_result="He thong phan hoi HTTP 201 Created.",
            status="active"
        )
        tc_api_lms_2 = TestCase(
            suite_id=suite_api_lms.id,
            title="TC-LMS-02: Verify creating a document lesson (PDF) in LMS",
            file_path="api/test_lms.py",
            function_name="test_create_document_lesson",
            expected_result="He thong phan hoi HTTP 201 Created, ho tro multi-part upload.",
            status="active"
        )
        tc_api_lms_3 = TestCase(
            suite_id=suite_api_lms.id,
            title="TC-LMS-03: Verify fetching lessons for a course",
            file_path="api/test_lms.py",
            function_name="test_get_lessons",
            expected_result="He thong phan hoi HTTP 200 OK va tra ve danh sach bai giang.",
            status="active"
        )
        tc_api_lms_4 = TestCase(
            suite_id=suite_api_lms.id,
            title="TC-LMS-04: Verify creating a video lesson",
            file_path="api/test_lms.py",
            function_name="test_create_video_lesson",
            expected_result="He thong phan hoi HTTP 201 Created voi content_type video.",
            status="active"
        )
        tc_api_lms_5 = TestCase(
            suite_id=suite_api_lms.id,
            title="TC-LMS-05: Verify assigning quiz to lesson",
            file_path="api/test_lms.py",
            function_name="test_create_quiz_for_lesson",
            expected_result="He thong phan hoi HTTP 201 Created va gan quiz vao lesson_id.",
            status="active"
        )
        db.add_all([tc_api_lms_1, tc_api_lms_2, tc_api_lms_3, tc_api_lms_4, tc_api_lms_5])

        # =========================================================
        # SUITE 8: UI Class Attendance
        # Maps to: qa_core/tests/ui/specs/class-attendance.spec.ts
        # =========================================================
        suite_ui_attendance = TestSuite(
            name="UI Attendance (Class Attendance)", 
            description="Kiem thu giao dien tinh nang diem danh, xem ma QR cho tung lop hoc."
        )
        db.add(suite_ui_attendance)
        await db.flush()

        tc_ui_att_1 = TestCase(
            suite_id=suite_ui_attendance.id,
            title="TC-UI-ATT-01: Create session and mark student present",
            file_path="ui/specs/class-attendance.spec.ts",
            function_name="should create an attendance session and mark student as present",
            expected_result="Danh dau diem danh thanh cong tren UI.",
            status="active"
        )
        tc_ui_att_2 = TestCase(
            suite_id=suite_ui_attendance.id,
            title="TC-UI-ATT-02: Display QR Code modal",
            file_path="ui/specs/class-attendance.spec.ts",
            function_name="should display QR code modal successfully",
            expected_result="Modal ma QR hien thi hop le tren man hinh.",
            status="active"
        )
        tc_ui_att_3 = TestCase(
            suite_id=suite_ui_attendance.id,
            title="TC-UI-ATT-03: Mark student as Absent",
            file_path="ui/specs/class-attendance.spec.ts",
            function_name="should mark student as Absent and save",
            expected_result="Trang thai Absent duoc luu va hien thi tren bang diem danh.",
            status="active"
        )
        tc_ui_att_4 = TestCase(
            suite_id=suite_ui_attendance.id,
            title="TC-UI-ATT-04: Mark student as Late",
            file_path="ui/specs/class-attendance.spec.ts",
            function_name="should mark student as Late and save",
            expected_result="Trang thai Late duoc luu va hien thi tren bang diem danh.",
            status="active"
        )
        tc_ui_att_5 = TestCase(
            suite_id=suite_ui_attendance.id,
            title="TC-UI-ATT-05: View attendance report",
            file_path="ui/specs/class-attendance.spec.ts",
            function_name="should display attendance report after saving session",
            expected_result="Tab Reports hien thi Attendance Summary va nut Export CSV.",
            status="active"
        )
        db.add_all([tc_ui_att_1, tc_ui_att_2, tc_ui_att_3, tc_ui_att_4, tc_ui_att_5])

        # =========================================================
        # SUITE 9: UI LMS Lesson Management
        # Maps to: qa_core/tests/ui/specs/lms-lesson.spec.ts
        # =========================================================
        suite_ui_lms = TestSuite(
            name="UI LMS (Lesson Management)", 
            description="Kiem thu giao dien tao bai giang, upload file hoc lieu trong he thong LMS."
        )
        db.add(suite_ui_lms)
        await db.flush()

        tc_ui_lms_1 = TestCase(
            suite_id=suite_ui_lms.id,
            title="TC-UI-LMS-01: Create a text lesson",
            file_path="ui/specs/lms-lesson.spec.ts",
            function_name="should create a text lesson successfully",
            expected_result="Bai giang text duoc luu lai vao he thong thanh cong.",
            status="active"
        )
        tc_ui_lms_2 = TestCase(
            suite_id=suite_ui_lms.id,
            title="TC-UI-LMS-02: Create a PDF lesson with file upload",
            file_path="ui/specs/lms-lesson.spec.ts",
            function_name="should create a PDF document lesson with file upload",
            expected_result="Bai giang kem file PDF duoc upload va luu thanh cong.",
            status="active"
        )
        tc_ui_lms_3 = TestCase(
            suite_id=suite_ui_lms.id,
            title="TC-UI-LMS-03: Create a video lesson",
            file_path="ui/specs/lms-lesson.spec.ts",
            function_name="should create a video lesson successfully",
            expected_result="Bai giang video duoc luu voi external URL thanh cong.",
            status="active"
        )
        db.add_all([tc_ui_lms_1, tc_ui_lms_2, tc_ui_lms_3])

        await db.commit()
        print("Seeded successfully!")
        print("\nMapping strategy:")
        print("  API tests       : function_name = Python function name (chay voi ::function_name)")
        print("  UI auth/student : function_name = Playwright test title (chay voi -g 'title')")
        print("  UI class serial : function_name = None (chay ca spec file)")

if __name__ == "__main__":
    asyncio.run(seed())
