package services

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/ports"
	"github.com/google/uuid"
)

// CourseServiceImpl implements the CourseService interface
type CourseServiceImpl struct {
	courseRepo   ports.CourseRepository
	categoryRepo ports.CourseCategoryRepository
}

// NewCourseService creates a new course service instance
func NewCourseService(
	courseRepo ports.CourseRepository,
	categoryRepo ports.CourseCategoryRepository,
) ports.CourseService {
	return &CourseServiceImpl{
		courseRepo:   courseRepo,
		categoryRepo: categoryRepo,
	}
}

// GetCourse retrieves a course by ID
func (s *CourseServiceImpl) GetCourse(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.CourseDetailResponse, error) {
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("GetCourse", err, "failed to get course")
	}

	// Check if course is deleted
	if course.DeletedAt != nil {
		return nil, ports.NewCourseError("GetCourse", ports.ErrCourseDeleted, "course has been deleted")
	}

	return domain.CourseToDetailResponse(course), nil
}

// GetCourseBySlug retrieves a course by its slug
func (s *CourseServiceImpl) GetCourseBySlug(ctx context.Context, slug string, tenantID uuid.UUID) (*domain.CourseDetailResponse, error) {
	course, err := s.courseRepo.GetCourseBySlug(ctx, slug, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("GetCourseBySlug", err, "failed to get course by slug")
	}

	// Check if course is deleted
	if course.DeletedAt != nil {
		return nil, ports.NewCourseError("GetCourseBySlug", ports.ErrCourseDeleted, "course has been deleted")
	}

	return domain.CourseToDetailResponse(course), nil
}

// ListCourses retrieves a paginated list of courses with filters
func (s *CourseServiceImpl) ListCourses(ctx context.Context, tenantID uuid.UUID, req *domain.ListCoursesRequest) (*domain.ListCoursesResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, ports.NewCourseError("ListCourses", err, "invalid request")
	}

	// Get courses from repository
	courses, total, err := s.courseRepo.ListCourses(ctx, tenantID, req)
	if err != nil {
		return nil, ports.NewCourseError("ListCourses", err, "failed to list courses")
	}

	return domain.CoursesToListResponse(courses, total, req.Page, req.PageSize), nil
}

// CreateCourse creates a new course
func (s *CourseServiceImpl) CreateCourse(ctx context.Context, tenantID uuid.UUID, req *domain.CreateCourseRequest) (*domain.CourseDetailResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, ports.NewCourseError("CreateCourse", err, "invalid course data")
	}

	// Check if slug already exists
	exists, err := s.courseRepo.SlugExists(ctx, req.Slug, tenantID, nil)
	if err != nil {
		return nil, ports.NewCourseError("CreateCourse", err, "failed to check slug")
	}
	if exists {
		return nil, ports.NewCourseError("CreateCourse", ports.ErrCourseSlugExists, "slug already in use")
	}

	// Validate category if provided
	if req.CategoryID != nil {
		category, err := s.categoryRepo.GetCategory(ctx, *req.CategoryID, tenantID)
		if err != nil {
			return nil, ports.NewCourseError("CreateCourse", ports.ErrInvalidCategory, "invalid category")
		}
		if !category.IsActive {
			return nil, ports.NewCourseError("CreateCourse", ports.ErrCategoryInactive, "category is inactive")
		}
	}

	// Create course entity
	course := domain.NewCourse(
		tenantID,
		req.InstructorID,
		req.Title,
		req.Slug,
		req.Description,
		req.Level,
	)

	// Set optional fields
	course.CategoryID = req.CategoryID
	course.Duration = req.Duration
	course.Price = req.Price
	course.Thumbnail = req.Thumbnail
	course.PreviewVideo = req.PreviewVideo
	course.Requirements = req.Requirements
	course.WhatYouWillLearn = req.WhatYouWillLearn
	course.TargetAudience = req.TargetAudience

	// Create in repository
	if err := s.courseRepo.CreateCourse(ctx, course); err != nil {
		return nil, ports.NewCourseError("CreateCourse", err, "failed to create course")
	}

	// Increment category course count if category is set
	if course.CategoryID != nil {
		if err := s.categoryRepo.IncrementCourseCount(ctx, *course.CategoryID, tenantID); err != nil {
			// Log error but don't fail the creation
			// The count can be corrected later
		}
	}

	return domain.CourseToDetailResponse(course), nil
}

