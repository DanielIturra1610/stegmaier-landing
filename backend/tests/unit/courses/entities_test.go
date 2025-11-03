package courses

import (
	"testing"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestNewCourse(t *testing.T) {
	tenantID := uuid.New()
	instructorID := uuid.New()
	title := "Introduction to Go"
	slug := "intro-to-go"
	description := "Learn Go programming from scratch"
	level := domain.CourseLevelBeginner

	course := domain.NewCourse(tenantID, instructorID, title, slug, description, level)

	assert.NotEqual(t, uuid.Nil, course.ID)
	assert.Equal(t, tenantID, course.TenantID)
	assert.Equal(t, title, course.Title)
	assert.Equal(t, slug, course.Slug)
	assert.Equal(t, description, course.Description)
	assert.Equal(t, instructorID, course.InstructorID)
	assert.Equal(t, domain.CourseStatusDraft, course.Status)
	assert.Equal(t, level, course.Level)
	assert.Equal(t, 0, course.Duration)
	assert.Equal(t, 0.0, course.Price)
	assert.Empty(t, course.Requirements)
	assert.Empty(t, course.WhatYouWillLearn)
	assert.Empty(t, course.TargetAudience)
	assert.Equal(t, 0, course.EnrollmentCount)
	assert.Equal(t, 0.0, course.Rating)
	assert.Equal(t, 0, course.RatingCount)
	assert.False(t, course.IsPublished)
	assert.Nil(t, course.PublishedAt)
	assert.NotZero(t, course.CreatedAt)
	assert.NotZero(t, course.UpdatedAt)
}

func TestNewCourseCategory(t *testing.T) {
	tenantID := uuid.New()
	name := "Programming"
	slug := "programming"

	category := domain.NewCourseCategory(tenantID, name, slug)

	assert.NotEqual(t, uuid.Nil, category.ID)
	assert.Equal(t, tenantID, category.TenantID)
	assert.Equal(t, name, category.Name)
	assert.Equal(t, slug, category.Slug)
	assert.Equal(t, 0, category.DisplayOrder)
	assert.True(t, category.IsActive)
	assert.Equal(t, 0, category.CourseCount)
	assert.NotZero(t, category.CreatedAt)
	assert.NotZero(t, category.UpdatedAt)
}

func TestCourse_UpdateTimestamp(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
	oldTime := course.UpdatedAt

	time.Sleep(10 * time.Millisecond)
	course.UpdateTimestamp()

	assert.True(t, course.UpdatedAt.After(oldTime))
}

func TestCourse_Publish(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
	assert.Equal(t, domain.CourseStatusDraft, course.Status)
	assert.False(t, course.IsPublished)
	assert.Nil(t, course.PublishedAt)

	beforePublish := time.Now()
	time.Sleep(10 * time.Millisecond)
	course.Publish()

	assert.Equal(t, domain.CourseStatusPublished, course.Status)
	assert.True(t, course.IsPublished)
	assert.NotNil(t, course.PublishedAt)
	assert.True(t, course.PublishedAt.After(beforePublish))
}

func TestCourse_Unpublish(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
	course.Publish()

	course.Unpublish()

	assert.Equal(t, domain.CourseStatusDraft, course.Status)
	assert.False(t, course.IsPublished)
}

func TestCourse_Archive(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
	course.Publish()

	course.Archive()

	assert.Equal(t, domain.CourseStatusArchived, course.Status)
	assert.False(t, course.IsPublished)
}

func TestCourse_SoftDelete(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
	course.Publish()
	assert.Nil(t, course.DeletedAt)

	beforeDelete := time.Now()
	time.Sleep(10 * time.Millisecond)
	course.SoftDelete()

	assert.Equal(t, domain.CourseStatusDeleted, course.Status)
	assert.False(t, course.IsPublished)
	assert.NotNil(t, course.DeletedAt)
	assert.True(t, course.DeletedAt.After(beforeDelete))
}

func TestCourse_UpdateRating(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)

	// First rating
	course.UpdateRating(5.0)
	assert.Equal(t, 5.0, course.Rating)
	assert.Equal(t, 1, course.RatingCount)

	// Second rating
	course.UpdateRating(3.0)
	assert.Equal(t, 4.0, course.Rating) // (5 + 3) / 2 = 4
	assert.Equal(t, 2, course.RatingCount)

	// Third rating
	course.UpdateRating(5.0)
	assert.InDelta(t, 4.333, course.Rating, 0.01) // (5 + 3 + 5) / 3 ≈ 4.333
	assert.Equal(t, 3, course.RatingCount)
}

func TestCourse_IncrementEnrollment(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
	assert.Equal(t, 0, course.EnrollmentCount)

	course.IncrementEnrollment()
	assert.Equal(t, 1, course.EnrollmentCount)

	course.IncrementEnrollment()
	assert.Equal(t, 2, course.EnrollmentCount)
}

func TestCourse_DecrementEnrollment(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
	course.EnrollmentCount = 3

	course.DecrementEnrollment()
	assert.Equal(t, 2, course.EnrollmentCount)

	course.DecrementEnrollment()
	assert.Equal(t, 1, course.EnrollmentCount)

	course.DecrementEnrollment()
	assert.Equal(t, 0, course.EnrollmentCount)

	// Should not go negative
	course.DecrementEnrollment()
	assert.Equal(t, 0, course.EnrollmentCount)
}

