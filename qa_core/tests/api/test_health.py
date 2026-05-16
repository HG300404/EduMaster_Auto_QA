import requests
import os

API_URL = os.getenv('API_URL', 'http://backend:8000')

def test_backend_health():
    """Verify backend is responding at the API URL."""
    try:
        response = requests.get(f"{API_URL}/api/health", timeout=5)
        # Some apps might not have /api/health, so we'll check /api/ or similar
        if response.status_code == 404:
             response = requests.get(f"{API_URL}/", timeout=5)
        
        assert response.status_code < 500, f"Backend returned server error: {response.status_code}"
        print(f"\nBackend health check passed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        assert False, f"Could not connect to Backend at {API_URL}"

def test_database_connection():
    """A sanity check that might require a real endpoint if available."""
    # This is a placeholder for a more specific DB-related API check
    pass
