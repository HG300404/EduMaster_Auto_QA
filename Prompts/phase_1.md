Act as a Senior Full-Stack & DevOps Engineer and execute "Phase 1: Setup Base" for a Test Management System (TMS) based on the architecture defined in implementation_plan.md.

---

### CURRENT CONTEXT:

- A `podman-compose.yml` file already exists for the SUT (System Under Test) including:
  - postgres-test
  - backend
  - frontend

- Two rule definition files exist at project root:
  - FE_RULES.md
  - BE_RULES.md

---

### CRITICAL REQUIREMENTS:

- STRICTLY follow FE_RULES.md and BE_RULES.md
- DO NOT invent new structure outside defined rules
- Ensure everything runs with `podman-compose up` WITHOUT manual fixes
- Use environment variables for all configs (no hardcoding)

---

# STEP 1 — INITIALIZE QA_BACKEND (FastAPI)

Create a new service: `qa_backend`

### Structure:
qa_backend/
├── app/
│   ├── main.py
│   ├── core/
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── api/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── tasks/
│   └── utils/
├── requirements.txt
└── .env

---

### Requirements:

1. Create `requirements.txt` with:
- fastapi
- uvicorn
- sqlalchemy
- asyncpg
- pydantic
- pydantic-settings
- pytest
- pytest-json-report

---

2. Create `.env` file:

DATABASE_URL=postgresql+asyncpg://postgres:postgres@qa-db:5432/qa_db  

---

3. Implement `app/main.py`:
- FastAPI app initialization
- Include a `/health` endpoint returning status OK

---

4. Setup database:
- Create async SQLAlchemy engine (session.py)
- Create Base declarative (base.py)

---

5. Create execution task module:
- `tasks/test_tasks.py`
- Implement `execute_test_case` to run pytest via subprocess.

---

# STEP 2 — INITIALIZE QA_FRONTEND (React + Vite + HeroUI)

Create `qa_frontend` using:

- React (Vite)
- TypeScript

---

### Setup:

1. Install and configure:
- Tailwind CSS
- HeroUI (as primary component library)

---

2. Create `.env`:

VITE_API_BASE_URL=http://localhost:8001

---

3. Follow STRICT structure from FE_RULES.md:

src/
- modules/
- components/
- layouts/
- hooks/
- api/
- types/

---

4. Create base layout:
- Sidebar (~240px width)
- Topbar (~64px height)

---

# STEP 3 — UPDATE podman-compose.yml

Keep existing SUT services unchanged.

---

### ADD TMS SERVICES:

1. qa-db:
- image: postgres:15
- port: 5433
- environment:
  POSTGRES_DB=qa_db
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=postgres

---

2. qa-backend:
- build: ./qa_backend
- depends_on:
  - qa-db
- env_file:
  - ./qa_backend/.env
- ports:
  - "8001:8000"
- volumes:
  - ./qa_core/tests:/app/tests
  - ./qa_core/reports:/app/reports
- healthcheck:
  test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]

---

3. qa-frontend:
- build: ./qa_frontend
- ports:
  - "3001:5173"
- volumes:
  - ./qa_frontend:/app

---

### NETWORKS:

Define networks:

networks:
  tms-network:
  sut-network:

Ensure:
- TMS services use tms-network
- qa-backend connects to BOTH tms-network and sut-network to reach the SUT.

---

### VOLUMES:

Ensure log persistence:
- ./qa_core/tests/logs mounted into qa-backend

---

# FINAL OUTPUT REQUIREMENT:

- Show all created/updated files
- Ensure project is runnable via:
  podman-compose up
- No missing dependencies
- No placeholder pseudo-code
- Production-quality structure