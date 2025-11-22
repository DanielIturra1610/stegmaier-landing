package fixtures

import (
	"testing"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// UserFixture represents a test user
type UserFixture struct {
	ID           string
	TenantID     string
	Email        string
	PasswordHash string
	FullName     string
	Role         string
	IsVerified   bool
}

// DefaultUser returns a default test user
func DefaultUser(tenantID string) *UserFixture {
	return &UserFixture{
		ID:           uuid.New().String(),
		TenantID:     tenantID,
		Email:        "test@example.com",
		PasswordHash: "$2a$10$test.hash.value.here", // Placeholder hash
		FullName:     "Test User",
		Role:         "student",
		IsVerified:   true,
	}
}

// CreateUser inserts a user into the control database
func CreateUser(t *testing.T, db *sqlx.DB, user *UserFixture) *UserFixture {
	t.Helper()

	query := `
		INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_verified)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, tenant_id, email, password_hash, full_name, role, is_verified
	`

	var createdUser UserFixture
	err := db.Get(&createdUser, query,
		user.ID,
		user.TenantID,
		user.Email,
		user.PasswordHash,
		user.FullName,
		user.Role,
		user.IsVerified,
	)
	if err != nil {
		t.Fatalf("Failed to create user fixture: %v", err)
	}

	return &createdUser
}

// UserBuilder provides a fluent interface for building test users
type UserBuilder struct {
	user *UserFixture
}

// NewUserBuilder creates a new user builder
func NewUserBuilder(tenantID string) *UserBuilder {
	return &UserBuilder{
		user: DefaultUser(tenantID),
	}
}

// WithID sets the user ID
func (b *UserBuilder) WithID(id string) *UserBuilder {
	b.user.ID = id
	return b
}

// WithEmail sets the user email
func (b *UserBuilder) WithEmail(email string) *UserBuilder {
	b.user.Email = email
	return b
}

// WithPasswordHash sets the user password hash
func (b *UserBuilder) WithPasswordHash(hash string) *UserBuilder {
	b.user.PasswordHash = hash
	return b
}

// WithFullName sets the user full name
func (b *UserBuilder) WithFullName(name string) *UserBuilder {
	b.user.FullName = name
	return b
}

// WithRole sets the user role
func (b *UserBuilder) WithRole(role string) *UserBuilder {
	b.user.Role = role
	return b
}

// AsStudent sets the user as a student
func (b *UserBuilder) AsStudent() *UserBuilder {
	b.user.Role = "student"
	return b
}

// AsInstructor sets the user as an instructor
func (b *UserBuilder) AsInstructor() *UserBuilder {
	b.user.Role = "instructor"
	return b
}

// AsAdmin sets the user as an admin
func (b *UserBuilder) AsAdmin() *UserBuilder {
	b.user.Role = "admin"
	return b
}

// Verified sets the user as verified
func (b *UserBuilder) Verified() *UserBuilder {
	b.user.IsVerified = true
	return b
}

// Unverified sets the user as unverified
func (b *UserBuilder) Unverified() *UserBuilder {
	b.user.IsVerified = false
	return b
}

// Build returns the built user fixture
func (b *UserBuilder) Build() *UserFixture {
	return b.user
}

// Create inserts the user into the database
func (b *UserBuilder) Create(t *testing.T, db *sqlx.DB) *UserFixture {
	return CreateUser(t, db, b.user)
}

// StudentUser returns a student user fixture
func StudentUser(tenantID string) *UserFixture {
	return NewUserBuilder(tenantID).
		AsStudent().
		WithEmail("student@example.com").
		WithFullName("Test Student").
		Verified().
		Build()
}

// InstructorUser returns an instructor user fixture
func InstructorUser(tenantID string) *UserFixture {
	return NewUserBuilder(tenantID).
		AsInstructor().
		WithEmail("instructor@example.com").
		WithFullName("Test Instructor").
		Verified().
		Build()
}

// AdminUser returns an admin user fixture
func AdminUser(tenantID string) *UserFixture {
	return NewUserBuilder(tenantID).
		AsAdmin().
		WithEmail("admin@example.com").
		WithFullName("Test Admin").
		Verified().
		Build()
}

// UnverifiedUser returns an unverified user fixture
func UnverifiedUser(tenantID string) *UserFixture {
	return NewUserBuilder(tenantID).
		WithEmail("unverified@example.com").
		WithFullName("Unverified User").
		Unverified().
		Build()
}

// MultipleUsers creates multiple user fixtures with different roles
func MultipleUsers(tenantID string, count int) []*UserFixture {
	users := make([]*UserFixture, count)
	roles := []string{"student", "instructor", "admin"}

	for i := 0; i < count; i++ {
		role := roles[i%len(roles)]
		users[i] = &UserFixture{
			ID:           uuid.New().String(),
			TenantID:     tenantID,
			Email:        "user" + string(rune('0'+i)) + "@example.com",
			PasswordHash: "$2a$10$test.hash.value.here",
			FullName:     "Test User " + string(rune('A'+i)),
			Role:         role,
			IsVerified:   true,
		}
	}

	return users
}

// CreateMultipleUsers inserts multiple users into the database
func CreateMultipleUsers(t *testing.T, db *sqlx.DB, tenantID string, count int) []*UserFixture {
	t.Helper()

	users := MultipleUsers(tenantID, count)
	createdUsers := make([]*UserFixture, count)

	for i, user := range users {
		createdUsers[i] = CreateUser(t, db, user)
	}

	return createdUsers
}

// DeleteUser deletes a user from the database
func DeleteUser(t *testing.T, db *sqlx.DB, userID string) {
	t.Helper()

	_, err := db.Exec("DELETE FROM users WHERE id = $1", userID)
	if err != nil {
		t.Fatalf("Failed to delete user: %v", err)
	}
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(t *testing.T, db *sqlx.DB, email string) *UserFixture {
	t.Helper()

	var user UserFixture
	err := db.Get(&user, "SELECT * FROM users WHERE email = $1", email)
	if err != nil {
		t.Fatalf("Failed to get user by email: %v", err)
	}

	return &user
}
