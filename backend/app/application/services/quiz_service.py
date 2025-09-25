"""
Servicio de aplicación para el sistema de quizzes.
"""
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4

from ..dtos.quiz_dto import (
    QuizCreate, QuizUpdate, QuizResponse, QuizListResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    QuizAttemptCreate, QuizAttemptUpdate, QuizAttemptResponse,
    QuizAnswerSubmit, QuizStatistics, StudentQuizProgress
)
from ...domain.entities.quiz import (
    Quiz, Question, QuizAttempt, QuizAnswer, QuestionOption,
    QuizStatus, AttemptStatus, QuestionType
)
from ...domain.repositories.quiz_repository import QuizRepository
from ...domain.repositories.lesson_repository import LessonRepository
from ...domain.repositories.course_repository import CourseRepository
from ...domain.entities.lesson import ContentType
from fastapi import HTTPException, status
from pydantic import ValidationError


class QuizService:
    """Servicio para gestión de quizzes."""
    
    def __init__(
        self,
        quiz_repository: QuizRepository,
        lesson_repository: LessonRepository,
        course_repository: CourseRepository,
    ):
        self.quiz_repository = quiz_repository
        self.lesson_repository = lesson_repository
        self.course_repository = course_repository

    async def create_quiz_for_lesson(
        self, lesson_id: str, quiz_data: QuizCreate, creator_id: str, user_role: str = None
    ) -> QuizResponse:
        """
        Crea un quiz y lo vincula a una lección existente.
        """
        # 1. Validar que la lección existe
        lesson = await self.lesson_repository.get_by_id(lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lección con ID {lesson_id} no encontrada",
            )

        # 2. Verificar permisos del usuario sobre el curso
        course = await self.course_repository.get_by_id(lesson.course_id)
        logging.info(f"🔍 [QuizService] Course found: {course.title if course else 'None'}")
        logging.info(f"🔍 [QuizService] Course instructor_id: {course.instructor_id if course else 'None'}")
        logging.info(f"🔍 [QuizService] Creator ID: {creator_id}")
        logging.info(f"🔍 [QuizService] Checking permissions: course exists = {course is not None}, instructor match = {course.instructor_id == creator_id if course else False}")

        # Los admins pueden crear quizzes en cualquier curso
        is_admin = user_role == "admin"
        is_instructor_owner = course and course.instructor_id == creator_id

        if not course or (not is_admin and not is_instructor_owner):
            logging.error(f"❌ [QuizService] Permission denied: course exists = {course is not None}, instructor_id = {course.instructor_id if course else 'None'}, creator_id = {creator_id}, user_role = {user_role}, is_admin = {is_admin}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado para crear un quiz para esta lección",
            )

        logging.info(f"✅ [QuizService] Permission granted: is_admin = {is_admin}, is_instructor_owner = {is_instructor_owner}")

        # 3. Verificar si la lección ya tiene un quiz
        if lesson.content_type == ContentType.QUIZ and lesson.quiz_id:
            existing_quiz = await self.quiz_repository.get_quiz_by_id(lesson.quiz_id)
            if existing_quiz:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"La lección ya tiene el quiz '{existing_quiz.title}' asociado.",
                )

        # 4. Crear quiz con lesson_id vinculado
        quiz_data.lesson_id = lesson_id
        quiz_data.course_id = lesson.course_id
        quiz_data.module_id = lesson.module_id

        # Ensure title is set, or use lesson title
        if not quiz_data.title:
            quiz_data.title = f"Quiz para {lesson.title}"

        new_quiz = await self.create_quiz(quiz_data, creator_id)

        # 5. Actualizar la lección para vincular el quiz
        lesson.content_type = ContentType.QUIZ
        lesson.quiz_id = new_quiz.id
        
        update_data = {"content_type": ContentType.QUIZ, "quiz_id": new_quiz.id}
        await self.lesson_repository.update(lesson_id, update_data)


        return new_quiz

    # CRUD de Quizzes
    async def create_quiz(self, quiz_data: QuizCreate, creator_id: str) -> QuizResponse:
        """Crear un nuevo quiz."""
        # Crear entidad Quiz
        quiz = Quiz(
            id=str(uuid4()),
            title=quiz_data.title,
            description=quiz_data.description,
            instructions=quiz_data.instructions,
            course_id=quiz_data.course_id,
            module_id=quiz_data.module_id,
            lesson_id=quiz_data.lesson_id,
            config=quiz_data.config,
            estimated_duration=quiz_data.estimated_duration,
            created_by=creator_id,
            status=QuizStatus.DRAFT
        )
        
        # Cargar preguntas si se proporcionaron IDs
        if quiz_data.questions:
            questions = []
            for question_id in quiz_data.questions:
                question = await self.quiz_repository.get_question_by_id(question_id)
                if question:
                    questions.append(question)
            quiz.questions = questions
        
        quiz.calculate_total_points()
        
        # Guardar en repositorio
        saved_quiz = await self.quiz_repository.create_quiz(quiz)
        return self._quiz_to_response(saved_quiz)

    async def get_quiz_by_id(self, quiz_id: str, user_id: Optional[str] = None) -> QuizResponse:
        """Obtener quiz por ID."""
        quiz = await self.quiz_repository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")
        
        # Verificar disponibilidad para estudiantes
        if user_id and not quiz.is_available_now():
            raise ValidationError("Quiz no disponible actualmente")
        
        return self._quiz_to_response(quiz)

    async def update_quiz(self, quiz_id: str, quiz_data: QuizUpdate, user_id: str) -> QuizResponse:
        """Actualizar quiz existente."""
        quiz = await self.quiz_repository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")
        
        # Verificar permisos
        if quiz.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para modificar este quiz")
        
        # Actualizar campos
        if quiz_data.title is not None:
            quiz.title = quiz_data.title
        if quiz_data.description is not None:
            quiz.description = quiz_data.description
        if quiz_data.instructions is not None:
            quiz.instructions = quiz_data.instructions
        if quiz_data.config is not None:
            quiz.config = quiz_data.config
        if quiz_data.estimated_duration is not None:
            quiz.estimated_duration = quiz_data.estimated_duration
        if quiz_data.status is not None:
            quiz.status = quiz_data.status
            if quiz_data.status == QuizStatus.PUBLISHED:
                quiz.published_at = datetime.utcnow()
        
        quiz.updated_at = datetime.utcnow()
        quiz.calculate_total_points()
        
        updated_quiz = await self.quiz_repository.update_quiz(quiz)
        return self._quiz_to_response(updated_quiz)

    async def delete_quiz(self, quiz_id: str, user_id: str) -> bool:
        """Eliminar quiz."""
        quiz = await self.quiz_repository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")
        
        if quiz.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para eliminar este quiz")
        
        # Verificar si hay intentos
        attempts = await self.quiz_repository.get_attempts_by_quiz(quiz_id)
        if attempts:
            raise ValidationError("No se puede eliminar un quiz con intentos registrados")
        
        return await self.quiz_repository.delete_quiz(quiz_id)

    async def get_quizzes_by_course(self, course_id: str, published_only: bool = True) -> List[QuizListResponse]:
        """Obtener quizzes por curso."""
        quizzes = await self.quiz_repository.get_quizzes_by_course(course_id, published_only)
        
        response_list = []
        for quiz in quizzes:
            response_list.append(QuizListResponse(
                id=quiz.id,
                title=quiz.title,
                description=quiz.description,
                course_id=quiz.course_id,
                module_id=quiz.module_id,
                lesson_id=quiz.lesson_id,
                status=quiz.status,
                total_points=quiz.total_points,
                estimated_duration=quiz.estimated_duration,
                total_attempts=quiz.total_attempts,
                average_score=quiz.average_score,
                completion_rate=quiz.completion_rate,
                created_at=quiz.created_at,
                published_at=quiz.published_at,
                created_by=quiz.created_by,
                is_available=quiz.is_available_now()
            ))
        
        return response_list

    # CRUD de Preguntas
    async def create_question(self, question_data: QuestionCreate, creator_id: str) -> QuestionResponse:
        """Crear nueva pregunta."""
        question = Question(
            id=str(uuid4()),
            type=question_data.type,
            title=question_data.title,
            content=question_data.content,
            explanation=question_data.explanation,
            points=question_data.points,
            time_limit=question_data.time_limit,
            correct_answers=question_data.correct_answers,
            case_sensitive=question_data.case_sensitive,
            pairs=question_data.pairs,
            tags=question_data.tags,
            difficulty=question_data.difficulty,
            created_by=creator_id
        )
        
        # Crear opciones para multiple choice y true/false
        if question_data.options:
            question.options = [
                QuestionOption(
                    id=str(uuid4()),
                    text=opt.text,
                    is_correct=opt.is_correct,
                    explanation=opt.explanation,
                    order=opt.order
                )
                for opt in question_data.options
            ]
        
        saved_question = await self.quiz_repository.create_question(question)
        return self._question_to_response(saved_question)

    async def add_question_to_quiz(self, quiz_id: str, question_id: str, user_id: str) -> bool:
        """Agregar pregunta a quiz."""
        quiz = await self.quiz_repository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")
        
        if quiz.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para modificar este quiz")
        
        question = await self.quiz_repository.get_question_by_id(question_id)
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pregunta con ID {question_id} no encontrada")
        
        # Verificar que no esté ya agregada
        existing_ids = [q.id for q in quiz.questions]
        if question_id in existing_ids:
            raise ValidationError("La pregunta ya está en este quiz")
        
        quiz.questions.append(question)
        quiz.calculate_total_points()
        quiz.updated_at = datetime.utcnow()
        
        await self.quiz_repository.update_quiz(quiz)
        return True

    # Gestión de Intentos
    async def start_quiz_attempt(self, quiz_id: str, student_id: str) -> QuizAttemptResponse:
        """Iniciar nuevo intento de quiz."""
        quiz = await self.quiz_repository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")
        
        if not quiz.is_available_now():
            raise ValidationError("Quiz no disponible actualmente")
        
        # Verificar intentos previos
        existing_attempts = await self.quiz_repository.get_attempts_by_student_and_quiz(student_id, quiz_id)
        
        if not quiz.config.allow_retakes and existing_attempts:
            raise ValidationError("No se permiten reintentos para este quiz")
        
        if quiz.config.max_attempts and len(existing_attempts) >= quiz.config.max_attempts:
            raise ValidationError(f"Máximo de {quiz.config.max_attempts} intentos alcanzado")
        
        # Crear nuevo intento
        attempt = QuizAttempt(
            id=str(uuid4()),
            quiz_id=quiz_id,
            student_id=student_id,
            attempt_number=len(existing_attempts) + 1,
            total_points=quiz.total_points,
            time_remaining=quiz.config.time_limit * 60 if quiz.config.time_limit else None
        )
        
        saved_attempt = await self.quiz_repository.create_attempt(attempt)
        return self._attempt_to_response(saved_attempt)

    async def submit_answer(self, attempt_id: str, answer_data: QuizAnswerSubmit, student_id: str) -> bool:
        """Enviar respuesta a una pregunta."""
        attempt = await self.quiz_repository.get_attempt_by_id(attempt_id)
        if not attempt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Intento con ID {attempt_id} no encontrado")
        
        if attempt.student_id != student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para este intento")
        
        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise ValidationError("El intento no está en progreso")
        
        # Obtener quiz para validaciones
        quiz = await self.quiz_repository.get_quiz_by_id(attempt.quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz no encontrado")
        
        # Verificar si el intento ha expirado
        if attempt.is_expired(quiz):
            attempt.status = AttemptStatus.EXPIRED
            await self.quiz_repository.update_attempt(attempt)
            raise ValidationError("El intento ha expirado")
        
        # Buscar la pregunta
        question = None
        for q in quiz.questions:
            if q.id == answer_data.question_id:
                question = q
                break
        
        if not question:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pregunta no encontrada en este quiz")
        
        # Evaluar respuesta
        is_correct, points_earned = self._evaluate_answer(question, answer_data.answer)
        
        # Crear/actualizar respuesta
        answer = QuizAnswer(
            question_id=answer_data.question_id,
            answer=answer_data.answer,
            time_spent=answer_data.time_spent,
            is_correct=is_correct,
            points_earned=points_earned
        )
        
        # Actualizar o agregar respuesta
        existing_answer_index = None
        for i, existing_answer in enumerate(attempt.answers):
            if existing_answer.question_id == answer_data.question_id:
                existing_answer_index = i
                break
        
        if existing_answer_index is not None:
            attempt.answers[existing_answer_index] = answer
        else:
            attempt.answers.append(answer)
        
        # Actualizar tiempo total
        attempt.time_spent += answer_data.time_spent
        attempt.time_remaining = attempt.get_remaining_time(quiz)
        
        await self.quiz_repository.update_attempt(attempt)
        return True

    async def submit_quiz_attempt(self, attempt_id: str, student_id: str) -> QuizAttemptResponse:
        """Finalizar y enviar intento de quiz."""
        attempt = await self.quiz_repository.get_attempt_by_id(attempt_id)
        if not attempt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Intento con ID {attempt_id} no encontrado")
        
        if attempt.student_id != student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para este intento")
        
        if attempt.status != AttemptStatus.IN_PROGRESS:
            raise ValidationError("El intento no está en progreso")
        
        # Obtener quiz para cálculos finales
        quiz = await self.quiz_repository.get_quiz_by_id(attempt.quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz no encontrado")
        
        # Calcular puntaje final
        attempt.calculate_score(quiz)
        attempt.status = AttemptStatus.SUBMITTED
        attempt.submitted_at = datetime.utcnow()
        
        # Actualizar estadísticas del quiz
        await self._update_quiz_statistics(quiz_id=quiz.id)
        
        updated_attempt = await self.quiz_repository.update_attempt(attempt)
        return self._attempt_to_response(updated_attempt)

    async def get_attempt_by_id(self, attempt_id: str, user_id: str) -> QuizAttemptResponse:
        """Obtener intento por ID."""
        attempt = await self.quiz_repository.get_attempt_by_id(attempt_id)
        if not attempt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Intento con ID {attempt_id} no encontrado")
        
        if attempt.student_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para ver este intento")
        
        return self._attempt_to_response(attempt)

    async def get_quiz_statistics(self, quiz_id: str, user_id: str) -> QuizStatistics:
        """
        Obtener estadísticas detalladas de un quiz.
        """
        quiz = await self.quiz_repository.get_quiz_by_id(quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")

        # Basic permission check
        # A more robust check for admin role should be done here if needed
        # For now, we assume the check is done at the endpoint level
        
        attempts = await self.quiz_repository.get_attempts_by_quiz(quiz_id)
        
        total_attempts = len(attempts)
        completed_attempts = [a for a in attempts if a.status in [AttemptStatus.SUBMITTED, AttemptStatus.GRADED]]
        
        if not completed_attempts:
            return QuizStatistics(
                quiz_id=quiz.id,
                quiz_title=quiz.title,
                total_attempts=total_attempts,
                unique_students=len(set(a.student_id for a in attempts)),
                average_score=0,
                median_score=0,
                pass_rate=0,
                completion_rate=0,
                average_time=0,
                question_statistics=[]
            )

        # Unique students
        unique_students = len(set(a.student_id for a in attempts))

        # Scores
        scores = [a.score_percentage for a in completed_attempts if a.score_percentage is not None]
        average_score = sum(scores) / len(scores) if scores else 0
        
        # Median score
        median_score = 0
        if scores:
            sorted_scores = sorted(scores)
            n = len(sorted_scores)
            if n % 2 == 0:
                mid1 = sorted_scores[n//2 - 1]
                mid2 = sorted_scores[n//2]
                median_score = (mid1 + mid2) / 2
            else:
                median_score = sorted_scores[n//2]

        # Pass rate
        passing_score = quiz.config.passing_score if quiz.config and quiz.config.passing_score else 70.0
        passed_attempts = [a for a in completed_attempts if a.score_percentage is not None and a.score_percentage >= passing_score]
        pass_rate = (len(passed_attempts) / len(completed_attempts)) * 100 if completed_attempts else 0

        # Completion rate
        completion_rate = (len(completed_attempts) / total_attempts) * 100 if total_attempts > 0 else 0

        # Average time
        time_spent_list = [a.time_spent for a in completed_attempts if a.time_spent is not None]
        average_time = sum(time_spent_list) / len(time_spent_list) if time_spent_list else 0

        # Question statistics
        question_stats = []
        if quiz.questions:
            for question in quiz.questions:
                question_attempts = [ans for attempt in completed_attempts for ans in attempt.answers if ans.question_id == question.id]
                
                if not question_attempts:
                    question_stats.append({
                        "question_id": question.id,
                        "question_title": question.title,
                        "correct_percentage": 0,
                        "average_time_spent": 0,
                        "answers_distribution": {}
                    })
                    continue

                correct_answers = sum(1 for qa in question_attempts if qa.is_correct)
                correct_percentage = (correct_answers / len(question_attempts)) * 100 if question_attempts else 0
                
                time_spent_on_question = [qa.time_spent for qa in question_attempts if qa.time_spent is not None]
                average_time_spent = sum(time_spent_on_question) / len(time_spent_on_question) if time_spent_on_question else 0

                # Answers distribution (for multiple choice)
                answers_dist = {}
                if question.type == QuestionType.MULTIPLE_CHOICE and question.options:
                    option_map = {opt.id: opt.text for opt in question.options}
                    for opt_text in option_map.values():
                        answers_dist[opt_text] = 0

                    for qa in question_attempts:
                        # qa.answer is the option ID
                        if qa.answer in option_map:
                            option_text = option_map[qa.answer]
                            if option_text in answers_dist:
                                answers_dist[option_text] += 1
                
                question_stats.append({
                    "question_id": question.id,
                    "question_title": question.title,
                    "correct_percentage": correct_percentage,
                    "average_time_spent": average_time_spent,
                    "answers_distribution": answers_dist
                })

        return QuizStatistics(
            quiz_id=quiz.id,
            quiz_title=quiz.title,
            total_attempts=total_attempts,
            unique_students=unique_students,
            average_score=average_score,
            median_score=median_score,
            pass_rate=pass_rate,
            completion_rate=completion_rate,
            average_time=average_time,
            question_statistics=question_stats
        )

    # Métodos de utilidad
    def _evaluate_answer(self, question: Question, student_answer: Any) -> tuple[bool, float]:
        """Evaluar respuesta del estudiante."""
        is_correct = False
        points_earned = 0.0
        
        if question.type == QuestionType.MULTIPLE_CHOICE:
            # Para multiple choice, comparar con opciones correctas
            correct_option_ids = [opt.id for opt in question.options if opt.is_correct]
            if student_answer in correct_option_ids:
                is_correct = True
                points_earned = question.points
        
        elif question.type == QuestionType.TRUE_FALSE:
            # Para true/false, buscar la opción correcta
            correct_option = next((opt for opt in question.options if opt.is_correct), None)
            if correct_option and student_answer == correct_option.id:
                is_correct = True
                points_earned = question.points
        
        elif question.type == QuestionType.FILL_IN_BLANK:
            # Para fill-in-blank, comparar con respuestas correctas
            student_text = str(student_answer).strip()
            if not question.case_sensitive:
                student_text = student_text.lower()
                correct_answers = [ans.lower() for ans in question.correct_answers]
            else:
                correct_answers = question.correct_answers
            
            if student_text in correct_answers:
                is_correct = True
                points_earned = question.points
        
        elif question.type == QuestionType.ORDERING:
            # Para ordering, comparar secuencia
            if isinstance(student_answer, list) and student_answer == question.correct_answers:
                is_correct = True
                points_earned = question.points
        
        elif question.type == QuestionType.MATCHING:
            # Para matching, comparar pares
            if isinstance(student_answer, dict):
                expected_pairs = {pair["key"]: pair["value"] for pair in question.pairs}
                if student_answer == expected_pairs:
                    is_correct = True
                    points_earned = question.points
        
        return is_correct, points_earned

    async def _update_quiz_statistics(self, quiz_id: str):
        """Actualizar estadísticas del quiz."""
        attempts = await self.quiz_repository.get_attempts_by_quiz(quiz_id)
        if not attempts:
            return
        
        completed_attempts = [a for a in attempts if a.status in [AttemptStatus.SUBMITTED, AttemptStatus.GRADED]]
        if not completed_attempts:
            return
        
        # Calcular estadísticas
        total_attempts = len(attempts)
        total_score = sum(a.score_percentage for a in completed_attempts)
        average_score = total_score / len(completed_attempts) if completed_attempts else 0
        completion_rate = (len(completed_attempts) / total_attempts) * 100 if total_attempts > 0 else 0
        
        # Actualizar quiz
        quiz = await self.quiz_repository.get_quiz_by_id(quiz_id)
        if quiz:
            quiz.total_attempts = total_attempts
            quiz.average_score = average_score
            quiz.completion_rate = completion_rate
            await self.quiz_repository.update_quiz(quiz)

    def _quiz_to_response(self, quiz: Quiz) -> QuizResponse:
        """Convertir entidad Quiz a DTO de respuesta."""
        return QuizResponse(
            id=quiz.id,
            title=quiz.title,
            description=quiz.description,
            instructions=quiz.instructions,
            course_id=quiz.course_id,
            module_id=quiz.module_id,
            lesson_id=quiz.lesson_id,
            questions=[self._question_to_response(q) for q in quiz.questions],
            question_pool=quiz.question_pool,
            config=quiz.config,
            status=quiz.status,
            total_points=quiz.total_points,
            estimated_duration=quiz.estimated_duration,
            created_at=quiz.created_at,
            updated_at=quiz.updated_at,
            published_at=quiz.published_at,
            created_by=quiz.created_by,
            total_attempts=quiz.total_attempts,
            average_score=quiz.average_score,
            completion_rate=quiz.completion_rate,
            is_available=quiz.is_available_now()
        )

    def _question_to_response(self, question: Question) -> QuestionResponse:
        """Convertir entidad Question a DTO de respuesta."""
        return QuestionResponse(
            id=question.id,
            type=question.type,
            title=question.title,
            content=question.content,
            explanation=question.explanation,
            points=question.points,
            time_limit=question.time_limit,
            options=[
                {
                    "id": opt.id,
                    "text": opt.text,
                    "is_correct": opt.is_correct,
                    "explanation": opt.explanation,
                    "order": opt.order
                }
                for opt in question.options
            ],
            correct_answers=question.correct_answers,
            case_sensitive=question.case_sensitive,
            pairs=question.pairs,
            tags=question.tags,
            difficulty=question.difficulty,
            created_at=question.created_at,
            updated_at=question.updated_at,
            created_by=question.created_by
        )

    def _attempt_to_response(self, attempt: QuizAttempt) -> QuizAttemptResponse:
        """Convertir entidad QuizAttempt a DTO de respuesta."""
        return QuizAttemptResponse(
            id=attempt.id,
            quiz_id=attempt.quiz_id,
            student_id=attempt.student_id,
            status=attempt.status,
            attempt_number=attempt.attempt_number,
            answers=[
                {
                    "question_id": ans.question_id,
                    "answer": ans.answer,
                    "time_spent": ans.time_spent,
                    "is_correct": ans.is_correct,
                    "points_earned": ans.points_earned,
                    "submitted_at": ans.submitted_at
                }
                for ans in attempt.answers
            ],
            current_question_index=attempt.current_question_index,
            total_points=attempt.total_points,
            points_earned=attempt.points_earned,
            score_percentage=attempt.score_percentage,
            is_passing=attempt.is_passing,
            started_at=attempt.started_at,
            submitted_at=attempt.submitted_at,
            time_spent=attempt.time_spent,
            time_remaining=attempt.time_remaining
        )
