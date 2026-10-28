# BÁO CÁO TỔNG THỂ VỀ HỆ THỐNG AUTO QA - EDUMASTER
**TÀI LIỆU TOÀN DIỆN: CẤU TRÚC - XÂY DỰNG - VẬN HÀNH**

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
Hệ thống kiểm thử này được thiết kế theo nguyên lý **Container-first**, sử dụng **Podman** để tạo môi trường kiểm thử hoàn toàn độc lập với môi trường phát triển chính.

### Công nghệ cốt lõi:
- **Infrastructure**: Podman & Podman-Compose (Điều phối 4 dịch vụ/container).
- **Backend Test**: Python + Pytest (Kiểm tra API).
- **Frontend Test**: TypeScript + Playwright (Kiểm tra UI - mô phỏng hành vi người dùng).
- **Automation Layer**: PowerShell (Bộ công cụ điều khiển quy trình TDD).

---

## 2. KIẾN TRÚC VÀ XÂY DỰNG (BUILD ARCHITECTURE)

### 2.1 File `podman-compose.yml` (Hạ tầng)
Đây là "trái tim" của framework, định nghĩa các dịch vụ:
- `postgres-test`: Database sạch, khởi tạo từ đầu cho mỗi đợt test.
- `backend`: Chạy mã nguồn Flask (Backend chính).
- `frontend`: Chạy mã nguồn React (Frontend chính - Served by Nginx).
- `test-runner`: Container chứa toàn bộ môi trường chạy test (Playwright, Pytest). 
    - **Cơ chế volume**: Gắn kết các file `.ts`, `.py`, `.env` từ máy thật vào container để cập nhật code test tức thì mà không cần rebuild container.

### 2.2 Quy trình Build (Build Process)
Sử dụng mô hình đa tầng (multi-stage) trong Dockerfile:
1.  **Frontend**: Build bằng Vite -> Nginx phục vụ file tĩnh.
2.  **Backend**: Cài đặt dependencies từ `requirements.txt` -> Chạy qua `entrypoint.sh` để đảm bảo kết nối DB.
3.  **Test-runner**: Cài đặt Playwright Browsers và Python Pytest.

---

## 3. CẤU TRÚC THƯ MỤC (PROJECT STRUCTURE)

```markdown
EduMaster_Auto_QA/
├── scripts/                # Tập lệnh PowerShell (01-05) điều khiển hạ tầng
├── tests/                  # Mã nguồn kiểm thử
│   ├── api/                # Kiểm thử API (Pytest + APIClient)
│   └── ui/                 
│       ├── pages/          # Page Object Model (POM) - Khai báo phần tử UI
│       └── specs/          # Test script thực tế (Playwright)
├── Docs/                   # Tài liệu hướng dẫn & thiết kế hệ thống
│   ├── COMPREHENSIVE_GUIDE.md # Báo cáo tổng thể
│   ├── activity_diagrams.md  # Sơ đồ hoạt động (Activity Diagrams)
│   ├── sequence_diagrams.md  # Sơ đồ trình tự (Sequence Diagrams)
│   ├── system_architecture.md # Kiến trúc hệ thống
│   └── flow_analysis.md      # Phân tích luồng chạy thực tế
├── reports/                # Nơi xuất báo cáo (JUnit XML, HTML)
├── playwright-report/      # Báo cáo HTML trực quan của Playwright
├── podman-compose.yml      # Định nghĩa hạ tầng container
├── playwright.config.ts    # Cấu hình Playwright (Timeout, Reporter)
└── pytest.ini              # Cấu hình Pytest
```

---

## 4. CẤU HÌNH VÀ VẬN HÀNH (CONFIG & LIFECYCLE)

### 4.1 Quản lý cấu hình
- **`.env`**: Lưu trữ URL của Backend và Frontend.
- **`playwright.config.ts`**: Thiết lập timeout (30s), số lượng worker (2-4), và các thiết bị chạy test (Chromium).
- **`pytest.ini`**: Thiết lập các marker (smoke, regression) và chế độ chạy verbose.

