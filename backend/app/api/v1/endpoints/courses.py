"""
Endpoints para la gestión de cursos
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status

from ....application.services.course_service import CourseService
from ....application.dtos.course_dto import (
    CourseResponse, CourseCreate, CourseUpdate, CourseListResponse
)
from ....domain.entities.user import User
from ....dependencies import get_course_service
from ...deps import get_current_active_user, get_current_instructor_user

router = APIRouter()

@router.get("/", response_model=List[CourseListResponse], summary="Obtener lista de cursos")
async def get_courses(
    skip: int = Query(0, ge=0, description="Número de cursos a saltar"),
    limit: int = Query(20, ge=1, le=100, description="Número máximo de cursos a devolver"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    level: Optional[str] = Query(None, description="Filtrar por nivel"),
    is_published: bool = Query(True, description="Filtrar por estado de publicación"),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Obtiene una lista paginada de cursos con filtros opcionales.
    
    - **skip**: Número de cursos a saltar (paginación)
    - **limit**: Número máximo de cursos a devolver (paginación)
    - **category**: Filtrar por categoría (opcional)
    - **level**: Filtrar por nivel (opcional)
    - **is_published**: Filtrar por estado de publicación (por defecto, solo publicados)
    """
    filters = {}
    
    if category:
        filters["category"] = category
    
    if level:
        filters["level"] = level
    
    # Solo los usuarios autenticados pueden ver cursos no publicados
    filters["is_published"] = is_published
    
    return await course_service.list_courses(skip, limit, **filters)


@router.get("/search", response_model=List[CourseListResponse], summary="Buscar cursos")
async def search_courses(
    query: str = Query(..., min_length=3, description="Texto a buscar"),
    skip: int = Query(0, ge=0, description="Número de cursos a saltar"),
    limit: int = Query(20, ge=1, le=100, description="Número máximo de cursos a devolver"),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Busca cursos por título, descripción o etiquetas.
    
    - **query**: Texto a buscar (mínimo 3 caracteres)
    - **skip**: Número de cursos a saltar (paginación)
    - **limit**: Número máximo de cursos a devolver (paginación)
    """
    return await course_service.search_courses(query, skip, limit)


@router.get("/instructor", response_model=List[CourseListResponse], summary="Obtener cursos del instructor")
async def get_instructor_courses(
    current_user: User = Depends(get_current_instructor_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Obtiene todos los cursos creados por el instructor autenticado.
    
    Requiere permisos de instructor o administrador.
    """
    return await course_service.get_instructor_courses(current_user.id)


@router.get("/available", response_model=List[CourseListResponse], summary="Obtener cursos disponibles")
async def get_available_courses(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de cursos por página"),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Obtiene una lista de cursos disponibles para inscripción.
    Solo devuelve cursos publicados.
    
    - **page**: Número de página para paginación
    - **limit**: Número máximo de cursos por página
    """
    # Calcular skip basado en page
    skip = (page - 1) * limit
    
    # Filtrar solo cursos publicados
    filters = {"is_published": True}
    
    print(f"DEBUG: Getting available courses with filters: {filters}, skip: {skip}, limit: {limit}")
    courses = await course_service.list_courses(skip, limit, **filters)
    print(f"DEBUG: Found {len(courses)} available courses")
    for course in courses:
        print(f"DEBUG: Course - ID: {course.id}, Title: {course.title}, Published: {getattr(course, 'is_published', 'N/A')}")
    
    return courses


@router.get("/{course_id}", response_model=CourseResponse, summary="Obtener curso por ID")
async def get_course_by_id(
    course_id: str = Path(..., description="ID del curso"),
    course_service: CourseService = Depends(get_course_service),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """
    Obtiene la información detallada de un curso específico.
    
    - **course_id**: ID del curso a consultar
    """
    course = await course_service.get_course_by_id(course_id)
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    
    # Verificar permisos para ver cursos no publicados
    if not course.is_published:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este curso"
            )
        
        # Solo el instructor del curso y los administradores pueden ver cursos no publicados
        if current_user.id != course.instructor_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este curso no publicado"
            )
    
    return course


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo curso")
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_instructor_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Crea un nuevo curso.
    
    Requiere permisos de instructor o administrador.
    
    - **course_data**: Datos del curso a crear
    """
    try:
        return await course_service.create_course(current_user.id, course_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{course_id}", response_model=CourseResponse, summary="Actualizar información de un curso")
async def update_course(
    course_data: CourseUpdate,
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_instructor_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Actualiza la información de un curso específico.
    
    Requiere permisos de instructor (propietario del curso) o administrador.
    
    - **course_id**: ID del curso a actualizar
    - **course_data**: Datos a actualizar
    """
    try:
        updated_course = await course_service.update_course(
            course_id,
            current_user.id,
            course_data
        )
        
        if not updated_course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        return updated_course
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/{course_id}/publish", response_model=CourseResponse, summary="Publicar un curso")
async def publish_course(
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_instructor_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Publica un curso para que esté disponible para los estudiantes.
    
    Requiere permisos de instructor (propietario del curso) o administrador.
    El curso debe tener al menos una lección para poder ser publicado.
    
    - **course_id**: ID del curso a publicar
    """
    try:
        published_course = await course_service.publish_course(course_id, current_user.id)
        
        if not published_course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        return published_course
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{course_id}", response_model=dict, summary="Eliminar un curso")
async def delete_course(
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_instructor_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Elimina un curso específico.
    
    Requiere permisos de instructor (propietario del curso) o administrador.
    
    - **course_id**: ID del curso a eliminar
    """
    try:
        result = await course_service.delete_course(course_id, current_user.id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        return {"message": "Curso eliminado correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
