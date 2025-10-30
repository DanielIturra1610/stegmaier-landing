package user_test

import (
	"context"
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	useradapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/user/adapters"
	userdomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/user/domain"
	"github.com/DanielIturra1610/stegmaier-landing/tests/fixtures"
	"github.com/DanielIturra1610/stegmaier-landing/tests/helpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserRepository_List(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and users
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	// Create multiple users with different roles and verification status
	student1 := fixtures.StudentUser(tenant.ID).ToUser()
	student2 := fixtures.StudentUser(tenant.ID).WithEmail("student2@test.com").ToUser()
	admin := fixtures.AdminUser(tenant.ID).ToUser()
	instructor := fixtures.InstructorUser(tenant.ID).ToUser()
	verifiedStudent := fixtures.StudentUser(tenant.ID).
		WithEmail("verified@test.com").
		WithVerified(true).
		ToUser()

	users := []*domain.User{student1, student2, admin, instructor, verifiedStudent}
	for _, user := range users {
		require.NoError(t, repo.Create(ctx, user))
	}

	tests := []struct {
		name          string
		filters       *userdomain.UserFiltersDTO
		expectedCount int
		checkFunc     func(t *testing.T, users []*domain.User)
	}{
		{
			name: "List all users with default pagination",
			filters: &userdomain.UserFiltersDTO{
				Page:     1,
				PageSize: 20,
			},
			expectedCount: 5,
		},
		{
			name: "Filter by role - students only",
			filters: &userdomain.UserFiltersDTO{
				Role:     string(domain.RoleStudent),
				Page:     1,
				PageSize: 20,
			},
			expectedCount: 3, // student1, student2, verifiedStudent
			checkFunc: func(t *testing.T, users []*domain.User) {
				for _, user := range users {
					assert.Equal(t, string(domain.RoleStudent), user.Role)
				}
			},
		},
		{
			name: "Filter by role - admin only",
			filters: &userdomain.UserFiltersDTO{
				Role:     string(domain.RoleAdmin),
				Page:     1,
				PageSize: 20,
			},
			expectedCount: 1,
			checkFunc: func(t *testing.T, users []*domain.User) {
				assert.Equal(t, string(domain.RoleAdmin), users[0].Role)
			},
		},
		{
			name: "Filter by verified status - verified only",
			filters: &userdomain.UserFiltersDTO{
				IsVerified: func() *bool { b := true; return &b }(),
				Page:       1,
				PageSize:   20,
			},
			expectedCount: 1, // Only verifiedStudent
			checkFunc: func(t *testing.T, users []*domain.User) {
				assert.True(t, users[0].IsVerified)
			},
		},
		{
			name: "Filter by verified status - unverified only",
			filters: &userdomain.UserFiltersDTO{
				IsVerified: func() *bool { b := false; return &b }(),
				Page:       1,
				PageSize:   20,
			},
			expectedCount: 4, // All except verifiedStudent
		},
		{
			name: "Search by email",
			filters: &userdomain.UserFiltersDTO{
				Search:   "student2",
				Page:     1,
				PageSize: 20,
			},
			expectedCount: 1,
			checkFunc: func(t *testing.T, users []*domain.User) {
				assert.Contains(t, users[0].Email, "student2")
			},
		},
		{
			name: "Search by full name",
			filters: &userdomain.UserFiltersDTO{
				Search:   "Admin",
				Page:     1,
				PageSize: 20,
			},
			expectedCount: 1,
			checkFunc: func(t *testing.T, users []*domain.User) {
				assert.Contains(t, users[0].FullName, "Admin")
			},
		},
		{
			name: "Pagination - page 1 with size 2",
			filters: &userdomain.UserFiltersDTO{
				Page:      1,
				PageSize:  2,
				SortBy:    "created_at",
				SortOrder: "asc",
			},
			expectedCount: 2,
		},
		{
			name: "Filter by tenant ID",
			filters: &userdomain.UserFiltersDTO{
				TenantID: tenant.ID,
				Page:     1,
				PageSize: 20,
			},
			expectedCount: 5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Apply defaults if not set
			tt.filters.ApplyDefaults()

			users, totalCount, err := repo.List(ctx, tt.filters)
			require.NoError(t, err)
			assert.Len(t, users, tt.expectedCount)
			assert.GreaterOrEqual(t, totalCount, tt.expectedCount)

			if tt.checkFunc != nil {
				tt.checkFunc(t, users)
			}
		})
	}
}

func TestUserRepository_GetByTenant(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create two tenants
	tenant1 := fixtures.DefaultTenant()
	tenant2 := fixtures.NewTenantBuilder().
		WithName("Tenant 2").
		WithSlug("tenant2").
		Build()

	fixtures.CreateTenant(t, testDB.DB, tenant1)
	fixtures.CreateTenant(t, testDB.DB, tenant2)

	// Create users in tenant1
	user1 := fixtures.StudentUser(tenant1.ID).ToUser()
	user2 := fixtures.AdminUser(tenant1.ID).ToUser()
	require.NoError(t, repo.Create(ctx, user1))
	require.NoError(t, repo.Create(ctx, user2))

	// Create user in tenant2
	user3 := fixtures.StudentUser(tenant2.ID).ToUser()
	require.NoError(t, repo.Create(ctx, user3))

	// Test
	users, err := repo.GetByTenant(ctx, tenant1.ID)
	require.NoError(t, err)
	assert.Len(t, users, 2)
	for _, user := range users {
		assert.Equal(t, tenant1.ID, user.TenantID)
	}

	// Test tenant2
	users, err = repo.GetByTenant(ctx, tenant2.ID)
	require.NoError(t, err)
	assert.Len(t, users, 1)
	assert.Equal(t, tenant2.ID, users[0].TenantID)
}

