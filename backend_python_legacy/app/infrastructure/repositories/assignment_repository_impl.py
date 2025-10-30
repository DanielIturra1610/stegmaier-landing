"""
Implementación concreta del repositorio de assignments usando MongoDB.
"""
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from app.domain.repositories.assignment_repository import AssignmentRepository
from app.domain.entities.assignment import Assignment, AssignmentSubmission, Rubric, PeerReview, SubmissionStatus, GradeStatus


class MongoDBAssignmentRepository(AssignmentRepository):
    """Implementación del repositorio de assignments usando MongoDB."""

    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.assignment_collection = database.assignments
        self.submission_collection = database.assignment_submissions
        self.rubric_collection = database.rubrics
        self.peer_review_collection = database.peer_reviews

    def _dict_to_assignment(self, assignment_dict: dict) -> Assignment:
        """Convierte un diccionario de MongoDB a una entidad Assignment."""
        if not assignment_dict:
            return None
        
        assignment_dict["id"] = str(assignment_dict.pop("_id", ""))
        
        # Convertir campos de fecha
        for field in ["available_from", "due_date", "created_at", "updated_at", "published_at"]:
            if field in assignment_dict and assignment_dict[field]:
                if isinstance(assignment_dict[field], str):
                    assignment_dict[field] = datetime.fromisoformat(assignment_dict[field].replace('Z', '+00:00'))
        
        try:
            return Assignment(**assignment_dict)
        except TypeError:
            filtered_dict = {k: v for k, v in assignment_dict.items() if k in Assignment.__dataclass_fields__}
            return Assignment(**filtered_dict)

    def _assignment_to_dict(self, assignment: Assignment) -> dict:
        """Convierte una entidad Assignment a diccionario para MongoDB."""
        assignment_dict = assignment.__dict__.copy()
        
        if "id" in assignment_dict:
            assignment_dict["_id"] = ObjectId(assignment_dict.pop("id")) if assignment_dict["id"] else ObjectId()
        
        # Convertir fechas a ISO string
        for field in ["available_from", "due_date", "created_at", "updated_at", "published_at"]:
            if field in assignment_dict and isinstance(assignment_dict[field], datetime):
                assignment_dict[field] = assignment_dict[field].isoformat()
        
        # Convertir enums a string
        if hasattr(assignment_dict.get("assignment_type"), 'value'):
            assignment_dict["assignment_type"] = assignment_dict["assignment_type"].value
        
        return assignment_dict

    def _dict_to_submission(self, submission_dict: dict) -> AssignmentSubmission:
        """Convierte un diccionario de MongoDB a una entidad AssignmentSubmission."""
        if not submission_dict:
            return None
        
        submission_dict["id"] = str(submission_dict.pop("_id", ""))
        
        # Convertir campos de fecha
        for field in ["started_at", "submitted_at", "last_modified_at"]:
            if field in submission_dict and submission_dict[field]:
                if isinstance(submission_dict[field], str):
                    submission_dict[field] = datetime.fromisoformat(submission_dict[field].replace('Z', '+00:00'))
        
        try:
            return AssignmentSubmission(**submission_dict)
        except TypeError:
            filtered_dict = {k: v for k, v in submission_dict.items() if k in AssignmentSubmission.__dataclass_fields__}
            return AssignmentSubmission(**filtered_dict)

    def _submission_to_dict(self, submission: AssignmentSubmission) -> dict:
        """Convierte una entidad AssignmentSubmission a diccionario para MongoDB."""
        submission_dict = submission.__dict__.copy()
        
        if "id" in submission_dict:
            submission_dict["_id"] = ObjectId(submission_dict.pop("id")) if submission_dict["id"] else ObjectId()
        
        # Convertir fechas a ISO string
        for field in ["started_at", "submitted_at", "last_modified_at"]:
            if field in submission_dict and isinstance(submission_dict[field], datetime):
                submission_dict[field] = submission_dict[field].isoformat()
        
        # Convertir enums a string
        if isinstance(submission_dict.get("status"), SubmissionStatus):
            submission_dict["status"] = submission_dict["status"].value
        if isinstance(submission_dict.get("grade_status"), GradeStatus):
            submission_dict["grade_status"] = submission_dict["grade_status"].value
        
        return submission_dict

    # Implementación de métodos Assignment
    async def create(self, assignment: Assignment) -> Assignment:
        """Crea un nuevo assignment."""
        assignment_dict = self._assignment_to_dict(assignment)
        result = await self.assignment_collection.insert_one(assignment_dict)
        assignment.id = str(result.inserted_id)
        return assignment

    async def get_by_id(self, assignment_id: str) -> Optional[Assignment]:
        """Obtiene un assignment por su ID."""
        try:
            assignment_dict = await self.assignment_collection.find_one({"_id": ObjectId(assignment_id)})
            return self._dict_to_assignment(assignment_dict)
        except:
            return None

    async def update(self, assignment_id: str, assignment_data: dict) -> Optional[Assignment]:
        """Actualiza un assignment."""
        try:
            assignment_data["updated_at"] = datetime.utcnow().isoformat()
            
            result = await self.assignment_collection.update_one(
                {"_id": ObjectId(assignment_id)},
                {"$set": assignment_data}
            )
            
            if result.modified_count > 0:
                return await self.get_by_id(assignment_id)
            return None
        except:
            return None

    async def delete(self, assignment_id: str) -> bool:
        """Elimina un assignment."""
        try:
            result = await self.assignment_collection.delete_one({"_id": ObjectId(assignment_id)})
            return result.deleted_count > 0
        except:
            return False

    async def get_by_course_id(self, course_id: str) -> List[Assignment]:
        """Obtiene todos los assignments de un curso."""
        try:
            cursor = self.assignment_collection.find({"course_id": course_id})
            assignments = []
            async for assignment_dict in cursor:
                assignment = self._dict_to_assignment(assignment_dict)
                if assignment:
                    assignments.append(assignment)
            return assignments
        except:
            return []

    async def get_by_module_id(self, module_id: str) -> List[Assignment]:
        """Obtiene todos los assignments de un módulo."""
        try:
            cursor = self.assignment_collection.find({"module_id": module_id})
            assignments = []
            async for assignment_dict in cursor:
                assignment = self._dict_to_assignment(assignment_dict)
                if assignment:
                    assignments.append(assignment)
            return assignments
        except:
            return []

    async def get_by_lesson_id(self, lesson_id: str) -> List[Assignment]:
        """Obtiene todos los assignments de una lección."""
        try:
            cursor = self.assignment_collection.find({"lesson_id": lesson_id})
            assignments = []
            async for assignment_dict in cursor:
                assignment = self._dict_to_assignment(assignment_dict)
                if assignment:
                    assignments.append(assignment)
            return assignments
        except:
            return []

    async def get_by_instructor(self, instructor_id: str) -> List[Assignment]:
        """Obtiene todos los assignments creados por un instructor."""
        try:
            cursor = self.assignment_collection.find({"created_by": instructor_id})
            assignments = []
            async for assignment_dict in cursor:
                assignment = self._dict_to_assignment(assignment_dict)
                if assignment:
                    assignments.append(assignment)
            return assignments
        except:
            return []

    async def search(self, query: str, filters: dict = None) -> List[Assignment]:
        """Busca assignments por título, descripción, etc."""
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
            
            cursor = self.assignment_collection.find(search_filter)
            assignments = []
            async for assignment_dict in cursor:
                assignment = self._dict_to_assignment(assignment_dict)
                if assignment:
                    assignments.append(assignment)
            return assignments
        except:
            return []

    async def get_published(self, course_id: str = None) -> List[Assignment]:
        """Obtiene todos los assignments publicados."""
        try:
            filter_dict = {"is_published": True}
            if course_id:
                filter_dict["course_id"] = course_id
            
            cursor = self.assignment_collection.find(filter_dict)
            assignments = []
            async for assignment_dict in cursor:
                assignment = self._dict_to_assignment(assignment_dict)
                if assignment:
                    assignments.append(assignment)
            return assignments
        except:
            return []

    async def get_due_soon(self, days: int = 7) -> List[Assignment]:
        """Obtiene assignments que vencen pronto."""
        try:
            from datetime import timedelta
            future_date = datetime.utcnow() + timedelta(days=days)
            
            cursor = self.assignment_collection.find({
                "due_date": {
                    "$gte": datetime.utcnow().isoformat(),
                    "$lte": future_date.isoformat()
                },
                "is_published": True
            })
            
            assignments = []
            async for assignment_dict in cursor:
                assignment = self._dict_to_assignment(assignment_dict)
                if assignment:
                    assignments.append(assignment)
            return assignments
        except:
            return []

    async def get_overdue(self) -> List[Assignment]:
        """Obtiene assignments vencidos."""
        try:
            cursor = self.assignment_collection.find({
                "due_date": {"$lt": datetime.utcnow().isoformat()},
                "is_published": True
            })
            
            assignments = []
            async for assignment_dict in cursor:
                assignment = self._dict_to_assignment(assignment_dict)
                if assignment:
                    assignments.append(assignment)
            return assignments
        except:
            return []

    # Implementación de métodos AssignmentSubmission
    async def create_submission(self, submission: AssignmentSubmission) -> AssignmentSubmission:
        """Crea una nueva entrega de assignment."""
        submission_dict = self._submission_to_dict(submission)
        result = await self.submission_collection.insert_one(submission_dict)
        submission.id = str(result.inserted_id)
        return submission

    async def get_submission_by_id(self, submission_id: str) -> Optional[AssignmentSubmission]:
        """Obtiene una entrega por su ID."""
        try:
            submission_dict = await self.submission_collection.find_one({"_id": ObjectId(submission_id)})
            return self._dict_to_submission(submission_dict)
        except:
            return None

    async def update_submission(self, submission_id: str, submission_data: dict) -> Optional[AssignmentSubmission]:
        """Actualiza una entrega de assignment."""
        try:
            submission_data["last_modified_at"] = datetime.utcnow().isoformat()
            
            result = await self.submission_collection.update_one(
                {"_id": ObjectId(submission_id)},
                {"$set": submission_data}
            )
            
            if result.modified_count > 0:
                return await self.get_submission_by_id(submission_id)
            return None
        except:
            return None

    async def delete_submission(self, submission_id: str) -> bool:
        """Elimina una entrega."""
        try:
            result = await self.submission_collection.delete_one({"_id": ObjectId(submission_id)})
            return result.deleted_count > 0
        except:
            return False

    async def get_submissions_by_assignment(self, assignment_id: str) -> List[AssignmentSubmission]:
        """Obtiene todas las entregas de un assignment."""
        try:
            cursor = self.submission_collection.find({"assignment_id": assignment_id})
            submissions = []
            async for submission_dict in cursor:
                submission = self._dict_to_submission(submission_dict)
                if submission:
                    submissions.append(submission)
            return submissions
        except:
            return []

    async def get_submissions_by_student(self, student_id: str, assignment_id: str = None) -> List[AssignmentSubmission]:
        """Obtiene todas las entregas de un estudiante."""
        try:
            filter_dict = {"student_id": student_id}
            if assignment_id:
                filter_dict["assignment_id"] = assignment_id
            
            cursor = self.submission_collection.find(filter_dict)
            submissions = []
            async for submission_dict in cursor:
                submission = self._dict_to_submission(submission_dict)
                if submission:
                    submissions.append(submission)
            return submissions
        except:
            return []

    async def get_latest_submission(self, student_id: str, assignment_id: str) -> Optional[AssignmentSubmission]:
        """Obtiene la última entrega de un estudiante para un assignment."""
        try:
            submission_dict = await self.submission_collection.find_one(
                {"student_id": student_id, "assignment_id": assignment_id},
                sort=[("submission_number", -1)]
            )
            return self._dict_to_submission(submission_dict)
        except:
            return None

    async def get_submissions_to_grade(self, instructor_id: str) -> List[AssignmentSubmission]:
        """Obtiene entregas pendientes de calificación para un instructor."""
        try:
            # Esto requiere join con assignments para filtrar por instructor
            # Implementación simplificada
            cursor = self.submission_collection.find({
                "status": SubmissionStatus.SUBMITTED.value,
                "grade_status": GradeStatus.NOT_GRADED.value
            })
            
            submissions = []
            async for submission_dict in cursor:
                submission = self._dict_to_submission(submission_dict)
                if submission:
                    submissions.append(submission)
            return submissions
        except:
            return []

    async def get_late_submissions(self, assignment_id: str = None) -> List[AssignmentSubmission]:
        """Obtiene entregas tardías."""
        try:
            filter_dict = {"is_late": True}
            if assignment_id:
                filter_dict["assignment_id"] = assignment_id
            
            cursor = self.submission_collection.find(filter_dict)
            submissions = []
            async for submission_dict in cursor:
                submission = self._dict_to_submission(submission_dict)
                if submission:
                    submissions.append(submission)
            return submissions
        except:
            return []

    async def count_submissions(self, assignment_id: str, status: str = None) -> int:
        """Cuenta entregas por assignment y opcionalmente por estado."""
        try:
            filter_dict = {"assignment_id": assignment_id}
            if status:
                filter_dict["status"] = status
            
            return await self.submission_collection.count_documents(filter_dict)
        except:
            return 0

    # Métodos simplificados para Rubric y PeerReview
    async def create_rubric(self, rubric: Rubric) -> Rubric:
        """Crea una nueva rúbrica."""
        # Implementación simplificada
        pass

    async def get_rubric_by_id(self, rubric_id: str) -> Optional[Rubric]:
        """Obtiene una rúbrica por su ID."""
        # Implementación simplificada
        pass

    async def update_rubric(self, rubric_id: str, rubric_data: dict) -> Optional[Rubric]:
        """Actualiza una rúbrica."""
        # Implementación simplificada
        pass

    async def delete_rubric(self, rubric_id: str) -> bool:
        """Elimina una rúbrica."""
        # Implementación simplificada
        pass

    async def get_rubrics_by_instructor(self, instructor_id: str) -> List[Rubric]:
        """Obtiene todas las rúbricas creadas por un instructor."""
        # Implementación simplificada
        return []

    async def get_template_rubrics(self) -> List[Rubric]:
        """Obtiene todas las rúbricas template."""
        # Implementación simplificada
        return []

    async def create_peer_review(self, review: PeerReview) -> PeerReview:
        """Crea una nueva revisión por pares."""
        # Implementación simplificada
        pass

    async def get_peer_review_by_id(self, review_id: str) -> Optional[PeerReview]:
        """Obtiene una revisión por pares por su ID."""
        # Implementación simplificada
        pass

    async def update_peer_review(self, review_id: str, review_data: dict) -> Optional[PeerReview]:
        """Actualiza una revisión por pares."""
        # Implementación simplificada
        pass

    async def get_peer_reviews_by_submission(self, submission_id: str) -> List[PeerReview]:
        """Obtiene todas las revisiones de una entrega."""
        # Implementación simplificada
        return []

    async def get_peer_reviews_by_reviewer(self, reviewer_id: str) -> List[PeerReview]:
        """Obtiene todas las revisiones hechas por un revisor."""
        # Implementación simplificada
        return []

    async def get_pending_peer_reviews(self, reviewer_id: str) -> List[PeerReview]:
        """Obtiene revisiones por pares pendientes para un revisor."""
        # Implementación simplificada
        return []
