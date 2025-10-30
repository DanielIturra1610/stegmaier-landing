package user_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/tests/fixtures"
	"github.com/DanielIturra1610/stegmaier-landing/tests/helpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserManagement_CreateUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin user for authentication
	admin := fixtures.AdminUser(tenant.ID)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), admin)
	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	tests := []struct {
		name       string
		token      string
		payload    map[string]interface{}
		wantStatus int
		checkFunc  func(t *testing.T, resp map[string]interface{})
	}{
		{
			name:  "Create student user successfully",
			token: adminToken,
			payload: map[string]interface{}{
				"email":     "newstudent@test.com",
				"password":  "SecurePass123",
				"full_name": "New Student",
				"role":      "student",
				"tenant_id": tenant.ID,
			},
			wantStatus: http.StatusCreated,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				assert.True(t, resp["success"].(bool))
				data := resp["data"].(map[string]interface{})
				user := data["user"].(map[string]interface{})
				assert.Equal(t, "newstudent@test.com", user["email"])
				assert.Equal(t, "New Student", user["full_name"])
				assert.Equal(t, "student", user["role"])
				assert.Nil(t, user["password_hash"]) // Should be sanitized
			},
		},
		{
			name:  "Create instructor user successfully",
			token: adminToken,
			payload: map[string]interface{}{
				"email":     "newinstructor@test.com",
				"password":  "SecurePass123",
				"full_name": "New Instructor",
				"role":      "instructor",
				"tenant_id": tenant.ID,
			},
			wantStatus: http.StatusCreated,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				assert.True(t, resp["success"].(bool))
				data := resp["data"].(map[string]interface{})
				user := data["user"].(map[string]interface{})
				assert.Equal(t, "instructor", user["role"])
			},
		},
		{
			name:  "Fail with weak password",
			token: adminToken,
			payload: map[string]interface{}{
				"email":     "weakpass@test.com",
				"password":  "123",
				"full_name": "Weak Password User",
				"role":      "student",
				"tenant_id": tenant.ID,
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:  "Fail with invalid email",
			token: adminToken,
			payload: map[string]interface{}{
				"email":     "notanemail",
				"password":  "SecurePass123",
				"full_name": "Invalid Email",
				"role":      "student",
				"tenant_id": tenant.ID,
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:  "Fail with invalid role",
			token: adminToken,
			payload: map[string]interface{}{
				"email":     "invalidrole@test.com",
				"password":  "SecurePass123",
				"full_name": "Invalid Role User",
				"role":      "invalidrole",
				"tenant_id": tenant.ID,
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:  "Fail without authentication",
			token: "",
			payload: map[string]interface{}{
				"email":     "noauth@test.com",
				"password":  "SecurePass123",
				"full_name": "No Auth User",
				"role":      "student",
				"tenant_id": tenant.ID,
			},
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/users", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			if tt.token != "" {
				req.Header.Set("Authorization", "Bearer "+tt.token)
			}

			resp, err := server.App.Test(req, -1)
			require.NoError(t, err)
			assert.Equal(t, tt.wantStatus, resp.StatusCode)

			if tt.checkFunc != nil && resp.StatusCode == http.StatusCreated {
				var response map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&response)
				tt.checkFunc(t, response)
			}
		})
	}
}

func TestUserManagement_ListUsers(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin for authentication
	admin := fixtures.AdminUser(tenant.ID)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), admin)
	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	// Create multiple users
	student1 := fixtures.StudentUser(tenant.ID)
	student2 := fixtures.StudentUser(tenant.ID).WithEmail("student2@test.com")
	verifiedStudent := fixtures.StudentUser(tenant.ID).
		WithEmail("verified@test.com").
		WithVerified(true)
	instructor := fixtures.InstructorUser(tenant.ID)

	users := []*fixtures.UserFixture{student1, student2, verifiedStudent, instructor}
	for _, user := range users {
		fixtures.CreateUser(t, server.DBManager.GetControlDB(), user)
	}

	tests := []struct {
		name       string
		query      string
		wantStatus int
		checkFunc  func(t *testing.T, resp map[string]interface{})
	}{
		{
			name:       "List all users",
			query:      "",
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				assert.True(t, resp["success"].(bool))
				data := resp["data"].(map[string]interface{})
				users := data["users"].([]interface{})
				assert.GreaterOrEqual(t, len(users), 4)
				assert.Greater(t, int(data["total_count"].(float64)), 0)
			},
		},
		{
			name:       "Filter by role - students",
			query:      "?role=student",
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				data := resp["data"].(map[string]interface{})
				users := data["users"].([]interface{})
				for _, u := range users {
					user := u.(map[string]interface{})
					assert.Equal(t, "student", user["role"])
				}
			},
		},
		{
			name:       "Filter by verified status",
			query:      "?is_verified=true",
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				data := resp["data"].(map[string]interface{})
				users := data["users"].([]interface{})
				for _, u := range users {
					user := u.(map[string]interface{})
					assert.True(t, user["is_verified"].(bool))
				}
			},
		},
		{
			name:       "Search by email",
			query:      "?search=verified",
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				data := resp["data"].(map[string]interface{})
				users := data["users"].([]interface{})
				assert.GreaterOrEqual(t, len(users), 1)
			},
		},
		{
			name:       "Pagination",
			query:      "?page=1&page_size=2",
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				data := resp["data"].(map[string]interface{})
				users := data["users"].([]interface{})
				assert.LessOrEqual(t, len(users), 2)
				assert.Equal(t, float64(1), data["page"].(float64))
				assert.Equal(t, float64(2), data["page_size"].(float64))
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users"+tt.query, nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)

			resp, err := server.App.Test(req, -1)
			require.NoError(t, err)
			assert.Equal(t, tt.wantStatus, resp.StatusCode)

			if tt.checkFunc != nil {
				var response map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&response)
				tt.checkFunc(t, response)
			}
		})
	}
}

