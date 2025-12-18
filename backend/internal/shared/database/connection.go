package database

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/config"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // PostgreSQL driver
)

// Manager gestiona las conexiones a las bases de datos
type Manager struct {
	controlDB      *sqlx.DB
	tenantDBs      map[string]*sqlx.DB
	tenantDBsMutex sync.RWMutex
	config         *config.Config
}

var (
	instance *Manager
	once     sync.Once
)

// NewManager crea una nueva instancia del manager de base de datos
func NewManager(cfg *config.Config) (*Manager, error) {
	manager := &Manager{
		tenantDBs: make(map[string]*sqlx.DB),
		config:    cfg,
	}

	// Conectar a Control DB
	if err := manager.connectControlDB(); err != nil {
		return nil, fmt.Errorf("failed to connect to control database: %w", err)
	}

	log.Println("✅ Database Manager initialized successfully")
	return manager, nil
}

// GetInstance retorna la instancia singleton del manager
func GetInstance() *Manager {
	if instance == nil {
		log.Fatal("❌ Database Manager not initialized. Call NewManager first.")
	}
	return instance
}

// InitializeManager inicializa el singleton del manager
func InitializeManager(cfg *config.Config) error {
	var err error
	once.Do(func() {
		instance, err = NewManager(cfg)
	})
	return err
}

// connectControlDB establece conexión con la base de datos de control
func (m *Manager) connectControlDB() error {
	dsn := m.config.Database.Control.GetDSN()

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	// Configurar pool de conexiones
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(1 * time.Minute)

	// Verificar conexión
	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	m.controlDB = db
	log.Printf("✅ Connected to Control DB: %s", m.config.Database.Control.Name)
	return nil
}

// GetControlDB retorna la conexión a la base de datos de control
func (m *Manager) GetControlDB() *sqlx.DB {
	return m.controlDB
}

// GetTenantConnection obtiene o crea una conexión a la base de datos de un tenant
func (m *Manager) GetTenantConnection(tenantID string) (*sqlx.DB, error) {
	// FIX RACE CONDITION: Usar Lock completo durante verificación y posible recreación
	m.tenantDBsMutex.Lock()
	defer m.tenantDBsMutex.Unlock()

	// Verificar si existe conexión
	db, exists := m.tenantDBs[tenantID]

	if exists && db != nil {
		// Verificar que la conexión siga activa (pero mantener lock durante todo el proceso)
		if err := db.Ping(); err == nil {
			return db, nil
		}
		// Si el ping falla, cerrar inmediatamente ANTES de liberar el lock
		log.Printf("⚠️  Stale connection detected for tenant %s, reconnecting...", tenantID)
		if err := db.Close(); err != nil {
			log.Printf("⚠️  Error closing stale connection %s: %v", tenantID, err)
		}
		delete(m.tenantDBs, tenantID)
		log.Printf("🔒 Closed stale connection to tenant: %s", tenantID)
	}

	// Obtener información del tenant desde Control DB
	tenantInfo, err := m.getTenantInfo(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant info: %w", err)
	}

	// Crear nueva conexión (ahora directamente sin llamar a createTenantConnection)
	dsn := m.config.Database.Tenant.GetTenantDSN(tenantInfo.DatabaseName)

	newDB, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to tenant database: %w", err)
	}

	// Configurar pool de conexiones (AUMENTAR timeouts para evitar reconexiones frecuentes)
	newDB.SetMaxOpenConns(15)
	newDB.SetMaxIdleConns(8)
	newDB.SetConnMaxLifetime(10 * time.Minute) // Aumentado de 3min a 10min
	newDB.SetConnMaxIdleTime(5 * time.Minute)  // Aumentado de 30s a 5min

	// Verificar conexión
	if err := newDB.Ping(); err != nil {
		newDB.Close()
		return nil, fmt.Errorf("failed to ping tenant database: %w", err)
	}

	// Guardar en caché
	m.tenantDBs[tenantID] = newDB
	log.Printf("✅ Connected to Tenant DB: %s (tenant: %s)", tenantInfo.DatabaseName, tenantID)

	return newDB, nil
}

// getTenantInfo obtiene información del tenant desde Control DB
func (m *Manager) getTenantInfo(tenantID string) (*TenantInfo, error) {
	var tenant TenantInfo
	query := `
		SELECT id, name, slug, database_name, node_number, status
		FROM tenants
		WHERE id = $1 AND status = 'active'
	`

	err := m.controlDB.Get(&tenant, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("tenant not found or inactive: %w", err)
	}

	return &tenant, nil
}

