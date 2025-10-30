"""
Endpoints para la gestión de reseñas de cursos
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status

from ....application.services.review_service import ReviewService
from ....application.services.enrollment_service import EnrollmentService
from ....application.dtos.review_dto import (
    ReviewResponse, ReviewCreate, ReviewUpdate
)
from ....domain.entities.user import User
from ....dependencies import get_review_service, get_enrollment_service
from ...deps import get_current_active_user, get_current_admin_user, get_current_instructor_user

router = APIRouter()

@router.get("/course/{course_id}", response_model=List[ReviewResponse], summary="Obtener reseñas de un curso")
async def get_course_reviews(
    course_id: str = Path(..., description="ID del curso"),
    skip: int = Query(0, ge=0, description="Número de reseñas a saltar"),
    limit: int = Query(10, ge=1, le=100, description="Número máximo de reseñas a devolver"),
    review_service: ReviewService = Depends(get_review_service)
):
    """
    Obtiene todas las reseñas de un curso específico con paginación.
    
    - **course_id**: ID del curso
    - **skip**: Número de reseñas a saltar (paginación)
    - **limit**: Número máximo de reseñas a devolver (paginación)
    """
    return await review_service.get_course_reviews(course_id, skip, limit)


@router.get("/user", response_model=List[ReviewResponse], summary="Obtener reseñas del usuario actual")
async def get_user_reviews(
    current_user: User = Depends(get_current_active_user),
    review_service: ReviewService = Depends(get_review_service)
):
    """
    Obtiene todas las reseñas realizadas por el usuario autenticado.
    """
    return await review_service.get_user_reviews(current_user.id)


@router.get("/{review_id}", response_model=ReviewResponse, summary="Obtener reseña por ID")
async def get_review_by_id(
    review_id: str = Path(..., description="ID de la reseña"),
    review_service: ReviewService = Depends(get_review_service)
):
    """
    Obtiene la información detallada de una reseña específica.
    
    - **review_id**: ID de la reseña a consultar
    """
    review = await review_service.get_review_by_id(review_id)
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reseña no encontrada"
        )
    
    return review


@router.post("/course/{course_id}", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED, summary="Crear una nueva reseña")
async def create_review(
    review_data: ReviewCreate,
    course_id: str = Path(..., description="ID del curso"),
    current_user: User = Depends(get_current_active_user),
    review_service: ReviewService = Depends(get_review_service),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service)
):
    """
    Crea una nueva reseña para un curso específico.
    
    El usuario debe estar inscrito en el curso y haber completado al menos el 50% del contenido.
    
    - **course_id**: ID del curso a reseñar
    - **review_data**: Datos de la reseña a crear
    """
    try:
        # Verificar que el usuario esté inscrito en el curso
        enrollments = await enrollment_service.get_user_enrollments(
            current_user.id, course_id=course_id, status="active"
        )
        
        if not enrollments:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Debes estar inscrito en el curso para poder escribir una reseña"
            )
        
        enrollment = enrollments[0]
        
        # Verificar progreso mínimo (esto sería opcional si queremos ser más flexibles)
        progress = await enrollment_service.get_enrollment_progress(enrollment.id)
        
        if progress.percent_completed < 50:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Debes completar al menos el 50% del curso para poder escribir una reseña"
            )
        
        # Verificar que no tenga una reseña previa
        existing_review = await review_service.get_user_course_review(current_user.id, course_id)
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya has escrito una reseña para este curso. Puedes actualizarla en lugar de crear una nueva."
            )
        
        return await review_service.create_review(
            course_id=course_id,
            student_id=current_user.id,
            review_data=review_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{review_id}", response_model=ReviewResponse, summary="Actualizar una reseña")
async def update_review(
    review_data: ReviewUpdate,
    review_id: str = Path(..., description="ID de la reseña"),
    current_user: User = Depends(get_current_active_user),
    review_service: ReviewService = Depends(get_review_service)
):
    """
    Actualiza una reseña específica.
    
    Solo el autor de la reseña puede actualizarla.
    
    - **review_id**: ID de la reseña a actualizar
    - **review_data**: Datos a actualizar
    """
    # Verificar que la reseña exista
    review = await review_service.get_review_by_id(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reseña no encontrada"
        )
    
    # Verificar que el usuario sea el autor de la reseña o administrador
    if current_user.id != review.student_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar esta reseña"
        )
    
    try:
        updated_review = await review_service.update_review(review_id, review_data)
        
        if not updated_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reseña no encontrada"
            )
        
        return updated_review
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{review_id}", response_model=dict, summary="Eliminar una reseña")
async def delete_review(
    review_id: str = Path(..., description="ID de la reseña"),
    current_user: User = Depends(get_current_active_user),
    review_service: ReviewService = Depends(get_review_service)
):
    """
    Elimina una reseña específica.
    
    Solo el autor de la reseña o un administrador puede eliminarla.
    
    - **review_id**: ID de la reseña a eliminar
    """
    # Verificar que la reseña exista
    review = await review_service.get_review_by_id(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reseña no encontrada"
        )
    
    # Verificar que el usuario sea el autor de la reseña o administrador
    if current_user.id != review.student_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar esta reseña"
        )
    
    try:
        result = await review_service.delete_review(review_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reseña no encontrada"
            )
        
        return {"message": "Reseña eliminada correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/instructor/courses", response_model=List[dict], summary="Obtener estadísticas de reseñas para cursos del instructor")
async def get_instructor_reviews_stats(
    current_user: User = Depends(get_current_instructor_user),
    review_service: ReviewService = Depends(get_review_service)
):
    """
    Obtiene estadísticas de las reseñas para todos los cursos del instructor autenticado.
    
    Requiere permisos de instructor o administrador.
    """
    return await review_service.get_instructor_reviews_stats(current_user.id)
