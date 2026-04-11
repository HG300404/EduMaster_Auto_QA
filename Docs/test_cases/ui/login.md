# Test Cases: Login UI

## 1. Login Flow

### TC-UI-LOG-01: Login Success
- **Description**: Verify that a user can login via the UI with valid credentials.
- **Steps**:
    1. Navigate to `/login`.
    2. Enter "admin@edumaster.com" in the Email field.
    3. Enter "admin123" in the Password field.
    4. Click "Log in".
- **Expected Results**:
    - User is redirected to `/admin`.
    - "Dashboard Overview" text is visible.
    - No error message appears.

### TC-UI-LOG-02: Login Fail - Invalid Credentials
- **Description**: Verify that the UI displays an error message on failed login.
- **Steps**:
    1. Navigate to `/login`.
    2. Enter "wrong@example.com" and "wrongpass".
    3. Click "Log in".
- **Expected Results**:
    - Error notification appears: "Login failed. Please check your credentials."
    - User remains on the login page.

### TC-UI-LOG-03: Form Validation
- **Description**: Verify that the form requires all fields.
- **Steps**:
    1. Navigate to `/login`.
    2. Clear all fields (Email/Password).
    3. Click "Log in".
- **Expected Results**:
    - Validation messages appear: "Please input your Email!", "Please input your Password!"
    - No request is sent to the backend.
