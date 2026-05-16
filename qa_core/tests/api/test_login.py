import pytest
from tests.api.api_client import APIClient

@pytest.fixture
def api_client():
    return APIClient()

def test_login_success(api_client):
    """Verify login with correct credentials."""
    response = api_client.login("admin@edumaster.com", "admin123")
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == "admin@edumaster.com"

def test_login_invalid_password(api_client):
    """Verify login fails with incorrect password."""
    response = api_client.login("admin@edumaster.com", "wrongpassword")
    
    assert response.status_code == 401
    assert response.json()["msg"] == "Bad email or password"

def test_login_non_existent_user(api_client):
    """Verify login fails with non-existent email."""
    response = api_client.login("nonexistent@example.com", "admin123")
    
    assert response.status_code == 401
    assert response.json()["msg"] == "Bad email or password"

def test_get_me_after_login(api_client):
    """Verify /api/auth/me works with the acquired token."""
    login_response = api_client.login("admin@edumaster.com", "admin123")
    assert login_response.status_code == 200
    
    me_response = api_client.get("/api/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "admin@edumaster.com"
