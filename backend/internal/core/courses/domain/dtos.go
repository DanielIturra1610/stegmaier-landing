package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// ============================================================
// Request DTOs
// ============================================================

// CreateCourseRequest represents a request to create a new course
type CreateCourseRequest struct {
	Title            string     `json:"title" validate:"required,min=3,max=200"`
	Slug             string     `json:"slug" validate:"required,min=3,max=200"`
	Description      string     `json:"description" validate:"required,min=10"`
	InstructorID     uuid.UUID  `json:"instructorId" validate:"required"`
	CategoryID       *uuid.UUID `json:"categoryId,omitempty"`
	Level            CourseLevel `json:"level" validate:"required"`
	Duration         int        `json:"duration" validate:"min=0"`                // Duration in minutes
	Price            float64    `json:"price" validate:"min=0"`                   // Price in USD
	Thumbnail        *string    `json:"thumbnail,omitempty"`
	PreviewVideo     *string    `json:"previewVideo,omitempty"`
	Requirements     []string   `json:"requirements,omitempty"`
	WhatYouWillLearn []string   `json:"whatYouWillLearn,omitempty"`
	TargetAudience   []string   `json:"targetAudience,omitempty"`
}

// UpdateCourseRequest represents a request to update an existing course
type UpdateCourseRequest struct {
	Title            *string     `json:"title,omitempty"`
	Slug             *string     `json:"slug,omitempty"`
	Description      *string     `json:"description,omitempty"`
	CategoryID       *uuid.UUID  `json:"categoryId,omitempty"`
	Level            *CourseLevel `json:"level,omitempty"`
	Duration         *int        `json:"duration,omitempty"`
	Price            *float64    `json:"price,omitempty"`
	Thumbnail        *string     `json:"thumbnail,omitempty"`
	PreviewVideo     *string     `json:"previewVideo,omitempty"`
	Requirements     []string    `json:"requirements,omitempty"`
	WhatYouWillLearn []string    `json:"whatYouWillLearn,omitempty"`
	TargetAudience   []string    `json:"targetAudience,omitempty"`
}

// PublishCourseRequest represents a request to publish a course
type PublishCourseRequest struct {
	CourseID uuid.UUID `json:"courseId" validate:"required"`
}

// UnpublishCourseRequest represents a request to unpublish a course
type UnpublishCourseRequest struct {
	CourseID uuid.UUID `json:"courseId" validate:"required"`
}

// ArchiveCourseRequest represents a request to archive a course
type ArchiveCourseRequest struct {
	CourseID uuid.UUID `json:"courseId" validate:"required"`
}

// DeleteCourseRequest represents a request to soft delete a course
type DeleteCourseRequest struct {
	CourseID uuid.UUID `json:"courseId" validate:"required"`
}

// ListCoursesRequest represents a request to list courses with filters
type ListCoursesRequest struct {
	Page         int          `json:"page" validate:"min=1"`
	PageSize     int          `json:"pageSize" validate:"min=1,max=100"`
	Search       *string      `json:"search,omitempty"`
	InstructorID *uuid.UUID   `json:"instructorId,omitempty"`
	CategoryID   *uuid.UUID   `json:"categoryId,omitempty"`
	Level        *CourseLevel `json:"level,omitempty"`
	Status       *CourseStatus `json:"status,omitempty"`
	MinPrice     *float64     `json:"minPrice,omitempty"`
	MaxPrice     *float64     `json:"maxPrice,omitempty"`
	IsFree       *bool        `json:"isFree,omitempty"`
	SortBy       *string      `json:"sortBy,omitempty"`    // title, created_at, rating, enrollment_count, price
	SortOrder    *string      `json:"sortOrder,omitempty"` // asc, desc
}

// CreateCourseCategoryRequest represents a request to create a course category
type CreateCourseCategoryRequest struct {
	Name         string     `json:"name" validate:"required,min=2,max=100"`
	Slug         string     `json:"slug" validate:"required,min=2,max=100"`
	Description  *string    `json:"description,omitempty"`
	ParentID     *uuid.UUID `json:"parentId,omitempty"`
	Icon         *string    `json:"icon,omitempty"`
	DisplayOrder int        `json:"displayOrder" validate:"min=0"`
}

