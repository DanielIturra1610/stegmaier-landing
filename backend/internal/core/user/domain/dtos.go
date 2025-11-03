package domain

import "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"

// CreateUserDTO represents the data required to create a user (admin operation)
type CreateUserDTO struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	FullName string `json:"full_name" validate:"required,min=2,max=255"`
	Role     string `json:"role" validate:"required,oneof=student instructor admin superadmin"`
	TenantID string `json:"tenant_id" validate:"required,uuid"`
}

// UpdateUserDTO represents the data that can be updated by an admin
type UpdateUserDTO struct {
	FullName   *string `json:"full_name,omitempty" validate:"omitempty,min=2,max=255"`
	Role       *string `json:"role,omitempty" validate:"omitempty,oneof=student instructor admin superadmin"`
	IsVerified *bool   `json:"is_verified,omitempty"`
}

// UserFiltersDTO represents filters for listing users
type UserFiltersDTO struct {
	TenantID   string `json:"tenant_id,omitempty"`
	Role       string `json:"role,omitempty" validate:"omitempty,oneof=student instructor admin superadmin"`
	IsVerified *bool  `json:"is_verified,omitempty"`
	Search     string `json:"search,omitempty"` // Search in email or full_name
	Page       int    `json:"page,omitempty" validate:"omitempty,min=1"`
	PageSize   int    `json:"page_size,omitempty" validate:"omitempty,min=1,max=100"`
	SortBy     string `json:"sort_by,omitempty" validate:"omitempty,oneof=created_at email full_name role"`
	SortOrder  string `json:"sort_order,omitempty" validate:"omitempty,oneof=asc desc"`
}

// ApplyDefaults sets default values for pagination and sorting
func (f *UserFiltersDTO) ApplyDefaults() {
	if f.Page <= 0 {
		f.Page = 1
	}
	if f.PageSize <= 0 {
		f.PageSize = 20
	}
	if f.SortBy == "" {
		f.SortBy = "created_at"
	}
	if f.SortOrder == "" {
		f.SortOrder = "desc"
	}
}

// UserListResponse represents a paginated list of users
type UserListResponse struct {
	Users      []domain.User `json:"users"`
	TotalCount int           `json:"total_count"`
	Page       int           `json:"page"`
	PageSize   int           `json:"page_size"`
	TotalPages int           `json:"total_pages"`
}

// ChangeRoleDTO represents a role change request
type ChangeRoleDTO struct {
	Role string `json:"role" validate:"required,oneof=student instructor admin superadmin"`
}

// ResetPasswordDTO represents an admin-initiated password reset
type ResetPasswordDTO struct {
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

// ForcePasswordChangeDTO forces user to change password on next login
type ForcePasswordChangeDTO struct {
	RequireChange bool `json:"require_change"`
}

// Validate performs validation on CreateUserDTO
func (dto *CreateUserDTO) Validate() error {
	// Check if role is valid
	if !domain.IsValidRole(dto.Role) {
		return domain.ErrInvalidRole
	}
	return nil
}

// Validate performs validation on UpdateUserDTO
func (dto *UpdateUserDTO) Validate() error {
	// If role is being updated, validate it
	if dto.Role != nil && !domain.IsValidRole(*dto.Role) {
		return domain.ErrInvalidRole
	}
	return nil
}

// UserStatsDTO represents statistics about users
type UserStatsDTO struct {
	TotalUsers       int            `json:"total_users"`
	VerifiedUsers    int            `json:"verified_users"`
	UnverifiedUsers  int            `json:"unverified_users"`
	UsersByRole      map[string]int `json:"users_by_role"`
	RecentUsers      int            `json:"recent_users_7days"`
}

// BulkDeleteDTO represents a bulk delete operation
type BulkDeleteDTO struct {
	UserIDs []string `json:"user_ids" validate:"required,min=1,dive,uuid"`
}

// BulkUpdateRoleDTO represents a bulk role update
type BulkUpdateRoleDTO struct {
	UserIDs []string `json:"user_ids" validate:"required,min=1,dive,uuid"`
	NewRole string   `json:"new_role" validate:"required,oneof=student instructor admin superadmin"`
}
