package fixtures

import (
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/tests/helpers"
)

func TestDefaultTenant(t *testing.T) {
	tenant := DefaultTenant()

	if tenant.ID == "" {
		t.Error("Expected ID to be set")
	}

	if tenant.Name != "Test Company" {
		t.Errorf("Expected name 'Test Company', got '%s'", tenant.Name)
	}

	if tenant.Slug != "test-company" {
		t.Errorf("Expected slug 'test-company', got '%s'", tenant.Slug)
	}

	if tenant.Status != "active" {
		t.Errorf("Expected status 'active', got '%s'", tenant.Status)
	}
}

func TestTenantBuilder(t *testing.T) {
	tenant := NewTenantBuilder().
		WithName("Custom Company").
		WithSlug("custom-slug").
		WithNodeNumber(2).
		WithStatus("inactive").
		Build()

	if tenant.Name != "Custom Company" {
		t.Errorf("Expected name 'Custom Company', got '%s'", tenant.Name)
	}

	if tenant.Slug != "custom-slug" {
		t.Errorf("Expected slug 'custom-slug', got '%s'", tenant.Slug)
	}

	if tenant.NodeNumber != 2 {
		t.Errorf("Expected node_number 2, got %d", tenant.NodeNumber)
	}

	if tenant.Status != "inactive" {
		t.Errorf("Expected status 'inactive', got '%s'", tenant.Status)
	}
}

func TestCreateTenant(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	testDB := helpers.CreateTestControlDB(t)

	tenant := DefaultTenant()
	tenantInfo := CreateTenant(t, testDB.DB, tenant)

	if tenantInfo.ID != tenant.ID {
		t.Errorf("Expected ID '%s', got '%s'", tenant.ID, tenantInfo.ID)
	}

	if tenantInfo.Slug != tenant.Slug {
		t.Errorf("Expected slug '%s', got '%s'", tenant.Slug, tenantInfo.Slug)
	}

	// Verify tenant exists in database
	var count int
	err := testDB.DB.Get(&count, "SELECT COUNT(*) FROM tenants WHERE id = $1", tenant.ID)
	if err != nil {
		t.Fatalf("Failed to query tenant: %v", err)
	}

	if count != 1 {
		t.Errorf("Expected 1 tenant in DB, got %d", count)
	}
}

func TestMultipleTenants(t *testing.T) {
	tenants := MultipleTenants(3)

	if len(tenants) != 3 {
		t.Errorf("Expected 3 tenants, got %d", len(tenants))
	}

	// Verify each tenant has unique ID and slug
	seen := make(map[string]bool)
	for _, tenant := range tenants {
		if seen[tenant.ID] {
			t.Errorf("Duplicate ID found: %s", tenant.ID)
		}
		seen[tenant.ID] = true

		if tenant.Slug == "" {
			t.Error("Expected slug to be set")
		}
	}
}

func TestDefaultUser(t *testing.T) {
	tenantID := "test-tenant-id"
	user := DefaultUser(tenantID)

	if user.ID == "" {
		t.Error("Expected ID to be set")
	}

	if user.TenantID != tenantID {
		t.Errorf("Expected tenant_id '%s', got '%s'", tenantID, user.TenantID)
	}

	if user.Email != "test@example.com" {
		t.Errorf("Expected email 'test@example.com', got '%s'", user.Email)
	}

	if user.Role != "student" {
		t.Errorf("Expected role 'student', got '%s'", user.Role)
	}

	if !user.IsVerified {
		t.Error("Expected user to be verified")
	}
}

func TestUserBuilder(t *testing.T) {
	tenantID := "test-tenant-id"
	user := NewUserBuilder(tenantID).
		WithEmail("custom@example.com").
		WithFullName("Custom User").
		AsInstructor().
		Unverified().
		Build()

	if user.Email != "custom@example.com" {
		t.Errorf("Expected email 'custom@example.com', got '%s'", user.Email)
	}

	if user.FullName != "Custom User" {
		t.Errorf("Expected full_name 'Custom User', got '%s'", user.FullName)
	}

	if user.Role != "instructor" {
		t.Errorf("Expected role 'instructor', got '%s'", user.Role)
	}

	if user.IsVerified {
		t.Error("Expected user to be unverified")
	}
}

func TestCreateUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	testDB := helpers.CreateTestControlDB(t)

	// Create tenant first (users reference tenants)
	tenant := DefaultTenant()
	tenantInfo := CreateTenant(t, testDB.DB, tenant)

	// Create user
	user := DefaultUser(tenantInfo.ID)
	createdUser := CreateUser(t, testDB.DB, user)

	if createdUser.ID != user.ID {
		t.Errorf("Expected ID '%s', got '%s'", user.ID, createdUser.ID)
	}

	if createdUser.TenantID != tenantInfo.ID {
		t.Errorf("Expected tenant_id '%s', got '%s'", tenantInfo.ID, createdUser.TenantID)
	}

	// Verify user exists in database
	var count int
	err := testDB.DB.Get(&count, "SELECT COUNT(*) FROM users WHERE id = $1", user.ID)
	if err != nil {
		t.Fatalf("Failed to query user: %v", err)
	}

	if count != 1 {
		t.Errorf("Expected 1 user in DB, got %d", count)
	}
}

func TestStudentUser(t *testing.T) {
	tenantID := "test-tenant-id"
	user := StudentUser(tenantID)

	if user.Role != "student" {
		t.Errorf("Expected role 'student', got '%s'", user.Role)
	}

	if !user.IsVerified {
		t.Error("Expected student to be verified")
	}
}

func TestInstructorUser(t *testing.T) {
	tenantID := "test-tenant-id"
	user := InstructorUser(tenantID)

	if user.Role != "instructor" {
		t.Errorf("Expected role 'instructor', got '%s'", user.Role)
	}

	if !user.IsVerified {
		t.Error("Expected instructor to be verified")
	}
}

func TestAdminUser(t *testing.T) {
	tenantID := "test-tenant-id"
	user := AdminUser(tenantID)

	if user.Role != "admin" {
		t.Errorf("Expected role 'admin', got '%s'", user.Role)
	}

	if !user.IsVerified {
		t.Error("Expected admin to be verified")
	}
}

func TestMultipleUsers(t *testing.T) {
	tenantID := "test-tenant-id"
	users := MultipleUsers(tenantID, 5)

	if len(users) != 5 {
		t.Errorf("Expected 5 users, got %d", len(users))
	}

	// Verify different roles are assigned
	roles := make(map[string]int)
	for _, user := range users {
		roles[user.Role]++

		if user.TenantID != tenantID {
			t.Errorf("Expected tenant_id '%s', got '%s'", tenantID, user.TenantID)
		}
	}

	// Should have at least 2 different roles
	if len(roles) < 2 {
		t.Errorf("Expected multiple different roles, got %d", len(roles))
	}
}
