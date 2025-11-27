package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/tokens"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// AuthServiceImpl implements the AuthService interface
type AuthServiceImpl struct {
	repo          ports.AuthRepository
	hasher        hasher.PasswordHasher
	tokenService  tokens.TokenService
	emailService  ports.EmailService
	validator     *validator.Validate
	accessExpiry  time.Duration
	refreshExpiry time.Duration
	verifyExpiry  time.Duration
	resetExpiry   time.Duration
}

// AuthServiceConfig holds configuration for AuthService
type AuthServiceConfig struct {
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
	VerifyTokenExpiry  time.Duration
	ResetTokenExpiry   time.Duration
}

// NewAuthService creates a new instance of AuthService
func NewAuthService(
	repo ports.AuthRepository,
	hasher hasher.PasswordHasher,
	tokenService tokens.TokenService,
	emailService ports.EmailService,
	config AuthServiceConfig,
) ports.AuthService {
	return &AuthServiceImpl{
		repo:          repo,
		hasher:        hasher,
		tokenService:  tokenService,
		emailService:  emailService,
		validator:     validator.New(),
		accessExpiry:  config.AccessTokenExpiry,
		refreshExpiry: config.RefreshTokenExpiry,
		verifyExpiry:  config.VerifyTokenExpiry,
		resetExpiry:   config.ResetTokenExpiry,
	}
}

// Register creates a new user account with email verification
func (s *AuthServiceImpl) Register(ctx context.Context, tenantID string, dto *domain.RegisterDTO) (*domain.AuthResponse, error) {
	// Validate DTO
	if err := dto.Validate(); err != nil {
		return nil, err
	}

	if err := s.validator.Struct(dto); err != nil {
		return nil, ports.ErrInvalidInput
	}

	// Check if email already exists
	exists, err := s.repo.EmailExists(ctx, dto.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if exists {
		return nil, ports.ErrEmailAlreadyExists
	}

	// Hash password
	passwordHash, err := s.hasher.Hash(dto.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user entity
	// TenantID is nullable - users can register without a tenant
	// and will be prompted to create/join a tenant after registration
	var tenantIDPtr *string
	if tenantID != "" {
		tenantIDPtr = &tenantID
	}

	user := &domain.User{
		ID:           uuid.New().String(),
		TenantID:     tenantIDPtr,
		Email:        dto.Email,
		PasswordHash: passwordHash,
		FullName:     dto.FullName,
		Role:         dto.Role,
		IsVerified:   false,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Save user to database
	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate verification token
	verifyToken := &domain.VerificationToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Token:     s.generateSecureToken(),
		ExpiresAt: time.Now().Add(s.verifyExpiry),
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreateVerificationToken(ctx, verifyToken); err != nil {
		return nil, fmt.Errorf("failed to create verification token: %w", err)
	}

	// Send verification email
	if s.emailService != nil {
		if err := s.emailService.SendWelcomeEmail(ctx, user.Email, user.FullName, verifyToken.Token); err != nil {
			// Log the error but don't fail registration
			fmt.Printf("Warning: failed to send verification email to %s: %v\n", user.Email, err)
		} else {
			fmt.Printf("INFO: Verification email sent to %s\n", user.Email)
		}
	}

	// Generate JWT tokens
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshTokenStr, err := s.createRefreshToken(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create refresh token: %w", err)
	}

	return &domain.AuthResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.accessExpiry.Seconds()),
		RefreshToken: refreshTokenStr,
		User:         domain.ToUserDTO(user),
	}, nil
}

// Login authenticates a user with email and password
func (s *AuthServiceImpl) Login(ctx context.Context, tenantID string, dto *domain.LoginDTO) (*domain.AuthResponse, error) {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return nil, ports.ErrInvalidInput
	}

	// Get user by email
	user, err := s.repo.GetUserByEmail(ctx, dto.Email)
	if err != nil {
		return nil, ports.ErrInvalidCredentials
	}

	// Verify tenant matches ONLY if tenantID was provided in the request
	// This allows users to login without selecting a tenant first
	if tenantID != "" && user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return nil, ports.ErrTenantMismatch
	}

	// Verify password
	if err := s.hasher.Compare(user.PasswordHash, dto.Password); err != nil {
		return nil, ports.ErrInvalidCredentials
	}

	// Check if user is verified
	if !user.IsVerified {
		return nil, ports.ErrAccountNotVerified
	}

	// Generate JWT tokens
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshTokenStr, err := s.createRefreshToken(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create refresh token: %w", err)
	}

	return &domain.AuthResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.accessExpiry.Seconds()),
		RefreshToken: refreshTokenStr,
		User:         domain.ToUserDTO(user),
	}, nil
}

