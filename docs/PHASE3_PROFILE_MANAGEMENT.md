# Phase 3: Profile Management Module

**Status**: 🚀 Ready to Start
**Dependencies**: ✅ Auth Module Complete | ✅ User Management Complete
**Estimated Duration**: 20-25 hours (3-4 days)
**Priority**: HIGH

---

## Overview

Implement a comprehensive user profile management system that allows users to view and update their personal information, preferences, and settings.

---

## Goals

1. **User Profile CRUD**: Complete profile management functionality
2. **Avatar Support**: Image upload and management
3. **Preferences**: User-specific settings and preferences
4. **Security**: Change password, session management
5. **Multi-tenant**: Proper tenant isolation

---

## Architecture

### Domain Layer (`internal/core/profile/domain/`)

#### Entities
```go
// entities.go
type UserProfile struct {
    UserID        uuid.UUID
    TenantID      uuid.UUID
    FirstName     string
    LastName      string
    AvatarURL     *string
    Bio           *string
    PhoneNumber   *string
    DateOfBirth   *time.Time
    Country       *string
    City          *string
    Timezone      string
    Language      string
    Theme         string // "light", "dark", "system"
    Preferences   ProfilePreferences
    CreatedAt     time.Time
    UpdatedAt     time.Time
}

type ProfilePreferences struct {
    EmailNotifications      bool
    PushNotifications       bool
    CourseReminders         bool
    WeeklyDigest           bool
    MarketingEmails        bool
    PrivateProfile         bool
    ShowProgressPublicly   bool
}

type ChangePasswordRequest struct {
    CurrentPassword string
    NewPassword     string
}
```

#### DTOs
```go
// dtos.go
type GetProfileResponse struct {
    UserID        uuid.UUID
    Email         string
    FirstName     string
    LastName      string
    AvatarURL     *string
    Bio           *string
    PhoneNumber   *string
    DateOfBirth   *string
    Country       *string
    City          *string
    Timezone      string
    Language      string
    Theme         string
    Preferences   ProfilePreferences
    Role          string
    IsVerified    bool
    CreatedAt     time.Time
    UpdatedAt     time.Time
}

type UpdateProfileRequest struct {
    FirstName     *string
    LastName      *string
    Bio           *string
    PhoneNumber   *string
    DateOfBirth   *string
    Country       *string
    City          *string
    Timezone      *string
    Language      *string
    Theme         *string
}

type UpdatePreferencesRequest struct {
    EmailNotifications      *bool
    PushNotifications       *bool
    CourseReminders         *bool
    WeeklyDigest           *bool
    MarketingEmails        *bool
    PrivateProfile         *bool
    ShowProgressPublicly   *bool
}

type UploadAvatarRequest struct {
    Image []byte
    ContentType string
}
```

### Ports Layer (`internal/core/profile/ports/`)

```go
// profile.go
type ProfileRepository interface {
    GetProfile(ctx context.Context, userID, tenantID uuid.UUID) (*domain.UserProfile, error)
    UpdateProfile(ctx context.Context, profile *domain.UserProfile) error
    UpdateAvatar(ctx context.Context, userID, tenantID uuid.UUID, avatarURL string) error
    UpdatePreferences(ctx context.Context, userID, tenantID uuid.UUID, prefs domain.ProfilePreferences) error
    DeleteAvatar(ctx context.Context, userID, tenantID uuid.UUID) error
}

type ProfileService interface {
    GetMyProfile(ctx context.Context, userID, tenantID uuid.UUID) (*domain.GetProfileResponse, error)
    UpdateMyProfile(ctx context.Context, userID, tenantID uuid.UUID, req domain.UpdateProfileRequest) error
    ChangePassword(ctx context.Context, userID, tenantID uuid.UUID, req domain.ChangePasswordRequest) error
    UploadAvatar(ctx context.Context, userID, tenantID uuid.UUID, req domain.UploadAvatarRequest) (string, error)
    DeleteAvatar(ctx context.Context, userID, tenantID uuid.UUID) error
    UpdatePreferences(ctx context.Context, userID, tenantID uuid.UUID, req domain.UpdatePreferencesRequest) error
}

type FileStorageService interface {
    UploadFile(ctx context.Context, file []byte, fileName, contentType string) (string, error)
    DeleteFile(ctx context.Context, fileURL string) error
    ValidateImage(file []byte, contentType string) error
}
```

### Services Layer (`internal/core/profile/services/`)

