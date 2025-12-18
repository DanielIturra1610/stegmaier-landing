package domain

import (
	"errors"
	"time"

	"github.com/lib/pq"
)

// Multi-role related errors
var (
	ErrRoleNotAssigned = errors.New("role not assigned to user")
)

// User represents a user in the system
type User struct {
	ID           string         `json:"id" db:"id"`
	TenantID     *string        `json:"tenant_id,omitempty" db:"tenant_id"` // Nullable - user can register without tenant
	Email        string         `json:"email" db:"email"`
	PasswordHash string         `json:"-" db:"password_hash"` // Never expose in JSON
	FullName     string         `json:"full_name" db:"full_name"`
	Roles        pq.StringArray `json:"roles" db:"roles"`             // Array of all assigned roles - single source of truth
	ActiveRole   string         `json:"active_role" db:"active_role"` // Currently active role (for multi-role users)
	IsVerified   bool           `json:"is_verified" db:"is_verified"`
	CreatedAt    time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at" db:"updated_at"`
}

// UserRole defines the possible user roles in the system
type UserRole string

const (
	RoleStudent    UserRole = "student"
	RoleInstructor UserRole = "instructor"
	RoleAdmin      UserRole = "admin"
	RoleSuperAdmin UserRole = "superadmin"
)

// IsValidRole checks if a role string is valid
func IsValidRole(role string) bool {
	switch UserRole(role) {
	case RoleStudent, RoleInstructor, RoleAdmin, RoleSuperAdmin:
		return true
	default:
		return false
	}
}

// GetRoleHierarchy returns the hierarchical level of a role (higher number = more privileges)
func GetRoleHierarchy(role UserRole) int {
	switch role {
	case RoleSuperAdmin:
		return 4
	case RoleAdmin:
		return 3
	case RoleInstructor:
		return 2
	case RoleStudent:
		return 1
	default:
		return 0
	}
}

// VerificationToken represents an email verification token
type VerificationToken struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// IsExpired checks if the verification token has expired
func (vt *VerificationToken) IsExpired() bool {
	return time.Now().After(vt.ExpiresAt)
}

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	ID        string     `json:"id" db:"id"`
	UserID    string     `json:"user_id" db:"user_id"`
	Token     string     `json:"token" db:"token"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty" db:"used_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

// IsExpired checks if the password reset token has expired
func (prt *PasswordResetToken) IsExpired() bool {
	return time.Now().After(prt.ExpiresAt)
}

// IsUsed checks if the password reset token has been used
func (prt *PasswordResetToken) IsUsed() bool {
	return prt.UsedAt != nil
}

// IsValid checks if the token is valid (not expired and not used)
func (prt *PasswordResetToken) IsValid() bool {
	return !prt.IsExpired() && !prt.IsUsed()
}

// RefreshToken represents a JWT refresh token
type RefreshToken struct {
	ID        string     `json:"id" db:"id"`
	UserID    string     `json:"user_id" db:"user_id"`
	Token     string     `json:"token" db:"token"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty" db:"revoked_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

// IsExpired checks if the refresh token has expired
func (rt *RefreshToken) IsExpired() bool {
	return time.Now().After(rt.ExpiresAt)
}

// IsRevoked checks if the refresh token has been revoked
func (rt *RefreshToken) IsRevoked() bool {
	return rt.RevokedAt != nil
}

// IsValid checks if the token is valid (not expired and not revoked)
func (rt *RefreshToken) IsValid() bool {
	return !rt.IsExpired() && !rt.IsRevoked()
}

// SanitizeUser returns a User without sensitive information
func (u *User) SanitizeUser() *User {
	return &User{
		ID:         u.ID,
		TenantID:   u.TenantID,
		Email:      u.Email,
		FullName:   u.FullName,
		Roles:      u.Roles,
		ActiveRole: u.ActiveRole,
		IsVerified: u.IsVerified,
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
}

// HasRole checks if the user has a specific role (checks active role)
func (u *User) HasRole(role UserRole) bool {
	return UserRole(u.GetPrimaryRole()) == role
}

// IsSuperAdmin checks if the user is a superadmin
func (u *User) IsSuperAdmin() bool {
	return u.HasRole(RoleSuperAdmin)
}

// IsAdmin checks if the user is an admin
func (u *User) IsAdmin() bool {
	return u.HasRole(RoleAdmin)
}

// IsInstructor checks if the user is an instructor
func (u *User) IsInstructor() bool {
	return u.HasRole(RoleInstructor)
}

// IsStudent checks if the user is a student
func (u *User) IsStudent() bool {
	return u.HasRole(RoleStudent)
}

// HasRoleOrHigher checks if user has specified role or higher in hierarchy
func (u *User) HasRoleOrHigher(role UserRole) bool {
	userRoleLevel := GetRoleHierarchy(UserRole(u.GetPrimaryRole()))
	requiredRoleLevel := GetRoleHierarchy(role)
	return userRoleLevel >= requiredRoleLevel
}

// CanManageCourses checks if user can manage courses (admin or instructor)
func (u *User) CanManageCourses() bool {
	return u.IsAdmin() || u.IsInstructor() || u.IsSuperAdmin()
}

// ============================================
// Multi-Role Support Methods
// ============================================

// GetPrimaryRole returns the primary role (active role or first in roles array)
func (u *User) GetPrimaryRole() string {
	if u.ActiveRole != "" {
		return u.ActiveRole
	}
	if len(u.Roles) > 0 {
		return u.Roles[0]
	}
	return string(RoleStudent) // Default fallback
}

// HasMultipleRoles checks if user has more than one role assigned
func (u *User) HasMultipleRoles() bool {
	return len(u.Roles) > 1
}

// HasRoleInList checks if user has a specific role in their roles list
func (u *User) HasRoleInList(role UserRole) bool {
	for _, r := range u.Roles {
		if UserRole(r) == role {
			return true
		}
	}
	return false
}

// GetActiveRole returns the currently active role or first role
func (u *User) GetActiveRole() UserRole {
	if u.ActiveRole != "" {
		return UserRole(u.ActiveRole)
	}
	if len(u.Roles) > 0 {
		return UserRole(u.Roles[0])
	}
	return RoleStudent // Default fallback
}

// SetActiveRole sets the active role if it exists in the user's roles list
func (u *User) SetActiveRole(role UserRole) error {
	if !u.HasRoleInList(role) {
		return ErrRoleNotAssigned
	}
	u.ActiveRole = string(role)
	u.UpdatedAt = time.Now()
	return nil
}

// InitializeRoles ensures active_role is set if empty
func (u *User) InitializeRoles() {
	if u.ActiveRole == "" && len(u.Roles) > 0 {
		u.ActiveRole = u.Roles[0]
	}
}

// UserMembership represents a user's membership in a tenant
// This is used to retrieve tenant information during login when the user
// doesn't have a direct tenant_id in their user record
type UserMembership struct {
	TenantID string `json:"tenant_id" db:"tenant_id"`
	Role     string `json:"role" db:"role"`
	Status   string `json:"status" db:"status"`
}
