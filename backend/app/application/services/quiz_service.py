"""
Servicio de aplicación para el sistema de quizzes.
"""
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4
from bson import ObjectId

from ..dtos.quiz_dto import (
    QuizCreate, QuizUpdate, QuizResponse, QuizListResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    QuizAttemptCreate, QuizAttemptUpdate, QuizAttemptResponse,
    QuizAnswerSubmit, QuizStatistics, StudentQuizProgress,
    QuizConfigurationResponse
)
from ...domain.entities.quiz import (
    Quiz, Question, QuizAttempt, QuizAnswer, QuestionOption,
    QuizStatus, AttemptStatus, QuestionType, QuizConfiguration
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
        logging.info(f"🔍 [QuizService] Step 3: Checking if lesson already has quiz...")
        logging.info(f"🔍 [QuizService] Lesson content_type: {lesson.content_type}, quiz_id: {lesson.quiz_id}")

        if lesson.content_type == ContentType.QUIZ and lesson.quiz_id:
            existing_quiz = await self.quiz_repository.get_by_id(lesson.quiz_id)
            if existing_quiz:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"La lección ya tiene el quiz '{existing_quiz.title}' asociado.",
                )

        # 4. Crear quiz con lesson_id vinculado
        logging.info(f"🔍 [QuizService] Step 4: Creating quiz data...")
        quiz_data.lesson_id = lesson_id
        quiz_data.course_id = lesson.course_id
        quiz_data.module_id = lesson.module_id

        # Ensure title is set, or use lesson title
        if not quiz_data.title:
            quiz_data.title = f"Quiz para {lesson.title}"

        logging.info(f"🔍 [QuizService] Quiz data prepared: title='{quiz_data.title}', lesson_id={lesson_id}")
        logging.info(f"🔍 [QuizService] Calling create_quiz method...")

        new_quiz = await self.create_quiz(quiz_data, creator_id)
        logging.info(f"✅ [QuizService] Quiz created successfully with ID: {new_quiz.id}")

        # 5. Actualizar la lección para vincular el quiz (SIN cambiar el content_type)
        logging.info(f"🔍 [QuizService] Step 5: Linking quiz to lesson...")

        # Solo agregar quiz_id, NO cambiar content_type
        update_data = {"quiz_id": new_quiz.id}
        logging.info(f"🔍 [QuizService] Updating lesson {lesson_id} with quiz_id: {new_quiz.id}")

        await self.lesson_repository.update(lesson_id, update_data)
        logging.info(f"✅ [QuizService] Lesson updated successfully - quiz linked without changing content type")

        logging.info(f"🎉 [QuizService] create_quiz_for_lesson completed successfully!")
        return new_quiz

    # CRUD de Quizzes
    async def create_quiz(self, quiz_data: QuizCreate, creator_id: str) -> QuizResponse:
        """Crear un nuevo quiz."""
        logging.info(f"🔍 [QuizService.create_quiz] Starting quiz creation...")
        logging.info(f"🔍 [QuizService.create_quiz] Quiz data: title='{quiz_data.title}', course_id={quiz_data.course_id}")

        try:
            # Crear entidad Quiz
            logging.info(f"🔍 [QuizService.create_quiz] Creating Quiz entity...")

            # Convertir DTO QuizConfigurationCreate a entidad QuizConfiguration
            domain_config = QuizConfiguration(
                shuffle_questions=quiz_data.config.shuffle_questions,
                shuffle_answers=quiz_data.config.shuffle_answers,
                show_results_immediately=quiz_data.config.show_results_immediately,
                show_correct_answers=quiz_data.config.show_correct_answers,
                allow_review=getattr(quiz_data.config, 'allow_review', True),  # ✅ AÑADIDO
                allow_retakes=quiz_data.config.allow_retakes,
                max_attempts=quiz_data.config.max_attempts,
                passing_score=quiz_data.config.passing_score,
                time_limit=quiz_data.config.time_limit,
                available_from=quiz_data.config.available_from,
                available_until=quiz_data.config.available_until,
                require_proctor=quiz_data.config.require_proctor,
                randomize_from_pool=quiz_data.config.randomize_from_pool,
                questions_per_attempt=quiz_data.config.questions_per_attempt
            )

            quiz = Quiz(
                id=str(ObjectId()),
                title=quiz_data.title,
                description=quiz_data.description,
                instructions=quiz_data.instructions,
                course_id=quiz_data.course_id,
                module_id=quiz_data.module_id,
                lesson_id=quiz_data.lesson_id,
                config=domain_config,
                estimated_duration=quiz_data.estimated_duration,
                created_by=creator_id,
                status=QuizStatus.DRAFT
            )
            logging.info(f"✅ [QuizService.create_quiz] Quiz entity created with ID: {quiz.id}")

            # Cargar preguntas si se proporcionaron IDs
            logging.info(f"🔍 [QuizService.create_quiz] Processing questions: {len(quiz_data.questions) if quiz_data.questions else 0} provided")
            if quiz_data.questions:
                questions = []
                for question_id in quiz_data.questions:
                    question = await self.quiz_repository.get_question_by_id(question_id)
                    if question:
                        questions.append(question)
                quiz.questions = questions
                logging.info(f"✅ [QuizService.create_quiz] Loaded {len(questions)} questions")

            logging.info(f"🔍 [QuizService.create_quiz] Calculating total points...")
            quiz.calculate_total_points()
            logging.info(f"✅ [QuizService.create_quiz] Total points calculated: {quiz.total_points}")

            # Guardar en repositorio
            logging.info(f"🔍 [QuizService.create_quiz] Saving to repository...")
            saved_quiz = await self.quiz_repository.create(quiz)
            logging.info(f"✅ [QuizService.create_quiz] Quiz saved successfully")

            logging.info(f"🔍 [QuizService.create_quiz] Converting to response...")
            response = self._quiz_to_response(saved_quiz)
            logging.info(f"✅ [QuizService.create_quiz] Quiz creation completed successfully")
            return response

        except Exception as e:
            logging.error(f"❌ [QuizService.create_quiz] Error during quiz creation: {str(e)}")
            logging.error(f"❌ [QuizService.create_quiz] Error type: {type(e)}")
            import traceback
            logging.error(f"❌ [QuizService.create_quiz] Traceback: {traceback.format_exc()}")
            raise

    async def get_by_id(self, quiz_id: str, user_id: Optional[str] = None) -> QuizResponse:
        """Obtener quiz por ID."""
        try:
            logging.info(f"🔍 [QuizService.get_by_id] Getting quiz {quiz_id} for user {user_id}")

            quiz = await self.quiz_repository.get_by_id(quiz_id)
            if not quiz:
                logging.warning(f"❌ [QuizService.get_by_id] Quiz {quiz_id} not found")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")

            # ✅ Validar que el quiz tenga configuración válida
            if not quiz.config:
                logging.warning(f"⚠️ [QuizService.get_by_id] Quiz {quiz_id} sin configuración, usando valores por defecto")
                from ...domain.entities.quiz import QuizConfiguration
                quiz.config = QuizConfiguration()

            # ✅ CORREGIDO: Verificar disponibilidad solo para estudiantes, no para admins/instructores
            # Los admins e instructores deben poder ver cualquier quiz para gestión
            # Solo restringir a estudiantes por fechas de disponibilidad
            # Nota: Aquí no tenemos acceso al rol del usuario, se debe verificar en el endpoint

            logging.info(f"✅ [QuizService.get_by_id] Quiz {quiz_id} retrieved successfully")
            return self._quiz_to_response(quiz)

        except HTTPException as he:
            # Re-raise HTTP exceptions
            raise he
        except Exception as e:
            logging.error(f"❌ [QuizService.get_by_id] Unexpected error for quiz {quiz_id}: {str(e)}")
            logging.error(f"❌ [QuizService.get_by_id] Error type: {type(e)}")
            import traceback
            logging.error(f"❌ [QuizService.get_by_id] Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error interno del servidor: {str(e)}")

    async def get_quiz_by_id(self, quiz_id: str, user_id: Optional[str] = None) -> QuizResponse:
        """Alias para get_by_id - obtener quiz por ID."""
        return await self.get_by_id(quiz_id, user_id)

    async def update_quiz(self, quiz_id: str, quiz_data: QuizUpdate, user_id: str) -> QuizResponse:
        """Actualizar quiz existente."""
        try:
            logging.info(f"🔍 [QuizService.update_quiz] Updating quiz {quiz_id} for user {user_id}")

            quiz = await self.quiz_repository.get_by_id(quiz_id)
            if not quiz:
                logging.warning(f"❌ [QuizService.update_quiz] Quiz {quiz_id} not found")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")

            # ✅ Validar que el quiz tenga configuración válida
            if not quiz.config:
                logging.warning(f"⚠️ [QuizService.update_quiz] Quiz {quiz_id} sin configuración, usando valores por defecto")
                from ...domain.entities.quiz import QuizConfiguration
                quiz.config = QuizConfiguration()

            # Verificar permisos
            if quiz.created_by != user_id:
                logging.warning(f"❌ [QuizService.update_quiz] User {user_id} not authorized to modify quiz {quiz_id}")
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para modificar este quiz")

            # Actualizar campos con validación
            if quiz_data.title is not None:
                quiz.title = quiz_data.title
            if quiz_data.description is not None:
                quiz.description = quiz_data.description
            if quiz_data.instructions is not None:
                quiz.instructions = quiz_data.instructions
            if quiz_data.config is not None:
                # ✅ Convertir DTO a entidad con validación
                from ...domain.entities.quiz import QuizConfiguration
                new_config = QuizConfiguration(
                    shuffle_questions=quiz_data.config.shuffle_questions,
                    shuffle_answers=quiz_data.config.shuffle_answers,
                    show_results_immediately=quiz_data.config.show_results_immediately,
                    show_correct_answers=quiz_data.config.show_correct_answers,
                    allow_review=getattr(quiz_data.config, 'allow_review', True),
                    allow_retakes=quiz_data.config.allow_retakes,
                    max_attempts=quiz_data.config.max_attempts,
                    passing_score=quiz_data.config.passing_score,
                    time_limit=quiz_data.config.time_limit,
                    available_from=quiz_data.config.available_from,
                    available_until=quiz_data.config.available_until,
                    require_proctor=quiz_data.config.require_proctor,
                    randomize_from_pool=quiz_data.config.randomize_from_pool,
                    questions_per_attempt=quiz_data.config.questions_per_attempt
                )
                quiz.config = new_config
            if quiz_data.estimated_duration is not None:
                quiz.estimated_duration = quiz_data.estimated_duration
            if quiz_data.status is not None:
                quiz.status = quiz_data.status
                if quiz_data.status == QuizStatus.PUBLISHED:
                    quiz.published_at = datetime.utcnow()

            quiz.updated_at = datetime.utcnow()
            quiz.calculate_total_points()

            logging.info(f"🔍 [QuizService.update_quiz] Saving updated quiz {quiz_id}")
            updated_quiz = await self.quiz_repository.update(quiz_id, quiz.to_dict())

            if not updated_quiz:
                logging.error(f"❌ [QuizService.update_quiz] Failed to save quiz {quiz_id}")
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al guardar el quiz")

            logging.info(f"✅ [QuizService.update_quiz] Quiz {quiz_id} updated successfully")
            return self._quiz_to_response(updated_quiz)

        except HTTPException as he:
            # Re-raise HTTP exceptions
            raise he
        except Exception as e:
            logging.error(f"❌ [QuizService.update_quiz] Unexpected error for quiz {quiz_id}: {str(e)}")
            logging.error(f"❌ [QuizService.update_quiz] Error type: {type(e)}")
            import traceback
            logging.error(f"❌ [QuizService.update_quiz] Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error interno del servidor: {str(e)}")

    async def delete_quiz(self, quiz_id: str, user_id: str, user_role: Optional[str] = None) -> bool:
        """Eliminar quiz."""
        try:
            logging.info(f"🗑️ [QuizService.delete_quiz] Deleting quiz {quiz_id} for user {user_id}")

            quiz = await self.quiz_repository.get_by_id(quiz_id)
            if not quiz:
                logging.warning(f"❌ [QuizService.delete_quiz] Quiz {quiz_id} not found")
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")

            # ✅ CORREGIDO: Permitir a admins eliminar cualquier quiz
            # Obtener rol del usuario si no se proporciona
            if not user_role:
                # Por compatibilidad, asumir que solo el creador puede eliminar
                # En el futuro, se puede pasar el rol desde el endpoint
                is_admin = False
            else:
                # Manejar tanto string como enum para user_role
                role_str = str(user_role).lower() if hasattr(user_role, 'value') else str(user_role).lower()
                role_str = role_str.replace('userrole.', '')
                is_admin = role_str == "admin"

            # Verificar permisos
            if not is_admin and quiz.created_by != user_id:
                logging.warning(f"❌ [QuizService.delete_quiz] User {user_id} not authorized to delete quiz {quiz_id}")
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para eliminar este quiz")

            # Verificar si hay intentos
            attempts = await self.quiz_repository.get_attempts_by_quiz(quiz_id)
            if attempts:
                logging.warning(f"❌ [QuizService.delete_quiz] Quiz {quiz_id} has {len(attempts)} attempts, cannot delete")
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede eliminar un quiz con intentos registrados")

            # Eliminar quiz
            success = await self.quiz_repository.delete_quiz(quiz_id)
            if success:
                logging.info(f"✅ [QuizService.delete_quiz] Quiz {quiz_id} deleted successfully")
            else:
                logging.error(f"❌ [QuizService.delete_quiz] Failed to delete quiz {quiz_id}")

            return success

        except HTTPException as he:
            # Re-raise HTTP exceptions
            raise he
        except Exception as e:
            logging.error(f"❌ [QuizService.delete_quiz] Unexpected error for quiz {quiz_id}: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error interno del servidor: {str(e)}")

    async def get_all_quizzes(self, published_only: bool = True, user_id: Optional[str] = None, user_role: str = "student") -> List[QuizListResponse]:
        """Obtener todos los quizzes basado en el rol del usuario."""
        try:
            logging.info(f"🔍 [QuizService.get_all_quizzes] Getting all quizzes for user {user_id} with role {user_role}")

            # ✅ CORREGIDO: Manejar tanto string como enum para user_role
            role_str = str(user_role).lower() if hasattr(user_role, 'value') else str(user_role).lower()
            role_str = role_str.replace('userrole.', '')  # Remover prefijo enum si existe

            logging.info(f"🔍 [QuizService.get_all_quizzes] Processed role: {role_str}")

            # Obtener quizzes basado en el rol
            if role_str == "admin":
                # ✅ SIMPLIFICADO: Admins ven todos los quizzes que crearon
                logging.info(f"🔍 [QuizService.get_all_quizzes] Admin user, getting quizzes by instructor for user: {user_id}")
                quizzes = await self.quiz_repository.get_by_instructor(user_id)
                logging.info(f"🔍 [QuizService.get_all_quizzes] Got {len(quizzes)} quizzes from get_by_instructor")

                # Si también queremos publicados de otros usuarios, agregar:
                if not published_only:
                    try:
                        published_quizzes = await self.quiz_repository.get_published(None)
                        logging.info(f"🔍 [QuizService.get_all_quizzes] Got {len(published_quizzes)} published quizzes")

                        # Combinar y evitar duplicados
                        existing_ids = {q.id for q in quizzes}
                        for quiz in published_quizzes:
                            if quiz.id not in existing_ids:
                                quizzes.append(quiz)
                        logging.info(f"🔍 [QuizService.get_all_quizzes] Total after merging: {len(quizzes)}")
                    except Exception as e:
                        logging.warning(f"⚠️ [QuizService.get_all_quizzes] Could not get published quizzes: {e}")

            elif role_str == "instructor" and user_id:
                # Instructores pueden ver sus propios quizzes
                logging.info(f"🔍 [QuizService.get_all_quizzes] Instructor user, getting quizzes for: {user_id}")
                quizzes = await self.quiz_repository.get_by_instructor(user_id)
                logging.info(f"🔍 [QuizService.get_all_quizzes] Got {len(quizzes)} instructor quizzes")
            else:
                # Estudiantes solo ven quizzes publicados
                logging.info(f"🔍 [QuizService.get_all_quizzes] Student user, getting published quizzes")
                quizzes = await self.quiz_repository.get_published(None)
                logging.info(f"🔍 [QuizService.get_all_quizzes] Got {len(quizzes)} published quizzes")

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

            logging.info(f"✅ [QuizService.get_all_quizzes] Retrieved {len(response_list)} quizzes")
            return response_list

        except Exception as e:
            logging.error(f"❌ [QuizService.get_all_quizzes] Error: {str(e)}")
            raise

    async def get_quizzes_by_course(self, course_id: str, published_only: bool = True) -> List[QuizListResponse]:
        """Obtener quizzes por curso."""
        quizzes = await self.quiz_repository.get_by_course_id(course_id)  # ✅ Usar método correcto

        # Filtrar por estado si es necesario
        if published_only:
            quizzes = [q for q in quizzes if q.status == QuizStatus.PUBLISHED]

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

    async def get_quizzes_by_lesson(self, lesson_id: str, published_only: bool = True) -> List[QuizListResponse]:
        """Obtener quizzes por lección."""
        try:
            logging.info(f"🔍 [QuizService.get_quizzes_by_lesson] Getting quizzes for lesson {lesson_id}")

            quizzes = await self.quiz_repository.get_by_lesson_id(lesson_id)

            # Filtrar por estado si es necesario
            if published_only:
                quizzes = [q for q in quizzes if q.status == QuizStatus.PUBLISHED]

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

            logging.info(f"✅ [QuizService.get_quizzes_by_lesson] Retrieved {len(response_list)} quizzes for lesson {lesson_id}")
            return response_list

        except Exception as e:
            logging.error(f"❌ [QuizService.get_quizzes_by_lesson] Error for lesson {lesson_id}: {str(e)}")
            raise

    # CRUD de Preguntas
    async def create_question(self, question_data: QuestionCreate, creator_id: str) -> QuestionResponse:
        """Crear nueva pregunta."""
        question = Question(
            id=str(ObjectId()),
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
                    id=str(ObjectId()),
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
        quiz = await self.quiz_repository.get_by_id(quiz_id)
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
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La pregunta ya está en este quiz")
        
        quiz.questions.append(question)
        quiz.calculate_total_points()
        quiz.updated_at = datetime.utcnow()

        await self.quiz_repository.update(quiz_id, quiz.to_dict())
        return True

    # Gestión de Intentos
    async def start_quiz_attempt(self, quiz_id: str, student_id: str) -> QuizAttemptResponse:
        """Iniciar nuevo intento de quiz."""
        quiz = await self.quiz_repository.get_by_id(quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Quiz con ID {quiz_id} no encontrado")
        
        if not quiz.is_available_now():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz no disponible actualmente")
        
        # Verificar intentos previos
        existing_attempts = await self.quiz_repository.get_attempts_by_student_and_quiz(student_id, quiz_id)
        
        if not quiz.config.allow_retakes and existing_attempts:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se permiten reintentos para este quiz")
        
        if quiz.config.max_attempts and len(existing_attempts) >= quiz.config.max_attempts:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Máximo de {quiz.config.max_attempts} intentos alcanzado")
        
        # Crear nuevo intento
        attempt = QuizAttempt(
            id=str(ObjectId()),
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
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El intento no está en progreso")
        
        # Obtener quiz para validaciones
        quiz = await self.quiz_repository.get_by_id(attempt.quiz_id)
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz no encontrado")
        
        # Verificar si el intento ha expirado
        if attempt.is_expired(quiz):
            attempt.status = AttemptStatus.EXPIRED
            await self.quiz_repository.update_attempt(attempt)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El intento ha expirado")
        
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
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El intento no está en progreso")
        
        # Obtener quiz para cálculos finales
        quiz = await self.quiz_repository.get_by_id(attempt.quiz_id)
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
        quiz = await self.quiz_repository.get_by_id(quiz_id)
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
        quiz = await self.quiz_repository.get_by_id(quiz_id)
        if quiz:
            quiz.total_attempts = total_attempts
            quiz.average_score = average_score
            quiz.completion_rate = completion_rate
            await self.quiz_repository.update(quiz.id, quiz.to_dict())

    def _quiz_to_response(self, quiz: Quiz) -> QuizResponse:
        """Convertir entidad Quiz a DTO de respuesta."""
        # Convertir QuizConfiguration a QuizConfigurationResponse
        config_response = QuizConfigurationResponse(
            shuffle_questions=quiz.config.shuffle_questions,
            shuffle_answers=quiz.config.shuffle_answers,
            show_results_immediately=quiz.config.show_results_immediately,
            show_correct_answers=quiz.config.show_correct_answers,
            allow_review=getattr(quiz.config, 'allow_review', True),  # ✅ AÑADIDO
            allow_retakes=quiz.config.allow_retakes,
            max_attempts=quiz.config.max_attempts,
            passing_score=quiz.config.passing_score,
            time_limit=quiz.config.time_limit,
            available_from=quiz.config.available_from,
            available_until=quiz.config.available_until,
            require_proctor=quiz.config.require_proctor,
            randomize_from_pool=quiz.config.randomize_from_pool,
            questions_per_attempt=quiz.config.questions_per_attempt
        )

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
            config=config_response,
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
