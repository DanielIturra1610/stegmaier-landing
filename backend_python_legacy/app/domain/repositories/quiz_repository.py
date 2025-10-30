"""
Repositorio abstracto para quizzes.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.quiz import Quiz, QuizAttempt, Question, QuestionBank


class QuizRepository(ABC):
    """Interfaz abstracta para el repositorio de quizzes."""

    @abstractmethod
    async def create(self, quiz: Quiz) -> Quiz:
        """Crea un nuevo quiz."""
        pass

    @abstractmethod
    async def get_by_id(self, quiz_id: str) -> Optional[Quiz]:
        """Obtiene un quiz por su ID."""
        pass

    @abstractmethod
    async def update(self, quiz_id: str, quiz_data: dict) -> Optional[Quiz]:
        """Actualiza un quiz."""
        pass

    @abstractmethod
    async def delete(self, quiz_id: str) -> bool:
        """Elimina un quiz."""
        pass

    @abstractmethod
    async def get_by_course_id(self, course_id: str) -> List[Quiz]:
        """Obtiene todos los quizzes de un curso."""
        pass

    @abstractmethod
    async def get_by_module_id(self, module_id: str) -> List[Quiz]:
        """Obtiene todos los quizzes de un módulo."""
        pass

    @abstractmethod
    async def get_by_lesson_id(self, lesson_id: str) -> List[Quiz]:
        """Obtiene todos los quizzes de una lección."""
        pass

    @abstractmethod
    async def get_by_instructor(self, instructor_id: str) -> List[Quiz]:
        """Obtiene todos los quizzes creados por un instructor."""
        pass

    @abstractmethod
    async def search(self, query: str, filters: dict = None) -> List[Quiz]:
        """Busca quizzes por título, descripción, etc."""
        pass

    @abstractmethod
    async def get_published(self, course_id: str = None) -> List[Quiz]:
        """Obtiene todos los quizzes publicados."""
        pass

    @abstractmethod
    async def count_by_status(self, status: str) -> int:
        """Cuenta quizzes por estado."""
        pass

    # Métodos para QuizAttempt
    @abstractmethod
    async def create_attempt(self, attempt: QuizAttempt) -> QuizAttempt:
        """Crea un nuevo intento de quiz."""
        pass

    @abstractmethod
    async def get_attempt_by_id(self, attempt_id: str) -> Optional[QuizAttempt]:
        """Obtiene un intento por su ID."""
        pass

    @abstractmethod
    async def update_attempt(self, attempt_id: str, attempt_data: dict) -> Optional[QuizAttempt]:
        """Actualiza un intento de quiz."""
        pass

    @abstractmethod
    async def get_attempts_by_quiz(self, quiz_id: str) -> List[QuizAttempt]:
        """Obtiene todos los intentos de un quiz."""
        pass

    @abstractmethod
    async def get_attempts_by_student(self, student_id: str, quiz_id: str = None) -> List[QuizAttempt]:
        """Obtiene todos los intentos de un estudiante."""
        pass

    @abstractmethod
    async def get_latest_attempt(self, student_id: str, quiz_id: str) -> Optional[QuizAttempt]:
        """Obtiene el último intento de un estudiante para un quiz."""
        pass

    @abstractmethod
    async def count_attempts(self, quiz_id: str) -> int:
        """Cuenta el número total de intentos para un quiz."""
        pass

    # Métodos para Question
    @abstractmethod
    async def create_question(self, question: Question) -> Question:
        """Crea una nueva pregunta."""
        pass

    @abstractmethod
    async def get_question_by_id(self, question_id: str) -> Optional[Question]:
        """Obtiene una pregunta por su ID."""
        pass

    @abstractmethod
    async def update_question(self, question_id: str, question_data: dict) -> Optional[Question]:
        """Actualiza una pregunta."""
        pass

    @abstractmethod
    async def delete_question(self, question_id: str) -> bool:
        """Elimina una pregunta."""
        pass

    @abstractmethod
    async def get_questions_by_quiz(self, quiz_id: str) -> List[Question]:
        """Obtiene todas las preguntas de un quiz."""
        pass

    @abstractmethod
    async def search_questions(self, query: str, filters: dict = None) -> List[Question]:
        """Busca preguntas por contenido, tipo, etc."""
        pass

    # Métodos para QuestionBank
    @abstractmethod
    async def create_question_bank(self, bank: QuestionBank) -> QuestionBank:
        """Crea un banco de preguntas."""
        pass

    @abstractmethod
    async def get_question_bank_by_id(self, bank_id: str) -> Optional[QuestionBank]:
        """Obtiene un banco de preguntas por su ID."""
        pass

    @abstractmethod
    async def update_question_bank(self, bank_id: str, bank_data: dict) -> Optional[QuestionBank]:
        """Actualiza un banco de preguntas."""
        pass

    @abstractmethod
    async def delete_question_bank(self, bank_id: str) -> bool:
        """Elimina un banco de preguntas."""
        pass

    @abstractmethod
    async def get_question_banks_by_course(self, course_id: str) -> List[QuestionBank]:
        """Obtiene todos los bancos de preguntas de un curso."""
        pass

    @abstractmethod
    async def get_public_question_banks(self) -> List[QuestionBank]:
        """Obtiene todos los bancos de preguntas públicos."""
        pass
