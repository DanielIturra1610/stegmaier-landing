"""
Repositorio de Módulos - Interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from ..entities.module import Module

class ModuleRepository(ABC):
    
    @abstractmethod
    async def create(self, module: Module) -> Module:
        """Crear un nuevo módulo"""
        pass
    
    @abstractmethod
    async def get_by_id(self, module_id: str) -> Optional[Module]:
        """Obtener módulo por ID"""
        pass
    
    @abstractmethod
    async def get_by_course_id(self, course_id: str) -> List[Module]:
        """Obtener todos los módulos de un curso"""
        pass
    
    @abstractmethod
    async def update(self, module_id: str, module_data: Dict[str, Any]) -> Optional[Module]:
        """Actualizar módulo"""
        pass
    
    @abstractmethod
    async def delete(self, module_id: str) -> bool:
        """Eliminar módulo"""
        pass
    
    @abstractmethod
    async def reorder_modules(self, course_id: str, module_orders: List[Dict[str, int]]) -> bool:
        """Reordenar módulos de un curso"""
        pass
    
    @abstractmethod
    async def add_lesson_to_module(self, module_id: str, lesson_id: str) -> bool:
        """Agregar lección a un módulo"""
        pass
    
    @abstractmethod
    async def remove_lesson_from_module(self, module_id: str, lesson_id: str) -> bool:
        """Remover lección de un módulo"""
        pass
    
    @abstractmethod
    async def count_by_course(self, course_id: str) -> int:
        """Contar módulos de un curso"""
        pass
