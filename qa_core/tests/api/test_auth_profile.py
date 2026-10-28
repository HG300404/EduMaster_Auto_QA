# @project: EDUMASTER
# @module: Auth
# @type: API-Integration

import os
import time
import pytest

pytestmark = [pytest.mark.smoke, pytest.mark.xdist_group("auth_profile")]

PROFILE_EMAIL = os.getenv("PROFILE_TEST_EMAIL", "counselor@edumaster.com")
PROFILE_PASSWORD = os.getenv("PROFILE_TEST_PASSWORD", "password123")


@pytest.fixture
def profile_client(api_client):
    """Authenticated client for profile/password tests (demo counselor user)."""
    response = api_client.login(PROFILE_EMAIL, PROFILE_PASSWORD)
    assert response.status_code == 200, response.text
    return api_client


def test_update_profile(profile_client):
    """TC-AUTH-PROF-01: Verify updating profile full name."""
    stamp = int(time.time())
    new_name = f"QA Profile {stamp}"

    response = profile_client.put("/api/auth/profile", json={"full_name": new_name})

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert data["full_name"] == new_name

    me = profile_client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["full_name"] == new_name


def test_change_password_success(profile_client):
    """TC-AUTH-PROF-02: Verify changing password with correct current password."""
    new_password = f"Pass{int(time.time())}!"

    response = profile_client.post(
        "/api/auth/change-password",
        json={"old_password": PROFILE_PASSWORD, "new_password": new_password},
    )
    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0

    relogin = profile_client.post(
        "/api/auth/login",
        json={"email": PROFILE_EMAIL, "password": new_password},
    )
    assert relogin.status_code == 200, relogin.text

    restore = profile_client.post(
        "/api/auth/change-password",
        json={"old_password": new_password, "new_password": PROFILE_PASSWORD},
    )
    assert restore.status_code == 200, restore.text


def test_change_password_wrong_old(profile_client):
    """TC-AUTH-PROF-03: Verify change password rejects incorrect current password."""
    response = profile_client.post(
        "/api/auth/change-password",
        json={"old_password": "wrong-old-password", "new_password": "NewPass123!"},
    )

    assert response.status_code == 400, response.text
    assert response.elapsed.total_seconds() < 1.0
    assert "Incorrect password" in response.json().get("msg", "")


def test_forgot_password_api_not_implemented(profile_client):
    """TC-AUTH-PROF-04: Document forgot-password API is not implemented on SUT."""
    response = profile_client.post(
        "/api/auth/forgot-password",
        json={"email": PROFILE_EMAIL},
    )

    if response.status_code == 404:
        pytest.xfail("SUT has no POST /api/auth/forgot-password — UI /forgot-password is mock only")
    pytest.fail(f"Unexpected forgot-password response: {response.status_code} {response.text}")
