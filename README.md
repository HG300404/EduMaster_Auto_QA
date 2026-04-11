# EDUMASTER Auto QA Framework

Hệ thống kiểm thử tự động (Auto QA) toàn diện cho dự án EDUMASTER, sử dụng **Podman**, **Playwright**, và **Pytest**. Framework này được thiết kế theo mô hình Container-first để đảm bảo tính độc lập và nhất quán của môi trường test.

## 📂 Cấu trúc dự án (Project Structure)

- `scripts/`: Bộ công cụ PowerShell (01-05) điều khiển toàn bộ lifecycle của môi trường test.
- `tests/`: 
    - `api/`: Kiểm thử API bằng Python (Pytest + Pydantic Schema Validation).
    - `ui/`: Kiểm thử UI bằng TypeScript (Playwright + POM).
- `Docs/`: Tài liệu chi tiết về SRS, kịch bản kiểm thử (Test Cases) và hướng dẫn vận hành.
- `reports/`: Lưu trữ báo cáo kết quả kiểm thử (XML, HTML).

## 🛠 Yêu cầu hệ thống (Prerequisites)

- **OS**: Windows 10/11.
- **Hạ tầng**: [Podman Desktop](https://podman-desktop.io/) hoặc Podman CLI.
- **PowerShell**: Version 5.1 hoặc mới hơn.

## 🚀 Quy trình vận hành (TDD Workflow)

Hệ thống được tự động hóa qua 5 bước chính:

1.  **Khởi động môi trường**: `.\scripts\01_start_env.ps1` (Build & Start containers).
2.  **Khởi tạo dữ liệu**: `.\scripts\02_init_db.ps1` (Migration & Seed dữ liệu sạch).
3.  **Chạy Test API**: `.\scripts\03_run_api.ps1` (Thực thi toàn bộ bộ test Backend).
4.  **Chạy Test UI**: `.\scripts\04_run_ui.ps1` (Thực thi bộ test Frontend qua Playwright).
5.  **Dọn dẹp**: `.\scripts\05_teardown.ps1` (Hủy bỏ container để giải phóng tài nguyên).

## 🧪 Trạng thái Kiểm thử hiện tại (Current Status)

Hệ thống đã hoàn thiện khung và bộ test cho các module cốt lõi:

- **API Coverage (Pass 100%)**:
    - ✅ **Authentication**: Đăng nhập, xác thực Token.
    - ✅ **Student Management**: CRUD học sinh, quản lý hồ sơ, phân trang.
    - ✅ **LMS Management (Classes/Courses)**: Tạo khóa học, lớp học, đăng ký học sinh và điểm danh.
- **UI Coverage (Đang phát triển)**:
    - ✅ **Login flow**: Thành công và Validation form.
    - 🚧 **LMS Modules**: Đang trong quá trình chuyển đổi kịch bản sang automation code.

## 📊 Báo cáo (Reporting)

- **API**: Kết quả hiển thị trực tiếp trên Console và được lưu vào `reports/`.
- **UI**: Báo cáo HTML trực quan với ảnh chụp màn hình/video lỗi tại `playwright-report/index.html`.

---
© 2026 EDUMASTER - Advanced Educational CRM Automation
