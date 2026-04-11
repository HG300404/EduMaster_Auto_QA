# Hướng dẫn Hạ tầng & Thiết lập (Infrastructure & Setup)

Tài liệu này hướng dẫn cách vận hành hệ thống container phục vụ cho việc kiểm thử tự động (Auto QA) của dự án EDUMASTER.

## 1. Kiến trúc Hạ tầng (`podman-compose.yml`)
Hệ thống sử dụng **Podman** để giả lập môi trường chạy thực tế một cách độc lập:
- **`postgres-test`**: Database PostgreSQL 15 riêng biệt, không dùng chung với DB dự án gốc.
- **`backend`**: Flask server (được build từ code dự án mẫu), cấu hình để trỏ vào DB test.
- **`frontend`**: React frontend (được build từ code dự án mẫu), cấu hình proxy để trỏ vào `backend`.
- **`test-runner`**: Container trung tâm chứa môi trường chạy Test (Playwright, Pytest) và các công cụ thực thi Migration.

## 2. Các Script điều khiển (TDD Workflow)

Để tối ưu tốc độ và khả năng gỡ lỗi, quy trình thiết lập được chia làm 5 bước chính:

### Bước 1: Khởi động Môi trường (`01_start_env.ps1`)
Lệnh này bật các service Backend, Frontend và Database lên chạy ngầm (Background). 
```powershell
.\scripts\01_start_env.ps1
```
- **Cơ chế**: Sử dụng `podman-compose up -d`.
- **Đặc điểm**: Chỉ bật các server cần thiết, không chạy ngay bộ test. Do chạy ngầm nên không gây treo Terminal của bạn.
- **Xem Log**: Nếu muốn xem Backend đang in gì, dùng lệnh `podman logs -f edumaster-backend-test`.

### Bước 2: Khởi tạo Dữ liệu (`02_init_db.ps1`)
Lệnh này ra lệnh cho `test-runner` thực hiện việc quét và áp dụng các file Migration từ dự án gốc sang Database test.
```powershell
.\scripts\02_init_db.ps1
```
- **Cơ chế**: Tự động mount thư mục `backend/migrations` của dự án mẫu vào container và chạy lệnh `flask db upgrade`.
- **Trường hợp lỗi**: Nếu các file migration bị hỏng hoặc không tìm thấy, script sẽ tự động dùng SQLAlchemy `create_all()` làm phương án dự phòng (fallback) để đảm bảo bạn luôn có bảng để test.

### Bước 3 & 4: Thực thi Kiểm thử
- **API Tests**: `.\scripts\03_run_api.ps1`
- **UI Tests**: `.\scripts\04_run_ui.ps1`
- Hỗ trợ truyền tham số để chạy từng file hoặc từng hàm lẻ (Xem thêm tại [TDD Workflow Guide](file:///e:/DATTTT/edumaster/EduMaster_Auto_QA/docs/tests/tdd_workflow_guide.md)).

### Bước 5: Dọn dẹp (`05_teardown.ps1`)
Tắt toàn bộ hệ thống và xóa các container rác để làm sạch tài nguyên máy.
```powershell
.\scripts\05_teardown.ps1
```

## 3. Các lưu ý Quan trọng
- **Tính độc lập**: Bạn **không cần stop** docker-compose của dự án mẫu khi chạy test này. Cả hai hệ thống có Network và Database riêng biệt, không hề xung đột cổng (Port).
- **Tuyệt đối không sửa file trực tiếp**: Nếu bạn sửa code Backend/Frontend, hãy chạy lại lệnh `podman-compose build` để cập nhật Image mới trước khi chạy Script 01.