func TestUserManagement_GetUserByID(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin and target user
	admin := fixtures.AdminUser(tenant.ID)
	student := fixtures.StudentUser(tenant.ID)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), admin)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), student)

	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	tests := []struct {
		name       string
		userID     string
		wantStatus int
		checkFunc  func(t *testing.T, resp map[string]interface{})
	}{
		{
			name:       "Get user successfully",
			userID:     student.ID,
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				assert.True(t, resp["success"].(bool))
				data := resp["data"].(map[string]interface{})
				user := data["user"].(map[string]interface{})
				assert.Equal(t, student.ID, user["id"])
				assert.Equal(t, student.Email, user["email"])
			},
		},
		{
			name:       "Fail with non-existent user",
			userID:     "00000000-0000-0000-0000-000000000000",
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users/"+tt.userID, nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)

			resp, err := server.App.Test(req, -1)
			require.NoError(t, err)
			assert.Equal(t, tt.wantStatus, resp.StatusCode)

			if tt.checkFunc != nil {
				var response map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&response)
				tt.checkFunc(t, response)
			}
		})
	}
}

func TestUserManagement_UpdateUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin and target user
	admin := fixtures.AdminUser(tenant.ID)
	student := fixtures.StudentUser(tenant.ID)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), admin)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), student)

	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	tests := []struct {
		name       string
		userID     string
		payload    map[string]interface{}
		wantStatus int
		checkFunc  func(t *testing.T, resp map[string]interface{})
	}{
		{
			name:   "Update full name successfully",
			userID: student.ID,
			payload: map[string]interface{}{
				"full_name": "Updated Name",
			},
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				data := resp["data"].(map[string]interface{})
				user := data["user"].(map[string]interface{})
				assert.Equal(t, "Updated Name", user["full_name"])
			},
		},
		{
			name:   "Update role successfully",
			userID: student.ID,
			payload: map[string]interface{}{
				"role": "instructor",
			},
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				data := resp["data"].(map[string]interface{})
				user := data["user"].(map[string]interface{})
				assert.Equal(t, "instructor", user["role"])
			},
		},
		{
			name:   "Update verification status",
			userID: student.ID,
			payload: map[string]interface{}{
				"is_verified": true,
			},
			wantStatus: http.StatusOK,
			checkFunc: func(t *testing.T, resp map[string]interface{}) {
				data := resp["data"].(map[string]interface{})
				user := data["user"].(map[string]interface{})
				assert.True(t, user["is_verified"].(bool))
			},
		},
		{
			name:   "Fail with invalid role",
			userID: student.ID,
			payload: map[string]interface{}{
				"role": "invalidrole",
			},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/users/"+tt.userID, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+adminToken)

			resp, err := server.App.Test(req, -1)
			require.NoError(t, err)
			assert.Equal(t, tt.wantStatus, resp.StatusCode)

			if tt.checkFunc != nil {
				var response map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&response)
				tt.checkFunc(t, response)
			}
		})
	}
}

