package helpers

import (
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/tests/fixtures"
)

func TestCreateTestControlDB(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	testDB := CreateTestControlDB(t)

	// Verify database was created
	if testDB.DB == nil {
		t.Fatal("Expected DB to be initialized")
	}

	if testDB.Name == "" {
		t.Fatal("Expected database name to be set")
	}

	if !testDB.IsControl {
		t.Fatal("Expected IsControl to be true")
	}

	// Verify tables exist
	var tableCount int
	err := testDB.DB.Get(&tableCount, `
		SELECT COUNT(*) FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name IN ('tenants', 'users')
	`)
	if err != nil {
		t.Fatalf("Failed to query tables: %v", err)
	}

	if tableCount != 2 {
		t.Errorf("Expected 2 tables (tenants, users), got %d", tableCount)
	}

	// Cleanup is automatic via t.Cleanup
}

func TestCreateTestTenantDB(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	testDB := CreateTestTenantDB(t, "test-tenant")

	// Verify database was created
	if testDB.DB == nil {
		t.Fatal("Expected DB to be initialized")
	}

	if testDB.Name == "" {
		t.Fatal("Expected database name to be set")
	}

	if !testDB.IsTenant {
		t.Fatal("Expected IsTenant to be true")
	}

	// Verify tables exist
	var tableCount int
	err := testDB.DB.Get(&tableCount, `
		SELECT COUNT(*) FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name IN ('courses', 'modules', 'lessons', 'enrollments')
	`)
	if err != nil {
		t.Fatalf("Failed to query tables: %v", err)
	}

	if tableCount != 4 {
		t.Errorf("Expected 4 tables (courses, modules, lessons, enrollments), got %d", tableCount)
	}
}

func TestTruncateAllTables(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	testDB := CreateTestControlDB(t)

	// Insert test data
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	// Verify data exists
	var count int
	err := testDB.DB.Get(&count, "SELECT COUNT(*) FROM tenants")
	if err != nil {
		t.Fatalf("Failed to count tenants: %v", err)
	}

	if count != 1 {
		t.Errorf("Expected 1 tenant before truncate, got %d", count)
	}

	// Truncate all tables
	TruncateAllTables(t, testDB.DB)

	// Verify data is gone
	err = testDB.DB.Get(&count, "SELECT COUNT(*) FROM tenants")
	if err != nil {
		t.Fatalf("Failed to count tenants after truncate: %v", err)
	}

	if count != 0 {
		t.Errorf("Expected 0 tenants after truncate, got %d", count)
	}
}

func TestCreateTestDatabaseManager(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping database test in short mode")
	}

	manager, testControlDB := CreateTestDatabaseManager(t)

	if manager == nil {
		t.Fatal("Expected manager to be initialized")
	}

	if testControlDB == nil {
		t.Fatal("Expected testControlDB to be initialized")
	}

	// Verify manager has control DB
	controlDB := manager.GetControlDB()
	if controlDB == nil {
		t.Fatal("Expected control DB from manager")
	}

	// Verify health check works
	err := manager.HealthCheck()
	if err != nil {
		t.Fatalf("Health check failed: %v", err)
	}
}
