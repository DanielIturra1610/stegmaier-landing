"""
Documentation Endpoints - Endpoints para documentación extendida
"""
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Dict, Any, List
import json
import os
from datetime import datetime

router = APIRouter(tags=["Documentation"])

@router.get(
    "/docs/examples",
    response_model=Dict[str, Any],
    summary="Ejemplos de uso de la API",
    description="Colección de ejemplos prácticos para todos los endpoints principales"
)
async def get_api_examples():
    """Retorna ejemplos de uso para todos los endpoints"""
    examples = {
        "authentication": {
            "register": {
                "method": "POST",
                "endpoint": "/api/v1/auth/register",
                "description": "Registrar nuevo usuario",
                "request": {
                    "email": "usuario@ejemplo.com",
                    "password": "contraseña123",
                    "name": "Usuario Ejemplo"
                },
                "response": {
                    "id": "user123",
                    "email": "usuario@ejemplo.com",
                    "name": "Usuario Ejemplo",
                    "role": "student",
                    "created_at": "2024-01-01T00:00:00Z"
                }
            },
            "login": {
                "method": "POST", 
                "endpoint": "/api/v1/auth/login",
                "description": "Iniciar sesión",
                "request": {
                    "email": "usuario@ejemplo.com",
                    "password": "contraseña123"
                },
                "response": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "user": {
                        "id": "user123",
                        "email": "usuario@ejemplo.com",
                        "role": "student"
                    }
                }
            }
        },
        "courses": {
            "create": {
                "method": "POST",
                "endpoint": "/api/v1/courses",
                "description": "Crear nuevo curso",
                "headers": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
                },
                "request": {
                    "title": "Introducción a React",
                    "description": "Aprende React desde cero hasta nivel avanzado",
                    "level": "beginner",
                    "category": "programming", 
                    "price": 99.99,
                    "instructor_id": "instructor123"
                },
                "response": {
                    "id": "course123",
                    "title": "Introducción a React",
                    "description": "Aprende React desde cero hasta nivel avanzado",
                    "instructor_id": "instructor123",
                    "level": "beginner",
                    "category": "programming",
                    "is_published": False,
                    "price": 99.99,
                    "created_at": "2024-01-01T00:00:00Z"
                }
            },
            "list_available": {
                "method": "GET",
                "endpoint": "/api/v1/courses/available?page=1&limit=10",
                "description": "Listar cursos disponibles públicamente",
                "response": [
                    {
                        "id": "course123",
                        "title": "Introducción a React",
                        "instructor_name": "John Doe",
                        "level": "beginner",
                        "category": "programming",
                        "price": 99.99,
                        "lessons_count": 15,
                        "enrollments_count": 120,
                        "thumbnail_url": "/media/course123/thumbnail.jpg"
                    }
                ]
            },
            "get_detail": {
                "method": "GET",
                "endpoint": "/api/v1/courses/{course_id}",
                "description": "Obtener detalles completos de un curso",
                "headers": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
                },
                "response": {
                    "id": "course123",
                    "title": "Introducción a React",
                    "description": "Curso completo de React",
                    "instructor_id": "instructor123",
                    "instructor_name": "John Doe",
                    "level": "beginner",
                    "category": "programming",
                    "is_published": True,
                    "lessons": [
                        {
                            "id": "lesson1",
                            "title": "Introducción",
                            "description": "Qué es React",
                            "order": 1,
                            "duration": 600,
                            "is_free": True
                        }
                    ]
                }
            }
        },
        "lessons": {
            "create": {
                "method": "POST",
                "endpoint": "/api/v1/lessons",
                "description": "Crear nueva lección",
                "headers": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
                },
                "request": {
                    "title": "Componentes en React",
                    "description": "Aprende sobre componentes y props",
                    "course_id": "course123",
                    "content_type": "video",
                    "order": 2,
                    "duration": 900,
                    "is_free": False,
                    "content": "Contenido de la lección..."
                },
                "response": {
                    "id": "lesson123",
                    "title": "Componentes en React", 
                    "course_id": "course123",
                    "order": 2,
                    "created_at": "2024-01-01T00:00:00Z"
                }
            }
        },
        "progress": {
            "update_video": {
                "method": "PUT",
                "endpoint": "/api/v1/progress/videos/{lesson_id}/{video_id}",
                "description": "Actualizar progreso de video",
                "headers": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
                },
                "request": {
                    "progress": 0.75,
                    "current_time": 450.5,
                    "watch_time": 450
                },
                "response": {
                    "lesson_id": "lesson123",
                    "video_id": "video123", 
                    "progress": 0.75,
                    "watch_time": 450,
                    "last_position": 450.5,
                    "completed": False,
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            },
            "create_bookmark": {
                "method": "POST",
                "endpoint": "/api/v1/progress/videos/{lesson_id}/{video_id}/bookmarks",
                "description": "Crear bookmark en video",
                "headers": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
                },
                "request": {
                    "timestamp": 180.5,
                    "title": "Concepto importante",
                    "description": "Explicación detallada de hooks"
                },
                "response": {
                    "id": "bookmark123",
                    "lesson_id": "lesson123",
                    "video_id": "video123",
                    "timestamp": 180.5,
                    "title": "Concepto importante",
                    "created_at": "2024-01-01T00:00:00Z"
                }
            },
            "get_summary": {
                "method": "GET",
                "endpoint": "/api/v1/progress/summary",
                "description": "Obtener resumen de progreso del usuario",
                "headers": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
                },
                "response": {
                    "courses_enrolled": 3,
                    "courses_completed": 1,
                    "lessons_completed": 25,
                    "total_watch_time": 7200,
                    "completion_rate": 0.65,
                    "current_streak": 5,
                    "total_points": 850,
                    "level": 4
                }
            }
        },
        "admin": {
            "dashboard": {
                "method": "GET",
                "endpoint": "/api/v1/admin/dashboard",
                "description": "Obtener métricas del dashboard administrativo",
                "headers": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
                },
                "requires_role": "admin",
                "response": {
                    "total_users": 1500,
                    "total_courses": 85,
                    "new_users_this_month": 120,
                    "published_courses": 67,
                    "total_enrollments": 3400,
                    "platform_revenue": 25750.50
                }
            },
            "get_users": {
                "method": "GET",
                "endpoint": "/api/v1/admin/users?page=1&limit=20&role=student",
                "description": "Listar usuarios con filtros",
                "headers": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
                },
                "requires_role": "admin",
                "response": {
                    "users": [
                        {
                            "id": "user123",
                            "email": "student@ejemplo.com",
                            "name": "Estudiante Ejemplo",
                            "role": "student",
                            "is_active": True,
                            "created_at": "2024-01-01T00:00:00Z"
                        }
                    ],
                    "total": 1200,
                    "page": 1,
                    "limit": 20
                }
            }
        },
        "error_examples": {
            "unauthorized": {
                "status_code": 401,
                "response": {
                    "detail": "Not authenticated"
                }
            },
            "forbidden": {
                "status_code": 403, 
                "response": {
                    "detail": "Not enough permissions"
                }
            },
            "not_found": {
                "status_code": 404,
                "response": {
                    "detail": "Course not found"
                }
            },
            "validation_error": {
                "status_code": 422,
                "response": {
                    "detail": [
                        {
                            "loc": ["body", "email"],
                            "msg": "field required",
                            "type": "value_error.missing"
                        },
                        {
                            "loc": ["body", "email"],
                            "msg": "invalid email format", 
                            "type": "value_error.email"
                        }
                    ]
                }
            }
        }
    }
    
    return examples

