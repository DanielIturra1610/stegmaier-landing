package auth_test

import (
	"context"
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/tests/fixtures"
	"github.com/DanielIturra1610/stegmaier-landing/tests/helpers"
	"github.com/google/uuid"
)

func TestAuthRepository_CreateUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLAuthRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant first
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	tests := []struct {
		name    string
		user    *domain.User
		wantErr bool
	}{
		{
			name: "Create student user successfully",
			user: &domain.User{
				ID:           uuid.New().String(),
				TenantID:     tenant.ID,
				Email:        "student@test.com",
				PasswordHash: "hashedpassword123",
				FullName:     "Test Student",
				Role:         string(domain.RoleStudent),
				IsVerified:   false,
			},
			wantErr: false,
		},
		{
			name: "Create admin user successfully",
			user: &domain.User{
				ID:           uuid.New().String(),
				TenantID:     tenant.ID,
				Email:        "admin@test.com",
				PasswordHash: "hashedpassword123",
				FullName:     "Test Admin",
				Role:         string(domain.RoleAdmin),
				IsVerified:   true,
			},
			wantErr: false,
		},
		{
			name: "Create superadmin user successfully",
			user: &domain.User{
				ID:           uuid.New().String(),
				TenantID:     tenant.ID,
				Email:        "superadmin@test.com",
				PasswordHash: "hashedpassword123",
				FullName:     "Test SuperAdmin",
				Role:         string(domain.RoleSuperAdmin),
				IsVerified:   true,
			},
			wantErr: false,
		},
		{
			name: "Fail to create user with duplicate email",
			user: &domain.User{
				ID:           uuid.New().String(),
				TenantID:     tenant.ID,
				Email:        "student@test.com", // Duplicate
				PasswordHash: "hashedpassword123",
				FullName:     "Duplicate User",
				Role:         string(domain.RoleStudent),
				IsVerified:   false,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.CreateUser(ctx, tt.user)

			if (err != nil) != tt.wantErr {
				t.Errorf("CreateUser() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr {
				// Verify user was created
				retrieved, err := repo.GetUserByID(ctx, tt.user.ID)
				if err != nil {
					t.Fatalf("Failed to retrieve created user: %v", err)
				}

				if retrieved.Email != tt.user.Email {
					t.Errorf("Expected email %s, got %s", tt.user.Email, retrieved.Email)
				}

				if retrieved.Role != tt.user.Role {
					t.Errorf("Expected role %s, got %s", tt.user.Role, retrieved.Role)
				}

				if retrieved.IsVerified != tt.user.IsVerified {
					t.Errorf("Expected is_verified %v, got %v", tt.user.IsVerified, retrieved.IsVerified)
				}
			}
		})
	}
}

func TestAuthRepository_GetUserByEmail(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLAuthRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and user
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	testUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("findme@test.com").
		AsStudent().
		Verified().
		Build()
	fixtures.CreateUser(t, testDB.DB, testUser)

	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{
			name:    "Find existing user by email",
			email:   "findme@test.com",
			wantErr: false,
		},
		{
			name:    "Fail to find non-existent user",
			email:   "notfound@test.com",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := repo.GetUserByEmail(ctx, tt.email)

			if (err != nil) != tt.wantErr {
				t.Errorf("GetUserByEmail() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr {
				if user.Email != tt.email {
					t.Errorf("Expected email %s, got %s", tt.email, user.Email)
				}
			}
		})
	}
}

func TestAuthRepository_GetUserByID(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLAuthRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and user
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	testUser := fixtures.AdminUser(tenant.ID)
	fixtures.CreateUser(t, testDB.DB, testUser)

	tests := []struct {
		name    string
		userID  string
		wantErr bool
	}{
		{
			name:    "Find existing user by ID",
			userID:  testUser.ID,
			wantErr: false,
		},
		{
			name:    "Fail to find non-existent user",
			userID:  uuid.New().String(),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := repo.GetUserByID(ctx, tt.userID)

			if (err != nil) != tt.wantErr {
				t.Errorf("GetUserByID() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr {
				if user.ID != tt.userID {
					t.Errorf("Expected ID %s, got %s", tt.userID, user.ID)
				}
			}
		})
	}
}