// Logout invalidates a user's refresh token
func (s *AuthServiceImpl) Logout(ctx context.Context, userID string, refreshToken string) error {
	// Get refresh token from database
	token, err := s.repo.GetRefreshToken(ctx, refreshToken)
	if err != nil {
		return ports.ErrTokenNotFound
	}

	// Verify token belongs to user
	if token.UserID != userID {
		return ports.ErrUnauthorized
	}

	// Revoke the token
	if err := s.repo.RevokeRefreshToken(ctx, token.ID); err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	return nil
}

// RefreshAccessToken generates a new access token using a valid refresh token
func (s *AuthServiceImpl) RefreshAccessToken(ctx context.Context, dto *domain.RefreshTokenDTO) (*domain.AuthResponse, error) {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return nil, ports.ErrInvalidInput
	}

	// Get refresh token from database
	token, err := s.repo.GetRefreshToken(ctx, dto.RefreshToken)
	if err != nil {
		return nil, ports.ErrRefreshTokenInvalid
	}

	// Validate token
	if !token.IsValid() {
		return nil, ports.ErrRefreshTokenInvalid
	}

	// Get user
	user, err := s.repo.GetUserByID(ctx, token.UserID)
	if err != nil {
		return nil, ports.ErrUserNotFound
	}

	// Generate new access token
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	return &domain.AuthResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(s.accessExpiry.Seconds()),
		RefreshToken: dto.RefreshToken,
		User:         domain.ToUserDTO(user),
	}, nil
}

// RevokeAllSessions revokes all refresh tokens for a user
func (s *AuthServiceImpl) RevokeAllSessions(ctx context.Context, userID string) error {
	if err := s.repo.RevokeAllUserRefreshTokens(ctx, userID); err != nil {
		return fmt.Errorf("failed to revoke all sessions: %w", err)
	}
	return nil
}

// VerifyEmail verifies a user's email address using a verification token
func (s *AuthServiceImpl) VerifyEmail(ctx context.Context, dto *domain.VerifyEmailDTO) error {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return ports.ErrInvalidInput
	}

	// Get verification token
	token, err := s.repo.GetVerificationToken(ctx, dto.Token)
	if err != nil {
		return ports.ErrVerificationTokenInvalid
	}

	// Check if token is expired
	if token.IsExpired() {
		return ports.ErrVerificationTokenExpired
	}

	// Get user
	user, err := s.repo.GetUserByID(ctx, token.UserID)
	if err != nil {
		return ports.ErrUserNotFound
	}

	// Check if already verified
	if user.IsVerified {
		return ports.ErrAlreadyVerified
	}

	// Update user verification status
	user.IsVerified = true
	user.UpdatedAt = time.Now()

	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Delete verification token
	if err := s.repo.DeleteVerificationToken(ctx, token.ID); err != nil {
		// Log error but don't fail - user is already verified
		fmt.Printf("Warning: failed to delete verification token: %v\n", err)
	}

	return nil
}

// ResendVerification generates and sends a new verification email
func (s *AuthServiceImpl) ResendVerification(ctx context.Context, dto *domain.ResendVerificationDTO) error {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return ports.ErrInvalidInput
	}

	// Get user by email
	user, err := s.repo.GetUserByEmail(ctx, dto.Email)
	if err != nil {
		// Return success even if user not found (security best practice)
		return nil
	}

	// Check if already verified
	if user.IsVerified {
		return ports.ErrAlreadyVerified
	}

	// Delete old verification tokens
	if err := s.repo.DeleteVerificationTokensByUserID(ctx, user.ID); err != nil {
		fmt.Printf("Warning: failed to delete old verification tokens: %v\n", err)
	}

	// Generate new verification token
	verifyToken := &domain.VerificationToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Token:     s.generateSecureToken(),
		ExpiresAt: time.Now().Add(s.verifyExpiry),
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreateVerificationToken(ctx, verifyToken); err != nil {
		return fmt.Errorf("failed to create verification token: %w", err)
	}

	// Send verification email
	if s.emailService != nil {
		if err := s.emailService.SendWelcomeEmail(ctx, user.Email, user.FullName, verifyToken.Token); err != nil {
			fmt.Printf("Warning: failed to resend verification email to %s: %v\n", user.Email, err)
			return ports.ErrVerificationEmailFailed
		}
		fmt.Printf("INFO: Verification email resent to %s\n", user.Email)
	}

	return nil
}