```go
// profile_service.go
type profileService struct {
    profileRepo   ports.ProfileRepository
    authRepo      authports.AuthRepository
    hasher        *hasher.PasswordHasher
    fileStorage   ports.FileStorageService
}

// Key Methods:
// - GetMyProfile: Retrieve authenticated user's profile
// - UpdateMyProfile: Update profile information
// - ChangePassword: Securely change password with validation
// - UploadAvatar: Handle avatar image upload with validation
// - DeleteAvatar: Remove user avatar
// - UpdatePreferences: Update user preferences
```

### Adapters Layer (`internal/core/profile/adapters/`)

```go
// postgresql.go
type PostgreSQLProfileRepository struct {
    controlDB *sqlx.DB
    tenantDB  *sqlx.DB
}

// local_file_storage.go (for development)
type LocalFileStorage struct {
    basePath string
    baseURL  string
}

// s3_storage.go (for production - future)
type S3FileStorage struct {
    bucket string
    region string
    client *s3.Client
}
```

---

## Database Schema

### Control DB - profiles table
```sql
CREATE TABLE IF NOT EXISTS profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    avatar_url      TEXT,
    bio             TEXT,
    phone_number    VARCHAR(20),
    date_of_birth   DATE,
    country         VARCHAR(100),
    city            VARCHAR(100),
    timezone        VARCHAR(50) NOT NULL DEFAULT 'UTC',
    language        VARCHAR(10) NOT NULL DEFAULT 'en',
    theme           VARCHAR(20) NOT NULL DEFAULT 'light',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_preferences (
    user_id                    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tenant_id                  UUID NOT NULL,
    email_notifications        BOOLEAN NOT NULL DEFAULT true,
    push_notifications         BOOLEAN NOT NULL DEFAULT true,
    course_reminders          BOOLEAN NOT NULL DEFAULT true,
    weekly_digest             BOOLEAN NOT NULL DEFAULT false,
    marketing_emails          BOOLEAN NOT NULL DEFAULT false,
    private_profile           BOOLEAN NOT NULL DEFAULT false,
    show_progress_publicly    BOOLEAN NOT NULL DEFAULT true,
    created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profile_preferences_tenant ON profile_preferences(tenant_id);
```

---

## API Endpoints

### Profile Management
```
GET    /api/v1/profile/me                    # Get my profile
PUT    /api/v1/profile/me                    # Update my profile
POST   /api/v1/profile/me/avatar             # Upload avatar
DELETE /api/v1/profile/me/avatar             # Delete avatar
PUT    /api/v1/profile/me/preferences        # Update preferences
POST   /api/v1/profile/me/change-password    # Change password
```

### Admin Profile Management (optional)
```
GET    /api/v1/admin/profiles/:userId        # Get user profile (admin)
PUT    /api/v1/admin/profiles/:userId        # Update user profile (admin)
```

---

## Implementation Tasks

### Issue #17: Profile Domain & Ports
**Estimated Time**: 3 hours

- [ ] Create `internal/core/profile/domain/entities.go`
- [ ] Create `internal/core/profile/domain/dtos.go`
- [ ] Create `internal/core/profile/domain/dtos_test.go`
- [ ] Create `internal/core/profile/ports/profile.go`
- [ ] Create `internal/core/profile/ports/errors.go`
- [ ] Add comprehensive unit tests

**Acceptance Criteria**:
- All domain entities properly defined with validation
- DTOs with proper JSON tags and validation rules
- All tests passing
- 80%+ test coverage

---

### Issue #18: Profile Repository (PostgreSQL)
**Estimated Time**: 5 hours

- [ ] Create `internal/core/profile/adapters/postgresql.go`
- [ ] Implement all repository methods
- [ ] Add proper SQL queries with tenant isolation
- [ ] Handle profile creation on user registration (trigger or service)
- [ ] Create integration tests in `tests/integration/profile/`

**Acceptance Criteria**:
- All repository methods implemented
- Proper error handling
- Tenant isolation enforced
- Integration tests passing
- 75%+ test coverage

---

### Issue #19: File Storage Service
**Estimated Time**: 4 hours

- [ ] Create `internal/core/profile/adapters/local_file_storage.go`
- [ ] Implement image validation (size, format, dimensions)
- [ ] Implement file upload with unique naming
- [ ] Implement file deletion
- [ ] Add configuration for upload paths and URLs
- [ ] Create unit tests with mock filesystem

**Acceptance Criteria**:
- File upload working with proper validation
- Supports JPEG, PNG, WebP formats
- Max file size: 5MB
- Proper error handling
- Unit tests passing

---

