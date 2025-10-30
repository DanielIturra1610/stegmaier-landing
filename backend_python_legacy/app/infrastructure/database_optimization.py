"""
Optimizaciones de queries y agregaciones para MongoDB en el LMS
"""
from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class DatabaseQueryOptimizer:
    """Optimizaciones de queries para mejor performance"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
    
    async def get_courses_optimized(
        self,
        skip: int = 0,
        limit: int = 10,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        is_published: bool = True,
        sort_by: str = "created_at",
        sort_order: int = -1
    ) -> List[Dict[str, Any]]:
        """
        Query optimizada para obtener cursos con filtros
        Usa índices compuestos y proyección selectiva
        """
        # Construir filtros dinámicamente
        match_conditions = {"is_published": is_published}
        
        if category:
            match_conditions["category"] = category
        if difficulty:
            match_conditions["difficulty_level"] = difficulty
        
        # Pipeline de agregación optimizada
        pipeline = [
            {"$match": match_conditions},
            
            # Proyección temprana para reducir datos
            {"$project": {
                "title": 1,
                "description": 1,
                "instructor_id": 1,
                "category": 1,
                "difficulty_level": 1,
                "price": 1,
                "thumbnail_url": 1,
                "average_rating": 1,
                "total_enrolled": 1,
                "total_lessons": 1,
                "estimated_duration": 1,
                "created_at": 1,
                "updated_at": 1,
                "slug": 1,
                "tags": 1
            }},
            
            # Lookup optimizado para instructor
            {"$lookup": {
                "from": "users",
                "localField": "instructor_id",
                "foreignField": "_id",
                "as": "instructor",
                "pipeline": [
                    {"$project": {"first_name": 1, "last_name": 1, "email": 1}}
                ]
            }},
            
            # Desenrrollar instructor
            {"$unwind": {"path": "$instructor", "preserveNullAndEmptyArrays": True}},
            
            # Ordenamiento usando índice
            {"$sort": {sort_by: sort_order}},
            
            # Paginación
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        cursor = self.db.courses.aggregate(pipeline, allowDiskUse=True)
        return await cursor.to_list(length=limit)
    
    async def get_user_enrollments_with_progress(
        self,
        user_id: str,
        include_completed: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Obtener enrollments de usuario con progreso calculado
        Usa agregación optimizada con múltiples lookups
        """
        match_conditions = {"user_id": ObjectId(user_id)}
        if not include_completed:
            match_conditions["status"] = {"$ne": "completed"}
        
        pipeline = [
            {"$match": match_conditions},
            
            # Lookup del curso
            {"$lookup": {
                "from": "courses",
                "localField": "course_id",
                "foreignField": "_id",
                "as": "course",
                "pipeline": [
                    {"$project": {
                        "title": 1,
                        "thumbnail_url": 1,
                        "instructor_id": 1,
                        "total_lessons": 1,
                        "estimated_duration": 1
                    }}
                ]
            }},
            {"$unwind": "$course"},
            
            # Lookup del progreso de lecciones
            {"$lookup": {
                "from": "lesson_progress",
                "let": {"user_id": "$user_id", "course_id": "$course_id"},
                "pipeline": [
                    {"$match": {
                        "$expr": {
                            "$and": [
                                {"$eq": ["$user_id", "$$user_id"]},
                                {"$eq": ["$course_id", "$$course_id"]}
                            ]
                        }
                    }},
                    {"$group": {
                        "_id": None,
                        "completed_lessons": {"$sum": {"$cond": ["$completed", 1, 0]}},
                        "total_time_spent": {"$sum": "$time_spent"}
                    }}
                ],
                "as": "progress_stats"
            }},
            
            # Calcular progreso
            {"$addFields": {
                "progress_stats": {"$arrayElemAt": ["$progress_stats", 0]},
                "calculated_progress": {
                    "$cond": [
                        {"$gt": ["$course.total_lessons", 0]},
                        {
                            "$multiply": [
                                {"$divide": [
                                    {"$ifNull": [{"$arrayElemAt": ["$progress_stats.completed_lessons", 0]}, 0]},
                                    "$course.total_lessons"
                                ]},
                                100
                            ]
                        },
                        0
                    ]
                }
            }},
            
            # Ordenar por última actividad
            {"$sort": {"last_accessed": -1}}
        ]
        
        cursor = self.db.enrollments.aggregate(pipeline, allowDiskUse=True)
        return await cursor.to_list(length=None)
    
    async def get_course_analytics_summary(
        self,
        course_id: str,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Resumen analítico de un curso con métricas agregadas
        """
        from datetime import datetime, timedelta
        
        date_threshold = datetime.utcnow() - timedelta(days=days_back)
        course_object_id = ObjectId(course_id)
        
        # Pipeline para estadísticas del curso
        pipeline = [
            {"$match": {"_id": course_object_id}},
            
            # Lookup de enrollments
            {"$lookup": {
                "from": "enrollments",
                "localField": "_id",
                "foreignField": "course_id",
                "as": "enrollments"
            }},
            
            # Lookup de reviews
            {"$lookup": {
                "from": "reviews",
                "localField": "_id",
                "foreignField": "course_id",
                "as": "reviews"
            }},
            
            # Lookup de progreso de lecciones
            {"$lookup": {
                "from": "lesson_progress",
                "localField": "_id",
                "foreignField": "course_id",
                "as": "lesson_progress"
            }},
            
            # Lookup de eventos de analytics recientes
            {"$lookup": {
                "from": "analytics_events",
                "let": {"course_id": "$_id"},
                "pipeline": [
                    {"$match": {
                        "$expr": {"$eq": ["$course_id", "$$course_id"]},
                        "timestamp": {"$gte": date_threshold}
                    }}
                ],
                "as": "recent_events"
            }},
            
            # Calcular métricas
            {"$project": {
                "title": 1,
                "total_enrolled": {"$size": "$enrollments"},
                "completed_enrollments": {
                    "$size": {"$filter": {
                        "input": "$enrollments",
                        "cond": {"$eq": ["$$this.status", "completed"]}
                    }}
                },
                "average_rating": {
                    "$cond": [
                        {"$gt": [{"$size": "$reviews"}, 0]},
                        {"$avg": "$reviews.rating"},
                        0
                    ]
                },
                "total_reviews": {"$size": "$reviews"},
                "completion_rate": {
                    "$cond": [
                        {"$gt": [{"$size": "$enrollments"}, 0]},
                        {
                            "$multiply": [
                                {"$divide": [
                                    {"$size": {"$filter": {
                                        "input": "$enrollments",
                                        "cond": {"$eq": ["$$this.status", "completed"]}
                                    }}},
                                    {"$size": "$enrollments"}
                                ]},
                                100
                            ]
                        },
                        0
                    ]
                },
                "total_study_time": {"$sum": "$lesson_progress.time_spent"},
                "recent_activity_count": {"$size": "$recent_events"},
                "recent_enrollments": {
                    "$size": {"$filter": {
                        "input": "$enrollments",
                        "cond": {"$gte": ["$$this.enrolled_at", date_threshold]}
                    }}
                }
            }}
        ]
        
        cursor = self.db.courses.aggregate(pipeline)
        results = await cursor.to_list(length=1)
        return results[0] if results else {}
    
    async def get_instructor_dashboard_stats(
        self,
        instructor_id: str
    ) -> Dict[str, Any]:
        """
        Estadísticas del dashboard del instructor
        """
        instructor_object_id = ObjectId(instructor_id)
        
        # Agregación para estadísticas del instructor
        pipeline = [
            {"$match": {"instructor_id": instructor_object_id}},
            
            # Lookup de enrollments
            {"$lookup": {
                "from": "enrollments",
                "localField": "_id",
                "foreignField": "course_id",
                "as": "enrollments"
            }},
            
            # Lookup de reviews
            {"$lookup": {
                "from": "reviews",
                "localField": "_id",  
                "foreignField": "course_id",
                "as": "reviews"
            }},
            
            # Agrupar todas las estadísticas
            {"$group": {
                "_id": None,
                "total_courses": {"$sum": 1},
                "published_courses": {"$sum": {"$cond": ["$is_published", 1, 0]}},
                "draft_courses": {"$sum": {"$cond": ["$is_published", 0, 1]}},
                "total_students": {"$sum": {"$size": "$enrollments"}},
                "total_reviews": {"$sum": {"$size": "$reviews"}},
                "average_rating": {"$avg": {"$avg": "$reviews.rating"}},
                "total_revenue": {"$sum": {
                    "$multiply": [
                        "$price",
                        {"$size": {"$filter": {
                            "input": "$enrollments",
                            "cond": {"$eq": ["$$this.payment_status", "completed"]}
                        }}}
                    ]
                }},
                "courses": {"$push": {
                    "id": "$_id",
                    "title": "$title",
                    "students": {"$size": "$enrollments"},
                    "rating": {"$avg": "$reviews.rating"},
                    "revenue": {
                        "$multiply": [
                            "$price",
                            {"$size": {"$filter": {
                                "input": "$enrollments",
                                "cond": {"$eq": ["$$this.payment_status", "completed"]}
                            }}}
                        ]
                    }
                }}
            }}
        ]
        
        cursor = self.db.courses.aggregate(pipeline)
        results = await cursor.to_list(length=1)
        return results[0] if results else {}
    
    async def get_admin_platform_stats(self) -> Dict[str, Any]:
        """
        Estadísticas globales de la plataforma para admin
        """
        from datetime import datetime, timedelta
        
        last_30_days = datetime.utcnow() - timedelta(days=30)
        
        # Usar múltiples agregaciones paralelas para mejor performance
        stats = {}
        
        # Stats de usuarios
        user_stats = await self.db.users.aggregate([
            {"$group": {
                "_id": None,
                "total_users": {"$sum": 1},
                "active_users": {"$sum": {"$cond": ["$is_active", 1, 0]}},
                "instructors": {"$sum": {"$cond": [{"$eq": ["$role", "instructor"]}, 1, 0]}},
                "students": {"$sum": {"$cond": [{"$eq": ["$role", "student"]}, 1, 0]}},
                "new_users_30d": {"$sum": {"$cond": [{"$gte": ["$created_at", last_30_days]}, 1, 0]}}
            }}
        ]).to_list(length=1)
        
        # Stats de cursos
        course_stats = await self.db.courses.aggregate([
            {"$group": {
                "_id": None,
                "total_courses": {"$sum": 1},
                "published_courses": {"$sum": {"$cond": ["$is_published", 1, 0]}},
                "draft_courses": {"$sum": {"$cond": ["$is_published", 0, 1]}},
                "new_courses_30d": {"$sum": {"$cond": [{"$gte": ["$created_at", last_30_days]}, 1, 0]}}
            }}
        ]).to_list(length=1)
        
        # Stats de enrollments
        enrollment_stats = await self.db.enrollments.aggregate([
            {"$group": {
                "_id": None,
                "total_enrollments": {"$sum": 1},
                "completed_enrollments": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
                "active_enrollments": {"$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}},
                "new_enrollments_30d": {"$sum": {"$cond": [{"$gte": ["$enrolled_at", last_30_days]}, 1, 0]}}
            }}
        ]).to_list(length=1)
        
        # Combinar resultados
        stats.update(user_stats[0] if user_stats else {})
        stats.update(course_stats[0] if course_stats else {})
        stats.update(enrollment_stats[0] if enrollment_stats else {})
        
        return stats
    
    async def optimize_slow_queries(self):
        """
        Identificar y optimizar queries lentas
        """
        # Habilitar profiling para queries lentas (>100ms)
        await self.db.command("profile", 2, slowms=100)
        
        # Obtener queries más lentas
        slow_queries = await self.db.system.profile.find().sort("ms", -1).limit(10).to_list(length=10)
        
        logger.info("Top 10 queries más lentas:")
        for query in slow_queries:
            logger.info(f"- Duración: {query.get('ms', 0)}ms")
            logger.info(f"  Comando: {query.get('command', {}).get('find', 'N/A')}")
            logger.info(f"  Namespace: {query.get('ns', 'N/A')}")
        
        return slow_queries
    
    async def create_aggregation_indexes(self):
        """
        Crear índices específicos para agregaciones comunes
        """
        indexes_to_create = [
            # Índices para user dashboard
            {
                "collection": "enrollments",
                "index": [("user_id", 1), ("status", 1), ("last_accessed", -1)],
                "options": {"background": True}
            },
            
            # Índices para instructor analytics
            {
                "collection": "courses",
                "index": [("instructor_id", 1), ("is_published", 1), ("created_at", -1)],
                "options": {"background": True}
            },
            
            # Índices para admin stats
            {
                "collection": "users",
                "index": [("role", 1), ("is_active", 1), ("created_at", -1)],
                "options": {"background": True}
            },
            
            # Índices para analytics events con TTL
            {
                "collection": "analytics_events",
                "index": [("course_id", 1), ("event_type", 1), ("timestamp", -1)],
                "options": {"background": True}
            }
        ]
        
        for index_info in indexes_to_create:
            try:
                collection = self.db[index_info["collection"]]
                await collection.create_index(
                    index_info["index"], 
                    **index_info["options"]
                )
                logger.info(f"✅ Índice de agregación creado: {index_info['collection']}.{index_info['index']}")
            except Exception as e:
                logger.error(f"❌ Error creando índice: {e}")