@router.get(
    "/docs/postman",
    response_model=Dict[str, Any],
    summary="Colección Postman",
    description="Colección Postman importable con todos los endpoints configurados"
)
async def get_postman_collection():
    """Genera colección Postman para importar"""
    collection = {
        "info": {
            "name": "Stegmaier LMS API",
            "description": "Colección completa de la API Stegmaier LMS",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "auth": {
            "type": "bearer",
            "bearer": [
                {
                    "key": "token",
                    "value": "{{jwt_token}}",
                    "type": "string"
                }
            ]
        },
        "variable": [
            {
                "key": "base_url",
                "value": "http://localhost:8000/api/v1"
            },
            {
                "key": "jwt_token",
                "value": "",
                "type": "string"
            }
        ],
        "item": [
            {
                "name": "Authentication",
                "item": [
                    {
                        "name": "Register",
                        "request": {
                            "method": "POST",
                            "header": [
                                {
                                    "key": "Content-Type",
                                    "value": "application/json"
                                }
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "email": "usuario@ejemplo.com",
                                    "password": "contraseña123", 
                                    "name": "Usuario Ejemplo"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{base_url}}/auth/register",
                                "host": ["{{base_url}}"],
                                "path": ["auth", "register"]
                            }
                        }
                    },
                    {
                        "name": "Login",
                        "request": {
                            "method": "POST",
                            "header": [
                                {
                                    "key": "Content-Type",
                                    "value": "application/json"
                                }
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "email": "usuario@ejemplo.com",
                                    "password": "contraseña123"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{base_url}}/auth/login",
                                "host": ["{{base_url}}"],
                                "path": ["auth", "login"]
                            }
                        },
                        "event": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "if (pm.response.code === 200) {",
                                        "    const response = pm.response.json();",
                                        "    pm.collectionVariables.set('jwt_token', response.access_token);",
                                        "}"
                                    ]
                                }
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Courses",
                "item": [
                    {
                        "name": "Get Available Courses",
                        "request": {
                            "method": "GET",
                            "url": {
                                "raw": "{{base_url}}/courses/available?page=1&limit=10",
                                "host": ["{{base_url}}"],
                                "path": ["courses", "available"],
                                "query": [
                                    {"key": "page", "value": "1"},
                                    {"key": "limit", "value": "10"}
                                ]
                            }
                        }
                    },
                    {
                        "name": "Create Course",
                        "request": {
                            "method": "POST",
                            "header": [
                                {
                                    "key": "Content-Type",
                                    "value": "application/json"
                                },
                                {
                                    "key": "Authorization",
                                    "value": "Bearer {{jwt_token}}"
                                }
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "title": "Curso de Ejemplo",
                                    "description": "Descripción del curso",
                                    "level": "beginner",
                                    "category": "programming",
                                    "price": 99.99
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{base_url}}/courses",
                                "host": ["{{base_url}}"],
                                "path": ["courses"]
                            }
                        }
                    }
                ]
            }
        ]
    }
    
    return collection

