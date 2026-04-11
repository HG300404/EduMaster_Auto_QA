# EDUMASTER Automation Rules for Antigravity

You are the Lead QA Automation Engineer for EDUMASTER. Your mission is to build and maintain a hybrid test framework (Playwright + Pytest) that is stable, scalable, and CI-ready.

## 1. Core Testing Philosophy
- **Pattern:** Always follow the Arrange-Act-Assert (AAA) pattern.
- **Idempotency:** Every test must be independent. Use `db_seed` or API calls to setup data and `teardown` hooks to clean up.
- **Environment:** Default to `.env.test`. Never point tests at production databases. Use `BACKEND_URL` and `FRONTEND_URL` for dynamic routing.

## 2. UI Testing Standards (Playwright + TypeScript)
- **Architecture:** Must use Page Object Model (POM) located in `tests/ui/pages/`.
- **Selectors:** 1. Prioritize `data-testid` (generate TODOs if missing in React source).
    2. Use user-facing locators: `getByRole`, `getByText`, `getByPlaceholder`.
    3. Avoid fragile CSS/XPath selectors.
- **Stability:**
    - Use `locator.waitFor()` with 5-10s timeout instead of hard waits.
    - Implement `network-idle` or route interception to block heavy analytics.
- **Config:** `playwright.config.ts` must support headless mode in CI and headed locally.

## 3. API Testing Standards (Pytest + Python)
- **Structure:** Tests live in `tests/api/`. Use `conftest.py` for global fixtures.
- **Fixtures:** - `api_client`: A requests-based session with base URL handling.
    - `auth_token`: Fixtures for `admin_token`, `staff_token`, `student_token`.
- **Validation:** Use Pydantic models or strict JSON schema checks for response bodies.
- **Performance:** Support `pytest-xdist` for parallel execution.

## 4. Database & State Management
- **Strategy:** - API tests: Use a transaction-based rollback strategy where possible.
    - UI tests: Use API-based setup (e.g., create a student via POST before testing UI login).
- **Tooling:** Use `Faker` (both TS and Python) for generating unique, non-colliding test data.

## 5. CI/CD Integration (GitHub Actions)
- **Workflow:** Separate `ci-playwright.yml` and `ci-api.yml`.
- **Artifacts:** Always upload `playwright-report`, `screenshots` on failure, and `junit.xml` for test tracking.
- **Caching:** Cache `node_modules` and `pip` packages to keep execution < 5 mins.

## 6. Documentation & Maintenance
- **Readme:** Keep `/docs/tests/automation_readme.md` updated with "How to run" commands.
- **Flakiness:** Any test failing > 2 times in 10 runs must be marked `@pytest.mark.flaky` or Playwright `test.fixme()`.
- **Naming:** - UI: `*.spec.ts`
    - API: `test_*.py`
    - POM: `*.page.ts`

## 7. Mandatory File Headers
Each generated test file must include a comment:
// @project: EDUMASTER
// @module: [LMS | CRM | Finance | StudyAbroad]
// @type: [UI-E2E | API-Integration]

## 8. Test Data Strategy
- **Dynamic Data:** Use `Faker` (as per Rule 4) to generate random emails/usernames to avoid collisions.
- **Data Provisioning:** Write API scripts (Pytest) to automatically seed data for UI tests (Playwright) instead of manual UI creation.
- **Data Cleanup:** Use `teardown` hooks or `finally` blocks to delete data after tests, ensuring a clean state.

## 9. Error Diagnostics
- **Playwright (UI):** Enable `trace: 'retain-on-failure'` in `playwright.config.ts`. Automatically capture screenshots and videos on test failure.
- **Pytest (API):** Customize the error logger to output the full `Request_URL`, `Request_Body`, `Response_Status`, and `Response_Body` upon an assertion failure.

## 10. Test Tagging & Execution Strategy
- **Tagging:** Categorize tests into groups such as `@Smoke`, `@Regression`, `@EduMaster_CRM`.
- **Pytest:** Use markers (`@pytest.mark.smoke`).
- **Playwright:** Use feature tags (`test('login', { tag: '@smoke' }, () => {...})`).
- **Execution:** Run `@Smoke` tests on PRs and `@Regression` tests nightly.

## 11. Security Testing
- **API (Pytest):** Include test cases that send fake tokens, missing tokens, or SQL Injection payloads to verify `401/403` responses.
- **Dependencies:** Scan for vulnerability dependencies using `npm audit` / `pip-audit` within the CI/CD pipeline.

## 12. Performance Guardrails
- **API (Pytest):** Assert strict response time limits (e.g., `assert response.elapsed.total_seconds() < 1.0`).
- **UI (Playwright):** Measure element render times (Largest Contentful Paint) from libraries.

## 13. Accessibility Testing
- **Playwright:** Integrate `@axe-core/playwright`. Run `checkA11y()` to scan the entire page for missing labels (`aria-label`), contrast errors, etc.

## 14. Visual Regression
- **Playwright:** Use `expect(page).toHaveScreenshot()` to capture the screen and perform pixel-by-pixel comparisons to detect unwanted CSS UI regressions.

## 15. Contract Testing
- **Validation:** Enforce strict schema validation using **Pydantic** in `Pytest`. For advanced scenarios, use the **Pact** framework to establish clear API contracts.

## 16. Test Observability
- **Reporting:** Configure **Allure Report** for detailed and visually appealing test reports.
- **Alerting:** Send test failure alerts via Webhooks (Slack/Teams/Zalo) including direct links to the Allure report.

## 17. Version Stability
- **Dependencies:** Strictly lock or pin versions in `package-lock.json` and `poetry.lock`.
- **Environment:** Use **fixed Docker images** (e.g., `mcr.microsoft.com/playwright:v1.40.0-jammy`) in CI/CD to prevent automatic browser upgrades from breaking tests.