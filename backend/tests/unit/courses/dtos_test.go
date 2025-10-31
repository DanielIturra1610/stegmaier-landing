package courses

import (
	"testing"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Helper functions
func strPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}

func float64Ptr(f float64) *float64 {
	return &f
}

func boolPtr(b bool) *bool {
	return &b
}

func uuidPtr(u uuid.UUID) *uuid.UUID {
	return &u
}

func levelPtr(l domain.CourseLevel) *domain.CourseLevel {
	return &l
}

func statusPtr(s domain.CourseStatus) *domain.CourseStatus {
	return &s
}

// ============================================================
// CreateCourseRequest Tests
// ============================================================

func TestCreateCourseRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *domain.CreateCourseRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid request",
			req: &domain.CreateCourseRequest{
				Title:        "Introduction to Go",
				Slug:         "intro-to-go",
				Description:  "Learn Go programming from scratch",
				InstructorID: uuid.New(),
				Level:        domain.CourseLevelBeginner,
				Duration:     300,
				Price:        49.99,
			},
			wantErr: false,
		},
		{
			name: "missing title",
			req: &domain.CreateCourseRequest{
				Slug:         "intro-to-go",
				Description:  "Learn Go programming",
				InstructorID: uuid.New(),
				Level:        domain.CourseLevelBeginner,
			},
			wantErr: true,
			errMsg:  "title is required",
		},
		{
			name: "title too short",
			req: &domain.CreateCourseRequest{
				Title:        "Go",
				Slug:         "go",
				Description:  "Learn Go programming",
				InstructorID: uuid.New(),
				Level:        domain.CourseLevelBeginner,
			},
			wantErr: true,
			errMsg:  "title must be between 3 and 200 characters",
		},
		{
			name: "missing slug",
			req: &domain.CreateCourseRequest{
				Title:        "Introduction to Go",
				Description:  "Learn Go programming",
				InstructorID: uuid.New(),
				Level:        domain.CourseLevelBeginner,
			},
			wantErr: true,
			errMsg:  "slug is required",
		},
		{
			name: "description too short",
			req: &domain.CreateCourseRequest{
				Title:        "Introduction to Go",
				Slug:         "intro-to-go",
				Description:  "Short",
				InstructorID: uuid.New(),
				Level:        domain.CourseLevelBeginner,
			},
			wantErr: true,
			errMsg:  "description must be at least 10 characters",
		},
		{
			name: "missing instructor ID",
			req: &domain.CreateCourseRequest{
				Title:       "Introduction to Go",
				Slug:        "intro-to-go",
				Description: "Learn Go programming from scratch",
				Level:       domain.CourseLevelBeginner,
			},
			wantErr: true,
			errMsg:  "instructor ID is required",
		},
		{
			name: "invalid level",
			req: &domain.CreateCourseRequest{
				Title:        "Introduction to Go",
				Slug:         "intro-to-go",
				Description:  "Learn Go programming from scratch",
				InstructorID: uuid.New(),
				Level:        domain.CourseLevel("invalid"),
			},
			wantErr: true,
			errMsg:  "invalid course level",
		},
		{
			name: "negative duration",
			req: &domain.CreateCourseRequest{
				Title:        "Introduction to Go",
				Slug:         "intro-to-go",
				Description:  "Learn Go programming from scratch",
				InstructorID: uuid.New(),
				Level:        domain.CourseLevelBeginner,
				Duration:     -10,
			},
			wantErr: true,
			errMsg:  "duration cannot be negative",
		},
		{
			name: "negative price",
			req: &domain.CreateCourseRequest{
				Title:        "Introduction to Go",
				Slug:         "intro-to-go",
				Description:  "Learn Go programming from scratch",
				InstructorID: uuid.New(),
				Level:        domain.CourseLevelBeginner,
				Price:        -9.99,
			},
			wantErr: true,
			errMsg:  "price cannot be negative",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}

// ============================================================
// UpdateCourseRequest Tests
// ============================================================

func TestUpdateCourseRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *domain.UpdateCourseRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid request with all fields",
			req: &domain.UpdateCourseRequest{
				Title:       strPtr("Updated Title"),
				Slug:        strPtr("updated-slug"),
				Description: strPtr("Updated description with enough characters"),
				Level:       levelPtr(domain.CourseLevelAdvanced),
				Duration:    intPtr(500),
				Price:       float64Ptr(99.99),
			},
			wantErr: false,
		},
		{
			name: "valid request with partial fields",
			req: &domain.UpdateCourseRequest{
				Title: strPtr("Updated Title"),
				Price: float64Ptr(0.0), // Free course
			},
			wantErr: false,
		},
		{
			name: "title too short",
			req: &domain.UpdateCourseRequest{
				Title: strPtr("Go"),
			},
			wantErr: true,
			errMsg:  "title must be between 3 and 200 characters",
		},
		{
			name: "description too short",
			req: &domain.UpdateCourseRequest{
				Description: strPtr("Short"),
			},
			wantErr: true,
			errMsg:  "description must be at least 10 characters",
		},
		{
			name: "invalid level",
			req: &domain.UpdateCourseRequest{
				Level: levelPtr(domain.CourseLevel("invalid")),
			},
			wantErr: true,
			errMsg:  "invalid course level",
		},
		{
			name: "negative duration",
			req: &domain.UpdateCourseRequest{
				Duration: intPtr(-10),
			},
			wantErr: true,
			errMsg:  "duration cannot be negative",
		},
		{
			name: "negative price",
			req: &domain.UpdateCourseRequest{
				Price: float64Ptr(-5.00),
			},
			wantErr: true,
			errMsg:  "price cannot be negative",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestUpdateCourseRequest_HasUpdates(t *testing.T) {
	tests := []struct {
		name string
		req  *domain.UpdateCourseRequest
		want bool
	}{
		{
			name: "no updates",
			req:  &domain.UpdateCourseRequest{},
			want: false,
		},
		{
			name: "has title update",
			req: &domain.UpdateCourseRequest{
				Title: strPtr("New Title"),
			},
			want: true,
		},
		{
			name: "has price update",
			req: &domain.UpdateCourseRequest{
				Price: float64Ptr(99.99),
			},
			want: true,
		},
		{
			name: "has multiple updates",
			req: &domain.UpdateCourseRequest{
				Title:       strPtr("New Title"),
				Description: strPtr("New description with enough characters"),
				Price:       float64Ptr(49.99),
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.req.HasUpdates())
		})
	}
}

func TestUpdateCourseRequest_ApplyToCourse(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Original", "original", "Original description", domain.CourseLevelBeginner)
	oldUpdatedAt := course.UpdatedAt

	req := &domain.UpdateCourseRequest{
		Title:       strPtr("Updated Title"),
		Description: strPtr("Updated description text"),
		Level:       levelPtr(domain.CourseLevelAdvanced),
		Duration:    intPtr(600),
		Price:       float64Ptr(99.99),
	}

	time.Sleep(10 * time.Millisecond)
	err := req.ApplyToCourse(course)
	require.NoError(t, err)

	assert.Equal(t, "Updated Title", course.Title)
	assert.Equal(t, "Updated description text", course.Description)
	assert.Equal(t, domain.CourseLevelAdvanced, course.Level)
	assert.Equal(t, 600, course.Duration)
	assert.Equal(t, 99.99, course.Price)
	assert.True(t, course.UpdatedAt.After(oldUpdatedAt))
}

// ============================================================
// ListCoursesRequest Tests
// ============================================================

func TestListCoursesRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *domain.ListCoursesRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid request",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 20,
			},
			wantErr: false,
		},
		{
			name: "auto-corrects page to 1",
			req: &domain.ListCoursesRequest{
				Page:     0,
				PageSize: 10,
			},
			wantErr: false,
		},
		{
			name: "auto-corrects pageSize to default",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 0,
			},
			wantErr: false,
		},
		{
			name: "caps pageSize at 100",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 150,
			},
			wantErr: false,
		},
		{
			name: "negative min price",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 10,
				MinPrice: float64Ptr(-10.00),
			},
			wantErr: true,
			errMsg:  "minimum price cannot be negative",
		},
		{
			name: "negative max price",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 10,
				MaxPrice: float64Ptr(-5.00),
			},
			wantErr: true,
			errMsg:  "maximum price cannot be negative",
		},
		{
			name: "min price greater than max price",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 10,
				MinPrice: float64Ptr(100.00),
				MaxPrice: float64Ptr(50.00),
			},
			wantErr: true,
			errMsg:  "minimum price cannot be greater than maximum price",
		},
		{
			name: "invalid level",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 10,
				Level:    levelPtr(domain.CourseLevel("invalid")),
			},
			wantErr: true,
			errMsg:  "invalid course level",
		},
		{
			name: "invalid status",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 10,
				Status:   statusPtr(domain.CourseStatus("invalid")),
			},
			wantErr: true,
			errMsg:  "invalid course status",
		},
		{
			name: "invalid sort by field",
			req: &domain.ListCoursesRequest{
				Page:     1,
				PageSize: 10,
				SortBy:   strPtr("invalid_field"),
			},
			wantErr: true,
			errMsg:  "invalid sort by field",
		},
		{
			name: "invalid sort order",
			req: &domain.ListCoursesRequest{
				Page:      1,
				PageSize:  10,
				SortOrder: strPtr("invalid"),
			},
			wantErr: true,
			errMsg:  "sort order must be 'asc' or 'desc'",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}

// ============================================================
// Category Request Tests
// ============================================================

func TestCreateCourseCategoryRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *domain.CreateCourseCategoryRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid request",
			req: &domain.CreateCourseCategoryRequest{
				Name:         "Programming",
				Slug:         "programming",
				DisplayOrder: 1,
			},
			wantErr: false,
		},
		{
			name: "missing name",
			req: &domain.CreateCourseCategoryRequest{
				Slug:         "programming",
				DisplayOrder: 1,
			},
			wantErr: true,
			errMsg:  "name is required",
		},
		{
			name: "name too short",
			req: &domain.CreateCourseCategoryRequest{
				Name:         "P",
				Slug:         "p",
				DisplayOrder: 1,
			},
			wantErr: true,
			errMsg:  "name must be between 2 and 100 characters",
		},
		{
			name: "missing slug",
			req: &domain.CreateCourseCategoryRequest{
				Name:         "Programming",
				DisplayOrder: 1,
			},
			wantErr: true,
			errMsg:  "slug is required",
		},
		{
			name: "negative display order",
			req: &domain.CreateCourseCategoryRequest{
				Name:         "Programming",
				Slug:         "programming",
				DisplayOrder: -1,
			},
			wantErr: true,
			errMsg:  "display order cannot be negative",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestUpdateCourseCategoryRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *domain.UpdateCourseCategoryRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid request",
			req: &domain.UpdateCourseCategoryRequest{
				Name:         strPtr("Updated Name"),
				DisplayOrder: intPtr(5),
			},
			wantErr: false,
		},
		{
			name: "name too short",
			req: &domain.UpdateCourseCategoryRequest{
				Name: strPtr("P"),
			},
			wantErr: true,
			errMsg:  "name must be between 2 and 100 characters",
		},
		{
			name: "negative display order",
			req: &domain.UpdateCourseCategoryRequest{
				DisplayOrder: intPtr(-1),
			},
			wantErr: true,
			errMsg:  "display order cannot be negative",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestUpdateCourseCategoryRequest_HasUpdates(t *testing.T) {
	tests := []struct {
		name string
		req  *domain.UpdateCourseCategoryRequest
		want bool
	}{
		{
			name: "no updates",
			req:  &domain.UpdateCourseCategoryRequest{},
			want: false,
		},
		{
			name: "has name update",
			req: &domain.UpdateCourseCategoryRequest{
				Name: strPtr("New Name"),
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.req.HasUpdates())
		})
	}
}