func TestUserManagement_DeleteUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin and target user
	admin := fixtures.AdminUser(tenant.ID)
	student := fixtures.StudentUser(tenant.ID)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), admin)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), student)

	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	// Delete user
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/admin/users/"+student.ID, nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := server.App.Test(req, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)
	assert.True(t, response["success"].(bool))

	// Verify user is deleted
	req = httptest.NewRequest(http.MethodGet, "/api/v1/admin/users/"+student.ID, nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err = server.App.Test(req, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestUserManagement_VerifyUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin and unverified user
	admin := fixtures.AdminUser(tenant.ID)
	student := fixtures.StudentUser(tenant.ID).WithVerified(false)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), admin)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), student)

	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	// Verify user
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/users/"+student.ID+"/verify", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := server.App.Test(req, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)
	assert.True(t, response["success"].(bool))

	// Check verification status
	req = httptest.NewRequest(http.MethodGet, "/api/v1/admin/users/"+student.ID, nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err = server.App.Test(req, -1)
	require.NoError(t, err)

	json.NewDecoder(resp.Body).Decode(&response)
	data := response["data"].(map[string]interface{})
	user := data["user"].(map[string]interface{})
	assert.True(t, user["is_verified"].(bool))
}

func TestUserManagement_UnverifyUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin and verified user
	admin := fixtures.AdminUser(tenant.ID)
	student := fixtures.StudentUser(tenant.ID).WithVerified(true)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), admin)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), student)

	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	// Unverify user
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/users/"+student.ID+"/unverify", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := server.App.Test(req, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)
	assert.True(t, response["success"].(bool))

	// Check verification status
	req = httptest.NewRequest(http.MethodGet, "/api/v1/admin/users/"+student.ID, nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err = server.App.Test(req, -1)
	require.NoError(t, err)

	json.NewDecoder(resp.Body).Decode(&response)
	data := response["data"].(map[string]interface{})
	user := data["user"].(map[string]interface{})
	assert.False(t, user["is_verified"].(bool))
}

func TestUserManagement_ResetPassword(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin and target user
	admin := fixtures.AdminUser(tenant.ID)
	student := fixtures.StudentUser(tenant.ID)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), admin)
	fixtures.CreateUser(t, server.DBManager.GetControlDB(), student)

	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	tests := []struct {
		name       string
		payload    map[string]interface{}
		wantStatus int
	}{
		{
			name: "Reset password successfully",
			payload: map[string]interface{}{
				"new_password": "NewSecurePass123",
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "Fail with weak password",
			payload: map[string]interface{}{
				"new_password": "123",
			},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/users/"+student.ID+"/reset-password", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+adminToken)

			resp, err := server.App.Test(req, -1)
			require.NoError(t, err)
			assert.Equal(t, tt.wantStatus, resp.StatusCode)
		})
	}
}

func TestUserManagement_GetUsersByRole(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin and users with different roles
	admin := fixtures.AdminUser(tenant.ID)
	student1 := fixtures.StudentUser(tenant.ID)
	student2 := fixtures.StudentUser(tenant.ID).WithEmail("student2@test.com")
	instructor := fixtures.InstructorUser(tenant.ID)

	users := []*fixtures.UserFixture{admin, student1, student2, instructor}
	for _, user := range users {
		fixtures.CreateUser(t, server.DBManager.GetControlDB(), user)
	}

	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	tests := []struct {
		name       string
		role       string
		wantStatus int
		minCount   int
	}{
		{
			name:       "Get students",
			role:       "student",
			wantStatus: http.StatusOK,
			minCount:   2,
		},
		{
			name:       "Get admins",
			role:       "admin",
			wantStatus: http.StatusOK,
			minCount:   1,
		},
		{
			name:       "Get instructors",
			role:       "instructor",
			wantStatus: http.StatusOK,
			minCount:   1,
		},
		{
			name:       "Fail with invalid role",
			role:       "invalidrole",
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users/role/"+tt.role, nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)

			resp, err := server.App.Test(req, -1)
			require.NoError(t, err)
			assert.Equal(t, tt.wantStatus, resp.StatusCode)

			if tt.wantStatus == http.StatusOK {
				var response map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&response)
				data := response["data"].(map[string]interface{})
				users := data["users"].([]interface{})
				assert.GreaterOrEqual(t, len(users), tt.minCount)
			}
		})
	}
}

func TestUserManagement_CountUsersByRole(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create admin and users
	admin := fixtures.AdminUser(tenant.ID)
	student1 := fixtures.StudentUser(tenant.ID)
	student2 := fixtures.StudentUser(tenant.ID).WithEmail("student2@test.com")

	users := []*fixtures.UserFixture{admin, student1, student2}
	for _, user := range users {
		fixtures.CreateUser(t, server.DBManager.GetControlDB(), user)
	}

	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)

	// Count students
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users/role/student/count", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := server.App.Test(req, -1)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)
	data := response["data"].(map[string]interface{})
	count := int(data["count"].(float64))
	assert.GreaterOrEqual(t, count, 2)
}