// closeTenantConnection cierra la conexión a un tenant específico
func (m *Manager) closeTenantConnection(tenantID string) {
	m.tenantDBsMutex.Lock()
	defer m.tenantDBsMutex.Unlock()

	if db, exists := m.tenantDBs[tenantID]; exists {
		if err := db.Close(); err != nil {
			log.Printf("⚠️  Error closing tenant connection %s: %v", tenantID, err)
		}
		delete(m.tenantDBs, tenantID)
		log.Printf("🔒 Closed connection to tenant: %s", tenantID)
	}
}

// CreateTenantDatabase crea una nueva base de datos para un tenant
func (m *Manager) CreateTenantDatabase(dbName string) error {
	// Crear base de datos usando Control DB
	// Nota: CREATE DATABASE no puede ejecutarse dentro de una transacción
	query := fmt.Sprintf("CREATE DATABASE %s", dbName)
	_, err := m.controlDB.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create tenant database: %w", err)
	}

	log.Printf("✅ Created tenant database: %s", dbName)
	return nil
}

// DropTenantDatabase elimina la base de datos de un tenant
func (m *Manager) DropTenantDatabase(tenantID, dbName string) error {
	// Primero cerrar cualquier conexión existente
	m.closeTenantConnection(tenantID)

	// Forzar desconexión de otras sesiones
	query := fmt.Sprintf(`
		SELECT pg_terminate_backend(pid)
		FROM pg_stat_activity
		WHERE datname = '%s' AND pid <> pg_backend_pid()
	`, dbName)
	_, _ = m.controlDB.Exec(query) // Ignorar errores si no hay conexiones

	// Eliminar base de datos
	dropQuery := fmt.Sprintf("DROP DATABASE IF EXISTS %s", dbName)
	_, err := m.controlDB.Exec(dropQuery)
	if err != nil {
		return fmt.Errorf("failed to drop tenant database: %w", err)
	}

	log.Printf("🗑️  Dropped tenant database: %s", dbName)
	return nil
}

// GetActiveTenantCount retorna el número de conexiones activas a tenants
func (m *Manager) GetActiveTenantCount() int {
	m.tenantDBsMutex.RLock()
	defer m.tenantDBsMutex.RUnlock()
	return len(m.tenantDBs)
}

// CloseAll cierra todas las conexiones (Control + Tenants)
func (m *Manager) CloseAll() error {
	var errors []error

	// Cerrar todas las conexiones de tenants
	m.tenantDBsMutex.Lock()
	for tenantID, db := range m.tenantDBs {
		if err := db.Close(); err != nil {
			errors = append(errors, fmt.Errorf("error closing tenant %s: %w", tenantID, err))
		}
	}
	m.tenantDBs = make(map[string]*sqlx.DB)
	m.tenantDBsMutex.Unlock()

	// Cerrar Control DB
	if m.controlDB != nil {
		if err := m.controlDB.Close(); err != nil {
			errors = append(errors, fmt.Errorf("error closing control DB: %w", err))
		}
	}

	if len(errors) > 0 {
		log.Printf("⚠️  Errors during database shutdown: %v", errors)
		return fmt.Errorf("failed to close some database connections: %d errors", len(errors))
	}

	log.Println("🔒 All database connections closed")
	return nil
}

// HealthCheck verifica el estado de las conexiones
func (m *Manager) HealthCheck() error {
	// Verificar Control DB
	if err := m.controlDB.Ping(); err != nil {
		return fmt.Errorf("control database unhealthy: %w", err)
	}

	// Verificar conexiones de tenant (sample check)
	m.tenantDBsMutex.RLock()
	tenantCount := len(m.tenantDBs)
	m.tenantDBsMutex.RUnlock()

	log.Printf("💚 Health check passed - Control DB: OK, Active Tenants: %d", tenantCount)
	return nil
}

// TenantInfo representa la información de un tenant
type TenantInfo struct {
	ID           string `db:"id"`
	Name         string `db:"name"`
	Slug         string `db:"slug"`
	DatabaseName string `db:"database_name"`
	NodeNumber   int    `db:"node_number"`
	Status       string `db:"status"`
}
