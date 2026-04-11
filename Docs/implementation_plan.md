# Podman Automation Test Framework Implementation Plan

This plan outlines the steps to build a fully containerized automated testing framework for the EDUMASTER system (Flask backend + React frontend + PostgreSQL) using Podman, based on the `built_qa_automation_fw_.md` prompt.

## User Review Required
> [!IMPORTANT]
> The strategy has pivoted to a **100% Containerized approach using Podman and Podman Compose**. Please review the structure below to ensure it aligns with your desired architecture before we begin code generation.

## Proposed Changes

### 1. Infrastructure & Test Runner
Set up the core Podman orchestration and the dedicated test-runner image. This includes mocking services (MailHog, LocalStack/MinIO) for async tasks.
**Configuration:** Ensure `podman-compose.yml` includes `healthcheck` (e.g., `curl -f http://localhost:5000/health`) so tests only run when services are ready.
#### [NEW] podman-compose.yml
#### [NEW] tests/infrastructure/test-runner/Dockerfile
#### [NEW] tests/infrastructure/migrate_test_db.py
#### [NEW] scripts/run-tests.sh
#### [NEW] scripts/teardown-data.sh (Redis/MinIO Cleanup)

### 2. UI Automation Framework (Playwright)
Set up the TypeScript Playwright environment and Page Object Models. Includes Visual Regression mapping and A11y (axe-core) audits.
**Configuration:** 
- Parallel execution: `workers: process.env.CI ? 4 : 2`
- Retry & Trace: `retries: process.env.CI ? 2 : 0`, `trace: 'on-first-retry'`
- Tagging: `@smoke`, `@regression`
- Logging: Screenshots, videos, and traces on failure
- Network stability: Intercept and block analytics
#### [NEW] playwright.config.ts
#### [NEW] tests/ui/fixtures/test-data.ts
#### [NEW] tests/ui/pages/LoginPage.ts
#### [NEW] tests/ui/pages/DashboardPage.ts
#### [NEW] tests/ui/pages/StudentPage.ts
#### [NEW] tests/ui/pages/ClassPage.ts
#### [NEW] tests/ui/pages/CoursePage.ts
#### [NEW] tests/ui/pages/PortalPublicPage.ts
#### [NEW] tests/ui/specs/auth.spec.ts
#### [NEW] tests/ui/specs/student-crud.spec.ts
#### [NEW] tests/ui/specs/class-attendance.spec.ts
#### [NEW] tests/ui/specs/lms-lesson.spec.ts
#### [NEW] tests/ui/specs/crm-lead-flow.spec.ts
#### [NEW] tests/ui/specs/file-upload.spec.ts
#### [NEW] tests/ui/specs/visual-regression.spec.ts
#### [NEW] tests/ui/specs/a11y-audit.spec.ts

### 3. API Automation Framework (Pytest)
Set up the Python Pytest environment and API test files. Includes specific tests for Unauthorized Access, CORS, JWT Expiry, N+1 Query tracking, and Latency Guardrails (p95 < 500ms).
**Configuration:**
- Parallel execution: `pytest -n auto`
- Retry: `--reruns 1`
- Tagging: `@pytest.mark.smoke`, `@pytest.mark.regression`, `@pytest.mark.slow`
- Data Isolation: **Transaction rollback per test case using `db.session.begin_nested()`** to ensure the shared container database remains clean.
- Logging: Log request/response payload when tests fail
#### [NEW] tests/api/conftest.py
#### [NEW] tests/utils/data_helpers.py (Faker utilities)
#### [NEW] tests/api/test_auth.py
#### [NEW] tests/api/test_students.py
#### [NEW] tests/api/test_classes.py
#### [NEW] tests/api/test_lms.py
#### [NEW] tests/api/test_crm.py
#### [NEW] tests/api/test_security_compliance.py (AuthZ, CORS, JWT)
#### [NEW] tests/api/test_performance.py (Latency & N+1 queries)
#### [NEW] tests/api/test_contract.py (Contract Testing via schema validation)

### 4. Load Testing (k6)
Setup k6 for concurrent user and response time load testing.
#### [NEW] tests/load/load-test.js

### 5. Environment Strategy & CI/CD
Configure GitHub actions to use Podman, manage secrets, and define environment profiles.
**Configuration:**
- Environment Strategy: Define `local` (dev test), `ci` (automation), and `staging` (pre-prod). Fail fast if required variables are missing.
- Secrets Management: Use GitHub Secrets, never hardcode credentials (e.g., `ADMIN_PASSWORD`), inject via env.
#### [NEW] .vscode/settings.json (Optional: to enforce env vars locally)
#### [NEW] .github/workflows/ci-tests.yml
#### [NEW] docs/tests/project_test_discovery.md
#### [NEW] docs/tests/automation_readme.md
#### [NEW] docs/tests/framework_generation_report.md

## Verification Plan

### Automated Tests
- Run `podman-compose up --build --abort-on-container-exit` locally to ensure the stack builds and runs the test runner securely.
- Ensure the `tests/infrastructure/test-runner/Dockerfile` successfully installs Node, Playwright, Python, and Pytest without dependency conflicts.

### Manual Verification
- Review the generated documentation files (`automation_readme.md` and `framework_generation_report.md`).
- Check that the API test files include performance and security assertions as requested.
