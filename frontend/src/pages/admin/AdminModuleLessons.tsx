/**
 * Página de gestión de lecciones específicas de un módulo
 * Permite crear lecciones de texto y video para un módulo específico
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
  ClipboardDocumentCheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { VideoUploader } from '../../components/media/VideoUploader';
import { VideoPlayer } from '../../components/media/VideoPlayer';
import { lessonService, LessonCreate, LessonResponse } from '../../services/lessonService';
import moduleService from '../../services/moduleService';
import { mediaService } from '../../services/mediaService';
import { ModuleResponse } from '../../types/module';
import { ContentType } from '../../types/lesson';

const AdminModuleLessons: React.FC = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();

  const [module, setModule] = useState<ModuleResponse | null>(null);
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonResponse | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Estados para edición de lecciones
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonResponse | null>(null);
  const [editLessonData, setEditLessonData] = useState({
    title: '',
    content_text: '',
    duration: 0,
    is_free_preview: false
  });

  // Estados para crear nueva lección
  const [showNewLessonForm, setShowNewLessonForm] = useState(false);
  const [newLessonData, setNewLessonData] = useState({
    title: '',
    content_text: '',
    content_type: 'text' as 'text' | 'video',
    is_free_preview: false,
    duration: 0
  });

  useEffect(() => {
    if (courseId && moduleId) {
      loadModuleAndLessons();
    }
  }, [courseId, moduleId]);

  const loadModuleAndLessons = async () => {
    if (!courseId || !moduleId) return;

    try {
      console.log('🔄 [AdminModuleLessons] Loading module and lessons...');
      setLoading(true);

      // Cargar información del módulo
      const moduleData = await moduleService.getModule(moduleId);
      setModule(moduleData);

      // Cargar lecciones del curso (luego filtrar por módulo)
      const lessonsData = await lessonService.getCourseLessons(courseId);

      // TODO: Aquí necesitarías filtrar por módulo cuando el backend soporte module_id en las lecciones
      // Por ahora, mostrar todas las lecciones del curso
      setLessons(lessonsData || []);

    } catch (error: any) {
      console.error('❌ [AdminModuleLessons] Error loading data:', error);
      toast.error('Error al cargar el módulo y lecciones');
    } finally {
      setLoading(false);
    }
  };

  // Función para extraer video ID del URL
  const extractVideoId = (videoUrl: string): string | null => {
    const match = videoUrl.match(/\/videos\/([^\/\?]+)/);
    return match ? match[1] : null;
  };

  const handleCreateLesson = async () => {
    if (!courseId || !newLessonData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      console.log('🚀 [AdminModuleLessons] Creating lesson:', newLessonData);

      const lessonData: LessonCreate = {
        title: newLessonData.title.trim(),
        course_id: courseId,
        order: lessons.length + 1,
        content_type: newLessonData.content_type,
        content_text: newLessonData.content_text.trim() || undefined,
        duration: newLessonData.duration || 0,
        is_free_preview: newLessonData.is_free_preview,
        attachments: []
      };

      const createdLesson = await lessonService.createLesson(courseId, lessonData);
      console.log('✅ [AdminModuleLessons] Lesson created successfully');

      // Aquí necesitarías asignar la lección al módulo cuando esté implementado en el backend
      // await moduleService.assignLessonToModule(moduleId, createdLesson.id);

      toast.success('Lección creada exitosamente');
      setShowNewLessonForm(false);
      setNewLessonData({
        title: '',
        content_text: '',
        content_type: 'text',
        is_free_preview: false,
        duration: 0
      });

      await loadModuleAndLessons();
    } catch (error: any) {
      console.error('❌ [AdminModuleLessons] Error creating lesson:', error);
      toast.error(error.message || 'Error al crear lección');
    }
  };

  const handleVideoUploadSuccess = async (videoId: string, videoInfo: any) => {
    try {
      // Crear lección de video automáticamente
      console.log('📊 [AdminModuleLessons] Video info received:', videoInfo);

      const videoLessonData: LessonCreate = {
        title: videoInfo.title || 'Video sin título',
        course_id: courseId!,
        order: lessons.length + 1,
        content_type: 'video',
        content_url: mediaService.getVideoStreamUrl(videoId),
        duration: videoInfo.duration || 0,
        is_free_preview: false,
        attachments: []
      };

      console.log('📊 [AdminModuleLessons] Creating lesson with data:', videoLessonData);

      const createdLesson = await lessonService.createLesson(courseId!, videoLessonData);

      // Asignar al módulo cuando esté implementado
      // await moduleService.assignLessonToModule(moduleId!, createdLesson.id);

      toast.success('Lección de video creada exitosamente');
      setShowVideoUploader(false);
      await loadModuleAndLessons();
    } catch (error: any) {
      console.error('Error creating video lesson:', error);
      toast.error('Error al crear lección de video');
    }
  };

  const handleVideoUploadError = (error: string) => {
    console.error('Video upload error:', error);
    toast.error(error);

    // Si es error de endpoint no disponible, mostrar mensaje explicativo
    if (error.includes('Servicio de subida de videos no disponible')) {
      toast.error(
        '⚠️ El servicio de videos no está configurado en el backend. ' +
        'Puedes crear lecciones de texto por ahora.',
        { duration: 6000 }
      );
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      return;
    }

    try {
      await lessonService.deleteLesson(lessonId);
      toast.success('Lección eliminada exitosamente');
      await loadModuleAndLessons();
    } catch (error: any) {
      console.error('❌ [AdminModuleLessons] Error deleting lesson:', error);
      toast.error(error.message || 'Error al eliminar lección');
    }
  };

  const handleEditLesson = (lesson: LessonResponse) => {
    setEditingLesson(lesson);
    setEditLessonData({
      title: lesson.title,
      content_text: lesson.content || '',
      duration: lesson.duration || 0,
      is_free_preview: lesson.is_free || false
    });
    setShowEditLessonModal(true);
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !editLessonData.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      console.log('🔄 [AdminModuleLessons] Updating lesson:', editingLesson.id, editLessonData);

      const updateData = {
        title: editLessonData.title.trim(),
        content: editLessonData.content_text.trim() || undefined,
        duration: editLessonData.duration,
        is_free: editLessonData.is_free_preview
      };

      await lessonService.updateLesson(editingLesson.id, updateData);
      console.log('✅ [AdminModuleLessons] Lesson updated successfully');

      toast.success('Lección actualizada exitosamente');
      setShowEditLessonModal(false);
      setEditingLesson(null);
      await loadModuleAndLessons();
    } catch (error: any) {
      console.error('❌ [AdminModuleLessons] Error updating lesson:', error);
      toast.error(error.message || 'Error al actualizar lección');
    }
  };

  const handleCancelEdit = () => {
    setShowEditLessonModal(false);
    setEditingLesson(null);
    setEditLessonData({
      title: '',
      content_text: '',
      duration: 0,
      is_free_preview: false
    });
  };

  const extractVideoIdFromUrl = (videoUrl?: string): string | null => {
    if (!videoUrl) return null;
    const match = videoUrl.match(/\/videos\/([^\/\?]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Módulo no encontrado</p>
        <button
          onClick={() => navigate(`/platform/admin/courses/${courseId}/modules`)}
          className="mt-4 text-blue-600 hover:text-blue-500"
        >
          Volver a módulos
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
            onClick={() => navigate(`/platform/admin/courses/${courseId}/modules`)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Lecciones del Módulo
            </h1>
            <p className="text-gray-600">{module.title}</p>
            <p className="text-sm text-gray-500">
              {module.description === 'Descripción pendiente' ?
                'Sin descripción' :
                module.description
              }
            </p>
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

      {/* Estadísticas del módulo */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <div>
            <div className="text-sm font-medium text-gray-500">Duración Total</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {Math.floor(lessons.reduce((acc, l) => acc + (l.duration || 0), 0) / 60)}min
            </div>
          </div>
        </div>
      </div>

      {/* Video Uploader */}
      {showVideoUploader && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Estado del Servicio de Videos</h3>
              <p className="text-sm text-yellow-700 mt-1">
                El sistema intentará encontrar un endpoint disponible para subir videos.
                Si no funciona, es porque el backend no tiene configurado el servicio de media.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Subir Video para el Módulo
          </h2>
          <VideoUploader
            onUploadSuccess={handleVideoUploadSuccess}
            onUploadError={handleVideoUploadError}
            maxFiles={1}
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

            {newLessonData.content_type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contenido (Opcional)
                </label>
                <textarea
                  value={newLessonData.content_text}
                  onChange={(e) => setNewLessonData(prev => ({
                    ...prev,
                    content_text: e.target.value
                  }))}
                  rows={6}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Puedes dejar esto vacío y agregar contenido después..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  💡 Puedes crear la lección sin contenido y editarla después para agregar texto, videos, etc.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Duración estimada (minutos)
              </label>
              <input
                type="number"
                value={newLessonData.duration}
                onChange={(e) => setNewLessonData(prev => ({
                  ...prev,
                  duration: parseInt(e.target.value) || 0
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newLessonData.is_free_preview}
                onChange={(e) => setNewLessonData(prev => ({
                  ...prev,
                  is_free_preview: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Lección gratuita (preview)
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCreateLesson}
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
            Lecciones del Módulo ({lessons.length})
          </h2>
          {lessons.some(l => l.content_type === 'video') && (
            <p className="mt-2 text-sm text-gray-600">
              💡 <strong>Tip:</strong> Para lecciones de video, usa el ícono <EyeIcon className="h-4 w-4 inline text-purple-600" /> para previsualizar el video en una nueva página.
            </p>
          )}
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay lecciones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando la primera lección de este módulo.
            </p>
            <button
              onClick={() => setShowNewLessonForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear Primera Lección
            </button>
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
                      ) : lesson.lesson_type === 'assignment' || lesson.content_type === 'assignment' ? (
                        <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
                      ) : (
                        <DocumentTextIcon className="h-5 w-5 text-green-500" />
                      )}

                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {lesson.description || (lesson.content && lesson.content.length > 100 ?
                            `${lesson.content.substring(0, 100)}...` :
                            lesson.content) || 'Sin contenido'}
                        </p>
                        <div className="text-xs text-gray-400 mt-1">
                          {lesson.duration ? `${lesson.duration} min` : 'Sin duración'} •
                          {lesson.is_free ? ' Gratis' : ' Premium'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {lesson.content_type === 'video' && lesson.video_url && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setShowVideoPlayer(true);
                          }}
                          className="text-blue-600 hover:text-blue-500 p-1"
                          title="Ver video"
                        >
                          <PlayIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => {
                            const videoId = extractVideoId(lesson.video_url!);
                            if (videoId) {
                              navigate(`/platform/admin/videos/${videoId}/preview`);
                            } else {
                              toast.error('No se pudo obtener el ID del video');
                            }
                          }}
                          className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md text-xs font-medium"
                          title="Previsualizar video en nueva página"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Previsualizar
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleEditLesson(lesson)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Editar lección"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="text-red-400 hover:text-red-600 p-1"
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

      {/* Modal de edición de lección */}
      {showEditLessonModal && editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Lección
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={editLessonData.title}
                  onChange={(e) => setEditLessonData(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Título de la lección"
                />
              </div>

              {editingLesson.content_type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido
                  </label>
                  <textarea
                    value={editLessonData.content_text}
                    onChange={(e) => setEditLessonData(prev => ({
                      ...prev,
                      content_text: e.target.value
                    }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contenido de la lección"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  value={editLessonData.duration}
                  onChange={(e) => setEditLessonData(prev => ({
                    ...prev,
                    duration: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editLessonData.is_free_preview}
                  onChange={(e) => setEditLessonData(prev => ({
                    ...prev,
                    is_free_preview: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Lección gratuita (preview)
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateLesson}
                  disabled={!editLessonData.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Actualizar Lección
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModuleLessons;