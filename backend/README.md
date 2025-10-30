# 🎓 Stegmaier LMS - Backend (Go)

Backend API para Stegmaier Learning Management System, construido con Go y Fiber siguiendo arquitectura hexagonal.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## ✨ Características

### Implementado ✅

- **Autenticación y Autorización**
  - JWT tokens (access + refresh)
  - Email verification
  - Password reset
  - RBAC (Role-Based Access Control)
  - 4 roles con jerarquía: SuperAdmin > Admin > Instructor > Student

- **User Management**
  - CRUD completo de usuarios
  - Filtros avanzados y paginación
  - Bulk operations (delete, update role)
  - User statistics
  - Tenant isolation

- **Multi-tenancy**
  - Aislamiento completo por tenant
  - Control DB + Tenant DBs
  - Middleware de tenant isolation

- **Infrastructure**
  - PostgreSQL con multi-tenancy
  - Database migrations
  - Configuration management
  - Docker support
  - Comprehensive testing (integration + E2E)

### En Desarrollo 🚧

Ver [MIGRATION_BACKLOG.md](../MIGRATION_BACKLOG.md) para el roadmap completo.

---

## 🛠 Tecnologías

- **Language**: Go 1.21+
- **Web Framework**: [Fiber v2](https://gofiber.io/)
- **Database**: PostgreSQL 15+
- **ORM/Query Builder**: [sqlx](https://github.com/jmoiron/sqlx)
- **Migrations**: [golang-migrate](https://github.com/golang-migrate/migrate)
- **Authentication**: JWT ([golang-jwt](https://github.com/golang-jwt/jwt))
- **Validation**: [go-playground/validator](https://github.com/go-playground/validator)
- **Configuration**: [Viper](https://github.com/spf13/viper)
- **Password Hashing**: bcrypt
- **Testing**: Native Go testing + [testify](https://github.com/stretchr/testify)
- **Containerization**: Docker + Docker Compose

---

## 🏗 Arquitectura

Este proyecto sigue **Clean Architecture (Hexagonal Architecture)** con las siguientes capas:

```
┌─────────────────────────────────────────────────────┐
│                   HTTP Layer                        │
│              (Controllers/Handlers)                 │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                 Service Layer                       │
│             (Business Logic)                        │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│               Repository Layer                      │
│             (Data Access)                           │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  Database                           │
│                (PostgreSQL)                         │
└─────────────────────────────────────────────────────┘
```

### Estructura de Carpetas

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Punto de entrada
├── internal/
│   ├── core/                    # Lógica de negocio
│   │   ├── auth/
│   │   │   ├── domain/          # Entidades y reglas
│   │   │   ├── ports/           # Interfaces
│   │   │   ├── services/        # Implementación de negocio
│   │   │   └── adapters/        # Repositorios
│   │   └── user/
│   ├── controllers/             # HTTP handlers
│   ├── middleware/              # Middlewares
│   ├── server/                  # Server setup
│   └── shared/                  # Código compartido
│       ├── config/
│       ├── database/
│       ├── tokens/
│       ├── hasher/
│       └── validator/
├── migrations/                  # DB migrations
│   ├── control/
│   ├── tenants/
│   └── shared/
├── tests/                       # Tests
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/
│   └── helpers/
├── configs/                     # Config files
├── scripts/                     # Utility scripts
├── docs/                        # Documentation
├── go.mod
├── go.sum
├── Makefile                     # Build commands
└── Dockerfile
```

---

## 📦 Requisitos Previos

- **Go**: 1.21 o superior
- **PostgreSQL**: 15 o superior
- **Docker** (opcional): Para desarrollo con contenedores
- **Make** (opcional): Para usar comandos del Makefile

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/DanielIturra1610/stegmaier-landing.git
cd stegmaier-landing/backend
```

### 2. Instalar dependencias

```bash
go mod download
```

### 3. Configurar variables de entorno

Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Server
SERVER_PORT=8080
SERVER_HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=stegmaier_control
DB_SSL_MODE=disable

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=168h

# Environment
ENV=development
```

### 4. Iniciar base de datos

**Opción A - Docker Compose** (recomendado):

```bash
docker-compose up -d postgres
```

**Opción B - PostgreSQL local**:

Asegúrate de tener PostgreSQL corriendo localmente y crear las bases de datos:

```sql
CREATE DATABASE stegmaier_control;
```

### 5. Ejecutar migraciones

```bash
make migrate-up
```

O manualmente:

```bash
go run cmd/api/main.go migrate up
```

### 6. Ejecutar el servidor

```bash
make dev   # Con hot reload (requiere 'air')
# o
make run   # Sin hot reload
```

El servidor estará disponible en `http://localhost:8080`

---

## 💻 Uso

### Usando Makefile

El proyecto incluye un Makefile con comandos útiles:

```bash
# Ver todos los comandos disponibles
make help

# Desarrollo
make dev              # Iniciar con hot reload
make run              # Iniciar sin hot reload
make build            # Construir binary

# Testing
make test             # Ejecutar todos los tests
make test-coverage    # Tests con coverage
make test-integration # Solo integration tests
make test-e2e         # Solo E2E tests

# Database
make migrate-up       # Aplicar migrations
make migrate-down     # Revertir migration
make db-reset         # Resetear DB

# Docker
make docker-up        # Iniciar containers
make docker-down      # Detener containers
make docker-logs      # Ver logs

# Code quality
make fmt              # Formatear código
make lint             # Linter
make vet              # Go vet
```

### Sin Makefile

```bash
# Desarrollo
go run cmd/api/main.go

# Build
go build -o bin/server cmd/api/main.go

# Tests
go test ./...
go test -v ./tests/integration/...
go test -v ./tests/e2e/...

# Migrations
go run cmd/api/main.go migrate up
go run cmd/api/main.go migrate down
```

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/v1/auth/register           # Registrar usuario
POST   /api/v1/auth/login              # Login
POST   /api/v1/auth/refresh            # Refresh token
POST   /api/v1/auth/logout             # Logout
POST   /api/v1/auth/verify-email       # Verificar email
POST   /api/v1/auth/forgot-password    # Solicitar reset
POST   /api/v1/auth/reset-password     # Resetear password
GET    /api/v1/auth/me                 # Usuario actual
PUT    /api/v1/auth/change-password    # Cambiar password
```

### User Management (Admin/SuperAdmin)

```
# Admin routes
POST   /api/v1/admin/users                        # Crear usuario
GET    /api/v1/admin/users                        # Listar usuarios
GET    /api/v1/admin/users/:id                    # Obtener usuario
PUT    /api/v1/admin/users/:id                    # Actualizar usuario
DELETE /api/v1/admin/users/:id                    # Eliminar usuario
POST   /api/v1/admin/users/:id/verify             # Verificar usuario
POST   /api/v1/admin/users/:id/unverify           # Desverificar usuario
POST   /api/v1/admin/users/:id/reset-password     # Reset password
POST   /api/v1/admin/users/:id/force-password-change
GET    /api/v1/admin/users/role/:role             # Usuarios por rol
GET    /api/v1/admin/users/role/:role/count       # Contar por rol

# SuperAdmin routes
GET    /api/v1/superadmin/tenants/:id/users       # Usuarios de tenant
GET    /api/v1/superadmin/tenants/:id/users/count # Contar usuarios
```

### Health Check

```
GET    /health                         # Health check
GET    /api/v1/health                  # API health
```

Ver [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) para documentación completa.

---

## 🧪 Testing

El proyecto tiene coverage extenso con diferentes tipos de tests:

### Ejecutar Tests

```bash
# Todos los tests
make test

# Solo integration tests
make test-integration

# Solo E2E tests
make test-e2e

# Con coverage
make test-coverage
```

### Tipos de Tests

1. **Unit Tests**: Lógica de negocio aislada
2. **Integration Tests**: Interacción con base de datos real
3. **E2E Tests**: Flujos completos HTTP → DB → Response

### Coverage Actual

- Auth Module: ~75%
- User Management: ~75%
- **Total**: ~75%

### Escribir Tests

Los tests siguen esta estructura:

```go
func TestFeature_Scenario(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration test")
    }

    // Setup
    testDB := helpers.CreateTestControlDB(t)
    // ... setup code

    // Execute
    result, err := service.DoSomething(ctx, input)

    // Assert
    require.NoError(t, err)
    assert.Equal(t, expected, result)
}
```

Ver [TESTING.md](./docs/TESTING.md) para más detalles.

---

## 🐳 Docker

### Desarrollo con Docker

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Docker Compose Services

- **postgres**: Base de datos PostgreSQL
- **backend**: API Go (Fiber)
- **frontend**: React app (opcional)

---

## 🚢 Deployment

### Build de Producción

```bash
# Build optimizado
make build-prod

# O manualmente
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -ldflags="-w -s" \
  -o bin/server \
  cmd/api/main.go
```

### Deployment con Docker

```bash
# Build imagen de producción
docker build -t stegmaier-backend:latest .

# Run container
docker run -d \
  -p 8080:8080 \
  --env-file .env.production \
  stegmaier-backend:latest
```

### Variables de Entorno de Producción

```env
ENV=production
SERVER_PORT=8080
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=stegmaier_control
DB_SSL_MODE=require
JWT_SECRET=your-very-secure-secret-key-at-least-32-chars
```

---

## 📚 Documentación Adicional

- [MIGRATION_BACKLOG.md](../MIGRATION_BACKLOG.md) - Roadmap de migración Python → Go
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Decisiones arquitectónicas
- [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) - Documentación completa de API
- [TESTING.md](./docs/TESTING.md) - Guía de testing
- [CONTRIBUTING.md](./docs/CONTRIBUTING.md) - Guía de contribución

---

## 🤝 Contributing

Ver [CONTRIBUTING.md](./docs/CONTRIBUTING.md) para guías de contribución.

### Quick Start para Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 👥 Autores

- **Daniel Iturra** - *Desarrollo Principal* - [@DanielIturra1610](https://github.com/DanielIturra1610)

---

## 📞 Soporte

Para soporte, email: [tu-email@example.com](mailto:tu-email@example.com)

---

## 🙏 Agradecimientos

- [Fiber](https://gofiber.io/) - Web framework
- [sqlx](https://github.com/jmoiron/sqlx) - SQL toolkit
- [golang-migrate](https://github.com/golang-migrate/migrate) - Database migrations
- Comunidad de Go

---

**⭐ Si este proyecto te ayuda, considera darle una estrella!**

---

*Última actualización: Octubre 2024*
