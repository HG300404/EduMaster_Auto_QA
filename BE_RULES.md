# Các Quy Tắc Chuẩn (Rules) Dành Cho Backend (FastAPI)

Để đảm bảo hiệu suất cao, dễ bảo trì và giảm thiểu tối đa lỗi (bug) trong quá trình phát triển Backend bằng FastAPI và Python, toàn bộ mã nguồn phải tuân thủ nghiêm ngặt các nguyên tắc sau:

## 1. Cấu Trúc & Kiến Trúc (Architecture)
*   **Phân tách trách nhiệm (Separation of Concerns):** Tuyệt đối không viết logic xử lý dữ liệu (business logic) trực tiếp trong file định nghĩa API (Router/Endpoint). Phải tách thành các lớp:
    *   `api/` (Routers): Chỉ nhận Request, gọi Service, và trả về Response.
    *   `services/` (Business Logic): Xử lý tính toán, gọi DB.
    *   `models/`: Định nghĩa Database schema (SQLAlchemy).
    *   `schemas/`: Định nghĩa Pydantic models để validate in/out.
*   **Dependency Injection:** Luôn sử dụng `Depends()` của FastAPI để tiêm (inject) Database Session. Không khởi tạo Session một cách thủ công (global session) để tránh rò rỉ kết nối (memory leak).

## 2. Xử Lý Dữ Liệu & Type Hinting
*   **100% Type Hints:** Bắt buộc sử dụng Type Hint của Python cho toàn bộ tham số hàm và kiểu trả về (ví dụ: `def get_user(db: Session, user_id: int) -> UserSchema:`).
*   **Pydantic Validation:** Mọi dữ liệu đầu vào (Body, Query, Path) và dữ liệu đầu ra (Response) đều phải được định nghĩa bằng Pydantic Model. Không dùng `dict` hay `Any` làm response type.

## 3. Xử Lý Lỗi (Error Handling)
*   **Global Exception Handler:** Sử dụng cơ chế bắt lỗi tập trung (Global Exception Handler) cho toàn ứng dụng.
*   **Chuẩn hóa Response:** Mọi lỗi (400, 401, 404, 500) phải trả về cùng một format chuẩn.
    *   *Ví dụ:* `{"success": false, "error_code": "NOT_FOUND", "message": "User không tồn tại", "data": null}`
*   **Log Lỗi Chi Tiết:** Các lỗi server (500) phải được log lại đầy đủ traceback (sử dụng thư viện `logging`) nhưng tuyệt đối **không** được trả chi tiết traceback về cho phía Client (bảo mật).

## 4. Database (PostgreSQL & SQLAlchemy)
*   **AsyncDB:** Ưu tiên sử dụng `asyncpg` để kết nối non-blocking tới PostgreSQL.
*   **Connection Pooling:** Bắt buộc cấu hình pool size cho SQLAlchemy để tránh sập DB khi có lượng truy cập đồng thời lớn.
*   **Database Migrations:** Mọi thay đổi về cấu trúc bảng (thêm/sửa cột) bắt buộc phải dùng **Alembic**. Không sửa trực tiếp trên DB.

## 5. Tương Tác Với Core Tests (Pytest/Playwright)
*   **Non-blocking Execution:** Do test tự động tốn nhiều thời gian, khi Backend gọi lệnh chạy test (trigger), bắt buộc phải dùng thư viện bất đồng bộ như `asyncio.create_subprocess_exec` hoặc đưa vào Background Tasks/Message Queue (Celery). **Tuyệt đối không dùng `os.system` hay `subprocess.run`** chặn Event Loop của FastAPI.
*   **Timeout & Kill Process:** Các tiến trình chạy test phải được set `timeout`. Nếu quá thời gian, Backend phải tự động kill process đó để giải phóng RAM/CPU.

## 6. Bảo Mật & Biến Môi Trường (Environment)
*   **Quản lý config:** Sử dụng `pydantic-settings` để quản lý và validate các biến từ file `.env`. Nếu thiếu biến môi trường quan trọng, app sẽ crash ngay lúc khởi động (Fail-fast) thay vì lỗi khi đang chạy.
*   **Bảo mật API:** Các API nội bộ quản lý test case cần phải được bảo vệ (Authorization/Authentication cơ bản).
