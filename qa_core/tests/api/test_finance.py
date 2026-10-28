# @project: EDUMASTER
# @module: Finance
# @type: API-Integration

import pytest
from faker import Faker
from datetime import datetime, timedelta

from tests.api.conftest import unwrap_api_response

fake = Faker()

pytestmark = [pytest.mark.smoke, pytest.mark.xdist_group("finance_invoices")]


def _data(response):
    return unwrap_api_response(response.json())


@pytest.fixture
def finance_student_id(admin_client):
    payload = {
        "email": fake.unique.email(),
        "full_name": fake.name(),
        "student_code": f"FIN_{fake.unique.random_number(digits=6)}",
        "phone": fake.numerify("09########"),
        "level": "beginner",
        "status": "active",
        "password": "password123",
    }
    response = admin_client.post("/api/student/", json=payload)
    assert response.status_code == 201, response.text
    return response.json()["id"]


@pytest.fixture
def finance_invoice_payload(finance_student_id):
    today = datetime.utcnow().date()
    due = today + timedelta(days=30)
    amount = 1_500_000
    return {
        "student_id": finance_student_id,
        "issue_date": today.isoformat(),
        "due_date": due.isoformat(),
        "total_amount": amount,
        "status": "Unpaid",
        "notes": "Automation invoice",
        "items": [
            {
                "description": "Tuition Fee",
                "quantity": 1,
                "unit_price": amount,
                "amount": amount,
            }
        ],
    }


@pytest.fixture
def finance_invoice_id(admin_client, finance_invoice_payload):
    response = admin_client.post("/api/finance/invoices", json=finance_invoice_payload)
    assert response.status_code in (200, 201), response.text
    return _data(response)["id"]


def test_create_invoice(admin_client, finance_invoice_payload):
    """TC-FIN-01: Verify creating a tuition invoice."""
    response = admin_client.post("/api/finance/invoices", json=finance_invoice_payload)

    assert response.status_code in (200, 201), response.text
    assert response.elapsed.total_seconds() < 1.0
    data = _data(response)
    assert data["student_id"] == finance_invoice_payload["student_id"]
    assert data["total_amount"] == finance_invoice_payload["total_amount"]
    assert data["status"] == "Unpaid"
    assert len(data["items"]) == 1


def test_get_invoice_detail(admin_client, finance_invoice_id, finance_invoice_payload):
    """TC-FIN-02: Verify retrieving invoice details."""
    response = admin_client.get(f"/api/finance/invoices/{finance_invoice_id}")

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = _data(response)
    assert data["id"] == finance_invoice_id
    assert data["total_amount"] == finance_invoice_payload["total_amount"]
    assert data["balance"] == finance_invoice_payload["total_amount"]


def test_record_payment(admin_client, finance_invoice_id, finance_invoice_payload):
    """TC-FIN-03: Verify recording full payment updates invoice status."""
    amount = finance_invoice_payload["total_amount"]
    payment_payload = {
        "invoice_id": finance_invoice_id,
        "amount": amount,
        "payment_method": "Cash",
        "payment_date": datetime.utcnow().date().isoformat(),
    }
    response = admin_client.post("/api/finance/payments", json=payment_payload)

    assert response.status_code in (200, 201), response.text
    assert response.elapsed.total_seconds() < 1.0
    payment = _data(response)
    assert payment["amount"] == amount

    invoice_res = admin_client.get(f"/api/finance/invoices/{finance_invoice_id}")
    invoice = _data(invoice_res)
    assert invoice["status"] == "Paid"
    assert invoice["balance"] == 0


def test_list_invoices(admin_client, finance_invoice_id):
    """TC-FIN-04: Verify paginated invoice listing."""
    response = admin_client.get("/api/finance/invoices", params={"page": 1, "per_page": 20})

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = _data(response)
    assert "items" in data
    assert isinstance(data["items"], list)
    assert any(item["id"] == finance_invoice_id for item in data["items"])
