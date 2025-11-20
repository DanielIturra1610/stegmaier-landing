package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/google/uuid"
)

// CourseRepository defines the interface for course data access
type CourseRepository interface {
	// GetCourse retrieves a course by ID
	GetCourse(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.Course, error)

	// GetCourseBySlug retrieves a course by its slug
	GetCourseBySlug(ctx context.Context, slug string, tenantID uuid.UUID) (*domain.Course, error)

	// ListCourses retrieves a paginated list of courses with filters
	ListCourses(ctx context.Context, tenantID uuid.UUID, req *domain.ListCoursesRequest) ([]*domain.Course, int, error)

	// CreateCourse creates a new course
	CreateCourse(ctx context.Context, course *domain.Course) error

	// UpdateCourse updates an existing course
	UpdateCourse(ctx context.Context, course *domain.Course) error

	// DeleteCourse soft deletes a course
	DeleteCourse(ctx context.Context, courseID, tenantID uuid.UUID) error

	// PublishCourse publishes a course (changes status to published)
	PublishCourse(ctx context.Context, courseID, tenantID uuid.UUID) error

	// UnpublishCourse unpublishes a course (changes status to draft)
	UnpublishCourse(ctx context.Context, courseID, tenantID uuid.UUID) error

	// ArchiveCourse archives a course
	ArchiveCourse(ctx context.Context, courseID, tenantID uuid.UUID) error

	// CourseExists checks if a course exists
	CourseExists(ctx context.Context, courseID, tenantID uuid.UUID) (bool, error)

	// SlugExists checks if a slug is already in use
	SlugExists(ctx context.Context, slug string, tenantID uuid.UUID, excludeCourseID *uuid.UUID) (bool, error)

	// GetCoursesByInstructor retrieves all courses by an instructor
	GetCoursesByInstructor(ctx context.Context, instructorID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Course, int, error)

	// GetCoursesByCategory retrieves all courses in a category
	GetCoursesByCategory(ctx context.Context, categoryID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Course, int, error)

	// UpdateEnrollmentCount updates the enrollment count for a course
	UpdateEnrollmentCount(ctx context.Context, courseID, tenantID uuid.UUID, count int) error

	// UpdateRating updates the rating statistics for a course
	UpdateRating(ctx context.Context, courseID, tenantID uuid.UUID, rating float64, count int) error

	// SyncRatingFromReviews syncs course rating from the course_ratings table
	SyncRatingFromReviews(ctx context.Context, courseID, tenantID uuid.UUID) error

	// GetPublishedCourses retrieves all published courses
	GetPublishedCourses(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.Course, int, error)
}

// CourseCategoryRepository defines the interface for course category data access
type CourseCategoryRepository interface {
	// GetCategory retrieves a category by ID
	GetCategory(ctx context.Context, categoryID, tenantID uuid.UUID) (*domain.CourseCategory, error)

	// GetCategoryBySlug retrieves a category by its slug
	GetCategoryBySlug(ctx context.Context, slug string, tenantID uuid.UUID) (*domain.CourseCategory, error)

	// ListCategories retrieves all categories for a tenant
	ListCategories(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseCategory, int, error)

	// ListActiveCategories retrieves all active categories
	ListActiveCategories(ctx context.Context, tenantID uuid.UUID) ([]*domain.CourseCategory, error)

	// CreateCategory creates a new category
	CreateCategory(ctx context.Context, category *domain.CourseCategory) error

	// UpdateCategory updates an existing category
	UpdateCategory(ctx context.Context, category *domain.CourseCategory) error

	// DeleteCategory deletes a category (only if no courses are associated)
	DeleteCategory(ctx context.Context, categoryID, tenantID uuid.UUID) error

	// CategoryExists checks if a category exists
	CategoryExists(ctx context.Context, categoryID, tenantID uuid.UUID) (bool, error)

	// CategorySlugExists checks if a category slug is already in use
	CategorySlugExists(ctx context.Context, slug string, tenantID uuid.UUID, excludeCategoryID *uuid.UUID) (bool, error)

	// GetSubcategories retrieves all subcategories of a parent category
	GetSubcategories(ctx context.Context, parentID, tenantID uuid.UUID) ([]*domain.CourseCategory, error)

	// IncrementCourseCount increments the course count for a category
	IncrementCourseCount(ctx context.Context, categoryID, tenantID uuid.UUID) error

	// DecrementCourseCount decrements the course count for a category
	DecrementCourseCount(ctx context.Context, categoryID, tenantID uuid.UUID) error

	// UpdateCourseCount updates the course count for a category
	UpdateCourseCount(ctx context.Context, categoryID, tenantID uuid.UUID, count int) error
}

