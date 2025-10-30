package fixtures

import (
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// TenantFixture represents a test tenant
type TenantFixture struct {
	ID           string
	Name         string
	Slug         string
	DatabaseName string
	NodeNumber   int
	Status       string
}

// DefaultTenant returns a default test tenant
func DefaultTenant() *TenantFixture {
	return &TenantFixture{
		ID:           uuid.New().String(),
		Name:         "Test Company",
		Slug:         "test-company",
		DatabaseName: "tenant_test_company",
		NodeNumber:   1,
		Status:       "active",
	}
}

// CreateTenant inserts a tenant into the control database
func CreateTenant(t *testing.T, db *sqlx.DB, tenant *TenantFixture) *database.TenantInfo {
	t.Helper()

	query := `
		INSERT INTO tenants (id, name, slug, database_name, node_number, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, name, slug, database_name, node_number, status
	`

	var tenantInfo database.TenantInfo
	err := db.Get(&tenantInfo, query,
		tenant.ID,
		tenant.Name,
		tenant.Slug,
		tenant.DatabaseName,
		tenant.NodeNumber,
		tenant.Status,
	)
	if err != nil {
		t.Fatalf("Failed to create tenant fixture: %v", err)
	}

	return &tenantInfo
}

// TenantBuilder provides a fluent interface for building test tenants
type TenantBuilder struct {
	tenant *TenantFixture
}

// NewTenantBuilder creates a new tenant builder
func NewTenantBuilder() *TenantBuilder {
	return &TenantBuilder{
		tenant: DefaultTenant(),
	}
}

// WithID sets the tenant ID
func (b *TenantBuilder) WithID(id string) *TenantBuilder {
	b.tenant.ID = id
	return b
}

// WithName sets the tenant name
func (b *TenantBuilder) WithName(name string) *TenantBuilder {
	b.tenant.Name = name
	return b
}

// WithSlug sets the tenant slug
func (b *TenantBuilder) WithSlug(slug string) *TenantBuilder {
	b.tenant.Slug = slug
	return b
}

// WithDatabaseName sets the tenant database name
func (b *TenantBuilder) WithDatabaseName(dbName string) *TenantBuilder {
	b.tenant.DatabaseName = dbName
	return b
}

// WithNodeNumber sets the tenant node number
func (b *TenantBuilder) WithNodeNumber(nodeNumber int) *TenantBuilder {
	b.tenant.NodeNumber = nodeNumber
	return b
}

// WithStatus sets the tenant status
func (b *TenantBuilder) WithStatus(status string) *TenantBuilder {
	b.tenant.Status = status
	return b
}

// Build returns the built tenant fixture
func (b *TenantBuilder) Build() *TenantFixture {
	return b.tenant
}

// Create inserts the tenant into the database and returns TenantInfo
func (b *TenantBuilder) Create(t *testing.T, db *sqlx.DB) *database.TenantInfo {
	return CreateTenant(t, db, b.tenant)
}

// MultipleTenants creates multiple tenant fixtures
func MultipleTenants(count int) []*TenantFixture {
	tenants := make([]*TenantFixture, count)
	for i := 0; i < count; i++ {
		tenants[i] = &TenantFixture{
			ID:           uuid.New().String(),
			Name:         "Test Company " + string(rune('A'+i)),
			Slug:         "test-company-" + string(rune('a'+i)),
			DatabaseName: "tenant_test_company_" + string(rune('a'+i)),
			NodeNumber:   1,
			Status:       "active",
		}
	}
	return tenants
}

// CreateMultipleTenants inserts multiple tenants into the database
func CreateMultipleTenants(t *testing.T, db *sqlx.DB, count int) []*database.TenantInfo {
	t.Helper()

	tenants := MultipleTenants(count)
	tenantInfos := make([]*database.TenantInfo, count)

	for i, tenant := range tenants {
		tenantInfos[i] = CreateTenant(t, db, tenant)
	}

	return tenantInfos
}

// InactiveTenant returns an inactive tenant fixture
func InactiveTenant() *TenantFixture {
	tenant := DefaultTenant()
	tenant.Status = "inactive"
	tenant.Slug = "inactive-tenant"
	tenant.Name = "Inactive Tenant"
	return tenant
}

// DeleteTenant deletes a tenant from the database
func DeleteTenant(t *testing.T, db *sqlx.DB, tenantID string) {
	t.Helper()

	_, err := db.Exec("DELETE FROM tenants WHERE id = $1", tenantID)
	if err != nil {
		t.Fatalf("Failed to delete tenant: %v", err)
	}
}