func TestUserRepository_GetByRole(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and users
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	student1 := fixtures.StudentUser(tenant.ID).ToUser()
	student2 := fixtures.StudentUser(tenant.ID).WithEmail("student2@test.com").ToUser()
	admin := fixtures.AdminUser(tenant.ID).ToUser()
	instructor := fixtures.InstructorUser(tenant.ID).ToUser()
	superadmin := fixtures.SuperAdminUser(tenant.ID).ToUser()

	users := []*domain.User{student1, student2, admin, instructor, superadmin}
	for _, user := range users {
		require.NoError(t, repo.Create(ctx, user))
	}

	tests := []struct {
		name          string
		role          string
		expectedCount int
	}{
		{
			name:          "Get students",
			role:          string(domain.RoleStudent),
			expectedCount: 2,
		},
		{
			name:          "Get admins",
			role:          string(domain.RoleAdmin),
			expectedCount: 1,
		},
		{
			name:          "Get instructors",
			role:          string(domain.RoleInstructor),
			expectedCount: 1,
		},
		{
			name:          "Get superadmins",
			role:          string(domain.RoleSuperAdmin),
			expectedCount: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			users, err := repo.GetByRole(ctx, tt.role)
			require.NoError(t, err)
			assert.Len(t, users, tt.expectedCount)
			for _, user := range users {
				assert.Equal(t, tt.role, user.Role)
			}
		})
	}
}

func TestUserRepository_SetVerified(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and user
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	user := fixtures.StudentUser(tenant.ID).WithVerified(false).ToUser()
	require.NoError(t, repo.Create(ctx, user))

	// Verify user
	err := repo.SetVerified(ctx, user.ID, true)
	require.NoError(t, err)

	// Check verification status
	updatedUser, err := repo.GetByID(ctx, user.ID)
	require.NoError(t, err)
	assert.True(t, updatedUser.IsVerified)

	// Unverify user
	err = repo.SetVerified(ctx, user.ID, false)
	require.NoError(t, err)

	// Check verification status again
	updatedUser, err = repo.GetByID(ctx, user.ID)
	require.NoError(t, err)
	assert.False(t, updatedUser.IsVerified)
}

func TestUserRepository_CountByRole(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and users
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	// Create 3 students, 2 admins, 1 instructor
	for i := 0; i < 3; i++ {
		user := fixtures.StudentUser(tenant.ID).
			WithEmail("student" + string(rune(i)) + "@test.com").
			ToUser()
		require.NoError(t, repo.Create(ctx, user))
	}

	for i := 0; i < 2; i++ {
		user := fixtures.AdminUser(tenant.ID).
			WithEmail("admin" + string(rune(i)) + "@test.com").
			ToUser()
		require.NoError(t, repo.Create(ctx, user))
	}

	instructor := fixtures.InstructorUser(tenant.ID).ToUser()
	require.NoError(t, repo.Create(ctx, instructor))

	// Test counts
	studentCount, err := repo.CountByRole(ctx, string(domain.RoleStudent))
	require.NoError(t, err)
	assert.Equal(t, 3, studentCount)

	adminCount, err := repo.CountByRole(ctx, string(domain.RoleAdmin))
	require.NoError(t, err)
	assert.Equal(t, 2, adminCount)

	instructorCount, err := repo.CountByRole(ctx, string(domain.RoleInstructor))
	require.NoError(t, err)
	assert.Equal(t, 1, instructorCount)
}

func TestUserRepository_CountByTenant(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create two tenants
	tenant1 := fixtures.DefaultTenant()
	tenant2 := fixtures.NewTenantBuilder().
		WithName("Tenant 2").
		WithSlug("tenant2").
		Build()

	fixtures.CreateTenant(t, testDB.DB, tenant1)
	fixtures.CreateTenant(t, testDB.DB, tenant2)

	// Create 3 users in tenant1
	for i := 0; i < 3; i++ {
		user := fixtures.StudentUser(tenant1.ID).
			WithEmail("tenant1-user" + string(rune(i)) + "@test.com").
			ToUser()
		require.NoError(t, repo.Create(ctx, user))
	}

	// Create 2 users in tenant2
	for i := 0; i < 2; i++ {
		user := fixtures.StudentUser(tenant2.ID).
			WithEmail("tenant2-user" + string(rune(i)) + "@test.com").
			ToUser()
		require.NoError(t, repo.Create(ctx, user))
	}

	// Test counts
	count1, err := repo.CountByTenant(ctx, tenant1.ID)
	require.NoError(t, err)
	assert.Equal(t, 3, count1)

	count2, err := repo.CountByTenant(ctx, tenant2.ID)
	require.NoError(t, err)
	assert.Equal(t, 2, count2)
}

