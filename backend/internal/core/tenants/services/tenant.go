package services

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/ports"
	userdomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/user/domain"
	userports "github.com/DanielIturra1610/stegmaier-landing/internal/core/user/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/tokens"
	"github.com/go-playground/validator/v10"
)

// TenantService handles business logic for tenant operations
type TenantService struct {
	repo            ports.TenantRepository
	manager         *database.Manager
	migrationRunner *database.MigrationRunner
	jwtService      *tokens.JWTService
	userService     userports.UserManagementService
	validator       *validator.Validate
}

// NewTenantService creates a new tenant service
func NewTenantService(
	repo ports.TenantRepository,
	manager *database.Manager,
	migrationRunner *database.MigrationRunner,
	jwtService *tokens.JWTService,
	userService userports.UserManagementService,
) *TenantService {
	return &TenantService{
		repo:            repo,
		manager:         manager,
		migrationRunner: migrationRunner,
		jwtService:      jwtService,
		userService:     userService,
		validator:       validator.New(),
	}
}

// CreateTenant creates a new tenant organization
func (s *TenantService) CreateTenant(ctx context.Context, dto *domain.CreateTenantDTO, ownerID string) (*domain.CreateTenantResponse, error) {
	log.Printf("🏢 [TenantService] Starting tenant creation: name=%s, slug=%s, owner=%s", dto.Name, dto.Slug, ownerID)

	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		log.Printf("❌ [TenantService] Validation error: %v", err)
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Validate slug format (alphanumeric, lowercase, hyphens allowed)
	if !isValidSlug(dto.Slug) {
		log.Printf("❌ [TenantService] Invalid slug format: %s", dto.Slug)
		return nil, fmt.Errorf("slug must contain only lowercase letters, numbers, and hyphens")
	}

	// Check if tenant with slug already exists
	exists, err := s.repo.TenantExistsBySlug(ctx, dto.Slug)
	if err != nil {
		log.Printf("❌ [TenantService] Error checking tenant existence: %v", err)
		return nil, fmt.Errorf("failed to check tenant existence: %w", err)
	}
	if exists {
		log.Printf("❌ [TenantService] Tenant with slug '%s' already exists", dto.Slug)
		return nil, fmt.Errorf("tenant with slug '%s' already exists", dto.Slug)
	}

	// Generate database name from slug
	dbName := fmt.Sprintf("tenant_%s", dto.Slug)
	log.Printf("📦 [TenantService] Creating database: %s", dbName)

	// Create tenant database
	if err := s.manager.CreateTenantDatabase(dbName); err != nil {
		log.Printf("❌ [TenantService] Failed to create database %s: %v", dbName, err)
		return nil, fmt.Errorf("failed to create tenant database: %w", err)
	}
	log.Printf("✅ [TenantService] Database created successfully: %s", dbName)

	// Create tenant record first to get tenant ID
	log.Printf("📝 [TenantService] Creating tenant record in control database...")
	tenantID, err := s.repo.CreateTenant(ctx, dto.Name, dto.Slug, dbName, dto.Description, dto.Email, dto.Phone, dto.Address, dto.Website, ownerID)
	if err != nil {
		log.Printf("❌ [TenantService] Failed to create tenant record: %v", err)
		// Attempt to rollback database creation
		_ = s.manager.DropTenantDatabase("", dbName)
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}
	log.Printf("✅ [TenantService] Tenant record created with ID: %s", tenantID)

	// Run tenant migrations
	log.Printf("🔄 [TenantService] Running migrations for tenant: %s", tenantID)
	if err := s.migrationRunner.RunTenantMigrations(tenantID, "migrations/tenants"); err != nil {
		log.Printf("❌ [TenantService] Failed to run migrations: %v", err)
		// Rollback: delete tenant record and drop database
		_ = s.repo.DeleteTenant(ctx, tenantID)
		_ = s.manager.DropTenantDatabase(tenantID, dbName)
		return nil, fmt.Errorf("failed to run tenant migrations: %w", err)
	}
	log.Printf("✅ [TenantService] Migrations completed successfully")

	// Note: Admin membership is already created in CreateTenant repository method
	log.Printf("✅ [TenantService] Admin membership was created with tenant record")

	log.Printf("🎉 [TenantService] Tenant creation completed successfully: %s (%s)", dto.Name, tenantID)
	return &domain.CreateTenantResponse{
		TenantID:     tenantID,
		Name:         dto.Name,
		Slug:         dto.Slug,
		DatabaseName: dbName,
		Role:         "admin",
		Message:      "Tenant created successfully. You are now the admin of this organization.",
	}, nil
}

