# Stegmaier Learning Platform - Backend (Golang)

Backend API multi-tenant para Stegmaier Learning Platform, construido con Go 1.25+ y Fiber V2, siguiendo arquitectura hexagonal.

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Testing](#testing)
- [Arquitectura](#arquitectura)

## ✅ Requisitos

- **Go**: 1.24 o superior (recomendado 1.25+)
- **PostgreSQL**: 14 o superior
- **Redis**: 6 o superior (para caching)
- **Docker** (opcional, para desarrollo local)

## 📁 Estructura del Proyecto

El proyecto sigue **Arquitectura Hexagonal** (Clean Architecture):

```
/
├── cmd/
│   └── api/                    # Entry point de la aplicación
│       └── main.go
│
├── internal/
│   ├── core/                   # Módulos de negocio (Domain + Use Cases)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── course/
│   │   └── ...
│   │
│   ├── shared/                 # Utilidades compartidas
│   │   ├── config/            # Configuración y variables de entorno
│   │   ├── database/          # Gestión de conexiones DB
│   │   ├── hasher/            # Password hashing
│   │   ├── tokens/            # JWT management
│   │   ├── email/             # Email service
│   │   ├── validator/         # Input validation
│   │   └── utils/             # Helpers generales
│   │
│   ├── controllers/            # HTTP handlers (Fiber)
│   │   ├── auth/
│   │   ├── user/
│   │   └── course/
│   │
│   └── server/                 # Servidor Fiber setup
│       └── server.go
│
├── db/
│   ├── migrations/             # Migraciones Control DB
│   └── migrations-tenants/     # Migraciones Tenant DBs
│
├── tests/
│   ├── unit/                   # Tests unitarios
│   ├── integration/            # Tests de integración
│   ├── e2e/                    # Tests end-to-end
│   ├── helpers/                # Test helpers
│   ├── fixtures/               # Datos de prueba
│   └── mocks/                  # Mocks de servicios
│
├── docs/                       # Documentación
│   ├── architecture.md
│   ├── api-docs/
│   └── deployment.md
│
├── go.mod                      # Dependencias Go
├── go.sum                      # Checksums de dependencias
├── .env.example                # Variables de entorno ejemplo
├── Dockerfile                  # Docker image
└── docker-compose.yml          # Setup desarrollo local
```

### Organización por Módulo (Arquitectura Hexagonal)

Cada módulo de negocio en `internal/core/` sigue esta estructura:

```
internal/core/[module]/
├── domain/                     # Capa de Dominio
│   ├── entities.go            # Entidades del dominio
│   └── dtos.go                # Data Transfer Objects
│
├── ports/                      # Interfaces (contratos)
│   └── [module].go            # Repository & Service interfaces
│
├── services/                   # Lógica de negocio (Use Cases)
│   └── [module].go            # Implementación de Service interface
│
└── adapters/                   # Adaptadores externos
    └── postgresql.go          # Implementación de Repository interface
```

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/DanielIturra1610/stegmaier-landing.git
cd stegmaier-landing
```

### 2. Verificar versión de Go

```bash
go version
# Debe ser go1.24 o superior
```

### 3. Instalar dependencias

```bash
go mod download
go mod tidy
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

## ⚙️ Configuración

Crear archivo `.env` en la raíz del proyecto:

```env
# Server
PORT=8000
ENV=development

# Database Control (metadata de tenants y usuarios)
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
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@stegmaier.com
SMTP_PASSWORD=secret
```

## 💻 Desarrollo

### Ejecutar en modo desarrollo

```bash
# Desde la raíz del proyecto
go run cmd/api/main.go
```

### Compilar el binario

```bash
go build -o bin/api cmd/api/main.go
```

### Ejecutar el binario

```bash
./bin/api
```

### Hot reload (con air)

```bash
# Instalar air
go install github.com/air-verse/air@latest

# Ejecutar con hot reload
air
```

## 🧪 Testing

### Ejecutar todos los tests

```bash
go test ./...
```

### Tests con cobertura

```bash
go test -cover ./...
```

### Tests con reporte detallado

```bash
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Tests por tipo

```bash
# Tests unitarios
go test ./tests/unit/...

# Tests de integración
go test ./tests/integration/...

# Tests E2E
go test ./tests/e2e/...
```

## 🏗️ Arquitectura

### Arquitectura Hexagonal (Clean Architecture)

Este proyecto implementa **Arquitectura Hexagonal** con las siguientes capas:

1. **Domain (Dominio)**: Entidades y reglas de negocio
   - Independiente de frameworks y bases de datos
   - Define las estructuras core del negocio

2. **Ports (Puertos)**: Interfaces y contratos
   - Repository interfaces: Acceso a datos
   - Service interfaces: Lógica de negocio

3. **Use Cases (Casos de Uso)**: Servicios de negocio
   - Implementan Service interfaces
   - Orquestan el flujo de datos
   - Contienen la lógica de negocio core

4. **Adapters (Adaptadores)**: Implementaciones concretas
   - PostgreSQL adapters: Implementan Repository interfaces
   - HTTP controllers: Exponen endpoints REST
   - External services: Email, storage, etc.

### Multi-Tenancy

El sistema implementa **database-per-tenant isolation**:

- **Control Database**: Metadata de tenants y usuarios globales
- **Tenant Databases**: Una DB por tenant con datos aislados
- **Middleware de Tenancy**: Identifica tenant por request y asigna conexión

### Principios SOLID

- **S**ingle Responsibility: Cada módulo tiene una responsabilidad única
- **O**pen/Closed: Extensible mediante interfaces
- **L**iskov Substitution: Implementaciones intercambiables via interfaces
- **I**nterface Segregation: Interfaces pequeñas y específicas
- **D**ependency Inversion: Dependencias en abstracciones (interfaces)

## 📚 Recursos Adicionales

- [Documentación Fiber V2](https://docs.gofiber.io/)
- [Go by Example](https://gobyexample.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Documentación de arquitectura](docs/architecture.md)

## 🤝 Contribución

Por favor leer [CONTRIBUTING.md](CONTRIBUTING.md) para detalles sobre el proceso de contribución.

## 📝 Licencia

Este proyecto es privado y confidencial.

---

**Última actualización**: 2025-10-24
**Versión Backend**: v0.1.0-alpha