func TestCourse_IsFree(t *testing.T) {
	tests := []struct {
		name  string
		price float64
		want  bool
	}{
		{"free course", 0.0, true},
		{"paid course", 9.99, false},
		{"expensive course", 99.99, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
			course.Price = tt.price

			assert.Equal(t, tt.want, course.IsFree())
		})
	}
}

func TestCourse_IsActive(t *testing.T) {
	tests := []struct {
		name  string
		setup func(*domain.Course)
		want  bool
	}{
		{
			name:  "draft course is not active",
			setup: func(c *domain.Course) {},
			want:  false,
		},
		{
			name:  "published course is active",
			setup: func(c *domain.Course) { c.Publish() },
			want:  true,
		},
		{
			name:  "archived course is not active",
			setup: func(c *domain.Course) { c.Archive() },
			want:  false,
		},
		{
			name:  "deleted course is not active",
			setup: func(c *domain.Course) { c.SoftDelete() },
			want:  false,
		},
		{
			name: "published but deleted course is not active",
			setup: func(c *domain.Course) {
				c.Publish()
				c.SoftDelete()
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
			tt.setup(course)

			assert.Equal(t, tt.want, course.IsActive())
		})
	}
}

func TestCourse_CanBeEnrolled(t *testing.T) {
	tests := []struct {
		name  string
		setup func(*domain.Course)
		want  bool
	}{
		{
			name:  "draft course cannot be enrolled",
			setup: func(c *domain.Course) {},
			want:  false,
		},
		{
			name:  "published course can be enrolled",
			setup: func(c *domain.Course) { c.Publish() },
			want:  true,
		},
		{
			name:  "archived course cannot be enrolled",
			setup: func(c *domain.Course) { c.Archive() },
			want:  false,
		},
		{
			name:  "deleted course cannot be enrolled",
			setup: func(c *domain.Course) { c.SoftDelete() },
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			course := domain.NewCourse(uuid.New(), uuid.New(), "Test", "test", "Description", domain.CourseLevelBeginner)
			tt.setup(course)

			assert.Equal(t, tt.want, course.CanBeEnrolled())
		})
	}
}

func TestValidateStatus(t *testing.T) {
	tests := []struct {
		name   string
		status domain.CourseStatus
		want   bool
	}{
		{"draft is valid", domain.CourseStatusDraft, true},
		{"published is valid", domain.CourseStatusPublished, true},
		{"archived is valid", domain.CourseStatusArchived, true},
		{"deleted is valid", domain.CourseStatusDeleted, true},
		{"invalid status", domain.CourseStatus("invalid"), false},
		{"empty status", domain.CourseStatus(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, domain.ValidateStatus(tt.status))
		})
	}
}

func TestValidateLevel(t *testing.T) {
	tests := []struct {
		name  string
		level domain.CourseLevel
		want  bool
	}{
		{"beginner is valid", domain.CourseLevelBeginner, true},
		{"intermediate is valid", domain.CourseLevelIntermediate, true},
		{"advanced is valid", domain.CourseLevelAdvanced, true},
		{"expert is valid", domain.CourseLevelExpert, true},
		{"invalid level", domain.CourseLevel("invalid"), false},
		{"empty level", domain.CourseLevel(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, domain.ValidateLevel(tt.level))
		})
	}
}

func TestCourseCategory_UpdateTimestamp(t *testing.T) {
	category := domain.NewCourseCategory(uuid.New(), "Test", "test")
	oldTime := category.UpdatedAt

	time.Sleep(10 * time.Millisecond)
	category.UpdateTimestamp()

	assert.True(t, category.UpdatedAt.After(oldTime))
}

func TestCourseCategory_IncrementCourseCount(t *testing.T) {
	category := domain.NewCourseCategory(uuid.New(), "Test", "test")
	assert.Equal(t, 0, category.CourseCount)

	category.IncrementCourseCount()
	assert.Equal(t, 1, category.CourseCount)

	category.IncrementCourseCount()
	assert.Equal(t, 2, category.CourseCount)
}

func TestCourseCategory_DecrementCourseCount(t *testing.T) {
	category := domain.NewCourseCategory(uuid.New(), "Test", "test")
	category.CourseCount = 3

	category.DecrementCourseCount()
	assert.Equal(t, 2, category.CourseCount)

	category.DecrementCourseCount()
	assert.Equal(t, 1, category.CourseCount)

	category.DecrementCourseCount()
	assert.Equal(t, 0, category.CourseCount)

	// Should not go negative
	category.DecrementCourseCount()
	assert.Equal(t, 0, category.CourseCount)
}

func TestCourseCategory_Activate(t *testing.T) {
	category := domain.NewCourseCategory(uuid.New(), "Test", "test")
	category.Deactivate()
	assert.False(t, category.IsActive)

	category.Activate()
	assert.True(t, category.IsActive)
}

func TestCourseCategory_Deactivate(t *testing.T) {
	category := domain.NewCourseCategory(uuid.New(), "Test", "test")
	assert.True(t, category.IsActive)

	category.Deactivate()
	assert.False(t, category.IsActive)
}