// GetUserTenants retrieves all tenants for a user
func (s *TenantService) GetUserTenants(ctx context.Context, userID string) ([]*domain.TenantWithMembership, error) {
	tenants, err := s.repo.GetUserTenants(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user tenants: %w", err)
	}

	return tenants, nil
}

// GetPendingInvitations retrieves pending invitations for a user
func (s *TenantService) GetPendingInvitations(ctx context.Context, userID string) ([]*domain.Invitation, error) {
	invitations, err := s.repo.GetPendingInvitations(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending invitations: %w", err)
	}

	return invitations, nil
}

// SelectTenant allows a user to select an active tenant
func (s *TenantService) SelectTenant(ctx context.Context, dto *domain.SelectTenantDTO, userID string) (*domain.SelectTenantResponse, error) {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Verify user has active membership in this tenant
	membership, err := s.repo.GetMembership(ctx, userID, dto.TenantID)
	if err != nil {
		return nil, fmt.Errorf("you don't have access to this tenant")
	}

	if membership.Status != "active" {
		return nil, fmt.Errorf("your membership in this tenant is not active")
	}

	// Get tenant info
	tenant, err := s.repo.GetTenantByID(ctx, dto.TenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	// Update user's current tenant_id
	if err := s.repo.UpdateUserTenant(ctx, userID, dto.TenantID); err != nil {
		return nil, fmt.Errorf("failed to update user tenant: %w", err)
	}

	// Generate new JWT with ALL user roles (not just membership role)
	// Frontend will handle role selection if user has multiple roles
	token, err := s.jwtService.Generate(&tokens.Claims{
		UserID:   userID,
		TenantID: dto.TenantID,
		Role:     membership.Role, // Current membership role in this tenant
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &domain.SelectTenantResponse{
		TenantID:   dto.TenantID,
		TenantName: tenant.Name,
		Role:       membership.Role,
		Token:      token,
		Message:    fmt.Sprintf("Successfully switched to %s organization", tenant.Name),
	}, nil
}

// InviteUser invites a user to join a tenant
func (s *TenantService) InviteUser(ctx context.Context, dto *domain.InviteUserDTO, tenantID, inviterID string) (*domain.InviteUserResponse, error) {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Verify inviter has admin role in tenant
	inviterMembership, err := s.repo.GetMembership(ctx, inviterID, tenantID)
	if err != nil || inviterMembership.Role != "admin" {
		return nil, fmt.Errorf("only admins can invite users to the tenant")
	}

	// TODO: Find user by email (requires user repository)
	// For now, this would be implemented by the controller layer
	// which has access to the user service

	return nil, fmt.Errorf("not implemented: user lookup by email required")
}

// CreateUserInTenant creates a new user directly in a tenant (admin feature)
func (s *TenantService) CreateUserInTenant(ctx context.Context, dto *domain.CreateUserInTenantDTO, tenantID, adminID string) (*domain.CreateUserInTenantResponse, error) {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Verify admin has admin role in tenant
	adminMembership, err := s.repo.GetMembership(ctx, adminID, tenantID)
	if err != nil || adminMembership.Role != "admin" {
		return nil, fmt.Errorf("only admins can create users in the tenant")
	}

	// Role hierarchy validation to prevent privilege escalation
	// Tenant admins can create: student, instructor, admin (but NOT superadmin)
	if dto.Role == "superadmin" {
		log.Printf("⚠️  Role escalation attempt: tenant admin %s tried to create superadmin user", adminID)
		return nil, fmt.Errorf("tenant admins cannot create superadmin users")
	}

	// Only allow valid roles for tenant context
	validTenantRoles := map[string]bool{
		"student":    true,
		"instructor": true,
		"admin":      true,
	}
	if !validTenantRoles[dto.Role] {
		log.Printf("⚠️  Invalid role for tenant: %s", dto.Role)
		return nil, fmt.Errorf("invalid role: %s. Allowed roles: student, instructor, admin", dto.Role)
	}

	log.Printf("✅ Role validation passed: tenant admin creating %s user", dto.Role)

	// Create user using UserManagementService
	userDTO := &userdomain.CreateUserDTO{
		Email:    dto.Email,
		Password: dto.Password,
		FullName: dto.FullName,
		Roles:    []string{dto.Role},
		TenantID: tenantID,
	}

	user, err := s.userService.CreateUser(ctx, userDTO)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Create membership for the new user in the tenant
	if err := s.CreateMembershipForUser(ctx, user.ID, tenantID, dto.Role, adminID); err != nil {
		// If membership creation fails, we should ideally rollback user creation
		// For now, just log the error and continue
		return nil, fmt.Errorf("user created but failed to create membership: %w", err)
	}

	return &domain.CreateUserInTenantResponse{
		UserID:   user.ID,
		Email:    user.Email,
		FullName: user.FullName,
		Role:     dto.Role,
		TenantID: tenantID,
		Message:  fmt.Sprintf("User %s created successfully in tenant with role %s", user.Email, dto.Role),
	}, nil
}

// AcceptInvitation accepts a pending invitation
func (s *TenantService) AcceptInvitation(ctx context.Context, dto *domain.AcceptInvitationDTO, userID string) error {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}

	// TODO: Verify the membership belongs to the user and is in pending status
	// Update status to active and set joined_at

	if err := s.repo.UpdateMembershipStatus(ctx, dto.InvitationID, "active"); err != nil {
		return fmt.Errorf("failed to accept invitation: %w", err)
	}

	if err := s.repo.UpdateMembershipJoinedAt(ctx, dto.InvitationID); err != nil {
		return fmt.Errorf("failed to update joined date: %w", err)
	}

	return nil
}

// RejectInvitation rejects a pending invitation
func (s *TenantService) RejectInvitation(ctx context.Context, dto *domain.RejectInvitationDTO, userID string) error {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}

	// TODO: Verify the membership belongs to the user and is in pending status

	if err := s.repo.UpdateMembershipStatus(ctx, dto.InvitationID, "rejected"); err != nil {
		return fmt.Errorf("failed to reject invitation: %w", err)
	}

	return nil
}

// GetTenantMembers retrieves all members of a tenant (admin only)
func (s *TenantService) GetTenantMembers(ctx context.Context, tenantID, requestingUserID string) ([]*domain.TenantMembership, error) {
	// Verify requesting user is admin in this tenant
	membership, err := s.repo.GetMembership(ctx, requestingUserID, tenantID)
	if err != nil || membership.Role != "admin" {
		return nil, fmt.Errorf("only admins can view tenant members")
	}

	members, err := s.repo.GetTenantMembers(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant members: %w", err)
	}

	return members, nil
}

// CreateMembershipForUser creates a membership for an existing user (used by admin create user feature)
func (s *TenantService) CreateMembershipForUser(ctx context.Context, userID, tenantID, role, createdBy string) error {
	// Validate role
	if role != "admin" && role != "instructor" && role != "student" {
		return fmt.Errorf("invalid role: must be admin, instructor, or student")
	}

	now := time.Now()
	membership := &domain.TenantMembership{
		UserID:    userID,
		TenantID:  tenantID,
		Role:      role,
		Status:    "active",
		InvitedBy: &createdBy,
		InvitedAt: &now,
		JoinedAt:  &now,
	}

	if err := s.repo.CreateMembership(ctx, membership); err != nil {
		return fmt.Errorf("failed to create membership: %w", err)
	}

	return nil
}

// Helper functions

// isValidSlug validates slug format
func isValidSlug(slug string) bool {
	// Slug must be lowercase alphanumeric with hyphens
	// Must start and end with alphanumeric
	pattern := `^[a-z0-9]+(-[a-z0-9]+)*$`
	matched, _ := regexp.MatchString(pattern, slug)
	return matched && len(slug) >= 3 && len(slug) <= 50
}

// normalizeSlug converts a name to a valid slug
func normalizeSlug(name string) string {
	// Convert to lowercase
	slug := strings.ToLower(name)

	// Replace spaces with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")

	// Remove invalid characters
	reg := regexp.MustCompile(`[^a-z0-9-]+`)
	slug = reg.ReplaceAllString(slug, "")

	// Remove multiple consecutive hyphens
	reg = regexp.MustCompile(`-+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Trim hyphens from start and end
	slug = strings.Trim(slug, "-")

	return slug
}

// GetTenantMembersWithUsers retrieves all members of a tenant with user details (admin only)
func (s *TenantService) GetTenantMembersWithUsers(ctx context.Context, tenantID, requestingUserID string) ([]*domain.MemberWithUser, error) {
	// Verify requesting user is admin in this tenant
	membership, err := s.repo.GetMembership(ctx, requestingUserID, tenantID)
	if err != nil || membership.Role != "admin" {
		return nil, fmt.Errorf("only admins can view tenant members")
	}

	members, err := s.repo.GetTenantMembersWithUsers(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant members with users: %w", err)
	}

	return members, nil
}