### Issue #20: Profile Service
**Estimated Time**: 5 hours

- [ ] Create `internal/core/profile/services/profile_service.go`
- [ ] Implement GetMyProfile
- [ ] Implement UpdateMyProfile with validation
- [ ] Implement ChangePassword with security checks
- [ ] Implement UploadAvatar with file validation
- [ ] Implement DeleteAvatar
- [ ] Implement UpdatePreferences
- [ ] Add comprehensive unit tests with mocks

**Acceptance Criteria**:
- All service methods implemented
- Password change requires current password validation
- Avatar upload validates image format and size
- Profile updates validated
- Unit tests with mocks passing
- 80%+ test coverage

---

### Issue #21: Profile HTTP Controllers
**Estimated Time**: 4 hours

- [ ] Create `internal/controllers/profile.go`
- [ ] Implement all profile endpoints
- [ ] Add request validation
- [ ] Add proper error responses
- [ ] Implement multipart form handling for avatar upload
- [ ] Wire up routes in `internal/server/server.go`
- [ ] Create E2E tests in `tests/e2e/profile/`

**Acceptance Criteria**:
- All endpoints responding correctly
- Proper authentication required
- Validation working
- E2E tests passing
- 75%+ test coverage

---

### Issue #22: Database Migrations
**Estimated Time**: 2 hours

- [ ] Create migration for profiles table
- [ ] Create migration for profile_preferences table
- [ ] Add trigger to create profile on user registration
- [ ] Test migrations up/down
- [ ] Update migration documentation

**Acceptance Criteria**:
- Migrations run successfully
- Rollback works correctly
- Profile auto-created on user registration
- Documentation updated

---

### Issue #23: Profile Module Integration & Testing
**Estimated Time**: 3 hours

- [ ] Integration testing with full stack
- [ ] Test profile creation on user registration
- [ ] Test avatar upload/delete flows
- [ ] Test password change flow
- [ ] Test preferences update
- [ ] Load testing with multiple users
- [ ] Update API documentation

**Acceptance Criteria**:
- All integration tests passing
- E2E flows working correctly
- No memory leaks
- Performance acceptable
- Documentation complete

---

## Testing Strategy

### Unit Tests
- Domain entities validation
- DTOs validation and mapping
- Service layer logic with mocks
- File storage with mock filesystem

### Integration Tests
- Repository with real database
- Profile CRUD operations
- Tenant isolation verification
- Transaction handling

### E2E Tests
- Complete profile management flow
- Avatar upload/delete flow
- Password change flow
- Preferences update flow
- Error scenarios

**Target Coverage**: 75-80% overall

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Users can only access their own profile
3. **Password Change**: Requires current password validation
4. **File Upload**:
   - Validate file type (whitelist: JPEG, PNG, WebP)
   - Validate file size (max 5MB)
   - Sanitize filenames
   - Store files outside web root
5. **Tenant Isolation**: All queries filtered by tenantID
6. **Input Validation**: Validate all user inputs
7. **SQL Injection**: Use parameterized queries

---

## Performance Considerations

1. **Caching**: Cache profile data with short TTL (5 minutes)
2. **Database Indexes**: Index on tenant_id for fast lookups
3. **File Storage**: Use CDN for avatar delivery (future)
4. **Lazy Loading**: Don't load preferences unless needed
5. **Connection Pooling**: Reuse database connections

---

## Future Enhancements (Phase 4+)

- [ ] S3/Cloud storage integration for avatars
- [ ] Profile visibility settings (public/private)
- [ ] Social media links
- [ ] Custom profile fields per tenant
- [ ] Profile activity history
- [ ] Two-factor authentication settings
- [ ] Session management UI
- [ ] Account deletion flow

---

## Dependencies

### Required Before Starting
- ✅ Auth module complete
- ✅ User management complete
- ✅ Database migrations setup
- ✅ Testing infrastructure

### External Libraries Needed
- `github.com/disintegration/imaging` - Image processing
- `github.com/gabriel-vasile/mimetype` - MIME type detection

---

## Success Metrics

- ✅ All 7 issues completed
- ✅ 75%+ test coverage
- ✅ All E2E tests passing
- ✅ API documentation complete
- ✅ No critical security vulnerabilities
- ✅ Performance benchmarks met (<100ms avg response time)

---

## Next Steps After Completion

1. Merge to development branch
2. Deploy to staging environment
3. Conduct manual QA testing
4. Update frontend to consume new APIs
5. Begin Phase 4: Course Module

---

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Author**: Development Team
