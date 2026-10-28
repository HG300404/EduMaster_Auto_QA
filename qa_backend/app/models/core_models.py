from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class TestCaseStatus(str, enum.Enum):
    active = "active"
    draft = "draft"

class TestRunStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"

class TestSuite(Base):
    __tablename__ = "test_suites"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    test_cases = relationship("TestCase", back_populates="suite")

class TestCase(Base):
    __tablename__ = "test_cases"
    id = Column(Integer, primary_key=True, index=True)
    suite_id = Column(Integer, ForeignKey("test_suites.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String, nullable=False)
    status = Column(Enum(TestCaseStatus), default=TestCaseStatus.draft, nullable=False)
    file_path = Column(String, nullable=False)
    function_name = Column(String, nullable=True)  # Name of specific test function (e.g. test_login_success)
    expected_result = Column(String, nullable=True)  # Expected outcome description
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    suite = relationship("TestSuite", back_populates="test_cases")
    test_results = relationship("TestResult", back_populates="test_case")

class TestRun(Base):
    __tablename__ = "test_runs"
    id = Column(Integer, primary_key=True, index=True)
    test_case_id = Column(Integer, ForeignKey("test_cases.id", ondelete="CASCADE"), index=True, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    status = Column(Enum(TestRunStatus), default=TestRunStatus.pending, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    
    test_case = relationship("TestCase")
    test_results = relationship("TestResult", back_populates="test_run")
    user = relationship("User")

class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(Integer, primary_key=True, index=True)
    test_run_id = Column(Integer, ForeignKey("test_runs.id", ondelete="CASCADE"), index=True, nullable=False)
    test_case_id = Column(Integer, ForeignKey("test_cases.id", ondelete="SET NULL"), index=True, nullable=True)
    test_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    duration = Column(Float, nullable=False)
    error_message = Column(String, nullable=True)
    execution_data = Column(String, nullable=True)  # Generated fake/random test data used at runtime
    log_file_path = Column(String, nullable=True)
    screenshot_path = Column(String, nullable=True)
    steps_data = Column(String, nullable=True)  # JSON string of steps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    test_run = relationship("TestRun", back_populates="test_results")
    test_case = relationship("TestCase", back_populates="test_results")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    audit_logs = relationship("AuditLog", back_populates="user")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    action = Column(String, nullable=False)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="audit_logs")

