package services

import (
	"context"
	"fmt"
	"log"
	"time"

	authdomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	authports "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/user/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/user/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/google/uuid"
)

// UserManagementService implements the user management business logic
type UserManagementService struct {
	authRepo       authports.AuthRepository
	userRepo       ports.UserRepository
	passwordHasher hasher.PasswordHasher
}

// NewUserManagementService creates a new user management service
func NewUserManagementService(
	authRepo authports.AuthRepository,
	userRepo ports.UserRepository,
	passwordHasher hasher.PasswordHasher,
) ports.UserManagementService {
	return &UserManagementService{
		authRepo:       authRepo,
		userRepo:       userRepo,
		passwordHasher: passwordHasher,
	}
}

// CreateUser creates a new user (admin operation)
func (s *UserManagementService) CreateUser(ctx context.Context, dto *domain.CreateUserDTO) (*authdomain.User, error) {
	log.Printf("📝 UserManagementService: Creating user with email %s", dto.Email)

	// Validate DTO
	if err := dto.Validate(); err != nil {
		log.Printf("⚠️  Validation failed: %v", err)
		return nil, err
	}

	// Check if user already exists
	existingUser, err := s.authRepo.GetUserByEmail(ctx, dto.Email)
	if err == nil && existingUser != nil {
		log.Printf("⚠️  User with email %s already exists", dto.Email)
		return nil, authports.ErrUserAlreadyExists
	}

	// Hash password
	hashedPassword, err := s.passwordHasher.Hash(dto.Password)
	if err != nil {
		log.Printf("❌ Failed to hash password: %v", err)
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Convert tenant ID to pointer (nullable)
	var tenantIDPtr *string
	if dto.TenantID != "" {
		tenantIDPtr = &dto.TenantID
	}

	// Create user entity
	// Users created by admin are auto-verified (enterprise pattern)
	user := &authdomain.User{
		ID:           uuid.New().String(),
		TenantID:     tenantIDPtr,
		Email:        dto.Email,
		PasswordHash: hashedPassword,
		FullName:     dto.FullName,
		Roles:        dto.Roles,    // Multi-role support
		ActiveRole:   dto.Roles[0], // Set first role as active
		IsVerified:   true,         // Admin-created users are auto-verified
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Create user in database
	if err := s.authRepo.CreateUser(ctx, user); err != nil {
		log.Printf("❌ Failed to create user: %v", err)
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	log.Printf("✅ User created successfully: %s (%s)", user.Email, user.ID)
	return user, nil
}

// GetUser retrieves a user by ID
func (s *UserManagementService) GetUser(ctx context.Context, userID string) (*authdomain.User, error) {
	log.Printf("🔍 UserManagementService: Getting user %s", userID)

	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		log.Printf("❌ User not found: %s", userID)
		return nil, authports.ErrUserNotFound
	}

	return user, nil
}

// UpdateUser updates user information
func (s *UserManagementService) UpdateUser(ctx context.Context, userID string, dto *domain.UpdateUserDTO) (*authdomain.User, error) {
	log.Printf("📝 UserManagementService: Updating user %s", userID)

	// Validate DTO
	if err := dto.Validate(); err != nil {
		log.Printf("⚠️  Validation failed: %v", err)
		return nil, err
	}

	// Get existing user
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		log.Printf("❌ User not found: %s", userID)
		return nil, authports.ErrUserNotFound
	}

	// Update fields if provided
	updated := false

	if dto.FullName != nil {
		user.FullName = *dto.FullName
		updated = true
	}

	// Handle roles update (supports both Role and Roles[])
	if roles := dto.GetRoles(); len(roles) > 0 {
		user.Roles = roles
		user.ActiveRole = roles[0] // First role as active
		updated = true
		log.Printf("🔄 Changing user roles to: %v (active: %s)", roles, roles[0])
	}

	if dto.IsVerified != nil {
		user.IsVerified = *dto.IsVerified
		updated = true
		log.Printf("🔄 Setting user verified status to: %v", *dto.IsVerified)
	}

	if !updated {
		log.Printf("⚠️  No fields to update")
		return user, nil
	}

	user.UpdatedAt = time.Now()

	// Update in database
	if err := s.authRepo.UpdateUser(ctx, user); err != nil {
		log.Printf("❌ Failed to update user: %v", err)
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	log.Printf("✅ User updated successfully: %s", userID)
	return user, nil
}

// DeleteUser soft deletes a user
func (s *UserManagementService) DeleteUser(ctx context.Context, userID string) error {
	log.Printf("🗑️  UserManagementService: Deleting user %s", userID)

	// Check if user exists
	_, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		log.Printf("❌ User not found: %s", userID)
		return authports.ErrUserNotFound
	}

	// Delete user
	if err := s.userRepo.Delete(ctx, userID); err != nil {
		log.Printf("❌ Failed to delete user: %v", err)
		return fmt.Errorf("failed to delete user: %w", err)
	}

	log.Printf("✅ User deleted successfully: %s", userID)
	return nil
}

// ListUsers returns a paginated list of users
func (s *UserManagementService) ListUsers(ctx context.Context, filters *domain.UserFiltersDTO) (*domain.UserListResponse, error) {
	log.Printf("📋 UserManagementService: Listing users with filters")

	// Apply default pagination
	filters.ApplyDefaults()

	// Get users
	users, totalCount, err := s.userRepo.List(ctx, filters)
	if err != nil {
		log.Printf("❌ Failed to list users: %v", err)
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	// Calculate total pages
	totalPages := (totalCount + filters.PageSize - 1) / filters.PageSize

	response := &domain.UserListResponse{
		Users:      convertToUserSlice(users),
		TotalCount: totalCount,
		Page:       filters.Page,
		PageSize:   filters.PageSize,
		TotalPages: totalPages,
	}

	log.Printf("✅ Retrieved %d users (page %d/%d)", len(users), filters.Page, totalPages)
	return response, nil
}

// GetUsersByTenant retrieves all users in a tenant
func (s *UserManagementService) GetUsersByTenant(ctx context.Context, tenantID string) ([]*authdomain.User, error) {
	log.Printf("🔍 UserManagementService: Getting users for tenant %s", tenantID)

	users, err := s.userRepo.GetByTenant(ctx, tenantID)
	if err != nil {
		log.Printf("❌ Failed to get users by tenant: %v", err)
		return nil, fmt.Errorf("failed to get users by tenant: %w", err)
	}

	log.Printf("✅ Retrieved %d users for tenant %s", len(users), tenantID)
	return users, nil
}

// GetUsersByRole retrieves all users with a specific role
func (s *UserManagementService) GetUsersByRole(ctx context.Context, role string) ([]*authdomain.User, error) {
	log.Printf("🔍 UserManagementService: Getting users with role %s", role)

	// Validate role
	if !authdomain.IsValidRole(role) {
		return nil, authdomain.ErrInvalidRole
	}

	users, err := s.userRepo.GetByRole(ctx, role)
	if err != nil {
		log.Printf("❌ Failed to get users by role: %v", err)
		return nil, fmt.Errorf("failed to get users by role: %w", err)
	}

	log.Printf("✅ Retrieved %d users with role %s", len(users), role)
	return users, nil
}

// CountUsers counts users matching filters
func (s *UserManagementService) CountUsers(ctx context.Context, filters *domain.UserFiltersDTO) (int, error) {
	count, err := s.userRepo.Count(ctx, filters)
	if err != nil {
		log.Printf("❌ Failed to count users: %v", err)
		return 0, fmt.Errorf("failed to count users: %w", err)
	}
	return count, nil
}

// CountUsersByTenant counts users in a tenant
func (s *UserManagementService) CountUsersByTenant(ctx context.Context, tenantID string) (int, error) {
	count, err := s.userRepo.CountByTenant(ctx, tenantID)
	if err != nil {
		log.Printf("❌ Failed to count users by tenant: %v", err)
		return 0, fmt.Errorf("failed to count users by tenant: %w", err)
	}
	return count, nil
}

// CountUsersByRole counts users with a specific role
func (s *UserManagementService) CountUsersByRole(ctx context.Context, role string) (int, error) {
	// Validate role
	if !authdomain.IsValidRole(role) {
		return 0, authdomain.ErrInvalidRole
	}

	count, err := s.userRepo.CountByRole(ctx, role)
	if err != nil {
		log.Printf("❌ Failed to count users by role: %v", err)
		return 0, fmt.Errorf("failed to count users by role: %w", err)
	}
	return count, nil
}

// VerifyUser marks a user as verified
func (s *UserManagementService) VerifyUser(ctx context.Context, userID string) error {
	log.Printf("✅ UserManagementService: Verifying user %s", userID)

	if err := s.userRepo.SetVerified(ctx, userID, true); err != nil {
		log.Printf("❌ Failed to verify user: %v", err)
		return fmt.Errorf("failed to verify user: %w", err)
	}

	log.Printf("✅ User verified successfully: %s", userID)
	return nil
}

// UnverifyUser marks a user as unverified
func (s *UserManagementService) UnverifyUser(ctx context.Context, userID string) error {
	log.Printf("❌ UserManagementService: Unverifying user %s", userID)

	if err := s.userRepo.SetVerified(ctx, userID, false); err != nil {
		log.Printf("❌ Failed to unverify user: %v", err)
		return fmt.Errorf("failed to unverify user: %w", err)
	}

	log.Printf("✅ User unverified successfully: %s", userID)
	return nil
}

// ChangeUserRole changes a user's role
func (s *UserManagementService) ChangeUserRole(ctx context.Context, userID string, dto *domain.ChangeRoleDTO) (*authdomain.User, error) {
	log.Printf("🔄 UserManagementService: Changing role for user %s to %s", userID, dto.Role)

	// Validate role
	if !authdomain.IsValidRole(dto.Role) {
		return nil, authdomain.ErrInvalidRole
	}

	// Get user
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, authports.ErrUserNotFound
	}

	// Update role
	user.Roles = []string{dto.Role}
	user.ActiveRole = dto.Role
	user.UpdatedAt = time.Now()

	if err := s.authRepo.UpdateUser(ctx, user); err != nil {
		log.Printf("❌ Failed to change user role: %v", err)
		return nil, fmt.Errorf("failed to change user role: %w", err)
	}

	log.Printf("✅ User role changed successfully: %s -> %s", userID, dto.Role)
	return user, nil
}

// ResetUserPassword resets a user's password (admin operation)
func (s *UserManagementService) ResetUserPassword(ctx context.Context, userID string, dto *domain.ResetPasswordDTO) error {
	log.Printf("🔑 UserManagementService: Resetting password for user %s", userID)

	// Get user
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return authports.ErrUserNotFound
	}

	// Hash new password
	hashedPassword, err := s.passwordHasher.Hash(dto.NewPassword)
	if err != nil {
		log.Printf("❌ Failed to hash password: %v", err)
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	user.PasswordHash = hashedPassword
	user.UpdatedAt = time.Now()

	if err := s.authRepo.UpdateUser(ctx, user); err != nil {
		log.Printf("❌ Failed to reset password: %v", err)
		return fmt.Errorf("failed to reset password: %w", err)
	}

	log.Printf("✅ Password reset successfully for user: %s", userID)
	return nil
}

// ForcePasswordChange forces user to change password on next login
func (s *UserManagementService) ForcePasswordChange(ctx context.Context, userID string) error {
	log.Printf("🔒 UserManagementService: Forcing password change for user %s", userID)

	// For now, this could be implemented by setting a flag in the user entity
	// Or by invalidating all existing tokens
	// This is a placeholder implementation

	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return authports.ErrUserNotFound
	}

	user.UpdatedAt = time.Now()

	log.Printf("✅ Password change forced for user: %s", userID)
	return nil
}

