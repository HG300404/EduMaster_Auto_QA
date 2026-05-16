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
        print("Cleaning up existing Test Suites and Test Cases to avoid duplication...")
        # Clear existing suites and test cases safely with CASCADE
        await db.execute(text("TRUNCATE test_suites, test_cases, test_runs, test_results RESTART IDENTITY CASCADE;"))
        await db.commit()

        # --- SUITE 1: API Login (Authentication API) ---
        suite_auth_api = TestSuite(
            name="API Login (Authentication API)", 
            description="Bao gồm các kịch bản kiểm thử bảo mật, định danh và xác thực tài khoản thông qua API."
        )
        db.add(suite_auth_api)
        await db.flush()
        
        tc_auth_1 = TestCase(
            suite_id=suite_auth_api.id, 
            title="TC-AUTH-01: Đăng nhập thành công (Positive case)", 
            file_path="api/test_login.py", 
            function_name="test_login_success",
            expected_result="Hệ thống phản hồi HTTP 200 OK và trả về Access Token hợp lệ.",
            status="active"
        )
        tc_auth_2 = TestCase(
            suite_id=suite_auth_api.id, 
            title="TC-AUTH-02: Đăng nhập thất bại do sai mật khẩu (Negative case)", 
            file_path="api/test_login.py", 
            function_name="test_login_invalid_password",
            expected_result="Hệ thống phản hồi HTTP 401 Unauthorized với thông báo lỗi 'Bad email or password'.",
            status="active"
        )
        tc_auth_3 = TestCase(
            suite_id=suite_auth_api.id, 
            title="TC-AUTH-03: Đăng nhập thất bại với tài khoản không tồn tại (Negative case)", 
            file_path="api/test_login.py", 
            function_name="test_login_non_existent_user",
            expected_result="Hệ thống phản hồi HTTP 401 Unauthorized.",
            status="active"
        )
        tc_auth_4 = TestCase(
            suite_id=suite_auth_api.id, 
            title="TC-AUTH-04: Lấy thông tin cá nhân sau khi đăng nhập thành công", 
            file_path="api/test_login.py", 
            function_name="test_get_me_after_login",
            expected_result="Hệ thống phản hồi HTTP 200 OK chứa thông tin tài khoản đăng nhập.",
            status="active"
        )
        db.add_all([tc_auth_1, tc_auth_2, tc_auth_3, tc_auth_4])

        # --- SUITE 2: API Class Management ---
        suite_class_api = TestSuite(
            name="API Class (Class Management API)", 
            description="Kiểm thử các Endpoint API quản lý lớp học bao gồm tạo mới, tra cứu và cập nhật lớp học."
        )
        db.add(suite_class_api)
        await db.flush()

        tc_class_1 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-01: Tạo khóa học mới thành công",
            file_path="api/test_classes.py",
            function_name="test_create_course_success",
            expected_result="Hệ thống phản hồi HTTP 201 Created và trả về ID khóa học.",
            status="active"
        )
        tc_class_2 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-02: Tạo lớp học mới thành công",
            file_path="api/test_classes.py",
            function_name="test_create_class_success",
            expected_result="Hệ thống phản hồi HTTP 201 Created và hiển thị thông tin chi tiết của lớp học.",
            status="active"
        )
        tc_class_3 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-03: Thêm học sinh vào lớp học",
            file_path="api/test_classes.py",
            function_name="test_enroll_student",
            expected_result="Hệ thống phản hồi HTTP 200 OK và thông báo 'Student added'.",
            status="active"
        )
        tc_class_4 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-04: Cập nhật trạng thái nhập học",
            file_path="api/test_classes.py",
            function_name="test_update_enrollment_status",
            expected_result="Hệ thống phản hồi HTTP 200 OK và thông báo 'Status updated'.",
            status="active"
        )
        tc_class_5 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-05: Điểm danh học sinh",
            file_path="api/test_classes.py",
            function_name="test_take_attendance",
            expected_result="Hệ thống phản hồi HTTP 200 OK và thông báo chứa 'saved'.",
            status="active"
        )
        tc_class_6 = TestCase(
            suite_id=suite_class_api.id,
            title="TC-CLS-06: Lấy báo cáo điểm danh",
            file_path="api/test_classes.py",
            function_name="test_get_attendance_report",
            expected_result="Hệ thống phản hồi HTTP 200 OK và trả về dữ liệu điểm danh.",
            status="active"
        )
        db.add_all([tc_class_1, tc_class_2, tc_class_3, tc_class_4, tc_class_5, tc_class_6])

        # --- SUITE 3: API Student Management ---
        suite_student_api = TestSuite(
            name="API Student (Student Management API)", 
            description="Kiểm thử các Endpoint API quản lý hồ sơ học sinh, tiếp nhận học sinh mới và phân chia lớp học."
        )
        db.add(suite_student_api)
        await db.flush()

        tc_student_1 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-01: Tiếp nhận học sinh mới thành công",
            file_path="api/test_students.py",
            function_name="test_create_student_success",
            expected_result="Hệ thống phản hồi HTTP 201 Created và ghi nhận học sinh mới vào DB.",
            status="active"
        )
        tc_student_2 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-02: Tiếp nhận học sinh thất bại do trùng Email",
            file_path="api/test_students.py",
            function_name="test_create_student_duplicate_email",
            expected_result="Hệ thống phản hồi HTTP 400 Bad Request và cảnh báo email đã tồn tại.",
            status="active"
        )
        tc_student_3 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-03: Tra cứu thông tin học sinh theo mã định danh",
            file_path="api/test_students.py",
            function_name="test_get_student_by_id",
            expected_result="Hệ thống phản hồi HTTP 200 OK chứa thông tin đầy đủ của học sinh.",
            status="active"
        )
        tc_student_4 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-04: Lấy danh sách học sinh có phân trang",
            file_path="api/test_students.py",
            function_name="test_list_students_pagination",
            expected_result="Hệ thống phản hồi HTTP 200 OK và trả về danh sách học sinh kèm thông tin phân trang.",
            status="active"
        )
        tc_student_5 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-05: Cập nhật thông tin học sinh",
            file_path="api/test_students.py",
            function_name="test_update_student",
            expected_result="Hệ thống phản hồi HTTP 200 OK và phản ánh thông tin đã cập nhật.",
            status="active"
        )
        tc_student_6 = TestCase(
            suite_id=suite_student_api.id,
            title="TC-STU-06: Xóa học sinh (Admin Only)",
            file_path="api/test_students.py",
            function_name="test_delete_student",
            expected_result="Hệ thống phản hồi HTTP 200 OK và không tìm thấy học sinh sau đó.",
            status="active"
        )
        db.add_all([tc_student_1, tc_student_2, tc_student_3, tc_student_4, tc_student_5, tc_student_6])

        # --- SUITE 4: UI Login ---
        suite_ui_login = TestSuite(
            name="UI Login (Authentication User Interface)", 
            description="Kiểm thử giao diện người dùng cho trang đăng nhập của cổng quản trị EduMaster."
        )
        db.add(suite_ui_login)
        await db.flush()

        tc_ui_login_1 = TestCase(
            suite_id=suite_ui_login.id,
            title="TC-UI-LOG-01: Đăng nhập thành công và điều hướng",
            file_path="ui/specs/auth.spec.ts",
            function_name="test_ui_login_success",
            expected_result="Người dùng được chuyển hướng đến /admin và thấy 'Dashboard Overview'.",
            status="active"
        )
        tc_ui_login_2 = TestCase(
            suite_id=suite_ui_login.id,
            title="TC-UI-LOG-02: Đăng nhập thất bại hiển thị lỗi",
            file_path="ui/specs/auth.spec.ts",
            function_name="test_ui_login_fail_invalid_credentials",
            expected_result="Hiển thị thông báo lỗi 'Login failed. Please check your credentials.'",
            status="active"
        )
        tc_ui_login_3 = TestCase(
            suite_id=suite_ui_login.id,
            title="TC-UI-LOG-03: Kiểm tra Validation form",
            file_path="ui/specs/auth.spec.ts",
            function_name="test_ui_login_validation",
            expected_result="Hiển thị thông báo yêu cầu nhập Email và Password.",
            status="active"
        )
        db.add_all([tc_ui_login_1, tc_ui_login_2, tc_ui_login_3])

        # --- SUITE 5: UI Student Management ---
        suite_ui_student = TestSuite(
            name="UI Student (Student Management User Interface)", 
            description="Kiểm thử giao diện quản lý hồ sơ học sinh, tìm kiếm nâng cao và thay đổi lớp học."
        )
        db.add(suite_ui_student)
        await db.flush()

        tc_ui_student_1 = TestCase(
            suite_id=suite_ui_student.id,
            title="TC-UI-STU-01: Kiểm tra hiển thị bảng danh sách học sinh",
            file_path="ui/specs/student.spec.ts",
            function_name="test_ui_student_list_render",
            expected_result="Bảng hiển thị đầy đủ danh sách học sinh với các cột Code, Name, Phone, Level, Status.",
            status="active"
        )
        tc_ui_student_2 = TestCase(
            suite_id=suite_ui_student.id,
            title="TC-UI-STU-02: Thêm học sinh mới qua Modal",
            file_path="ui/specs/student.spec.ts",
            function_name="test_ui_student_create_via_modal",
            expected_result="Thông báo 'Student created successfully' và học sinh mới xuất hiện trong bảng.",
            status="active"
        )
        tc_ui_student_3 = TestCase(
            suite_id=suite_ui_student.id,
            title="TC-UI-STU-03: Chỉnh sửa thông tin học sinh",
            file_path="ui/specs/student.spec.ts",
            function_name="test_ui_student_edit",
            expected_result="Thông báo thành công và dữ liệu mới được cập nhật trong bảng.",
            status="active"
        )
        db.add_all([tc_ui_student_1, tc_ui_student_2, tc_ui_student_3])

        # --- SUITE 6: UI Class Management (Keep as placeholder) ---
        suite_ui_class = TestSuite(
            name="UI Class (Class Management User Interface)", 
            description="Kiểm thử giao diện tương tác người dùng cho trang danh sách lớp học, thêm lớp mới thông qua Modal."
        )
        db.add(suite_ui_class)
        await db.flush()

        tc_ui_class_1 = TestCase(
            suite_id=suite_ui_class.id,
            title="Kiểm tra hiển thị bảng danh sách lớp học",
            file_path="ui/specs/class.spec.ts",
            function_name="test_ui_class_list_render",
            expected_result="Bảng hiển thị đầy đủ danh sách các lớp học hiện có với thông tin phân trang hoạt động mượt mà.",
            status="active"
        )
        tc_ui_class_2 = TestCase(
            suite_id=suite_ui_class.id,
            title="Thêm lớp học mới thông qua Modal Form thành công",
            file_path="ui/specs/class.spec.ts",
            function_name="test_ui_class_create_submit",
            expected_result="Sau khi lưu form trên Modal, lớp học mới hiển thị ngay lập tức lên dòng đầu tiên của danh sách bảng.",
            status="active"
        )
        db.add_all([tc_ui_class_1, tc_ui_class_2])

        await db.commit()
        print("Successfully seeded all Test Suites & Test Cases from documentation into PostgreSQL DB!")

if __name__ == "__main__":
    asyncio.run(seed())
