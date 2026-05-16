Hãy đóng vai trò là Senior Automation & DevOps Engineer, tiến hành thực thi "Phase 5: Optimize" cho dự án.

MỤC TIÊU:
Tối ưu hóa tốc độ chạy test bằng cơ chế Parallel, thêm tính năng nhận diện Flaky Test (auto-retry) và phục vụ file tĩnh (Screenshots/Videos của Playwright).

HÃY THỰC THI CÁC BƯỚC SAU:

1. TỐI ƯU HOÁ THỰC THI (PARALLEL & RETRY):
- Cập nhật hàm command thực thi `pytest` trong `qa_backend/app/tasks/test_tasks.py`.
- Thêm cờ chạy song song sử dụng thư viện `pytest-xdist` (ví dụ: `-n 2`).
- Thêm cờ auto-retry sử dụng `pytest-rerunfailures` (ví dụ: `--reruns 2`). Đảm bảo lệnh shell nhận diện và nạp các plugin này nếu có cấu hình trong DB.

2. PHỤC VỤ ARTIFACTS TĨNH (STATIC FILES):
- Playwright thường sinh ra screenshot, video trong thư mục `playwright-report/` hoặc `test-results/`.
- Cấu hình `qa_backend/app/main.py` mount một đường dẫn tĩnh (StaticFiles) trỏ tới thư mục volume `qa_core/test-results` để Frontend có thể lấy được URL hình ảnh/video trực tiếp (Ví dụ: `http://localhost:8001/artifacts/video.webm`).
- Cập nhật `report_parser.py` để lấy được đường dẫn (relative path) của các file đính kèm này từ report và lưu vào model `TestResult.screenshot_path` / `TestResult.video_path`.

3. THỐNG KÊ DASHBOARD (FRONTEND):
- Tại `qa_backend`, bổ sung API `GET /metrics/dashboard` trả về tỷ lệ Pass/Fail, tổng số test đã chạy và duration trung bình.
- Tại `qa_frontend`, tích hợp thư viện `Recharts` (hoặc Chart.js). Hiển thị biểu đồ tròn (Pie chart) thống kê Pass/Fail và biểu đồ cột thời gian chạy ngay trên màn hình Dashboard.

YÊU CẦU NGHIÊM NGẶT:
- Xử lý lock file cẩn thận khi chạy parallel (tránh race condition ghi file json/log).
- Đảm bảo FastAPI bảo mật các tệp tĩnh, không cho phép directory traversal.
