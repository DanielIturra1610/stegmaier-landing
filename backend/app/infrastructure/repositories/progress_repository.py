"""
Implementación del repositorio de progreso usando JSON local
"""
import json
import uuid
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime

from ...domain.entities.progress import VideoProgress, UserNote, VideoBookmark
from ...domain.entities.course_progress import LessonProgress, CourseProgress, ProgressSummary, ProgressStatus
from ...domain.repositories.progress_repository import ProgressRepository
from ...core.config import settings

class FileSystemProgressRepository(ProgressRepository):
    """
    Implementación del repositorio de progreso usando sistema de archivos local
    """
    
    def __init__(self):
        self.base_path = Path(settings.MEDIA_ROOT if hasattr(settings, 'MEDIA_ROOT') else 'data')
        self.progress_path = self.base_path / "progress"
        self.video_progress_file = self.progress_path / "video_progress.json"
        self.bookmarks_file = self.progress_path / "bookmarks.json"
        self.notes_file = self.progress_path / "notes.json"
        self.lesson_progress_file = self.progress_path / "lesson_progress.json"
        self.course_progress_file = self.progress_path / "course_progress.json"
        
        # Crear directorios necesarios
        self.progress_path.mkdir(parents=True, exist_ok=True)
        
        # Inicializar archivos
        self._init_files()
    
    def _init_files(self):
        """Inicializar archivos JSON si no existen"""
        if not self.video_progress_file.exists():
            self._save_json(self.video_progress_file, {})
        
        if not self.bookmarks_file.exists():
            self._save_json(self.bookmarks_file, {})
        
        if not self.notes_file.exists():
            self._save_json(self.notes_file, {})
        
        if not self.lesson_progress_file.exists():
            self._save_json(self.lesson_progress_file, {})
        
        if not self.course_progress_file.exists():
            self._save_json(self.course_progress_file, {})
    
    def _load_json(self, file_path: Path) -> Dict[str, Any]:
        """Cargar datos JSON desde archivo"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _save_json(self, file_path: Path, data: Dict[str, Any]):
        """Guardar datos JSON en archivo"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
    
    def _progress_key(self, user_id: str, lesson_id: str, video_id: str) -> str:
        """Generar clave única para progreso de video"""
        return f"{user_id}_{lesson_id}_{video_id}"
    
    async def save_video_progress(self, progress: VideoProgress) -> VideoProgress:
        """Guardar progreso de video"""
        if not progress.id:
            progress.id = str(uuid.uuid4())
        
        data = self._load_json(self.video_progress_file)
        key = self._progress_key(progress.user_id, progress.lesson_id, progress.video_id)
        
        data[key] = {
            'id': progress.id,
            'user_id': progress.user_id,
            'lesson_id': progress.lesson_id,
            'video_id': progress.video_id,
            'current_position': progress.current_position,
            'duration': progress.duration,
            'watch_percentage': progress.watch_percentage,
            'is_completed': progress.is_completed,
            'completion_threshold': progress.completion_threshold,
            'last_watched': progress.last_watched.isoformat() if progress.last_watched else None,
            'total_watch_time': progress.total_watch_time,
            'watch_sessions': progress.watch_sessions,
            'bookmarks': progress.bookmarks,
            'notes': progress.notes,
            'created_at': progress.created_at.isoformat() if progress.created_at else None,
            'updated_at': progress.updated_at.isoformat() if progress.updated_at else None
        }
        
        self._save_json(self.video_progress_file, data)
        return progress
    
    async def get_video_progress(
        self, 
        user_id: str, 
        lesson_id: str, 
        video_id: str
    ) -> Optional[VideoProgress]:
        """Obtener progreso de video"""
        data = self._load_json(self.video_progress_file)
        key = self._progress_key(user_id, lesson_id, video_id)
        
        progress_data = data.get(key)
        if not progress_data:
            return None
        
        return VideoProgress(
            id=progress_data['id'],
            user_id=progress_data['user_id'],
            lesson_id=progress_data['lesson_id'],
            video_id=progress_data['video_id'],
            current_position=progress_data['current_position'],
            duration=progress_data['duration'],
            watch_percentage=progress_data['watch_percentage'],
            is_completed=progress_data['is_completed'],
            completion_threshold=progress_data['completion_threshold'],
            last_watched=datetime.fromisoformat(progress_data['last_watched']) if progress_data.get('last_watched') else None,
            total_watch_time=progress_data['total_watch_time'],
            watch_sessions=progress_data['watch_sessions'],
            bookmarks=progress_data.get('bookmarks', []),
            notes=progress_data.get('notes', ''),
            created_at=datetime.fromisoformat(progress_data['created_at']) if progress_data.get('created_at') else None,
            updated_at=datetime.fromisoformat(progress_data['updated_at']) if progress_data.get('updated_at') else None
        )
    
    async def get_user_progress_summary(
        self, 
        user_id: str, 
        course_id: Optional[str] = None
    ) -> List[VideoProgress]:
        """Obtener resumen de progreso del usuario"""
        data = self._load_json(self.video_progress_file)
        progress_list = []
        
        for key, progress_data in data.items():
            if progress_data['user_id'] != user_id:
                continue
            
            # TODO: Filtrar por course_id si se proporciona
            # Necesitaríamos obtener lesson info para verificar course_id
            
            progress = VideoProgress(
                id=progress_data['id'],
                user_id=progress_data['user_id'],
                lesson_id=progress_data['lesson_id'],
                video_id=progress_data['video_id'],
                current_position=progress_data['current_position'],
                duration=progress_data['duration'],
                watch_percentage=progress_data['watch_percentage'],
                is_completed=progress_data['is_completed'],
                completion_threshold=progress_data['completion_threshold'],
                last_watched=datetime.fromisoformat(progress_data['last_watched']) if progress_data.get('last_watched') else None,
                total_watch_time=progress_data['total_watch_time'],
                watch_sessions=progress_data['watch_sessions'],
                bookmarks=progress_data.get('bookmarks', []),
                notes=progress_data.get('notes', ''),
                created_at=datetime.fromisoformat(progress_data['created_at']) if progress_data.get('created_at') else None,
                updated_at=datetime.fromisoformat(progress_data['updated_at']) if progress_data.get('updated_at') else None
            )
            progress_list.append(progress)
        
        return progress_list
    
    async def save_bookmark(self, bookmark: VideoBookmark) -> VideoBookmark:
        """Guardar marcador"""
        if not bookmark.id:
            bookmark.id = str(uuid.uuid4())
        
        data = self._load_json(self.bookmarks_file)
        
        data[bookmark.id] = {
            'id': bookmark.id,
            'user_id': bookmark.user_id,
            'lesson_id': bookmark.lesson_id,
            'video_id': bookmark.video_id,
            'timestamp': bookmark.timestamp,
            'title': bookmark.title,
            'description': bookmark.description,
            'created_at': bookmark.created_at.isoformat()
        }
        
        self._save_json(self.bookmarks_file, data)
        return bookmark
    
    async def get_video_bookmarks(
        self, 
        user_id: str, 
        lesson_id: str, 
        video_id: str
    ) -> List[VideoBookmark]:
        """Obtener marcadores de video"""
        data = self._load_json(self.bookmarks_file)
        bookmarks = []
        
        for bookmark_data in data.values():
            if (bookmark_data['user_id'] == user_id and 
                bookmark_data['lesson_id'] == lesson_id and 
                bookmark_data['video_id'] == video_id):
                
                bookmark = VideoBookmark(
                    id=bookmark_data['id'],
                    user_id=bookmark_data['user_id'],
                    lesson_id=bookmark_data['lesson_id'],
                    video_id=bookmark_data['video_id'],
                    timestamp=bookmark_data['timestamp'],
                    title=bookmark_data['title'],
                    description=bookmark_data['description'],
                    created_at=datetime.fromisoformat(bookmark_data['created_at'])
                )
                bookmarks.append(bookmark)
        
        return sorted(bookmarks, key=lambda x: x.timestamp)
    
    async def save_note(self, note: UserNote) -> UserNote:
        """Guardar nota"""
        if not note.id:
            note.id = str(uuid.uuid4())
        
        data = self._load_json(self.notes_file)
        
        data[note.id] = {
            'id': note.id,
            'user_id': note.user_id,
            'lesson_id': note.lesson_id,
            'video_id': note.video_id,
            'timestamp': note.timestamp,
            'content': note.content,
            'is_private': note.is_private,
            'created_at': note.created_at.isoformat(),
            'updated_at': note.updated_at.isoformat() if note.updated_at else None
        }
        
        self._save_json(self.notes_file, data)
        return note
    
    async def get_video_notes(
        self, 
        user_id: str, 
        lesson_id: str, 
        video_id: str
    ) -> List[UserNote]:
        """Obtener notas de video"""
        data = self._load_json(self.notes_file)
        notes = []
        
        for note_data in data.values():
            if (note_data['user_id'] == user_id and 
                note_data['lesson_id'] == lesson_id and 
                note_data['video_id'] == video_id):
                
                note = UserNote(
                    id=note_data['id'],
                    user_id=note_data['user_id'],
                    lesson_id=note_data['lesson_id'],
                    video_id=note_data['video_id'],
                    timestamp=note_data['timestamp'],
                    content=note_data['content'],
                    is_private=note_data['is_private'],
                    created_at=datetime.fromisoformat(note_data['created_at']),
                    updated_at=datetime.fromisoformat(note_data['updated_at']) if note_data.get('updated_at') else None
                )
                notes.append(note)
        
        return sorted(notes, key=lambda x: x.timestamp)
    
    # === LESSON PROGRESS METHODS ===
    
    def _lesson_progress_key(self, user_id: str, lesson_id: str) -> str:
        """Generar clave única para progreso de lección"""
        return f"{user_id}_{lesson_id}"
    
    async def save_lesson_progress(self, progress: LessonProgress) -> LessonProgress:
        """Guardar progreso de lección"""
        try:
            data = self._load_json(self.lesson_progress_file)
            
            if not progress.id:
                progress.id = str(uuid.uuid4())
            
            key = self._lesson_progress_key(progress.user_id, progress.lesson_id)
            
            # Convertir a dict para almacenamiento
            progress_dict = {
                'id': progress.id,
                'user_id': progress.user_id,
                'lesson_id': progress.lesson_id,
                'course_id': progress.course_id,
                'enrollment_id': progress.enrollment_id,
                'status': progress.status.value,
                'started_at': progress.started_at.isoformat() if progress.started_at else None,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
                'last_accessed_at': progress.last_accessed_at.isoformat() if progress.last_accessed_at else None,
                'progress_percentage': progress.progress_percentage,
                'time_spent': progress.time_spent,
                'content_type': progress.content_type,
                'video_position': progress.video_position,
                'video_duration': progress.video_duration,
                'quiz_score': progress.quiz_score,
                'quiz_attempts': progress.quiz_attempts,
                'created_at': progress.created_at.isoformat() if progress.created_at else None,
                'updated_at': progress.updated_at.isoformat() if progress.updated_at else None
            }
            
            data[key] = progress_dict
            self._save_json(self.lesson_progress_file, data)
            
            return progress
            
        except Exception as e:
            print(f"❌ Error saving lesson progress: {e}")
            raise e
    
    async def get_lesson_progress(self, user_id: str, lesson_id: str) -> Optional[LessonProgress]:
        """Obtener progreso de lección específica"""
        try:
            data = self._load_json(self.lesson_progress_file)
            key = self._lesson_progress_key(user_id, lesson_id)
            
            if key not in data:
                return None
            
            progress_data = data[key]
            
            return LessonProgress(
                id=progress_data['id'],
                user_id=progress_data['user_id'],
                lesson_id=progress_data['lesson_id'],
                course_id=progress_data['course_id'],
                enrollment_id=progress_data['enrollment_id'],
                status=ProgressStatus(progress_data['status']),
                started_at=datetime.fromisoformat(progress_data['started_at']) if progress_data.get('started_at') else None,
                completed_at=datetime.fromisoformat(progress_data['completed_at']) if progress_data.get('completed_at') else None,
                last_accessed_at=datetime.fromisoformat(progress_data['last_accessed_at']) if progress_data.get('last_accessed_at') else None,
                progress_percentage=progress_data['progress_percentage'],
                time_spent=progress_data['time_spent'],
                content_type=progress_data.get('content_type', 'video'),
                video_position=progress_data.get('video_position'),
                video_duration=progress_data.get('video_duration'),
                quiz_score=progress_data.get('quiz_score'),
                quiz_attempts=progress_data.get('quiz_attempts', 0),
                created_at=datetime.fromisoformat(progress_data['created_at']) if progress_data.get('created_at') else None,
                updated_at=datetime.fromisoformat(progress_data['updated_at']) if progress_data.get('updated_at') else None
            )
            
        except Exception as e:
            print(f"❌ Error getting lesson progress: {e}")
            return None
    
    async def get_course_lessons_progress(self, user_id: str, course_id: str) -> List[LessonProgress]:
        """Obtener progreso de todas las lecciones de un curso"""
        try:
            data = self._load_json(self.lesson_progress_file)
            lessons_progress = []
            
            for key, progress_data in data.items():
                if (progress_data['user_id'] == user_id and 
                    progress_data.get('course_id') == course_id):
                    
                    progress = LessonProgress(
                        id=progress_data['id'],
                        user_id=progress_data['user_id'],
                        lesson_id=progress_data['lesson_id'],
                        course_id=progress_data['course_id'],
                        enrollment_id=progress_data['enrollment_id'],
                        status=ProgressStatus(progress_data['status']),
                        started_at=datetime.fromisoformat(progress_data['started_at']) if progress_data.get('started_at') else None,
                        completed_at=datetime.fromisoformat(progress_data['completed_at']) if progress_data.get('completed_at') else None,
                        last_accessed_at=datetime.fromisoformat(progress_data['last_accessed_at']) if progress_data.get('last_accessed_at') else None,
                        progress_percentage=progress_data['progress_percentage'],
                        time_spent=progress_data['time_spent'],
                        content_type=progress_data.get('content_type', 'video'),
                        video_position=progress_data.get('video_position'),
                        video_duration=progress_data.get('video_duration'),
                        quiz_score=progress_data.get('quiz_score'),
                        quiz_attempts=progress_data.get('quiz_attempts', 0),
                        created_at=datetime.fromisoformat(progress_data['created_at']) if progress_data.get('created_at') else None,
                        updated_at=datetime.fromisoformat(progress_data['updated_at']) if progress_data.get('updated_at') else None
                    )
                    lessons_progress.append(progress)
            
            # Ordenar por lesson_id para consistencia
            return sorted(lessons_progress, key=lambda x: x.lesson_id)
            
        except Exception as e:
            print(f"❌ Error getting course lessons progress: {e}")
            return []
    
    async def get_user_progress_summary(
        self, 
        user_id: str, 
        course_id: Optional[str] = None
    ) -> List[VideoProgress]:
        """
        Obtiene resumen del progreso de videos de un usuario
        """
        try:
            data = self._load_json(self.video_progress_file)
            progress_list = []
            
            for progress_data in data.values():
                if progress_data['user_id'] == user_id:
                    # Si se especifica course_id, filtrar por curso (aunque no está implementado en VideoProgress)
                    # Por ahora retornamos todos los videos del usuario
                    
                    progress = VideoProgress(
                        id=progress_data['id'],
                        user_id=progress_data['user_id'],
                        lesson_id=progress_data['lesson_id'],
                        video_id=progress_data['video_id'],
                        current_position=progress_data['current_position'],
                        duration=progress_data['duration'],
                        watch_percentage=progress_data['watch_percentage'],
                        is_completed=progress_data['is_completed'],
                        total_watch_time=progress_data['total_watch_time'],
                        session_count=progress_data['session_count'],
                        first_watch=datetime.fromisoformat(progress_data['first_watch']) if progress_data.get('first_watch') else None,
                        last_watched=datetime.fromisoformat(progress_data['last_watched']) if progress_data.get('last_watched') else None,
                        bookmarks=[]  # Se cargan por separado si es necesario
                    )
                    progress_list.append(progress)
            
            # Ordenar por última fecha de visualización
            return sorted(progress_list, key=lambda x: x.last_watched or datetime.min, reverse=True)
            
        except Exception as e:
            print(f"❌ Error getting user progress summary: {e}")
            return []
    
    async def mark_lesson_completed(self, user_id: str, lesson_id: str) -> LessonProgress:
        """Marcar lección como completada"""
        try:
            # Obtener progreso actual o crear uno nuevo
            progress = await self.get_lesson_progress(user_id, lesson_id)
            
            if not progress:
                # Crear nuevo progreso si no existe
                progress = LessonProgress(
                    user_id=user_id,
                    lesson_id=lesson_id,
                    course_id="",  # Se debe proporcionar externamente
                    enrollment_id=""  # Se debe proporcionar externamente
                )
            
            # Marcar como completado
            progress.mark_completed()
            
            # Guardar cambios
            return await self.save_lesson_progress(progress)
            
        except Exception as e:
            print(f"❌ Error marking lesson completed: {e}")
            raise e
    
    # === COURSE PROGRESS METHODS ===
    
    def _course_progress_key(self, user_id: str, course_id: str) -> str:
        """Generar clave única para progreso de curso"""
        return f"{user_id}_{course_id}"
    
    async def save_course_progress(self, progress: CourseProgress) -> CourseProgress:
        """Guardar progreso de curso"""
        try:
            data = self._load_json(self.course_progress_file)
            
            if not progress.id:
                progress.id = str(uuid.uuid4())
            
            key = self._course_progress_key(progress.user_id, progress.course_id)
            
            # Convertir a dict para almacenamiento
            progress_dict = {
                'id': progress.id,
                'user_id': progress.user_id,
                'course_id': progress.course_id,
                'enrollment_id': progress.enrollment_id,
                'progress_percentage': progress.progress_percentage,
                'status': progress.status.value,
                'lessons_completed': progress.lessons_completed,
                'total_lessons': progress.total_lessons,
                'lessons_in_progress': progress.lessons_in_progress,
                'total_time_spent': progress.total_time_spent,
                'estimated_remaining_time': progress.estimated_remaining_time,
                'started_at': progress.started_at.isoformat() if progress.started_at else None,
                'last_accessed_at': progress.last_accessed_at.isoformat() if progress.last_accessed_at else None,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
                'target_completion_date': progress.target_completion_date.isoformat() if progress.target_completion_date else None,
                'certificate_issued': progress.certificate_issued,
                'certificate_issued_at': progress.certificate_issued_at.isoformat() if progress.certificate_issued_at else None,
                'certificate_url': progress.certificate_url,
                'average_lesson_score': progress.average_lesson_score,
                'streak_days': progress.streak_days,
                'created_at': progress.created_at.isoformat() if progress.created_at else None,
                'updated_at': progress.updated_at.isoformat() if progress.updated_at else None
            }
            
            data[key] = progress_dict
            self._save_json(self.course_progress_file, data)
            
            return progress
            
        except Exception as e:
            print(f"❌ Error saving course progress: {e}")
            raise e
    
    async def get_course_progress(self, user_id: str, course_id: str) -> Optional[CourseProgress]:
        """Obtener progreso de curso"""
        try:
            data = self._load_json(self.course_progress_file)
            key = self._course_progress_key(user_id, course_id)
            
            if key not in data:
                return None
            
            progress_data = data[key]
            
            return CourseProgress(
                id=progress_data['id'],
                user_id=progress_data['user_id'],
                course_id=progress_data['course_id'],
                enrollment_id=progress_data['enrollment_id'],
                progress_percentage=progress_data['progress_percentage'],
                status=ProgressStatus(progress_data['status']),
                lessons_completed=progress_data['lessons_completed'],
                total_lessons=progress_data['total_lessons'],
                lessons_in_progress=progress_data['lessons_in_progress'],
                total_time_spent=progress_data['total_time_spent'],
                estimated_remaining_time=progress_data.get('estimated_remaining_time'),
                started_at=datetime.fromisoformat(progress_data['started_at']) if progress_data.get('started_at') else None,
                last_accessed_at=datetime.fromisoformat(progress_data['last_accessed_at']) if progress_data.get('last_accessed_at') else None,
                completed_at=datetime.fromisoformat(progress_data['completed_at']) if progress_data.get('completed_at') else None,
                target_completion_date=datetime.fromisoformat(progress_data['target_completion_date']) if progress_data.get('target_completion_date') else None,
                certificate_issued=progress_data.get('certificate_issued', False),
                certificate_issued_at=datetime.fromisoformat(progress_data['certificate_issued_at']) if progress_data.get('certificate_issued_at') else None,
                certificate_url=progress_data.get('certificate_url'),
                average_lesson_score=progress_data.get('average_lesson_score'),
                streak_days=progress_data.get('streak_days', 0),
                created_at=datetime.fromisoformat(progress_data['created_at']) if progress_data.get('created_at') else None,
                updated_at=datetime.fromisoformat(progress_data['updated_at']) if progress_data.get('updated_at') else None
            )
            
        except Exception as e:
            print(f"❌ Error getting course progress: {e}")
            return None
    
    async def recalculate_course_progress(self, user_id: str, course_id: str) -> CourseProgress:
        """Recalcular progreso del curso basado en lecciones"""
        try:
            # Obtener progreso de todas las lecciones del curso
            lessons_progress = await self.get_course_lessons_progress(user_id, course_id)
            
            # Obtener o crear course progress
            course_progress = await self.get_course_progress(user_id, course_id)
            if not course_progress:
                course_progress = CourseProgress(
                    user_id=user_id,
                    course_id=course_id,
                    enrollment_id=""  # Debería proporcionarse externamente
                )
            
            # Actualizar progreso basado en lecciones
            course_progress.update_from_lessons(lessons_progress)
            
            # Guardar cambios
            return await self.save_course_progress(course_progress)
            
        except Exception as e:
            print(f"❌ Error recalculating course progress: {e}")
            raise e
    
    async def get_user_progress_summary(self, user_id: str) -> ProgressSummary:
        """Obtener resumen completo de progreso del usuario"""
        try:
            # Obtener todos los course progress del usuario
            data = self._load_json(self.course_progress_file)
            user_courses = []
            
            for key, progress_data in data.items():
                if progress_data['user_id'] == user_id:
                    course_progress = CourseProgress(
                        id=progress_data['id'],
                        user_id=progress_data['user_id'],
                        course_id=progress_data['course_id'],
                        enrollment_id=progress_data['enrollment_id'],
                        progress_percentage=progress_data['progress_percentage'],
                        status=ProgressStatus(progress_data['status']),
                        lessons_completed=progress_data['lessons_completed'],
                        total_lessons=progress_data['total_lessons'],
                        lessons_in_progress=progress_data['lessons_in_progress'],
                        total_time_spent=progress_data['total_time_spent'],
                        certificate_issued=progress_data.get('certificate_issued', False),
                        last_accessed_at=datetime.fromisoformat(progress_data['last_accessed_at']) if progress_data.get('last_accessed_at') else None
                    )
                    user_courses.append(course_progress)
            
            # Calcular estadísticas del resumen
            total_enrolled = len(user_courses)
            completed = sum(1 for cp in user_courses if cp.status == ProgressStatus.COMPLETED)
            in_progress = sum(1 for cp in user_courses if cp.status == ProgressStatus.IN_PROGRESS)
            not_started = sum(1 for cp in user_courses if cp.status == ProgressStatus.NOT_STARTED)
            total_time = sum(cp.total_time_spent for cp in user_courses)
            certificates = sum(1 for cp in user_courses if cp.certificate_issued)
            total_lessons_completed = sum(cp.lessons_completed for cp in user_courses)
            
            # Última actividad
            last_activity = None
            if user_courses:
                activities = [cp.last_accessed_at for cp in user_courses if cp.last_accessed_at]
                if activities:
                    last_activity = max(activities)
            
            # Cursos recientes (últimos 5 por actividad)
            recent_courses = sorted(
                [cp for cp in user_courses if cp.last_accessed_at],
                key=lambda x: x.last_accessed_at,
                reverse=True
            )[:5]
            
            return ProgressSummary(
                user_id=user_id,
                total_courses_enrolled=total_enrolled,
                courses_completed=completed,
                courses_in_progress=in_progress,
                courses_not_started=not_started,
                total_time_spent=total_time,
                certificates_earned=certificates,
                total_lessons_completed=total_lessons_completed,
                last_activity=last_activity,
                recent_courses=recent_courses
            )
            
        except Exception as e:
            print(f"❌ Error getting user progress summary: {e}")
            # Retornar summary vacío en caso de error
            return ProgressSummary(user_id=user_id)
    
    async def get_user_active_courses(self, user_id: str) -> List[CourseProgress]:
        """Obtener cursos activos del usuario"""
        try:
            data = self._load_json(self.course_progress_file)
            active_courses = []
            
            for key, progress_data in data.items():
                if (progress_data['user_id'] == user_id and 
                    progress_data['status'] in ['in_progress', 'not_started']):
                    
                    course_progress = CourseProgress(
                        id=progress_data['id'],
                        user_id=progress_data['user_id'],
                        course_id=progress_data['course_id'],
                        enrollment_id=progress_data['enrollment_id'],
                        progress_percentage=progress_data['progress_percentage'],
                        status=ProgressStatus(progress_data['status']),
                        lessons_completed=progress_data['lessons_completed'],
                        total_lessons=progress_data['total_lessons'],
                        total_time_spent=progress_data['total_time_spent'],
                        last_accessed_at=datetime.fromisoformat(progress_data['last_accessed_at']) if progress_data.get('last_accessed_at') else None
                    )
                    active_courses.append(course_progress)
            
            # Ordenar por última actividad
            return sorted(active_courses, key=lambda x: x.last_accessed_at or datetime.min, reverse=True)
            
        except Exception as e:
            print(f"❌ Error getting user active courses: {e}")
            return []
