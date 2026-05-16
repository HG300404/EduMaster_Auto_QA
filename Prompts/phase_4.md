Act as a Senior Full-Stack Engineer and implement "Phase 4: UI & Realtime" for the Test Management System.

---

### OBJECTIVE:

Build the React dashboard UI using HeroUI and implement log viewing via HTTP polling.

---

# STEP 1 — FRONTEND SETUP (REACT + HERO UI)

---

### Routing:

Implement React Router:
- `/` → Dashboard
- `/testrun/:id` → TestRunDetail

---

# STEP 2 — DASHBOARD PAGE

---

### Features:

- Fetch test cases via React Query
- Display using HeroUI Table
- Columns: id, title, status, action

---

### Action:

- "Run Test" button:
  - Call `POST /testruns/{id}/run`
  - Redirect to `/testrun/{run_id}`

---

# STEP 3 — TEST RUN DETAIL PAGE (LOG VIEWING)

---

### UI:

- Terminal-style log viewer:
  - Dark background (#000)
  - Monospace font
  - Green/white text

---

### Behavior:

- Fetch Test Run details (including logs array) using React Query.
- Use `refetchInterval` (e.g. 1500ms) to poll for updates while the status is "pending" or "running".
- Display logs and auto-scroll to bottom.

---

### On Test Completion:

- Stop polling when status becomes "completed" or "failed".
- Display final results, duration, and any errors.

---

# STEP 4 — UI REQUIREMENTS

- Use ONLY HeroUI + Tailwind
- Clean spacing (8px grid)
- Rounded corners (8–12px)

---

# FINAL OUTPUT REQUIREMENTS:
- Show all modified backend + frontend files
- Ensure UI updates correctly via polling
- Production-quality structure