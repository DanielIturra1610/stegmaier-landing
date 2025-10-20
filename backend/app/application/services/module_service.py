"""
Servicio de Módulos
Lógica de negocio para gestión de módulos de cursos
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.domain.entities.module import Module
from app.domain.repositories.module_repository import ModuleRepository
from app.domain.repositories.course_repository import CourseRepository
from app.domain.repositories.lesson_repository import LessonRepository

class ModuleService:
    
    def __init__(
        self, 
        module_repository: ModuleRepository,
        course_repository: CourseRepository,
        lesson_repository: LessonRepository
    ):
        self.module_repository = module_repository
        self.course_repository = course_repository
        self.lesson_repository = lesson_repository
    
    async def create_module(self, course_id: str, module_data: Dict[str, Any]) -> Optional[Module]:
        """Crear un nuevo módulo en un curso"""
        # Verificar que el curso existe
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            return None
        
        # Si no se especifica order, usar el siguiente disponible
        if "order" not in module_data:
            modules_count = await self.module_repository.count_by_course(course_id)
            module_data["order"] = modules_count + 1
        
        # Crear módulo
        module = Module(
            course_id=course_id,
            **module_data
        )
        
        return await self.module_repository.create(module)
    
    async def get_module_by_id(self, module_id: str) -> Optional[Module]:
        """Obtener módulo por ID"""
        return await self.module_repository.get_by_id(module_id)
    
    async def get_course_modules(self, course_id: str) -> List[Module]:
        """Obtener todos los módulos de un curso ordenados"""
        return await self.module_repository.get_by_course_id(course_id)
    
    async def get_module_with_lessons(self, module_id: str) -> Optional[Dict[str, Any]]:
        """Obtener módulo con información completa de sus lecciones"""
        module = await self.module_repository.get_by_id(module_id)
        if not module:
            return None
        
        # Obtener información de las lecciones
        lessons = []
        for lesson_id in module.lessons:
            lesson = await self.lesson_repository.get_by_id(lesson_id)
            if lesson:
                lessons.append(lesson)
        
        # Ordenar lecciones por order
        lessons.sort(key=lambda x: x.order)
        
        return {
            "module": module,
            "lessons": lessons,
            "lessons_count": len(lessons),
            "total_duration": sum(lesson.duration for lesson in lessons)
        }
    
    async def update_module(self, module_id: str, module_data: Dict[str, Any]) -> Optional[Module]:
        """Actualizar módulo"""
        # Verificar que el módulo existe
        existing_module = await self.module_repository.get_by_id(module_id)
        if not existing_module:
            return None
        
        # Si se cambia el order, verificar conflictos
        if "order" in module_data:
            new_order = module_data["order"]
            if new_order != existing_module.order:
                await self._handle_order_change(
                    existing_module.course_id, 
                    module_id, 
                    existing_module.order, 
                    new_order
                )
        
        return await self.module_repository.update(module_id, module_data)
    
    async def delete_module(self, module_id: str) -> bool:
        """Eliminar módulo y reorganizar orden"""
        # Obtener módulo antes de eliminar
        module = await self.module_repository.get_by_id(module_id)
        if not module:
            return False
        
        # Eliminar módulo
        deleted = await self.module_repository.delete(module_id)
        
        if deleted:
            # Reordenar módulos restantes
            await self._reorder_after_deletion(module.course_id, module.order)
        
        return deleted
    
    async def reorder_course_modules(self, course_id: str, module_orders: List[Dict[str, int]]) -> bool:
        """Reordenar todos los módulos de un curso"""
        return await self.module_repository.reorder_modules(course_id, module_orders)
    
    async def add_lesson_to_module(self, module_id: str, lesson_id: str) -> bool:
        """Agregar lección a módulo"""
        # Verificar que tanto módulo como lección existen
        module = await self.module_repository.get_by_id(module_id)
        lesson = await self.lesson_repository.get_by_id(lesson_id)
        
        if not module or not lesson:
            return False
        
        # Verificar que la lección pertenece al mismo curso
        if lesson.course_id != module.course_id:
            return False
        
        return await self.module_repository.add_lesson_to_module(module_id, lesson_id)
    
    async def remove_lesson_from_module(self, module_id: str, lesson_id: str) -> bool:
        """Remover lección de módulo"""
        return await self.module_repository.remove_lesson_from_module(module_id, lesson_id)
    
    async def get_course_structure(self, course_id: str) -> Dict[str, Any]:
        """Obtener estructura completa del curso: módulos con sus lecciones"""
        modules = await self.get_course_modules(course_id)
        
        course_structure = {
            "course_id": course_id,
            "modules": [],
            "total_modules": len(modules),
            "total_lessons": 0,
            "total_duration": 0
        }
        
        for module in modules:
            module_data = await self.get_module_with_lessons(module.id)
            if module_data:
                # ✅ FIX: Aplanar estructura para coincidir con ModuleWithLessons
                module_dict = module_data["module"].dict()
                module_with_lessons = {
                    **module_dict,
                    "lessons": [lesson.dict() for lesson in module_data["lessons"]],
                    "lessons_count": module_data["lessons_count"],
                    "total_duration": module_data["total_duration"]
                }
                course_structure["modules"].append(module_with_lessons)
                course_structure["total_lessons"] += module_data["lessons_count"]
                course_structure["total_duration"] += module_data["total_duration"]
        
        return course_structure
    
    # Métodos privados para manejo interno
    
    async def _handle_order_change(self, course_id: str, module_id: str, old_order: int, new_order: int):
        """Manejar cambio de orden de módulo"""
        if old_order == new_order:
            return
        
        modules = await self.module_repository.get_by_course_id(course_id)
        
        # Reorganizar órdenes
        for module in modules:
            if module.id == module_id:
                continue
            
            current_order = module.order
            
            # Lógica de reordenamiento
            if old_order < new_order:
                # Mover hacia abajo: los módulos entre old_order y new_order suben
                if old_order < current_order <= new_order:
                    await self.module_repository.update(module.id, {"order": current_order - 1})
            else:
                # Mover hacia arriba: los módulos entre new_order y old_order bajan
                if new_order <= current_order < old_order:
                    await self.module_repository.update(module.id, {"order": current_order + 1})
    
    async def _reorder_after_deletion(self, course_id: str, deleted_order: int):
        """Reordenar módulos después de eliminación"""
        modules = await self.module_repository.get_by_course_id(course_id)
        
        # Bajar el orden de todos los módulos que estaban después del eliminado
        for module in modules:
            if module.order > deleted_order:
                await self.module_repository.update(module.id, {"order": module.order - 1})