func TestAuthRepository_UpdateUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLAuthRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and user
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	testUser := fixtures.StudentUser(tenant.ID)
	fixtures.CreateUser(t, testDB.DB, testUser)

	t.Run("Update user successfully", func(t *testing.T) {
		// Retrieve user
		user, err := repo.GetUserByID(ctx, testUser.ID)
		if err != nil {
			t.Fatalf("Failed to get user: %v", err)
		}

		// Update user fields
		user.FullName = "Updated Name"
		user.IsVerified = true
		user.Role = string(domain.RoleInstructor)

		// Perform update
		err = repo.UpdateUser(ctx, user)
		if err != nil {
			t.Fatalf("UpdateUser() error = %v", err)
		}

		// Verify updates
		updated, err := repo.GetUserByID(ctx, testUser.ID)
		if err != nil {
			t.Fatalf("Failed to retrieve updated user: %v", err)
		}

		if updated.FullName != "Updated Name" {
			t.Errorf("Expected full name 'Updated Name', got '%s'", updated.FullName)
		}

		if !updated.IsVerified {
			t.Error("Expected is_verified to be true")
		}

		if updated.Role != string(domain.RoleInstructor) {
			t.Errorf("Expected role 'instructor', got '%s'", updated.Role)
		}
	})
}

func TestAuthRepository_MultipleRoles(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLAuthRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	// Create users with different roles
	roles := []struct {
		role  domain.UserRole
		email string
	}{
		{domain.RoleStudent, "student@test.com"},
		{domain.RoleInstructor, "instructor@test.com"},
		{domain.RoleAdmin, "admin@test.com"},
		{domain.RoleSuperAdmin, "superadmin@test.com"},
	}

	for _, r := range roles {
		user := &domain.User{
			ID:           uuid.New().String(),
			TenantID:     tenant.ID,
			Email:        r.email,
			PasswordHash: "hash",
			FullName:     string(r.role) + " User",
			Role:         string(r.role),
			IsVerified:   true,
		}

		err := repo.CreateUser(ctx, user)
		if err != nil {
			t.Fatalf("Failed to create user with role %s: %v", r.role, err)
		}
	}

	// Verify all users were created with correct roles
	for _, r := range roles {
		user, err := repo.GetUserByEmail(ctx, r.email)
		if err != nil {
			t.Fatalf("Failed to retrieve user with role %s: %v", r.role, err)
		}

		if user.Role != string(r.role) {
			t.Errorf("Expected role %s, got %s", r.role, user.Role)
		}

		if !user.IsVerified {
			t.Errorf("Expected user %s to be verified", r.email)
		}
	}
}

func TestAuthRepository_TenantIsolation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLAuthRepository(testDB.DB)
	ctx := context.Background()

	// Create two tenants
	tenant1 := fixtures.NewTenantBuilder().
		WithName("Tenant 1").
		WithSlug("tenant1").
		Build()
	fixtures.CreateTenant(t, testDB.DB, tenant1)

	tenant2 := fixtures.NewTenantBuilder().
		WithName("Tenant 2").
		WithSlug("tenant2").
		Build()
	fixtures.CreateTenant(t, testDB.DB, tenant2)

	// Create users in different tenants with same email domain
	user1 := fixtures.NewUserBuilder(tenant1.ID).
		WithEmail("admin@company.com").
		AsAdmin().
		Build()
	fixtures.CreateUser(t, testDB.DB, user1)

	user2 := fixtures.NewUserBuilder(tenant2.ID).
		WithEmail("admin2@company.com").
		AsAdmin().
		Build()
	fixtures.CreateUser(t, testDB.DB, user2)

	// Verify users belong to correct tenants
	retrieved1, err := repo.GetUserByID(ctx, user1.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve user1: %v", err)
	}

	if retrieved1.TenantID != tenant1.ID {
		t.Errorf("User1 should belong to tenant1, got %s", retrieved1.TenantID)
	}

	retrieved2, err := repo.GetUserByID(ctx, user2.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve user2: %v", err)
	}

	if retrieved2.TenantID != tenant2.ID {
		t.Errorf("User2 should belong to tenant2, got %s", retrieved2.TenantID)
	}
}
