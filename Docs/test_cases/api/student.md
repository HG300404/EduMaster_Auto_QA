# Test Cases: Student API CRUD

## 1. Create Student (`POST /api/student/`)

### TC-STU-01: Create Student Success
- **Description**: Verify that a staff user can create a new student with full profile information.
- **Pre-conditions**: Staff user logged in.
- **Steps**:
    1. Send a POST request to `/api/student/`.
    2. Payload: 
       ```json
       {
           "email": "test-student@example.com",
           "full_name": "Test Student",
           "student_code": "STU001",
           "phone": "0123456789",
           "level": "beginner",
           "status": "active",
           "password": "password123"
       }
       ```
- **Expected Results**:
    - HTTP Status: `201 Created`.
    - Response matches `StudentSchema`.
    - Database contains a new User record with role 'student'.
    - Level and Status are correctly saved as 'beginner' and 'active'.

### TC-STU-02: Create Student Fail - Duplicate Email
- **Description**: Verify that creating a student with an existing email fails.
- **Steps**:
    1. Send a POST request with an email that already exists in the system.
- **Expected Results**:
    - HTTP Status: `400 Bad Request`.
    - Message contains `"already exists"`.

---

## 2. Get Student Details (`GET /api/student/<id>`)

### TC-STU-03: Get Student Success
- **Description**: Verify retrieving full details of a specific student.
- **Steps**:
    1. Send a GET request to `/api/student/<student_id>`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Response matches `StudentSchema` and contains matching ID, Level, and Status.

---

## 3. List Students (`GET /api/student/`)

### TC-STU-04: List Students with Pagination
- **Description**: Verify that the list of students is returned with pagination info.
- **Steps**:
    1. Send a GET request to `/api/student/?page=1&per_page=5`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Response matches `PaginatedStudentsSchema`.

---

## 4. Update Student (`PUT /api/student/<id>`)

### TC-STU-05: Update Student Info
- **Description**: Verify that a staff user can update student details (e.g. changing Level).
- **Steps**:
    1. Send a PUT request to `/api/student/<student_id>`.
    2. Payload: `{"level": "advanced", "status": "graduated"}`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Response reflects the updated Level and Status.

---

## 5. Delete Student (`DELETE /api/student/<id>`)

### TC-STU-06: Delete Student Success (Admin Only)
- **Description**: Verify that an admin can delete a student.
- **Steps**:
    1. Login as Admin.
    2. Send a DELETE request to `/api/student/<student_id>`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Subsequent GET requests to same ID return `404 Not Found`.
