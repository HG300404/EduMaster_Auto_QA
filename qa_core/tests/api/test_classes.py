# @project: EDUMASTER
# @module: LMS
# @type: API-Integration

import pytest
from faker import Faker
from tests.api.schemas import ClassSchema, CourseSchema, RoomSchema, EnrollmentSchema
from pydantic import ValidationError
import uuid

fake = Faker()

@pytest.fixture
def course_id(admin_client):
    """Create a course and return its ID."""
    payload = {
        "name": f"Course {fake.word()} {uuid.uuid4().hex[:4]}",
        "code": f"C-{fake.bothify(text='??-###').upper()}",
        "description": fake.sentence()
    }
    response = admin_client.post("/api/course/", json=payload)
    assert response.status_code == 201
    return response.json()["id"]

@pytest.fixture
def room_id(admin_client):
    """Create a room and return its ID."""
    payload = {
        "name": f"Room {fake.random_digit_not_null()} {uuid.uuid4().hex[:4]}",
        "location": "Floor 1",
        "capacity": 30
    }
    response = admin_client.post("/api/class/rooms", json=payload)
    assert response.status_code == 201
    return response.json()["id"]

@pytest.fixture
def student_id(admin_client):
    """Create a student and return its ID."""
    payload = {
        "email": fake.unique.email(),
        "full_name": fake.name(),
        "student_code": f"STU_{fake.unique.random_number(digits=6)}",
        "password": "password123"
    }
    response = admin_client.post("/api/student/", json=payload)
    assert response.status_code == 201
    return response.json()["id"]

def test_create_class_full_flow(admin_client, course_id, room_id):
    """TC-CLS-01: Verify class creation with prerequisites."""
    payload = {
        "name": f"Class {fake.bothify(text='??-###')}",
        "course_id": course_id,
        "room_id": room_id,
        "max_students": 20,
        "schedule": [
            {"day": 0, "start": "08:00", "end": "10:00"},
            {"day": 2, "start": "08:00", "end": "10:00"}
        ],
        "start_date": "2026-05-01",
        "end_date": "2026-08-01"
    }
    
    response = admin_client.post("/api/class/", json=payload)
    
    assert response.status_code == 201
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    ClassSchema(**data) # Validate schema
    assert data["name"] == payload["name"]

def test_enroll_student_to_class(admin_client, course_id, room_id, student_id):
    """TC-CLS-02: Verify adding a student to a class."""
    # Create Class
    class_payload = {
        "name": "Enrollment Test Class",
        "course_id": course_id,
        "room_id": room_id,
        "max_students": 10,
        "schedule": []
    }
    class_id = admin_client.post("/api/class/", json=class_payload).json()["id"]
    
    # Enroll
    enroll_payload = {"student_id": student_id, "status": "active"}
    response = admin_client.post(f"/api/class/{class_id}/students", json=enroll_payload)
    
    # Backend returns 200 for student addition
    assert response.status_code == 200
    assert "added" in response.json()["msg"].lower()

def test_update_enrollment_status(admin_client, course_id, room_id, student_id):
    """TC-CLS-03: Verify updating student enrollment status."""
    # Create Class and Enroll
    class_id = admin_client.post("/api/class/", json={"name": "Status Test", "course_id": course_id, "max_students": 10, "schedule": []}).json()["id"]
    admin_client.post(f"/api/class/{class_id}/students", json={"student_id": student_id})
    
    # Update Status
    response = admin_client.put(f"/api/class/{class_id}/students/{student_id}", json={"status": "completed"})
    
    assert response.status_code == 200
    assert "updated" in response.json()["msg"].lower()

def test_take_attendance_flow(admin_client, course_id, room_id, student_id):
    """TC-CLS-04: Verify attendance taking for a class session."""
    # Setup Class and Student
    class_id = admin_client.post("/api/class/", json={"name": "Attendance Test", "course_id": course_id, "max_students": 10, "schedule": []}).json()["id"]
    admin_client.post(f"/api/class/{class_id}/students", json={"student_id": student_id})
    
    # Take Attendance
    attendance_payload = {
        "date": "2026-04-11",
        "records": [
            {"student_id": student_id, "status": "present", "notes": "On time"}
        ]
    }
    response = admin_client.post(f"/api/class/{class_id}/attendance", json=attendance_payload)
    
    assert response.status_code == 200
    assert response.elapsed.total_seconds() < 1.0
    assert "saved" in response.json()["msg"].lower()

def test_get_class_attendance_report(admin_client, course_id, room_id):
    """TC-CLS-05: Verify attendance report retrieval."""
    class_id = admin_client.post("/api/class/", json={"name": "Report Test", "course_id": course_id, "max_students": 10, "schedule": []}).json()["id"]
    
    response = admin_client.get(f"/api/class/{class_id}/attendance/report")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "sessions" in data
