package config

import (
	"os"
	"testing"
	"time"
)

func TestLoadServerConfig(t *testing.T) {
	// Test default values
	os.Clearenv()
	cfg := loadServerConfig()

	if cfg.Port != "8000" {
		t.Errorf("Expected default port 8000, got %s", cfg.Port)
	}

	if cfg.Environment != "development" {
		t.Errorf("Expected default environment development, got %s", cfg.Environment)
	}

	// Test custom values
	os.Setenv("PORT", "3000")
	os.Setenv("ENV", "production")
	os.Setenv("CORS_ALLOWED_ORIGINS", "http://example.com,http://test.com")

	cfg = loadServerConfig()

	if cfg.Port != "3000" {
		t.Errorf("Expected port 3000, got %s", cfg.Port)
	}

	if cfg.Environment != "production" {
		t.Errorf("Expected environment production, got %s", cfg.Environment)
	}

	if len(cfg.CORSOrigins) != 2 {
		t.Errorf("Expected 2 CORS origins, got %d", len(cfg.CORSOrigins))
	}

	os.Clearenv()
}

func TestLoadDatabaseConfig(t *testing.T) {
	// Test default values
	os.Clearenv()
	cfg := loadDatabaseConfig()

	if cfg.Control.Host != "localhost" {
		t.Errorf("Expected default control DB host localhost, got %s", cfg.Control.Host)
	}

	if cfg.Control.Port != 5432 {
		t.Errorf("Expected default control DB port 5432, got %d", cfg.Control.Port)
	}

	// Test custom values
	os.Setenv("CONTROL_DB_HOST", "db.example.com")
	os.Setenv("CONTROL_DB_PORT", "5433")
	os.Setenv("CONTROL_DB_NAME", "test_control")
	os.Setenv("CONTROL_DB_USER", "testuser")
	os.Setenv("CONTROL_DB_PASSWORD", "testpass")

	cfg = loadDatabaseConfig()

	if cfg.Control.Host != "db.example.com" {
		t.Errorf("Expected control DB host db.example.com, got %s", cfg.Control.Host)
	}

	if cfg.Control.Port != 5433 {
		t.Errorf("Expected control DB port 5433, got %d", cfg.Control.Port)
	}

	if cfg.Control.Name != "test_control" {
		t.Errorf("Expected control DB name test_control, got %s", cfg.Control.Name)
	}

	os.Clearenv()
}

func TestLoadJWTConfig(t *testing.T) {
	// Test default values
	os.Clearenv()
	cfg := loadJWTConfig()

	if cfg.Expiration != 24*time.Hour {
		t.Errorf("Expected default JWT expiration 24h, got %v", cfg.Expiration)
	}

	if cfg.RefreshExpiration != 168*time.Hour {
		t.Errorf("Expected default JWT refresh expiration 168h, got %v", cfg.RefreshExpiration)
	}

	// Test custom values
	os.Setenv("JWT_SECRET", "my-secret-key")
	os.Setenv("JWT_EXPIRATION", "1h")
	os.Setenv("JWT_REFRESH_EXPIRATION", "72h")

	cfg = loadJWTConfig()

	if cfg.Secret != "my-secret-key" {
		t.Errorf("Expected JWT secret my-secret-key, got %s", cfg.Secret)
	}

	if cfg.Expiration != 1*time.Hour {
		t.Errorf("Expected JWT expiration 1h, got %v", cfg.Expiration)
	}

	if cfg.RefreshExpiration != 72*time.Hour {
		t.Errorf("Expected JWT refresh expiration 72h, got %v", cfg.RefreshExpiration)
	}

	os.Clearenv()
}

