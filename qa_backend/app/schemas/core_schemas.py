from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Generic, TypeVar
from datetime import datetime
from app.models.core_models import TestCaseStatus, TestRunStatus

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None

# TestCase Schemas
class TestCaseBase(BaseModel):
    title: str
    status: TestCaseStatus = TestCaseStatus.draft
    file_path: str
    function_name: Optional[str] = None
    expected_result: Optional[str] = None

class TestCaseCreate(TestCaseBase):
    suite_id: int

class TestCaseResponse(TestCaseBase):
    id: int
    suite_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TestSuiteResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    test_cases: List[TestCaseResponse] = []
    model_config = ConfigDict(from_attributes=True)

class TestRunResponse(BaseModel):
    id: int
    test_case_id: Optional[int] = None
    status: TestRunStatus
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    test_case: Optional[TestCaseResponse] = None
    model_config = ConfigDict(from_attributes=True)

class TestResultResponse(BaseModel):
    id: int
    test_run_id: int
    test_case_id: Optional[int] = None
    test_name: str
    status: str
    duration: float
    error_message: Optional[str] = None
    execution_data: Optional[str] = None
    log_file_path: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TestRunDetailResponse(TestRunResponse):
    test_results: List[TestResultResponse] = []
    logs: List[str] = []
    model_config = ConfigDict(from_attributes=True)

class TestRunHistoryItem(BaseModel):
    id: int
    display_id: str
    suite_name: str
    target_title: str
    environment: str
    status: str
    date_formatted: str
    duration_formatted: str
    duration_seconds: int

# Auth and User Schemas
class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: str
    role: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# AuditLog Schema
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)