// ForgotPassword initiates the password reset process
func (s *AuthServiceImpl) ForgotPassword(ctx context.Context, tenantID string, dto *domain.ForgotPasswordDTO) error {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return ports.ErrInvalidInput
	}

	// Get user by email
	user, err := s.repo.GetUserByEmail(ctx, dto.Email)
	if err != nil {
		// Return success even if user not found (security best practice)
		return nil
	}

	// Verify tenant matches (skip check if user has no tenant yet)
	if user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return nil
	}

	// Delete old password reset tokens
	if err := s.repo.DeletePasswordResetTokensByUserID(ctx, user.ID); err != nil {
		fmt.Printf("Warning: failed to delete old reset tokens: %v\n", err)
	}

	// Generate password reset token
	resetToken := &domain.PasswordResetToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Token:     s.generateSecureToken(),
		ExpiresAt: time.Now().Add(s.resetExpiry),
		UsedAt:    nil,
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreatePasswordResetToken(ctx, resetToken); err != nil {
		return fmt.Errorf("failed to create password reset token: %w", err)
	}

	// TODO: Send password reset email
	// emailService.SendPasswordResetEmail(user.Email, resetToken.Token)

	return nil
}

// ResetPassword resets a user's password using a valid reset token
func (s *AuthServiceImpl) ResetPassword(ctx context.Context, dto *domain.ResetPasswordDTO) error {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return ports.ErrInvalidInput
	}

	// Get password reset token
	token, err := s.repo.GetPasswordResetToken(ctx, dto.Token)
	if err != nil {
		return ports.ErrPasswordResetTokenInvalid
	}

	// Validate token
	if !token.IsValid() {
		if token.IsExpired() {
			return ports.ErrPasswordResetTokenExpired
		}
		if token.IsUsed() {
			return ports.ErrPasswordResetTokenUsed
		}
		return ports.ErrPasswordResetTokenInvalid
	}

	// Get user
	user, err := s.repo.GetUserByID(ctx, token.UserID)
	if err != nil {
		return ports.ErrUserNotFound
	}

	// Hash new password
	newPasswordHash, err := s.hasher.Hash(dto.NewPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update user password
	user.PasswordHash = newPasswordHash
	user.UpdatedAt = time.Now()

	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return fmt.Errorf("failed to update user password: %w", err)
	}

	// Mark token as used
	if err := s.repo.MarkPasswordResetTokenAsUsed(ctx, token.ID); err != nil {
		fmt.Printf("Warning: failed to mark reset token as used: %v\n", err)
	}

	// Revoke all refresh tokens for security
	if err := s.repo.RevokeAllUserRefreshTokens(ctx, user.ID); err != nil {
		fmt.Printf("Warning: failed to revoke refresh tokens: %v\n", err)
	}

	return nil
}

// ChangePassword changes a user's password after verifying their current password
func (s *AuthServiceImpl) ChangePassword(ctx context.Context, userID string, dto *domain.ChangePasswordDTO) error {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return ports.ErrInvalidInput
	}

	// Get user
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return ports.ErrUserNotFound
	}

	// Verify current password
	if err := s.hasher.Compare(user.PasswordHash, dto.CurrentPassword); err != nil {
		return ports.ErrCurrentPasswordIncorrect
	}

	// Check if new password is same as old
	if err := s.hasher.Compare(user.PasswordHash, dto.NewPassword); err == nil {
		return ports.ErrPasswordSameAsOld
	}

	// Hash new password
	newPasswordHash, err := s.hasher.Hash(dto.NewPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update user password
	user.PasswordHash = newPasswordHash
	user.UpdatedAt = time.Now()

	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return fmt.Errorf("failed to update user password: %w", err)
	}

	// Revoke all refresh tokens except current session
	if err := s.repo.RevokeAllUserRefreshTokens(ctx, user.ID); err != nil {
		fmt.Printf("Warning: failed to revoke refresh tokens: %v\n", err)
	}

	return nil
}

// GetCurrentUser retrieves the authenticated user's profile information
func (s *AuthServiceImpl) GetCurrentUser(ctx context.Context, userID string) (*domain.UserDTO, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, ports.ErrUserNotFound
	}

	return domain.ToUserDTO(user), nil
}

