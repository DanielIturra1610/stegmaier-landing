# Backlog: Migración FastAPI → Golang/Fiber V2 + Multi-Tenancy

**Proyecto**: Stegmaier Learning Platform
**Arquitectura**: Hexagonal Architecture (Clean Architecture)
**Stack Objetivo**: Go 1.24+ | Fiber V2 | PostgreSQL Multi-Tenant
**Documento de Referencia**: `mv-architecture-agent.md`

---

## Resumen Ejecutivo

### Objetivo
Migrar el backend actual de FastAPI (Python) a Golang con Fiber V2, implementando arquitectura multi-tenant con separación de bases de datos por tenant siguiendo los principios de arquitectura hexagonal.

### Estimación Total
**~360-450 horas** (9-11 semanas con 1 desarrollador a tiempo completo)

### Beneficios Esperados
- **Performance**: 5-10x mejor rendimiento vs Python
- **Escalabilidad**: Multi-tenancy nativo con aislamiento de datos
- **Mantenibilidad**: Arquitectura hexagonal con separación clara de capas
- **Type Safety**: Sistema de tipos robusto de Go
- **Deployment**: Binario único, menor footprint de memoria

---

## FASE 1: Setup e Infraestructura Base
**Duración**: 40-50 horas (1 semana)

### Issue #1: Inicialización del Proyecto Go
**Estimación**: 4 horas
**Prioridad**: CRÍTICA
**Dependencias**: Ninguna

**Tareas**:
- [ ] Inicializar módulo Go (`go mod init`)
- [ ] Configurar estructura de directorios según arquitectura hexagonal:
  ```
  /
  ├── cmd/api/              # Entry point
  ├── internal/
  │   ├── core/            # Módulos de negocio
  │   ├── shared/          # Utilidades genéricas
  │   ├── controllers/     # HTTP handlers
  │   └── server/          # Fiber server setup
  ├── db/
  │   ├── migrations/          # Control DB migrations
  │   └── migrations-tenants/  # Tenant DB migrations
  ├── tests/
  │   ├── unit/
  │   ├── integration/
  │   ├── e2e/
  │   ├── helpers/
  │   ├── fixtures/
  │   └── mocks/
  └── docs/
  ```
- [ ] Setup `.gitignore` para Go
- [ ] Configurar `go.mod` con dependencias iniciales

**Criterios de Aceptación**:
- Estructura de carpetas creada
- `go mod tidy` ejecuta sin errores
- README.md con instrucciones de setup

---

### Issue #2: Configuración de Fiber V2
**Estimación**: 6 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #1

**Tareas**:
- [ ] Instalar Fiber V2 (`github.com/gofiber/fiber/v2`)
- [ ] Crear `internal/server/server.go`:
  - Setup básico de Fiber
  - Configuración de CORS
  - Middlewares básicos (logger, recover)
- [ ] Implementar `cmd/api/main.go`:
  - Carga de variables de entorno
  - Inicialización del servidor
  - Graceful shutdown
- [ ] Configurar rate limiting
- [ ] Setup de health check endpoint `/health`

**Criterios de Aceptación**:
- Servidor arranca en puerto configurado
- Health check responde 200 OK
- CORS configurado correctamente
- Logs estructurados funcionando

---

### Issue #3: Sistema de Configuración y Variables de Entorno
**Estimación**: 5 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #1

**Tareas**:
- [ ] Instalar `github.com/joho/godotenv`
- [ ] Crear `internal/shared/config/config.go`:
  - Estructura `Config` con todas las variables
  - Función `LoadConfig()` con validación
  - Manejo de valores por defecto
- [ ] Definir variables de entorno en `.env.example`:
  ```
  # Server
  PORT=8000
  ENV=development

  # Database Control
  CONTROL_DB_HOST=localhost
  CONTROL_DB_PORT=5432
  CONTROL_DB_NAME=stegmaier_control
  CONTROL_DB_USER=postgres
  CONTROL_DB_PASSWORD=secret

  # Database Tenant Template
  TENANT_DB_HOST=localhost
  TENANT_DB_PORT=5432
  TENANT_DB_USER=postgres
  TENANT_DB_PASSWORD=secret

  # JWT
  JWT_SECRET=your-secret-key
  JWT_EXPIRATION=24h

  # Email
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=noreply@stegmaier.com
  SMTP_PASSWORD=secret
  ```
