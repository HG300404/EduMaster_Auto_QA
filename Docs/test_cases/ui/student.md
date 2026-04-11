# Test Cases: Student UI Management

## 1. Student List

### TC-UI-STU-01: View Student List
- **Description**: Verify that the student table displays data correctly.
- **Steps**:
    1. Login as Staff.
    2. Navigate to Student Management.
- **Expected Results**:
    - Table lists students with columns: Code, Name, Phone, Level, Status.

---

## 2. Create Student

### TC-UI-STU-02: Create New Student via Modal
- **Description**: Verify that a new student can be added using the UI form.
- **Steps**:
    1. Click "Add Student".
    2. Fill in the form (Email, Full Name, Student Code, etc.).
    3. Click "Submit".
- **Expected Results**:
    - "Student created successfully" notification.
    - New student appears in the list.

---

## 3. Student Details & Update

### TC-UI-STU-03: Edit Student Info
- **Description**: Verify that student info can be modified.
- **Steps**:
    1. Click "Edit" on a student row.
    2. Change the phone number or status.
    3. Click "Submit".
- **Expected Results**:
    - Success notification.
    - Updated data is reflected in the table.
