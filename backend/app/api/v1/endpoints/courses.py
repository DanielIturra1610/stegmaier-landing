"""
Endpoints para la gestión de cursos
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status

from ....application.services.course_service import CourseService
from ....application.services.lesson_service import LessonService
from ....application.dtos.course_dto import (
    CourseResponse, CourseCreate, CourseUpdate, CourseListResponse
)
from ....domain.entities.user import User
from ....dependencies import get_course_service, get_lesson_service
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
    
    print(f"🚀 [ENDPOINT] Getting available courses with filters: {filters}, skip: {skip}, limit: {limit}")
    courses = await course_service.list_courses(skip, limit, **filters)
    print(f"✅ [ENDPOINT] Found {len(courses)} available courses after CourseService.list_courses()")
    
    # Debug first course to verify lessons_count
    if courses:
        first_course = courses[0]
        print(f"🔍 [ENDPOINT] First course lessons_count: {getattr(first_course, 'lessons_count', 'NOT_SET')}")
        print(f"🔍 [ENDPOINT] First course total_duration: {getattr(first_course, 'total_duration', 'NOT_SET')}")
    for course in courses:
        print(f"DEBUG: Course - ID: {course.id}, Title: {course.title}, Published: {getattr(course, 'is_published', 'N/A')}")
    
    return courses


@router.get("/{course_id}", response_model=CourseResponse, summary="Obtener curso por ID")
async def get_course_by_id(
    course_id: str = Path(..., description="ID del curso"),
    course_service: CourseService = Depends(get_course_service),
    lesson_service: LessonService = Depends(get_lesson_service),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """
    Obtiene la información detallada de un curso específico.
    
    - **course_id**: ID del curso a consultar
    """
    print(f"🔍 [API] Getting course with ID: {course_id}")
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
    
    # Obtener las lecciones del curso explícitamente
    print(f"📚 [API] Fetching lessons for course {course_id}")
    try:
        lessons = await lesson_service.get_course_lessons(course_id)
        print(f"✅ [API] Found {len(lessons)} lessons for course {course_id}")
        
        # Convertir las lecciones a diccionarios para el response
        course_dict = course.dict() if hasattr(course, 'dict') else course.__dict__
        course_dict['lessons'] = [
            {
                'id': str(lesson.id),
                'title': lesson.title,
                'order': lesson.order,
                'content_type': lesson.content_type,
                'content_text': lesson.content_text,
                'content_url': lesson.content_url,
                'duration': lesson.duration,
                'is_free_preview': lesson.is_free_preview
            } for lesson in lessons
        ]
        
        print(f"📋 [API] Returning course with {len(course_dict['lessons'])} lessons")
        return CourseResponse(**course_dict)
        
    except Exception as e:
        print(f"⚠️ [API] Error fetching lessons: {e}")
        # Si hay error, devolver el curso sin lecciones para evitar el loader infinito
        course_dict = course.dict() if hasattr(course, 'dict') else course.__dict__
        course_dict['lessons'] = []
        return CourseResponse(**course_dict)


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

@router.get("/{course_id}/preview", response_model=CourseResponse, summary="Previsualizar curso como estudiante")
async def preview_course_as_student(
    course_id: str = Path(..., description="ID del curso"),
    simulate_enrollment: bool = Query(False, description="Simular que el estudiante está inscrito"),
    current_user: User = Depends(get_current_instructor_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Permite a un instructor o administrador ver el curso como lo vería un estudiante.

    - **course_id**: ID del curso a previsualizar.
    - **simulate_enrollment**: Si es `True`, simula la vista de un estudiante inscrito. 
                             Si es `False`, simula la vista de un estudiante no inscrito.
    - Requiere permisos de instructor (propietario) o administrador.
    """
    try:
        preview_course = await course_service.get_course_as_student_preview(
            course_id=course_id,
            instructor_id=current_user.id,
            simulate_enrollment=simulate_enrollment
        )
        return preview_course
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
