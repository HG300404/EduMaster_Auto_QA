# Hướng dẫn Xử lý lỗi & Bảo trì (Troubleshooting & Maintenance)

Tài liệu này giúp bạn tự giải quyết các vấn đề thường gặp và cách mở rộng bộ test.

## 1. Các lỗi thường gặp (Common Issues)

### Lỗi 1: `Port already in use` (Cổng đã bị chiếm)
- **Triệu chứng**: Chạy `01_start_env.ps1` báo lỗi cổng 5432 hoặc 5173 đã bị sử dụng.
- **Nguyên nhân**: Bạn đang chạy Docker Desktop hoặc một database PostgreSQL khác trên máy thật.
- **Xử lý**: 
    - Tắt Docker Desktop hoàn toàn.
    - Hoặc chạy lệnh `podman-compose down` của các dự án khác trước khi chạy test này.

### Lỗi 2: `No such table` (Thiếu bảng trong Database)
- **Triệu chứng**: Test API báo lỗi 500 hoặc log backend báo không thấy bảng.
- **Xử lý**: 
    - Chạy lại `.\scripts\02_init_db.ps1`.
    - Nếu vẫn lỗi, hãy thử xóa database để làm lại từ đầu: `podman volume rm edumaster_auto_qa_postgres_data`.

### Lỗi 3: `Playwright Timeout` (Test UI bị treo hoặc không tìm thấy thông báo)
- **Triệu chứng**: Báo lỗi `Timeout 30000ms exceeded` hoặc `element(s) not found` mặc dù giao diện có vẻ đúng.
- **Nguyên nhân**: 
    - Frontend chưa khởi động kịp.
    - **Race Condition**: Các thư viện UI như Ant Design có hiệu ứng animation (fade-in). Playwright có thể kiểm tra quá nhanh trước khi thông báo kịp hiện ra hoàn toàn trong DOM.
- **Xử lý**: 
    - Sử dụng `await page.waitForTimeout(2000)` sau các hành động kích hoạt thông báo (như nhấn Log in).
    - Kiểm tra logs trình duyệt để xem có lỗi JS nào ngăn cản việc render không.
    - Thử tăng timeout trong `playwright.config.ts`.

---

## 2. Cách thêm Test case mới (Adding New Tests)

### Thêm API Test mới
1. Tạo file mới trong `tests/api/test_[module_name].py`.
2. Sử dụng `APIClient` để gọi request.
3. Luôn dùng `pytest.fixture` để tự động hóa việc lấy token đăng nhập.

### Thêm UI Test mới
1. Định nghĩa Page Object trong `tests/ui/pages/[PageName].ts`.
2. Viết kịch bản test trong `tests/ui/specs/[feature].spec.ts`.
3. **Lưu ý**: Nên sử dụng `page.getByPlaceholder` hoặc `page.getByText` nếu không muốn rebuild lại image frontend.

---

## 3. Quản lý Môi trường (.env)

Các biến quan trọng:
- `POSTGRES_DB`: Tên database test (mặc định: `edumaster_test`).
- `FLASK_APP`: `app` (để chạy migration).
- `BASE_URL`: URL của frontend (mặc định: `http://frontend:80`).

---

## 4. Xem Báo cáo (Viewing Reports)
Sau khi chạy UI test, báo cáo được sinh ra tại:
- **HTML**: Mở thư mục `playwright-report` -> Mở `index.html` bằng trình duyệt.
- **JUnit**: File `reports/ui-results.xml` (dùng để tích hợp CI/CD).
