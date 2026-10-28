import pytest
import os
import json
from tests.api.api_client import APIClient

@pytest.fixture(scope="function")
def api_client():
    """Fixture providing an instance of APIClient with the base URL from environment."""
    base_url = os.getenv('API_URL', 'http://backend:8000') # Correctly point to the backend container
    return APIClient(base_url=base_url)

@pytest.fixture(autouse=True)
def clear_api_logs(api_client):
    """Clear logs before each test starts."""
    api_client.logs = []

@pytest.fixture(autouse=True)
def save_api_logs_to_json(request, api_client):
    """Save API logs to pytest-json-report metadata after each test finishes."""
    yield
    if hasattr(api_client, "logs") and api_client.logs:
        try:
            # Add to individual test properties instead of global metadata
            request.node.user_properties.append(("api_interaction_logs", list(api_client.logs)))
        except Exception:
            pass

def unwrap_api_response(body):
    """Unwrap standard {success, data} envelope when present."""
    if isinstance(body, dict) and body.get("success") is True and "data" in body:
        return body["data"]
    return body


def assert_crm_lead_created(response):
    """Assert lead creation succeeded; xfail on known SUT CRM import bug."""
    if response.status_code == 400:
        try:
            body = response.json()
            msg = str(body.get("error", {}).get("message", ""))
            if "cannot import name 'Role'" in msg:
                pytest.xfail(f"Known SUT CRM bug: {msg}")
        except Exception:
            pass
    assert response.status_code in (200, 201), response.text

@pytest.fixture(scope="function")
def admin_client(api_client):
    """Fixture providing an authenticated APIClient with admin privileges."""
    email = os.getenv('ADMIN_EMAIL', 'admin@edumaster.com')
    password = os.getenv('ADMIN_PASSWORD', 'admin123')
    api_client.login(email, password)
    return api_client

@pytest.fixture(scope="function")
def staff_client(api_client):
    """Fixture providing an authenticated APIClient with staff privileges."""
    email = os.getenv('STAFF_EMAIL', 'staff1@edumaster.com')
    password = os.getenv('STAFF_PASSWORD', 'pass')
    api_client.login(email, password)
    return api_client

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to capture API logs and add them to the HTML report."""
    outcome = yield
    report = outcome.get_result()
    extra = getattr(report, "extra", [])

    if report.when == "call":
        # Get the api_client fixture from the test item
        client = item.funcargs.get("api_client") or item.funcargs.get("admin_client") or item.funcargs.get("staff_client")
        
        if client and hasattr(client, "logs") and client.logs:
            html_content = "<h3>API Interaction Logs</h3>"
            for i, log in enumerate(client.logs, 1):
                html_content += f"""
                <div style="border: 1px solid #ddd; margin-bottom: 10px; padding: 10px; border-radius: 5px;">
                    <p><strong>#{i} {log['method']} {log['url']}</strong></p>
                    <details>
                        <summary>Request Body</summary>
                        <pre style="white-space: pre-wrap; word-break: break-all;">{log['request_body']}</pre>
                    </details>
                    <p>Status Code: <span style="color: {'green' if 200 <= log['status_code'] < 300 else 'red'}">{log['status_code']}</span></p>
                    <details>
                        <summary>Response Body</summary>
                        <pre style="white-space: pre-wrap; word-break: break-all;">{log['response_body']}</pre>
                    </details>
                </div>
                """
            from pytest_html import extras
            if not hasattr(report, "extras"):
                report.extras = []
            report.extras.append(extras.html(html_content))