- [ ] Implementar validación de configuración requerida

**Criterios de Aceptación**:
- Config carga correctamente desde .env
- Validación falla si faltan variables críticas
- Valores por defecto aplicados donde corresponde

---

### Issue #4: Multi-Tenant Database Setup
**Estimación**: 12 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #3

**Tareas**:
- [ ] Instalar `github.com/jmoiron/sqlx` y `github.com/lib/pq`
- [ ] Crear `internal/shared/database/connection.go`:
  - Pool de conexiones para Control DB
  - Factory para conexiones a Tenant DBs
  - Función `GetTenantConnection(tenantID string)`
- [ ] Implementar `internal/shared/database/migrations.go`:
  - Ejecutor de migraciones con `golang-migrate`
  - Migraciones para Control DB
  - Migraciones para Tenant DBs
- [ ] Crear schema para **Control Database**:
  ```sql
  -- db/migrations/control/001_init_schema.up.sql
  CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    database_name VARCHAR(100) UNIQUE NOT NULL,
    node_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_users_tenant ON users(tenant_id);
  CREATE INDEX idx_users_email ON users(email);
  ```
- [ ] Crear schema template para **Tenant Databases**:
  ```sql
  -- db/migrations-tenants/001_init_tenant_schema.up.sql
  CREATE TABLE courses (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE lessons (...);
  CREATE TABLE modules (...);
  CREATE TABLE enrollments (...);
  -- ... más tablas específicas de tenant
  ```

**Criterios de Aceptación**:
- Control DB se conecta correctamente
- Migraciones de Control DB se ejecutan
- Función para crear nuevo Tenant DB funciona
- Pool de conexiones configurable
- Logs de conexiones activas

---

### Issue #5: Middleware de Multi-Tenancy
**Estimación**: 8 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #2, #4

**Tareas**:
- [ ] Crear `internal/middleware/tenant.go`:
  - Middleware `TenantMiddleware()`
  - Extracción de tenant desde:
    - Header `X-Tenant-ID`
    - Subdomain (`{tenant}.stegmaier.com`)
    - JWT claim `tenant_id`
  - Inyección de `tenantID` en Fiber context
- [ ] Crear `internal/shared/utils/tenant.go`:
  - `GetTenantID(ctx *fiber.Ctx) string`
  - `GetTenantDB(ctx *fiber.Ctx) (*sqlx.DB, error)`
  - `ValidateTenantAccess(userID, tenantID string) bool`
- [ ] Implementar caché de tenant metadata (en memoria)
- [ ] Manejo de errores para tenant no encontrado

**Criterios de Aceptación**:
- Middleware identifica tenant correctamente
- TenantID accesible desde controllers
- Conexión a Tenant DB se obtiene por request
- Error 404 cuando tenant no existe
- Performance: < 2ms overhead por request

---

### Issue #6: Módulos Compartidos (Shared Services)
**Estimación**: 10 horas
**Prioridad**: ALTA
**Dependencias**: Issue #3

**Tareas**:
- [ ] `internal/shared/hasher/hasher.go`:
  - Interface `PasswordHasher`
  - Implementación con bcrypt
  - Funciones `Hash()` y `Compare()`

- [ ] `internal/shared/tokens/jwt.go`:
  - Interface `TokenService`
  - Generación y validación de JWT
  - Claims personalizados (userID, tenantID, role)

- [ ] `internal/shared/email/email.go`:
  - Interface `EmailService`
  - Implementación SMTP genérica
  - Templates de emails (HTML)
  - Queue de emails (opcional para v1)

- [ ] `internal/shared/validator/validator.go`:
  - Validador genérico con `github.com/go-playground/validator/v10`
  - Validaciones custom (RUT chileno, etc.)
  - Mensajes de error en español

- [ ] `internal/shared/utils/`:
  - `pagination.go`: Helpers de paginación
  - `errors.go`: Errores de negocio custom
  - `response.go`: Estructura de respuestas API estándar