// UpdateCourseCategoryRequest represents a request to update a course category
type UpdateCourseCategoryRequest struct {
	Name         *string    `json:"name,omitempty"`
	Slug         *string    `json:"slug,omitempty"`
	Description  *string    `json:"description,omitempty"`
	ParentID     *uuid.UUID `json:"parentId,omitempty"`
	Icon         *string    `json:"icon,omitempty"`
	DisplayOrder *int       `json:"displayOrder,omitempty"`
	IsActive     *bool      `json:"isActive,omitempty"`
}

// EnrollCourseRequest represents a request to enroll in a course
type EnrollCourseRequest struct {
	CourseID uuid.UUID `json:"courseId" validate:"required"`
	UserID   uuid.UUID `json:"userId" validate:"required"`
}

// RateCourseRequest represents a request to rate a course
type RateCourseRequest struct {
	CourseID uuid.UUID `json:"courseId" validate:"required"`
	Rating   float64   `json:"rating" validate:"required,min=0,max=5"`
}

// ============================================================
// Response DTOs
// ============================================================

// CourseResponse represents a course in list views
type CourseResponse struct {
	ID              uuid.UUID    `json:"id"`
	TenantID        uuid.UUID    `json:"tenantId"`
	Title           string       `json:"title"`
	Slug            string       `json:"slug"`
	Description     string       `json:"description"`
	InstructorID    uuid.UUID    `json:"instructorId"`
	InstructorName  string       `json:"instructorName,omitempty"`
	CategoryID      *uuid.UUID   `json:"categoryId,omitempty"`
	CategoryName    *string      `json:"categoryName,omitempty"`
	Status          CourseStatus `json:"status"`
	Level           CourseLevel  `json:"level"`
	Duration        int          `json:"duration"`
	Price           float64      `json:"price"`
	IsFree          bool         `json:"isFree"`
	Thumbnail       *string      `json:"thumbnail,omitempty"`
	EnrollmentCount int          `json:"enrollmentCount"`
	Rating          float64      `json:"rating"`
	RatingCount     int          `json:"ratingCount"`
	IsPublished     bool         `json:"isPublished"`
	PublishedAt     *time.Time   `json:"publishedAt,omitempty"`
	CreatedAt       time.Time    `json:"createdAt"`
	UpdatedAt       time.Time    `json:"updatedAt"`
}

