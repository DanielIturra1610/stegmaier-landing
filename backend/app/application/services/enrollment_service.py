"""
Servicio para la gestión de inscripciones a cursos
"""
from typing import List, Optional
from datetime import datetime
from ...domain.repositories.enrollment_repository import EnrollmentRepository
from ...domain.repositories.course_repository import CourseRepository
from ...domain.repositories.user_repository import UserRepository
from ...domain.repositories.lesson_repository import LessonRepository
from ...domain.entities.enrollment import Enrollment, EnrollmentStatus
from ..dtos.enrollment_dto import EnrollmentCreate, EnrollmentUpdate, EnrollmentProgressUpdate
from .notification_service import NotificationService

class EnrollmentService:
    """
    Servicio para la gestión de inscripciones que implementa la lógica de negocio
    """
    
    def __init__(
        self, 
        enrollment_repository: EnrollmentRepository,
        course_repository: CourseRepository,
        user_repository: UserRepository,
        lesson_repository: LessonRepository,
        notification_service: Optional[NotificationService] = None
    ):
        self.enrollment_repository = enrollment_repository
        self.course_repository = course_repository
        self.user_repository = user_repository
        self.lesson_repository = lesson_repository
        self.notification_service = notification_service
    
    async def enroll_user(self, enrollment_data: EnrollmentCreate) -> Enrollment:
        """
        Inscribe a un usuario en un curso
        
        Args:
            enrollment_data: Datos de la inscripción
        
        Returns:
            La inscripción creada
        
        Raises:
            ValueError: Si el usuario o curso no existen, o si ya está inscrito
        """
        # Verificar si el usuario existe
        user = await self.user_repository.get_by_id(enrollment_data.student_id)
        if not user:
            raise ValueError("El usuario no existe")
        
        # Verificar si el curso existe y está publicado
        course = await self.course_repository.get_by_id(enrollment_data.course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        if not course.is_published:
            raise ValueError("El curso no está disponible para inscripción")
        
        # Verificar si el usuario ya está inscrito en el curso
        existing_enrollment = await self.enrollment_repository.get_by_user_and_course(
            enrollment_data.student_id, 
            enrollment_data.course_id
        )
        
        if existing_enrollment:
            # Si la inscripción está cancelada o expirada, se puede renovar
            if existing_enrollment.status in [EnrollmentStatus.CANCELLED, EnrollmentStatus.EXPIRED]:
                existing_enrollment.status = EnrollmentStatus.ACTIVE
                existing_enrollment.enrollment_date = datetime.utcnow()
                existing_enrollment.expiry_date = enrollment_data.expiry_date
                
                await self.enrollment_repository.update(
                    existing_enrollment.id,
                    {
                        "status": existing_enrollment.status,
                        "enrollment_date": existing_enrollment.enrollment_date,
                        "expiry_date": existing_enrollment.expiry_date
                    }
                )
                
                return existing_enrollment
            else:
                raise ValueError("El usuario ya está inscrito en este curso")
        
        # Crear la inscripción
        enrollment = Enrollment(
            user_id=enrollment_data.student_id,
            course_id=enrollment_data.course_id,
            status=EnrollmentStatus.ACTIVE,
            expiry_date=enrollment_data.expiry_date
        )
        
        created_enrollment = await self.enrollment_repository.create(enrollment)
        
        # Actualizar la lista de cursos del usuario
        if created_enrollment.course_id not in user.enrolled_courses:
            user.enrolled_courses.append(created_enrollment.course_id)
            await self.user_repository.update(
                user.id, 
                {"enrolled_courses": user.enrolled_courses}
            )
        
        # Actualizar el contador de estudiantes del curso
        course.total_students += 1
        await self.course_repository.update(
            course.id,
            {"total_students": course.total_students}
        )
        
        # Notificar al instructor sobre la nueva inscripción
        if self.notification_service and course.instructor_id:
            try:
                await self.notification_service.notify_new_enrollment(
                    student_id=user.id,
                    course_id=course.id,
                    course_title=course.title,
                    instructor_id=course.instructor_id,
                    student_name=user.full_name or user.email
                )
            except Exception as e:
                # Log error but don't fail enrollment
                print(f"Error sending enrollment notification: {e}")
        
        return created_enrollment
    
    async def get_enrollment_by_id(self, enrollment_id: str) -> Optional[Enrollment]:
        """
        Obtiene una inscripción por su ID
        
        Args:
            enrollment_id: ID de la inscripción
        
        Returns:
            La inscripción encontrada o None
        """
        return await self.enrollment_repository.get_by_id(enrollment_id)
    
    async def get_user_enrollments(self, user_id: str) -> List[Enrollment]:
        """
        Obtiene todas las inscripciones de un usuario
        
        Args:
            user_id: ID del usuario
        
        Returns:
            Lista de inscripciones del usuario
        """
        return await self.enrollment_repository.get_by_user(user_id)
    
    async def get_course_enrollments(self, course_id: str) -> List[Enrollment]:
        """
        Obtiene todas las inscripciones de un curso
        
        Args:
            course_id: ID del curso
        
        Returns:
            Lista de inscripciones del curso
        """
        return await self.enrollment_repository.get_by_course(course_id)
    
    async def update_enrollment_status(
        self, 
        enrollment_id: str, 
        status: EnrollmentStatus
    ) -> Optional[Enrollment]:
        """
        Actualiza el estado de una inscripción
        
        Args:
            enrollment_id: ID de la inscripción
            status: Nuevo estado
        
        Returns:
            La inscripción actualizada o None si no existe
        """
        enrollment = await self.enrollment_repository.get_by_id(enrollment_id)
        if not enrollment:
            return None
        
        if await self.enrollment_repository.update_status(enrollment_id, status):
            enrollment.status = status
            return enrollment
        
        return None
    
    async def update_lesson_progress(
        self, 
        user_id: str, 
        course_id: str, 
        progress_data: EnrollmentProgressUpdate
    ) -> Optional[Enrollment]:
        """
        Actualiza el progreso de un usuario en una lección
        
        Args:
            user_id: ID del usuario
            course_id: ID del curso
            progress_data: Datos del progreso (lección y estado de completado)
        
        Returns:
            La inscripción actualizada o None si no existe
        
        Raises:
            ValueError: Si la inscripción no existe o no está activa
        """
        # Verificar si existe la inscripción y está activa
        enrollment = await self.enrollment_repository.get_by_user_and_course(user_id, course_id)
        if not enrollment:
            raise ValueError("El usuario no está inscrito en este curso")
        
        if enrollment.status != EnrollmentStatus.ACTIVE:
            raise ValueError("La inscripción no está activa")
        
        # Verificar si la lección pertenece al curso
        lesson = await self.lesson_repository.get_by_id(progress_data.lesson_id)
        if not lesson or lesson.course_id != course_id:
            raise ValueError("La lección no pertenece a este curso")
        
        # Actualizar la lista de lecciones completadas
        completed_lessons = enrollment.completed_lessons.copy()
        
        if progress_data.completed and progress_data.lesson_id not in completed_lessons:
            completed_lessons.append(progress_data.lesson_id)
        elif not progress_data.completed and progress_data.lesson_id in completed_lessons:
            completed_lessons.remove(progress_data.lesson_id)
        
        # Calcular el nuevo progreso
        course = await self.course_repository.get_by_id(course_id)
        if not course or not course.lessons:
            return enrollment
        
        total_lessons = len(course.lessons)
        completed_count = len(completed_lessons)
        new_progress = (completed_count / total_lessons) * 100 if total_lessons > 0 else 0
        
        # Actualizar la inscripción
        if await self.enrollment_repository.update_progress(
            enrollment.id, 
            new_progress, 
            completed_lessons
        ):
            # Si se completaron todas las lecciones, marcar como completado
            if new_progress >= 100:
                await self.enrollment_repository.update_status(
                    enrollment.id, 
                    EnrollmentStatus.COMPLETED
                )
            
            # Actualizar el objeto de inscripción para devolverlo
            enrollment.progress = new_progress
            enrollment.completed_lessons = completed_lessons
            enrollment.last_accessed = datetime.utcnow()
            
            if new_progress >= 100:
                enrollment.status = EnrollmentStatus.COMPLETED
            
            return enrollment
        
        return None
    
    async def issue_certificate(self, enrollment_id: str, certificate_url: str) -> bool:
        """
        Emite un certificado para una inscripción completada
        
        Args:
            enrollment_id: ID de la inscripción
            certificate_url: URL del certificado generado
        
        Returns:
            True si se emitió correctamente, False si no
        
        Raises:
            ValueError: Si la inscripción no existe o no está completada
        """
        enrollment = await self.enrollment_repository.get_by_id(enrollment_id)
        if not enrollment:
            raise ValueError("La inscripción no existe")
        
        if enrollment.status != EnrollmentStatus.COMPLETED or enrollment.progress < 100:
            raise ValueError("No se puede emitir certificado para un curso no completado")
        
        return await self.enrollment_repository.issue_certificate(enrollment_id, certificate_url)
    
    async def cancel_enrollment(self, enrollment_id: str) -> bool:
        """
        Cancela una inscripción
        
        Args:
            enrollment_id: ID de la inscripción a cancelar
        
        Returns:
            True si se canceló correctamente, False si no
        """
        enrollment = await self.enrollment_repository.get_by_id(enrollment_id)
        if not enrollment:
            return False
        
        # Actualizar estado a cancelado
        result = await self.enrollment_repository.update_status(
            enrollment_id, 
            EnrollmentStatus.CANCELLED
        )
        
        if result:
            # Actualizar la lista de cursos del usuario
            user = await self.user_repository.get_by_id(enrollment.user_id)
            if user and enrollment.course_id in user.enrolled_courses:
                user.enrolled_courses.remove(enrollment.course_id)
                await self.user_repository.update(
                    user.id, 
                    {"enrolled_courses": user.enrolled_courses}
                )
            
            # Actualizar el contador de estudiantes del curso
            course = await self.course_repository.get_by_id(enrollment.course_id)
            if course and course.total_students > 0:
                course.total_students -= 1
                await self.course_repository.update(
                    course.id,
                    {"total_students": course.total_students}
                )
            
            return True
        
        return False
