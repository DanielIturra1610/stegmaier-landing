package middleware

import (
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/gofiber/fiber/v2"
)

func TestTenantCache(t *testing.T) {
	// Initialize cache with short TTL for testing
	cache := &TenantCache{
		cache: make(map[string]*CachedTenant),
		ttl:   1 * time.Second,
	}

	// Test Set and Get
	tenantInfo := &database.TenantInfo{
		ID:           "test-id",
		Name:         "Test Tenant",
		Slug:         "test-tenant",
		DatabaseName: "tenant_test",
		Status:       "active",
	}

	cache.Set("test-id", tenantInfo)

	// Should retrieve from cache
	retrieved, found := cache.Get("test-id")
	if !found {
		t.Error("Expected to find tenant in cache")
	}

	if retrieved.ID != "test-id" {
		t.Errorf("Expected tenant ID 'test-id', got '%s'", retrieved.ID)
	}

	// Test cache miss
	_, found = cache.Get("nonexistent")
	if found {
		t.Error("Expected cache miss for nonexistent tenant")
	}

	// Test cache size
	size := cache.GetCacheSize()
	if size != 1 {
		t.Errorf("Expected cache size 1, got %d", size)
	}

	// Test Delete
	cache.Delete("test-id")
	_, found = cache.Get("test-id")
	if found {
		t.Error("Expected tenant to be deleted from cache")
	}
}

func TestTenantCacheExpiration(t *testing.T) {
	cache := &TenantCache{
		cache: make(map[string]*CachedTenant),
		ttl:   100 * time.Millisecond,
	}

	tenantInfo := &database.TenantInfo{
		ID:   "expire-test",
		Name: "Expire Test",
	}

	cache.Set("expire-test", tenantInfo)

	// Should find immediately
	_, found := cache.Get("expire-test")
	if !found {
		t.Error("Expected to find tenant immediately")
	}

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Should not find after expiration
	_, found = cache.Get("expire-test")
	if found {
		t.Error("Expected tenant to be expired")
	}
}

func TestExtractFromSubdomain(t *testing.T) {
	tests := []struct {
		name     string
		hostname string
		expected string
	}{
		{
			name:     "Valid tenant subdomain",
			hostname: "tenant1.stegmaier.com",
			expected: "tenant1",
		},
		{
			name:     "WWW subdomain (should be ignored)",
			hostname: "www.stegmaier.com",
			expected: "",
		},
		{
			name:     "API subdomain (should be ignored)",
			hostname: "api.stegmaier.com",
			expected: "",
		},
		{
			name:     "Admin subdomain (should be ignored)",
			hostname: "admin.stegmaier.com",
			expected: "",
		},
		{
			name:     "No subdomain",
			hostname: "stegmaier.com",
			expected: "",
		},
		{
			name:     "Localhost",
			hostname: "localhost",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			var result string
			app.Get("/test", func(c *fiber.Ctx) error {
				result = extractFromSubdomain(c)
				return c.SendString("ok")
			})

			// Create HTTP test request
			req := httptest.NewRequest("GET", "http://"+tt.hostname+"/test", nil)
			_, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Failed to test request: %v", err)
			}

			if result != tt.expected {
				t.Errorf("Expected '%s', got '%s'", tt.expected, result)
			}
		})
	}
}

func TestExtractTenantIDFromHeader(t *testing.T) {
	app := fiber.New()

	var extractedID string
	app.Get("/test", func(c *fiber.Ctx) error {
		extractedID = extractTenantID(c)
		return c.SendString("ok")
	})

	// Test with X-Tenant-ID header
	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	req.Header.Set("X-Tenant-ID", "header-tenant-123")

	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if extractedID != "header-tenant-123" {
		t.Errorf("Expected 'header-tenant-123', got '%s'", extractedID)
	}
}

func TestExtractTenantIDFromQueryParam(t *testing.T) {
	app := fiber.New()

	var extractedID string
	app.Get("/test", func(c *fiber.Ctx) error {
		extractedID = extractTenantID(c)
		return c.SendString("ok")
	})

	// Test with query parameter
	req := httptest.NewRequest("GET", "http://localhost/test?tenant_id=query-tenant-456", nil)

	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if extractedID != "query-tenant-456" {
		t.Errorf("Expected 'query-tenant-456', got '%s'", extractedID)
	}
}

