# Test Cases: Authentication API

## 1. Login API (`POST /api/auth/login`)

### TC-AUTH-01: Login Success
- **Description**: Verify that a user can login with valid credentials.
- **Pre-conditions**: Database seeded with admin user (`admin@edumaster.com` / `admin123`).
- **Steps**:
    1. Send a POST request to `/api/auth/login`.
    2. Payload: `{"email": "admin@edumaster.com", "password": "admin123"}`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Response contains `access_token` and `refresh_token`.
    - Response contains `user` object with correct email.

### TC-AUTH-02: Login Fail - Invalid Password
- **Description**: Verify that login fails with an incorrect password.
- **Steps**:
    1. Send a POST request to `/api/auth/login`.
    2. Payload: `{"email": "admin@edumaster.com", "password": "wrongpassword"}`.
- **Expected Results**:
    - HTTP Status: `401 Unauthorized`.
    - Response message: `"Bad email or password"`.

### TC-AUTH-03: Login Fail - Non-existent User
- **Description**: Verify that login fails with an email that does not exist.
- **Steps**:
    1. Send a POST request to `/api/auth/login`.
    2. Payload: `{"email": "nonexistent@example.com", "password": "any"}`.
- **Expected Results**:
    - HTTP Status: `401 Unauthorized`.

---

## 2. Token Verification (`GET /api/auth/me`)

### TC-AUTH-04: Get Profile Success
- **Description**: Verify that the profile can be retrieved using a valid JWT token.
- **Steps**:
    1. Login to get an `access_token`.
    2. Send a GET request to `/api/auth/me` with `Authorization: Bearer <token>`.
- **Expected Results**:
    - HTTP Status: `200 OK`.
    - Response contains the user's profile information.
