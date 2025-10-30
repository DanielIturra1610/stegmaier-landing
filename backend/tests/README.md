# Tests Documentation - Stegmaier LMS Backend

## Overview

This directory contains comprehensive tests for the authentication and authorization system, including integration tests and end-to-end tests.

## Test Structure

```
tests/
├── fixtures/           # Test data builders and fixtures
│   ├── tenant_fixtures.go
│   └── user_fixtures.go  (includes SuperAdmin support)
├── helpers/            # Test utilities and helpers
│   ├── database_helper.go
│   └── api_helper.go
├── mocks/             # Mock implementations
├── integration/       # Integration tests (require database)
│   └── auth/
│       └── repository_test.go
└── e2e/              # End-to-end tests (full HTTP flow)
    └── auth/
        ├── register_test.go
        ├── login_test.go
        └── rbac_test.go
```

## Test Categories

### 1. Unit Tests
Location: `internal/*/`

- **Domain tests**: `internal/core/auth/domain/*_test.go`
- **Middleware tests**: `internal/middleware/*_test.go`
- **Shared utilities tests**: `internal/shared/*/*_test.go`

Run with:
```bash
go test ./internal/... -v
```

### 2. Integration Tests
Location: `tests/integration/`

**Requirements**: PostgreSQL database running

Tests database operations and repository layer:
- User creation with different roles
- User retrieval and updates
- Role validation
- Tenant isolation

Run with:
```bash
# Skip in short mode (no DB required)
go test ./tests/integration/... -short -v

# Full run (requires PostgreSQL)
go test ./tests/integration/... -v
```

### 3. End-to-End Tests
Location: `tests/e2e/`

**Requirements**: PostgreSQL database running

Tests complete HTTP flows:
- **Register flow**: User registration with validation
- **Login flow**: Authentication with different roles
- **RBAC flow**: Protected routes and role-based access

Run with:
```bash
# Skip in short mode
go test ./tests/e2e/... -short -v

# Full run (requires PostgreSQL)
go test ./tests/e2e/... -v
```

## Running All Tests

### Quick Test (No Database)
```bash
go test ./... -short -v
```

### Full Test Suite (Requires PostgreSQL)
```bash
go test ./... -v
```

### With Coverage
```bash
go test ./... -short -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## Database Setup for Integration/E2E Tests

Tests automatically create and destroy temporary databases. Configure connection in `.env`:

```env
# Test Database Configuration
CONTROL_DB_HOST=localhost
CONTROL_DB_PORT=5432
CONTROL_DB_USER=postgres
CONTROL_DB_PASSWORD=your_password
```

**Note**: Tests use the `postgres` database to create temporary test databases.

## Test Coverage

### Auth Repository Integration Tests
- ✅ Create users with all roles (student, instructor, admin, superadmin)
- ✅ Duplicate email handling
- ✅ Get user by email and ID
- ✅ Update user information
- ✅ Multi-role creation
- ✅ Tenant isolation verification

### Register E2E Tests
- ✅ Successful registration
- ✅ Validation errors (missing fields, invalid email, weak password)
- ✅ Duplicate email prevention
- ✅ Role-based registration (student, instructor allowed; admin/superadmin blocked)
- ✅ Tenant header requirement
- ✅ Tenant isolation

### Login E2E Tests
- ✅ Successful login with all roles
- ✅ Invalid credentials handling
- ✅ Unverified user behavior
- ✅ JWT token generation and validation
- ✅ Password hash not exposed in response
- ✅ Tenant header requirement
- ✅ Cross-tenant access prevention

### RBAC E2E Tests
- ✅ Authentication required for protected routes
- ✅ Admin routes access control (admin + superadmin only)
- ✅ SuperAdmin-only routes (superadmin only)
- ✅ Role hierarchy validation (SuperAdmin > Admin > Instructor > Student)
- ✅ Forbidden responses for insufficient permissions
- ✅ Expired/invalid token handling
- ✅ Cross-tenant access prevention

## Fixtures and Helpers

### User Fixtures
```go
// Create users with fluent API
student := fixtures.NewUserBuilder(tenantID).
    WithEmail("student@test.com").
    AsStudent().
    Verified().
    Build()

admin := fixtures.AdminUser(tenantID)
superAdmin := fixtures.SuperAdminUser(tenantID)
```

### API Helpers
```go
// Make authenticated requests
token := loginAndGetToken(t, srv, "user@test.com", "password", tenantID)
headers := helpers.AuthAndTenantHeaders(token, tenantID)
resp := helpers.MakeRequest(t, srv.App, "GET", "/api/v1/admin/users", nil, headers)

// Assert responses
helpers.AssertStatusCode(t, resp, fiber.StatusOK)
helpers.ParseJSONResponse(t, resp, &target)
```

### Database Helpers
```go
// Create test database
testDB := helpers.CreateTestControlDB(t)
// Automatic cleanup with t.Cleanup()

// Create test server
srv := helpers.CreateTestServer(t)
// Includes database manager and Fiber app
```

## Best Practices

1. **Use `-short` flag for CI/CD**: Skip integration tests when database is not available
2. **Isolation**: Each test creates its own temporary database
3. **Cleanup**: Tests automatically clean up resources via `t.Cleanup()`
4. **Fixtures**: Use fixture builders for consistent test data
5. **Helpers**: Use helpers for common operations (login, API requests)

## Troubleshooting

### "password authentication failed for user postgres"
- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check PostgreSQL allows local connections

### "database does not exist"
- Tests create temporary databases automatically
- Ensure test user has `CREATEDB` permission

### Tests hang or timeout
- Check PostgreSQL connection limits
- Verify no zombie connections from previous test runs

## Adding New Tests

### Integration Test Template
```go
func TestNewFeature(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration test in short mode")
    }

    testDB := helpers.CreateTestControlDB(t)
    // Test implementation
}
```

### E2E Test Template
```go
func TestNewEndpoint(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping E2E test in short mode")
    }

    srv := helpers.CreateTestServer(t)
    // Test implementation
}
```

## Continuous Integration

Example GitHub Actions configuration:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.24'

      - name: Run unit tests
        run: go test ./... -short -v

      - name: Run integration tests
        run: go test ./... -v
        env:
          CONTROL_DB_HOST: localhost
          CONTROL_DB_PORT: 5432
          CONTROL_DB_USER: postgres
          CONTROL_DB_PASSWORD: postgres
```

## Related Documentation

- [RBAC Implementation](../internal/middleware/rbac.go)
- [Auth Domain](../internal/core/auth/domain/)
- [API Routes](../internal/server/server.go)
- [Architecture Documentation](../docs/architecture.md)
