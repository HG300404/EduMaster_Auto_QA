# @project: EDUMASTER
# @module: CRM
# @type: API-Integration

import pytest
from faker import Faker
from datetime import datetime

from tests.api.conftest import assert_crm_lead_created, unwrap_api_response

fake = Faker()

pytestmark = [pytest.mark.smoke, pytest.mark.xdist_group("crm")]


@pytest.fixture(autouse=True)
def reset_crm_auto_assignment_rule(admin_client):
    """Prevent round-robin setting from breaking parallel lead creation."""
    admin_client.put("/api/crm/settings", json={"auto_assignment_rule": "none"})
    yield
    admin_client.put("/api/crm/settings", json={"auto_assignment_rule": "none"})


def _data(response):
    return unwrap_api_response(response.json())


@pytest.fixture
def crm_lead_payload():
    stamp = int(datetime.utcnow().timestamp())
    return {
        "name": f"Lead {fake.first_name()} {stamp}",
        "email": f"lead{stamp}@test.com",
        "phone": fake.numerify("09########"),
        "source": "Website",
        "status": "New",
        "notes": fake.sentence(),
    }


@pytest.fixture
def crm_lead_id(admin_client, crm_lead_payload):
    response = admin_client.post("/api/crm/leads", json=crm_lead_payload)
    assert_crm_lead_created(response)
    return _data(response)["id"]


def test_create_lead(admin_client, crm_lead_payload):
    """TC-CRM-01: Verify creating a lead from web source."""
    response = admin_client.post("/api/crm/leads", json=crm_lead_payload)

    assert_crm_lead_created(response)
    assert response.elapsed.total_seconds() < 1.0
    data = _data(response)
    assert data["name"] == crm_lead_payload["name"]
    assert data["source"] == "Website"
    assert data["status"] == "New"


def test_list_leads_with_status_filter(admin_client, crm_lead_id):
    """TC-CRM-02: Verify filtering leads by status."""
    update_res = admin_client.put(
        f"/api/crm/leads/{crm_lead_id}",
        json={"status": "Contacted"},
    )
    assert update_res.status_code == 200, update_res.text

    response = admin_client.get("/api/crm/leads", params={"status": "Contacted"})

    assert response.status_code == 200
    assert response.elapsed.total_seconds() < 1.0
    leads = _data(response)
    assert isinstance(leads, list)
    assert any(lead["id"] == crm_lead_id for lead in leads)


def test_update_lead_status(admin_client, crm_lead_id):
    """TC-CRM-03: Verify updating lead care status."""
    response = admin_client.put(
        f"/api/crm/leads/{crm_lead_id}",
        json={"status": "Interested"},
    )

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = _data(response)
    assert data["status"] == "Interested"


def test_assign_lead_to_staff(admin_client, crm_lead_id):
    """TC-CRM-04: Verify manual lead assignment to sales staff."""
    staff_res = admin_client.get("/api/crm/staff")
    assert staff_res.status_code == 200, staff_res.text
    staff = _data(staff_res)
    assert len(staff) >= 1, "Expected at least one staff member for assignment"

    staff_id = staff[0]["id"]
    response = admin_client.put(
        f"/api/crm/leads/{crm_lead_id}",
        json={"assigned_to_id": staff_id},
    )

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = _data(response)
    assert data["assigned_to_id"] == staff_id


def test_update_crm_assignment_settings(admin_client):
    """TC-CRM-05: Verify CRM auto-assignment settings can be configured."""
    put_res = admin_client.put(
        "/api/crm/settings",
        json={"auto_assignment_rule": "round-robin"},
    )
    assert put_res.status_code == 200, put_res.text

    get_res = admin_client.get("/api/crm/settings")
    assert get_res.status_code == 200, get_res.text
    assert get_res.elapsed.total_seconds() < 1.0
    settings = _data(get_res)
    assert settings.get("auto_assignment_rule") == "round-robin"