// UpdateCourse updates an existing course
func (s *CourseServiceImpl) UpdateCourse(ctx context.Context, courseID, tenantID uuid.UUID, req *domain.UpdateCourseRequest) (*domain.CourseDetailResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, ports.NewCourseError("UpdateCourse", err, "invalid course data")
	}

	// Check if request has any updates
	if !req.HasUpdates() {
		return nil, ports.NewCourseError("UpdateCourse", ports.ErrInvalidInput, "no updates provided")
	}

	// Get existing course
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("UpdateCourse", err, "course not found")
	}

	// Check if course is deleted
	if course.DeletedAt != nil {
		return nil, ports.NewCourseError("UpdateCourse", ports.ErrCourseDeleted, "cannot update deleted course")
	}

	// Check if slug is being changed and if new slug exists
	if req.Slug != nil && *req.Slug != course.Slug {
		exists, err := s.courseRepo.SlugExists(ctx, *req.Slug, tenantID, &courseID)
		if err != nil {
			return nil, ports.NewCourseError("UpdateCourse", err, "failed to check slug")
		}
		if exists {
			return nil, ports.NewCourseError("UpdateCourse", ports.ErrCourseSlugExists, "slug already in use")
		}
	}

	// Handle category change
	oldCategoryID := course.CategoryID
	newCategoryID := req.CategoryID

	// Validate new category if provided
	if newCategoryID != nil {
		category, err := s.categoryRepo.GetCategory(ctx, *newCategoryID, tenantID)
		if err != nil {
			return nil, ports.NewCourseError("UpdateCourse", ports.ErrInvalidCategory, "invalid category")
		}
		if !category.IsActive {
			return nil, ports.NewCourseError("UpdateCourse", ports.ErrCategoryInactive, "category is inactive")
		}
	}

	// Apply updates
	if err := req.ApplyToCourse(course); err != nil {
		return nil, ports.NewCourseError("UpdateCourse", err, "failed to apply updates")
	}

	// Update in repository
	if err := s.courseRepo.UpdateCourse(ctx, course); err != nil {
		return nil, ports.NewCourseError("UpdateCourse", err, "failed to update course")
	}

	// Update category counts if category changed
	if oldCategoryID != nil && newCategoryID != nil && *oldCategoryID != *newCategoryID {
		// Decrement old category count
		if err := s.categoryRepo.DecrementCourseCount(ctx, *oldCategoryID, tenantID); err != nil {
			// Log error but don't fail the update
		}
		// Increment new category count
		if err := s.categoryRepo.IncrementCourseCount(ctx, *newCategoryID, tenantID); err != nil {
			// Log error but don't fail the update
		}
	} else if oldCategoryID == nil && newCategoryID != nil {
		// Category was added
		if err := s.categoryRepo.IncrementCourseCount(ctx, *newCategoryID, tenantID); err != nil {
			// Log error but don't fail the update
		}
	} else if oldCategoryID != nil && newCategoryID == nil {
		// Category was removed
		if err := s.categoryRepo.DecrementCourseCount(ctx, *oldCategoryID, tenantID); err != nil {
			// Log error but don't fail the update
		}
	}

	return domain.CourseToDetailResponse(course), nil
}

