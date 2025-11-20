package utils

import (
	"fmt"
	"log"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// Context keys (should match middleware/tenant.go)
const (
	TenantIDKey     = "tenant_id"
	TenantSlugKey   = "tenant_slug"
	TenantNameKey   = "tenant_name"
	TenantDBNameKey = "tenant_db_name"
)

// GetTenantID extracts the tenant ID from Fiber context
// Returns empty string if not found
func GetTenantID(c *fiber.Ctx) string {
	tenantID := c.Locals(TenantIDKey)
	if tenantID == nil {
		return ""
	}

	if tid, ok := tenantID.(string); ok {
		return tid
	}

	return ""
}

// GetTenantUUID extracts and parses the tenant ID from Fiber context as UUID
// Returns uuid.Nil and error if not found or invalid
func GetTenantUUID(c *fiber.Ctx) (uuid.UUID, error) {
	tenantIDStr := GetTenantID(c)
	if tenantIDStr == "" {
		return uuid.Nil, fmt.Errorf("tenant ID not found in context")
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid tenant ID format: %w", err)
	}

	return tenantID, nil
}

// GetTenantSlug extracts the tenant slug from Fiber context
func GetTenantSlug(c *fiber.Ctx) string {
	slug := c.Locals(TenantSlugKey)
	if slug == nil {
		return ""
	}

	if s, ok := slug.(string); ok {
		return s
	}

	return ""
}

// GetTenantName extracts the tenant name from Fiber context
func GetTenantName(c *fiber.Ctx) string {
	name := c.Locals(TenantNameKey)
	if name == nil {
		return ""
	}

	if n, ok := name.(string); ok {
		return n
	}

	return ""
}

// GetTenantDBName extracts the tenant database name from Fiber context
func GetTenantDBName(c *fiber.Ctx) string {
	dbName := c.Locals(TenantDBNameKey)
	if dbName == nil {
		return ""
	}

	if dn, ok := dbName.(string); ok {
		return dn
	}

	return ""
}

// GetTenantDB retrieves the tenant database connection from the database manager
// Returns an error if tenant ID is not found in context or connection fails
func GetTenantDB(c *fiber.Ctx) (*sqlx.DB, error) {
	tenantID := GetTenantID(c)
	if tenantID == "" {
		return nil, fmt.Errorf("tenant ID not found in context")
	}

	// Get database manager from app context
	dbManager := database.GetInstance()
	if dbManager == nil {
		return nil, fmt.Errorf("database manager not initialized")
	}

	// Get tenant connection
	db, err := dbManager.GetTenantConnection(tenantID)
	if err != nil {
		log.Printf("❌ Failed to get tenant DB for %s: %v", tenantID, err)
		return nil, fmt.Errorf("failed to connect to tenant database: %w", err)
	}

	return db, nil
}

// RequireTenantDB is a helper that gets the tenant DB or returns an error response
// Use this in handlers to avoid repetitive error handling
func RequireTenantDB(c *fiber.Ctx) (*sqlx.DB, error) {
	db, err := GetTenantDB(c)
	if err != nil {
		return nil, c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database Error",
			"message": "Failed to access tenant database",
		})
	}
	return db, nil
}

// ValidateTenantAccess checks if a user has access to a specific tenant
// This queries the control database to verify the user-tenant relationship
func ValidateTenantAccess(userID, tenantID string) bool {
	if userID == "" || tenantID == "" {
		return false
	}

	dbManager := database.GetInstance()
	if dbManager == nil {
		log.Printf("❌ Database manager not initialized for tenant access validation")
		return false
	}

	controlDB := dbManager.GetControlDB()

	// Query to check if user belongs to tenant
	query := `
		SELECT EXISTS(
			SELECT 1 FROM users
			WHERE id = $1 AND tenant_id = $2
		) AS has_access
	`

	var hasAccess bool
	err := controlDB.Get(&hasAccess, query, userID, tenantID)
	if err != nil {
		log.Printf("❌ Error validating tenant access for user %s: %v", userID, err)
		return false
	}

	return hasAccess
}