func TestInjectTenantContext(t *testing.T) {
	app := fiber.New()

	tenantInfo := &database.TenantInfo{
		ID:           "inject-test",
		Name:         "Inject Test",
		Slug:         "inject-test",
		DatabaseName: "tenant_inject",
	}

	app.Get("/test", func(c *fiber.Ctx) error {
		injectTenantContext(c, tenantInfo)

		// Verify all fields were injected
		if c.Locals(TenantIDKey) != "inject-test" {
			t.Error("Tenant ID not properly injected")
		}

		if c.Locals(TenantSlugKey) != "inject-test" {
			t.Error("Tenant slug not properly injected")
		}

		if c.Locals(TenantNameKey) != "Inject Test" {
			t.Error("Tenant name not properly injected")
		}

		if c.Locals(TenantDBNameKey) != "tenant_inject" {
			t.Error("Tenant DB name not properly injected")
		}

		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}
}

func TestGetCacheStats(t *testing.T) {
	// Reset for clean test
	tenantCache = nil
	cacheOnce = sync.Once{}

	// Before initialization
	stats := GetCacheStats()
	if stats["initialized"].(bool) {
		t.Error("Cache should not be initialized yet")
	}

	// After initialization
	InitTenantCache(5 * time.Minute)
	stats = GetCacheStats()
	if !stats["initialized"].(bool) {
		t.Error("Cache should be initialized")
	}

	if _, ok := stats["size"]; !ok {
		t.Error("Stats should include size")
	}

	if _, ok := stats["ttl"]; !ok {
		t.Error("Stats should include TTL")
	}
}

func TestInitTenantCacheOnlyOnce(t *testing.T) {
	// Reset for this test
	tenantCache = nil
	cacheOnce = sync.Once{}

	InitTenantCache(1 * time.Minute)
	firstCache := tenantCache

	InitTenantCache(5 * time.Minute)
	secondCache := tenantCache

	// Should be the same instance
	if firstCache != secondCache {
		t.Error("InitTenantCache should only initialize once")
	}

	// TTL should be from first initialization
	if tenantCache.ttl != 1*time.Minute {
		t.Error("Cache TTL should be from first initialization")
	}
}

func TestExtractTenantIDNoTenant(t *testing.T) {
	app := fiber.New()

	var extractedID string
	app.Get("/test", func(c *fiber.Ctx) error {
		extractedID = extractTenantID(c)
		return c.SendString("ok")
	})

	// Test without any tenant identifier
	req := httptest.NewRequest("GET", "http://localhost/test", nil)

	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if extractedID != "" {
		t.Errorf("Expected empty string, got '%s'", extractedID)
	}
}

func TestTenantMiddlewareWithoutDBManager(t *testing.T) {
	// This test just verifies the middleware can be created
	// Full integration testing would require a real database

	// We can't fully test without a DB, but we can verify the middleware doesn't panic
	defer func() {
		if r := recover(); r != nil {
			t.Errorf("Middleware creation panicked: %v", r)
		}
	}()

	// Just verify TenantMiddleware can be called
	// (it will fail at runtime without a DB manager, but shouldn't panic on creation)
	middleware := TenantMiddleware(nil)
	if middleware == nil {
		t.Error("Expected middleware function, got nil")
	}
}

func BenchmarkCacheGet(b *testing.B) {
	cache := &TenantCache{
		cache: make(map[string]*CachedTenant),
		ttl:   5 * time.Minute,
	}

	tenantInfo := &database.TenantInfo{
		ID:   "bench-test",
		Name: "Bench Test",
	}

	cache.Set("bench-test", tenantInfo)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		cache.Get("bench-test")
	}
}

func BenchmarkCacheSet(b *testing.B) {
	cache := &TenantCache{
		cache: make(map[string]*CachedTenant),
		ttl:   5 * time.Minute,
	}

	tenantInfo := &database.TenantInfo{
		ID:   "bench-test",
		Name: "Bench Test",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		cache.Set("bench-test", tenantInfo)
	}
}
