# @project: EDUMASTER
# @module: Reporting
# @type: API-Integration

from datetime import datetime, timedelta

import pytest

pytestmark = pytest.mark.smoke


def test_dashboard_stats_json(admin_client):
    """TC-RPT-01: Verify dashboard overview returns JSON statistics."""
    response = admin_client.get("/api/reporting/dashboard")

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    for key in (
        "student_count",
        "revenue",
        "lead_count",
        "active_classes",
        "conversion_rate",
        "attendance_rate",
    ):
        assert key in data, f"Missing dashboard field: {key}"


def test_revenue_trend_json(admin_client):
    """TC-RPT-02: Verify revenue trend endpoint returns JSON series."""
    response = admin_client.get("/api/reporting/revenue-trend")

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "name" in data[0] and "revenue" in data[0]


def test_lead_source_json(admin_client):
    """TC-RPT-03: Verify lead source breakdown returns JSON data."""
    response = admin_client.get("/api/reporting/lead-source")

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "name" in data[0] and "value" in data[0]


def test_revenue_report_json(admin_client):
    """TC-RPT-04: Verify finance revenue report returns JSON metrics (no export)."""
    end = datetime.utcnow().date()
    start = end - timedelta(days=30)
    response = admin_client.get(
        "/api/reporting/finance/revenue-report",
        params={"start_date": start.isoformat(), "end_date": end.isoformat()},
    )

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    for key in ("total_collected", "total_invoiced", "outstanding_debt"):
        assert key in data, f"Missing revenue report field: {key}"
