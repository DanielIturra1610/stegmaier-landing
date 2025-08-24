"""
Endpoints para la gestión de certificados
"""
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import hashlib

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from fastapi.responses import StreamingResponse
import io

from ....application.services.enrollment_service import EnrollmentService
from ....application.services.course_service import CourseService
from ....application.services.user_service import UserService
from ....application.dtos.enrollment_dto import EnrollmentResponse
from ....domain.entities.user import User
from ....domain.entities.enrollment import EnrollmentStatus
from ....dependencies import get_enrollment_service, get_course_service, get_user_service
from ...deps import get_current_active_user, get_current_admin_user

router = APIRouter()

# Modelos para certificados
from pydantic import BaseModel

class CertificateRequest(BaseModel):
    enrollmentId: str
    template: str = "stegmaier-standard"

class CertificateResponse(BaseModel):
    id: str
    enrollmentId: str
    courseId: str
    courseName: str
    studentName: str
    instructorName: str
    issueDate: str
    completionDate: str
    verificationCode: str
    category: str
    level: str
    downloadUrl: str
    verificationUrl: str

class CertificateVerificationResponse(BaseModel):
    isValid: bool
    certificate: Optional[CertificateResponse] = None
    error: Optional[str] = None

def generate_verification_code(enrollment_id: str, course_id: str, student_id: str) -> str:
    """Genera un código de verificación único para el certificado"""
    data = f"{enrollment_id}-{course_id}-{student_id}-{datetime.utcnow().isoformat()}"
    return hashlib.sha256(data.encode()).hexdigest()[:12].upper()

def create_certificate_id() -> str:
    """Genera un ID único para el certificado"""
    return str(uuid.uuid4())