func TestUserManagement_SuperAdminEndpoints(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant1 := fixtures.DefaultTenant()
	tenant2 := fixtures.NewTenantBuilder().
		WithName("Tenant 2").
		WithSlug("tenant2").
		Build()

	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant1)
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant2)

	// Create superadmin and users in different tenants
	superadmin := fixtures.SuperAdminUser(tenant1.ID)
	user1 := fixtures.StudentUser(tenant1.ID)
	user2 := fixtures.StudentUser(tenant2.ID)

	users := []*fixtures.UserFixture{superadmin, user1, user2}
	for _, user := range users {
		fixtures.CreateUser(t, server.DBManager.GetControlDB(), user)
	}

	superadminToken := helpers.GenerateTestToken(t, superadmin.ID, superadmin.Email, superadmin.Role, tenant1.ID)

	t.Run("Get users by tenant", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/superadmin/tenants/"+tenant1.ID+"/users", nil)
		req.Header.Set("Authorization", "Bearer "+superadminToken)

		resp, err := server.App.Test(req, -1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		data := response["data"].(map[string]interface{})
		users := data["users"].([]interface{})
		assert.GreaterOrEqual(t, len(users), 1)
	})

	t.Run("Count users by tenant", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/superadmin/tenants/"+tenant2.ID+"/users/count", nil)
		req.Header.Set("Authorization", "Bearer "+superadminToken)

		resp, err := server.App.Test(req, -1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		data := response["data"].(map[string]interface{})
		count := int(data["count"].(float64))
		assert.GreaterOrEqual(t, count, 1)
	})
}

func TestUserManagement_RBACEnforcement(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant)

	// Create users with different roles
	student := fixtures.StudentUser(tenant.ID)
	admin := fixtures.AdminUser(tenant.ID)
	superadmin := fixtures.SuperAdminUser(tenant.ID)

	users := []*fixtures.UserFixture{student, admin, superadmin}
	for _, user := range users {
		fixtures.CreateUser(t, server.DBManager.GetControlDB(), user)
	}

	studentToken := helpers.GenerateTestToken(t, student.ID, student.Email, student.Role, tenant.ID)
	adminToken := helpers.GenerateTestToken(t, admin.ID, admin.Email, admin.Role, tenant.ID)
	superadminToken := helpers.GenerateTestToken(t, superadmin.ID, superadmin.Email, superadmin.Role, tenant.ID)

	t.Run("Student cannot access admin endpoints", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users", nil)
		req.Header.Set("Authorization", "Bearer "+studentToken)

		resp, err := server.App.Test(req, -1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	t.Run("Admin can access admin endpoints", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := server.App.Test(req, -1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})

	t.Run("Admin cannot access superadmin endpoints", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/superadmin/tenants/"+tenant.ID+"/users", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := server.App.Test(req, -1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	})

	t.Run("SuperAdmin can access superadmin endpoints", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/superadmin/tenants/"+tenant.ID+"/users", nil)
		req.Header.Set("Authorization", "Bearer "+superadminToken)

		resp, err := server.App.Test(req, -1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})
}

func TestUserManagement_TenantIsolation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping e2e test in short mode")
	}

	// Setup
	server := helpers.SetupTestServer(t)
	tenant1 := fixtures.DefaultTenant()
	tenant2 := fixtures.NewTenantBuilder().
		WithName("Tenant 2").
		WithSlug("tenant2").
		Build()

	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant1)
	fixtures.CreateTenant(t, server.DBManager.GetControlDB(), tenant2)

	// Create admins in different tenants
	admin1 := fixtures.AdminUser(tenant1.ID)
	admin2 := fixtures.AdminUser(tenant2.ID).WithEmail("admin2@test.com")
	user1 := fixtures.StudentUser(tenant1.ID)
	user2 := fixtures.StudentUser(tenant2.ID)

	users := []*fixtures.UserFixture{admin1, admin2, user1, user2}
	for _, user := range users {
		fixtures.CreateUser(t, server.DBManager.GetControlDB(), user)
	}

	admin1Token := helpers.GenerateTestToken(t, admin1.ID, admin1.Email, admin1.Role, tenant1.ID)

	t.Run("Admin from tenant1 lists only tenant1 users when filtering by tenant", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/admin/users?tenant_id=%s", tenant1.ID), nil)
		req.Header.Set("Authorization", "Bearer "+admin1Token)

		resp, err := server.App.Test(req, -1)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		data := response["data"].(map[string]interface{})
		users := data["users"].([]interface{})

		// All returned users should belong to tenant1
		for _, u := range users {
			user := u.(map[string]interface{})
			assert.Equal(t, tenant1.ID, user["tenant_id"])
		}
	})
}
