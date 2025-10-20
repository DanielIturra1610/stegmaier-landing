"""
Endpoints para la gestión de inscripciones a cursos
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status

from ....application.services.enrollment_service import EnrollmentService
from ....application.services.course_service import CourseService
from ....application.dtos.enrollment_dto import (
    EnrollmentResponse, EnrollmentCreate, EnrollmentUpdate, 
    LessonCompletionUpdate, EnrollmentProgressResponse
)
from ....domain.entities.user import User
from ....dependencies import get_enrollment_service, get_course_service
from ...deps import get_current_active_user, get_current_admin_user, get_current_instructor_user

router = APIRouter()

@router.get("/", response_model=List[EnrollmentResponse], summary="Obtener inscripciones del usuario actual")
async def get_user_enrollments(
    status: Optional[str] = Query(None, description="Filtrar por estado (active, completed, cancelled)"),
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service)
):
    """
    Obtiene todas las inscripciones del usuario autenticado con filtrado opcional por estado.
    
    - **status**: Estado de la inscripción (active, completed, cancelled) [Opcional]
    """
    filters = {}
    
    if status:
        filters["status"] = status
    
    return await enrollment_service.get_user_enrollments(current_user.id, **filters)


@router.get("/course/{course_id}", response_model=List[EnrollmentResponse], summary="Obtener inscripciones de un curso")
async def get_course_enrollments(
    course_id: str = Path(..., description="ID del curso"),
    status: Optional[str] = Query(None, description="Filtrar por estado (active, completed, cancelled)"),
    current_user: User = Depends(get_current_instructor_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Obtiene todas las inscripciones de un curso específico.
    
    Requiere permisos de instructor (propietario del curso) o administrador.
    
    - **course_id**: ID del curso
    - **status**: Estado de la inscripción (active, completed, cancelled) [Opcional]
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
            detail="No tienes permiso para ver las inscripciones de este curso"
        )
    
    filters = {}
    
    if status:
        filters["status"] = status
    
    return await enrollment_service.get_course_enrollments(course_id, **filters)


@router.get("/{enrollment_id}", response_model=EnrollmentResponse, summary="Obtener inscripción por ID")
async def get_enrollment_by_id(
    enrollment_id: str = Path(..., description="ID de la inscripción"),
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service)
):
    """
    Obtiene la información detallada de una inscripción específica.
    
    - **enrollment_id**: ID de la inscripción a consultar
    """
    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada"
        )
    
    # Verificar permisos
    if current_user.id != enrollment.student_id and current_user.id != enrollment.course.instructor_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta inscripción"
        )
    
    return enrollment


@router.get("/{enrollment_id}/progress", response_model=EnrollmentProgressResponse, summary="Obtener progreso de inscripción")
async def get_enrollment_progress(
    enrollment_id: str = Path(..., description="ID de la inscripción"),
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service)
):
    """
    Obtiene el progreso detallado de una inscripción específica.
    
    - **enrollment_id**: ID de la inscripción a consultar
    """
    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada"
        )
    
    # Verificar permisos
    if current_user.id != enrollment.student_id and current_user.id != enrollment.course.instructor_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver el progreso de esta inscripción"
        )
    
    return await enrollment_service.get_enrollment_progress(enrollment_id)


@router.post("/", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED, summary="Crear una nueva inscripción")
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Crea una nueva inscripción a un curso.
    
    - **enrollment_data**: Datos de la inscripción a crear
    """
    # Verificar que el curso exista y esté publicado
    course = await course_service.get_course_by_id(enrollment_data.course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    
    if not course.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes inscribirte a un curso que no está publicado"
        )
    
    try:
        # Si es admin, puede inscribir a cualquier usuario
        student_id = enrollment_data.student_id if current_user.role == "admin" else current_user.id
        
        # Actualizar el student_id en enrollment_data
        enrollment_data.student_id = student_id
        
        return await enrollment_service.enroll_user(enrollment_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{enrollment_id}/complete-lesson", summary="Marcar lección como completada")
async def mark_lesson_as_completed(
    completion_data: LessonCompletionUpdate,
    enrollment_id: str = Path(..., description="ID de la inscripción"),
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service)
):
    """
    Marca una lección como completada en una inscripción específica.
    
    - **enrollment_id**: ID de la inscripción
    - **completion_data**: ID de la lección a marcar como completada
    """
    # Verificar que la inscripción exista
    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada"
        )
    
    # Verificar que el usuario sea el estudiante de la inscripción
    if current_user.id != enrollment.student_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar esta inscripción"
        )
    
    try:
        success = await enrollment_service.mark_lesson_completed(
            enrollment_id,
            completion_data.lesson_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo marcar la lección como completada"
            )
        
        return {"message": "Lección marcada como completada"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{enrollment_id}/issue-certificate", summary="Emitir certificado de finalización")
async def issue_completion_certificate(
    enrollment_id: str = Path(..., description="ID de la inscripción"),
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service)
):
    """
    Emite un certificado de finalización para una inscripción que ha completado el curso.
    
    - **enrollment_id**: ID de la inscripción
    """
    # Verificar que la inscripción exista
    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada"
        )
    
    # Verificar que el usuario sea el estudiante de la inscripción o el instructor del curso
    is_instructor = current_user.id == enrollment.course.instructor_id
    is_student = current_user.id == enrollment.student_id
    is_admin = current_user.role == "admin"
    
    if not (is_student or is_instructor or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para emitir un certificado para esta inscripción"
        )
    
    try:
        certificate = await enrollment_service.issue_certificate(enrollment_id)
        
        if not certificate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo emitir el certificado. Verifica que todas las lecciones estén completadas."
            )
        
        return {
            "message": "Certificado emitido correctamente",
            "certificate": {
                "id": certificate.id,
                "enrollment_id": certificate.enrollment_id,
                "course_name": certificate.course_name,
                "student_name": certificate.student_name,
                "issue_date": certificate.issue_date,
                "verification_code": certificate.verification_code
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{enrollment_id}/cancel", response_model=dict, summary="Cancelar inscripción")
async def cancel_enrollment(
    enrollment_id: str = Path(..., description="ID de la inscripción"),
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service)
):
    """
    Cancela una inscripción específica.
    
    - **enrollment_id**: ID de la inscripción a cancelar
    """
    # Verificar que la inscripción exista
    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada"
        )
    
    # Verificar permisos
    is_student = current_user.id == enrollment.student_id
    is_instructor = current_user.id == enrollment.course.instructor_id
    is_admin = current_user.role == "admin"
    
    if not (is_student or is_instructor or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para cancelar esta inscripción"
        )
    
    try:
        success = await enrollment_service.cancel_enrollment(enrollment_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo cancelar la inscripción"
            )
        
        return {"message": "Inscripción cancelada correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