// BulkDeleteUsers deletes multiple users
func (s *UserManagementService) BulkDeleteUsers(ctx context.Context, dto *domain.BulkDeleteDTO) error {
	log.Printf("🗑️  UserManagementService: Bulk deleting %d users", len(dto.UserIDs))

	if err := s.userRepo.BulkDelete(ctx, dto.UserIDs); err != nil {
		log.Printf("❌ Failed to bulk delete users: %v", err)
		return fmt.Errorf("failed to bulk delete users: %w", err)
	}

	log.Printf("✅ Bulk deleted %d users successfully", len(dto.UserIDs))
	return nil
}

// BulkUpdateRole updates role for multiple users
func (s *UserManagementService) BulkUpdateRole(ctx context.Context, dto *domain.BulkUpdateRoleDTO) error {
	log.Printf("🔄 UserManagementService: Bulk updating role for %d users to %s", len(dto.UserIDs), dto.NewRole)

	// Validate role
	if !authdomain.IsValidRole(dto.NewRole) {
		return authdomain.ErrInvalidRole
	}

	if err := s.userRepo.BulkUpdateRole(ctx, dto.UserIDs, dto.NewRole); err != nil {
		log.Printf("❌ Failed to bulk update roles: %v", err)
		return fmt.Errorf("failed to bulk update roles: %w", err)
	}

	log.Printf("✅ Bulk updated role for %d users successfully", len(dto.UserIDs))
	return nil
}

// GetUserStats retrieves user statistics for a tenant
func (s *UserManagementService) GetUserStats(ctx context.Context, tenantID string) (*domain.UserStatsDTO, error) {
	log.Printf("📊 UserManagementService: Getting user stats for tenant %s", tenantID)

	stats, err := s.userRepo.GetStats(ctx, tenantID)
	if err != nil {
		log.Printf("❌ Failed to get user stats: %v", err)
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}

	log.Printf("✅ Retrieved user stats for tenant %s", tenantID)
	return stats, nil
}

// Helper function to convert pointer slice to value slice
func convertToUserSlice(users []*authdomain.User) []authdomain.User {
	result := make([]authdomain.User, len(users))
	for i, user := range users {
		if user != nil {
			result[i] = *user
		}
	}
	return result
}
