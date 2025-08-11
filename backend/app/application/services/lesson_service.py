"""
Servicio para la gestión de lecciones
"""
from typing import List, Optional, Dict
from ...domain.repositories.lesson_repository import LessonRepository
from ...domain.repositories.course_repository import CourseRepository
from ...domain.repositories.user_repository import UserRepository
from ...domain.entities.lesson import Lesson
from ..dtos.lesson_dto import LessonCreate, LessonUpdate, LessonOrderItem

class LessonService:
    """
    Servicio para la gestión de lecciones que implementa la lógica de negocio
    """
    
    def __init__(
        self, 
        lesson_repository: LessonRepository,
        course_repository: CourseRepository,
        user_repository: UserRepository
    ):
        self.lesson_repository = lesson_repository
        self.course_repository = course_repository
        self.user_repository = user_repository
    
    async def create_lesson(self, instructor_id: str, lesson_data: LessonCreate) -> Lesson:
        """
        Crea una nueva lección
        
        Args:
            instructor_id: ID del instructor que crea la lección
            lesson_data: Datos de la lección a crear
        
        Returns:
            La lección creada
        
        Raises:
            ValueError: Si el curso no existe o el usuario no tiene permisos
        """
        print(f"🚀 [LessonService] Creating lesson for course: {lesson_data.course_id}")
        print(f"📋 [LessonService] Lesson data: title={lesson_data.title}, order={lesson_data.order}, type={lesson_data.content_type}")
        
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(lesson_data.course_id)
        if not course:
            print(f"❌ [LessonService] Course not found: {lesson_data.course_id}")
            raise ValueError("El curso no existe")
        
        print(f"✅ [LessonService] Course found: {course.title}")
        
        # Verificar si el usuario tiene permisos para añadir lecciones al curso
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                print(f"❌ [LessonService] User {instructor_id} does not have permission")
                raise ValueError("No tienes permiso para añadir lecciones a este curso")
        
        print(f"✅ [LessonService] User {instructor_id} has permission to create lesson")
        
        # Crear la nueva lección
        lesson = Lesson(
            title=lesson_data.title,
            course_id=lesson_data.course_id,
            order=lesson_data.order,
            content_type=lesson_data.content_type,
            content_url=lesson_data.content_url,
            content_text=lesson_data.content_text,
            duration=lesson_data.duration,
            is_free_preview=lesson_data.is_free_preview,
            attachments=lesson_data.attachments
        )
        
        print(f"📝 [LessonService] Creating lesson object with order: {lesson.order}")
        
        created_lesson = await self.lesson_repository.create(lesson)
        
        print(f"✅ [LessonService] Lesson created with ID: {created_lesson.id}")
        
        # Actualizar la lista de lecciones en el curso
        if created_lesson.id not in course.lessons:
            course.lessons.append(created_lesson.id)
            
            # Actualizar la duración total del curso
            course.total_duration += created_lesson.duration
            
            print(f"📚 [LessonService] Updating course with new lesson. Total lessons: {len(course.lessons)}")
            
            await self.course_repository.update(
                lesson_data.course_id, 
                {
                    "lessons": course.lessons,
                    "total_duration": course.total_duration
                }
            )
            
            print(f"✅ [LessonService] Course updated successfully")
        else:
            print(f"⚠️ [LessonService] Lesson ID already in course lessons list")
        
        print(f"✅ [LessonService] Lesson creation complete: {created_lesson.title}")
        return created_lesson
    
    async def get_lesson_by_id(self, lesson_id: str) -> Optional[Lesson]:
        """
        Obtiene una lección por su ID
        
        Args:
            lesson_id: ID de la lección
        
        Returns:
            La lección encontrada o None
        """
        return await self.lesson_repository.get_by_id(lesson_id)
    
    async def get_course_lessons(self, course_id: str) -> List[Lesson]:
        """
        Obtiene todas las lecciones de un curso
        
        Args:
            course_id: ID del curso
        
        Returns:
            Lista de lecciones del curso
        """
        print(f"🔍 [LessonService] Getting lessons for course: {course_id}")
        
        try:
            lessons = await self.lesson_repository.get_by_course(course_id)
            print(f"✅ [LessonService] Found {len(lessons) if lessons else 0} lessons for course {course_id}")
            
            if lessons and len(lessons) > 0:
                print(f"📋 [LessonService] First lesson: ID={lessons[0].id}, Title={lessons[0].title}, Order={lessons[0].order}")
                # Log all lessons for debugging
                for idx, lesson in enumerate(lessons):
                    print(f"📝 [LessonService] Lesson {idx + 1}: {lesson.title} (order: {lesson.order}, type: {lesson.content_type})")
            else:
                print(f"⚠️ [LessonService] No lessons found for course {course_id}")
            
            return lessons if lessons else []
            
        except Exception as e:
            print(f"💥 [LessonService] Error getting course lessons: {e}")
            print(f"💥 [LessonService] Error type: {type(e).__name__}")
            print(f"💥 [LessonService] Error details: {str(e)}")
            raise e
    
    async def update_lesson(
        self, 
        lesson_id: str, 
        instructor_id: str, 
        lesson_data: LessonUpdate
    ) -> Optional[Lesson]:
        """
        Actualiza la información de una lección
        
        Args:
            lesson_id: ID de la lección a actualizar
            instructor_id: ID del instructor que actualiza la lección
            lesson_data: Datos a actualizar
        
        Returns:
            La lección actualizada o None si no existe
        
        Raises:
            ValueError: Si el usuario no tiene permisos para actualizar la lección
        """
        # Verificar si la lección existe
        lesson = await self.lesson_repository.get_by_id(lesson_id)
        if not lesson:
            return None
        
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(lesson.course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar si el usuario tiene permisos para actualizar la lección
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para actualizar esta lección")
        
        # Actualizar la lección
        update_data = lesson_data.dict(exclude_unset=True)
        
        # Si se actualiza la duración, actualizar también la duración total del curso
        old_duration = lesson.duration
        if "duration" in update_data and update_data["duration"] != old_duration:
            new_duration = update_data["duration"]
            course.total_duration = course.total_duration - old_duration + new_duration
            await self.course_repository.update(
                course.id, 
                {"total_duration": course.total_duration}
            )
        
        return await self.lesson_repository.update(lesson_id, update_data)
    
    async def delete_lesson(self, lesson_id: str, instructor_id: str) -> bool:
        """
        Elimina una lección
        
        Args:
            lesson_id: ID de la lección a eliminar
            instructor_id: ID del instructor que elimina la lección
        
        Returns:
            True si se eliminó correctamente, False si no
        
        Raises:
            ValueError: Si el usuario no tiene permisos para eliminar la lección
        """
        # Verificar si la lección existe
        lesson = await self.lesson_repository.get_by_id(lesson_id)
        if not lesson:
            return False
        
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(lesson.course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar si el usuario tiene permisos para eliminar la lección
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para eliminar esta lección")
        
        # Actualizar la lista de lecciones en el curso y la duración total
        if lesson.id in course.lessons:
            course.lessons.remove(lesson.id)
            course.total_duration -= lesson.duration
            await self.course_repository.update(
                course.id, 
                {
                    "lessons": course.lessons,
                    "total_duration": max(0, course.total_duration)
                }
            )
        
        # Eliminar la lección
        return await self.lesson_repository.delete(lesson_id)
    
    async def reorder_lessons(
        self, 
        course_id: str, 
        instructor_id: str, 
        lesson_order: List[LessonOrderItem]
    ) -> bool:
        """
        Reordena las lecciones de un curso
        
        Args:
            course_id: ID del curso
            instructor_id: ID del instructor que reordena las lecciones
            lesson_order: Lista de elementos con ID de lección y nuevo orden
        
        Returns:
            True si se reordenó correctamente, False si no
        
        Raises:
            ValueError: Si el usuario no tiene permisos para reordenar las lecciones
        """
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar si el usuario tiene permisos para reordenar las lecciones
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para reordenar las lecciones de este curso")
        
        # Preparar los datos de reordenamiento
        order_data = [
            {"lesson_id": item.lesson_id, "order": item.order}
            for item in lesson_order
        ]
        
        # Reordenar las lecciones
        return await self.lesson_repository.reorder(course_id, order_data)
    
    async def update_lesson_video(self, lesson_id: str, video_id: str, instructor_id: str) -> Optional[Lesson]:
        """
        Actualizar el video de una lección
        
        Args:
            lesson_id: ID de la lección
            video_id: ID del video a asociar
            instructor_id: ID del instructor
        
        Returns:
            La lección actualizada o None si no existe
        
        Raises:
            ValueError: Si el usuario no tiene permisos
        """
        # Verificar si la lección existe
        lesson = await self.lesson_repository.get_by_id(lesson_id)
        if not lesson:
            return None
        
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(lesson.course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar permisos
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para actualizar esta lección")
        
        # Actualizar el video de la lección
        lesson.video_url = f"/api/v1/media/video/{video_id}/stream"
        lesson.content_type = "video"
        
        return await self.lesson_repository.update(lesson_id, lesson)
    
    async def create_video_lesson(
        self,
        instructor_id: str,
        course_id: str,
        title: str,
        video_id: str,
        description: Optional[str] = None,
        duration: Optional[int] = None
    ) -> Lesson:
        """
        Crear una nueva lección de video
        
        Args:
            instructor_id: ID del instructor
            course_id: ID del curso
            title: Título de la lección
            video_id: ID del video
            description: Descripción opcional
            duration: Duración en segundos
        
        Returns:
            La lección creada
        
        Raises:
            ValueError: Si el curso no existe o el usuario no tiene permisos
        """
        from ..dtos.lesson_dto import LessonCreate
        
        # Crear datos de la lección
        lesson_data = LessonCreate(
            course_id=course_id,
            title=title,
            description=description or "",
            content="",  # El contenido será el video
            content_type="video",
            duration=duration or 0,
            order=0,  # Se calculará automáticamente
            is_free=False,
            video_url=f"/api/v1/media/video/{video_id}/stream"
        )
        
        return await self.create_lesson(instructor_id, lesson_data)
