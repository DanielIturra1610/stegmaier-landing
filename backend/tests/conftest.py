"""
PyTest Configuration and Fixtures
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock
from app.main import app
from app.domain.entities.user import User, UserRole
from app.domain.entities.course import Course, CourseLevel
from app.domain.entities.lesson import Lesson, ContentType

@pytest.fixture
def client() -> TestClient:
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_user_repository():
    """Mock user repository"""
    mock_repo = Mock()
    mock_repo.create = AsyncMock()
    mock_repo.get_by_id = AsyncMock()
    mock_repo.get_by_email = AsyncMock()
    mock_repo.update = AsyncMock()
    mock_repo.delete = AsyncMock()
    mock_repo.list = AsyncMock()
    mock_repo.count = AsyncMock()
    return mock_repo

@pytest.fixture
def mock_course_repository():
    """Mock course repository"""
    mock_repo = Mock()
    mock_repo.create = AsyncMock()
    mock_repo.get_by_id = AsyncMock()
    mock_repo.list = AsyncMock()
    mock_repo.update = AsyncMock()
    mock_repo.delete = AsyncMock()
    mock_repo.count = AsyncMock()
    return mock_repo

@pytest.fixture
def mock_lesson_repository():
    """Mock lesson repository"""
    mock_repo = Mock()
    mock_repo.create = AsyncMock()
    mock_repo.get_by_id = AsyncMock()
    mock_repo.get_by_course_id = AsyncMock()
    mock_repo.update = AsyncMock()
    mock_repo.delete = AsyncMock()
    mock_repo.count_by_course_id = AsyncMock()
    return mock_repo

@pytest.fixture
def sample_user():
    """Sample user entity"""
    return User(
        id="user123",
        email="test@example.com",
        name="Test User",
        hashed_password="hashed_password",
        role=UserRole.STUDENT,
        is_active=True
    )

@pytest.fixture
def sample_admin_user():
    """Sample admin user entity"""
    return User(
        id="admin123",
        email="admin@example.com",
        name="Admin User",
        hashed_password="hashed_password",
        role=UserRole.ADMIN,
        is_active=True
    )

@pytest.fixture
def sample_instructor_user():
    """Sample instructor user entity"""
    return User(
        id="instructor123",
        email="instructor@example.com",
        name="Instructor User",
        hashed_password="hashed_password",
        role=UserRole.INSTRUCTOR,
        is_active=True
    )

@pytest.fixture
def sample_course():
    """Sample course entity"""
    return Course(
        id="course123",
        title="Test Course",
        description="A test course description",
        instructor_id="instructor123",
        level=CourseLevel.BEGINNER,
        category="programming",
        is_published=True,
        price=99.99
    )

@pytest.fixture
def sample_lesson():
    """Sample lesson entity"""
    return Lesson(
        id="lesson123",
        title="Test Lesson",
        description="A test lesson description",
        course_id="course123",
        content_type=ContentType.VIDEO,
        order=1,
        duration=600,
        is_free=True
    )

@pytest.fixture
def auth_headers():
    """Mock authentication headers"""
    return {"Authorization": "Bearer mock-jwt-token"}

@pytest.fixture
def mock_jwt_payload():
    """Mock JWT payload"""
    return {
        "sub": "user123",
        "email": "test@example.com",
        "role": "student",
        "exp": 9999999999  # Far future expiration
    }

@pytest.fixture
def mock_admin_jwt_payload():
    """Mock admin JWT payload"""
    return {
        "sub": "admin123",
        "email": "admin@example.com", 
        "role": "admin",
        "exp": 9999999999
    }

@pytest.fixture
def mock_instructor_jwt_payload():
    """Mock instructor JWT payload"""
    return {
        "sub": "instructor123",
        "email": "instructor@example.com",
        "role": "instructor",
        "exp": 9999999999
    }

class AsyncMockContextManager:
    """Helper for async context managers in tests"""
    def __init__(self, mock_obj):
        self.mock_obj = mock_obj
    
    async def __aenter__(self):
        return self.mock_obj
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

@pytest.fixture
def mock_database_session():
    """Mock database session"""
    mock_session = Mock()
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()
    return AsyncMockContextManager(mock_session)

# Helper functions for test data creation
def create_test_user(**kwargs):
    """Create test user with default values"""
    defaults = {
        "id": "test_user_id",
        "email": "test@example.com",
        "name": "Test User",
        "hashed_password": "hashed_password",
        "role": UserRole.STUDENT,
        "is_active": True
    }
    defaults.update(kwargs)
    return User(**defaults)

def create_test_course(**kwargs):
    """Create test course with default values"""
    defaults = {
        "id": "test_course_id",
        "title": "Test Course",
        "description": "Test description",
        "instructor_id": "instructor_id",
        "level": CourseLevel.BEGINNER,
        "category": "programming",
        "is_published": True,
        "price": 99.99
    }
    defaults.update(kwargs)
    return Course(**defaults)

def create_test_lesson(**kwargs):
    """Create test lesson with default values"""
    defaults = {
        "id": "test_lesson_id",
        "title": "Test Lesson",
        "description": "Test lesson description",
        "course_id": "test_course_id",
        "content_type": ContentType.VIDEO,
        "order": 1,
        "duration": 600,
        "is_free": True
    }
    defaults.update(kwargs)
    return Lesson(**defaults)
