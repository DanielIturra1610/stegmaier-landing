"""
Endpoints administrativos básicos
Aprovecha servicios existentes para funcionalidad admin
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile, Path
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
    role: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    user_service: UserService = Depends(get_user_service)
):
    """Lista usuarios para administración con filtro por rol"""
    try:
        filters = {}
        if role:
            filters["role"] = role
        
        users = await user_service.get_all(skip=skip, limit=limit, filters=filters)
        
        # Filtrar información sensible para respuesta
        user_list = []
        for user in users:
            user_data = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "created_at": user.created_at
            }
            user_list.append(user_data)
        
        return user_list
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener usuarios: {str(e)}"
        )

@router.get("/courses", summary="Lista de cursos para admin")
async def get_admin_courses(
    skip: int = 0,
    limit: int = 20,
    is_published: Optional[bool] = None,
    category: Optional[str] = None,
    instructor_id: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Obtiene lista de cursos con filtros y estadísticas para administración
    """
    filters = {}
    if is_published is not None:
        filters["is_published"] = is_published
    if category:
        filters["category"] = category
    if instructor_id:
        filters["instructor_id"] = instructor_id
    
    return await course_service.get_courses_with_stats(
        skip=skip, 
        limit=limit, 
        filters=filters
    )

@router.post("/courses", summary="Crear nuevo curso (admin)")
async def create_admin_course(
    title: str = Form(...),
    description: str = Form(...),
    level: str = Form(...),
    category: str = Form(...),
    instructor_id: str = Form(...),

    cover_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_admin_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Crea un nuevo curso desde el panel administrativo
    """
    try:
        # Procesar imagen de portada si se proporciona
        cover_image_url = ""
        if cover_image and cover_image.filename:
            # TODO: Implementar upload de imagen (por ahora solo guardamos el nombre)
            cover_image_url = f"/media/covers/{cover_image.filename}"
        
        course_data = {
            "title": title,
            "description": description,
            "level": level,
            "category": category,
            "cover_image": cover_image_url,
            "tags": [],  # Se pueden añadir después
            "requirements": [],
            "what_you_will_learn": []
        }
        
        course = await course_service.create_course_admin(
            course_data=course_data,
            instructor_id=instructor_id
        )
        
        return {
            "message": "Curso creado exitosamente",
            "course": course,
            "redirect_url": f"/admin/courses/{course.id}/edit"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/courses/{course_id}", summary="Obtener curso para edición (admin)")
async def get_admin_course(
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_admin_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Obtiene un curso específico con todas sus lecciones para edición
    """
    course_data = await course_service.get_course_with_lessons_admin(course_id)
    
    if not course_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curso con id {course_id} no encontrado"
        )
    
    return course_data

@router.put("/courses/{course_id}", summary="Actualizar curso (admin)")
async def update_admin_course(
    course_id: str = Path(..., description="ID del curso"),
    title: str = Form(...),
    description: str = Form(...),
    level: str = Form(...),
    category: str = Form(...),

    cover_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_admin_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Actualiza un curso existente desde el panel administrativo
    """
    try:
        course_data = {
            "title": title,
            "description": description,
            "level": level,
            "category": category
        }
        
        # Procesar nueva imagen si se proporciona
        if cover_image and cover_image.filename:
            course_data["cover_image"] = f"/media/covers/{cover_image.filename}"
        
        course = await course_service.update_course_admin(
            course_id=course_id,
            course_data=course_data,
            user_id=current_user.id
        )
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        return {
            "message": "Curso actualizado exitosamente",
            "course": course
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/courses/{course_id}/publish", summary="Publicar/despublicar curso (admin)")
async def toggle_course_publication(
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_admin_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Cambia el estado de publicación de un curso
    """
    try:
        course = await course_service.publish_course_admin(
            course_id=course_id,
            user_id=current_user.id
        )
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        status_text = "publicado" if course.is_published else "despublicado"
        
        return {
            "message": f"Curso {status_text} exitosamente",
            "course": course,
            "is_published": course.is_published
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/courses/{course_id}", summary="Eliminar curso (admin)")
async def delete_admin_course(
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_admin_user),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Elimina un curso (solo si no tiene inscripciones activas)
    """
    try:
        success = await course_service.delete_course_admin(course_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        return {"message": "Curso eliminado exitosamente"}
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
