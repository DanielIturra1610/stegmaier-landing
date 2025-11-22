package domain

import "time"

// User represents a user in the system
type User struct {
	ID           string    `json:"id" db:"id"`
	TenantID     string    `json:"tenant_id" db:"tenant_id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"` // Never expose in JSON
	FullName     string    `json:"full_name" db:"full_name"`
	Role         string    `json:"role" db:"role"`
	IsVerified   bool      `json:"is_verified" db:"is_verified"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// UserRole defines the possible user roles in the system
type UserRole string

const (
	RoleStudent    UserRole = "student"
	RoleInstructor UserRole = "instructor"
	RoleAdmin      UserRole = "admin"
)

// IsValidRole checks if a role string is valid
func IsValidRole(role string) bool {
	switch UserRole(role) {
	case RoleStudent, RoleInstructor, RoleAdmin:
		return true
	default:
		return false
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
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty" db:"used_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
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
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty" db:"revoked_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
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
		Role:       u.Role,
		IsVerified: u.IsVerified,
		CreatedAt:  u.CreatedAt,
		UpdatedAt:  u.UpdatedAt,
	}
}

// HasRole checks if the user has a specific role
func (u *User) HasRole(role UserRole) bool {
	return UserRole(u.Role) == role
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

// CanManageCourses checks if user can manage courses (admin or instructor)
func (u *User) CanManageCourses() bool {
	return u.IsAdmin() || u.IsInstructor()
}
