############################################################
EDUMASTER CONTAINERIZED AUTOMATION TEST FRAMEWORK GENERATOR
(Podman + Playwright + Pytest)
############################################################
 
You are Antigravity (AI developer assistant).
 
Your mission is to generate a fully containerized automation testing framework for the EDUMASTER system.
 
System architecture:
- Backend: Flask
- Frontend: React
- Database: PostgreSQL
- Deployment: Render (production)
- Local / CI testing must run using Podman.
 
All automation tests must run inside isolated containers using Podman.
 
Use only free and open-source tools.
 
Testing stack:
 
UI Testing → Playwright (TypeScript)
API Testing → Pytest (Python)
Container runtime → Podman
Container orchestration → Podman Compose
CI → GitHub Actions
 
 
############################################################
1. PROJECT DISCOVERY
############################################################
 
Analyze the repository and detect:
 
- backend entrypoint
- frontend framework (Vite / CRA)
- API base path
- environment variables
- database configuration
- existing migrations (Alembic or SQLAlchemy)
 
Generate discovery documentation:
 
docs/tests/project_test_discovery.md
 
 
############################################################
2. CONTAINERIZED TEST INFRASTRUCTURE
############################################################
 
Generate Podman-based test infrastructure.
 
Create directory:
 
tests/infrastructure/
 
Create containers:
 
postgres-test
backend-test
frontend-test
test-runner
 
Create Podman compose stack:
 
podman-compose.yml
 
Services:
 
postgres-test
    image: postgres:15
    environment:
        POSTGRES_DB=edumaster_test
        POSTGRES_USER=test
        POSTGRES_PASSWORD=test
 
backend-test
    build: backend/
    environment:
        DATABASE_URL=postgresql://test:test@postgres-test:5432/edumaster_test
 
frontend-test
    build: frontend/
    environment:
        VITE_API_URL=http://backend-test:5000
 
test-runner
    build: tests/infrastructure/test-runner
    depends_on:
        - postgres-test
        - backend-test
        - frontend-test
 
 
############################################################
3. TEST RUNNER CONTAINER
############################################################
 
Generate Dockerfile compatible with Podman:
 
tests/infrastructure/test-runner/Dockerfile
 
Must install:
 
node
playwright
python
pytest
pytest-xdist
faker
requests
 
Install browsers:
 
npx playwright install chromium
 
Entry command must run:
 
./scripts/run-tests.sh
 
 
############################################################
4. PLAYWRIGHT UI TEST FRAMEWORK
############################################################
 
Generate UI tests under:
 
tests/ui/
 
Structure:
 
tests/ui/pages
tests/ui/specs
tests/ui/fixtures
 
Use Page Object Model.
 
Pages to generate:
 
LoginPage
DashboardPage
StudentPage
ClassPage
CoursePage
PortalPublicPage
 
Generate tests:
 
auth.spec.ts
student-crud.spec.ts
class-attendance.spec.ts
lms-lesson.spec.ts
crm-lead-flow.spec.ts
file-upload.spec.ts
 
 
############################################################
5. PLAYWRIGHT CONFIGURATION
############################################################
 
Generate:
 
playwright.config.ts
 
Settings:
 
browser: chromium
headless in CI
retries: 2
reporters:
  html
  junit
 
Artifacts:
 
screenshots
trace
video
 
 
############################################################
6. PYTEST API TEST FRAMEWORK
############################################################
 
Generate:
 
tests/api/
 
Files:
 
conftest.py
test_auth.py
test_students.py
test_classes.py
test_lms.py
test_crm.py
 
Fixtures:
 
api_client
admin_token
student_token
db_seed
 
Use Faker for test data.
 
Use AAA test pattern.
 
 
############################################################
7. DATABASE TEST STRATEGY
############################################################
 
Test database must be isolated.
 
Use postgres-test container.
 
Generate migration script:
 
tests/infrastructure/migrate_test_db.py
 
Strategy:
 
If Alembic exists → run migrations.
Else → create_all() for SQLAlchemy models.
 
Provide cleanup hooks.
 
 
############################################################
8. TEST DATA GENERATION
############################################################
 
Generate reusable data helpers.
 
tests/utils/
 
Use Faker for:
 
names
emails
phones
addresses
 
 
############################################################
9. NETWORK STABILITY
############################################################
 
UI tests must intercept analytics.
 
Example:
 
page.route("**/analytics/**", route => route.abort())
 
 
############################################################
10. SECURITY TESTS
############################################################
 
Generate API tests verifying:
 
unauthorized access
expired tokens
RBAC restrictions
 
 
############################################################
11. PERFORMANCE GUARDRAILS
############################################################
 
Add API assertions:
 
response_time < 1000ms
 
 
############################################################
12. TEST EXECUTION SCRIPTS
############################################################
 
Generate scripts:
 
scripts/run-tests.sh
 
Commands:
 
pytest tests/api
npx playwright test
 
 
############################################################
13. LOCAL EXECUTION
############################################################
 
Provide command:
 
podman-compose up --build --abort-on-container-exit
 
Tests must run automatically.
 
 
############################################################
14. CI/CD USING PODMAN
############################################################
 
Generate GitHub Actions workflows.
 
.github/workflows/ci-tests.yml
 
Steps:
 
checkout
install podman
build containers
podman-compose up --abort-on-container-exit
 
Upload artifacts:
 
playwright-report
screenshots
junit.xml
 
 
############################################################
15. DOCUMENTATION
############################################################
 
Generate:
 
docs/tests/automation_readme.md
 
Include:
 
how to install podman
how to run tests
how CI works
how to add new tests
 
 
############################################################
16. FINAL VALIDATION
############################################################
 
Verify:
 
containers build
tests run
reports generated
 
Generate report:
 
docs/tests/framework_generation_report.md
 
 
############################################################
FINAL INSTRUCTION
############################################################
 
Generate all files required for this containerized test framework.
 
Do not overwrite existing application code.
 
Ensure tests can run with one command:
 
podman-compose up --abort-on-container-exit
 
Output final message:
 
"EDUMASTER PODMAN AUTOMATION TEST FRAMEWORK GENERATED."