// CourseService defines the business logic interface for course management
type CourseService interface {
	// GetCourse retrieves a course by ID
	GetCourse(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.CourseDetailResponse, error)

	// GetCourseBySlug retrieves a course by its slug
	GetCourseBySlug(ctx context.Context, slug string, tenantID uuid.UUID) (*domain.CourseDetailResponse, error)

	// ListCourses retrieves a paginated list of courses with filters
	ListCourses(ctx context.Context, tenantID uuid.UUID, req *domain.ListCoursesRequest) (*domain.ListCoursesResponse, error)

	// CreateCourse creates a new course
	CreateCourse(ctx context.Context, tenantID uuid.UUID, req *domain.CreateCourseRequest) (*domain.CourseDetailResponse, error)

	// UpdateCourse updates an existing course
	UpdateCourse(ctx context.Context, courseID, tenantID uuid.UUID, req *domain.UpdateCourseRequest) (*domain.CourseDetailResponse, error)

	// DeleteCourse soft deletes a course
	DeleteCourse(ctx context.Context, courseID, tenantID uuid.UUID) error

	// PublishCourse publishes a course (instructor/admin only)
	PublishCourse(ctx context.Context, courseID, tenantID uuid.UUID) error

	// UnpublishCourse unpublishes a course (instructor/admin only)
	UnpublishCourse(ctx context.Context, courseID, tenantID uuid.UUID) error

	// ArchiveCourse archives a course (instructor/admin only)
	ArchiveCourse(ctx context.Context, courseID, tenantID uuid.UUID) error

	// GetCoursesByInstructor retrieves all courses by an instructor
	GetCoursesByInstructor(ctx context.Context, instructorID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCoursesResponse, error)

	// GetCoursesByCategory retrieves all courses in a category
	GetCoursesByCategory(ctx context.Context, categoryID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCoursesResponse, error)

	// RateCourse adds/updates a rating for a course
	RateCourse(ctx context.Context, courseID, tenantID uuid.UUID, req *domain.RateCourseRequest) error

	// EnrollCourse enrolls a user in a course (increments enrollment count)
	EnrollCourse(ctx context.Context, courseID, userID, tenantID uuid.UUID) error

	// UnenrollCourse removes a user from a course (decrements enrollment count)
	UnenrollCourse(ctx context.Context, courseID, userID, tenantID uuid.UUID) error

	// GetPublishedCourses retrieves all published courses
	GetPublishedCourses(ctx context.Context, tenantID uuid.UUID, page, pageSize int) (*domain.ListCoursesResponse, error)
}

// CourseCategoryService defines the business logic interface for category management
type CourseCategoryService interface {
	// GetCategory retrieves a category by ID
	GetCategory(ctx context.Context, categoryID, tenantID uuid.UUID) (*domain.CourseCategoryResponse, error)

	// GetCategoryBySlug retrieves a category by its slug
	GetCategoryBySlug(ctx context.Context, slug string, tenantID uuid.UUID) (*domain.CourseCategoryResponse, error)

	// ListCategories retrieves all categories for a tenant
	ListCategories(ctx context.Context, tenantID uuid.UUID, page, pageSize int) (*domain.ListCategoriesResponse, error)

	// ListActiveCategories retrieves all active categories
	ListActiveCategories(ctx context.Context, tenantID uuid.UUID) ([]*domain.CourseCategoryResponse, error)

	// CreateCategory creates a new category (admin only)
	CreateCategory(ctx context.Context, tenantID uuid.UUID, req *domain.CreateCourseCategoryRequest) (*domain.CourseCategoryResponse, error)

	// UpdateCategory updates an existing category (admin only)
	UpdateCategory(ctx context.Context, categoryID, tenantID uuid.UUID, req *domain.UpdateCourseCategoryRequest) (*domain.CourseCategoryResponse, error)

	// DeleteCategory deletes a category (admin only, only if no courses are associated)
	DeleteCategory(ctx context.Context, categoryID, tenantID uuid.UUID) error

	// ActivateCategory activates a category (admin only)
	ActivateCategory(ctx context.Context, categoryID, tenantID uuid.UUID) error

	// DeactivateCategory deactivates a category (admin only)
	DeactivateCategory(ctx context.Context, categoryID, tenantID uuid.UUID) error

	// GetSubcategories retrieves all subcategories of a parent category
	GetSubcategories(ctx context.Context, parentID, tenantID uuid.UUID) ([]*domain.CourseCategoryResponse, error)
}
