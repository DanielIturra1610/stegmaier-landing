"""
Configuración principal del router para la API v1.
"""
from fastapi import APIRouter

from .endpoints import auth, users, courses, lessons, enrollments, reviews

api_router = APIRouter()

# Incluir todos los routers de los endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["autenticación"])
api_router.include_router(users.router, prefix="/users", tags=["usuarios"])
api_router.include_router(courses.router, prefix="/courses", tags=["cursos"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lecciones"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["inscripciones"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reseñas"])