func TestUserRepository_BulkDelete(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and users
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	user1 := fixtures.StudentUser(tenant.ID).ToUser()
	user2 := fixtures.StudentUser(tenant.ID).WithEmail("student2@test.com").ToUser()
	user3 := fixtures.StudentUser(tenant.ID).WithEmail("student3@test.com").ToUser()

	users := []*domain.User{user1, user2, user3}
	for _, user := range users {
		require.NoError(t, repo.Create(ctx, user))
	}

	// Bulk delete user1 and user2
	userIDs := []string{user1.ID, user2.ID}
	err := repo.BulkDelete(ctx, userIDs)
	require.NoError(t, err)

	// Verify deletion
	_, err = repo.GetByID(ctx, user1.ID)
	assert.Error(t, err) // Should not exist

	_, err = repo.GetByID(ctx, user2.ID)
	assert.Error(t, err) // Should not exist

	// user3 should still exist
	existingUser, err := repo.GetByID(ctx, user3.ID)
	require.NoError(t, err)
	assert.Equal(t, user3.ID, existingUser.ID)
}

func TestUserRepository_BulkUpdateRole(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and users
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	user1 := fixtures.StudentUser(tenant.ID).ToUser()
	user2 := fixtures.StudentUser(tenant.ID).WithEmail("student2@test.com").ToUser()
	user3 := fixtures.StudentUser(tenant.ID).WithEmail("student3@test.com").ToUser()

	users := []*domain.User{user1, user2, user3}
	for _, user := range users {
		require.NoError(t, repo.Create(ctx, user))
		assert.Equal(t, string(domain.RoleStudent), user.Role)
	}

	// Bulk update user1 and user2 to instructors
	userIDs := []string{user1.ID, user2.ID}
	err := repo.BulkUpdateRole(ctx, userIDs, string(domain.RoleInstructor))
	require.NoError(t, err)

	// Verify role updates
	updatedUser1, err := repo.GetByID(ctx, user1.ID)
	require.NoError(t, err)
	assert.Equal(t, string(domain.RoleInstructor), updatedUser1.Role)

	updatedUser2, err := repo.GetByID(ctx, user2.ID)
	require.NoError(t, err)
	assert.Equal(t, string(domain.RoleInstructor), updatedUser2.Role)

	// user3 should still be student
	unchangedUser, err := repo.GetByID(ctx, user3.ID)
	require.NoError(t, err)
	assert.Equal(t, string(domain.RoleStudent), unchangedUser.Role)
}

func TestUserRepository_GetStats(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and users
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	// Create 2 verified students, 1 unverified student
	verifiedStudent1 := fixtures.StudentUser(tenant.ID).
		WithEmail("verified1@test.com").
		WithVerified(true).
		ToUser()
	verifiedStudent2 := fixtures.StudentUser(tenant.ID).
		WithEmail("verified2@test.com").
		WithVerified(true).
		ToUser()
	unverifiedStudent := fixtures.StudentUser(tenant.ID).
		WithEmail("unverified@test.com").
		WithVerified(false).
		ToUser()

	// Create 1 admin, 1 instructor
	admin := fixtures.AdminUser(tenant.ID).WithVerified(true).ToUser()
	instructor := fixtures.InstructorUser(tenant.ID).WithVerified(true).ToUser()

	users := []*domain.User{verifiedStudent1, verifiedStudent2, unverifiedStudent, admin, instructor}
	for _, user := range users {
		require.NoError(t, repo.Create(ctx, user))
	}

	// Get stats
	stats, err := repo.GetStats(ctx, tenant.ID)
	require.NoError(t, err)

	// Verify stats
	assert.Equal(t, 5, stats.TotalUsers)
	assert.Equal(t, 4, stats.VerifiedUsers)
	assert.Equal(t, 1, stats.UnverifiedUsers)
	assert.Equal(t, 3, stats.UsersByRole[string(domain.RoleStudent)])
	assert.Equal(t, 1, stats.UsersByRole[string(domain.RoleAdmin)])
	assert.Equal(t, 1, stats.UsersByRole[string(domain.RoleInstructor)])
	assert.GreaterOrEqual(t, stats.RecentUsers, 5) // All users created recently
}

func TestUserRepository_Exists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup
	testDB := helpers.CreateTestControlDB(t)
	repo := useradapters.NewPostgreSQLUserRepository(testDB.DB)
	ctx := context.Background()

	// Create tenant and user
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, testDB.DB, tenant)

	user := fixtures.StudentUser(tenant.ID).ToUser()
	require.NoError(t, repo.Create(ctx, user))

	// Test existence
	exists, err := repo.Exists(ctx, user.Email)
	require.NoError(t, err)
	assert.True(t, exists)

	// Test non-existence
	exists, err = repo.Exists(ctx, "nonexistent@test.com")
	require.NoError(t, err)
	assert.False(t, exists)
}
