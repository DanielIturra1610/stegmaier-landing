"""
Repositorio abstracto para assignments.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.assignment import Assignment, AssignmentSubmission, Rubric, PeerReview


class AssignmentRepository(ABC):
    """Interfaz abstracta para el repositorio de assignments."""

    @abstractmethod
    async def create(self, assignment: Assignment) -> Assignment:
        """Crea un nuevo assignment."""
        pass

    @abstractmethod
    async def get_by_id(self, assignment_id: str) -> Optional[Assignment]:
        """Obtiene un assignment por su ID."""
        pass

    @abstractmethod
    async def update(self, assignment_id: str, assignment_data: dict) -> Optional[Assignment]:
        """Actualiza un assignment."""
        pass

    @abstractmethod
    async def delete(self, assignment_id: str) -> bool:
        """Elimina un assignment."""
        pass

    @abstractmethod
    async def get_by_course_id(self, course_id: str) -> List[Assignment]:
        """Obtiene todos los assignments de un curso."""
        pass

    @abstractmethod
    async def get_by_module_id(self, module_id: str) -> List[Assignment]:
        """Obtiene todos los assignments de un módulo."""
        pass

    @abstractmethod
    async def get_by_lesson_id(self, lesson_id: str) -> List[Assignment]:
        """Obtiene todos los assignments de una lección."""
        pass

    @abstractmethod
    async def get_by_instructor(self, instructor_id: str) -> List[Assignment]:
        """Obtiene todos los assignments creados por un instructor."""
        pass

    @abstractmethod
    async def search(self, query: str, filters: dict = None) -> List[Assignment]:
        """Busca assignments por título, descripción, etc."""
        pass

    @abstractmethod
    async def get_published(self, course_id: str = None) -> List[Assignment]:
        """Obtiene todos los assignments publicados."""
        pass

    @abstractmethod
    async def get_due_soon(self, days: int = 7) -> List[Assignment]:
        """Obtiene assignments que vencen pronto."""
        pass

    @abstractmethod
    async def get_overdue(self) -> List[Assignment]:
        """Obtiene assignments vencidos."""
        pass

    # Métodos para AssignmentSubmission
    @abstractmethod
    async def create_submission(self, submission: AssignmentSubmission) -> AssignmentSubmission:
        """Crea una nueva entrega de assignment."""
        pass

    @abstractmethod
    async def get_submission_by_id(self, submission_id: str) -> Optional[AssignmentSubmission]:
        """Obtiene una entrega por su ID."""
        pass

    @abstractmethod
    async def update_submission(self, submission_id: str, submission_data: dict) -> Optional[AssignmentSubmission]:
        """Actualiza una entrega de assignment."""
        pass

    @abstractmethod
    async def delete_submission(self, submission_id: str) -> bool:
        """Elimina una entrega."""
        pass

    @abstractmethod
    async def get_submissions_by_assignment(self, assignment_id: str) -> List[AssignmentSubmission]:
        """Obtiene todas las entregas de un assignment."""
        pass

    @abstractmethod
    async def get_submissions_by_student(self, student_id: str, assignment_id: str = None) -> List[AssignmentSubmission]:
        """Obtiene todas las entregas de un estudiante."""
        pass

    @abstractmethod
    async def get_latest_submission(self, student_id: str, assignment_id: str) -> Optional[AssignmentSubmission]:
        """Obtiene la última entrega de un estudiante para un assignment."""
        pass

    @abstractmethod
    async def get_submissions_to_grade(self, instructor_id: str) -> List[AssignmentSubmission]:
        """Obtiene entregas pendientes de calificación para un instructor."""
        pass

    @abstractmethod
    async def get_late_submissions(self, assignment_id: str = None) -> List[AssignmentSubmission]:
        """Obtiene entregas tardías."""
        pass

    @abstractmethod
    async def count_submissions(self, assignment_id: str, status: str = None) -> int:
        """Cuenta entregas por assignment y opcionalmente por estado."""
        pass

    # Métodos para Rubric
    @abstractmethod
    async def create_rubric(self, rubric: Rubric) -> Rubric:
        """Crea una nueva rúbrica."""
        pass

    @abstractmethod
    async def get_rubric_by_id(self, rubric_id: str) -> Optional[Rubric]:
        """Obtiene una rúbrica por su ID."""
        pass

    @abstractmethod
    async def update_rubric(self, rubric_id: str, rubric_data: dict) -> Optional[Rubric]:
        """Actualiza una rúbrica."""
        pass

    @abstractmethod
    async def delete_rubric(self, rubric_id: str) -> bool:
        """Elimina una rúbrica."""
        pass

    @abstractmethod
    async def get_rubrics_by_instructor(self, instructor_id: str) -> List[Rubric]:
        """Obtiene todas las rúbricas creadas por un instructor."""
        pass

    @abstractmethod
    async def get_template_rubrics(self) -> List[Rubric]:
        """Obtiene todas las rúbricas template."""
        pass

    # Métodos para PeerReview
    @abstractmethod
    async def create_peer_review(self, review: PeerReview) -> PeerReview:
        """Crea una nueva revisión por pares."""
        pass

    @abstractmethod
    async def get_peer_review_by_id(self, review_id: str) -> Optional[PeerReview]:
        """Obtiene una revisión por pares por su ID."""
        pass

    @abstractmethod
    async def update_peer_review(self, review_id: str, review_data: dict) -> Optional[PeerReview]:
        """Actualiza una revisión por pares."""
        pass

    @abstractmethod
    async def get_peer_reviews_by_submission(self, submission_id: str) -> List[PeerReview]:
        """Obtiene todas las revisiones de una entrega."""
        pass

    @abstractmethod
    async def get_peer_reviews_by_reviewer(self, reviewer_id: str) -> List[PeerReview]:
        """Obtiene todas las revisiones hechas por un revisor."""
        pass

    @abstractmethod
    async def get_pending_peer_reviews(self, reviewer_id: str) -> List[PeerReview]:
        """Obtiene revisiones por pares pendientes para un revisor."""
        pass
