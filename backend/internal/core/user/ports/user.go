package ports

import (
	"context"

	authdomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/user/domain"
)

// UserRepository defines the interface for user data persistence
type UserRepository interface {
	// CRUD Operations
	Create(ctx context.Context, user *authdomain.User) error
	GetByID(ctx context.Context, userID string) (*authdomain.User, error)
	GetByEmail(ctx context.Context, email string) (*authdomain.User, error)
	Update(ctx context.Context, user *authdomain.User) error
	Delete(ctx context.Context, userID string) error // Soft delete

	// List and Filter
	List(ctx context.Context, filters *domain.UserFiltersDTO) ([]*authdomain.User, int, error)
	GetByTenant(ctx context.Context, tenantID string) ([]*authdomain.User, error)
	GetByRole(ctx context.Context, role string) ([]*authdomain.User, error)

	// Count Operations
	Count(ctx context.Context, filters *domain.UserFiltersDTO) (int, error)
	CountByTenant(ctx context.Context, tenantID string) (int, error)
	CountByRole(ctx context.Context, role string) (int, error)

	// Status Operations
	SetVerified(ctx context.Context, userID string, verified bool) error
	Exists(ctx context.Context, email string) (bool, error)

	// Bulk Operations
	BulkDelete(ctx context.Context, userIDs []string) error
	BulkUpdateRole(ctx context.Context, userIDs []string, newRole string) error

	// Statistics
	GetStats(ctx context.Context, tenantID string) (*domain.UserStatsDTO, error)
}

// UserManagementService defines the business logic for user management
type UserManagementService interface {
	// CRUD Operations (Admin only)
	CreateUser(ctx context.Context, dto *domain.CreateUserDTO) (*authdomain.User, error)
	GetUser(ctx context.Context, userID string) (*authdomain.User, error)
	UpdateUser(ctx context.Context, userID string, dto *domain.UpdateUserDTO) (*authdomain.User, error)
	DeleteUser(ctx context.Context, userID string) error

	// List Operations
	ListUsers(ctx context.Context, filters *domain.UserFiltersDTO) (*domain.UserListResponse, error)
	GetUsersByTenant(ctx context.Context, tenantID string) ([]*authdomain.User, error)
	GetUsersByRole(ctx context.Context, role string) ([]*authdomain.User, error)

	// Count Operations
	CountUsers(ctx context.Context, filters *domain.UserFiltersDTO) (int, error)
	CountUsersByTenant(ctx context.Context, tenantID string) (int, error)
	CountUsersByRole(ctx context.Context, role string) (int, error)

	// Status Management
	VerifyUser(ctx context.Context, userID string) error
	UnverifyUser(ctx context.Context, userID string) error

	// Role Management
	ChangeUserRole(ctx context.Context, userID string, dto *domain.ChangeRoleDTO) (*authdomain.User, error)

	// Password Management (Admin operations)
	ResetUserPassword(ctx context.Context, userID string, dto *domain.ResetPasswordDTO) error
	ForcePasswordChange(ctx context.Context, userID string) error

	// Bulk Operations
	BulkDeleteUsers(ctx context.Context, dto *domain.BulkDeleteDTO) error
	BulkUpdateRole(ctx context.Context, dto *domain.BulkUpdateRoleDTO) error

	// Statistics
	GetUserStats(ctx context.Context, tenantID string) (*domain.UserStatsDTO, error)
}
