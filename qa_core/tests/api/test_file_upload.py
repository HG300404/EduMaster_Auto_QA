# @project: EDUMASTER
# @module: File Upload
# @type: API-Integration

import os
import uuid

import pytest

pytestmark = [pytest.mark.smoke, pytest.mark.xdist_group("file_upload")]

TEST_PDF_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "ui", "test-file.pdf")
)


@pytest.fixture
def file_folder_id(admin_client):
    """Arrange: create a root folder for file-manager tests."""
    folder_name = f"QA Folder {uuid.uuid4().hex[:8]}"
    response = admin_client.post(
        "/api/files/folders",
        json={"name": folder_name, "parent_id": "root"},
    )
    assert response.status_code == 201, response.text
    folder_id = response.json()["id"]
    yield folder_id
    admin_client.delete(f"/api/files/folders/{folder_id}")


@pytest.fixture
def uploaded_file_id(admin_client, file_folder_id):
    """Arrange: upload a PDF into the test folder."""
    assert os.path.isfile(TEST_PDF_PATH), f"Missing test asset: {TEST_PDF_PATH}"
    with open(TEST_PDF_PATH, "rb") as handle:
        response = admin_client.post(
            "/api/files/upload",
            files={"file": ("qa-upload.pdf", handle, "application/pdf")},
            data={"folder_id": file_folder_id},
        )
    assert response.status_code == 201, response.text
    file_id = response.json()["id"]
    yield file_id
    admin_client.delete(f"/api/files/{file_id}")


def test_create_folder(admin_client):
    """TC-FILE-01: Verify creating a file manager folder."""
    folder_name = f"API Folder {uuid.uuid4().hex[:8]}"
    response = admin_client.post(
        "/api/files/folders",
        json={"name": folder_name, "parent_id": "root"},
    )

    assert response.status_code == 201, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert data["name"] == folder_name

    admin_client.delete(f"/api/files/folders/{data['id']}")


def test_upload_file(admin_client, file_folder_id):
    """TC-FILE-02: Verify uploading a file to MinIO storage."""
    assert os.path.isfile(TEST_PDF_PATH), f"Missing test asset: {TEST_PDF_PATH}"
    with open(TEST_PDF_PATH, "rb") as handle:
        response = admin_client.post(
            "/api/files/upload",
            files={"file": ("qa-upload.pdf", handle, "application/pdf")},
            data={"folder_id": file_folder_id},
        )

    assert response.status_code == 201, response.text
    assert response.elapsed.total_seconds() < 2.0
    data = response.json()
    assert data["name"] == "qa-upload.pdf"
    assert data["folder_id"] == file_folder_id

    admin_client.delete(f"/api/files/{data['id']}")


def test_list_folders_and_files(admin_client, uploaded_file_id, file_folder_id):
    """TC-FILE-03: Verify listing folders and files at a path."""
    response = admin_client.get("/api/files/folders", params={"parent_id": file_folder_id})

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    payload = response.json()
    assert "folders" in payload and "files" in payload
    assert any(item["id"] == uploaded_file_id for item in payload["files"])


def test_get_file_download_url(admin_client, uploaded_file_id):
    """TC-FILE-04: Verify retrieving a presigned file URL.

    Known SUT limitation: with MinIO storage, GET /api/files/{id}/url may return 500
    because FileService passes int expires to minio 7.x presigned_get_object.
    Do not patch edumaster — this case documents current behaviour.
    """
    response = admin_client.get(f"/api/files/{uploaded_file_id}/url")

    if response.status_code == 500 and "Could not generate URL" in response.text:
        pytest.xfail(
            "SUT returns 500 for presigned URL (MinIO get_file_url incompatible with minio 7.x)"
        )

    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0
    data = response.json()
    assert data.get("url"), "Expected a download URL for uploaded file"


def test_delete_file(admin_client, file_folder_id):
    """TC-FILE-05: Verify deleting an uploaded file."""
    with open(TEST_PDF_PATH, "rb") as handle:
        create_res = admin_client.post(
            "/api/files/upload",
            files={"file": ("qa-delete.pdf", handle, "application/pdf")},
            data={"folder_id": file_folder_id},
        )
    assert create_res.status_code == 201, create_res.text
    file_id = create_res.json()["id"]

    response = admin_client.delete(f"/api/files/{file_id}")
    assert response.status_code == 200, response.text
    assert response.elapsed.total_seconds() < 1.0

    list_res = admin_client.get("/api/files/folders", params={"parent_id": file_folder_id})
    files = list_res.json().get("files", [])
    assert all(item["id"] != file_id for item in files)