**Criterios de Aceptación**:
- Todos los servicios son genéricos y reutilizables
- Interfaces bien definidas
- Tests unitarios > 80% cobertura
- Documentación en godoc

---

### Issue #7: Sistema de Testing Base
**Estimación**: 8 horas
**Prioridad**: ALTA
**Dependencias**: Issue #4, #6

**Tareas**:
- [ ] Configurar `tests/helpers/database_helper.go`:
  - `CreateTestControlDB()`: Base de datos temporal de control
  - `CreateTestTenantDB()`: Base de datos temporal de tenant
  - Auto-cleanup después de cada test

- [ ] Crear `tests/helpers/api_helper.go`:
  - `CreateTestServer()`: Servidor Fiber de prueba
  - `MakeRequest()`: Helper para requests HTTP
  - `ParseJSONResponse()`: Helper para parsear respuestas

- [ ] Setup de `tests/fixtures/`:
  - `user_fixtures.go`: Usuarios de prueba
  - `tenant_fixtures.go`: Tenants de prueba

- [ ] Crear `tests/mocks/`:
  - Mocks para servicios compartidos
  - `mock_email_service.go`
  - `mock_token_service.go`

**Criterios de Aceptación**:
- Tests corren en ambiente aislado
- Database helpers crean/limpian DBs correctamente
- Fixtures reutilizables entre tests
- Mocks implementan interfaces correctamente

---

## FASE 2: Módulos Core de Autenticación
**Duración**: 50-60 horas (1.5 semanas)

### Issue #8: Auth Domain Layer
**Estimación**: 8 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #6

**Tareas**:
- [ ] Crear `internal/core/auth/domain/entities.go`:
  ```go
  type User struct {
    ID           string
    TenantID     string
    Email        string
    PasswordHash string
    FullName     string
    Role         string
    IsVerified   bool
    CreatedAt    time.Time
    UpdatedAt    time.Time
  }

  type VerificationToken struct {
    ID        string
    UserID    string
    Token     string
    ExpiresAt time.Time
  }
  ```