### 4.2 Quy trình 5 bước tự động hóa (The Lifecycle)
1.  `01_start_env.ps1`: Kéo/Build Image và khởi động 3 dịch vụ phụ thuộc.
2.  `02_init_db.ps1`: Tự động chạy Migration và Seed dữ liệu mẫu vào DB Test.
3.  `03_run_api.ps1`: Thực thi bộ test Backend.
4.  `04_run_ui.ps1`: Thực thi bộ test Frontend (Playwright).
5.  `05_teardown.ps1`: Hủy bỏ container để giải phóng RAM/CPU.

---

## 5. BÁO CÁO VÀ KẾT QUẢ HIỆN TẠI (REPORT & STATUS)

### 5.1 Trạng thái kiểm thử (Honest Report)
Dựa trên các đợt chạy gần nhất:
- **API Tests (Auth)**: **Pass 100%**. Bao gồm đăng nhập thành công và kiểm tra Token.
- **API Tests (Students)**: **Pass 100%**. Bao gồm CRUD học sinh và phân trang (6 test cases).
- **API Tests (Classes)**: **Pass 100%**. Bao gồm tạo Course/Room, tạo lớp, đăng ký học sinh và điểm danh (5 test cases).
- **UI Tests (Login)**: **Pass 2/3**. 
    - ✅ **Thành công**: Đăng nhập và vào Dashboard ok.
    - ✅ **Validation**: Kiểm tra để trống các trường dữ liệu ok.
    - ❌ **Đăng nhập sai**: Đang gặp vấn đề về đồng bộ khi thư viện Ant Design xóa thông báo quá nhanh trong quá trình interceptor hoạt động.

### 5.2 Hệ thống báo cáo
- **Playwright HTML Report**: Cung cấp cái nhìn trực quan, có ảnh chụp màn hình lúc lỗi tại `playwright-report/index.html`.
- **JUnit/Allure**: Sẵn sàng tích hợp vào CI/CD (GitLab) để theo dõi tiến độ theo thời gian.

---

## 6. GHI CHÚ BẢO TRÌ (MAINTENANCE NOTES)

- **POM (Page Object Model)**: Khi frontend thay đổi tên Class hoặc ID, chỉ cần sửa trong thư mục `tests/ui/pages/`.
- **Schema Validation**: Toàn bộ phản hồi API được kiểm tra nghiêm ngặt qua Pydantic Schemas trong `tests/api/schemas.py`.
- **Race Condition**: Đã cấu hình timeout linh hoạt để xử lý các hiệu ứng animation của Ant Design.
- **Interceptor Bug**: Đã tìm ra nguyên nhân 401 gây reload trang trong `client.ts` - cần lưu ý khi mở rộng sang các module khác.

---

## 7. DANH SÁCH KỊCH BẢN KIỂM THỬ (TEST CASES)

### 7.1 Kiểm thử API (Backend)
| Mã TC | Tên kịch bản | Mô tả | Trạng thái |
| :--- | :--- | :--- | :--- |
| **TC-AUTH-01/04** | Authentication | Đăng nhập và xác thực Token. | ✅ Pass |
| **TC-STU-01/06** | Student Management | Toàn bộ luồng CRUD học sinh & Phân trang. | ✅ Pass |
| **TC-CLS-01/06** | LMS Management | Tạo Course/Room, Lớp học, Đăng ký & Điểm danh. | ✅ Pass |

### 7.2 Kiểm thử UI (Frontend)
| Mã TC | Tên kịch bản | Các bước chính | Trạng thái |
| :--- | :--- | :--- | :--- |
| **TC-UI-LOG-01** | Luồng Login chuẩn | Nhập đúng -> Click Login -> Vào Dashboard. | ✅ Pass |
| **TC-UI-LOG-03** | Form Validation | Để trống trường -> Báo lỗi đỏ tại chỗ (Ant Design). | ✅ Pass |
| **TC-UI-LOG-02** | Login sai thông tin | Nhập sai -> Hiển thị thông báo "Login failed". | ❌ Fail* |

*\*Lưu ý: Lỗi TC-UI-LOG-02 hiện tại là do xung đột thời gian hiển thị (Race Condition) trong môi trường container, không phải lỗi logic của tính năng.*

---
© 2026 EDUMASTER - Tài liệu tổng thể cho hệ thống kiểm thử tự động.
