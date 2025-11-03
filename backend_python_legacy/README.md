# Stegmaier Learning Platform API

API backend para la plataforma de cursos online de Stegmaier, construida con FastAPI, MongoDB y arquitectura limpia.

## Estructura del Proyecto (Clean Architecture)

La arquitectura del proyecto sigue los principios de Clean Architecture, separando las responsabilidades en capas claramente definidas:

```
app/
├── api/                # Capa de presentación (API REST)
│   ├── deps.py         # Dependencias para la API (autenticación)
│   └── v1/             # Versión 1 de la API
│       ├── api.py      # Router principal
│       └── endpoints/  # Routers específicos por entidad
│           ├── auth.py
│           ├── courses.py
│           ├── enrollments.py
│           ├── lessons.py
│           ├── reviews.py
│           └── users.py
├── application/        # Capa de aplicación (casos de uso)
│   ├── dtos/           # Data Transfer Objects
│   └── services/       # Servicios de la aplicación
│       ├── auth_service.py
│       ├── course_service.py
│       ├── enrollment_service.py
│       ├── lesson_service.py
│       ├── review_service.py
│       └── user_service.py
├── core/               # Configuraciones y utilidades
│   ├── config.py       # Configuración de la aplicación
│   └── security.py     # Funciones de seguridad (JWT, contraseñas)
├── domain/             # Capa de dominio (reglas de negocio)
│   ├── entities/       # Entidades de dominio
│   └── repositories/   # Interfaces de repositorios
├── infrastructure/     # Capa de infraestructura
│   └── database/       # Implementación de repositorios
│       ├── mongodb/    # Implementación específica para MongoDB
│       └── models/     # Modelos para la base de datos
├── dependencies.py     # Inyección de dependencias
└── main.py             # Punto de entrada de la aplicación
```

### Principios de Clean Architecture Implementados

1. **Independencia de frameworks**: El dominio y la lógica de aplicación no dependen de frameworks externos.
2. **Testabilidad**: Cada capa puede ser probada de forma independiente gracias a la inyección de dependencias.
3. **Independencia de la UI**: La lógica de negocio funciona sin depender de la API REST.
4. **Independencia de la base de datos**: El dominio no conoce detalles de MongoDB.
5. **Independencia de agentes externos**: La lógica central no depende de servicios externos.

## Tecnologías Principales

- **FastAPI**: Framework web de alto rendimiento para APIs REST
- **Motor/MongoDB**: Base de datos NoSQL para almacenamiento de datos
- **Pydantic**: Validación de datos y configuración
- **JWT**: Autenticación basada en tokens
- **Docker**: Contenedorización para desarrollo y despliegue

## Configuración de Desarrollo

### Requisitos

- Python 3.11+
- Docker y Docker Compose

### Ejecución con Docker

```bash
docker-compose up
```

La API estará disponible en [http://localhost:8000](http://localhost:8000)
Documentación Swagger UI: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
Documentación ReDoc: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

### Variables de Entorno

Las principales variables de entorno que se pueden configurar son:

- `MONGODB_URL`: URL de conexión a MongoDB
- `MONGODB_DB_NAME`: Nombre de la base de datos
- `JWT_SECRET_KEY`: Clave secreta para firmar tokens JWT
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Tiempo de expiración de tokens en minutos

## Endpoints Principales

La API incluye endpoints para gestionar:

- Autenticación y usuarios
- Cursos y lecciones
- Inscripciones y progreso
- Reseñas y calificaciones

Para más detalles, consultar la documentación OpenAPI en `/api/docs`.