// UpdateProfile updates a user's profile information
func (s *AuthServiceImpl) UpdateProfile(ctx context.Context, userID string, dto *domain.UpdateProfileDTO) (*domain.UserDTO, error) {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return nil, ports.ErrInvalidInput
	}

	// Get user
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, ports.ErrUserNotFound
	}

	// Update fields if provided
	if dto.FullName != "" {
		user.FullName = dto.FullName
	}

	if dto.Email != "" && dto.Email != user.Email {
		// Check if new email already exists
		exists, err := s.repo.EmailExistsExcludingUser(ctx, dto.Email, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to check email existence: %w", err)
		}
		if exists {
			return nil, ports.ErrEmailAlreadyExists
		}

		user.Email = dto.Email
		// Mark as unverified when email changes
		user.IsVerified = false
	}

	user.UpdatedAt = time.Now()

	// Update user in database
	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return domain.ToUserDTO(user), nil
}

// Helper methods

// stringPtrEquals safely compares a *string with a string
func stringPtrEquals(ptr *string, str string) bool {
	if ptr == nil {
		return str == ""
	}
	return *ptr == str
}

// stringPtrValue safely gets the value of a *string, returning empty string if nil
func stringPtrValue(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}

// generateAccessToken creates a JWT access token for a user
func (s *AuthServiceImpl) generateAccessToken(user *domain.User) (string, error) {
	claims := &tokens.Claims{
		UserID:   user.ID,
		TenantID: stringPtrValue(user.TenantID),
		Email:    user.Email,
		Role:     user.Role,
	}

	token, err := s.tokenService.Generate(claims)
	if err != nil {
		return "", err
	}

	return token, nil
}

// createRefreshToken creates and stores a refresh token for a user
func (s *AuthServiceImpl) createRefreshToken(ctx context.Context, user *domain.User) (string, error) {
	tokenStr := s.generateSecureToken()

	refreshToken := &domain.RefreshToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Token:     tokenStr,
		ExpiresAt: time.Now().Add(s.refreshExpiry),
		RevokedAt: nil,
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreateRefreshToken(ctx, refreshToken); err != nil {
		return "", err
	}

	return tokenStr, nil
}

// generateSecureToken generates a cryptographically secure random token
func (s *AuthServiceImpl) generateSecureToken() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to UUID if crypto/rand fails
		return uuid.New().String()
	}
	return hex.EncodeToString(bytes)
}

// UserManagementServiceImpl implements the UserManagementService interface
type UserManagementServiceImpl struct {
	authRepo ports.AuthRepository
	userRepo ports.UserRepository
	hasher   hasher.PasswordHasher
	validator *validator.Validate
}

// NewUserManagementService creates a new instance of UserManagementService
func NewUserManagementService(
	authRepo ports.AuthRepository,
	userRepo ports.UserRepository,
	hasher hasher.PasswordHasher,
) ports.UserManagementService {
	return &UserManagementServiceImpl{
		authRepo:  authRepo,
		userRepo:  userRepo,
		hasher:    hasher,
		validator: validator.New(),
	}
}

// CreateUser creates a new user account by an administrator
func (s *UserManagementServiceImpl) CreateUser(ctx context.Context, tenantID string, dto *domain.CreateUserDTO) (*domain.UserDTO, error) {
	// Validate DTO
	if err := dto.Validate(); err != nil {
		return nil, err
	}

	if err := s.validator.Struct(dto); err != nil {
		return nil, ports.ErrInvalidInput
	}

	// Check if email already exists
	exists, err := s.authRepo.EmailExists(ctx, dto.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if exists {
		return nil, ports.ErrEmailAlreadyExists
	}

	// Hash password
	passwordHash, err := s.hasher.Hash(dto.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user entity with nullable tenant ID
	var tenantIDPtr *string
	if tenantID != "" {
		tenantIDPtr = &tenantID
	}

	user := &domain.User{
		ID:           uuid.New().String(),
		TenantID:     tenantIDPtr,
		Email:        dto.Email,
		PasswordHash: passwordHash,
		FullName:     dto.FullName,
		Role:         dto.Role,
		IsVerified:   dto.IsVerified, // Admin can create verified users
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Save user to database
	if err := s.authRepo.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return domain.ToUserDTO(user), nil
}

// GetUserByID retrieves a user's information by their ID
func (s *UserManagementServiceImpl) GetUserByID(ctx context.Context, tenantID string, userID string) (*domain.UserDTO, error) {
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, ports.ErrUserNotFound
	}

	// Verify tenant matches (skip check if user has no tenant yet)
	if user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return nil, ports.ErrTenantMismatch
	}

	return domain.ToUserDTO(user), nil
}

// UpdateUser updates a user's information by an administrator
func (s *UserManagementServiceImpl) UpdateUser(ctx context.Context, tenantID string, userID string, dto *domain.UpdateUserDTO) (*domain.UserDTO, error) {
	// Validate DTO
	if err := s.validator.Struct(dto); err != nil {
		return nil, ports.ErrInvalidInput
	}

	// Get user
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, ports.ErrUserNotFound
	}

	// Verify tenant matches (skip check if user has no tenant yet)
	if user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return nil, ports.ErrTenantMismatch
	}

	// Update fields if provided
	if dto.FullName != "" {
		user.FullName = dto.FullName
	}

	if dto.Email != "" && dto.Email != user.Email {
		// Check if new email already exists
		exists, err := s.authRepo.EmailExistsExcludingUser(ctx, dto.Email, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to check email existence: %w", err)
		}
		if exists {
			return nil, ports.ErrEmailAlreadyExists
		}
		user.Email = dto.Email
	}

	if dto.Role != "" {
		user.Role = dto.Role
	}

	if dto.IsVerified != nil {
		user.IsVerified = *dto.IsVerified
	}

	user.UpdatedAt = time.Now()

	// Update user in database
	if err := s.authRepo.UpdateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return domain.ToUserDTO(user), nil
}

