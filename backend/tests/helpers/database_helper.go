package helpers

import (
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/config"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// TestDatabase represents a test database instance
type TestDatabase struct {
	DB         *sqlx.DB
	Name       string
	IsControl  bool
	IsTenant   bool
	connString string
}

// CreateTestControlDB creates a temporary control database for testing
func CreateTestControlDB(t *testing.T) *TestDatabase {
	t.Helper()

	// Generate unique database name
	dbName := fmt.Sprintf("test_control_%d", time.Now().UnixNano())

	// Create database
	testDB := createTestDatabase(t, dbName, true, false)

	// Run control DB migrations
	if err := runControlMigrations(testDB.DB); err != nil {
		testDB.Cleanup(t)
		t.Fatalf("Failed to run control migrations: %v", err)
	}

	// Register cleanup
	t.Cleanup(func() {
		testDB.Cleanup(t)
	})

	return testDB
}

// CreateTestTenantDB creates a temporary tenant database for testing
func CreateTestTenantDB(t *testing.T, tenantSlug string) *TestDatabase {
	t.Helper()

	// Generate unique database name
	dbName := fmt.Sprintf("test_tenant_%s_%d", tenantSlug, time.Now().UnixNano())

	// Create database
	testDB := createTestDatabase(t, dbName, false, true)

	// Run tenant DB migrations
	if err := runTenantMigrations(testDB.DB); err != nil {
		testDB.Cleanup(t)
		t.Fatalf("Failed to run tenant migrations: %v", err)
	}

	// Register cleanup
	t.Cleanup(func() {
		testDB.Cleanup(t)
	})

	return testDB
}

// createTestDatabase creates a new test database
func createTestDatabase(t *testing.T, dbName string, isControl, isTenant bool) *TestDatabase {
	t.Helper()

	// Load config or use test defaults
	cfg := getTestConfig()

	// Connect to postgres database to create new database
	postgresConnString := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=postgres sslmode=disable",
		cfg.Database.Control.Host,
		cfg.Database.Control.Port,
		cfg.Database.Control.User,
		cfg.Database.Control.Password,
	)

	postgresDB, err := sqlx.Connect("postgres", postgresConnString)
	if err != nil {
		t.Fatalf("Failed to connect to postgres: %v", err)
	}
	defer postgresDB.Close()

	// Create test database
	_, err = postgresDB.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
	if err != nil {
		t.Fatalf("Failed to create test database %s: %v", dbName, err)
	}

	// Connect to the newly created test database
	testConnString := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Control.Host,
		cfg.Database.Control.Port,
		cfg.Database.Control.User,
		cfg.Database.Control.Password,
		dbName,
	)

	testDB, err := sqlx.Connect("postgres", testConnString)
	if err != nil {
		// Try to cleanup the database if connection fails
		postgresDB, _ = sqlx.Connect("postgres", postgresConnString)
		if postgresDB != nil {
			postgresDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", dbName))
			postgresDB.Close()
		}
		t.Fatalf("Failed to connect to test database %s: %v", dbName, err)
	}

	log.Printf("✅ Created test database: %s", dbName)

	return &TestDatabase{
		DB:         testDB,
		Name:       dbName,
		IsControl:  isControl,
		IsTenant:   isTenant,
		connString: testConnString,
	}
}

// Cleanup drops the test database and closes connections
func (td *TestDatabase) Cleanup(t *testing.T) {
	t.Helper()

	if td.DB != nil {
		td.DB.Close()
	}

	// Load config
	cfg := getTestConfig()

	// Connect to postgres to drop database
	postgresConnString := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=postgres sslmode=disable",
		cfg.Database.Control.Host,
		cfg.Database.Control.Port,
		cfg.Database.Control.User,
		cfg.Database.Control.Password,
	)

	postgresDB, err := sqlx.Connect("postgres", postgresConnString)
	if err != nil {
		log.Printf("⚠️  Failed to connect to postgres for cleanup: %v", err)
		return
	}
	defer postgresDB.Close()

	// Terminate existing connections to the database
	_, err = postgresDB.Exec(fmt.Sprintf(`
		SELECT pg_terminate_backend(pg_stat_activity.pid)
		FROM pg_stat_activity
		WHERE pg_stat_activity.datname = '%s'
		AND pid <> pg_backend_pid()
	`, td.Name))
	if err != nil {
		log.Printf("⚠️  Failed to terminate connections: %v", err)
	}

	// Drop database
	_, err = postgresDB.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", td.Name))
	if err != nil {
		log.Printf("⚠️  Failed to drop test database %s: %v", td.Name, err)
	} else {
		log.Printf("🧹 Cleaned up test database: %s", td.Name)
	}
}

