package domain

import "time"

// RegisterDTO represents the data required to register a new user
type RegisterDTO struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=8,max=72"`
	FullName string `json:"full_name" validate:"required,min=2,max=255"`
	Role     string `json:"role,omitempty" validate:"omitempty,oneof=student instructor admin"`
}

// LoginDTO represents the data required to login
type LoginDTO struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse represents the response after successful authentication
type AuthResponse struct {
	AccessToken  string   `json:"access_token"`
	TokenType    string   `json:"token_type"`
	ExpiresIn    int      `json:"expires_in"` // Seconds until expiration
	RefreshToken string   `json:"refresh_token,omitempty"`
	User         *UserDTO `json:"user"`
}

// UserDTO represents a user without sensitive information
type UserDTO struct {
	ID               string    `json:"id"`
	TenantID         *string   `json:"tenant_id,omitempty"` // Nullable - user might not have a tenant yet
	Email            string    `json:"email"`
	FullName         string    `json:"full_name"`
	Role             string    `json:"role"`               // Primary role for backwards compatibility
	Roles            []string  `json:"roles"`              // All assigned roles
	ActiveRole       string    `json:"active_role"`        // Currently active role
	HasMultipleRoles bool      `json:"has_multiple_roles"` // Indicates if user has more than one role
	IsVerified       bool      `json:"is_verified"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// ToUserDTO converts a User entity to UserDTO
func ToUserDTO(user *User) *UserDTO {
	if user == nil {
		return nil
	}

	// Ensure roles are initialized
	roles := user.Roles
	if len(roles) == 0 {
		roles = []string{string(RoleStudent)} // Default fallback
	}

	activeRole := user.ActiveRole
	if activeRole == "" && len(roles) > 0 {
		activeRole = roles[0]
	}

	return &UserDTO{
		ID:               user.ID,
		TenantID:         user.TenantID,
		Email:            user.Email,
		FullName:         user.FullName,
		Role:             roles[0], // Primary role for frontend compatibility
		Roles:            roles,
		ActiveRole:       activeRole,
		HasMultipleRoles: len(roles) > 1,
		IsVerified:       user.IsVerified,
		CreatedAt:        user.CreatedAt,
		UpdatedAt:        user.UpdatedAt,
	}
}

// VerifyEmailDTO represents the data required to verify email
type VerifyEmailDTO struct {
	Token string `json:"token" validate:"required"`
}

// ResendVerificationDTO represents the data required to resend verification email
type ResendVerificationDTO struct {
	Email string `json:"email" validate:"required,email"`
}

// ForgotPasswordDTO represents the data required to request password reset
type ForgotPasswordDTO struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordDTO represents the data required to reset password
type ResetPasswordDTO struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=72"`
}

// ChangePasswordDTO represents the data required to change password
type ChangePasswordDTO struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=72"`
}

// RefreshTokenDTO represents the data required to refresh access token
type RefreshTokenDTO struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// UpdateProfileDTO represents the data that can be updated in user profile
type UpdateProfileDTO struct {
	FullName string `json:"full_name,omitempty" validate:"omitempty,min=2,max=255"`
	Email    string `json:"email,omitempty" validate:"omitempty,email,max=255"`
}

// CreateUserDTO represents the data required for admin to create a user
type CreateUserDTO struct {
	Email      string   `json:"email" validate:"required,email,max=255"`
	Password   string   `json:"password" validate:"required,min=8,max=72"`
	FullName   string   `json:"full_name" validate:"required,min=2,max=255"`
	Role       string   `json:"role" validate:"required,oneof=student instructor admin"`                  // Primary role
	Roles      []string `json:"roles,omitempty" validate:"omitempty,dive,oneof=student instructor admin"` // Multiple roles (optional)
	IsVerified bool     `json:"is_verified,omitempty"`
}

// UpdateUserDTO represents the data that admin can update for a user
type UpdateUserDTO struct {
	FullName   string   `json:"full_name,omitempty" validate:"omitempty,min=2,max=255"`
	Email      string   `json:"email,omitempty" validate:"omitempty,email,max=255"`
	Role       string   `json:"role,omitempty" validate:"omitempty,oneof=student instructor admin"`
	Roles      []string `json:"roles,omitempty" validate:"omitempty,dive,oneof=student instructor admin"` // Update multiple roles
	IsVerified *bool    `json:"is_verified,omitempty"`
}

// SwitchRoleDTO represents the data required to switch active role
type SwitchRoleDTO struct {
	Role string `json:"role" validate:"required,oneof=student instructor admin"`
}

// SwitchRoleResponse represents the response after switching role
type SwitchRoleResponse struct {
	AccessToken string   `json:"access_token"`
	TokenType   string   `json:"token_type"`
	ExpiresIn   int      `json:"expires_in"`
	ActiveRole  string   `json:"active_role"`
	User        *UserDTO `json:"user"`
}

// UserListFilters represents filters for listing users
type UserListFilters struct {
	Role       string `json:"role,omitempty" validate:"omitempty,oneof=student instructor admin"`
	IsVerified *bool  `json:"is_verified,omitempty"`
	Search     string `json:"search,omitempty" validate:"omitempty,max=255"`
}

// Validate checks if the RegisterDTO is valid
func (dto *RegisterDTO) Validate() error {
	// Set default role if not provided
	if dto.Role == "" {
		dto.Role = string(RoleStudent)
	}

	// Additional custom validations can be added here
	if !IsValidRole(dto.Role) {
		dto.Role = string(RoleStudent)
	}

	return nil
}

// Validate checks if the CreateUserDTO is valid
func (dto *CreateUserDTO) Validate() error {
	// Additional custom validations can be added here
	if !IsValidRole(dto.Role) {
		return ErrInvalidRole
	}

	return nil
}

// Domain errors
var (
	ErrInvalidRole = &AuthError{Code: "INVALID_ROLE", Message: "Invalid user role"}
)

// AuthError represents an authentication domain error
type AuthError struct {
	Code    string
	Message string
}

// Error implements the error interface
func (e *AuthError) Error() string {
	return e.Message
}