@router.get(
    "/docs/changelog",
    response_model=List[Dict[str, Any]],
    summary="Changelog de la API",
    description="Historial de cambios y versiones de la API"
)
async def get_changelog():
    """Retorna el changelog de versiones de la API"""
    changelog = [
        {
            "version": "1.0.0",
            "date": "2024-01-01",
            "type": "major",
            "changes": [
                "🎉 Lanzamiento inicial de la API",
                "✅ Sistema de autenticación JWT completo",
                "✅ CRUD completo de cursos y lecciones", 
                "✅ Sistema de progreso y bookmarks",
                "✅ Panel administrativo",
                "✅ Analytics básicos",
                "✅ Upload de media",
                "✅ Sistema de reviews"
            ]
        },
        {
            "version": "0.9.0",
            "date": "2023-12-15", 
            "type": "minor",
            "changes": [
                "🚀 Sistema de analytics avanzado",
                "📊 Reportes exportables (PDF, Excel)",
                "🎯 Mejoras de performance en queries",
                "🔒 Validaciones de seguridad mejoradas",
                "📱 Optimizaciones para mobile"
            ]
        },
        {
            "version": "0.8.0",
            "date": "2023-12-01",
            "type": "minor", 
            "changes": [
                "🎥 Sistema de media con CDN",
                "🗜️ Compresión automática de videos",
                "📖 Documentación interactiva",
                "🐛 Fixes de bugs menores",
                "⚡ Optimizaciones de performance"
            ]
        },
        {
            "version": "0.7.0",
            "date": "2023-11-15",
            "type": "minor",
            "changes": [
                "👨‍🏫 Sistema de roles para instructores",
                "📚 Gestión avanzada de cursos",
                "🎓 Sistema de certificados",
                "🏆 Gamificación básica",
                "📈 Métricas de engagement"
            ]
        }
    ]
    
    return changelog
