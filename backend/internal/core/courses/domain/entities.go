package domain

import (
	"time"

	"github.com/google/uuid"
)

// CourseStatus represents the publication status of a course
type CourseStatus string

const (
	CourseStatusDraft     CourseStatus = "draft"
	CourseStatusPublished CourseStatus = "published"
	CourseStatusArchived  CourseStatus = "archived"
	CourseStatusDeleted   CourseStatus = "deleted"
)

// CourseLevel represents the difficulty level of a course
type CourseLevel string

const (
	CourseLevelBeginner     CourseLevel = "beginner"
	CourseLevelIntermediate CourseLevel = "intermediate"
	CourseLevelAdvanced     CourseLevel = "advanced"
	CourseLevelExpert       CourseLevel = "expert"
)

// Course represents a learning course in the LMS
type Course struct {
	ID          uuid.UUID    `json:"id"`
	TenantID    uuid.UUID    `json:"tenantId"`
	Title       string       `json:"title"`
	Slug        string       `json:"slug"`
	Description string       `json:"description"`
	InstructorID uuid.UUID   `json:"instructorId"`
	CategoryID  *uuid.UUID   `json:"categoryId,omitempty"`
	Status      CourseStatus `json:"status"`
	Level       CourseLevel  `json:"level"`

	// Content metadata
	Duration    int     `json:"duration"` // Total duration in minutes
	Price       float64 `json:"price"`    // Price in USD, 0 for free courses
	Thumbnail   *string `json:"thumbnail,omitempty"`
	PreviewVideo *string `json:"previewVideo,omitempty"`

	// Learning objectives
	Requirements      []string `json:"requirements"`      // Prerequisites
	WhatYouWillLearn  []string `json:"whatYouWillLearn"`  // Learning outcomes
	TargetAudience    []string `json:"targetAudience"`    // Who this course is for

	// Statistics
	EnrollmentCount int     `json:"enrollmentCount"`
	Rating          float64 `json:"rating"` // Average rating 0-5
	RatingCount     int     `json:"ratingCount"`

	// Publication
	IsPublished bool       `json:"isPublished"`
	PublishedAt *time.Time `json:"publishedAt,omitempty"`

	// Audit fields
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt *time.Time `json:"deletedAt,omitempty"`
}

// CourseCategory represents a category for organizing courses
type CourseCategory struct {
	ID          uuid.UUID  `json:"id"`
	TenantID    uuid.UUID  `json:"tenantId"`
	Name        string     `json:"name"`
	Slug        string     `json:"slug"`
	Description *string    `json:"description,omitempty"`
	ParentID    *uuid.UUID `json:"parentId,omitempty"` // For hierarchical categories
	Icon        *string    `json:"icon,omitempty"`
	DisplayOrder int       `json:"displayOrder"`
	IsActive    bool       `json:"isActive"`
	CourseCount int        `json:"courseCount"` // Number of courses in this category
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// NewCourse creates a new course with default values
func NewCourse(tenantID, instructorID uuid.UUID, title, slug, description string, level CourseLevel) *Course {
	now := time.Now().UTC()
	return &Course{
		ID:               uuid.New(),
		TenantID:         tenantID,
		Title:            title,
		Slug:             slug,
		Description:      description,
		InstructorID:     instructorID,
		Status:           CourseStatusDraft,
		Level:            level,
		Duration:         0,
		Price:            0.0,
		Requirements:     make([]string, 0),
		WhatYouWillLearn: make([]string, 0),
		TargetAudience:   make([]string, 0),
		EnrollmentCount:  0,
		Rating:           0.0,
		RatingCount:      0,
		IsPublished:      false,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
}

// NewCourseCategory creates a new course category
func NewCourseCategory(tenantID uuid.UUID, name, slug string) *CourseCategory {
	now := time.Now().UTC()
	return &CourseCategory{
		ID:           uuid.New(),
		TenantID:     tenantID,
		Name:         name,
		Slug:         slug,
		DisplayOrder: 0,
		IsActive:     true,
		CourseCount:  0,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

// UpdateTimestamp updates the UpdatedAt field to current time
func (c *Course) UpdateTimestamp() {
	c.UpdatedAt = time.Now().UTC()
}

// Publish marks the course as published
func (c *Course) Publish() {
	now := time.Now().UTC()
	c.Status = CourseStatusPublished
	c.IsPublished = true
	c.PublishedAt = &now
	c.UpdateTimestamp()
}

// Unpublish marks the course as draft
func (c *Course) Unpublish() {
	c.Status = CourseStatusDraft
	c.IsPublished = false
	c.UpdateTimestamp()
}

// Archive archives the course
func (c *Course) Archive() {
	c.Status = CourseStatusArchived
	c.IsPublished = false
	c.UpdateTimestamp()
}

// SoftDelete soft deletes the course
func (c *Course) SoftDelete() {
	now := time.Now().UTC()
	c.Status = CourseStatusDeleted
	c.IsPublished = false
	c.DeletedAt = &now
	c.UpdateTimestamp()
}

// UpdateRating updates the course rating with a new rating value
func (c *Course) UpdateRating(newRating float64) {
	totalRating := c.Rating * float64(c.RatingCount)
	c.RatingCount++
	c.Rating = (totalRating + newRating) / float64(c.RatingCount)
	c.UpdateTimestamp()
}

// IncrementEnrollment increments the enrollment count
func (c *Course) IncrementEnrollment() {
	c.EnrollmentCount++
	c.UpdateTimestamp()
}

// DecrementEnrollment decrements the enrollment count
func (c *Course) DecrementEnrollment() {
	if c.EnrollmentCount > 0 {
		c.EnrollmentCount--
		c.UpdateTimestamp()
	}
}

// IsFree returns true if the course is free
func (c *Course) IsFree() bool {
	return c.Price == 0.0
}

// IsActive returns true if the course is published and not deleted
func (c *Course) IsActive() bool {
	return c.IsPublished && c.Status == CourseStatusPublished && c.DeletedAt == nil
}

// CanBeEnrolled returns true if the course can accept new enrollments
func (c *Course) CanBeEnrolled() bool {
	return c.IsActive()
}

// ValidateStatus validates if the status is valid
func ValidateStatus(status CourseStatus) bool {
	switch status {
	case CourseStatusDraft, CourseStatusPublished, CourseStatusArchived, CourseStatusDeleted:
		return true
	default:
		return false
	}
}

// ValidateLevel validates if the level is valid
func ValidateLevel(level CourseLevel) bool {
	switch level {
	case CourseLevelBeginner, CourseLevelIntermediate, CourseLevelAdvanced, CourseLevelExpert:
		return true
	default:
		return false
	}
}

// UpdateCategoryTimestamp updates the UpdatedAt field to current time
func (c *CourseCategory) UpdateTimestamp() {
	c.UpdatedAt = time.Now().UTC()
}

// IncrementCourseCount increments the course count
func (c *CourseCategory) IncrementCourseCount() {
	c.CourseCount++
	c.UpdateTimestamp()
}

// DecrementCourseCount decrements the course count
func (c *CourseCategory) DecrementCourseCount() {
	if c.CourseCount > 0 {
		c.CourseCount--
		c.UpdateTimestamp()
	}
}

// Activate activates the category
func (c *CourseCategory) Activate() {
	c.IsActive = true
	c.UpdateTimestamp()
}

// Deactivate deactivates the category
func (c *CourseCategory) Deactivate() {
	c.IsActive = false
	c.UpdateTimestamp()
}
