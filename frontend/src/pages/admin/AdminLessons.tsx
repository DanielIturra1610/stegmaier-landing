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
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { VideoUploader } from '../../components/media/VideoUploader';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { adminService } from '../../services/adminService';
import { mediaService } from '../../services/mediaService';
import { lessonService } from '../../services/lessonService';
import { LessonCreate, LessonResponse, ContentType } from '../../types/lesson';
import { useAuth } from '../../contexts/AuthContext';

// Using LessonResponse from service instead of local interface

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

  // Función para extraer video ID desde URL
  const extractVideoId = (videoUrl?: string): string | null => {
    if (!videoUrl) {
      console.error('🔍 [extractVideoId] videoUrl is empty or null');
      return null;
    }

    console.log('🔍 [extractVideoId] Processing URL:', videoUrl);

    // Patrones mejorados para extraer el video ID con soporte para query strings
    const patterns = [
      /\/videos\/([a-f0-9-]+)(?:\/[^?]*)?(?:\?|$)/i,         // /videos/{uuid}/stream?token=...
      /\/api\/v1\/media\/videos\/([a-f0-9-]+)(?:\/[^?]*)?(?:\?|$)/i, // /api/v1/media/videos/{uuid}/stream?token=...
      /\/media\/videos\/([a-f0-9-]+)(?:\/[^?]*)?(?:\?|$)/i, // /media/videos/{uuid}?...
      /video[_-]?id[=:]([a-f0-9-]+)/i,                      // video_id={uuid} o videoId={uuid}
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i, // UUID pattern directo
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = videoUrl.match(pattern);
      if (match && match[1]) {
        console.log(`✅ [extractVideoId] Extracted ID: "${match[1]}" using pattern ${i + 1}:`, pattern);
        return match[1];
      }
    }

    console.error('❌ [extractVideoId] No ID found in URL:', videoUrl);
    console.error('❌ [extractVideoId] All patterns tested but none matched.');
    return null;
  };
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonResponse | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Estados para crear nueva lección
  const [showNewLessonForm, setShowNewLessonForm] = useState(false);
  const [newLessonData, setNewLessonData] = useState({
    title: '',
    description: '',
    content_type: ContentType.TEXT,
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
      console.log('🔄 [AdminLessons] Starting loadCourseAndLessons for course:', courseId);
      setLoading(true);
      
      // Cargar información del curso
      console.log('📖 [AdminLessons] Loading course data...');
      const courseData = await adminService.getCourse(courseId);
      console.log('📖 [AdminLessons] Course data received:', courseData);
      
      const courseInfo = {
        id: courseData.id,
        title: courseData.title,
        instructor: courseData.instructor || 'Sin instructor',
        lessons_count: courseData.lessons_count || 0
      };
      console.log('📖 [AdminLessons] Setting course state:', courseInfo);
      setCourse(courseInfo);

      // Cargar lecciones usando lessonService
      console.log('📚 [AdminLessons] Loading lessons for course:', courseId);
      const lessonsData = await lessonService.getCourseLessons(courseId);
      console.log('📚 [AdminLessons] Raw lessons data received:', lessonsData);
      console.log('📚 [AdminLessons] Lessons count:', lessonsData?.length || 0);
      console.log('📚 [AdminLessons] Setting lessons state...');
      
      setLessons(lessonsData || []);
      console.log('✅ [AdminLessons] Lessons state updated successfully');
      
    } catch (error: any) {
      console.error('💥 [AdminLessons] Error loading course and lessons:', error);
      console.error('💥 [AdminLessons] Error details:', error.message);
      console.error('💥 [AdminLessons] Error stack:', error.stack);
      toast.error('Error al cargar el curso y lecciones');
    } finally {
      console.log('🏁 [AdminLessons] loadCourseAndLessons completed');
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
      console.log('🚀 [AdminLessons] Creating text lesson:', newLessonData);
      console.log('📊 [AdminLessons] Current lessons count:', lessons.length);
      
      // 🔥 FIX: Correct payload to match backend LessonCreate DTO
      const lessonData = {
        title: newLessonData.title.trim(),
        course_id: courseId!, // ✅ Backend requires course_id
        order: lessons.length + 1, // ✅ Backend requires order (next position)
        content_type: newLessonData.content_type,
        content_text: newLessonData.description.trim(), // ✅ For text lessons, use content_text
        duration: 0, // ✅ Backend requires duration (default 0 for text)
        is_free_preview: newLessonData.is_free, // ✅ Backend expects is_free_preview, not is_free
        attachments: [] // ✅ Backend requires attachments array
      };
      
      console.log('📋 [AdminLessons] Final lesson payload:', JSON.stringify(lessonData, null, 2));
      console.log('🚀 [AdminLessons] About to create lesson...');
      
      const createdLesson = await lessonService.createLesson(courseId, lessonData);
      console.log('✅ [AdminLessons] Lesson created successfully:', createdLesson);
      
      toast.success('Lección creada exitosamente');
      console.log('🔄 [AdminLessons] Resetting form state...');
      setShowNewLessonForm(false);
      setNewLessonData({
        title: '',
        description: '',
        content_type: ContentType.TEXT,
        is_free: false
      });
      
      console.log('🔄 [AdminLessons] About to reload course and lessons...');
      await loadCourseAndLessons();
      console.log('✅ [AdminLessons] Course and lessons reloaded after creation');
    } catch (error: any) {
      console.error('❌ [AdminLessons] Error creating lesson:', error);
      toast.error(error.message || 'Error al crear lección');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      return;
    }

    try {
      console.log('🗑️ [AdminLessons] Deleting lesson:', lessonId);
      await lessonService.deleteLesson(lessonId);
      toast.success('Lección eliminada exitosamente');
      await loadCourseAndLessons();
    } catch (error: any) {
      console.error('❌ [AdminLessons] Error deleting lesson:', error);
      toast.error(error.message || 'Error al eliminar lección');
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
              {(Array.isArray(lessons) ? lessons : []).filter(l => l.content_type === 'video').length}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Lecciones de Texto</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {(Array.isArray(lessons) ? lessons : []).filter(l => l.content_type === ContentType.TEXT).length}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Assignments</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {(Array.isArray(lessons) ? lessons : []).filter(l => l.content_type === ContentType.QUIZ).length}
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
                  content_type: e.target.value as ContentType
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={ContentType.TEXT}>Lección de Texto</option>
                <option value={ContentType.VIDEO}>Lección de Video</option>
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
                      {lesson.content_type === ContentType.VIDEO ? (
                        <VideoCameraIcon className="h-5 w-5 text-blue-500" />
                      ) : lesson.content_type === ContentType.QUIZ ? (
                        <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
                      ) : (
                        <DocumentTextIcon className="h-5 w-5 text-green-500" />
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {lesson.content_text || 'Sin contenido'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {lesson.content_type === ContentType.VIDEO && lesson.content_url && (
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setShowVideoPlayer(true);
                        }}
                        className="text-blue-600 hover:text-blue-500"
                        title="Ver video"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    {lesson.content_type === ContentType.QUIZ && (
                      <button
                        onClick={() => toast('Funcionalidad de quiz en desarrollo')}
                        className="text-purple-600 hover:text-purple-500"
                        title="Ver quiz"
                      >
                        <ClipboardDocumentCheckIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => {/* Implementar edición */}}
                      className="text-gray-400 hover:text-gray-600"
                      title="Editar lección"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Eliminar lección"
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
      {showVideoPlayer && selectedLesson && selectedLesson.content_url && (
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
                videoId={extractVideoId(selectedLesson.content_url) || ''}
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