// ValidateTenantAccessFromContext validates tenant access using context values
func ValidateTenantAccessFromContext(c *fiber.Ctx, userID string) bool {
	tenantID := GetTenantID(c)
	if tenantID == "" {
		return false
	}

	return ValidateTenantAccess(userID, tenantID)
}

// EnsureTenantContext checks if tenant context exists and returns error if not
// Use this at the beginning of handlers that require tenant context
func EnsureTenantContext(c *fiber.Ctx) error {
	tenantID := GetTenantID(c)
	if tenantID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Missing Tenant Context",
			"message": "This endpoint requires tenant identification",
		})
	}
	return nil
}

// GetTenantInfo returns all tenant information from context as a map
func GetTenantInfo(c *fiber.Ctx) map[string]string {
	return map[string]string{
		"id":            GetTenantID(c),
		"slug":          GetTenantSlug(c),
		"name":          GetTenantName(c),
		"database_name": GetTenantDBName(c),
	}
}

// IsTenantActive checks if a tenant is active in the database
func IsTenantActive(tenantID string) (bool, error) {
	dbManager := database.GetInstance()
	if dbManager == nil {
		return false, fmt.Errorf("database manager not initialized")
	}

	controlDB := dbManager.GetControlDB()

	query := `
		SELECT status FROM tenants WHERE id = $1
	`

	var status string
	err := controlDB.Get(&status, query, tenantID)
	if err != nil {
		return false, err
	}

	return status == "active", nil
}

// GetUserTenants returns all tenants that a user has access to
func GetUserTenants(userID string) ([]database.TenantInfo, error) {
	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}

	dbManager := database.GetInstance()
	if dbManager == nil {
		return nil, fmt.Errorf("database manager not initialized")
	}

	controlDB := dbManager.GetControlDB()

	query := `
		SELECT t.id, t.name, t.slug, t.database_name, t.node_number, t.status
		FROM tenants t
		INNER JOIN users u ON u.tenant_id = t.id
		WHERE u.id = $1 AND t.status = 'active'
		ORDER BY t.name
	`

	var tenants []database.TenantInfo
	err := controlDB.Select(&tenants, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user tenants: %w", err)
	}

	return tenants, nil
}

// SwitchTenantContext updates the tenant context for the current request
// Useful for admin users who need to switch between tenants
func SwitchTenantContext(c *fiber.Ctx, newTenantID string) error {
	if newTenantID == "" {
		return fmt.Errorf("new tenant ID is required")
	}

	dbManager := database.GetInstance()
	if dbManager == nil {
		return fmt.Errorf("database manager not initialized")
	}

	// Fetch new tenant info
	controlDB := dbManager.GetControlDB()
	var tenantInfo database.TenantInfo
	query := `
		SELECT id, name, slug, database_name, node_number, status
		FROM tenants
		WHERE id = $1 AND status = 'active'
	`

	err := controlDB.Get(&tenantInfo, query, newTenantID)
	if err != nil {
		return fmt.Errorf("tenant not found or inactive: %w", err)
	}

	// Update context
	c.Locals(TenantIDKey, tenantInfo.ID)
	c.Locals(TenantSlugKey, tenantInfo.Slug)
	c.Locals(TenantNameKey, tenantInfo.Name)
	c.Locals(TenantDBNameKey, tenantInfo.DatabaseName)

	return nil
}

// TenantExists checks if a tenant exists by ID or slug
func TenantExists(identifier string) (bool, error) {
	if identifier == "" {
		return false, fmt.Errorf("identifier is required")
	}

	dbManager := database.GetInstance()
	if dbManager == nil {
		return false, fmt.Errorf("database manager not initialized")
	}

	controlDB := dbManager.GetControlDB()

	query := `
		SELECT EXISTS(
			SELECT 1 FROM tenants
			WHERE (id = $1 OR slug = $1) AND status = 'active'
		) AS exists
	`

	var exists bool
	err := controlDB.Get(&exists, query, identifier)
	if err != nil {
		return false, fmt.Errorf("failed to check tenant existence: %w", err)
	}

	return exists, nil
}