- [ ] Crear `internal/core/auth/domain/dtos.go`:
  ```go
  type RegisterDTO struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    FullName string `json:"full_name" validate:"required"`
  }

  type LoginDTO struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required"`
  }

  type AuthResponse struct {
    AccessToken string `json:"access_token"`
    TokenType   string `json:"token_type"`
    ExpiresIn   int    `json:"expires_in"`
    User        User   `json:"user"`
  }
  ```

**Criterios de Aceptación**:
- Entidades reflejan modelo de negocio
- DTOs con validaciones correctas
- Sin lógica de negocio (solo estructuras)

---

### Issue #9: Auth Ports (Interfaces)
**Estimación**: 4 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #8

**Tareas**:
- [ ] Crear `internal/core/auth/ports/auth.go`:
  ```go
  // Repository interface
  type AuthRepository interface {
    CreateUser(ctx context.Context, user *domain.User) error
    GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
    GetUserByID(ctx context.Context, userID string) (*domain.User, error)
    UpdateUser(ctx context.Context, user *domain.User) error
    CreateVerificationToken(ctx context.Context, token *domain.VerificationToken) error
    GetVerificationToken(ctx context.Context, token string) (*domain.VerificationToken, error)
    DeleteVerificationToken(ctx context.Context, tokenID string) error
  }

  // Service interface
  type AuthService interface {
    Register(ctx context.Context, dto *domain.RegisterDTO) (*domain.AuthResponse, error)
    Login(ctx context.Context, dto *domain.LoginDTO) (*domain.AuthResponse, error)
    VerifyEmail(ctx context.Context, token string) error
    ResendVerification(ctx context.Context, email string) error
    GetCurrentUser(ctx context.Context, userID string) (*domain.User, error)
  }
  ```

**Criterios de Aceptación**:
- Interfaces desacopladas de implementación
- Métodos documentados con godoc
- Errores de negocio definidos

---

### Issue #10: Auth Service Implementation
**Estimación**: 12 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #9

**Tareas**:
- [ ] Crear `internal/core/auth/services/auth.go`:
  - Implementar `AuthService` interface
  - Inyectar `AuthRepository`, `PasswordHasher`, `TokenService`, `EmailService`
  - Lógica de registro:
    1. Validar email único
    2. Hash de password
    3. Crear usuario
    4. Generar token verificación
    5. Enviar email
  - Lógica de login:
    1. Buscar usuario por email
    2. Verificar password
    3. Generar JWT con claims
    4. Retornar AuthResponse
  - Lógica de verificación de email
  - Lógica de reenvío de verificación

- [ ] Manejo de errores de negocio:
  - `ErrUserAlreadyExists`
  - `ErrInvalidCredentials`
  - `ErrEmailNotVerified`
  - `ErrInvalidToken`

**Criterios de Aceptación**:
- Service cumple con interface
- Lógica de negocio correcta
- Tests unitarios > 90% cobertura
- Errores bien manejados

---

### Issue #11: Auth PostgreSQL Adapter
**Estimación**: 10 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #9

**Tareas**:
- [ ] Crear `internal/core/auth/adapters/postgresql.go`:
  ```go
  type PostgreSQLAuthRepository struct {
    db *sqlx.DB // Control DB
  }

  func NewPostgreSQLAuthRepository(db *sqlx.DB) ports.AuthRepository {
    return &PostgreSQLAuthRepository{db: db}
  }

  func (r *PostgreSQLAuthRepository) CreateUser(ctx context.Context, user *domain.User) error {
    query := `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
    // ...
  }
  // Implementar todos los métodos de AuthRepository
  ```

- [ ] Implementar queries SQL optimizadas
- [ ] Manejo de errores de PostgreSQL (unique constraint, etc.)
- [ ] Tests de integración con base de datos real

**Criterios de Aceptación**:
- Adapter implementa AuthRepository interface
- Queries SQL eficientes (usar índices)
- Tests de integración > 80% cobertura
- Transacciones donde sea necesario

---

### Issue #12: Auth Controller
**Estimación**: 8 horas
**Prioridad**: CRÍTICA
**Dependencias**: Issue #10

**Tareas**:
- [ ] Crear `internal/controllers/auth/auth.go`:
  ```go
  type AuthController struct {
    authService ports.AuthService
  }

  func (c *AuthController) Register(ctx *fiber.Ctx) error {
    var dto domain.RegisterDTO
    if err := ctx.BodyParser(&dto); err != nil {
      return ctx.Status(400).JSON(fiber.Map{"error": "Invalid request"})
    }

    response, err := c.authService.Register(ctx.Context(), &dto)
    // ...
  }
  ```

- [ ] Endpoints a implementar:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/verify-email`
  - `POST /api/v1/auth/resend-verification`
  - `GET /api/v1/auth/me` (requiere JWT)

- [ ] Middleware de autenticación JWT
- [ ] Validación de inputs con validator
- [ ] Respuestas estandarizadas

**Criterios de Aceptación**:
- Todos los endpoints funcionando
- Validaciones de input correctas
- JWT middleware protege rutas
- Tests E2E > 80% cobertura

---

### Issue #13: Auth Integration Tests
**Estimación**: 6 horas
**Prioridad**: ALTA
**Dependencias**: Issue #12

**Tareas**:
- [ ] Crear `tests/integration/auth/auth_repository_test.go`
- [ ] Crear `tests/e2e/auth/register_test.go`
- [ ] Crear `tests/e2e/auth/login_test.go`
- [ ] Crear `tests/e2e/auth/verify_email_test.go`
- [ ] Setup de fixtures para tests de auth
- [ ] Mocks para EmailService

**Criterios de Aceptación**:
- Tests de integración pasan
- Tests E2E cubren flujos completos
- No hay falsos positivos
- Tests aislados entre sí

---

## FASE 3: Módulo de Usuarios
**Duración**: 30-40 horas (1 semana)

### Issue #14: User Domain & Ports
**Estimación**: 6 horas
**Prioridad**: ALTA
**Dependencias**: Issue #8

**Tareas**:
- [ ] `internal/core/user/domain/entities.go`:
  - Extender User entity con más propiedades
  - Profile, preferences, settings

- [ ] `internal/core/user/domain/dtos.go`:
  - `UpdateProfileDTO`
  - `ChangePasswordDTO`
  - `UserFiltersDTO` (paginación, búsqueda)

- [ ] `internal/core/user/ports/user.go`:
  - UserRepository interface
  - UserService interface

**Criterios de Aceptación**:
- DTOs con validaciones
- Interfaces bien definidas

---

### Issue #15: User Service & Repository
**Estimación**: 10 horas
**Prioridad**: ALTA
**Dependencias**: Issue #14

**Tareas**:
- [ ] `internal/core/user/services/user.go`:
  - GetProfile
  - UpdateProfile
  - ChangePassword
  - ListUsers (admin)
  - DeleteUser (soft delete)

- [ ] `internal/core/user/adapters/postgresql.go`:
  - Implementar UserRepository
  - Queries optimizadas

**Criterios de Aceptación**:
- Lógica de negocio correcta
- Tests unitarios > 85%

---

### Issue #16: User Controller & Routes
**Estimación**: 8 horas
**Prioridad**: ALTA
**Dependencias**: Issue #15

**Tareas**:
- [ ] `internal/controllers/user/user.go`
- [ ] Endpoints:
  - `GET /api/v1/users/me`
  - `PUT /api/v1/users/me`
  - `POST /api/v1/users/change-password`
  - `GET /api/v1/users` (admin only)
  - `DELETE /api/v1/users/:id` (admin only)

**Criterios de Aceptación**:
- RBAC implementado (admin vs student)
- Tests E2E completos

---

### Issue #17: User Tests
**Estimación**: 6 horas
**Prioridad**: MEDIA
**Dependencias**: Issue #16

---

## FASE 4: Módulo de Courses (Tenant-Specific)
**Duración**: 40-50 horas (1.5 semanas)

### Issue #18: Course Domain Layer
**Estimación**: 8 horas
**Prioridad**: ALTA
**Dependencias**: Issue #5 (Multi-tenancy)

**Tareas**:
- [ ] `internal/core/course/domain/entities.go`:
  ```go
  type Course struct {
    ID           string
    TenantID     string  // Importante para multi-tenancy
    Title        string
    Description  string
    InstructorID string
    Category     string
    Level        string
    IsPublished  bool
    CreatedAt    time.Time
  }
  ```

- [ ] `internal/core/course/domain/dtos.go`:
  - CreateCourseDTO
  - UpdateCourseDTO
  - CourseFiltersDTO
  - CourseResponseDTO

**Criterios de Aceptación**:
- Entities incluyen TenantID
- DTOs validados

---

### Issue #19: Course Service (Multi-Tenant)
**Estimación**: 12 horas
**Prioridad**: ALTA
**Dependencias**: Issue #18

**Tareas**:
- [ ] `internal/core/course/services/course.go`:
  - CreateCourse (en Tenant DB)
  - GetCourse (con validación de tenant)
  - ListCourses (filtrado por tenant)
  - UpdateCourse
  - PublishCourse
  - DeleteCourse (soft delete)

- [ ] Validación de tenant en cada operación
- [ ] RBAC: Solo instructores pueden crear

**Criterios de Aceptación**:
- Datos aislados por tenant
- Tests de aislamiento de tenant

---

### Issue #20: Course Repository (Tenant DB)
**Estimación**: 10 horas
**Prioridad**: ALTA
**Dependencias**: Issue #19

**Tareas**:
- [ ] `internal/core/course/adapters/postgresql.go`:
  - Implementar CourseRepository
  - Queries a **Tenant Database** (no Control DB)
  - Índices por tenant_id

- [ ] Migración de tabla courses en Tenant DB:
  ```sql
  CREATE TABLE courses (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID NOT NULL,
    category VARCHAR(100),
    level VARCHAR(50),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_courses_tenant ON courses(tenant_id);
  ```

**Criterios de Aceptación**:
- Conexión a Tenant DB correcta
- Tests de integración con tenant DB

---

### Issue #21: Course Controller
**Estimación**: 8 horas
**Prioridad**: ALTA
**Dependencias**: Issue #20

**Tareas**:
- [ ] `internal/controllers/course/course.go`
- [ ] Endpoints:
  - `POST /api/v1/courses`
  - `GET /api/v1/courses`
  - `GET /api/v1/courses/:id`
  - `PUT /api/v1/courses/:id`
  - `DELETE /api/v1/courses/:id`
  - `POST /api/v1/courses/:id/publish`

**Criterios de Aceptación**:
- Multi-tenancy verificado en cada endpoint
- Tests E2E con múltiples tenants

---

### Issue #22: Course Tests
**Estimación**: 6 horas
**Prioridad**: MEDIA
**Dependencias**: Issue #21

---

## FASE 5: Módulos Adicionales (Lessons, Modules, etc.)
**Duración**: 80-100 horas (2-2.5 semanas)

### Issue #23-30: Implementar módulos restantes
Repetir patrón de Issues #18-22 para cada módulo:

- **Issue #23**: Lessons Module (12 horas)
- **Issue #24**: Modules Module (12 horas)
- **Issue #25**: Enrollments Module (15 horas) - Lógica compleja
- **Issue #26**: Progress Module (15 horas) - Analytics
- **Issue #27**: Quizzes Module (18 horas) - Lógica de evaluación
- **Issue #28**: Certificates Module (10 horas)
- **Issue #29**: Notifications Module (10 horas)
- **Issue #30**: Media/Upload Module (12 horas) - S3 integration

**Criterios Generales**:
- Seguir arquitectura hexagonal
- Multi-tenancy en todos los módulos
- Tests > 80% cobertura
- Documentación completa

---

## FASE 6: Features Avanzadas
**Duración**: 40-50 horas (1 semana)

### Issue #31: Analytics & Reporting
**Estimación**: 12 horas

**Tareas**:
- [ ] Agregaciones de datos por tenant
- [ ] Dashboard de instructor
- [ ] Métricas de estudiante
- [ ] Exportación de reportes (CSV, PDF)

---

### Issue #32: Admin Dashboard
**Estimación**: 10 horas

**Tareas**:
- [ ] Panel de gestión de usuarios
- [ ] Panel de gestión de cursos
- [ ] Estadísticas generales
- [ ] Logs de auditoría

---

### Issue #33: Reviews & Ratings
**Estimación**: 8 horas

---

### Issue #34: File Upload & Media Management
**Estimación**: 10 horas

**Tareas**:
- [ ] Integración con S3/MinIO
- [ ] Upload de videos
- [ ] Procesamiento de imágenes
- [ ] CDN setup

---

## FASE 7: Performance & Optimización
**Duración**: 30-40 horas (1 semana)

### Issue #35: Caching Layer
**Estimación**: 10 horas

**Tareas**:
- [ ] Redis integration
- [ ] Cache de metadata de tenants
- [ ] Cache de cursos populares
- [ ] Invalidación de cache

---

### Issue #36: Database Optimization
**Estimación**: 8 horas

**Tareas**:
- [ ] Índices optimizados
- [ ] Query performance tuning
- [ ] Connection pooling ajustado
- [ ] Explain analyze de queries críticos

---

### Issue #37: API Rate Limiting
**Estimación**: 6 horas

**Tareas**:
- [ ] Rate limiting por tenant
- [ ] Rate limiting por IP
- [ ] Estrategia de backoff

---

### Issue #38: Observability
**Estimación**: 10 horas

**Tareas**:
- [ ] Structured logging
- [ ] Prometheus metrics
- [ ] Distributed tracing (Jaeger/OpenTelemetry)
- [ ] Error tracking (Sentry)

---

## FASE 8: Testing & QA
**Duración**: 30-40 horas (1 semana)

### Issue #39: Comprehensive Test Suite
**Estimación**: 15 horas

**Tareas**:
- [ ] Completar tests unitarios faltantes
- [ ] Tests de integración completos
- [ ] Tests E2E de flujos críticos
- [ ] Tests de performance (benchmarks)

---

### Issue #40: Multi-Tenant Testing
**Estimación**: 10 horas

**Tareas**:
- [ ] Tests de aislamiento de datos
- [ ] Tests de performance con múltiples tenants
- [ ] Tests de failover de tenant DB
- [ ] Tests de migración de tenant

---

### Issue #41: Security Testing
**Estimación**: 8 horas

**Tareas**:
- [ ] OWASP Top 10 checks
- [ ] SQL injection prevention tests
- [ ] XSS prevention tests
- [ ] JWT security tests
- [ ] RBAC tests exhaustivos

---

## FASE 9: Deployment & DevOps
**Duración**: 25-30 horas (3-4 días)

### Issue #42: Docker Setup
**Estimación**: 6 horas

**Tareas**:
- [ ] Dockerfile multi-stage para Go app
- [ ] docker-compose.yml para desarrollo:
  - API service
  - PostgreSQL Control DB
  - PostgreSQL Tenant DB template
  - Redis
  - MinIO (S3 local)

---

### Issue #43: CI/CD Pipeline
**Estimación**: 8 horas

**Tareas**:
- [ ] GitHub Actions workflow:
  - Build & test
  - Lint (golangci-lint)
  - Security scan
  - Docker image build
  - Deploy to staging
- [ ] Automated migrations

---

### Issue #44: Production Deployment
**Estimación**: 8 horas

**Tareas**:
- [ ] Infrastructure as Code (Terraform/Pulumi)
- [ ] Kubernetes manifests / Helm charts
- [ ] Load balancer setup
- [ ] SSL/TLS certificates
- [ ] Environment configuration
- [ ] Monitoring setup

---

### Issue #45: Database Migrations Strategy
**Estimación**: 4 horas

**Tareas**:
- [ ] Estrategia de rollback
- [ ] Migrations testing
- [ ] Zero-downtime deployment strategy
- [ ] Multi-tenant migration tooling

---

## FASE 10: Documentación
**Duración**: 20-25 horas (3 días)

### Issue #46: API Documentation
**Estimación**: 8 horas

**Tareas**:
- [ ] OpenAPI/Swagger spec
- [ ] Swagger UI integration
- [ ] Postman collection
- [ ] API examples y uso

---

### Issue #47: Architecture Documentation
**Estimación**: 6 horas

**Tareas**:
- [ ] Diagramas de arquitectura
- [ ] Multi-tenancy diagram
- [ ] Database schema diagrams
- [ ] Deployment architecture

---

### Issue #48: Developer Documentation
**Estimación**: 6 horas

**Tareas**:
- [ ] Setup guide
- [ ] Contributing guide
- [ ] Code style guide
- [ ] Testing guide
- [ ] Deployment guide

---

### Issue #49: User & Admin Guides
**Estimación**: 4 horas

**Tareas**:
- [ ] User manual
- [ ] Admin manual
- [ ] FAQ
- [ ] Troubleshooting guide

---

## FASE 11: Migration from FastAPI
**Duración**: 20-30 horas (3-4 días)

### Issue #50: Data Migration Tools
**Estimación**: 12 horas

**Tareas**:
- [ ] Script de migración de PostgreSQL actual a Control DB
- [ ] Script de migración de datos a Tenant DBs
- [ ] Validación de integridad de datos
- [ ] Rollback strategy

---

### Issue #51: Parallel Running
**Estimación**: 6 horas

**Tareas**:
- [ ] Run FastAPI y Golang en paralelo
- [ ] Comparación de respuestas
- [ ] Shadow traffic testing

---

### Issue #52: Cutover Plan
**Estimación**: 4 horas

**Tareas**:
- [ ] Checklist de migración
- [ ] DNS switchover plan
- [ ] Rollback plan
- [ ] Communication plan

---

## RESUMEN DE ESTIMACIONES

### Por Fase

| Fase | Descripción | Horas | Días (8h) |
|------|-------------|-------|-----------|
| 1 | Setup e Infraestructura | 50 | 6.3 |
| 2 | Auth Module | 60 | 7.5 |
| 3 | User Module | 40 | 5.0 |
| 4 | Course Module | 50 | 6.3 |
| 5 | Modules Adicionales | 100 | 12.5 |
| 6 | Features Avanzadas | 50 | 6.3 |
| 7 | Performance & Optimización | 40 | 5.0 |
| 8 | Testing & QA | 40 | 5.0 |
| 9 | Deployment & DevOps | 30 | 3.8 |
| 10 | Documentación | 25 | 3.1 |
| 11 | Migration from FastAPI | 30 | 3.8 |
| **TOTAL** | **~450 horas** | **~56 días laborales** |

### Con 1 Desarrollador Full-Time
- **11-12 semanas** (2.5-3 meses)

### Con 2 Desarrolladores
- **6-7 semanas** (1.5 meses) - con coordinación efectiva

---

## RIESGOS Y MITIGACIONES

### Riesgos Técnicos

1. **Complejidad de Multi-Tenancy**
   - **Mitigación**: Implementar y testear exhaustivamente desde Fase 1
   - **Tiempo buffer**: +15 horas

2. **Performance de conexiones DB**
   - **Mitigación**: Connection pooling robusto, monitoreo temprano
   - **Tiempo buffer**: +10 horas

3. **Data Migration Failures**
   - **Mitigación**: Scripts de validación, rollback automático
   - **Tiempo buffer**: +8 horas

### Riesgos de Proyecto

1. **Scope Creep**
   - **Mitigación**: Definir MVP claro, postergar features no críticas

2. **Bugs del Sistema Actual**
   - **Mitigación**: No replicar bugs, documentar cambios de comportamiento

3. **Falta de Documentación FastAPI**
   - **Mitigación**: Code reading sessions, pair programming

---

## HITOS CRÍTICOS (Milestones)

### Milestone 1: MVP Backend (Semana 4)
- Auth + Users funcionando
- Multi-tenancy operativo
- Tests base implementados

### Milestone 2: Core Features (Semana 7)
- Courses, Lessons, Modules
- Enrollments, Progress
- Tests de integración completos

### Milestone 3: Full Feature Parity (Semana 10)
- Todas las features de FastAPI migradas
- Performance optimizada
- Documentación completa

### Milestone 4: Production Ready (Semana 12)
- CI/CD funcionando
- Data migrated
- Monitoring activo

---

## DEPENDENCIAS EXTERNAS

### Tecnologías a Integrar

1. **Base de Datos**
   - PostgreSQL 14+ (multi-tenant setup)
   - Redis 6+ (caching)

2. **Storage**
   - AWS S3 / MinIO (media files)
   - CDN (CloudFlare/CloudFront)

3. **Email**
   - SMTP / SendGrid / AWS SES

4. **Monitoring**
   - Prometheus + Grafana
   - Sentry (error tracking)
   - Jaeger (tracing)

5. **Infrastructure**
   - Docker
   - Kubernetes / AWS ECS
   - GitHub Actions

---

## MÉTRICAS DE ÉXITO

### Performance
- [ ] Response time < 100ms (p95)
- [ ] Throughput > 1000 req/s
- [ ] Memory usage < 200MB por instancia
- [ ] CPU usage < 50% bajo carga normal

### Quality
- [ ] Test coverage > 80%
- [ ] Zero critical bugs en producción (primer mes)
- [ ] API uptime > 99.9%

### Developer Experience
- [ ] Build time < 30s
- [ ] Test suite ejecuta en < 5min
- [ ] Setup de desarrollo en < 30min

---

## RECOMENDACIONES

### Priorización
1. **Fase 1-2 son CRÍTICAS**: No avanzar sin estas bases sólidas
2. **Fase 5 puede paralelizarse**: Múltiples módulos independientes
3. **Fase 11 debe planificarse con tiempo**: Migration tiene riesgos

### Equipo Ideal
- **1 Backend Senior Go**: Lead técnico, arquitectura
- **1-2 Backend Mid/Junior**: Implementación de módulos
- **1 DevOps**: CI/CD, infrastructure

### Tooling Recomendado
- **IDE**: GoLand / VS Code con Go extension
- **Linting**: golangci-lint
- **Testing**: testify, gomock
- **Migrations**: golang-migrate
- **API Testing**: Postman / Insomnia

---

**Fecha de Creación**: 2025-10-22
**Versión**: 1.0
**Autor**: Technical Architecture Team
**Próxima Revisión**: Después de Milestone 1

