# @project: EDUMASTER
# @module: StudyAbroad
# @type: API-Integration

import pytest
from datetime import datetime
from faker import Faker

from tests.api.conftest import unwrap_api_response

fake = Faker()

pytestmark = [pytest.mark.smoke, pytest.mark.xdist_group("study_abroad")]

BASE = "/api/study-abroad"


def _data(response):
    return unwrap_api_response(response.json())


def _stamp():
    return int(datetime.utcnow().timestamp())


def _create_candidate(admin_client, **overrides):
    stamp = _stamp()
    payload = {
        "full_name": f"QA Candidate {stamp}",
        "email": f"sa-candidate-{stamp}@test.com",
        "dob": "2000-01-01",
        "gender": "Male",
        "height": 170,
        "jlpt_level": "N4",
        "health_status": "Fit",
        **overrides,
    }
    response = admin_client.post(f"{BASE}/candidates", json=payload)
    assert response.status_code in (200, 201), response.text
    return _data(response)


def _create_partner(admin_client, **overrides):
    stamp = _stamp()
    payload = {
        "name": f"QA Partner {stamp}",
        "type": "Company",
        "country": "Japan",
        **overrides,
    }
    response = admin_client.post(f"{BASE}/partners", json=payload)
    assert response.status_code in (200, 201), response.text
    return _data(response)


def _create_job_order(admin_client, partner_id, **overrides):
    stamp = _stamp()
    payload = {
        "partner_id": partner_id,
        "title": f"QA Job Order {stamp}",
        "status": "Open",
        **overrides,
    }
    response = admin_client.post(f"{BASE}/orders", json=payload)
    assert response.status_code in (200, 201), response.text
    return _data(response)


def _create_application(admin_client, candidate_id, job_order_id):
    response = admin_client.post(
        f"{BASE}/applications",
        json={"candidate_id": candidate_id, "job_order_id": job_order_id},
    )
    assert response.status_code in (200, 201), response.text
    return _data(response)


def test_create_candidate(admin_client):
    """TC-SA-01: Verify creating a study abroad candidate."""
    stamp = _stamp()
    payload = {
        "full_name": f"SA Create {fake.first_name()} {stamp}",
        "email": f"sa-create-{stamp}@test.com",
        "dob": "1999-05-15",
        "gender": "Female",
        "phone": fake.numerify("09########"),
    }

    response = admin_client.post(f"{BASE}/candidates", json=payload)

    assert response.status_code in (200, 201), response.text
    assert response.elapsed.total_seconds() < 1.0
    data = _data(response)
    assert data["full_name"] == payload["full_name"]
    assert data["email"] == payload["email"]

    admin_client.delete(f"{BASE}/candidates/{data['id']}")


def test_create_partner_and_job_order(admin_client):
    """TC-SA-02: Verify creating a partner and job order."""
    partner = _create_partner(admin_client)
    order = _create_job_order(
        admin_client,
        partner["id"],
        min_height=165,
        required_jlpt="N4",
    )

    get_res = admin_client.get(f"{BASE}/orders/{order['id']}")
    assert get_res.status_code == 200, get_res.text
    assert get_res.elapsed.total_seconds() < 1.0
    order_data = _data(get_res)
    assert order_data["partner_id"] == partner["id"]
    assert order_data["min_height"] == 165
    assert order_data["required_jlpt"] == "N4"

    admin_client.delete(f"{BASE}/orders/{order['id']}")
    admin_client.delete(f"{BASE}/partners/{partner['id']}")


def test_create_application(admin_client):
    """TC-SA-03: Verify creating an application initializes workflow."""
    candidate = _create_candidate(admin_client)
    partner = _create_partner(admin_client)
    order = _create_job_order(admin_client, partner["id"])
    application = _create_application(admin_client, candidate["id"], order["id"])

    assert application["candidate_id"] == candidate["id"]
    assert application["job_order_id"] == order["id"]
    assert application["current_stage"] == "Initial Consultation"

    progress_res = admin_client.get(f"{BASE}/applications/{application['id']}/progress")
    assert progress_res.status_code == 200, progress_res.text
    progress = _data(progress_res)
    assert len(progress) == 7
    assert progress[0]["stage"] == "Initial Consultation"
    assert progress[0]["status"] == "In Progress"
    assert progress[1]["status"] == "Pending"


def test_advance_application_checklist(admin_client):
    """TC-SA-04: Verify checklist completion and workflow stage advance."""
    candidate = _create_candidate(admin_client)
    partner = _create_partner(admin_client)
    order = _create_job_order(admin_client, partner["id"])
    application = _create_application(admin_client, candidate["id"], order["id"])
    app_id = application["id"]

    blocked = admin_client.post(f"{BASE}/applications/{app_id}/advance")
    assert blocked.status_code == 400, blocked.text

    checklist_res = admin_client.post(
        f"{BASE}/applications/{app_id}/checklist",
        json={
            "stage": "Initial Consultation",
            "items": {
                "Consultation Fee Paid": True,
                "Basic Documents Collected": True,
            },
        },
    )
    assert checklist_res.status_code == 200, checklist_res.text
    checklist_data = _data(checklist_res)
    assert checklist_data["checklist"]["Consultation Fee Paid"] is True

    advance_res = admin_client.post(f"{BASE}/applications/{app_id}/advance")
    assert advance_res.status_code == 200, advance_res.text
    assert advance_res.elapsed.total_seconds() < 1.0
    advance_data = _data(advance_res)
    assert advance_data["success"] is True
    assert advance_data["new_stage"] == "School Selection"

    progress_res = admin_client.get(f"{BASE}/applications/{app_id}/progress")
    progress = _data(progress_res)
    assert progress[0]["status"] == "Completed"
    assert progress[1]["status"] == "In Progress"


def test_match_candidates_to_order(admin_client):
    """TC-SA-05: Verify auto-match and assign candidate to job order."""
    partner = _create_partner(admin_client, type="Company")
    order = _create_job_order(
        admin_client,
        partner["id"],
        min_height=165,
        required_jlpt="N4",
    )
    candidate = _create_candidate(
        admin_client,
        gender="Male",
        height=170,
        jlpt_level="N4",
        health_status="Fit",
    )

    match_res = admin_client.post(f"{BASE}/orders/{order['id']}/match")
    assert match_res.status_code == 200, match_res.text
    assert match_res.elapsed.total_seconds() < 1.0
    matches = _data(match_res)
    assert isinstance(matches, list)
    matched = next(
        (m for m in matches if m["candidate"]["id"] == candidate["id"] and m["is_match"]),
        None,
    )
    assert matched is not None, "Expected candidate to appear as a match"

    assign_res = admin_client.post(
        f"{BASE}/orders/{order['id']}/assign",
        json={"candidate_id": candidate["id"]},
    )
    assert assign_res.status_code in (200, 201), assign_res.text
    assign_data = _data(assign_res)
    assert assign_data["candidate_id"] == candidate["id"]
    assert assign_data["job_order_id"] == order["id"]

    list_res = admin_client.get(f"{BASE}/orders/{order['id']}/matches")
    assert list_res.status_code == 200, list_res.text
    confirmed = _data(list_res)
    assert any(m["candidate_id"] == candidate["id"] for m in confirmed)
