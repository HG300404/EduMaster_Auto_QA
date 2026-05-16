Kế hoạch Triển khai Hệ thống Quản lý Test Tự động (Enterprise Architecture)
Hệ thống được thiết kế theo kiến trúc Microservices-lite, giải quyết triệt để vấn đề "Blocking API" khi chạy các kịch bản test tốn nhiều thời gian (E2E Test) thông qua hệ thống Task Queue và cung cấp trải nghiệm theo dõi tiến độ Realtime bằng WebSocket.

1. Tổng quan Kiến trúc
Luồng hoạt động chuẩn của hệ thống: Frontend (React) -> POST /run-test -> FastAPI (API Gateway) -> Tạo TestRun (DB) -> Push job vào Redis (Task Queue). Từ đây, API lập tức phản hồi HTTP 200/202 cho Frontend.

Chạy ngầm (Background): Worker (Celery/RQ) lấy job từ Redis -> Kích hoạt chạy Pytest / Playwright -> Push real-time log qua Redis Pub/Sub -> FastAPI WebSocket -> React UI. Sau khi chạy xong: Worker -> Parse Report (Normalize) -> Lưu kết quả vào PostgreSQL.

2. Tech Stack Chi Tiết
Frontend: React (Vite) + TypeScript + Tailwind CSS + HeroUI + React Query + Zustand.
Backend: Python (FastAPI) + SQLAlchemy.
Database: PostgreSQL.
Task Queue & Pub/Sub: Redis (Message Broker) + Celery hoặc RQ (Worker).
Core Automation: Pytest, Playwright.
Infrastructure: Podman + Podman Compose (5 services: frontend, backend, postgres, redis, worker).
3. Cấu trúc Thư mục Chuẩn (Monorepo)
text
EduMaster_Auto_QA/
├── backend/
│   ├── app/
│   │   ├── api/          # Các HTTP endpoints & WebSocket routes
│   │   ├── core/         # Configs (.env, redis config, DB config)
│   │   ├── models/       # SQLAlchemy models (Project, TestCase, TestRun...)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Business logic
│   │   ├── tasks/        # Định nghĩa các Celery/RQ jobs (chạy test)
│   │   ├── workers/      # File cấu hình khởi chạy Worker
│   │   ├── utils/        # report_parser.py (chuẩn hóa log), logger
│   │   └── main.py       
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── modules/      # Feature-based (testRun, testCase, dashboard)
│   │   ├── hooks/        # Custom hooks (e.g., useWebSocket)
│   │   ├── api/          # Axios instances & queries
│   │   ├── types/        # TypeScript interfaces
│   │   ├── components/   # UI chung (HeroUI)
│   │   ├── layouts/      
│   │   ├── pages/        
│   │   └── main.tsx      
│   ├── package.json
│   └── vite.config.ts
│
├── tests/                # Core Auto QA (giữ nguyên)
│   ├── ui/               # Playwright tests
│   ├── api/              # Pytest tests
│   ├── results/          # Nơi Worker lưu file report (JSON/HTML) tạm thời
│   └── logs/             # Nơi lưu raw logs 
│
└── podman-compose.yml    # Định nghĩa 5 services
4. Thiết kế Database & Quản lý Log
Bên cạnh các bảng cốt lõi (Project, TestSuite, TestCase, TestRun), hệ thống được bổ sung:

TestResult: Lưu chi tiết (status, error_message, screenshot_path, video_path, duration, log_file_path).
TestStep: Log chi tiết từng bước ở mức độ high-level (test_result_id, step_name, status).
Chiến lược lưu trữ Log tối ưu (Tránh Bloat DB):

Vì test UI (đặc biệt là Playwright) sinh ra lượng log khổng lồ (verbose log, trace), tuyệt đối không lưu toàn bộ raw log vào PostgreSQL. Việc này sẽ làm phình to DB, giảm hiệu năng query nghiêm trọng.
Giải pháp:
Database (PostgreSQL): Chỉ lưu metadata, trạng thái kết quả, các thông báo lỗi vắn tắt (error snippet) và đường dẫn file log (log_file_path).
File System (Volume): Ghi toàn bộ raw log ra file dạng text/JSON và lưu tại thư mục tests/logs/. Khi người dùng muốn xem log chi tiết, FastAPI sẽ đọc từ file này và trả về Frontend.
5. Core Engine & Normalize Report
Vì Pytest (thường xuất XML/JSON riêng) và Playwright (có JSON/HTML reporter riêng) có output khác biệt, Worker sau khi chạy xong (vd: pytest tests/ui --json-report --output=report.json) bắt buộc phải gọi qua một lớp Adapter (utils/report_parser.py).

Output chuẩn hóa trước khi lưu vào Database:

json
{
  "test_name": "...",
  "status": "pass/fail/skipped",
  "steps": [],
  "error": "...",
  "duration": 123
}
6. Lộ trình Triển khai (Phased Approach)
Phase 1 - Setup Base: Tạo podman-compose.yml (Postgres, Redis), khởi tạo base FastAPI và React TypeScript.
Phase 2 - Backend Core: Xây dựng DB Schema, CRUD API cơ bản cho TestCase/Project. Tích hợp Celery/RQ + Redis worker.
Phase 3 - Test Execution: Code tính năng "Trigger Test" đẩy job vào Worker, viết class report_parser.py và lưu log vào Database.
Phase 4 - UI & Realtime: Cài đặt WebSocket đẩy log từ Worker -> Redis PubSub -> FastAPI -> React (Test Run Detail View). Hoàn thiện Dashboard.
Phase 5 - Optimize: Thêm Parallel execution, Flaky detection, và các tính năng nâng cao.