func TestUpdateCourseCategoryRequest_ApplyToCategory(t *testing.T) {
	category := domain.NewCourseCategory(uuid.New(), "Original", "original")
	oldUpdatedAt := category.UpdatedAt

	req := &domain.UpdateCourseCategoryRequest{
		Name:         strPtr("Updated Name"),
		Slug:         strPtr("updated-slug"),
		DisplayOrder: intPtr(10),
		IsActive:     boolPtr(false),
	}

	time.Sleep(10 * time.Millisecond)
	err := req.ApplyToCategory(category)
	require.NoError(t, err)

	assert.Equal(t, "Updated Name", category.Name)
	assert.Equal(t, "updated-slug", category.Slug)
	assert.Equal(t, 10, category.DisplayOrder)
	assert.False(t, category.IsActive)
	assert.True(t, category.UpdatedAt.After(oldUpdatedAt))
}

// ============================================================
// RateCourseRequest Tests
// ============================================================

func TestRateCourseRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *domain.RateCourseRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid request",
			req: &domain.RateCourseRequest{
				CourseID: uuid.New(),
				Rating:   4.5,
			},
			wantErr: false,
		},
		{
			name: "missing course ID",
			req: &domain.RateCourseRequest{
				Rating: 4.5,
			},
			wantErr: true,
			errMsg:  "course ID is required",
		},
		{
			name: "rating too low",
			req: &domain.RateCourseRequest{
				CourseID: uuid.New(),
				Rating:   -1.0,
			},
			wantErr: true,
			errMsg:  "rating must be between 0 and 5",
		},
		{
			name: "rating too high",
			req: &domain.RateCourseRequest{
				CourseID: uuid.New(),
				Rating:   6.0,
			},
			wantErr: true,
			errMsg:  "rating must be between 0 and 5",
		},
		{
			name: "rating exactly 0",
			req: &domain.RateCourseRequest{
				CourseID: uuid.New(),
				Rating:   0.0,
			},
			wantErr: false,
		},
		{
			name: "rating exactly 5",
			req: &domain.RateCourseRequest{
				CourseID: uuid.New(),
				Rating:   5.0,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}

// ============================================================
// Response Conversion Tests
// ============================================================

func TestCourseToResponse(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test Course", "test-course", "Description", domain.CourseLevelBeginner)
	course.Price = 49.99
	course.Publish()

	response := domain.CourseToResponse(course)

	assert.Equal(t, course.ID, response.ID)
	assert.Equal(t, course.Title, response.Title)
	assert.Equal(t, course.Slug, response.Slug)
	assert.Equal(t, course.Price, response.Price)
	assert.True(t, response.IsFree == false)
	assert.Equal(t, course.IsPublished, response.IsPublished)
}

func TestCourseToDetailResponse(t *testing.T) {
	course := domain.NewCourse(uuid.New(), uuid.New(), "Test Course", "test-course", "Description", domain.CourseLevelBeginner)
	course.Requirements = []string{"Basic programming knowledge"}
	course.WhatYouWillLearn = []string{"Go fundamentals"}
	course.Publish()

	response := domain.CourseToDetailResponse(course)

	assert.Equal(t, course.ID, response.ID)
	assert.Equal(t, course.Requirements, response.Requirements)
	assert.Equal(t, course.WhatYouWillLearn, response.WhatYouWillLearn)
	assert.True(t, response.CanBeEnrolled)
}

func TestCategoryToResponse(t *testing.T) {
	category := domain.NewCourseCategory(uuid.New(), "Programming", "programming")

	response := domain.CategoryToResponse(category)

	assert.Equal(t, category.ID, response.ID)
	assert.Equal(t, category.Name, response.Name)
	assert.Equal(t, category.Slug, response.Slug)
	assert.Equal(t, category.IsActive, response.IsActive)
}

func TestCoursesToListResponse(t *testing.T) {
	courses := []*domain.Course{
		domain.NewCourse(uuid.New(), uuid.New(), "Course 1", "course-1", "Desc 1", domain.CourseLevelBeginner),
		domain.NewCourse(uuid.New(), uuid.New(), "Course 2", "course-2", "Desc 2", domain.CourseLevelIntermediate),
	}

	response := domain.CoursesToListResponse(courses, 15, 2, 10)

	assert.Len(t, response.Courses, 2)
	assert.Equal(t, 15, response.TotalCount)
	assert.Equal(t, 2, response.Page)
	assert.Equal(t, 10, response.PageSize)
	assert.Equal(t, 2, response.TotalPages) // (15 + 10 - 1) / 10 = 2
}