// DeleteCourse soft deletes a course
func (s *CourseServiceImpl) DeleteCourse(ctx context.Context, courseID, tenantID uuid.UUID) error {
	// Check if course exists
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return ports.NewCourseError("DeleteCourse", err, "course not found")
	}

	// Check if already deleted
	if course.DeletedAt != nil {
		return ports.NewCourseError("DeleteCourse", ports.ErrCourseDeleted, "course already deleted")
	}

	// Soft delete the course
	if err := s.courseRepo.DeleteCourse(ctx, courseID, tenantID); err != nil {
		return ports.NewCourseError("DeleteCourse", err, "failed to delete course")
	}

	// Decrement category course count if course has a category
	if course.CategoryID != nil {
		if err := s.categoryRepo.DecrementCourseCount(ctx, *course.CategoryID, tenantID); err != nil {
			// Log error but don't fail the deletion
		}
	}

	return nil
}

// PublishCourse publishes a course (instructor/admin only)
func (s *CourseServiceImpl) PublishCourse(ctx context.Context, courseID, tenantID uuid.UUID) error {
	// Get course
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return ports.NewCourseError("PublishCourse", err, "course not found")
	}

	// Check if course is deleted
	if course.DeletedAt != nil {
		return ports.NewCourseError("PublishCourse", ports.ErrCourseDeleted, "cannot publish deleted course")
	}

	// Check if already published
	if course.Status == domain.CourseStatusPublished {
		return nil // Already published, no error
	}

	// Check if course is archived
	if course.Status == domain.CourseStatusArchived {
		return ports.NewCourseError("PublishCourse", ports.ErrCourseArchived, "cannot publish archived course")
	}

	// Publish the course
	if err := s.courseRepo.PublishCourse(ctx, courseID, tenantID); err != nil {
		return ports.NewCourseError("PublishCourse", err, "failed to publish course")
	}

	return nil
}

// UnpublishCourse unpublishes a course (instructor/admin only)
func (s *CourseServiceImpl) UnpublishCourse(ctx context.Context, courseID, tenantID uuid.UUID) error {
	// Get course
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return ports.NewCourseError("UnpublishCourse", err, "course not found")
	}

	// Check if course is deleted
	if course.DeletedAt != nil {
		return ports.NewCourseError("UnpublishCourse", ports.ErrCourseDeleted, "cannot unpublish deleted course")
	}

	// Check if already draft
	if course.Status == domain.CourseStatusDraft {
		return nil // Already unpublished, no error
	}

	// Unpublish the course
	if err := s.courseRepo.UnpublishCourse(ctx, courseID, tenantID); err != nil {
		return ports.NewCourseError("UnpublishCourse", err, "failed to unpublish course")
	}

	return nil
}

// ArchiveCourse archives a course (instructor/admin only)
func (s *CourseServiceImpl) ArchiveCourse(ctx context.Context, courseID, tenantID uuid.UUID) error {
	// Get course
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return ports.NewCourseError("ArchiveCourse", err, "course not found")
	}

	// Check if course is deleted
	if course.DeletedAt != nil {
		return ports.NewCourseError("ArchiveCourse", ports.ErrCourseDeleted, "cannot archive deleted course")
	}

	// Check if already archived
	if course.Status == domain.CourseStatusArchived {
		return nil // Already archived, no error
	}

	// Archive the course
	if err := s.courseRepo.ArchiveCourse(ctx, courseID, tenantID); err != nil {
		return ports.NewCourseError("ArchiveCourse", err, "failed to archive course")
	}

	return nil
}

// GetCoursesByInstructor retrieves all courses by an instructor
func (s *CourseServiceImpl) GetCoursesByInstructor(ctx context.Context, instructorID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCoursesResponse, error) {
	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get courses
	courses, total, err := s.courseRepo.GetCoursesByInstructor(ctx, instructorID, tenantID, page, pageSize)
	if err != nil {
		return nil, ports.NewCourseError("GetCoursesByInstructor", err, "failed to get courses")
	}

	return domain.CoursesToListResponse(courses, total, page, pageSize), nil
}

