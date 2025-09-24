"""
Configuración principal del router para la API v1.
"""
from fastapi import APIRouter

from .endpoints import (
    auth, users, courses, lessons, enrollments, reviews, admin, media, 
    progress, progress_course, analytics, health, modules,
    notifications, docs, monitoring, certificates, quizzes
)

api_router = APIRouter()

# Incluir todos los routers de los endpoints con tags consistentes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["Lessons"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["Enrollments"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(media.router, prefix="/media", tags=["Media"])
api_router.include_router(progress.router, prefix="/progress", tags=["Progress"])
api_router.include_router(progress_course.router, prefix="/progress", tags=["Progress"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(modules.router, prefix="", tags=["Courses"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Users"])

# Sistema de monitoreo y métricas
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring"])

# Sistema de certificados
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])

# Sistema de quizzes (router ya tiene prefix="/quizzes" internamente)
api_router.include_router(quizzes.router, prefix="", tags=["Quizzes"])

# Documentación extendida
api_router.include_router(docs.router, prefix="/docs", tags=["Documentation"])