// runControlMigrations runs migrations for control database
func runControlMigrations(db *sqlx.DB) error {
	// Create tenants table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS tenants (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			slug VARCHAR(100) UNIQUE NOT NULL,
			database_name VARCHAR(100) UNIQUE NOT NULL,
			node_number INTEGER DEFAULT 1,
			status VARCHAR(20) DEFAULT 'active',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create tenants table: %w", err)
	}

	// Create users table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			full_name VARCHAR(255),
			role VARCHAR(50) DEFAULT 'student',
			is_verified BOOLEAN DEFAULT false,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create users table: %w", err)
	}

	// Create indexes
	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
		CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	`)
	if err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	log.Println("✅ Control DB migrations completed")
	return nil
}

// runTenantMigrations runs migrations for tenant database
func runTenantMigrations(db *sqlx.DB) error {
	// Create courses table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS courses (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title VARCHAR(255) NOT NULL,
			description TEXT,
			instructor_id UUID NOT NULL,
			category VARCHAR(100),
			level VARCHAR(50),
			is_published BOOLEAN DEFAULT false,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create courses table: %w", err)
	}

	// Create modules table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS modules (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
			title VARCHAR(255) NOT NULL,
			description TEXT,
			order_index INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create modules table: %w", err)
	}

	// Create lessons table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS lessons (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
			title VARCHAR(255) NOT NULL,
			content TEXT,
			lesson_type VARCHAR(50) NOT NULL,
			video_url VARCHAR(500),
			duration_minutes INTEGER,
			order_index INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create lessons table: %w", err)
	}

	// Create enrollments table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS enrollments (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL,
			course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
			enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			completed_at TIMESTAMP,
			progress_percentage DECIMAL(5,2) DEFAULT 0.00,
			UNIQUE(user_id, course_id)
		);
	`)
	if err != nil {
		return fmt.Errorf("failed to create enrollments table: %w", err)
	}

	log.Println("✅ Tenant DB migrations completed")
	return nil
}

// getTestConfig returns test configuration
func getTestConfig() *config.Config {
	// Try to load config from environment
	cfg, err := config.LoadConfig()
	if err != nil {
		// Use defaults if config loading fails
		return &config.Config{
			Database: config.DatabaseConfig{
				Control: config.DatabaseConnection{
					Host:     "localhost",
					Port:     5432,
					User:     "postgres",
					Password: "postgres",
					SSLMode:  "disable",
				},
			},
		}
	}
	return cfg
}

// TruncateAllTables truncates all tables in a database (useful for test cleanup)
func TruncateAllTables(t *testing.T, db *sqlx.DB) {
	t.Helper()

	// Get all table names
	rows, err := db.Query(`
		SELECT tablename FROM pg_tables
		WHERE schemaname = 'public'
	`)
	if err != nil {
		t.Fatalf("Failed to get table names: %v", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var table string
		if err := rows.Scan(&table); err != nil {
			t.Fatalf("Failed to scan table name: %v", err)
		}
		tables = append(tables, table)
	}

	// Truncate all tables
	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			t.Logf("⚠️  Failed to truncate table %s: %v", table, err)
		}
	}

	log.Println("🧹 Truncated all tables")
}

// CreateTestDatabaseManager creates a test database manager with test databases
func CreateTestDatabaseManager(t *testing.T) (*database.Manager, *TestDatabase) {
	t.Helper()

	// Create test control DB
	testControlDB := CreateTestControlDB(t)

	// Create a minimal config for the manager
	cfg := &config.Config{
		Database: config.DatabaseConfig{
			Control: config.DatabaseConnection{
				Name:     testControlDB.Name,
				Host:     "localhost",
				Port:     5432,
				User:     "postgres",
				Password: "postgres",
				SSLMode:  "disable",
			},
		},
	}

	// Create database manager
	manager, err := database.NewManager(cfg)
	if err != nil {
		testControlDB.Cleanup(t)
		t.Fatalf("Failed to create database manager: %v", err)
	}

	return manager, testControlDB
}
