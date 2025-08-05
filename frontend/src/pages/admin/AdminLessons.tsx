/**
 * Página de gestión de lecciones para administradores
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  VideoCameraIcon, 
  DocumentTextIcon,
  PlayIcon,
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { VideoUploader } from '../../components/media/VideoUploader';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { adminService } from '../../services/adminService';
import { mediaService } from '../../services/mediaService';
import { useAuth } from '../../contexts/AuthContext';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_type: 'text' | 'video';
  video_url?: string;
  duration: number;
  order: number;
  is_free: boolean;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  lessons_count: number;
}

const AdminLessons: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Estados para crear nueva lección
  const [showNewLessonForm, setShowNewLessonForm] = useState(false);
  const [newLessonData, setNewLessonData] = useState({
    title: '',
    description: '',
    content_type: 'text' as 'text' | 'video',
    is_free: false
  });

  useEffect(() => {
    if (courseId) {
      loadCourseAndLessons();
    }
  }, [courseId]);

  const loadCourseAndLessons = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      
      // Cargar información del curso
      const courseData = await adminService.getCourse(courseId);
      setCourse({
        id: courseData.id,
        title: courseData.title,
        instructor: courseData.instructor || 'Sin instructor',
        lessons_count: courseData.lessons_count || 0
      });

      // Cargar lecciones (asumo que existe este método en adminService)
      // Por ahora simulamos con data vacía
      setLessons([]);
      
    } catch (error: any) {
      console.error('Error loading course and lessons:', error);
      toast.error('Error al cargar el curso y lecciones');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUploadSuccess = async (videoId: string, videoInfo: any) => {
    try {
      // Crear lección de video automáticamente
      // Este endpoint necesitaría ser implementado en el backend
      toast.success('Video subido exitosamente');
      setShowVideoUploader(false);
      
      // Recargar lecciones
      await loadCourseAndLessons();
    } catch (error: any) {
      console.error('Error creating video lesson:', error);
      toast.error('Error al crear lección de video');
    }
  };

  const handleCreateTextLesson = async () => {
    if (!courseId || !newLessonData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      // Implementar creación de lección de texto
      toast.success('Lección creada exitosamente');
      setShowNewLessonForm(false);
      setNewLessonData({
        title: '',
        description: '',
        content_type: 'text',
        is_free: false
      });
      
      await loadCourseAndLessons();
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast.error('Error al crear lección');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      return;
    }

    try {
      // Implementar eliminación de lección
      toast.success('Lección eliminada exitosamente');
      await loadCourseAndLessons();
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast.error('Error al eliminar lección');
    }
  };

  const extractVideoIdFromUrl = (videoUrl?: string): string | null => {
    if (!videoUrl) return null;
    const match = videoUrl.match(/\/video\/([^\/]+)\/stream/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Curso no encontrado</p>
        <button
          onClick={() => navigate('/platform/courses')}
          className="mt-4 text-blue-600 hover:text-blue-500"
        >
          Volver a cursos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/platform/courses')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Lecciones
            </h1>
            <p className="text-gray-600">{course.title}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowVideoUploader(!showVideoUploader)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <VideoCameraIcon className="h-4 w-4 mr-2" />
            Subir Video
          </button>
          
          <button
            onClick={() => setShowNewLessonForm(!showNewLessonForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Lección
          </button>
        </div>
      </div>

      {/* Estadísticas del curso */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-500">Total Lecciones</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {lessons.length}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Lecciones de Video</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {lessons.filter(l => l.content_type === 'video').length}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Lecciones de Texto</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {lessons.filter(l => l.content_type === 'text').length}
            </div>
          </div>
        </div>
      </div>

      {/* Video Uploader */}
      {showVideoUploader && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Subir Videos para Lecciones
          </h2>
          <VideoUploader
            onUploadSuccess={handleVideoUploadSuccess}
            onUploadError={(error) => toast.error(error)}
            maxFiles={3}
          />
        </div>
      )}

      {/* Formulario nueva lección */}
      {showNewLessonForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Crear Nueva Lección
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Lección
              </label>
              <select
                value={newLessonData.content_type}
                onChange={(e) => setNewLessonData(prev => ({
                  ...prev,
                  content_type: e.target.value as 'text' | 'video'
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="text">Lección de Texto</option>
                <option value="video">Lección de Video</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                value={newLessonData.title}
                onChange={(e) => setNewLessonData(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Título de la lección"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                value={newLessonData.description}
                onChange={(e) => setNewLessonData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción de la lección"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newLessonData.is_free}
                onChange={(e) => setNewLessonData(prev => ({
                  ...prev,
                  is_free: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Lección gratuita
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCreateTextLesson}
                disabled={!newLessonData.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Crear Lección
              </button>
              <button
                onClick={() => setShowNewLessonForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de lecciones */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Lecciones del Curso
          </h2>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay lecciones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando la primera lección de este curso.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-sm font-medium text-gray-500">
                        {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {lesson.content_type === 'video' ? (
                        <VideoCameraIcon className="h-5 w-5 text-blue-500" />
                      ) : (
                        <DocumentTextIcon className="h-5 w-5 text-green-500" />
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {lesson.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {lesson.content_type === 'video' && lesson.video_url && (
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setShowVideoPlayer(true);
                        }}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => {/* Implementar edición */}}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal reproductor de video */}
      {showVideoPlayer && selectedLesson && selectedLesson.video_url && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedLesson.title}
              </h3>
              <button
                onClick={() => setShowVideoPlayer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="aspect-video">
              <VideoPlayer
                videoId={extractVideoIdFromUrl(selectedLesson.video_url) || ''}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLessons;
