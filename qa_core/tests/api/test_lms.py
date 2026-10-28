# @project: EDUMASTER
# @module: LMS
# @type: API-Integration

import pytest
from faker import Faker
import uuid

fake = Faker()

pytestmark = pytest.mark.smoke

@pytest.fixture
def lms_course_id(admin_client):
    """Arrange: create an LMS course and return its ID."""
    payload = {
        "name": f"LMS Course {fake.word()} {uuid.uuid4().hex[:4]}",
        "code": f"C-{fake.bothify(text='??-###').upper()}",
        "description": fake.sentence(),
        "level": "N5",
        "type": "other",
        "mode": "online"
    }
    response = admin_client.post("/api/course/", json=payload)
    assert response.status_code in (200, 201), f"Expected 200/201, got {response.status_code}"
    return response.json().get("id", 1)

@pytest.fixture
def lms_text_lesson_id(admin_client, lms_course_id):
    """Arrange: create a text lesson linked to the course."""
    payload = {
        "course_id": lms_course_id,
        "title": f"Text Lesson {fake.word()}",
        "content_type": "text",
        "order": 1,
        "content_text": fake.text(),
    }
    response = admin_client.post("/api/course/lessons", json=payload)
    assert response.status_code in (200, 201), f"Expected 200/201, got {response.status_code}"
    return response.json()

def test_create_text_lesson(admin_client, lms_course_id):
    """TC-LMS-01: Verify creating a text lesson in LMS."""
    payload = {
        "course_id": lms_course_id,
        "title": f"Text Lesson {fake.word()}",
        "content_type": "text",
        "order": 1,
        "content_text": fake.text()
    }
    response = admin_client.post("/api/course/lessons", json=payload)
    assert response.status_code in (200, 201), f"Expected 200/201, got {response.status_code}"
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["content_type"] == "text"

def test_create_document_lesson(admin_client, lms_course_id):
    """TC-LMS-02: Verify creating a document lesson (PDF) in LMS."""
    payload = {
        "course_id": lms_course_id,
        "title": f"Doc Lesson {fake.word()}",
        "content_type": "pdf",
        "order": 2,
        "content_url": "https://example.com/dummy.pdf"
    }

    response = admin_client.post("/api/course/lessons", json=payload)

    assert response.status_code in (200, 201), f"Expected 200/201, got {response.status_code}"
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["content_type"] == "pdf"

def test_create_video_lesson(admin_client, lms_course_id):
    """TC-LMS-04: Verify creating a video lesson with external URL."""
    payload = {
        "course_id": lms_course_id,
        "title": f"Video Lesson {fake.word()}",
        "content_type": "video",
        "order": 3,
        "content_url": "https://example.com/sample-lesson.mp4",
    }
    response = admin_client.post("/api/course/lessons", json=payload)
    assert response.status_code in (200, 201), f"Expected 200/201, got {response.status_code}"
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["content_type"] == "video"
    assert data["content_url"] == payload["content_url"]

def test_get_lessons(admin_client, lms_course_id):
    """TC-LMS-03: Verify fetching lessons for a course."""
    lesson_title = f"Listed Lesson {fake.word()}"
    create_payload = {
        "course_id": lms_course_id,
        "title": lesson_title,
        "content_type": "text",
        "order": 1,
        "content_text": fake.text(),
    }
    create_response = admin_client.post("/api/course/lessons", json=create_payload)
    assert create_response.status_code in (200, 201), (
        f"Expected 200/201, got {create_response.status_code}"
    )
    created_lesson = create_response.json()

    response = admin_client.get(f"/api/course/{lms_course_id}/lessons")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert response.elapsed.total_seconds() < 1.0

    lessons = response.json()
    assert isinstance(lessons, list)
    assert len(lessons) >= 1, "Expected at least one lesson for the course"
    assert any(
        lesson.get("id") == created_lesson["id"] and lesson.get("title") == lesson_title
        for lesson in lessons
    ), f"Created lesson not found in response: {lessons}"

def test_create_quiz_for_lesson(admin_client, lms_course_id, lms_text_lesson_id):
    """TC-LMS-05: Verify assigning a quiz to a lesson."""
    payload = {
        "course_id": lms_course_id,
        "lesson_id": lms_text_lesson_id["id"],
        "title": f"Quiz {fake.word()}",
        "passing_score": 70,
        "questions": [
            {
                "text": "What is automation testing?",
                "type": "single_choice",
                "points": 1,
                "options": [
                    {"text": "Running tests automatically", "is_correct": True},
                    {"text": "Manual only testing", "is_correct": False},
                ],
            }
        ],
    }
    response = admin_client.post("/api/course/quizzes", json=payload)
    assert response.status_code in (200, 201), f"Expected 200/201, got {response.status_code}"
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["lesson_id"] == lms_text_lesson_id["id"]
    assert data["course_id"] == lms_course_id
