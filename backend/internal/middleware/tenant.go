package middleware

import (
	"log"
	"strings"
	"sync"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/gofiber/fiber/v2"
)

// Context keys for storing tenant information
const (
	TenantIDKey     = "tenant_id"
	TenantSlugKey   = "tenant_slug"
	TenantNameKey   = "tenant_name"
	TenantDBNameKey = "tenant_db_name"
)

// TenantCache stores tenant metadata in memory for faster access
type TenantCache struct {
	cache map[string]*CachedTenant
	mutex sync.RWMutex
	ttl   time.Duration
}

// CachedTenant represents cached tenant information
type CachedTenant struct {
	Info      *database.TenantInfo
	CachedAt  time.Time
	ExpiresAt time.Time
}

var (
	tenantCache *TenantCache
	cacheOnce   sync.Once
)

// InitTenantCache initializes the tenant cache
func InitTenantCache(ttl time.Duration) {
	cacheOnce.Do(func() {
		tenantCache = &TenantCache{
			cache: make(map[string]*CachedTenant),
			ttl:   ttl,
		}
		// Start cleanup goroutine
		go tenantCache.cleanupExpired()
	})
}

// Get retrieves a tenant from cache
func (tc *TenantCache) Get(key string) (*database.TenantInfo, bool) {
	tc.mutex.RLock()
	defer tc.mutex.RUnlock()

	cached, exists := tc.cache[key]
	if !exists {
		return nil, false
	}

	// Check if expired
	if time.Now().After(cached.ExpiresAt) {
		return nil, false
	}

	return cached.Info, true
}

// Set stores a tenant in cache
func (tc *TenantCache) Set(key string, info *database.TenantInfo) {
	tc.mutex.Lock()
	defer tc.mutex.Unlock()

	now := time.Now()
	tc.cache[key] = &CachedTenant{
		Info:      info,
		CachedAt:  now,
		ExpiresAt: now.Add(tc.ttl),
	}
}

// Delete removes a tenant from cache
func (tc *TenantCache) Delete(key string) {
	tc.mutex.Lock()
	defer tc.mutex.Unlock()

	delete(tc.cache, key)
}

// cleanupExpired removes expired entries from cache
func (tc *TenantCache) cleanupExpired() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		tc.mutex.Lock()
		now := time.Now()
		for key, cached := range tc.cache {
			if now.After(cached.ExpiresAt) {
				delete(tc.cache, key)
				log.Printf("🧹 Cleaned up expired tenant cache: %s", key)
			}
		}
		tc.mutex.Unlock()
	}
}

// GetCacheSize returns the number of cached tenants
func (tc *TenantCache) GetCacheSize() int {
	tc.mutex.RLock()
	defer tc.mutex.RUnlock()
	return len(tc.cache)
}

// TenantMiddleware extracts tenant information and injects it into the request context
func TenantMiddleware(dbManager *database.Manager) fiber.Handler {
	// Initialize cache if not already done (default 5 minute TTL)
	InitTenantCache(5 * time.Minute)

	return func(c *fiber.Ctx) error {
		startTime := time.Now()

		// Extract tenant identifier from various sources
		tenantID := extractTenantID(c)

		if tenantID == "" {
			log.Printf("⚠️  No tenant ID found in request: %s %s", c.Method(), c.Path())
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":   "Missing Tenant",
				"message": "Tenant identification is required. Please provide X-Tenant-ID header or tenant subdomain.",
			})
		}

		// Try to get tenant info from cache
		tenantInfo, cached := tenantCache.Get(tenantID)
		if cached {
			// Cache hit - inject into context and continue
			injectTenantContext(c, tenantInfo)
			elapsed := time.Since(startTime)
			log.Printf("✅ Tenant identified (cached): %s (%s) - %v", tenantInfo.Slug, tenantID, elapsed)
			return c.Next()
		}

		// Cache miss - fetch from database
		tenantInfo, err := getTenantInfo(dbManager, tenantID)
		if err != nil {
			log.Printf("❌ Tenant not found: %s - %v", tenantID, err)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error":   "Tenant Not Found",
				"message": "The specified tenant does not exist or is inactive.",
			})
		}

		// Store in cache
		tenantCache.Set(tenantID, tenantInfo)

		// Inject tenant info into context
		injectTenantContext(c, tenantInfo)

		elapsed := time.Since(startTime)
		log.Printf("✅ Tenant identified: %s (%s) - %v", tenantInfo.Slug, tenantID, elapsed)

		return c.Next()
	}
}

