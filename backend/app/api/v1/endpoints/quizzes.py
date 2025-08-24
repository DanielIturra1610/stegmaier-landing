"""
Endpoints API para el sistema de quizzes.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer

from ....application.dtos.quiz_dto import (
    QuizCreate, QuizUpdate, QuizResponse, QuizListResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    QuizAttemptCreate, QuizAttemptUpdate, QuizAttemptResponse,
    QuizAnswerSubmit, QuizStatistics, StudentQuizProgress
)
from ....application.services.quiz_service import QuizService
from ....core.dependencies import get_current_user, get_current_admin_user
from ....core.dependencies import get_quiz_service
from ....domain.entities.user import User
from ....infrastructure.exceptions import (
    NotFoundError, ValidationError, UnauthorizedError
)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])
security = HTTPBearer()


# CRUD de Quizzes
@router.post("/", response_model=QuizResponse)
async def create_quiz(
    quiz_data: QuizCreate,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Crear un nuevo quiz.
    
    - Requiere permisos de instructor o admin
    - El quiz se crea en estado DRAFT por defecto
    """
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Solo instructores y administradores pueden crear quizzes")
    
    try:
        return await quiz_service.create_quiz(quiz_data, current_user.id)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Obtener quiz por ID.
    
    - Los estudiantes solo pueden ver quizzes publicados y disponibles
    - Los instructores pueden ver sus propios quizzes
    - Los admins pueden ver cualquier quiz
    """
    try:
        quiz = await quiz_service.get_quiz_by_id(quiz_id, current_user.id)
        
        # Verificar permisos para quiz no publicado
        if quiz.status != "published" and current_user.role == "student":
            raise HTTPException(status_code=403, detail="Quiz no disponible")
        
        # Si es instructor, verificar que sea el creador
        if current_user.role == "instructor" and quiz.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="No autorizado para ver este quiz")
        
        return quiz
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: str,
    quiz_data: QuizUpdate,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Actualizar quiz existente.
    
    - Solo el creador del quiz puede modificarlo
    - Los admins pueden modificar cualquier quiz
    """
    try:
        # Los estudiantes no pueden actualizar quizzes
        if current_user.role == "student":
            raise HTTPException(status_code=403, detail="No autorizado para modificar quizzes")
        
        return await quiz_service.update_quiz(quiz_id, quiz_data, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Eliminar quiz.
    
    - Solo el creador del quiz puede eliminarlo
    - Los admins pueden eliminar cualquier quiz
    - No se puede eliminar un quiz con intentos registrados
    """
    try:
        if current_user.role == "student":
            raise HTTPException(status_code=403, detail="No autorizado para eliminar quizzes")
        
        success = await quiz_service.delete_quiz(quiz_id, current_user.id)
        if success:
            return {"message": "Quiz eliminado exitosamente"}
        else:
            raise HTTPException(status_code=400, detail="Error al eliminar quiz")
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/course/{course_id}", response_model=List[QuizListResponse])
async def get_quizzes_by_course(
    course_id: str,
    published_only: bool = Query(True, description="Solo mostrar quizzes publicados"),
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Obtener quizzes por curso.
    
    - Los estudiantes solo ven quizzes publicados
    - Los instructores pueden ver todos sus quizzes del curso
    - Los admins pueden ver todos los quizzes del curso
    """
    try:
        # Para estudiantes, solo mostrar publicados
        if current_user.role == "student":
            published_only = True
        
        return await quiz_service.get_quizzes_by_course(course_id, published_only)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener quizzes: {str(e)}")


# CRUD de Preguntas
@router.post("/questions", response_model=QuestionResponse)
async def create_question(
    question_data: QuestionCreate,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Crear nueva pregunta.
    
    - Requiere permisos de instructor o admin
    """
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Solo instructores y administradores pueden crear preguntas")
    
    try:
        return await quiz_service.create_question(question_data, current_user.id)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{quiz_id}/questions/{question_id}")
async def add_question_to_quiz(
    quiz_id: str,
    question_id: str,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Agregar pregunta existente a un quiz.
    
    - Solo el creador del quiz puede agregar preguntas
    - Los admins pueden modificar cualquier quiz
    """
    try:
        if current_user.role == "student":
            raise HTTPException(status_code=403, detail="No autorizado para modificar quizzes")
        
        success = await quiz_service.add_question_to_quiz(quiz_id, question_id, current_user.id)
        if success:
            return {"message": "Pregunta agregada exitosamente"}
        else:
            raise HTTPException(status_code=400, detail="Error al agregar pregunta")
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Gestión de Intentos de Quiz
@router.post("/{quiz_id}/attempts", response_model=QuizAttemptResponse)
async def start_quiz_attempt(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Iniciar nuevo intento de quiz.
    
    - Solo estudiantes pueden iniciar intentos
    - Verifica disponibilidad y límites de intentos
    """
    try:
        return await quiz_service.start_quiz_attempt(quiz_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/attempts/{attempt_id}/answers")
async def submit_answer(
    attempt_id: str,
    answer_data: QuizAnswerSubmit,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Enviar respuesta a una pregunta específica.
    
    - Solo el estudiante que inició el intento puede enviar respuestas
    - Verifica que el intento esté en progreso y no haya expirado
    """
    try:
        success = await quiz_service.submit_answer(attempt_id, answer_data, current_user.id)
        if success:
            return {"message": "Respuesta guardada exitosamente"}
        else:
            raise HTTPException(status_code=400, detail="Error al guardar respuesta")
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/attempts/{attempt_id}/submit", response_model=QuizAttemptResponse)
async def submit_quiz_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Finalizar y enviar intento de quiz.
    
    - Solo el estudiante que inició el intento puede finalizarlo
    - Calcula el puntaje final y actualiza estadísticas
    """
    try:
        return await quiz_service.submit_quiz_attempt(attempt_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/attempts/{attempt_id}", response_model=QuizAttemptResponse)
async def get_quiz_attempt(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Obtener intento de quiz por ID.
    
    - Solo el estudiante propietario puede ver sus intentos
    - Los instructores pueden ver intentos de sus quizzes
    - Los admins pueden ver cualquier intento
    """
    try:
        return await quiz_service.get_attempt_by_id(attempt_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except UnauthorizedError as e:
        raise HTTPException(status_code=403, detail=str(e))


# Endpoints para estudiantes
@router.get("/lesson/{lesson_id}/quiz", response_model=Optional[QuizResponse])
async def get_quiz_by_lesson(
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Obtener quiz asociado a una lección específica.
    
    - Solo devuelve quizzes publicados y disponibles para estudiantes
    """
    try:
        # Buscar quiz por lesson_id
        # Nota: Esta funcionalidad requiere implementar búsqueda por lesson_id en el repository
        # Por ahora retornamos None si no se encuentra
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al buscar quiz: {str(e)}")


# Endpoints administrativos
@router.get("/admin/statistics/{quiz_id}", response_model=QuizStatistics)
async def get_quiz_statistics(
    quiz_id: str,
    current_user: User = Depends(get_current_admin_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Obtener estadísticas detalladas de un quiz.
    
    - Solo para administradores
    """
    try:
        # Esta funcionalidad requiere implementación adicional en el service
        # Por ahora retornamos estadísticas básicas
        quiz = await quiz_service.get_quiz_by_id(quiz_id)
        
        return QuizStatistics(
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            total_attempts=quiz.total_attempts,
            unique_students=0,  # Requiere cálculo específico
            average_score=quiz.average_score,
            median_score=0.0,  # Requiere cálculo específico
            pass_rate=0.0,  # Requiere cálculo específico
            completion_rate=quiz.completion_rate,
            average_time=0,  # Requiere cálculo específico
            question_statistics=[]  # Requiere análisis por pregunta
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/student/{student_id}/progress", response_model=StudentQuizProgress)
async def get_student_quiz_progress(
    student_id: str,
    course_id: str = Query(..., description="ID del curso"),
    current_user: User = Depends(get_current_user),
    quiz_service: QuizService = Depends(get_quiz_service)
):
    """
    Obtener progreso de quizzes de un estudiante en un curso.
    
    - Los estudiantes solo pueden ver su propio progreso
    - Los instructores pueden ver progreso de estudiantes en sus cursos
    - Los admins pueden ver cualquier progreso
    """
    try:
        # Verificar permisos
        if current_user.role == "student" and current_user.id != student_id:
            raise HTTPException(status_code=403, detail="Solo puedes ver tu propio progreso")
        
        # Esta funcionalidad requiere implementación específica
        # Por ahora retornamos progreso básico
        return StudentQuizProgress(
            student_id=student_id,
            course_id=course_id,
            quizzes_available=0,
            quizzes_attempted=0,
            quizzes_completed=0,
            quizzes_passed=0,
            average_score=0.0,
            total_time_spent=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener progreso: {str(e)}")
