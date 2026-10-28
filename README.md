# EDUMASTER Auto QA Framework

Hệ thống kiểm thử tự động (Auto QA) cho Edumaster — **Podman**, **Playwright** (UI), **Pytest** (API), **QA Portal** (TMS).

## Project structure

```
EduMaster_Auto_QA/
├── qa_core/tests/          # Pytest + Playwright specs
├── qa_backend/             # TMS API, seed_incremental.py
├── qa_frontend/            # QA portal UI
├── scripts/                # Lifecycle + smoke/regression runners
├── podman-compose.yml      # SUT + TMS stack
└── Docs/tests/             # Run guides
```

## Quick start (Windows)

```powershell
.\scripts\01_start_env.ps1
.\scripts\02_init_db.ps1
.\scripts\run-smoke.ps1
```

## Test suites (Phase 4)

| Command | Scope |
|---------|--------|
| `.\scripts\run-smoke.ps1` | Business modules — API `@smoke` + UI `@smoke` (~28 cases) |
| `.\scripts\run-regression.ps1` | Full API + all UI specs (core + business) |

Chi tiết: [Docs/tests/automation_readme.md](Docs/tests/automation_readme.md)

## Coverage status

### Business modules (Phase 1–3) — smoke ready

| Phase | API | UI |
|-------|-----|-----|
| CRM + Finance | ✅ | ✅ |
| File Upload + Reporting | ✅ | ✅ |
| Study Abroad / XKLĐ | ✅ | ✅ (1 workflow smoke) |

### Core modules (regression)

| Module | API | UI |
|--------|-----|-----|
| Auth / Login | ✅ | ✅ |
| Students / Classes / LMS | ✅ | ✅ |
| Attendance | — | ✅ |

## Seed rule

- **Use:** `podman exec qa-backend python3 /app/seed_incremental.py` (idempotent upsert)
- **Avoid:** `seed.py` on existing environments (TRUNCATE wipes run history)

## CI

GitHub Actions workflow `.github/workflows/ci-smoke.yml` runs smoke on PR when `EDUMASTER_REPOSITORY` is configured.

## Environment

- SUT path: `EDUMASTER_ROOT` (default `../edumaster_podman/edumaster`)
- QA portal: http://localhost:3001
- QA API: http://localhost:8001

---
© 2026 EDUMASTER — Automation Framework Phase 4
