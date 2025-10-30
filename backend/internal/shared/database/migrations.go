package database

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// MigrationRunner gestiona la ejecución de migraciones
type MigrationRunner struct {
	manager *Manager
}

// NewMigrationRunner crea una nueva instancia del runner de migraciones
func NewMigrationRunner(manager *Manager) *MigrationRunner {
	return &MigrationRunner{
		manager: manager,
	}
}

// RunControlMigrations ejecuta las migraciones para la base de datos de control
func (mr *MigrationRunner) RunControlMigrations(migrationsPath string) error {
	log.Println("🔄 Running Control DB migrations...")

	db := mr.manager.GetControlDB().DB
	if err := mr.runMigrations(db, "control_db", migrationsPath); err != nil {
		return fmt.Errorf("failed to run control migrations: %w", err)
	}

	log.Println("✅ Control DB migrations completed successfully")
	return nil
}

// RunTenantMigrations ejecuta las migraciones para una base de datos de tenant
func (mr *MigrationRunner) RunTenantMigrations(tenantID, migrationsPath string) error {
	log.Printf("🔄 Running Tenant DB migrations for tenant: %s", tenantID)

	// Obtener conexión al tenant
	tenantDB, err := mr.manager.GetTenantConnection(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant connection: %w", err)
	}

	if err := mr.runMigrations(tenantDB.DB, fmt.Sprintf("tenant_%s", tenantID), migrationsPath); err != nil {
		return fmt.Errorf("failed to run tenant migrations: %w", err)
	}

	log.Printf("✅ Tenant DB migrations completed for tenant: %s", tenantID)
	return nil
}

// runMigrations ejecuta las migraciones en una base de datos específica
func (mr *MigrationRunner) runMigrations(db *sql.DB, dbName, migrationsPath string) error {
	// Crear driver de PostgreSQL
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	// Crear instancia de migrate
	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", migrationsPath),
		dbName,
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	// Ejecutar migraciones
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Si no hay cambios, es OK
	if err == migrate.ErrNoChange {
		log.Printf("ℹ️  No new migrations to apply for %s", dbName)
	}

	return nil
}

// RollbackControlMigrations revierte la última migración de Control DB
func (mr *MigrationRunner) RollbackControlMigrations(migrationsPath string, steps int) error {
	log.Printf("⚠️  Rolling back Control DB migrations (%d steps)...", steps)

	db := mr.manager.GetControlDB().DB
	if err := mr.rollbackMigrations(db, "control_db", migrationsPath, steps); err != nil {
		return fmt.Errorf("failed to rollback control migrations: %w", err)
	}

	log.Println("✅ Control DB rollback completed")
	return nil
}

// RollbackTenantMigrations revierte la última migración de Tenant DB
func (mr *MigrationRunner) RollbackTenantMigrations(tenantID, migrationsPath string, steps int) error {
	log.Printf("⚠️  Rolling back Tenant DB migrations for tenant %s (%d steps)...", tenantID, steps)

	tenantDB, err := mr.manager.GetTenantConnection(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant connection: %w", err)
	}

	if err := mr.rollbackMigrations(tenantDB.DB, fmt.Sprintf("tenant_%s", tenantID), migrationsPath, steps); err != nil {
		return fmt.Errorf("failed to rollback tenant migrations: %w", err)
	}

	log.Printf("✅ Tenant DB rollback completed for tenant: %s", tenantID)
	return nil
}

// rollbackMigrations revierte migraciones
func (mr *MigrationRunner) rollbackMigrations(db *sql.DB, dbName, migrationsPath string, steps int) error {
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", migrationsPath),
		dbName,
		driver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	if err := m.Steps(-steps); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to rollback migrations: %w", err)
	}

	return nil
}

// GetControlMigrationVersion obtiene la versión actual de migraciones de Control DB
func (mr *MigrationRunner) GetControlMigrationVersion(migrationsPath string) (uint, bool, error) {
	db := mr.manager.GetControlDB().DB
	return mr.getMigrationVersion(db, "control_db", migrationsPath)
}

// GetTenantMigrationVersion obtiene la versión actual de migraciones de Tenant DB
func (mr *MigrationRunner) GetTenantMigrationVersion(tenantID, migrationsPath string) (uint, bool, error) {
	tenantDB, err := mr.manager.GetTenantConnection(tenantID)
	if err != nil {
		return 0, false, fmt.Errorf("failed to get tenant connection: %w", err)
	}

	return mr.getMigrationVersion(tenantDB.DB, fmt.Sprintf("tenant_%s", tenantID), migrationsPath)
}

// getMigrationVersion obtiene la versión actual de migraciones
func (mr *MigrationRunner) getMigrationVersion(db *sql.DB, dbName, migrationsPath string) (uint, bool, error) {
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return 0, false, fmt.Errorf("failed to create migration driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		fmt.Sprintf("file://%s", migrationsPath),
		dbName,
		driver,
	)
	if err != nil {
		return 0, false, fmt.Errorf("failed to create migrate instance: %w", err)
	}

	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return 0, false, fmt.Errorf("failed to get migration version: %w", err)
	}

	// Si err == migrate.ErrNilVersion, significa que no hay migraciones aplicadas
	if err == migrate.ErrNilVersion {
		return 0, false, nil
	}

	return version, dirty, nil
}

// CreateTenantWithMigrations crea una nueva base de datos de tenant y ejecuta migraciones
func (mr *MigrationRunner) CreateTenantWithMigrations(tenantID, dbName, migrationsPath string) error {
	log.Printf("🔄 Creating tenant database and running migrations for: %s", tenantID)

	// Crear base de datos
	if err := mr.manager.CreateTenantDatabase(dbName); err != nil {
		return fmt.Errorf("failed to create tenant database: %w", err)
	}

	// Ejecutar migraciones
	if err := mr.RunTenantMigrations(tenantID, migrationsPath); err != nil {
		// Si las migraciones fallan, intentar limpiar la base de datos
		log.Printf("⚠️  Migrations failed, attempting to clean up database: %s", dbName)
		if cleanupErr := mr.manager.DropTenantDatabase(tenantID, dbName); cleanupErr != nil {
			log.Printf("❌ Failed to cleanup database after migration error: %v", cleanupErr)
		}
		return fmt.Errorf("failed to run tenant migrations: %w", err)
	}

	log.Printf("✅ Tenant database created and migrated successfully: %s", tenantID)
	return nil
}
