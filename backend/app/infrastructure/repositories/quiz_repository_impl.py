"""
Implementación concreta del repositorio de quizzes usando MongoDB.
"""
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from uuid import uuid4

from app.domain.repositories.quiz_repository import QuizRepository
from app.domain.entities.quiz import Quiz, QuizAttempt, Question, QuestionBank, QuizStatus, AttemptStatus, QuizConfiguration


class MongoDBQuizRepository(QuizRepository):
    """Implementación del repositorio de quizzes usando MongoDB."""

    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.quiz_collection = database.quizzes
        self.attempt_collection = database.quiz_attempts
        self.question_collection = database.questions
        self.question_bank_collection = database.question_banks

    def _dict_to_quiz(self, quiz_dict: dict) -> Quiz:
        """Convierte un diccionario de MongoDB a una entidad Quiz."""
        if not quiz_dict:
            return None
        
        # Convertir _id a id
        quiz_dict["id"] = str(quiz_dict.pop("_id", ""))
        
        # Convertir campos de fecha
        for field in ["created_at", "updated_at", "published_at"]:
            if field in quiz_dict and quiz_dict[field]:
                if isinstance(quiz_dict[field], str):
                    quiz_dict[field] = datetime.fromisoformat(quiz_dict[field].replace('Z', '+00:00'))

        # Convertir diccionario config de vuelta a QuizConfiguration con validación robusta
        if "config" in quiz_dict and quiz_dict["config"]:
            if isinstance(quiz_dict["config"], dict):
                config_dict = quiz_dict["config"].copy()

                # ✅ Agregar valores por defecto para campos faltantes (solo campos válidos)
                default_config = QuizConfiguration()
                valid_fields = {
                    'shuffle_questions', 'shuffle_answers', 'show_results_immediately',
                    'show_correct_answers', 'allow_review', 'allow_retakes', 'max_attempts',
                    'passing_score', 'time_limit', 'available_from', 'available_until',
                    'require_proctor', 'randomize_from_pool', 'questions_per_attempt'
                }

                for field in valid_fields:
                    if field not in config_dict:
                        default_value = getattr(default_config, field, None)
                        config_dict[field] = default_value

                # ✅ Limpiar campos no válidos que puedan existir en la BD
                config_dict = {k: v for k, v in config_dict.items() if k in valid_fields}

                # Convertir fechas en la configuración
                for field in ["available_from", "available_until"]:
                    if field in config_dict and config_dict[field]:
                        if isinstance(config_dict[field], str):
                            try:
                                config_dict[field] = datetime.fromisoformat(config_dict[field].replace('Z', '+00:00'))
                            except (ValueError, AttributeError):
                                config_dict[field] = None

                try:
                    quiz_dict["config"] = QuizConfiguration(**config_dict)
                except (TypeError, ValueError) as e:
                    # ✅ Si falla la creación, usar configuración por defecto
                    print(f"Warning: Error creating QuizConfiguration, using defaults: {e}")
                    quiz_dict["config"] = QuizConfiguration()
            else:
                quiz_dict["config"] = QuizConfiguration()
        else:
            # ✅ Si no hay config o es None, usar configuración por defecto
            quiz_dict["config"] = QuizConfiguration()

        # ✅ Convertir preguntas de dict a objetos Question
        if "questions" in quiz_dict and quiz_dict["questions"]:
            question_objects = []
            for question_dict in quiz_dict["questions"]:
                if isinstance(question_dict, dict):
                    # Convertir diccionario a objeto Question
                    question = self._dict_to_question(question_dict)
                    if question:
                        question_objects.append(question)
                else:
                    # Si ya es un objeto Question, mantenerlo
                    question_objects.append(question_dict)
            quiz_dict["questions"] = question_objects

        # Crear objeto Quiz usando from_dict si existe, sino usar constructor
        try:
            return Quiz(**quiz_dict)
        except TypeError as e:
            # ✅ Manejar campos faltantes o extra con logging
            print(f"Warning: Error creating Quiz with all fields, filtering: {e}")
            try:
                filtered_dict = {k: v for k, v in quiz_dict.items() if k in Quiz.__dataclass_fields__}
                return Quiz(**filtered_dict)
            except Exception as filter_error:
                print(f"Error: Could not create Quiz even with filtered fields: {filter_error}")
                # ✅ Retornar None en lugar de fallar completamente
                return None

    def _quiz_to_dict(self, quiz: Quiz) -> dict:
        """Convierte una entidad Quiz a diccionario para MongoDB."""
        quiz_dict = quiz.__dict__.copy()
        
        # Convertir id a _id
        if "id" in quiz_dict:
            quiz_dict["_id"] = ObjectId(quiz_dict.pop("id")) if quiz_dict["id"] else ObjectId()
        
        # Convertir fechas a ISO string
        for field in ["created_at", "updated_at", "published_at"]:
            if field in quiz_dict and isinstance(quiz_dict[field], datetime):
                quiz_dict[field] = quiz_dict[field].isoformat()
        
        # Convertir enums a string
        if isinstance(quiz_dict.get("status"), QuizStatus):
            quiz_dict["status"] = quiz_dict["status"].value

        # Convertir QuizConfiguration a diccionario
        if "config" in quiz_dict and hasattr(quiz_dict["config"], "__dict__"):
            quiz_dict["config"] = quiz_dict["config"].__dict__.copy()
            # Convertir fechas en la configuración
            config = quiz_dict["config"]
            for field in ["available_from", "available_until"]:
                if field in config and isinstance(config[field], datetime):
                    config[field] = config[field].isoformat()

        return quiz_dict

    def _dict_to_attempt(self, attempt_dict: dict) -> QuizAttempt:
        """Convierte un diccionario de MongoDB a una entidad QuizAttempt."""
        if not attempt_dict:
            return None
        
        attempt_dict["id"] = str(attempt_dict.pop("_id", ""))
        
        # Convertir campos de fecha
        for field in ["started_at", "submitted_at"]:
            if field in attempt_dict and attempt_dict[field]:
                if isinstance(attempt_dict[field], str):
                    attempt_dict[field] = datetime.fromisoformat(attempt_dict[field].replace('Z', '+00:00'))
        
        try:
            return QuizAttempt(**attempt_dict)
        except TypeError:
            filtered_dict = {k: v for k, v in attempt_dict.items() if k in QuizAttempt.__dataclass_fields__}
            return QuizAttempt(**filtered_dict)

    def _attempt_to_dict(self, attempt: QuizAttempt) -> dict:
        """Convierte una entidad QuizAttempt a diccionario para MongoDB."""
        attempt_dict = attempt.__dict__.copy()
        
        if "id" in attempt_dict:
            attempt_dict["_id"] = ObjectId(attempt_dict.pop("id")) if attempt_dict["id"] else ObjectId()
        
        # Convertir fechas a ISO string
        for field in ["started_at", "submitted_at"]:
            if field in attempt_dict and isinstance(attempt_dict[field], datetime):
                attempt_dict[field] = attempt_dict[field].isoformat()
        
        # Convertir enums a string
        if isinstance(attempt_dict.get("status"), AttemptStatus):
            attempt_dict["status"] = attempt_dict["status"].value
        
        return attempt_dict

    # Implementación de métodos Quiz
    async def create(self, quiz: Quiz) -> Quiz:
        """Crea un nuevo quiz."""
        quiz_dict = self._quiz_to_dict(quiz)
        result = await self.quiz_collection.insert_one(quiz_dict)
        quiz.id = str(result.inserted_id)
        return quiz

    async def get_by_id(self, quiz_id: str) -> Optional[Quiz]:
        """Obtiene un quiz por su ID."""
        try:
            quiz_dict = await self.quiz_collection.find_one({"_id": ObjectId(quiz_id)})
            return self._dict_to_quiz(quiz_dict)
        except:
            return None

    async def update(self, quiz_id: str, quiz_data: dict) -> Optional[Quiz]:
        """Actualiza un quiz."""
        try:
            # Agregar timestamp de actualización
            quiz_data["updated_at"] = datetime.utcnow().isoformat()

            # Log question count for debugging
            if "questions" in quiz_data:
                print(f"[INFO] Updating quiz {quiz_id} with {len(quiz_data['questions'])} questions")

            result = await self.quiz_collection.update_one(
                {"_id": ObjectId(quiz_id)},
                {"$set": quiz_data}
            )

            if result.modified_count > 0:
                updated_quiz = await self.get_by_id(quiz_id)
                if updated_quiz:
                    print(f"[INFO] Quiz {quiz_id} updated successfully, final question count: {len(updated_quiz.questions) if updated_quiz.questions else 0}")
                return updated_quiz
            return None
        except Exception as e:
            print(f"[ERROR] Update failed: {e}")
            return None

    async def delete(self, quiz_id: str) -> bool:
        """Elimina un quiz."""
        try:
            result = await self.quiz_collection.delete_one({"_id": ObjectId(quiz_id)})
            return result.deleted_count > 0
        except:
            return False

    async def get_by_course_id(self, course_id: str) -> List[Quiz]:
        """Obtiene todos los quizzes de un curso."""
        try:
            cursor = self.quiz_collection.find({"course_id": course_id})
            quizzes = []
            async for quiz_dict in cursor:
                quiz = self._dict_to_quiz(quiz_dict)
                if quiz:
                    quizzes.append(quiz)
            return quizzes
        except:
            return []

    async def get_by_module_id(self, module_id: str) -> List[Quiz]:
        """Obtiene todos los quizzes de un módulo."""
        try:
            cursor = self.quiz_collection.find({"module_id": module_id})
            quizzes = []
            async for quiz_dict in cursor:
                quiz = self._dict_to_quiz(quiz_dict)
                if quiz:
                    quizzes.append(quiz)
            return quizzes
        except:
            return []

    async def get_by_lesson_id(self, lesson_id: str) -> List[Quiz]:
        """Obtiene todos los quizzes de una lección."""
        try:
            cursor = self.quiz_collection.find({"lesson_id": lesson_id})
            quizzes = []
            async for quiz_dict in cursor:
                quiz = self._dict_to_quiz(quiz_dict)
                if quiz:
                    quizzes.append(quiz)
            return quizzes
        except:
            return []

    async def get_by_instructor(self, instructor_id: str) -> List[Quiz]:
        """Obtiene todos los quizzes creados por un instructor."""
        try:
            cursor = self.quiz_collection.find({"created_by": instructor_id})
            quizzes = []
            async for quiz_dict in cursor:
                quiz = self._dict_to_quiz(quiz_dict)
                if quiz:
                    quizzes.append(quiz)
            return quizzes
        except Exception as e:
            print(f"[ERROR] get_by_instructor failed: {e}")
            return []

    async def search(self, query: str, filters: dict = None) -> List[Quiz]:
        """Busca quizzes por título, descripción, etc."""
        try:
            search_filter = {
                "$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"instructions": {"$regex": query, "$options": "i"}}
                ]
            }
            
            if filters:
                search_filter.update(filters)
            
            cursor = self.quiz_collection.find(search_filter)
            quizzes = []
            async for quiz_dict in cursor:
                quiz = self._dict_to_quiz(quiz_dict)
                if quiz:
                    quizzes.append(quiz)
            return quizzes
        except:
            return []

    async def get_published(self, course_id: str = None) -> List[Quiz]:
        """Obtiene todos los quizzes publicados."""
        try:
            filter_dict = {"status": QuizStatus.PUBLISHED.value}
            if course_id:
                filter_dict["course_id"] = course_id
            
            cursor = self.quiz_collection.find(filter_dict)
            quizzes = []
            async for quiz_dict in cursor:
                quiz = self._dict_to_quiz(quiz_dict)
                if quiz:
                    quizzes.append(quiz)
            return quizzes
        except:
            return []

    async def count_by_status(self, status: str) -> int:
        """Cuenta quizzes por estado."""
        try:
            return await self.quiz_collection.count_documents({"status": status})
        except:
            return 0

    # Implementación de métodos QuizAttempt
    async def create_attempt(self, attempt: QuizAttempt) -> QuizAttempt:
        """Crea un nuevo intento de quiz."""
        attempt_dict = self._attempt_to_dict(attempt)
        result = await self.attempt_collection.insert_one(attempt_dict)
        attempt.id = str(result.inserted_id)
        return attempt

    async def get_attempt_by_id(self, attempt_id: str) -> Optional[QuizAttempt]:
        """Obtiene un intento por su ID."""
        try:
            attempt_dict = await self.attempt_collection.find_one({"_id": ObjectId(attempt_id)})
            return self._dict_to_attempt(attempt_dict)
        except:
            return None

    async def update_attempt(self, attempt_id: str, attempt_data: dict) -> Optional[QuizAttempt]:
        """Actualiza un intento de quiz."""
        try:
            result = await self.attempt_collection.update_one(
                {"_id": ObjectId(attempt_id)},
                {"$set": attempt_data}
            )
            
            if result.modified_count > 0:
                return await self.get_attempt_by_id(attempt_id)
            return None
        except:
            return None

    async def get_attempts_by_quiz(self, quiz_id: str) -> List[QuizAttempt]:
        """Obtiene todos los intentos de un quiz."""
        try:
            cursor = self.attempt_collection.find({"quiz_id": quiz_id})
            attempts = []
            async for attempt_dict in cursor:
                attempt = self._dict_to_attempt(attempt_dict)
                if attempt:
                    attempts.append(attempt)
            return attempts
        except:
            return []

    async def get_attempts_by_student(self, student_id: str, quiz_id: str = None) -> List[QuizAttempt]:
        """Obtiene todos los intentos de un estudiante."""
        try:
            filter_dict = {"student_id": student_id}
            if quiz_id:
                filter_dict["quiz_id"] = quiz_id
            
            cursor = self.attempt_collection.find(filter_dict)
            attempts = []
            async for attempt_dict in cursor:
                attempt = self._dict_to_attempt(attempt_dict)
                if attempt:
                    attempts.append(attempt)
            return attempts
        except:
            return []

    async def get_latest_attempt(self, student_id: str, quiz_id: str) -> Optional[QuizAttempt]:
        """Obtiene el último intento de un estudiante para un quiz."""
        try:
            attempt_dict = await self.attempt_collection.find_one(
                {"student_id": student_id, "quiz_id": quiz_id},
                sort=[("attempt_number", -1)]
            )
            return self._dict_to_attempt(attempt_dict)
        except:
            return None

    async def count_attempts(self, quiz_id: str) -> int:
        """Cuenta el número total de intentos para un quiz."""
        try:
            return await self.attempt_collection.count_documents({"quiz_id": quiz_id})
        except:
            return 0

    async def delete_quiz(self, quiz_id: str) -> bool:
        """Elimina un quiz por su ID."""
        try:
            result = await self.quiz_collection.delete_one({"_id": ObjectId(quiz_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting quiz {quiz_id}: {e}")
            return False

    # ✅ Métodos de conversión para Question
    def _dict_to_question(self, question_dict: dict) -> Optional[Question]:
        """Convierte un diccionario de MongoDB a una entidad Question."""
        if not question_dict:
            return None

        # Convertir _id a id
        question_dict["id"] = str(question_dict.pop("_id", ""))

        # Convertir campos de fecha
        for field in ["created_at", "updated_at"]:
            if field in question_dict and question_dict[field]:
                if isinstance(question_dict[field], str):
                    try:
                        question_dict[field] = datetime.fromisoformat(question_dict[field].replace('Z', '+00:00'))
                    except (ValueError, AttributeError):
                        question_dict[field] = datetime.utcnow()

        # Convertir opciones si existen
        if "options" in question_dict and question_dict["options"]:
            from ...domain.entities.quiz import QuestionOption
            options = []
            for opt_dict in question_dict["options"]:
                option = QuestionOption(
                    id=opt_dict.get("id", str(uuid4())),
                    text=opt_dict.get("text", ""),
                    is_correct=opt_dict.get("is_correct", False),
                    explanation=opt_dict.get("explanation"),
                    order=opt_dict.get("order", 0)
                )
                options.append(option)
            question_dict["options"] = options

        # Asegurar valores por defecto
        question_dict.setdefault("correct_answers", [])
        question_dict.setdefault("case_sensitive", False)
        question_dict.setdefault("pairs", [])
        question_dict.setdefault("tags", [])
        question_dict.setdefault("difficulty", "medium")

        try:
            return Question(**question_dict)
        except Exception as e:
            print(f"Error creating Question from dict: {e}")
            return None

    def _question_to_dict(self, question: Question) -> dict:
        """Convierte una entidad Question a diccionario para MongoDB."""
        question_dict = {
            "type": question.type.value if hasattr(question.type, 'value') else question.type,
            "title": question.title,
            "content": question.content,
            "explanation": question.explanation,
            "points": question.points,
            "time_limit": question.time_limit,
            "correct_answers": question.correct_answers,
            "case_sensitive": question.case_sensitive,
            "pairs": question.pairs,
            "tags": question.tags,
            "difficulty": question.difficulty,
            "created_at": question.created_at.isoformat() if question.created_at else datetime.utcnow().isoformat(),
            "updated_at": question.updated_at.isoformat() if question.updated_at else datetime.utcnow().isoformat(),
            "created_by": question.created_by
        }

        # Convertir opciones
        if question.options:
            options_dict = []
            for option in question.options:
                opt_dict = {
                    "id": option.id,
                    "text": option.text,
                    "is_correct": option.is_correct,
                    "explanation": option.explanation,
                    "order": option.order
                }
                options_dict.append(opt_dict)
            question_dict["options"] = options_dict
        else:
            question_dict["options"] = []

        # Convertir id a _id si existe
        if hasattr(question, 'id') and question.id:
            try:
                question_dict["_id"] = ObjectId(question.id)
            except:
                question_dict["_id"] = ObjectId()

        return question_dict

    # Implementación completa de métodos Question
    async def create_question(self, question: Question) -> Question:
        """Crea una nueva pregunta."""
        try:
            question_dict = self._question_to_dict(question)
            result = await self.question_collection.insert_one(question_dict)
            question.id = str(result.inserted_id)
            return question
        except Exception as e:
            print(f"Error creating question: {e}")
            raise

    async def get_question_by_id(self, question_id: str) -> Optional[Question]:
        """Obtiene una pregunta por su ID."""
        try:
            question_dict = await self.question_collection.find_one({"_id": ObjectId(question_id)})
            return self._dict_to_question(question_dict)
        except Exception as e:
            print(f"Error getting question {question_id}: {e}")
            return None

    async def update_question(self, question_id: str, question_data: dict) -> Optional[Question]:
        """Actualiza una pregunta."""
        try:
            # Agregar timestamp de actualización
            question_data["updated_at"] = datetime.utcnow().isoformat()

            result = await self.question_collection.update_one(
                {"_id": ObjectId(question_id)},
                {"$set": question_data}
            )

            if result.modified_count > 0:
                return await self.get_question_by_id(question_id)
            return None
        except Exception as e:
            print(f"Error updating question {question_id}: {e}")
            return None

    async def delete_question(self, question_id: str) -> bool:
        """Elimina una pregunta."""
        try:
            result = await self.question_collection.delete_one({"_id": ObjectId(question_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting question {question_id}: {e}")
            return False

    async def get_questions_by_quiz(self, quiz_id: str) -> List[Question]:
        """Obtiene todas las preguntas de un quiz."""
        try:
            # Las preguntas están embebidas en el quiz, no como documentos separados
            quiz = await self.get_by_id(quiz_id)
            return quiz.questions if quiz else []
        except Exception as e:
            print(f"Error getting questions for quiz {quiz_id}: {e}")
            return []

    async def search_questions(self, query: str, filters: dict = None) -> List[Question]:
        """Busca preguntas por contenido, tipo, etc."""
        try:
            search_filter = {
                "$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"content": {"$regex": query, "$options": "i"}},
                    {"tags": {"$in": [query]}}
                ]
            }

            if filters:
                search_filter.update(filters)

            cursor = self.question_collection.find(search_filter)
            questions = []
            async for question_dict in cursor:
                question = self._dict_to_question(question_dict)
                if question:
                    questions.append(question)
            return questions
        except Exception as e:
            print(f"Error searching questions: {e}")
            return []

    async def create_question_bank(self, bank: QuestionBank) -> QuestionBank:
        """Crea un banco de preguntas."""
        # Implementación simplificada
        pass

    async def get_question_bank_by_id(self, bank_id: str) -> Optional[QuestionBank]:
        """Obtiene un banco de preguntas por su ID."""
        # Implementación simplificada
        pass

    async def update_question_bank(self, bank_id: str, bank_data: dict) -> Optional[QuestionBank]:
        """Actualiza un banco de preguntas."""
        # Implementación simplificada
        pass

    async def delete_question_bank(self, bank_id: str) -> bool:
        """Elimina un banco de preguntas."""
        # Implementación simplificada
        pass

    async def get_question_banks_by_course(self, course_id: str) -> List[QuestionBank]:
        """Obtiene todos los bancos de preguntas de un curso."""
        # Implementación simplificada
        return []

    async def get_public_question_banks(self) -> List[QuestionBank]:
        """Obtiene todos los bancos de preguntas públicos."""
        # Implementación simplificada
        return []
