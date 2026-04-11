# @project: EDUMASTER
# @module: CRM
# @type: API-Integration

import pytest
from faker import Faker
from tests.api.schemas import StudentSchema, PaginatedStudentsSchema, BaseResponse
from pydantic import ValidationError

fake = Faker()

@pytest.fixture
def random_student_data():
    """Generate random student data for testing."""
    return {
        "email": fake.unique.email(),
        "full_name": fake.name(),
        "student_code": f"STU_{fake.unique.random_number(digits=6)}",
        "phone": fake.phone_number(),
        "address": fake.address(),
        "level": fake.random_element(elements=("beginner", "intermediate", "advanced")),
        "status": "active",
        "password": "password123"
    }

def test_create_student_and_validate_schema(admin_client, random_student_data):
    """TC-STU-01: Verify student creation and schema integrity."""
    # Arrange & Act
    response = admin_client.post("/api/student/", json=random_student_data)
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    
    # Schema Validation
    try:
        StudentSchema(**data)
    except ValidationError as e:
        pytest.fail(f"Response data does not match StudentSchema: {e}")
    
    assert data["email"] == random_student_data["email"]
    assert data["student_code"] == random_student_data["student_code"]

def test_get_student_detail(admin_client, random_student_data):
    """TC-STU-02: Verify retrieving student details."""
    # Create first
    create_res = admin_client.post("/api/student/", json=random_student_data)
    student_id = create_res.json()["id"]
    
    # Get Detail
    response = admin_client.get(f"/api/student/{student_id}")
    
    assert response.status_code == 200
    data = response.json()
    StudentSchema(**data) # Validate schema
    assert data["id"] == student_id

def test_list_students_pagination(admin_client):
    """TC-STU-03: Verify student listing with pagination schema."""
    response = admin_client.get("/api/student/?page=1&per_page=5")
    
    assert response.status_code == 200
    data = response.json()
    
    try:
        PaginatedStudentsSchema(**data)
    except ValidationError as e:
        pytest.fail(f"Pagination response does not match PaginatedStudentsSchema: {e}")
    
    assert "items" in data
    assert len(data["items"]) <= 5

def test_update_student_profile(admin_client, random_student_data):
    """TC-STU-04: Verify updating student information."""
    # Create
    student_id = admin_client.post("/api/student/", json=random_student_data).json()["id"]
    
    # Update
    new_name = "New Updated Name"
    response = admin_client.put(f"/api/student/{student_id}", json={"full_name": new_name})
    
    assert response.status_code == 200
    assert response.json()["full_name"] == new_name

def test_delete_student_cascade(admin_client, random_student_data):
    """TC-STU-05: Verify student deletion and cleanup."""
    # Create
    student_id = admin_client.post("/api/student/", json=random_student_data).json()["id"]
    
    # Delete
    del_res = admin_client.delete(f"/api/student/{student_id}")
    assert del_res.status_code == 200
    
    # Verify non-existent
    get_res = admin_client.get(f"/api/student/{student_id}")
    assert get_res.status_code == 404

def test_create_duplicate_email_error(admin_client, random_student_data):
    """TC-STU-06: Verify error handling for duplicate email."""
    # Create first
    admin_client.post("/api/student/", json=random_student_data)
    
    # Create second with same email
    response = admin_client.post("/api/student/", json=random_student_data)
    
    assert response.status_code == 400
    assert "exists" in response.json().get("msg", "").lower()
