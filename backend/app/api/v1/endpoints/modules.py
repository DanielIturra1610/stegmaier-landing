"""
Endpoints API para Módulos
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.application.dtos.module_dto import (
    ModuleCreate, ModuleUpdate, ModuleResponse, ModuleWithLessons,
    CourseStructureResponse, ModuleOrderUpdate, LessonAssignment
)
from app.application.services.module_service import ModuleService
from app.dependencies import get_module_service
from app.api.deps import get_current_admin_user
from app.domain.entities.user import User

router = APIRouter()

@router.post("/courses/{course_id}/modules", response_model=ModuleResponse)
async def create_module(
    course_id: str,
    module_data: ModuleCreate,
    module_service: ModuleService = Depends(get_module_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Crear nuevo módulo en un curso (Solo admins)"""
    module = await module_service.create_module(course_id, module_data.dict())
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    return ModuleResponse(**module.dict())

@router.get("/courses/{course_id}/modules", response_model=List[ModuleResponse])
async def get_course_modules(
    course_id: str,
    module_service: ModuleService = Depends(get_module_service)
):
    """Obtener todos los módulos de un curso"""
    modules = await module_service.get_course_modules(course_id)
    return [ModuleResponse(**module.dict()) for module in modules]

@router.get("/courses/{course_id}/structure", response_model=CourseStructureResponse)
async def get_course_structure(
    course_id: str,
    module_service: ModuleService = Depends(get_module_service)
):
    """Obtener estructura completa del curso con módulos y lecciones"""
    structure = await module_service.get_course_structure(course_id)
    return CourseStructureResponse(**structure)

@router.get("/modules/{module_id}", response_model=ModuleResponse)
async def get_module(
    module_id: str,
    module_service: ModuleService = Depends(get_module_service)
):
    """Obtener módulo específico"""
    module = await module_service.get_module_by_id(module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo no encontrado"
        )
    return ModuleResponse(**module.dict())

@router.get("/modules/{module_id}/with-lessons", response_model=ModuleWithLessons)
async def get_module_with_lessons(
    module_id: str,
    module_service: ModuleService = Depends(get_module_service)
):
    """Obtener módulo con sus lecciones completas"""
    module_data = await module_service.get_module_with_lessons(module_id)
    if not module_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo no encontrado"
        )
    
    # Convertir lecciones a dict para el response
    lessons_dict = [lesson.dict() for lesson in module_data["lessons"]]
    
    return ModuleWithLessons(
        **module_data["module"].dict(),
        lessons=lessons_dict,
        lessons_count=module_data["lessons_count"],
        total_duration=module_data["total_duration"]
    )

@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(
    module_id: str,
    module_data: ModuleUpdate,
    module_service: ModuleService = Depends(get_module_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Actualizar módulo (Solo admins)"""
    # Filtrar campos no nulos
    update_data = {k: v for k, v in module_data.dict().items() if v is not None}
    
    module = await module_service.update_module(module_id, update_data)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo no encontrado"
        )
    return ModuleResponse(**module.dict())

@router.delete("/modules/{module_id}")
async def delete_module(
    module_id: str,
    module_service: ModuleService = Depends(get_module_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Eliminar módulo (Solo admins)"""
    success = await module_service.delete_module(module_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo no encontrado"
        )
    return {"message": "Módulo eliminado exitosamente"}

@router.put("/courses/{course_id}/modules/reorder")
async def reorder_modules(
    course_id: str,
    module_orders: List[ModuleOrderUpdate],
    module_service: ModuleService = Depends(get_module_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Reordenar módulos de un curso (Solo admins)"""
    orders_dict = [{"module_id": item.module_id, "order": item.order} for item in module_orders]
    
    success = await module_service.reorder_course_modules(course_id, orders_dict)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al reordenar módulos"
        )
    return {"message": "Módulos reordenados exitosamente"}

@router.post("/modules/{module_id}/lessons")
async def add_lesson_to_module(
    module_id: str,
    lesson_assignment: LessonAssignment,
    module_service: ModuleService = Depends(get_module_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Agregar lección a un módulo (Solo admins)"""
    success = await module_service.add_lesson_to_module(module_id, lesson_assignment.lesson_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al agregar lección al módulo"
        )
    return {"message": "Lección agregada al módulo exitosamente"}

@router.delete("/modules/{module_id}/lessons/{lesson_id}")
async def remove_lesson_from_module(
    module_id: str,
    lesson_id: str,
    module_service: ModuleService = Depends(get_module_service),
    current_user: User = Depends(get_current_admin_user)
):
    """Remover lección de un módulo (Solo admins)"""
    success = await module_service.remove_lesson_from_module(module_id, lesson_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al remover lección del módulo"
        )
    return {"message": "Lección removida del módulo exitosamente"}
