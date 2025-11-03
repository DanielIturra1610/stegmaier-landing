"""
OpenAPI Configuration - Configuración completa de documentación API
"""
from typing import Dict, Any

# Tags para organizar endpoints en la documentación
TAGS_METADATA = [
    {
        "name": "Authentication",
        "description": "Endpoints de autenticación y autorización. Incluye login, registro, tokens y gestión de sesiones.",
    },
    {
        "name": "Users",
        "description": "Gestión de usuarios. CRUD de usuarios, perfiles y configuraciones.",
    },
    {
        "name": "Admin",
        "description": "Endpoints administrativos. Solo accesible para usuarios con role='admin'.",
    },
    {
        "name": "Courses",
        "description": "Gestión de cursos. Creación, edición, publicación y acceso a cursos.",
    },
    {
        "name": "Lessons",
        "description": "Gestión de lecciones. Contenido educativo asociado a cursos.",
    },
    {
        "name": "Enrollments",
        "description": "Sistema de inscripciones. Gestión de estudiantes inscritos en cursos.",
    },
    {
        "name": "Progress",
        "description": "Seguimiento de progreso. Tracking de videos, bookmarks y notas.",
    },
    {
        "name": "Analytics",
        "description": "Sistema de analytics. Métricas, estadísticas y seguimiento de usuarios.",
    },
    {
        "name": "Media",
        "description": "Gestión de archivos multimedia. Upload, streaming y almacenamiento.",
    },
    {
        "name": "Reviews",
        "description": "Sistema de reseñas y valoraciones de cursos.",
    },
    {
        "name": "Health",
        "description": "Health checks y monitoreo del sistema.",
    },
]

# Configuración de OpenAPI
OPENAPI_CONFIG = {
    "title": "Stegmaier LMS API",
    "description": """
## 🎓 Sistema de Gestión de Aprendizaje (LMS)

API completa para la plataforma Stegmaier LMS que permite:

### 🔐 **Características de Autenticación**
- JWT Authentication con roles (student, instructor, admin)
- Registro y login de usuarios
- Gestión de sesiones y tokens
- Cambio de contraseñas y recuperación

### 📚 **Gestión de Contenido Educativo**
- **Cursos**: Creación, edición, publicación y categorización
- **Lecciones**: Contenido multimedia (video, texto, documentos)
- **Progreso**: Tracking detallado de avance de estudiantes
- **Evaluaciones**: Sistema de quizzes y assignments

### 👥 **Gestión de Usuarios**
- **Estudiantes**: Inscripciones, progreso, certificados
- **Instructores**: Gestión de cursos y estudiantes
- **Administradores**: Panel completo de administración

### 📊 **Analytics y Reportes**
- Métricas de usuarios y cursos
- Tracking de actividad detallado
- Reportes exportables (PDF, Excel, CSV)
- Dashboard administrativo

### 🎯 **Características Avanzadas**
- Sistema de media con CDN
- Compresión automática de videos
- Sistema de bookmarks y notas
- Gamificación y certificados
- API RESTful completamente documentada

---

### 🚀 **Comenzar**

1. **Autenticarse**: Use `/auth/login` para obtener un token JWT
2. **Explorar cursos**: Use `/courses/available` para ver cursos públicos  
3. **Inscribirse**: Use `/enrollments` para inscribirse en cursos
4. **Trackear progreso**: Use `/progress/videos/{lesson_id}/{video_id}` para guardar progreso

### 🔑 **Autenticación**

Todos los endpoints protegidos requieren un token JWT en el header:
```
Authorization: Bearer {your-jwt-token}
```

### 📋 **Códigos de Estado**

- `200` - Éxito
- `201` - Recurso creado exitosamente
- `400` - Error en los datos enviados
- `401` - No autenticado
- `403` - Sin permisos suficientes
- `404` - Recurso no encontrado
- `422` - Error de validación
- `500` - Error interno del servidor

### 🏷️ **Roles de Usuario**

- **`student`** - Acceso básico, puede inscribirse y acceder a cursos
- **`instructor`** - Puede crear y gestionar sus propios cursos
- **`admin`** - Acceso completo a todas las funcionalidades

---
*Documentación generada automáticamente. Version 1.0.0*
    """,
    "version": "1.0.0",
    "terms_of_service": "https://stegmaier-lms.com/terms",
    "contact": {
        "name": "Soporte Stegmaier LMS",
        "url": "https://stegmaier-lms.com/support",
        "email": "support@stegmaier-lms.com",
    },
    "license_info": {
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    "servers": [
        {
            "url": "http://localhost:8000",
            "description": "Servidor de Desarrollo"
        },
        {
            "url": "https://api.stegmaier-lms.com",
            "description": "Servidor de Producción"
        }
    ]
}

# Ejemplos de respuesta comunes
COMMON_RESPONSES: Dict[str, Dict[str, Any]] = {
    "unauthorized": {
        "description": "No autenticado",
        "content": {
            "application/json": {
                "example": {"detail": "Not authenticated"}
            }
        }
    },
    "forbidden": {
        "description": "Sin permisos suficientes",
        "content": {
            "application/json": {
                "example": {"detail": "Not enough permissions"}
            }
        }
    },
    "not_found": {
        "description": "Recurso no encontrado",
        "content": {
            "application/json": {
                "example": {"detail": "Resource not found"}
            }
        }
    },
    "validation_error": {
        "description": "Error de validación",
        "content": {
            "application/json": {
                "example": {
                    "detail": [
                        {
                            "loc": ["body", "email"],
                            "msg": "field required",
                            "type": "value_error.missing"
                        }
                    ]
                }
            }
        }
    },
    "server_error": {
        "description": "Error interno del servidor",
        "content": {
            "application/json": {
                "example": {"detail": "Internal server error"}
            }
        }
    }
}

# Esquemas de seguridad
SECURITY_SCHEMES = {
    "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Token JWT obtenido del endpoint /auth/login"
    }
}

# Headers de respuesta comunes
COMMON_HEADERS = {
    "X-Request-ID": {
        "description": "ID único de la petición para debugging",
        "schema": {"type": "string"}
    },
    "X-Process-Time": {
        "description": "Tiempo de procesamiento en segundos",
        "schema": {"type": "number"}
    },
    "X-Cache-Rule": {
        "description": "Regla de cache aplicada",
        "schema": {"type": "string"}
    }
}

# Configuración completa para FastAPI
def get_openapi_config() -> Dict[str, Any]:
    """Retorna configuración completa de OpenAPI"""
    return {
        **OPENAPI_CONFIG,
        "openapi_tags": TAGS_METADATA,
        "components": {
            "securitySchemes": SECURITY_SCHEMES
        },
        "responses": COMMON_RESPONSES,
        "headers": COMMON_HEADERS
    }
