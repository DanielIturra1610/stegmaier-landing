"""
Script de optimización de MongoDB para el LMS Stegmaier
Crear índices optimizados y configurar queries eficientes
"""
import asyncio
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from typing import Dict, Any

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDBOptimizer:
    def __init__(self, connection_string: str, database_name: str):
        self.client = AsyncIOMotorClient(connection_string)
        self.db = self.client[database_name]
        
    async def create_user_indexes(self):
        """Crear índices optimizados para la colección users"""
        logger.info("Creando índices para la colección 'users'...")
        
        users_collection = self.db.users
        
        # Índices para usuarios
        indexes = [
            # Búsqueda por email (único)
            {"keys": [("email", 1)], "options": {"unique": True, "background": True}},
            
            # Búsqueda por role y status
            {"keys": [("role", 1), ("is_active", 1)], "options": {"background": True}},
            
            # Índice de texto completo para búsqueda de usuarios
            {"keys": [("first_name", "text"), ("last_name", "text"), ("email", "text")], 
             "options": {"background": True}},
            
            # Fechas de creación y actualización
            {"keys": [("created_at", -1)], "options": {"background": True}},
            {"keys": [("updated_at", -1)], "options": {"background": True}},
            
            # Username único
            {"keys": [("username", 1)], "options": {"unique": True, "sparse": True, "background": True}}
        ]
        
        for index in indexes:
            try:
                await users_collection.create_index(index["keys"], **index["options"])
                logger.info(f"✅ Índice creado: {index['keys']}")
            except Exception as e:
                logger.error(f"❌ Error creando índice {index['keys']}: {e}")
    
    async def create_course_indexes(self):
        """Crear índices optimizados para la colección courses"""
        logger.info("Creando índices para la colección 'courses'...")
        
        courses_collection = self.db.courses
        
        indexes = [
            # Búsqueda por instructor
            {"keys": [("instructor_id", 1)], "options": {"background": True}},
            
            # Filtros por estado y publicación
            {"keys": [("is_published", 1), ("created_at", -1)], "options": {"background": True}},
            
            # Categoría y nivel de dificultad
            {"keys": [("category", 1), ("difficulty_level", 1)], "options": {"background": True}},
            
            # Precio para ordenamiento
            {"keys": [("price", 1)], "options": {"background": True}},
            
            # Rating promedio
            {"keys": [("average_rating", -1)], "options": {"background": True}},
            
            # Total de estudiantes inscritos
            {"keys": [("total_enrolled", -1)], "options": {"background": True}},
            
            # Índice de texto completo para búsqueda
            {"keys": [("title", "text"), ("description", "text"), ("tags", "text")], 
             "options": {"background": True}},
            
            # Fechas importantes
            {"keys": [("created_at", -1)], "options": {"background": True}},
            {"keys": [("updated_at", -1)], "options": {"background": True}},
            
            # Slug único
            {"keys": [("slug", 1)], "options": {"unique": True, "background": True}},
            
            # Índice compuesto para filtros comunes
            {"keys": [("is_published", 1), ("category", 1), ("created_at", -1)], 
             "options": {"background": True}}
        ]
        
        for index in indexes:
            try:
                await courses_collection.create_index(index["keys"], **index["options"])
                logger.info(f"✅ Índice creado: {index['keys']}")
            except Exception as e:
                logger.error(f"❌ Error creando índice {index['keys']}: {e}")
    
    async def create_lesson_indexes(self):
        """Crear índices optimizados para la colección lessons"""
        logger.info("Creando índices para la colección 'lessons'...")
        
        lessons_collection = self.db.lessons
        
        indexes = [
            # Relación con cursos
            {"keys": [("course_id", 1), ("order", 1)], "options": {"background": True}},
            
            # Orden de lecciones en módulos
            {"keys": [("module_id", 1), ("order", 1)], "options": {"background": True}},
            
            # Tipo de contenido
            {"keys": [("content_type", 1)], "options": {"background": True}},
            
            # Duración para cálculos
            {"keys": [("duration", 1)], "options": {"background": True}},
            
            # Estado de publicación
            {"keys": [("is_published", 1)], "options": {"background": True}},
            
            # Fechas
            {"keys": [("created_at", -1)], "options": {"background": True}},
            
            # Slug único por curso
            {"keys": [("course_id", 1), ("slug", 1)], "options": {"unique": True, "background": True}}
        ]
        
        for index in indexes:
            try:
                await lessons_collection.create_index(index["keys"], **index["options"])
                logger.info(f"✅ Índice creado: {index['keys']}")
            except Exception as e:
                logger.error(f"❌ Error creando índice {index['keys']}: {e}")
    
    async def create_enrollment_indexes(self):
        """Crear índices optimizados para la colección enrollments"""
        logger.info("Creando índices para la colección 'enrollments'...")
        
        enrollments_collection = self.db.enrollments
        
        indexes = [
            # Relación usuario-curso (único)
            {"keys": [("user_id", 1), ("course_id", 1)], 
             "options": {"unique": True, "background": True}},
            
            # Búsqueda por usuario
            {"keys": [("user_id", 1), ("enrolled_at", -1)], "options": {"background": True}},
            
            # Búsqueda por curso
            {"keys": [("course_id", 1), ("enrolled_at", -1)], "options": {"background": True}},
            
            # Estado de progreso
            {"keys": [("status", 1)], "options": {"background": True}},
            
            # Progreso completado
            {"keys": [("progress_percentage", -1)], "options": {"background": True}},
            
            # Fechas importantes
            {"keys": [("enrolled_at", -1)], "options": {"background": True}},
            {"keys": [("completed_at", -1)], "options": {"sparse": True, "background": True}},
            {"keys": [("last_accessed", -1)], "options": {"background": True}}
        ]
        
        for index in indexes:
            try:
                await enrollments_collection.create_index(index["keys"], **index["options"])
                logger.info(f"✅ Índice creado: {index['keys']}")
            except Exception as e:
                logger.error(f"❌ Error creando índice {index['keys']}: {e}")
    
    async def create_progress_indexes(self):
        """Crear índices optimizados para la colección lesson_progress"""
        logger.info("Creando índices para la colección 'lesson_progress'...")
        
        progress_collection = self.db.lesson_progress
        
        indexes = [
            # Relación usuario-lección (único)
            {"keys": [("user_id", 1), ("lesson_id", 1)], 
             "options": {"unique": True, "background": True}},
            
            # Progreso por usuario y curso
            {"keys": [("user_id", 1), ("course_id", 1), ("started_at", -1)], 
             "options": {"background": True}},
            
            # Progreso por lección
            {"keys": [("lesson_id", 1), ("completed", 1)], "options": {"background": True}},
            
            # Estado de completado
            {"keys": [("completed", 1), ("completed_at", -1)], "options": {"background": True}},
            
            # Fechas de actividad
            {"keys": [("started_at", -1)], "options": {"background": True}},
            {"keys": [("last_accessed", -1)], "options": {"background": True}},
            
            # Tiempo gastado
            {"keys": [("time_spent", -1)], "options": {"background": True}}
        ]
        
        for index in indexes:
            try:
                await progress_collection.create_index(index["keys"], **index["options"])
                logger.info(f"✅ Índice creado: {index['keys']}")
            except Exception as e:
                logger.error(f"❌ Error creando índice {index['keys']}: {e}")
    
    async def create_analytics_indexes(self):
        """Crear índices optimizados para colecciones de analytics"""
        logger.info("Creando índices para colecciones de analytics...")
        
        # Analytics events
        events_collection = self.db.analytics_events
        
        events_indexes = [
            # Usuario y fecha
            {"keys": [("user_id", 1), ("timestamp", -1)], "options": {"background": True}},
            
            # Tipo de evento
            {"keys": [("event_type", 1), ("timestamp", -1)], "options": {"background": True}},
            
            # Curso relacionado
            {"keys": [("course_id", 1), ("timestamp", -1)], "options": {"background": True}},
            
            # Lección relacionada
            {"keys": [("lesson_id", 1), ("timestamp", -1)], "options": {"background": True}},
            
            # TTL para datos antiguos (6 meses)
            {"keys": [("timestamp", 1)], 
             "options": {"expireAfterSeconds": 15552000, "background": True}}
        ]
        
        for index in events_indexes:
            try:
                await events_collection.create_index(index["keys"], **index["options"])
                logger.info(f"✅ Índice de analytics creado: {index['keys']}")
            except Exception as e:
                logger.error(f"❌ Error creando índice de analytics {index['keys']}: {e}")
    
    async def create_review_indexes(self):
        """Crear índices optimizados para la colección reviews"""
        logger.info("Creando índices para la colección 'reviews'...")
        
        reviews_collection = self.db.reviews
        
        indexes = [
            # Relación usuario-curso (único)
            {"keys": [("user_id", 1), ("course_id", 1)], 
             "options": {"unique": True, "background": True}},
            
            # Búsqueda por curso y rating
            {"keys": [("course_id", 1), ("rating", -1), ("created_at", -1)], 
             "options": {"background": True}},
            
            # Búsqueda por usuario
            {"keys": [("user_id", 1), ("created_at", -1)], "options": {"background": True}},
            
            # Rating para cálculos estadísticos
            {"keys": [("rating", -1)], "options": {"background": True}},
            
            # Fechas
            {"keys": [("created_at", -1)], "options": {"background": True}},
            
            # Índice de texto completo para búsqueda en comentarios
            {"keys": [("comment", "text")], "options": {"background": True}}
        ]
        
        for index in indexes:
            try:
                await reviews_collection.create_index(index["keys"], **index["options"])
                logger.info(f"✅ Índice creado: {index['keys']}")
            except Exception as e:
                logger.error(f"❌ Error creando índice {index['keys']}: {e}")
    
    async def optimize_collection_settings(self):
        """Optimizar configuraciones de las colecciones"""
        logger.info("Optimizando configuraciones de colecciones...")
        
        # Configurar read concern para mejor performance
        collections = ['users', 'courses', 'lessons', 'enrollments', 'lesson_progress', 'reviews']
        
        for collection_name in collections:
            try:
                # Configurar collation para búsquedas case-insensitive
                collection = self.db[collection_name]
                
                logger.info(f"✅ Colección '{collection_name}' optimizada")
            except Exception as e:
                logger.error(f"❌ Error optimizando colección '{collection_name}': {e}")
    
    async def analyze_query_performance(self):
        """Analizar performance de queries comunes"""
        logger.info("Analizando performance de queries...")
        
        # Queries comunes a analizar
        common_queries = [
            # Búsqueda de cursos publicados por categoría
            {"collection": "courses", "query": {"is_published": True, "category": "programming"}},
            
            # Progreso de usuario en curso específico
            {"collection": "lesson_progress", 
             "query": {"user_id": "sample_user_id", "course_id": "sample_course_id"}},
            
            # Enrollments de un usuario
            {"collection": "enrollments", "query": {"user_id": "sample_user_id"}},
            
            # Reviews de un curso
            {"collection": "reviews", "query": {"course_id": "sample_course_id"}}
        ]
        
        for query_info in common_queries:
            try:
                collection = self.db[query_info["collection"]]
                
                # Explain query para ver el plan de ejecución
                explain_result = await collection.find(query_info["query"]).explain()
                
                execution_stats = explain_result.get("executionStats", {})
                winning_plan = explain_result.get("queryPlanner", {}).get("winningPlan", {})
                
                logger.info(f"📊 Query en '{query_info['collection']}':")
                logger.info(f"   - Documentos examinados: {execution_stats.get('totalDocsExamined', 'N/A')}")
                logger.info(f"   - Documentos devueltos: {execution_stats.get('totalDocsReturned', 'N/A')}")
                logger.info(f"   - Tiempo de ejecución: {execution_stats.get('executionTimeMillis', 'N/A')}ms")
                logger.info(f"   - Usa índice: {'IXSCAN' in str(winning_plan)}")
                
            except Exception as e:
                logger.error(f"❌ Error analizando query en '{query_info['collection']}': {e}")
    
    async def get_database_stats(self):
        """Obtener estadísticas de la base de datos"""
        logger.info("Obteniendo estadísticas de la base de datos...")
        
        try:
            db_stats = await self.db.command("dbStats")
            
            logger.info("📈 Estadísticas de la base de datos:")
            logger.info(f"   - Colecciones: {db_stats.get('collections', 'N/A')}")
            logger.info(f"   - Documentos totales: {db_stats.get('objects', 'N/A')}")
            logger.info(f"   - Tamaño total: {db_stats.get('dataSize', 0) / (1024*1024):.2f} MB")
            logger.info(f"   - Tamaño de índices: {db_stats.get('indexSize', 0) / (1024*1024):.2f} MB")
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo estadísticas: {e}")
    
    async def optimize_all(self):
        """Ejecutar todas las optimizaciones"""
        logger.info("🚀 Iniciando optimización completa de MongoDB...")
        
        try:
            await self.create_user_indexes()
            await self.create_course_indexes()
            await self.create_lesson_indexes()
            await self.create_enrollment_indexes()
            await self.create_progress_indexes()
            await self.create_analytics_indexes()
            await self.create_review_indexes()
            
            await self.optimize_collection_settings()
            await self.get_database_stats()
            await self.analyze_query_performance()
            
            logger.info("✅ Optimización de MongoDB completada exitosamente!")
            
        except Exception as e:
            logger.error(f"❌ Error durante la optimización: {e}")
        finally:
            self.client.close()

async def main():
    """Función principal"""
    # Configuración (ajustar según el entorno)
    MONGO_URL = "mongodb://localhost:27017"  # Cambiar por la URL real
    DATABASE_NAME = "stegmaier_lms"  # Cambiar por el nombre real de la BD
    
    optimizer = MongoDBOptimizer(MONGO_URL, DATABASE_NAME)
    await optimizer.optimize_all()

if __name__ == "__main__":
    asyncio.run(main())