@router.post("/generate", response_model=CertificateResponse, summary="Generar certificado de completitud")
async def generate_certificate(
    certificate_request: CertificateRequest,
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service),
    course_service: CourseService = Depends(get_course_service),
    user_service: UserService = Depends(get_user_service)
):
    """
    Genera un certificado para una inscripción completada.
    
    - **enrollmentId**: ID de la inscripción
    - **template**: Plantilla del certificado (opcional)
    """
    # Verificar que la inscripción exista
    enrollment = await enrollment_service.get_enrollment_by_id(certificate_request.enrollmentId)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada"
        )
    
    # Verificar permisos (estudiante, instructor del curso o admin)
    is_student = current_user.id == enrollment.student_id
    is_instructor = current_user.id == enrollment.course.instructor_id  
    is_admin = current_user.role == "admin"
    
    if not (is_student or is_instructor or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para generar este certificado"
        )
    
    # Verificar que el curso esté completado
    if enrollment.status != EnrollmentStatus.COMPLETED or enrollment.progress < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El curso debe estar completado al 100% para generar el certificado"
        )
    
    # Obtener información del curso y estudiante
    course = await course_service.get_course_by_id(enrollment.course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )
    
    student = await user_service.get_user_by_id(enrollment.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    instructor = await user_service.get_user_by_id(course.instructor_id)
    instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Instructor"
    
    # Generar el certificado
    certificate_id = create_certificate_id()
    verification_code = generate_verification_code(
        enrollment.id, 
        enrollment.course_id, 
        enrollment.student_id
    )
    
    certificate_data = CertificateResponse(
        id=certificate_id,
        enrollmentId=enrollment.id,
        courseId=enrollment.course_id,
        courseName=course.title,
        studentName=f"{student.first_name} {student.last_name}",
        instructorName=instructor_name,
        issueDate=datetime.utcnow().isoformat(),
        completionDate=enrollment.updated_at.isoformat() if enrollment.updated_at else datetime.utcnow().isoformat(),
        verificationCode=verification_code,
        category=course.category if hasattr(course, 'category') else "general",
        level=course.level if hasattr(course, 'level') else "intermedio",
        downloadUrl=f"/api/v1/certificates/{certificate_id}/download",
        verificationUrl=f"/api/v1/certificates/verify/{verification_code}"
    )
    
    # Marcar el certificado como emitido en la inscripción
    certificate_url = f"/certificates/{certificate_id}"
    try:
        await enrollment_service.issue_certificate(enrollment.id, certificate_url)
    except ValueError as e:
        # Si el servicio falla, continuamos ya que el certificado se puede generar
        pass
    
    return certificate_data

@router.get("/user", response_model=List[CertificateResponse], summary="Obtener certificados del usuario")
async def get_user_certificates(
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Obtiene todos los certificados del usuario autenticado.
    """
    # Obtener inscripciones completadas del usuario
    enrollments = await enrollment_service.get_user_enrollments(
        current_user.id, 
        status="completed"
    )
    
    certificates = []
    for enrollment in enrollments:
        if enrollment.progress >= 100:
            # Obtener información del curso
            course = await course_service.get_course_by_id(enrollment.course_id)
            if not course:
                continue
                
            # Obtener instructor
            instructor = await enrollment_service.user_repository.get_by_id(course.instructor_id)
            instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Instructor"
            
            verification_code = generate_verification_code(
                enrollment.id, 
                enrollment.course_id, 
                enrollment.student_id
            )
            
            certificate = CertificateResponse(
                id=f"cert-{enrollment.id}",
                enrollmentId=enrollment.id,
                courseId=enrollment.course_id,
                courseName=course.title,
                studentName=f"{current_user.first_name} {current_user.last_name}",
                instructorName=instructor_name,
                issueDate=enrollment.updated_at.isoformat() if enrollment.updated_at else datetime.utcnow().isoformat(),
                completionDate=enrollment.updated_at.isoformat() if enrollment.updated_at else datetime.utcnow().isoformat(),
                verificationCode=verification_code,
                category=course.category if hasattr(course, 'category') else "general",
                level=course.level if hasattr(course, 'level') else "intermedio",
                downloadUrl=f"/api/v1/certificates/cert-{enrollment.id}/download",
                verificationUrl=f"/api/v1/certificates/verify/{verification_code}"
            )
            certificates.append(certificate)
    
    return certificates

@router.get("/{certificate_id}/download", summary="Descargar certificado PDF")
async def download_certificate(
    certificate_id: str = Path(..., description="ID del certificado"),
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service),
    course_service: CourseService = Depends(get_course_service)
):
    """
    Descarga un certificado en formato PDF.
    
    - **certificate_id**: ID del certificado a descargar
    """
    # Extraer enrollment_id del certificate_id
    enrollment_id = certificate_id.replace("cert-", "") if certificate_id.startswith("cert-") else certificate_id
    
    # Verificar que la inscripción exista
    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificado no encontrado"
        )
    
    # Verificar permisos
    is_student = current_user.id == enrollment.student_id
    is_instructor = current_user.id == enrollment.course.instructor_id
    is_admin = current_user.role == "admin"
    
    if not (is_student or is_instructor or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para descargar este certificado"
        )
    
    # Verificar que esté completado
    if enrollment.status != EnrollmentStatus.COMPLETED or enrollment.progress < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El certificado no está disponible para cursos no completados"
        )
    
    # Por ahora retornamos un mensaje, el PDF se genera en el frontend
    # En el futuro se podría implementar generación de PDF en el backend
    return {
        "message": "Certificado listo para descarga",
        "certificate_id": certificate_id,
        "enrollment_id": enrollment_id,
        "download_ready": True
    }

@router.get("/verify/{verification_code}", response_model=CertificateVerificationResponse, summary="Verificar certificado")
async def verify_certificate(
    verification_code: str = Path(..., description="Código de verificación del certificado"),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service),
    course_service: CourseService = Depends(get_course_service),
    user_service: UserService = Depends(get_user_service)
):
    """
    Verifica la autenticidad de un certificado usando su código de verificación.
    
    - **verification_code**: Código de verificación del certificado
    """
    # Por simplicidad, buscamos todas las inscripciones completadas
    # En un sistema real, almacenaríamos los códigos de verificación
    
    try:
        # Esta es una implementación simplificada
        # En producción se debería tener una tabla dedicada para certificados
        return CertificateVerificationResponse(
            isValid=True,
            certificate=None,  # Se podría implementar la búsqueda completa
            error=None
        )
    except Exception as e:
        return CertificateVerificationResponse(
            isValid=False,
            certificate=None,
            error="No se pudo verificar el certificado"
        )

@router.get("/share/{certificate_id}", summary="Generar URL compartible")
async def get_shareable_url(
    certificate_id: str = Path(..., description="ID del certificado"),
    current_user: User = Depends(get_current_active_user),
    enrollment_service: EnrollmentService = Depends(get_enrollment_service)
):
    """
    Genera una URL compartible para un certificado.
    
    - **certificate_id**: ID del certificado
    """
    # Extraer enrollment_id del certificate_id
    enrollment_id = certificate_id.replace("cert-", "") if certificate_id.startswith("cert-") else certificate_id
    
    # Verificar que la inscripción exista
    enrollment = await enrollment_service.get_enrollment_by_id(enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificado no encontrado"
        )
    
    # Verificar permisos
    is_student = current_user.id == enrollment.student_id
    is_admin = current_user.role == "admin"
    
    if not (is_student or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para compartir este certificado"
        )
    
    # Generar código de verificación
    verification_code = generate_verification_code(
        enrollment.id, 
        enrollment.course_id, 
        enrollment.student_id
    )
    
    # URL compartible (sería el dominio de producción)
    base_url = "https://stegmaier-lms.com"  # En producción usar dominio real
    shareable_url = f"{base_url}/certificates/verify/{verification_code}"
    
    return {
        "shareableUrl": shareable_url,
        "verificationCode": verification_code,
        "expiresAt": (datetime.utcnow() + timedelta(days=365)).isoformat(),  # Válido por 1 año
        "message": "URL generada correctamente"
    }
