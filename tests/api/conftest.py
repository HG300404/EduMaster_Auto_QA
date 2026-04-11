# @project: EDUMASTER
# @module: Infrastructure
# @type: API-Integration

import pytest
import os
from tests.api.api_client import APIClient

@pytest.fixture(scope="session")
def api_client():
    """Fixture providing an instance of APIClient with the base URL from environment."""
    base_url = os.getenv('API_URL', 'http://localhost:3000') # Local proxy port or backend port
    return APIClient(base_url=base_url)

@pytest.fixture(scope="session")
def admin_client(api_client):
    """Fixture providing an authenticated APIClient with admin privileges."""
    email = os.getenv('ADMIN_EMAIL', 'admin@edumaster.com')
    password = os.getenv('ADMIN_PASSWORD', 'admin123')
    api_client.login(email, password)
    return api_client

@pytest.fixture(scope="session")
def staff_client(api_client):
    """Fixture providing an authenticated APIClient with staff privileges."""
    # Using the same admin for now as it usually has staff permissions, 
    # but can be switched to a dedicated staff account later.
    email = os.getenv('STAFF_EMAIL', 'staff1@edumaster.com')
    password = os.getenv('STAFF_PASSWORD', 'pass')
    api_client.login(email, password)
    return api_client
