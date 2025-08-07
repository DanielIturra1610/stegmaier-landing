"""
Servicio para la gestión de cursos
"""
from typing import List, Optional, Dict, Any
from ...domain.repositories.course_repository import CourseRepository
from ...domain.repositories.user_repository import UserRepository
from ...domain.entities.course import Course
from ..dtos.course_dto import CourseCreate, CourseUpdate

class CourseService:
    """
    Servicio para la gestión de cursos que implementa la lógica de negocio
    """
    
    def __init__(
        self, 
        course_repository: CourseRepository,
        user_repository: UserRepository
    ):
        self.course_repository = course_repository
        self.user_repository = user_repository
    
    async def create_course(self, instructor_id: str, course_data: CourseCreate) -> Course:
        """
        Crea un nuevo curso
        
        Args:
            instructor_id: ID del instructor que crea el curso
            course_data: Datos del curso a crear
        
        Returns:
            El curso creado
        
        Raises:
            ValueError: Si el instructor no existe o no tiene rol de instructor
        """
        # Verificar si el instructor existe y tiene permisos
        instructor = await self.user_repository.get_by_id(instructor_id)
        if not instructor:
            raise ValueError("El instructor no existe")
        
        if instructor.role != "instructor" and instructor.role != "admin":
            raise ValueError("El usuario no tiene permisos para crear cursos")
        
        # Crear el nuevo curso
        course = Course(
            title=course_data.title,
            description=course_data.description,
            instructor_id=instructor_id,
            cover_image=course_data.cover_image,
            price=course_data.price,
            discount_price=course_data.discount_price,
            level=course_data.level,
            category=course_data.category,
            tags=course_data.tags,
            requirements=course_data.requirements,
            what_you_will_learn=course_data.what_you_will_learn,
            is_published=False  # Por defecto, los cursos se crean sin publicar
        )
        
        created_course = await self.course_repository.create(course)
        
        # Actualizar la lista de cursos creados por el instructor
        instructor.created_courses.append(created_course.id)
        await self.user_repository.update(
            instructor_id, 
            {"created_courses": instructor.created_courses}
        )
        
        return created_course
    
    async def get_course_by_id(self, course_id: str) -> Optional[Course]:
        """
        Obtiene un curso por su ID
        
        Args:
            course_id: ID del curso
        
        Returns:
            El curso encontrado o None
        """
        return await self.course_repository.get_by_id(course_id)
    
    async def list_courses(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        **filters
    ) -> List[Course]:
        """
        Lista cursos con paginación y filtros opcionales
        
        Args:
            skip: Número de cursos a saltar
            limit: Número máximo de cursos a devolver
            **filters: Filtros opcionales (category, level, is_published)
        
        Returns:
            Lista de cursos
        """
        return await self.course_repository.list(skip, limit, **filters)
    
    async def get_instructor_courses(self, instructor_id: str) -> List[Course]:
        """
        Obtiene todos los cursos creados por un instructor
        
        Args:
            instructor_id: ID del instructor
        
        Returns:
            Lista de cursos del instructor
        """
        return await self.course_repository.get_by_instructor(instructor_id)
    
    async def search_courses(self, query: str, skip: int = 0, limit: int = 20) -> List[Course]:
        """
        Busca cursos por título, descripción o etiquetas
        
        Args:
            query: Texto a buscar
            skip: Número de cursos a saltar
            limit: Número máximo de cursos a devolver
        
        Returns:
            Lista de cursos que coinciden con la búsqueda
        """
        return await self.course_repository.search(query, skip, limit)
    
    async def update_course(
        self, 
        course_id: str, 
        instructor_id: str, 
        course_data: CourseUpdate
    ) -> Optional[Course]:
        """
        Actualiza la información de un curso
        
        Args:
            course_id: ID del curso a actualizar
            instructor_id: ID del instructor que actualiza el curso
            course_data: Datos a actualizar
        
        Returns:
            El curso actualizado o None si no existe
        
        Raises:
            ValueError: Si el usuario no es el instructor del curso o un administrador
        """
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            return None
        
        # Verificar si el usuario tiene permiso para actualizar el curso
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para actualizar este curso")
        
        # Actualizar el curso
        update_data = course_data.dict(exclude_unset=True)
        return await self.course_repository.update(course_id, update_data)
    
    async def delete_course(self, course_id: str, instructor_id: str) -> bool:
        """
        Elimina un curso
        
        Args:
            course_id: ID del curso a eliminar
            instructor_id: ID del instructor que elimina el curso
        
        Returns:
            True si se eliminó correctamente, False si no
        
        Raises:
            ValueError: Si el usuario no es el instructor del curso o un administrador
        """
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            return False
        
        # Verificar si el usuario tiene permiso para eliminar el curso
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para eliminar este curso")
        
        # Actualizar la lista de cursos creados por el instructor
        instructor = await self.user_repository.get_by_id(course.instructor_id)
        if instructor and course.id in instructor.created_courses:
            instructor.created_courses.remove(course.id)
            await self.user_repository.update(
                course.instructor_id, 
                {"created_courses": instructor.created_courses}
            )
        
        # Eliminar el curso
        return await self.course_repository.delete(course_id)
    
    async def update_course_rating(self, course_id: str, new_rating: float) -> bool:
        """
        Actualiza la calificación promedio de un curso
        
        Args:
            course_id: ID del curso
            new_rating: Nueva calificación promedio
        
        Returns:
            True si se actualizó correctamente, False si no
        """
        return await self.course_repository.update_rating(course_id, new_rating)
    
    async def publish_course(self, course_id: str, instructor_id: str) -> Optional[Course]:
        """
        Publica un curso para que esté disponible para los estudiantes
        
        Args:
            course_id: ID del curso a publicar
            instructor_id: ID del instructor que publica el curso
        
        Returns:
            El curso publicado o None si no existe
        
        Raises:
            ValueError: Si el usuario no es el instructor del curso o un administrador
                       o si el curso no tiene lecciones
        """
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            return None
        
        # Verificar si el usuario tiene permiso para publicar el curso
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para publicar este curso")
        
        # Verificar que el curso tenga al menos una lección
        if not course.lessons or len(course.lessons) == 0:
            raise ValueError("No se puede publicar un curso sin lecciones")
        
        # Publicar el curso
        return await self.course_repository.update(course_id, {"is_published": True})
    
    # Métodos administrativos añadidos para el panel admin
    async def count_all(self) -> int:
        """
        Cuenta total de cursos
        """
        return await self.course_repository.count()

    async def count_published(self) -> int:
        """
        Cuenta cursos publicados
        """
        return await self.course_repository.count_by_status(is_published=True)

    async def get_all_admin(self, skip: int = 0, limit: int = 20, is_published: Optional[bool] = None):
        """
        Lista cursos con filtros admin
        """
        return await self.course_repository.get_all_filtered(
            skip=skip, 
            limit=limit, 
            is_published=is_published
        )
    
    # Nuevos métodos para gestión administrativa
    async def create_course_admin(
        self, 
        course_data: Dict[str, Any], 
        instructor_id: str
    ) -> Course:
        """
        Crear curso desde panel admin con validaciones específicas
        """
        from datetime import datetime
        
        # Validar datos requeridos
        required_fields = ['title', 'description', 'level', 'category']
        for field in required_fields:
            if not course_data.get(field):
                raise ValueError(f"Campo requerido: {field}")
        
        # Crear curso con datos por defecto para admin
        course = Course(
            title=course_data['title'],
            description=course_data['description'],
            instructor_id=instructor_id,
            level=course_data['level'],
            category=course_data['category'],
            cover_image=course_data.get('cover_image', ''),
            price=course_data.get('price', 0.0),
            discount_price=course_data.get('discount_price', 0.0),
            tags=course_data.get('tags', []),
            requirements=course_data.get('requirements', []),
            what_you_will_learn=course_data.get('what_you_will_learn', []),
            is_published=False,  # Siempre empezar como borrador
            total_duration=0,
            total_students=0,
            average_rating=0.0,
            lessons=[],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        return await self.course_repository.create(course)

    async def update_course_admin(
        self, 
        course_id: str, 
        course_data: Dict[str, Any],
        user_id: str
    ) -> Optional[Course]:
        """
        Actualizar curso desde panel admin
        """
        from datetime import datetime
        
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            return None
        
        # Verificar permisos (instructor del curso o admin)
        # Esta verificación se hace en el endpoint
        
        # Actualizar campos permitidos
        updateable_fields = [
            'title', 'description', 'level', 'category', 'cover_image',
            'price', 'discount_price', 'tags', 'requirements', 'what_you_will_learn'
        ]
        
        for field in updateable_fields:
            if field in course_data:
                setattr(course, field, course_data[field])
        
        course.updated_at = datetime.utcnow()
        
        return await self.course_repository.update(course)

    async def get_course_with_lessons_admin(self, course_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtener curso con todas sus lecciones para edición admin
        """
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            return None
        
        # Obtener lecciones del curso (simulado por ahora)
        lessons = []  # TODO: Implementar cuando tengamos lesson_repository
        
        return {
            "course": course,
            "lessons": sorted(lessons, key=lambda x: getattr(x, 'order', 0)),
            "total_lessons": len(lessons),
            "total_duration": sum(getattr(lesson, 'duration', 0) or 0 for lesson in lessons)
        }

    async def publish_course_admin(self, course_id: str, user_id: str) -> Optional[Course]:
        """
        Publicar/despublicar curso desde admin
        """
        from datetime import datetime
        
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            return None
        
        # Validar que el curso tenga al menos una lección (simplificado por ahora)
        # lessons = await self.lesson_repository.get_by_course_id(course_id)
        # if not lessons:
        #     raise ValueError("No se puede publicar un curso sin lecciones")
        
        # Cambiar estado de publicación
        course.is_published = not course.is_published
        course.updated_at = datetime.utcnow()
        
        # Preparar datos para actualización
        update_data = {
            "is_published": course.is_published,
            "updated_at": course.updated_at
        }
        
        return await self.course_repository.update(course.id, update_data)

    async def get_courses_with_stats(
        self, 
        skip: int = 0, 
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Obtener cursos con estadísticas básicas para admin
        """
        courses = await self.course_repository.get_all_filtered(
            skip=skip, 
            limit=limit, 
            **filters if filters else {}
        )
        
        # Añadir estadísticas básicas a cada curso
        courses_with_stats = []
        for course in courses:
            # Contar lecciones (simulado por ahora)
            lessons_count = 0  # TODO: Implementar cuando tengamos lesson_repository
            
            # Contar inscripciones activas (simulado por ahora)
            enrollments_count = 0  # TODO: Implementar cuando tengamos enrollment_repository
            
            courses_with_stats.append({
                **course.dict(),
                "lessons_count": lessons_count,
                "enrollments_count": enrollments_count,
                "status_label": "Publicado" if course.is_published else "Borrador"
            })
        
        return courses_with_stats
    
    async def count_active_enrollments(self, course_id: str) -> int:
        """
        Contar inscripciones activas de un curso
        """
        # TODO: Implementar cuando tengamos enrollment_repository
        return 0
    
    async def delete_course_admin(self, course_id: str) -> bool:
        """
        Eliminar curso (solo si no tiene inscripciones activas)
        """
        # Verificar si tiene inscripciones activas
        enrollments_count = await self.count_active_enrollments(course_id)
        
        if enrollments_count > 0:
            raise ValueError(f"No se puede eliminar el curso. Tiene {enrollments_count} inscripciones activas")
        
        return await self.course_repository.delete(course_id)
