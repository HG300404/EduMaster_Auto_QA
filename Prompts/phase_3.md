Act as a Senior Backend & DevOps Engineer and implement "Phase 3: Test Execution" for the existing FastAPI project (qa_backend).

---

### OBJECTIVE:

Build a complete non-blocking test execution flow:

API → create TestRun → add background task → execute test via subprocess → write logs to file → parse report → save results to DB.

---

### CORE PRINCIPLES:

- Non-blocking API (return HTTP 202 immediately using FastAPI BackgroundTasks)
- Background task handles all heavy execution
- Clean separation of concerns
- Production-ready error handling and logging

---

# STEP 1 — IMPLEMENT REPORT PARSER

Create file: `qa_backend/app/utils/report_parser.py`

---

### Requirements:

Implement:
function: `parse_pytest_json(file_path: str) -> List[dict]`

- Read pytest JSON report file
- Extract ALL test cases
- Normalize into:
```python
[
  {
    "test_name": str,
    "status": "passed" | "failed" | "skipped",
    "duration": float,
    "error": Optional[str]
  }
]
```

---

# STEP 2 — IMPLEMENT EXECUTION TASK

Create file: `qa_backend/app/tasks/test_tasks.py`

---

### Define function:
`def execute_test_case(test_run_id: int, file_path: str, function_name: str = None)`

---

### Requirements:

1. DATABASE SESSION:
- Create synchronous DB session manually inside task (using `create_engine` and `sessionmaker`) because it runs in a background thread.

2. UPDATE STATUS:
- Set `TestRun.status = "running"`

3. EXECUTE TEST:
- Use `subprocess.Popen`
- Command example:
```bash
pytest {BASE_TEST_DIR}/{file_path} \
  --json-report \
  --json-report-file={REPORT_DIR}/{run_id}.json
```
- If `function_name` is provided, append it to the target: `{file_path}::{function_name}`

4. STREAM LOGS:
- Capture stdout/stderr line-by-line
- Write logs incrementally to: `{LOG_DIR}/run_{test_run_id}.log`

5. PARSE REPORT:
- Call `parse_pytest_json`
- Handle parsing errors safely

6. SAVE RESULTS:
- Insert `TestResult` records for each test in the report.

7. UPDATE TEST RUN:
- Set status to "completed" or "failed" based on results.
- Set `finished_at`.

---

# STEP 3 — IMPLEMENT API ROUTER (TRIGGER TEST)

Update file: `qa_backend/app/api/routers/testruns.py`

---

### Endpoint:
`POST /testruns/{testcase_id}/run`

---

### Flow:

1. Get TestCase by ID
2. Create TestRun with status "pending"
3. Add background task:
   `background_tasks.add_task(execute_test_case, test_run.id, file_path, function_name)`
4. Return HTTP 202 response with `test_run_id`.

---

# FINAL OUTPUT REQUIREMENTS:
- Show ALL created/modified files
- No placeholder code
- Fully working background execution
- Ensure system works with: `podman-compose up`