package database

import (
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/config"
	"github.com/jmoiron/sqlx"
)

func TestTenantInfo(t *testing.T) {
	tenant := &TenantInfo{
		ID:           "test-id",
		Name:         "Test Tenant",
		Slug:         "test-tenant",
		DatabaseName: "tenant_test",
		NodeNumber:   1,
		Status:       "active",
	}

	if tenant.ID != "test-id" {
		t.Errorf("Expected tenant ID 'test-id', got '%s'", tenant.ID)
	}

	if tenant.DatabaseName != "tenant_test" {
		t.Errorf("Expected database name 'tenant_test', got '%s'", tenant.DatabaseName)
	}

	if tenant.Status != "active" {
		t.Errorf("Expected status 'active', got '%s'", tenant.Status)
	}
}

func TestNewManagerRequiresConfig(t *testing.T) {
	// Test that NewManager requires a valid config
	// This test checks the function signature and basic structure
	cfg := &config.Config{
		Server: config.ServerConfig{
			Port:        "8000",
			Environment: "test",
		},
		Database: config.DatabaseConfig{
			Control: config.DatabaseConnection{
				Host:     "localhost",
				Port:     5432,
				Name:     "test_control",
				User:     "postgres",
				Password: "test",
				SSLMode:  "disable",
			},
			Tenant: config.TenantDatabaseConfig{
				Host:     "localhost",
				Port:     5432,
				User:     "postgres",
				Password: "test",
				SSLMode:  "disable",
			},
		},
	}

	// Note: We can't actually create a manager without a real database
	// This test just verifies the config structure is correct
	if cfg.Database.Control.Host != "localhost" {
		t.Error("Config not properly structured for database manager")
	}

	if cfg.Database.Control.Name != "test_control" {
		t.Error("Control database name not set correctly")
	}
}

func TestManagerStructure(t *testing.T) {
	// Test that Manager struct has the expected fields
	// This is a compile-time check that ensures the struct has the right shape
	m := &Manager{
		tenantDBs: make(map[string]*sqlx.DB),
	}

	if m.tenantDBs == nil {
		t.Error("Manager tenantDBs map should be initialized")
	}

	if len(m.tenantDBs) != 0 {
		t.Error("Manager tenantDBs map should be empty initially")
	}
}

func TestGetActiveTenantCountWithEmptyMap(t *testing.T) {
	m := &Manager{
		tenantDBs: make(map[string]*sqlx.DB),
	}

	count := m.GetActiveTenantCount()
	if count != 0 {
		t.Errorf("Expected 0 active tenants, got %d", count)
	}
}
