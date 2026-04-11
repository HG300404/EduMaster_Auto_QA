# Hướng dẫn Luồng làm việc TDD (Setup & Run Tests)

## ⚡ Bảng tra cứu nhanh (Cheatsheet)

| Hành động | Câu lệnh / Script |
| :--- | :--- |
| **Bật môi trường (Background)** | `.\scripts\01_start_env.ps1` |
| **Khởi tạo Database** | `.\scripts\02_init_db.ps1` |
| **Chạy toàn bộ API Test** | `.\scripts\03_run_api.ps1` |
| **Chạy 1 file API cụ thể** | `.\scripts\03_run_api.ps1 "tests/api/test_xyz.py"` |
| **Chạy toàn bộ UI Test** | `.\scripts\04_run_ui.ps1` |
| **Chạy 1 file UI cụ thể** | `.\scripts\04_run_ui.ps1 "xyz.spec.ts"` |
| **Tắt & Dọn dẹp môi trường** | `.\scripts\05_teardown.ps1` |
| **Soi Log Backend (Live)** | `podman logs -f edumaster-backend-test` |
| **Soi Log Frontend (Live)** | `podman logs -f edumaster-frontend-test` |
| **Soi Log Database (Live)** | `podman logs -f edumaster-postgres-test` |
| **Xem log tất cả cùng lúc** | `podman-compose logs -f` |

---

## Vấn đề của cách chạy cũ (Full Stack Run)
Trong giai đoạn đầu của dự án, chúng ta thường dùng lệnh `podman-compose up --abort-on-container-exit`. Lệnh này có nhược điểm lớn khi viết code test (TDD):
1. **Cold Start chậm**: Mỗi lần chạy là một lần Podman phải kiểm tra/build lại image, khởi động Database, đợi Backend/Frontend lên (Healthcheck). Quá trình này có thể tốn từ 30s đến 2 phút.
2. **"Tất cả hoặc không gì cả"**: Lệnh này ép hệ thống phải chạy toàn bộ (`Migrations` -> `API Tests` -> `UI Tests`). Khi bạn đang sửa một file API duy nhất, việc phải đợi Playwright bật browser test UI là vô nghĩa và tốn thời gian.
3. **Mất log tương tác (Interactive Logs)**: Khi test lỗi, logs thường bị che khuất hoặc khó đọc do các tiến trình dọn dẹp (teardown) của Podman đè lên.

## Giải pháp: Tách biệt Môi trường và Thực thi (TDD Workflow)

Để tối ưu hóa trải nghiệm viết test, framework đã được chia thành **5 Script PowerShell (`.ps1`)** độc lập nằm trong thư mục `scripts/`. Nguyên tắc cốt lõi là: **"Bật môi trường 1 lần, Chạy test N lần"**.

---

### Quy trình làm việc hàng ngày

#### Bước 1: Khởi động hệ thống ngầm (Chỉ làm 1 lần vào đầu buổi)
Thay vì chờ đợi mỗi lần test, bạn ném toàn bộ Backend, Frontend và Database xuống chạy ngầm (Background).
```powershell
.\scripts\01_start_env.ps1
```
> [!NOTE]
> Lệnh này sẽ trả lại terminal ngay lập tức. Hãy đợi khoảng 10-15 giây để Database thực sự sẵn sàng trước khi sang Bước 2.

#### Bước 2: Chuẩn bị Database (Làm 1 lần sau khi bật, hoặc khi đổi Schema)
Đảm bảo các bảng dữ liệu (Tables) đã được tạo mới và sẵn sàng cho việc test.
```powershell
.\scripts\02_init_db.ps1
```

#### Bước 3: Chạy Test nhắm mục tiêu (Lặp lại nhiều lần khi viết code)
Bây giờ môi trường đã có sẵn. Bạn sử dụng file `test-runner` như một công cụ bắn test (Client) vào hệ thống đang chạy.

**A. Test API (Pytest):**
```powershell
# Chạy TOÀN BỘ API Tests
.\scripts\03_run_api.ps1

# Chỉ chạy một file test cụ thể (Rất hữu ích khi fix bug)
.\scripts\03_run_api.ps1 "tests/api/test_auth.py"

# Chỉ chạy một hàm test cụ thể
.\scripts\03_run_api.ps1 "tests/api/test_auth.py::test_login_success"
```

**B. Test UI (Playwright):**
```powershell
# Chạy TOÀN BỘ UI Tests
.\scripts\04_run_ui.ps1

# Chỉ chạy file auth.spec.ts
.\scripts\04_run_ui.ps1 "auth.spec.ts"
```

> [!TIP]
> Nhờ cách chia này, thời gian để chạy một hàm test API chỉ mất khoảng **2-3 giây** thay vì 2 phút như trước, vì nó bỏ qua hoàn toàn giai đoạn khởi động container. Ngoài ra, kết quả (In đậm, màu sắc) sẽ hiển thị trực tiếp lên Terminal của bạn cực kỳ rõ ràng.

#### Bước 4: Dọn dẹp (Làm 1 lần vào cuối buổi)
Khi đã code xong và muốn tắt máy, hãy dọn dẹp vùng nhớ của Podman.
```powershell
.\scripts\05_teardown.ps1
```
Lệnh này sẽ xóa sạch các container test và database rác, đảm bảo ngày mai bạn có một môi trường "sạch tinh tươm" (Clean State).