// DeleteUser permanently removes a user from the system
func (s *UserManagementServiceImpl) DeleteUser(ctx context.Context, tenantID string, userID string) error {
	// Get user to verify tenant
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return ports.ErrUserNotFound
	}

	// Verify tenant matches (skip check if user has no tenant yet)
	if user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return ports.ErrTenantMismatch
	}

	// Delete all associated tokens first
	if err := s.authRepo.DeleteVerificationTokensByUserID(ctx, userID); err != nil {
		fmt.Printf("Warning: failed to delete verification tokens: %v\n", err)
	}

	if err := s.authRepo.DeletePasswordResetTokensByUserID(ctx, userID); err != nil {
		fmt.Printf("Warning: failed to delete password reset tokens: %v\n", err)
	}

	if err := s.authRepo.RevokeAllUserRefreshTokens(ctx, userID); err != nil {
		fmt.Printf("Warning: failed to revoke refresh tokens: %v\n", err)
	}

	// Delete user
	if err := s.authRepo.DeleteUser(ctx, userID); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// ListUsers retrieves a paginated list of users with optional filtering
func (s *UserManagementServiceImpl) ListUsers(ctx context.Context, tenantID string, filters *domain.UserListFilters, page, pageSize int) ([]*domain.UserDTO, int, error) {
	users, total, err := s.authRepo.ListUsers(ctx, filters, page, pageSize)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}

	// Filter users by tenant (repository should do this, but double-check for security)
	filteredUsers := make([]*domain.User, 0)
	for _, user := range users {
		if stringPtrEquals(user.TenantID, tenantID) {
			filteredUsers = append(filteredUsers, user)
		}
	}

	// Convert to DTOs
	userDTOs := make([]*domain.UserDTO, len(filteredUsers))
	for i, user := range filteredUsers {
		userDTOs[i] = domain.ToUserDTO(user)
	}

	return userDTOs, total, nil
}

// GetUsersByTenant retrieves all users for a specific tenant with pagination
func (s *UserManagementServiceImpl) GetUsersByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]*domain.UserDTO, int, error) {
	users, total, err := s.userRepo.GetUsersByTenant(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get users by tenant: %w", err)
	}

	// Convert to DTOs
	userDTOs := make([]*domain.UserDTO, len(users))
	for i, user := range users {
		userDTOs[i] = domain.ToUserDTO(user)
	}

	return userDTOs, total, nil
}

// GetUsersByRole retrieves users filtered by a specific role with pagination
func (s *UserManagementServiceImpl) GetUsersByRole(ctx context.Context, tenantID string, role domain.UserRole, page, pageSize int) ([]*domain.UserDTO, int, error) {
	users, total, err := s.userRepo.GetUsersByRole(ctx, tenantID, role, page, pageSize)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get users by role: %w", err)
	}

	// Convert to DTOs
	userDTOs := make([]*domain.UserDTO, len(users))
	for i, user := range users {
		userDTOs[i] = domain.ToUserDTO(user)
	}

	return userDTOs, total, nil
}

// CountUsersByTenant returns the total number of users in a tenant
func (s *UserManagementServiceImpl) CountUsersByTenant(ctx context.Context, tenantID string) (int, error) {
	count, err := s.userRepo.CountUsersByTenant(ctx, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to count users by tenant: %w", err)
	}
	return count, nil
}

