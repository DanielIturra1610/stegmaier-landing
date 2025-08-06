"""
Implementación del repositorio de progreso usando JSON local
"""
import json
import uuid
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime

from ...domain.entities.progress import VideoProgress, UserNote, VideoBookmark
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
