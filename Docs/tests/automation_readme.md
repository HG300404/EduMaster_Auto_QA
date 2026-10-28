# EDUMASTER Automation — Run Guide (Phase 4)

Hướng dẫn chạy smoke vs full regression cho framework `EduMaster_Auto_QA`.

## Prerequisites

- Podman Desktop / Podman CLI
- Edumaster SUT checkout tại `../edumaster_podman/edumaster` (hoặc set `EDUMASTER_ROOT`)
- PowerShell (Windows) hoặc bash (Linux/CI)

## Lifecycle

```powershell
.\scripts\01_start_env.ps1      # podman-compose up --build
.\scripts\02_init_db.ps1        # flask db upgrade on SUT
```

**Seed QA portal** (idempotent, không xóa run history):

```powershell
podman exec qa-backend python3 /app/seed_incremental.py
```

> Không chạy `seed.py` trừ khi cần reset toàn bộ QA DB.

## Smoke vs Regression

| Suite | Phạm vi | Khi nào chạy |
|-------|---------|--------------|
| **Smoke** | `pytest -m smoke` + Playwright `@smoke` | PR, CI, kiểm tra nhanh |
| **Regression** | Toàn bộ `tests/api` + `tests/ui/specs` | Nightly, trước release |

### Windows (PowerShell)

```powershell
.\scripts\run-smoke.ps1          # API smoke + UI @smoke + seed_incremental
.\scripts\run-regression.ps1     # Full API + full UI
.\scripts\03_run_api.ps1 -Smoke  # Chỉ API smoke
.\scripts\04_run_ui.ps1 -Smoke   # Chỉ UI smoke
```

### Linux / trong container `qa-backend`

```bash
bash /app/scripts/run-tests.sh smoke
bash /app/scripts/run-tests.sh regression
bash /app/scripts/run-tests.sh api-smoke
bash /app/scripts/run-tests.sh ui-smoke
```

## Coverage (Phase 1–3)

### API smoke (`@pytest.mark.smoke`)

| Module | File |
|--------|------|
| CRM | `test_crm.py` |
| Finance | `test_finance.py` |
| File Upload | `test_file_upload.py` |
| Reporting | `test_reporting.py` |
| Study Abroad | `test_study_abroad.py` |

### UI smoke (`@smoke`)

| Module | Spec |
|--------|------|
| CRM | `crm-lead-flow.spec.ts` |
| Finance | `finance-invoicing.spec.ts` |
| File Upload | `file-upload.spec.ts` |
| Reporting | `reporting.spec.ts` |
| Study Abroad | `study-abroad-workflow.spec.ts` |

### Core regression (không gắn smoke)

- API: `test_login.py`, `test_students.py`, `test_classes.py`, `test_lms.py`, `test_health.py`
- UI: `auth.spec.ts`, `student.spec.ts`, `class.spec.ts`, `class-attendance.spec.ts`, `lms-lesson.spec.ts`

## Known SUT limitations (xfail / skip)

| Case | Hành vi QA |
|------|------------|
| TC-FILE-04 presigned URL | `pytest.xfail` khi SUT trả 500 |
| CRM `Role` import bug | `pytest.xfail` (API) / `test.skip` (UI) |

Không sửa code Edumaster từ repo QA — chỉ ghi nhận limitation.

## CI (GitHub Actions)

Workflow: `.github/workflows/ci-smoke.yml`

1. Checkout `EduMaster_Auto_QA`
2. Checkout Edumaster SUT → `./edumaster` (cần biến repo `EDUMASTER_REPOSITORY`)
3. `podman-compose up -d --build`
4. `seed_incremental.py`
5. `run-tests.sh smoke`
6. Upload artifacts từ `qa_core/reports/`

### Cấu hình repo

| Variable / Secret | Mô tả |
|-------------------|--------|
| `EDUMASTER_REPOSITORY` | Ví dụ `your-org/edumaster` |
| `EDUMASTER_ROOT` | Mặc định `./edumaster` trong CI |

## Reports

| Output | Path |
|--------|------|
| API JUnit | `qa_core/reports/api-smoke-results.xml` |
| UI JUnit | `qa_core/reports/ui-smoke-results.xml` |
| Playwright HTML | `qa_core/playwright-report/` |

## Teardown

```powershell
.\scripts\05_teardown.ps1
```