// CountUsersByRole returns the number of users with a specific role
func (s *UserManagementServiceImpl) CountUsersByRole(ctx context.Context, tenantID string, role domain.UserRole) (int, error) {
	count, err := s.userRepo.CountUsersByRole(ctx, tenantID, role)
	if err != nil {
		return 0, fmt.Errorf("failed to count users by role: %w", err)
	}
	return count, nil
}

// GetUsersByIDs retrieves multiple users by their IDs in a single operation
func (s *UserManagementServiceImpl) GetUsersByIDs(ctx context.Context, tenantID string, userIDs []string) ([]*domain.UserDTO, error) {
	users, err := s.userRepo.GetUsersByIDs(ctx, userIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get users by IDs: %w", err)
	}

	// Filter by tenant and convert to DTOs
	userDTOs := make([]*domain.UserDTO, 0)
	for _, user := range users {
		if stringPtrEquals(user.TenantID, tenantID) {
			userDTOs = append(userDTOs, domain.ToUserDTO(user))
		}
	}

	return userDTOs, nil
}

// VerifyUserByAdmin manually verifies a user's email by an administrator
func (s *UserManagementServiceImpl) VerifyUserByAdmin(ctx context.Context, tenantID string, userID string) error {
	// Get user
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return ports.ErrUserNotFound
	}

	// Verify tenant matches (skip check if user has no tenant yet)
	if user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return ports.ErrTenantMismatch
	}

	// Update verification status
	user.IsVerified = true
	user.UpdatedAt = time.Now()

	if err := s.authRepo.UpdateUser(ctx, user); err != nil {
		return fmt.Errorf("failed to verify user: %w", err)
	}

	// Clean up verification tokens
	if err := s.authRepo.DeleteVerificationTokensByUserID(ctx, userID); err != nil {
		fmt.Printf("Warning: failed to delete verification tokens: %v\n", err)
	}

	return nil
}

// UnverifyUser removes a user's verification status
func (s *UserManagementServiceImpl) UnverifyUser(ctx context.Context, tenantID string, userID string) error {
	// Get user
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return ports.ErrUserNotFound
	}

	// Verify tenant matches (skip check if user has no tenant yet)
	if user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return ports.ErrTenantMismatch
	}

	// Update verification status
	user.IsVerified = false
	user.UpdatedAt = time.Now()

	if err := s.authRepo.UpdateUser(ctx, user); err != nil {
		return fmt.Errorf("failed to unverify user: %w", err)
	}

	return nil
}

// ResetUserPassword resets a user's password by an administrator
func (s *UserManagementServiceImpl) ResetUserPassword(ctx context.Context, tenantID string, userID string, newPassword string) error {
	// Get user
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return ports.ErrUserNotFound
	}

	// Verify tenant matches (skip check if user has no tenant yet)
	if user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return ports.ErrTenantMismatch
	}

	// Hash new password
	newPasswordHash, err := s.hasher.Hash(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	user.PasswordHash = newPasswordHash
	user.UpdatedAt = time.Now()

	if err := s.authRepo.UpdateUser(ctx, user); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Revoke all refresh tokens for security
	if err := s.authRepo.RevokeAllUserRefreshTokens(ctx, userID); err != nil {
		fmt.Printf("Warning: failed to revoke refresh tokens: %v\n", err)
	}

	// Clean up password reset tokens
	if err := s.authRepo.DeletePasswordResetTokensByUserID(ctx, userID); err != nil {
		fmt.Printf("Warning: failed to delete password reset tokens: %v\n", err)
	}

	return nil
}

// ForcePasswordChange flags a user account to require password change on next login
func (s *UserManagementServiceImpl) ForcePasswordChange(ctx context.Context, tenantID string, userID string) error {
	// Get user
	user, err := s.authRepo.GetUserByID(ctx, userID)
	if err != nil {
		return ports.ErrUserNotFound
	}

	// Verify tenant matches (skip check if user has no tenant yet)
	if user.TenantID != nil && !stringPtrEquals(user.TenantID, tenantID) {
		return ports.ErrTenantMismatch
	}

	// TODO: Add ForcePasswordChange field to User entity
	// For now, we can revoke all sessions which will force re-login
	if err := s.authRepo.RevokeAllUserRefreshTokens(ctx, userID); err != nil {
		return fmt.Errorf("failed to revoke sessions: %w", err)
	}

	return nil
}