// CourseDetailResponse represents detailed course information
type CourseDetailResponse struct {
	ID               uuid.UUID    `json:"id"`
	TenantID         uuid.UUID    `json:"tenantId"`
	Title            string       `json:"title"`
	Slug             string       `json:"slug"`
	Description      string       `json:"description"`
	InstructorID     uuid.UUID    `json:"instructorId"`
	InstructorName   string       `json:"instructorName,omitempty"`
	CategoryID       *uuid.UUID   `json:"categoryId,omitempty"`
	CategoryName     *string      `json:"categoryName,omitempty"`
	Status           CourseStatus `json:"status"`
	Level            CourseLevel  `json:"level"`
	Duration         int          `json:"duration"`
	Price            float64      `json:"price"`
	IsFree           bool         `json:"isFree"`
	Thumbnail        *string      `json:"thumbnail,omitempty"`
	PreviewVideo     *string      `json:"previewVideo,omitempty"`
	Requirements     []string     `json:"requirements"`
	WhatYouWillLearn []string     `json:"whatYouWillLearn"`
	TargetAudience   []string     `json:"targetAudience"`
	EnrollmentCount  int          `json:"enrollmentCount"`
	Rating           float64      `json:"rating"`
	RatingCount      int          `json:"ratingCount"`
	IsPublished      bool         `json:"isPublished"`
	PublishedAt      *time.Time   `json:"publishedAt,omitempty"`
	CanBeEnrolled    bool         `json:"canBeEnrolled"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
}

// CourseCategoryResponse represents a course category
type CourseCategoryResponse struct {
	ID           uuid.UUID  `json:"id"`
	TenantID     uuid.UUID  `json:"tenantId"`
	Name         string     `json:"name"`
	Slug         string     `json:"slug"`
	Description  *string    `json:"description,omitempty"`
	ParentID     *uuid.UUID `json:"parentId,omitempty"`
	ParentName   *string    `json:"parentName,omitempty"`
	Icon         *string    `json:"icon,omitempty"`
	DisplayOrder int        `json:"displayOrder"`
	IsActive     bool       `json:"isActive"`
	CourseCount  int        `json:"courseCount"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// ListCoursesResponse represents paginated course list response
type ListCoursesResponse struct {
	Courses    []*CourseResponse `json:"courses"`
	TotalCount int               `json:"totalCount"`
	Page       int               `json:"page"`
	PageSize   int               `json:"pageSize"`
	TotalPages int               `json:"totalPages"`
}

// ListCategoriesResponse represents paginated category list response
type ListCategoriesResponse struct {
	Categories []*CourseCategoryResponse `json:"categories"`
	TotalCount int                       `json:"totalCount"`
	Page       int                       `json:"page"`
	PageSize   int                       `json:"pageSize"`
	TotalPages int                       `json:"totalPages"`
}

// ============================================================
// Validation Methods
// ============================================================

// Validate validates the CreateCourseRequest
func (r *CreateCourseRequest) Validate() error {
	if r.Title == "" {
		return errors.New("course title is required")
	}
	if len(r.Title) < 3 || len(r.Title) > 200 {
		return errors.New("course title must be between 3 and 200 characters")
	}
	if r.Slug == "" {
		return errors.New("course slug is required")
	}
	if len(r.Slug) < 3 || len(r.Slug) > 200 {
		return errors.New("course slug must be between 3 and 200 characters")
	}
	if r.Description == "" {
		return errors.New("course description is required")
	}
	if len(r.Description) < 10 {
		return errors.New("course description must be at least 10 characters")
	}
	if r.InstructorID == uuid.Nil {
		return errors.New("instructor ID is required")
	}
	if !ValidateLevel(r.Level) {
		return errors.New("invalid course level")
	}
	if r.Duration < 0 {
		return errors.New("course duration cannot be negative")
	}
	if r.Price < 0 {
		return errors.New("course price cannot be negative")
	}
	return nil
}

// Validate validates the UpdateCourseRequest
func (r *UpdateCourseRequest) Validate() error {
	if r.Title != nil {
		if len(*r.Title) < 3 || len(*r.Title) > 200 {
			return errors.New("course title must be between 3 and 200 characters")
		}
	}
	if r.Slug != nil {
		if len(*r.Slug) < 3 || len(*r.Slug) > 200 {
			return errors.New("course slug must be between 3 and 200 characters")
		}
	}
	if r.Description != nil {
		if len(*r.Description) < 10 {
			return errors.New("course description must be at least 10 characters")
		}
	}
	if r.Level != nil {
		if !ValidateLevel(*r.Level) {
			return errors.New("invalid course level")
		}
	}
	if r.Duration != nil && *r.Duration < 0 {
		return errors.New("course duration cannot be negative")
	}
	if r.Price != nil && *r.Price < 0 {
		return errors.New("course price cannot be negative")
	}
	return nil
}

// Validate validates the ListCoursesRequest
func (r *ListCoursesRequest) Validate() error {
	if r.Page < 1 {
		r.Page = 1
	}
	if r.PageSize < 1 {
		r.PageSize = 10
	}
	if r.PageSize > 100 {
		r.PageSize = 100
	}
	if r.MinPrice != nil && *r.MinPrice < 0 {
		return errors.New("minimum price cannot be negative")
	}
	if r.MaxPrice != nil && *r.MaxPrice < 0 {
		return errors.New("maximum price cannot be negative")
	}
	if r.MinPrice != nil && r.MaxPrice != nil && *r.MinPrice > *r.MaxPrice {
		return errors.New("minimum price cannot be greater than maximum price")
	}
	if r.Level != nil && !ValidateLevel(*r.Level) {
		return errors.New("invalid course level")
	}
	if r.Status != nil && !ValidateStatus(*r.Status) {
		return errors.New("invalid course status")
	}
	if r.SortBy != nil {
		validSortBy := map[string]bool{
			"title":            true,
			"created_at":       true,
			"rating":           true,
			"enrollment_count": true,
			"price":            true,
		}
		if !validSortBy[*r.SortBy] {
			return errors.New("invalid sort by field")
		}
	}
	if r.SortOrder != nil {
		if *r.SortOrder != "asc" && *r.SortOrder != "desc" {
			return errors.New("sort order must be 'asc' or 'desc'")
		}
	}
	return nil
}

// Validate validates the CreateCourseCategoryRequest
func (r *CreateCourseCategoryRequest) Validate() error {
	if r.Name == "" {
		return errors.New("category name is required")
	}
	if len(r.Name) < 2 || len(r.Name) > 100 {
		return errors.New("category name must be between 2 and 100 characters")
	}
	if r.Slug == "" {
		return errors.New("category slug is required")
	}
	if len(r.Slug) < 2 || len(r.Slug) > 100 {
		return errors.New("category slug must be between 2 and 100 characters")
	}
	if r.DisplayOrder < 0 {
		return errors.New("display order cannot be negative")
	}
	return nil
}

// Validate validates the UpdateCourseCategoryRequest
func (r *UpdateCourseCategoryRequest) Validate() error {
	if r.Name != nil {
		if len(*r.Name) < 2 || len(*r.Name) > 100 {
			return errors.New("category name must be between 2 and 100 characters")
		}
	}
	if r.Slug != nil {
		if len(*r.Slug) < 2 || len(*r.Slug) > 100 {
			return errors.New("category slug must be between 2 and 100 characters")
		}
	}
	if r.DisplayOrder != nil && *r.DisplayOrder < 0 {
		return errors.New("display order cannot be negative")
	}
	return nil
}

// Validate validates the RateCourseRequest
func (r *RateCourseRequest) Validate() error {
	if r.CourseID == uuid.Nil {
		return errors.New("course ID is required")
	}
	if r.Rating < 0 || r.Rating > 5 {
		return errors.New("rating must be between 0 and 5")
	}
	return nil
}

// ============================================================
// Utility Methods
// ============================================================

// HasUpdates checks if the UpdateCourseRequest has any updates
func (r *UpdateCourseRequest) HasUpdates() bool {
	return r.Title != nil ||
		r.Slug != nil ||
		r.Description != nil ||
		r.CategoryID != nil ||
		r.Level != nil ||
		r.Duration != nil ||
		r.Price != nil ||
		r.Thumbnail != nil ||
		r.PreviewVideo != nil ||
		r.Requirements != nil ||
		r.WhatYouWillLearn != nil ||
		r.TargetAudience != nil
}

// HasUpdates checks if the UpdateCourseCategoryRequest has any updates
func (r *UpdateCourseCategoryRequest) HasUpdates() bool {
	return r.Name != nil ||
		r.Slug != nil ||
		r.Description != nil ||
		r.ParentID != nil ||
		r.Icon != nil ||
		r.DisplayOrder != nil ||
		r.IsActive != nil
}

// ApplyToCourse applies the update request to a Course entity
func (r *UpdateCourseRequest) ApplyToCourse(course *Course) error {
	if err := r.Validate(); err != nil {
		return err
	}

	if r.Title != nil {
		course.Title = *r.Title
	}
	if r.Slug != nil {
		course.Slug = *r.Slug
	}
	if r.Description != nil {
		course.Description = *r.Description
	}
	if r.CategoryID != nil {
		course.CategoryID = r.CategoryID
	}
	if r.Level != nil {
		course.Level = *r.Level
	}
	if r.Duration != nil {
		course.Duration = *r.Duration
	}
	if r.Price != nil {
		course.Price = *r.Price
	}
	if r.Thumbnail != nil {
		course.Thumbnail = r.Thumbnail
	}
	if r.PreviewVideo != nil {
		course.PreviewVideo = r.PreviewVideo
	}
	if r.Requirements != nil {
		course.Requirements = r.Requirements
	}
	if r.WhatYouWillLearn != nil {
		course.WhatYouWillLearn = r.WhatYouWillLearn
	}
	if r.TargetAudience != nil {
		course.TargetAudience = r.TargetAudience
	}

	course.UpdateTimestamp()
	return nil
}

// ApplyToCategory applies the update request to a CourseCategory entity
func (r *UpdateCourseCategoryRequest) ApplyToCategory(category *CourseCategory) error {
	if err := r.Validate(); err != nil {
		return err
	}

	if r.Name != nil {
		category.Name = *r.Name
	}
	if r.Slug != nil {
		category.Slug = *r.Slug
	}
	if r.Description != nil {
		category.Description = r.Description
	}
	if r.ParentID != nil {
		category.ParentID = r.ParentID
	}
	if r.Icon != nil {
		category.Icon = r.Icon
	}
	if r.DisplayOrder != nil {
		category.DisplayOrder = *r.DisplayOrder
	}
	if r.IsActive != nil {
		if *r.IsActive {
			category.Activate()
		} else {
			category.Deactivate()
		}
	}

	category.UpdateTimestamp()
	return nil
}

// ============================================================
// Conversion Functions
// ============================================================

// CourseToResponse converts a Course entity to CourseResponse
func CourseToResponse(course *Course) *CourseResponse {
	return &CourseResponse{
		ID:              course.ID,
		TenantID:        course.TenantID,
		Title:           course.Title,
		Slug:            course.Slug,
		Description:     course.Description,
		InstructorID:    course.InstructorID,
		CategoryID:      course.CategoryID,
		Status:          course.Status,
		Level:           course.Level,
		Duration:        course.Duration,
		Price:           course.Price,
		IsFree:          course.IsFree(),
		Thumbnail:       course.Thumbnail,
		EnrollmentCount: course.EnrollmentCount,
		Rating:          course.Rating,
		RatingCount:     course.RatingCount,
		IsPublished:     course.IsPublished,
		PublishedAt:     course.PublishedAt,
		CreatedAt:       course.CreatedAt,
		UpdatedAt:       course.UpdatedAt,
	}
}

// CourseToDetailResponse converts a Course entity to CourseDetailResponse
func CourseToDetailResponse(course *Course) *CourseDetailResponse {
	return &CourseDetailResponse{
		ID:               course.ID,
		TenantID:         course.TenantID,
		Title:            course.Title,
		Slug:             course.Slug,
		Description:      course.Description,
		InstructorID:     course.InstructorID,
		CategoryID:       course.CategoryID,
		Status:           course.Status,
		Level:            course.Level,
		Duration:         course.Duration,
		Price:            course.Price,
		IsFree:           course.IsFree(),
		Thumbnail:        course.Thumbnail,
		PreviewVideo:     course.PreviewVideo,
		Requirements:     course.Requirements,
		WhatYouWillLearn: course.WhatYouWillLearn,
		TargetAudience:   course.TargetAudience,
		EnrollmentCount:  course.EnrollmentCount,
		Rating:           course.Rating,
		RatingCount:      course.RatingCount,
		IsPublished:      course.IsPublished,
		PublishedAt:      course.PublishedAt,
		CanBeEnrolled:    course.CanBeEnrolled(),
		CreatedAt:        course.CreatedAt,
		UpdatedAt:        course.UpdatedAt,
	}
}

// CategoryToResponse converts a CourseCategory entity to CourseCategoryResponse
func CategoryToResponse(category *CourseCategory) *CourseCategoryResponse {
	return &CourseCategoryResponse{
		ID:           category.ID,
		TenantID:     category.TenantID,
		Name:         category.Name,
		Slug:         category.Slug,
		Description:  category.Description,
		ParentID:     category.ParentID,
		Icon:         category.Icon,
		DisplayOrder: category.DisplayOrder,
		IsActive:     category.IsActive,
		CourseCount:  category.CourseCount,
		CreatedAt:    category.CreatedAt,
		UpdatedAt:    category.UpdatedAt,
	}
}

// CoursesToListResponse converts a slice of courses to ListCoursesResponse
func CoursesToListResponse(courses []*Course, totalCount, page, pageSize int) *ListCoursesResponse {
	courseResponses := make([]*CourseResponse, len(courses))
	for i, course := range courses {
		courseResponses[i] = CourseToResponse(course)
	}

	totalPages := (totalCount + pageSize - 1) / pageSize

	return &ListCoursesResponse{
		Courses:    courseResponses,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}

// CategoriesToListResponse converts a slice of categories to ListCategoriesResponse
func CategoriesToListResponse(categories []*CourseCategory, totalCount, page, pageSize int) *ListCategoriesResponse {
	categoryResponses := make([]*CourseCategoryResponse, len(categories))
	for i, category := range categories {
		categoryResponses[i] = CategoryToResponse(category)
	}

	totalPages := (totalCount + pageSize - 1) / pageSize

	return &ListCategoriesResponse{
		Categories: categoryResponses,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}
