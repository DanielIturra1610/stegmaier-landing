"""
Endpoints para la gestión de lecciones
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status

from ....application.services.lesson_service import LessonService
from ....application.services.course_service import CourseService
from ....application.dtos.lesson_dto import (
    LessonResponse, LessonCreate, LessonUpdate, LessonOrderUpdate
)
from ....domain.entities.user import User
from ....dependencies import get_lesson_service, get_course_service
from ...deps import get_current_active_user, get_current_instructor_user

router = APIRouter()

@router.get("/course/{course_id}", response_model=List[LessonResponse], summary="Obtener lecciones de un curso")
async def get_course_lessons(
    course_id: str = Path(..., description="ID del curso"),
    lesson_service: LessonService = Depends(get_lesson_service),
    course_service: CourseService = Depends(get_course_service),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """
    Obtiene todas las lecciones de un curso específico.
    
    - **course_id**: ID del curso
    """
    # Verificar que el curso exista
    course = await course_service.get_course_by_id(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    
    # Verificar permisos para ver lecciones de cursos no publicados
    if not course.is_published:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver las lecciones de este curso"
            )
        
        # Solo el instructor del curso y los administradores pueden ver lecciones de cursos no publicados
        if current_user.id != course.instructor_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver las lecciones de este curso no publicado"
            )
    
    return await lesson_service.get_lessons_by_course(course_id)


@router.get("/{lesson_id}", response_model=LessonResponse, summary="Obtener lección por ID")
async def get_lesson_by_id(
    lesson_id: str = Path(..., description="ID de la lección"),
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """
    Obtiene la información detallada de una lección específica.
    
    - **lesson_id**: ID de la lección a consultar
    """
    lesson = await lesson_service.get_lesson_by_id(lesson_id)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lección no encontrada"
        )
    
    # Verificar permisos (se debe comprobar si el curso está publicado)
    course = await lesson_service.get_course_by_lesson(lesson_id)
    
    if not course.is_published:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver esta lección"
            )
        
        # Solo el instructor del curso y los administradores pueden ver lecciones de cursos no publicados
        if current_user.id != course.instructor_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver esta lección"
            )
    
    return lesson


@router.post("/course/{course_id}", response_model=LessonResponse, status_code=status.HTTP_201_CREATED, summary="Crear una nueva lección")
async def create_lesson(
    lesson_data: LessonCreate,
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_instructor_user),
    lesson_service: LessonService = Depends(get_lesson_service),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Crea una nueva lección dentro de un curso específico.
    
    Requiere permisos de instructor (propietario del curso) o administrador.
    
    - **course_id**: ID del curso donde se creará la lección
    - **lesson_data**: Datos de la lección a crear
    """
    # Verificar que el curso exista
    course = await course_service.get_course_by_id(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    
    # Verificar que el usuario sea el instructor del curso o administrador
    if current_user.id != course.instructor_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para crear lecciones en este curso"
        )
    
    try:
        return await lesson_service.create_lesson(course_id, lesson_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{lesson_id}", response_model=LessonResponse, summary="Actualizar información de una lección")
async def update_lesson(
    lesson_data: LessonUpdate,
    lesson_id: str = Path(..., description="ID de la lección"),
    current_user: User = Depends(get_current_instructor_user),
    lesson_service: LessonService = Depends(get_lesson_service)
):
    """
    Actualiza la información de una lección específica.
    
    Requiere permisos de instructor (propietario del curso) o administrador.
    
    - **lesson_id**: ID de la lección a actualizar
    - **lesson_data**: Datos a actualizar
    """
    try:
        # Verificar que el usuario sea el instructor del curso o administrador
        course = await lesson_service.get_course_by_lesson(lesson_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lección no encontrada"
            )
        
        if current_user.id != course.instructor_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para actualizar esta lección"
            )
        
        updated_lesson = await lesson_service.update_lesson(lesson_id, lesson_data)
        
        if not updated_lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lección no encontrada"
            )
        
        return updated_lesson
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/course/{course_id}/reorder", summary="Reordenar lecciones de un curso")
async def reorder_lessons(
    order_data: List[LessonOrderUpdate],
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_instructor_user),
    lesson_service: LessonService = Depends(get_lesson_service),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Actualiza el orden de las lecciones en un curso específico.
    
    Requiere permisos de instructor (propietario del curso) o administrador.
    
    - **course_id**: ID del curso
    - **order_data**: Lista de IDs de lecciones y sus nuevas posiciones
    """
    # Verificar que el curso exista
    course = await course_service.get_course_by_id(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    
    # Verificar que el usuario sea el instructor del curso o administrador
    if current_user.id != course.instructor_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para reordenar las lecciones de este curso"
        )
    
    try:
        success = await lesson_service.reorder_lessons(course_id, order_data)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudieron reordenar las lecciones"
            )
        
        return {"message": "Lecciones reordenadas correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{lesson_id}", response_model=dict, summary="Eliminar una lección")
async def delete_lesson(
    lesson_id: str = Path(..., description="ID de la lección"),
    current_user: User = Depends(get_current_instructor_user),
    lesson_service: LessonService = Depends(get_lesson_service)
):
    """
    Elimina una lección específica.
    
    Requiere permisos de instructor (propietario del curso) o administrador.
    
    - **lesson_id**: ID de la lección a eliminar
    """
    try:
        # Verificar que el usuario sea el instructor del curso o administrador
        course = await lesson_service.get_course_by_lesson(lesson_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lección no encontrada"
            )
        
        if current_user.id != course.instructor_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para eliminar esta lección"
            )
        
        result = await lesson_service.delete_lesson(lesson_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lección no encontrada"
            )
        
        return {"message": "Lección eliminada correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