// GetCoursesByCategory retrieves all courses in a category
func (s *CourseServiceImpl) GetCoursesByCategory(ctx context.Context, categoryID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCoursesResponse, error) {
	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Check if category exists
	_, err := s.categoryRepo.GetCategory(ctx, categoryID, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("GetCoursesByCategory", err, "category not found")
	}

	// Get courses
	courses, total, err := s.courseRepo.GetCoursesByCategory(ctx, categoryID, tenantID, page, pageSize)
	if err != nil {
		return nil, ports.NewCourseError("GetCoursesByCategory", err, "failed to get courses")
	}

	return domain.CoursesToListResponse(courses, total, page, pageSize), nil
}

// RateCourse adds/updates a rating for a course
func (s *CourseServiceImpl) RateCourse(ctx context.Context, courseID, tenantID uuid.UUID, req *domain.RateCourseRequest) error {
	// Validate request
	if err := req.Validate(); err != nil {
		return ports.NewCourseError("RateCourse", err, "invalid rating data")
	}

	// Get course
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return ports.NewCourseError("RateCourse", err, "course not found")
	}

	// Check if course can be rated
	if !course.CanBeEnrolled() {
		return ports.NewCourseError("RateCourse", ports.ErrCourseNotPublished, "course must be published to be rated")
	}

	// Note: In a real implementation, you would check if the user is the instructor
	// This would require passing userID as a parameter to this method
	// For now, we skip this check

	// For now, we'll just update the rating statistics
	// In a real application, you would store individual ratings and calculate the average
	// This is a simplified implementation
	newRating := ((course.Rating * float64(course.RatingCount)) + req.Rating) / float64(course.RatingCount+1)
	newCount := course.RatingCount + 1

	// Update rating
	if err := s.courseRepo.UpdateRating(ctx, courseID, tenantID, newRating, newCount); err != nil {
		return ports.NewCourseError("RateCourse", err, "failed to update rating")
	}

	return nil
}

// EnrollCourse enrolls a user in a course (increments enrollment count)
func (s *CourseServiceImpl) EnrollCourse(ctx context.Context, courseID, userID, tenantID uuid.UUID) error {
	// Get course
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return ports.NewCourseError("EnrollCourse", err, "course not found")
	}

	// Check if course can be enrolled
	if !course.CanBeEnrolled() {
		return ports.NewCourseError("EnrollCourse", ports.ErrCourseNotEnrollable, "course is not available for enrollment")
	}

	// Increment enrollment count
	newCount := course.EnrollmentCount + 1
	if err := s.courseRepo.UpdateEnrollmentCount(ctx, courseID, tenantID, newCount); err != nil {
		return ports.NewCourseError("EnrollCourse", err, "failed to update enrollment count")
	}

	return nil
}

// UnenrollCourse removes a user from a course (decrements enrollment count)
func (s *CourseServiceImpl) UnenrollCourse(ctx context.Context, courseID, userID, tenantID uuid.UUID) error {
	// Get course
	course, err := s.courseRepo.GetCourse(ctx, courseID, tenantID)
	if err != nil {
		return ports.NewCourseError("UnenrollCourse", err, "course not found")
	}

	// Check if enrollment count is already zero
	if course.EnrollmentCount == 0 {
		return ports.NewCourseError("UnenrollCourse", ports.ErrNotEnrolled, "user is not enrolled in this course")
	}

	// Decrement enrollment count
	newCount := course.EnrollmentCount - 1
	if err := s.courseRepo.UpdateEnrollmentCount(ctx, courseID, tenantID, newCount); err != nil {
		return ports.NewCourseError("UnenrollCourse", err, "failed to update enrollment count")
	}

	return nil
}

// GetPublishedCourses retrieves all published courses
func (s *CourseServiceImpl) GetPublishedCourses(ctx context.Context, tenantID uuid.UUID, page, pageSize int) (*domain.ListCoursesResponse, error) {
	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get published courses
	courses, total, err := s.courseRepo.GetPublishedCourses(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, ports.NewCourseError("GetPublishedCourses", err, "failed to get published courses")
	}

	return domain.CoursesToListResponse(courses, total, page, pageSize), nil
}