// extractTenantID extracts tenant ID from multiple sources in priority order
func extractTenantID(c *fiber.Ctx) string {
	// 1. Try X-Tenant-ID header (highest priority)
	if tenantID := c.Get("X-Tenant-ID"); tenantID != "" {
		return tenantID
	}

	// 2. Try subdomain extraction (e.g., tenant.stegmaier.com)
	if tenantID := extractFromSubdomain(c); tenantID != "" {
		return tenantID
	}

	// 3. Try JWT claim (if JWT middleware was applied before this)
	if tenantID := extractFromJWT(c); tenantID != "" {
		return tenantID
	}

	// 4. Try query parameter (for testing/debugging)
	if tenantID := c.Query("tenant_id"); tenantID != "" {
		return tenantID
	}

	return ""
}

// extractFromSubdomain extracts tenant slug from subdomain
func extractFromSubdomain(c *fiber.Ctx) string {
	host := c.Hostname()

	// Split by dots
	parts := strings.Split(host, ".")

	// If we have at least 3 parts (e.g., tenant.stegmaier.com)
	if len(parts) >= 3 {
		// First part is the tenant slug
		subdomain := parts[0]

		// Ignore common non-tenant subdomains
		if subdomain != "www" && subdomain != "api" && subdomain != "admin" {
			return subdomain
		}
	}

	return ""
}

// extractFromJWT extracts tenant ID from JWT claims
func extractFromJWT(c *fiber.Ctx) string {
	// This will be populated by JWT middleware if it runs before tenant middleware
	// For now, we check if it exists in locals
	tenantID := c.Locals("jwt_tenant_id")
	if tenantID != nil {
		if tid, ok := tenantID.(string); ok {
			return tid
		}
	}
	return ""
}

// getTenantInfo fetches tenant information from the database
func getTenantInfo(dbManager *database.Manager, tenantID string) (*database.TenantInfo, error) {
	controlDB := dbManager.GetControlDB()

	var tenantInfo database.TenantInfo
	query := `
		SELECT id, name, slug, database_name, node_number, status
		FROM tenants
		WHERE (id::text = $1 OR slug = $1) AND status = 'active'
		LIMIT 1
	`

	err := controlDB.Get(&tenantInfo, query, tenantID)
	if err != nil {
		return nil, err
	}

	return &tenantInfo, nil
}

// injectTenantContext injects tenant information into Fiber context
func injectTenantContext(c *fiber.Ctx, info *database.TenantInfo) {
	c.Locals(TenantIDKey, info.ID)
	c.Locals(TenantSlugKey, info.Slug)
	c.Locals(TenantNameKey, info.Name)
	c.Locals(TenantDBNameKey, info.DatabaseName)
}

// OptionalTenantMiddleware is like TenantMiddleware but doesn't fail if tenant is missing
// Useful for public endpoints that may or may not need tenant context
func OptionalTenantMiddleware(dbManager *database.Manager) fiber.Handler {
	InitTenantCache(5 * time.Minute)

	return func(c *fiber.Ctx) error {
		log.Printf("🔵 OptionalTenantMiddleware called for: %s %s", c.Method(), c.Path())

		// Wrap in recover to catch any panics
		defer func() {
			if r := recover(); r != nil {
				log.Printf("❌ PANIC in OptionalTenantMiddleware: %v", r)
			}
		}()

		tenantID := extractTenantID(c)
		log.Printf("🔵 Extracted tenantID: '%s'", tenantID)

		if tenantID == "" {
			// No tenant ID, but that's OK for optional middleware
			log.Printf("✅ No tenant ID - continuing without tenant context")
			return c.Next()
		}

		// Try cache first
		tenantInfo, cached := tenantCache.Get(tenantID)
		if cached {
			log.Printf("✅ Tenant found in cache: %s", tenantID)
			injectTenantContext(c, tenantInfo)
			return c.Next()
		}

		// Fetch from database
		log.Printf("🔵 Fetching tenant from database: %s", tenantID)
		tenantInfo, err := getTenantInfo(dbManager, tenantID)
		if err != nil {
			// Tenant not found, but continue anyway (optional)
			log.Printf("⚠️  Optional tenant not found: %s - Error: %v", tenantID, err)
			return c.Next()
		}

		// Cache and inject
		log.Printf("✅ Tenant found in database: %s", tenantID)
		tenantCache.Set(tenantID, tenantInfo)
		injectTenantContext(c, tenantInfo)

		return c.Next()
	}
}

// GetCacheStats returns cache statistics
func GetCacheStats() map[string]interface{} {
	if tenantCache == nil {
		return map[string]interface{}{
			"initialized": false,
		}
	}

	return map[string]interface{}{
		"initialized": true,
		"size":        tenantCache.GetCacheSize(),
		"ttl":         tenantCache.ttl.String(),
	}
}
