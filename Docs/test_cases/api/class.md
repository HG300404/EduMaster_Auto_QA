# Test Cases: Class & Course API (LMS)

## 1. Course Management (`/api/course/`)

### TC-CLS-01: Create Course Success
- **Description**: Verify that an admin can create a new course.
- **Steps**:
    1. Send a POST request to `/api/course/`.
    2. Payload: 
       ```json
       {
           "name": "Japanese N5",
           "code": "JPN-N5-001",
           "description": "Basic Japanese course"
       }
       ```
- **Expected Results**:
    - HTTP Status: `201 Created`.
    - Response contains course ID.

---

## 2. Class Management (`/api/class/`)

### TC-CLS-02: Create Class Success
- **Description**: Verify creating a class with valid course and room.
- **Pre-conditions**: Course and Room must exist.
- **Steps**:
    1. Send a POST request to `/api/class/`.
    2. Payload:
       ```json
       {
           "name": "N5 Morning Class",
           "course_id": "<course_id>",
           "room_id": "<room_id>",
           "max_students": 20,
           "schedule": [{"day": 0, "start": "08:00", "end": "10:00"}]
       }
       ```
- **Expected Results**:
    - HTTP Status: `201 Created`.
    - Response matches `ClassSchema`.

---

## 3. Enrollment (`/api/class/<id>/students`)

### TC-CLS-03: Enroll Student
- **Description**: Verify adding an existing student to a class.
- **Steps**:
    1. Send a POST request to `/api/class/<class_id>/students`.
    2. Payload: `{"student_id": "<student_id>", "status": "active"}`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Message: `"Student added"`.

### TC-CLS-04: Update Enrollment Status
- **Description**: Verify changing student status (e.g. to 'completed').
- **Steps**:
    1. Send a PUT request to `/api/class/<class_id>/students/<student_id>`.
    2. Payload: `{"status": "completed"}`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Message: `"Status updated"`.

---

## 4. Attendance (`/api/class/<id>/attendance`)

### TC-CLS-05: Take Attendance
- **Description**: Verify marking attendance for students in a class.
- **Steps**:
    1. Send a POST request to `/api/class/<class_id>/attendance`.
    2. Payload:
       ```json
       {
           "date": "2026-04-11",
           "records": [{"student_id": "<student_id>", "status": "present"}]
       }
       ```
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Message contains `"saved"`.

### TC-CLS-06: Get Attendance Report
- **Description**: Verify retrieving the attendance matrix for a class.
- **Steps**:
    1. Send a GET request to `/api/class/<class_id>/attendance/report`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Response contains `data` (students) and `sessions`.
