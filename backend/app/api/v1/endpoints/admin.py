"""
Endpoints administrativos básicos
Aprovecha servicios existentes para funcionalidad admin
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from ....domain.entities.user import User
from ....application.services.user_service import UserService
from ....application.services.course_service import CourseService
from ....dependencies import get_user_service, get_course_service
from ...deps import get_current_admin_user

router = APIRouter()

@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service),
    course_service: CourseService = Depends(get_course_service)
):
    """Dashboard con estadísticas básicas para admin"""
    # Reutilizar métodos existentes o crear métodos simples
    return {
        "users_total": await user_service.count_all(),
        "courses_total": await course_service.count_all(), 
        "users_new_month": await user_service.count_recent(30),
        "courses_published": await course_service.count_published()
    }

@router.get("/users")
async def get_admin_users(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service)
):
    """Lista usuarios para administración"""
    return await user_service.get_all(skip=skip, limit=limit)

@router.get("/courses") 
async def get_admin_courses(
    skip: int = 0,
    limit: int = 20,
    is_published: Optional[bool] = None,
    current_user: User = Depends(get_current_admin_user),
    course_service: CourseService = Depends(get_course_service)
):
    """Lista cursos con filtros admin"""
    return await course_service.get_all_admin(
        skip=skip, 
        limit=limit, 
        is_published=is_published
    )
