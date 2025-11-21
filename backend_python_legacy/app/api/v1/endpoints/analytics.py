"""
Endpoints para analytics y métricas
"""
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from ....domain.entities.user import User
from ....application.services.analytics_service import AnalyticsService
from ....dependencies import get_analytics_service
from ...deps import get_current_admin_user, get_current_user

router = APIRouter()

@router.get("/platform", summary="Métricas generales de la plataforma")
async def get_platform_analytics(
    start_date: Optional[date] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_admin_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Obtiene métricas generales de la plataforma para administradores
    """
    try:
        metrics = await analytics_service.get_platform_metrics(
            start_date=start_date,
            end_date=end_date
        )
        
        return {
            "success": True,
            "data": metrics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo métricas: {str(e)}"
        )

@router.get("/courses/{course_id}", summary="Analytics de curso específico")
async def get_course_analytics(
    course_id: str,
    current_user: User = Depends(get_current_admin_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Obtiene analytics detallados de un curso específico
    """
    try:
        analytics = await analytics_service.get_course_analytics(course_id)
        
        if not analytics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curso no encontrado"
            )
        
        return {
            "success": True,
            "data": analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo analytics del curso: {str(e)}"
        )

@router.get("/users/{user_id}", summary="Analytics de usuario específico")
async def get_user_analytics(
    user_id: str,
    current_user: User = Depends(get_current_admin_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Obtiene analytics detallados de un usuario específico
    """
    try:
        analytics = await analytics_service.get_user_analytics(user_id)
        
        if not analytics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return {
            "success": True,
            "data": analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo analytics del usuario: {str(e)}"
        )

@router.get("/courses/popular", summary="Cursos más populares")
async def get_popular_courses(
    limit: int = Query(10, ge=1, le=50, description="Número de cursos a retornar"),
    period_days: int = Query(30, ge=1, le=365, description="Período en días"),
    current_user: User = Depends(get_current_admin_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Obtiene los cursos más populares en un período específico
    """
    try:
        popular_courses = await analytics_service.get_popular_courses(
            limit=limit,
            period_days=period_days
        )
        
        return {
            "success": True,
            "data": {
                "period_days": period_days,
                "courses": popular_courses
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo cursos populares: {str(e)}"
        )

@router.get("/revenue", summary="Analytics de ingresos")
async def get_revenue_analytics(
    start_date: Optional[date] = Query(None, description="Fecha de inicio"),
    end_date: Optional[date] = Query(None, description="Fecha de fin"),
    current_user: User = Depends(get_current_admin_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Obtiene analytics de ingresos para administradores
    """
    try:
        revenue_data = await analytics_service.get_revenue_analytics(
            start_date=start_date,
            end_date=end_date
        )
        
        return {
            "success": True,
            "data": revenue_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo analytics de ingresos: {str(e)}"
        )

@router.post("/track", summary="Registrar actividad de usuario")
async def track_user_activity(
    activity_type: str,
    resource_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    metadata: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Registra una actividad de usuario para tracking
    """
    try:
        activity = await analytics_service.track_user_activity(
            user_id=current_user.id,
            activity_type=activity_type,
            resource_id=resource_id,
            resource_type=resource_type,
            metadata=metadata
        )
        
        return {
            "success": True,
            "message": "Actividad registrada exitosamente",
            "activity_id": activity.id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registrando actividad: {str(e)}"
        )

@router.get("/my-stats", summary="Estadísticas del usuario actual")
async def get_my_analytics(
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Obtiene las estadísticas del usuario actual (no requiere permisos admin)
    """
    try:
        analytics = await analytics_service.get_user_analytics(current_user.id)
        
        # Filtrar información sensible para usuarios no admin
        filtered_analytics = {
            "learning_stats": analytics.get("learning_stats", {}),
            "engagement_stats": analytics.get("engagement_stats", {}),
            "recent_activity": analytics.get("recent_activity", [])
        }
        
        return {
            "success": True,
            "data": filtered_analytics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo mis estadísticas: {str(e)}"
        )

@router.post("/activity", summary="Registrar actividad de usuario (frontend compatible)")
async def track_activity(
    activity_data: dict,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Endpoint compatible con frontend para registrar actividad de usuario
    Mapea la estructura del frontend al servicio backend
    """
    try:
        activity = await analytics_service.track_user_activity(
            user_id=current_user.id,
            activity_type=activity_data.get("activity_type"),
            resource_id=activity_data.get("course_id") or activity_data.get("lesson_id"),
            resource_type="course" if activity_data.get("course_id") else ("lesson" if activity_data.get("lesson_id") else None),
            metadata=activity_data.get("metadata", {})
        )
        
        return {
            "success": True,
            "message": "Actividad registrada exitosamente",
            "activity_id": activity.id if activity else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registrando actividad: {str(e)}"
        )

@router.post("/activity/batch", summary="Registrar múltiples actividades de usuario")
async def track_batch_activities(
    batch_data: dict,
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Endpoint para registrar múltiples actividades en lote
    """
    try:
        events = batch_data.get("events", [])
        activity_ids = []
        
        for event in events:
            activity = await analytics_service.track_user_activity(
                user_id=current_user.id,
                activity_type=event.get("activity_type"),
                resource_id=event.get("course_id") or event.get("lesson_id"),
                resource_type="course" if event.get("course_id") else ("lesson" if event.get("lesson_id") else None),
                metadata=event.get("metadata", {})
            )
            if activity:
                activity_ids.append(activity.id)
        
        return {
            "success": True,
            "message": f"Se registraron {len(activity_ids)} actividades exitosamente",
            "activity_ids": activity_ids
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registrando actividades en lote: {str(e)}"
        )

@router.get("/users/me", summary="Analytics del usuario actual (alternativa)")
async def get_user_me_analytics(
    current_user: User = Depends(get_current_user),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Endpoint alternativo para compatibilidad con frontend testing
    Equivalente a /my-stats pero con ruta /users/me
    """
    try:
        analytics = await analytics_service.get_user_analytics(current_user.id)
        
        # Filtrar información sensible para usuarios no admin
        filtered_analytics = {
            "learning_stats": analytics.get("learning_stats", {}),
            "engagement_stats": analytics.get("engagement_stats", {}),
            "recent_activity": analytics.get("recent_activity", [])
        }
        
        return {
            "success": True,
            "data": filtered_analytics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo analytics del usuario: {str(e)}"
        )
