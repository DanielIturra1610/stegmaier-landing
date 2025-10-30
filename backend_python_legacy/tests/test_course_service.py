"""
Course Service Tests
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
from app.application.services.course_service import CourseService
from app.domain.entities.course import Course, CourseLevel
from app.application.dtos.course_dto import CourseCreate, CourseUpdate

class TestCourseService:
    """Test suite for CourseService"""
    
    @pytest.fixture
    def mock_course_repository(self):
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
    def mock_lesson_repository(self):
        """Mock lesson repository"""
        mock_repo = Mock()
        mock_repo.get_by_course_id = AsyncMock()
        mock_repo.count_by_course_id = AsyncMock()
        return mock_repo
    
    @pytest.fixture
    def course_service(self, mock_course_repository, mock_lesson_repository):
        """Course service with mocked dependencies"""
        return CourseService(mock_course_repository, mock_lesson_repository)
    
    @pytest.fixture
    def sample_course(self):
        """Sample course entity"""
        return Course(
            id="course123",
            title="Test Course",
            description="A test course",
            instructor_id="instructor123",
            level=CourseLevel.BEGINNER,
            category="programming",
            is_published=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    @pytest.fixture
    def course_create_data(self):
        """Sample course creation data"""
        return CourseCreate(
            title="New Course",
            description="A new test course",
            instructor_id="instructor123",
            level=CourseLevel.INTERMEDIATE,
            category="design",
            price=99.99
        )

    @pytest.mark.asyncio
    async def test_create_course_success(self, course_service, mock_course_repository, course_create_data, sample_course):
        """Test successful course creation"""
        mock_course_repository.create.return_value = sample_course
        
        result = await course_service.create_course(course_create_data)
        
        assert result == sample_course
        mock_course_repository.create.assert_called_once()
        
        # Verify the course entity was created with correct data
        create_call_args = mock_course_repository.create.call_args[0][0]
        assert create_call_args.title == course_create_data.title
        assert create_call_args.description == course_create_data.description
        assert create_call_args.instructor_id == course_create_data.instructor_id

    @pytest.mark.asyncio
    async def test_get_course_by_id_exists(self, course_service, mock_course_repository, sample_course):
        """Test getting course by ID when course exists"""
        mock_course_repository.get_by_id.return_value = sample_course
        
        result = await course_service.get_course_by_id("course123")
        
        assert result == sample_course
        mock_course_repository.get_by_id.assert_called_once_with("course123")

    @pytest.mark.asyncio
    async def test_get_course_by_id_not_exists(self, course_service, mock_course_repository):
        """Test getting course by ID when course doesn't exist"""
        mock_course_repository.get_by_id.return_value = None
        
        result = await course_service.get_course_by_id("nonexistent")
        
        assert result is None
        mock_course_repository.get_by_id.assert_called_once_with("nonexistent")

    @pytest.mark.asyncio
    async def test_list_courses_with_filters(self, course_service, mock_course_repository):
        """Test listing courses with filters"""
        sample_courses = [
            Course(id="1", title="Course 1", instructor_id="inst1", level=CourseLevel.BEGINNER),
            Course(id="2", title="Course 2", instructor_id="inst1", level=CourseLevel.INTERMEDIATE)
        ]
        mock_course_repository.list.return_value = sample_courses
        
        result = await course_service.list_courses(skip=0, limit=10, is_published=True)
        
        assert result == sample_courses
        mock_course_repository.list.assert_called_once_with(
            skip=0, 
            limit=10, 
            filters={"is_published": True}
        )

    @pytest.mark.asyncio
    async def test_update_course_success(self, course_service, mock_course_repository, sample_course):
        """Test successful course update"""
        update_data = CourseUpdate(title="Updated Course", description="Updated description")
        updated_course = Course(**{**sample_course.__dict__, "title": "Updated Course"})
        
        mock_course_repository.get_by_id.return_value = sample_course
        mock_course_repository.update.return_value = updated_course
        
        result = await course_service.update_course("course123", update_data)
        
        assert result.title == "Updated Course"
        mock_course_repository.get_by_id.assert_called_once_with("course123")
        mock_course_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_course_not_found(self, course_service, mock_course_repository):
        """Test updating non-existent course"""
        update_data = CourseUpdate(title="Updated Course")
        mock_course_repository.get_by_id.return_value = None
        
        result = await course_service.update_course("nonexistent", update_data)
        
        assert result is None
        mock_course_repository.get_by_id.assert_called_once_with("nonexistent")
        mock_course_repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_course_success(self, course_service, mock_course_repository, sample_course):
        """Test successful course deletion"""
        mock_course_repository.get_by_id.return_value = sample_course
        mock_course_repository.delete.return_value = True
        
        result = await course_service.delete_course("course123")
        
        assert result is True
        mock_course_repository.get_by_id.assert_called_once_with("course123")
        mock_course_repository.delete.assert_called_once_with("course123")

    @pytest.mark.asyncio
    async def test_delete_course_not_found(self, course_service, mock_course_repository):
        """Test deleting non-existent course"""
        mock_course_repository.get_by_id.return_value = None
        
        result = await course_service.delete_course("nonexistent")
        
        assert result is False
        mock_course_repository.get_by_id.assert_called_once_with("nonexistent")
        mock_course_repository.delete.assert_not_called()

    @pytest.mark.asyncio
    async def test_publish_course_admin_toggle_to_published(self, course_service, mock_course_repository, sample_course):
        """Test publishing an unpublished course"""
        unpublished_course = Course(**{**sample_course.__dict__, "is_published": False})
        published_course = Course(**{**sample_course.__dict__, "is_published": True})
        
        mock_course_repository.get_by_id.return_value = unpublished_course
        mock_course_repository.update.return_value = published_course
        
        result = await course_service.publish_course_admin("course123")
        
        assert result.is_published is True
        mock_course_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_publish_course_admin_toggle_to_draft(self, course_service, mock_course_repository, sample_course):
        """Test unpublishing a published course"""
        published_course = Course(**{**sample_course.__dict__, "is_published": True})
        unpublished_course = Course(**{**sample_course.__dict__, "is_published": False})
        
        mock_course_repository.get_by_id.return_value = published_course
        mock_course_repository.update.return_value = unpublished_course
        
        result = await course_service.publish_course_admin("course123")
        
        assert result.is_published is False
        mock_course_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_count_courses_by_status(self, course_service, mock_course_repository):
        """Test counting courses by publication status"""
        mock_course_repository.count.return_value = 15
        
        result = await course_service.count_published_courses()
        
        assert result == 15
        mock_course_repository.count.assert_called_once_with(filters={"is_published": True})

    @pytest.mark.asyncio
    async def test_get_courses_by_instructor(self, course_service, mock_course_repository):
        """Test getting courses by instructor ID"""
        instructor_courses = [
            Course(id="1", title="Course 1", instructor_id="inst1", level=CourseLevel.BEGINNER),
            Course(id="2", title="Course 2", instructor_id="inst1", level=CourseLevel.INTERMEDIATE)
        ]
        mock_course_repository.list.return_value = instructor_courses
        
        result = await course_service.get_courses_by_instructor("inst1")
        
        assert result == instructor_courses
        mock_course_repository.list.assert_called_once_with(
            skip=0,
            limit=1000,
            filters={"instructor_id": "inst1"}
        )

    @pytest.mark.asyncio
    async def test_course_with_lessons_count(self, course_service, mock_course_repository, mock_lesson_repository, sample_course):
        """Test getting course with lessons count"""
        mock_course_repository.get_by_id.return_value = sample_course
        mock_lesson_repository.count_by_course_id.return_value = 8
        
        result = await course_service.get_course_with_stats("course123")
        
        assert result.lessons_count == 8
        mock_lesson_repository.count_by_course_id.assert_called_once_with("course123")

    @pytest.mark.asyncio
    async def test_create_course_admin_with_validation(self, course_service, mock_course_repository, course_create_data):
        """Test admin course creation with additional validation"""
        created_course = Course(
            id="new_course",
            title=course_create_data.title,
            instructor_id=course_create_data.instructor_id,
            level=course_create_data.level
        )
        mock_course_repository.create.return_value = created_course
        
        result = await course_service.create_course_admin(course_create_data)
        
        assert result == created_course
        mock_course_repository.create.assert_called_once()
        
        # Verify admin-specific validations (like setting is_published to False initially)
        create_call_args = mock_course_repository.create.call_args[0][0]
        assert create_call_args.is_published is False  # Courses start as drafts in admin

    @pytest.mark.asyncio
    async def test_get_popular_courses(self, course_service, mock_course_repository):
        """Test getting popular courses based on enrollments"""
        popular_courses = [
            Course(id="1", title="Popular Course 1", instructor_id="inst1"),
            Course(id="2", title="Popular Course 2", instructor_id="inst2")
        ]
        
        # Mock repository to return courses ordered by popularity
        mock_course_repository.list.return_value = popular_courses
        
        result = await course_service.get_popular_courses(limit=5)
        
        assert result == popular_courses
        mock_course_repository.list.assert_called_once_with(
            skip=0,
            limit=5,
            filters={"is_published": True},
            order_by="enrollments_count",
            order_direction="desc"
        )
