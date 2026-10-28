# @project: EDUMASTER
# @module: Infrastructure
# @type: API-Integration

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Any, Union

class BaseResponse(BaseModel):
    model_config = ConfigDict(extra='allow')
    success: bool = True
    data: Any
    message: Optional[str] = None

class CourseSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str
    name: str
    code: str
    description: Optional[str] = None

class RoomSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str
    name: str
    location: Optional[str] = None
    capacity: int

class StudentAttachmentSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str
    file_name: str
    file_url: str
    file_type: str
    created_at: str

class StudentSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str
    student_code: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    level: Optional[str] = None
    status: Optional[str] = "active"
    notes: Optional[str] = None
    avatar_url: Optional[str] = None
    attachments: List[StudentAttachmentSchema] = []

class PaginatedStudentsSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    items: List[StudentSchema]
    total: int
    current_page: int
    total_pages: Optional[int] = Field(default=0)

class ClassScheduleSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    day: int
    start: str
    end: str

class ClassSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str
    name: str
    course_name: Optional[str] = None
    teacher_name: Optional[str] = None
    room_name: Optional[str] = None
    max_students: int
    student_count: int = 0
    schedule: Optional[Union[List[ClassScheduleSchema], str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class EnrollmentSchema(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    enrollment_status: Optional[str] = Field(alias="status", default="active")
    joined_at: Optional[str] = None
