# 🎓 Stegmaier LMS - Learning Management System

Sistema de gestión de aprendizaje completo (LMS) desarrollado con **Go (Fiber)** en el backend y **React 18 + TypeScript** en el frontend.

[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React Version](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Inicio Rápido](#inicio-rápido)
- [Documentación](#documentación)
- [Roadmap](#roadmap)
- [Contribución](#contribución)

---

## 📖 Descripción

**Stegmaier LMS** es una plataforma completa de gestión de aprendizaje que permite a instituciones educativas:

- 👥 Gestionar usuarios con roles (Estudiantes, Instructores, Admins, SuperAdmins)
- 📚 Crear y administrar cursos
- 📝 Diseñar lecciones y contenido educativo
- ✅ Crear evaluaciones (quizzes, tareas, exámenes)
- 📊 Hacer seguimiento del progreso de estudiantes
- 🎓 Emitir certificados de finalización
- 📈 Generar reportes y analíticas

### 🏗️ Arquitectura

El proyecto sigue una **arquitectura de microservicios**:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│    Backend       │─────▶│   PostgreSQL    │
│   (React)       │      │    (Go/Fiber)    │      │   (Multi-tenant)│
└─────────────────┘      └──────────────────┘      └─────────────────┘
  • React 18             • Clean Architecture        • Control DB
  • TypeScript           • RBAC Middleware           • Tenant DBs
  • TailwindCSS          • JWT Auth                  • Migrations
  • React Router         • Multi-tenancy
  • React Query          • RESTful API
```

---

## ✨ Características

### ✅ Implementado

#### 🔐 Autenticación y Autorización
- [x] Registro de usuarios con email verification
- [x] Login con JWT (access + refresh tokens)
- [x] Password reset flow completo
- [x] RBAC con 4 roles jerárquicos
- [x] Multi-tenancy con aislamiento completo

#### 👥 Gestión de Usuarios
- [x] CRUD completo de usuarios
- [x] Filtros avanzados y paginación
- [x] Búsqueda por email/nombre
- [x] Operaciones masivas (bulk delete/update)
- [x] Estadísticas de usuarios
- [x] Gestión de roles y permisos

#### 🏢 Multi-tenancy
- [x] Aislamiento por tenant (database-level)
- [x] Control DB para datos compartidos
- [x] Tenant DBs para datos aislados
- [x] Middleware de tenant isolation

### 🚧 En Desarrollo

- [ ] **Profile Management** - Perfiles con avatares y preferencias
- [ ] **Course Module** - CRUD de cursos e inscripciones
- [ ] **Lesson Module** - Contenido educativo estructurado
- [ ] **Progress Tracking** - Seguimiento de avance
- [ ] **Quizzes & Assessments** - Sistema de evaluaciones
- [ ] **Assignments** - Tareas y calificaciones
- [ ] **Certificates** - Generación de certificados PDF
- [ ] **Notifications** - Sistema de notificaciones
- [ ] **Analytics** - Reportes y métricas

Ver [MIGRATION_BACKLOG.md](MIGRATION_BACKLOG.md) para el roadmap completo.

---

## 🛠 Tecnologías

### Backend (Go)

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Go** | 1.21+ | Lenguaje principal |
| **Fiber** | v2 | Web framework |
| **PostgreSQL** | 15+ | Base de datos principal |
| **sqlx** | latest | SQL toolkit |
| **JWT** | v5 | Autenticación |
| **Viper** | latest | Configuración |
| **Testify** | latest | Testing |
| **golang-migrate** | v4 | Migraciones |

### Frontend (React)

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 18.0+ | UI framework |
| **TypeScript** | 5.0+ | Type safety |
| **Vite** | latest | Build tool |
| **TailwindCSS** | 3.0+ | Styling |
| **React Router** | 6+ | Routing |
| **React Query** | latest | State management |
| **Formik** | latest | Forms |
| **Yup** | latest | Validation |

### DevOps

- **Docker** + **Docker Compose** - Containerización
- **GitHub Actions** - CI/CD
- **Make** - Build automation
- **Air** - Hot reload (desarrollo)

---

## 📁 Estructura del Proyecto

```
stegmaier-landing/
├── backend/                    # Backend Go (Fiber)
│   ├── cmd/api/               # Entry point
│   ├── internal/              # Código privado
│   │   ├── core/              # Lógica de negocio
│   │   │   ├── auth/          # Módulo de autenticación
│   │   │   └── user/          # Módulo de usuarios
│   │   ├── controllers/       # HTTP handlers
│   │   ├── middleware/        # Middlewares
│   │   ├── server/            # Server setup
│   │   └── shared/            # Utilidades compartidas
│   ├── migrations/            # DB migrations
│   ├── tests/                 # Tests (integration + E2E)
│   ├── Makefile              # Build commands
│   ├── go.mod                # Go dependencies
│   └── README.md             # Documentación backend
│
├── frontend/                  # Frontend React
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilities
│   ├── public/               # Static assets
│   ├── package.json          # NPM dependencies
│   └── vite.config.ts        # Vite config
│
├── backend_python_legacy/     # Backend Python antiguo (backup)
├── docs/                      # Documentación
├── scripts/                   # Scripts de utilidad
├── docker-compose.yml         # Docker Compose config
├── MIGRATION_BACKLOG.md       # Roadmap de migración
└── README.md                  # Este archivo
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Go** 1.21 o superior
- **Node.js** 18 o superior
- **PostgreSQL** 15 o superior
- **Docker** y **Docker Compose** (opcional)

### Opción 1: Con Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/DanielIturra1610/stegmaier-landing.git
cd stegmaier-landing

# 2. Iniciar todos los servicios
docker-compose up -d

# 3. Acceder a la aplicación
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080
```

### Opción 2: Desarrollo Local

#### Backend (Go)

```bash
# 1. Navegar a backend
cd backend

# 2. Instalar dependencias
go mod download

# 3. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Iniciar PostgreSQL
docker-compose up -d postgres

# 5. Ejecutar migraciones
make migrate-up

# 6. Iniciar servidor con hot reload
make dev

# O sin hot reload
make run
```

El backend estará disponible en `http://localhost:8080`

**Comandos útiles**:
```bash
make help              # Ver todos los comandos disponibles
make test              # Ejecutar tests
make test-coverage     # Tests con coverage
make lint              # Linter
make build             # Build de producción
```

#### Frontend (React)

```bash
# 1. Navegar a frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

**Comandos útiles**:
```bash
npm run dev            # Servidor de desarrollo
npm run build          # Build de producción
npm run test           # Ejecutar tests
npm run lint           # Linter
```

---

## 📚 Documentación

### Backend (Go)

- [Backend README](backend/README.md) - Documentación completa del backend
- [MIGRATION_BACKLOG.md](MIGRATION_BACKLOG.md) - Roadmap y backlog
- API Endpoints:
  - `GET /health` - Health check
  - `POST /api/v1/auth/register` - Registro
  - `POST /api/v1/auth/login` - Login
  - `GET /api/v1/admin/users` - Listar usuarios (admin)
  - Ver [Backend README](backend/README.md) para lista completa

### Frontend (React)

- Frontend README - (pendiente)
- Components documentation - (pendiente)

### Testing

```bash
# Backend tests
cd backend
make test              # Todos los tests
make test-integration  # Integration tests
make test-e2e          # E2E tests
make test-coverage     # Coverage report

# Frontend tests
cd frontend
npm test              # Unit tests
npm run test:e2e      # E2E tests
```

**Coverage actual**:
- Backend: ~75% (Auth + User Management)
- Frontend: (en desarrollo)

---

## 🗺️ Roadmap

Ver [MIGRATION_BACKLOG.md](MIGRATION_BACKLOG.md) para el roadmap completo y detallado.

### Fases de Desarrollo

#### ✅ Fase 1: Fundamentos (COMPLETADO)
- [x] Setup inicial del proyecto
- [x] Arquitectura base
- [x] Sistema de autenticación
- [x] User management
- [x] RBAC y multi-tenancy
- [x] Testing infrastructure

#### 🔄 Fase 2: Reorganización (EN CURSO)
- [x] Mover código Go a `backend/`
- [x] Estructura con mejores prácticas
- [x] Documentación completa
- [ ] CI/CD setup

#### ⏳ Fase 3: Módulos Core (PRÓXIMO)
- [ ] Profile Management
- [ ] Course Module
- [ ] Lesson Module
- [ ] Progress Tracking

#### ⏳ Fase 4: Evaluación
- [ ] Quiz Module
- [ ] Assignment Module
- [ ] Certificate Module

#### ⏳ Fase 5: Módulos Complementarios
- [ ] Notification Module
- [ ] Rating & Review Module
- [ ] Analytics Module

#### ⏳ Fase 6: Producción
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Monitoring & logging
- [ ] Production deployment

**Progreso actual**: 2/11 módulos completados (~18%)

---

## 📊 Estado del Proyecto

### Módulos Implementados

| Módulo | Estado | Tests | Docs |
|--------|--------|-------|------|
| Auth | ✅ 100% | ✅ 75% | ✅ |
| User Management | ✅ 100% | ✅ 75% | ✅ |
| Profile | 🚧 0% | ⏳ | ⏳ |
| Courses | 🚧 0% | ⏳ | ⏳ |
| Lessons | 🚧 0% | ⏳ | ⏳ |

### Métricas

- **Líneas de código**: ~15,000 (backend Go)
- **Tests**: 39 test suites (18 integration + 21 E2E)
- **Coverage**: ~75% en módulos completados
- **Endpoints**: 25+ API endpoints

---

## 🤝 Contribución

Este es un proyecto privado. Si tienes acceso y quieres contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones

- **Commits**: Seguir [Conventional Commits](https://www.conventionalcommits.org/)
- **Branches**: `feature/`, `fix/`, `docs/`, `refactor/`
- **Code Style**:
  - Go: `gofmt`, `golangci-lint`
  - TypeScript: ESLint + Prettier

---

## 📝 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 👥 Autores

- **Daniel Iturra** - *Desarrollo Principal* - [@DanielIturra1610](https://github.com/DanielIturra1610)

---

## 🙏 Agradecimientos

- [Fiber](https://gofiber.io/) - Go web framework
- [React](https://reactjs.org/) - Frontend library
- [PostgreSQL](https://www.postgresql.org/) - Database
- Comunidades de Go y React

---

## 📞 Contacto

Para más información o soporte:
- **Email**: daniel.iturra@example.com
- **GitHub**: [@DanielIturra1610](https://github.com/DanielIturra1610)

---

**⭐ Si este proyecto te resulta útil, considera darle una estrella!**

---

*Última actualización: Octubre 2024*
