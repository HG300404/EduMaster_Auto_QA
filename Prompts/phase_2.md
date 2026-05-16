Act as a Senior Backend Engineer and implement "Phase 2: Backend Core" for the existing FastAPI project (qa_backend).

---

### OBJECTIVE:
Design database schema and implement core CRUD APIs for Test Management entities.

---

### MANDATORY REQUIREMENTS (from BE_RULES.md):

- 100% type hints for all functions
- Use Dependency Injection (Depends) for database session (AsyncSession with asyncpg)
- All request/response must be validated using Pydantic schemas
- DO NOT write database queries inside API routers
- Business logic MUST be placed inside `services/` layer
- Clean, maintainable, production-ready code

---

# STEP 1 — DEFINE DATABASE MODELS (SQLAlchemy)

Create or update file: `qa_backend/app/models/core_models.py`

Define the following models based on the current implementation:

1. TestSuite:
- id (PK)
- name (string)
- description (string, nullable)

2. TestCase:
- id (PK)
- suite_id (FK → TestSuite.id)
- title (string)
- status (Enum: active, draft)
- file_path (string)
- function_name (string, nullable)
- expected_result (string, nullable)
- created_at (timestamp, server_default=func.now())

3. TestRun:
- id (PK)
- test_case_id (FK → TestCase.id, nullable)
- user_id (FK → User.id, nullable)
- status (Enum: pending, running, completed, failed)
- started_at (timestamp, nullable)
- finished_at (timestamp, nullable)

4. TestResult:
- id (PK)
- test_run_id (FK → TestRun.id)
- test_case_id (FK → TestCase.id, nullable)
- test_name (string)
- status (string)
- duration (float)
- error_message (string, nullable)
- execution_data (string, nullable)
- log_file_path (string, nullable)
- created_at (timestamp, server_default=func.now())

5. User:
- id (PK)
- full_name (string, nullable)
- email (string, unique)
- hashed_password (string)
- role (string)
- created_at (timestamp, server_default=func.now())

---

### Relationships:
- TestSuite → TestCase (one-to-many)
- TestRun → TestResult (one-to-many)
- TestCase → TestResult (one-to-many)

---

# STEP 2 — DEFINE Pydantic SCHEMAS

Create file: `qa_backend/app/schemas/core_schemas.py`

Define schemas for TestSuite, TestCase, TestRun, and TestResult:

- Base schema
- Create schema
- Response schema

Use:
- `model_config = ConfigDict(from_attributes=True)`

---

# STEP 3 — IMPLEMENT CRUD SERVICES

Create:
- `app/services/testcase_service.py`
- `app/services/testrun_service.py`

---

### Required functions in testcase_service:
- get_list(db: AsyncSession, limit: int, offset: int)
- get_by_id(db: AsyncSession, id: int)
- create(db: AsyncSession, payload)

---

# STEP 4 — BUILD API ROUTERS

Create in: `app/api/routers/`
- testcases.py
- testruns.py

---

### Endpoints:
TestCases:
- GET /testcases
- GET /testcases/{id}
- POST /testcases

TestRuns:
- GET /testruns
- GET /testruns/history
- GET /testruns/{id}
- POST /testruns/{testcase_id}/run

---

### Requirements:
- Use Depends(get_db)
- Use Pydantic schemas for input/output
- Wrap ALL responses in standard APIResponse format.

---

# STEP 5 — DATABASE SESSION DEPENDENCY

Ensure existence of `get_db()` dependency returning AsyncSession in `app/db/session.py`.

---

# FINAL OUTPUT REQUIREMENTS:
- Show ALL created/modified files
- Ensure code is complete (no placeholders)
- Follow project structure strictly
- Production-quality, clean architecture