func TestConfigValidate(t *testing.T) {
	tests := []struct {
		name        string
		config      *Config
		expectError bool
		errorMsg    string
	}{
		{
			name: "Valid development config",
			config: &Config{
				Server: ServerConfig{
					Port:        "8000",
					Environment: "development",
				},
				Database: DatabaseConfig{
					Control: DatabaseConnection{
						Host: "localhost",
						Name: "test_db",
						User: "postgres",
					},
					Tenant: TenantDatabaseConfig{
						Host: "localhost",
						User: "postgres",
					},
				},
			},
			expectError: false,
		},
		{
			name: "Missing port",
			config: &Config{
				Server: ServerConfig{
					Port: "",
				},
			},
			expectError: true,
			errorMsg:    "PORT is required",
		},
		{
			name: "Missing control DB host",
			config: &Config{
				Server: ServerConfig{
					Port: "8000",
				},
				Database: DatabaseConfig{
					Control: DatabaseConnection{
						Host: "",
					},
				},
			},
			expectError: true,
			errorMsg:    "CONTROL_DB_HOST is required",
		},
		{
			name: "Missing control DB name",
			config: &Config{
				Server: ServerConfig{
					Port: "8000",
				},
				Database: DatabaseConfig{
					Control: DatabaseConnection{
						Host: "localhost",
						Name: "",
					},
				},
			},
			expectError: true,
			errorMsg:    "CONTROL_DB_NAME is required",
		},
		{
			name: "Production without JWT secret",
			config: &Config{
				Server: ServerConfig{
					Port:        "8000",
					Environment: "production",
				},
				Database: DatabaseConfig{
					Control: DatabaseConnection{
						Host: "localhost",
						Name: "test_db",
						User: "postgres",
					},
					Tenant: TenantDatabaseConfig{
						Host: "localhost",
						User: "postgres",
					},
				},
				JWT: JWTConfig{
					Secret: "",
				},
			},
			expectError: true,
			errorMsg:    "JWT_SECRET is required in production",
		},
		{
			name: "Production with short JWT secret",
			config: &Config{
				Server: ServerConfig{
					Port:        "8000",
					Environment: "production",
				},
				Database: DatabaseConfig{
					Control: DatabaseConnection{
						Host: "localhost",
						Name: "test_db",
						User: "postgres",
					},
					Tenant: TenantDatabaseConfig{
						Host: "localhost",
						User: "postgres",
					},
				},
				JWT: JWTConfig{
					Secret: "short",
				},
			},
			expectError: true,
			errorMsg:    "JWT_SECRET must be at least 32 characters in production",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if err.Error() != tt.errorMsg {
					t.Errorf("Expected error message '%s', got '%s'", tt.errorMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

func TestDatabaseConnectionGetDSN(t *testing.T) {
	conn := DatabaseConnection{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "secret",
		Name:     "test_db",
		SSLMode:  "disable",
	}

	expected := "host=localhost port=5432 user=postgres password=secret dbname=test_db sslmode=disable"
	dsn := conn.GetDSN()

	if dsn != expected {
		t.Errorf("Expected DSN '%s', got '%s'", expected, dsn)
	}
}

func TestTenantDatabaseConfigGetTenantDSN(t *testing.T) {
	tenant := TenantDatabaseConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "secret",
		SSLMode:  "disable",
	}

	dbName := "tenant_123"
	expected := "host=localhost port=5432 user=postgres password=secret dbname=tenant_123 sslmode=disable"
	dsn := tenant.GetTenantDSN(dbName)

	if dsn != expected {
		t.Errorf("Expected DSN '%s', got '%s'", expected, dsn)
	}
}

func TestConfigEnvironmentHelpers(t *testing.T) {
	// Test IsDevelopment
	cfg := &Config{
		Server: ServerConfig{
			Environment: "development",
		},
	}

	if !cfg.IsDevelopment() {
		t.Error("Expected IsDevelopment() to return true for development environment")
	}

	if cfg.IsProduction() {
		t.Error("Expected IsProduction() to return false for development environment")
	}

	// Test IsProduction
	cfg.Server.Environment = "production"

	if cfg.IsDevelopment() {
		t.Error("Expected IsDevelopment() to return false for production environment")
	}

	if !cfg.IsProduction() {
		t.Error("Expected IsProduction() to return true for production environment")
	}
}

func TestGetEnv(t *testing.T) {
	os.Clearenv()

	// Test default value
	value := getEnv("NONEXISTENT_VAR", "default")
	if value != "default" {
		t.Errorf("Expected default value 'default', got '%s'", value)
	}

	// Test existing value
	os.Setenv("TEST_VAR", "test_value")
	value = getEnv("TEST_VAR", "default")
	if value != "test_value" {
		t.Errorf("Expected value 'test_value', got '%s'", value)
	}

	os.Clearenv()
}

func TestGetEnvAsInt(t *testing.T) {
	os.Clearenv()

	// Test default value
	value := getEnvAsInt("NONEXISTENT_VAR", 42)
	if value != 42 {
		t.Errorf("Expected default value 42, got %d", value)
	}

	// Test valid integer
	os.Setenv("TEST_INT", "100")
	value = getEnvAsInt("TEST_INT", 42)
	if value != 100 {
		t.Errorf("Expected value 100, got %d", value)
	}

	// Test invalid integer (should return default)
	os.Setenv("TEST_INT", "invalid")
	value = getEnvAsInt("TEST_INT", 42)
	if value != 42 {
		t.Errorf("Expected default value 42 for invalid integer, got %d", value)
	}

	os.Clearenv()
}

func TestGetEnvAsBool(t *testing.T) {
	os.Clearenv()

	// Test default value
	value := getEnvAsBool("NONEXISTENT_VAR", true)
	if value != true {
		t.Errorf("Expected default value true, got %v", value)
	}

	// Test valid boolean
	os.Setenv("TEST_BOOL", "false")
	value = getEnvAsBool("TEST_BOOL", true)
	if value != false {
		t.Errorf("Expected value false, got %v", value)
	}

	// Test invalid boolean (should return default)
	os.Setenv("TEST_BOOL", "invalid")
	value = getEnvAsBool("TEST_BOOL", true)
	if value != true {
		t.Errorf("Expected default value true for invalid boolean, got %v", value)
	}

	os.Clearenv()
}
