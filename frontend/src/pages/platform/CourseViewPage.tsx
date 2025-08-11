/**
 * Página de visualización de curso con reproductor avanzado
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdvancedVideoPlayer from '../../components/video/AdvancedVideoPlayer';
import progressService, { VideoProgress } from '../../services/progressService';
import { useAnalytics } from '../../hooks/useAnalytics';

interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url?: string;
  video_id?: string;
  lesson_type: 'video' | 'text';
  order_index: number;
  estimated_duration: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  lessons: Lesson[];
  total_lessons: number;
  estimated_duration: number;
}

const CourseViewPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { trackPageView, trackCourseComplete, trackTimeOnPage } = useAnalytics();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, VideoProgress>>({});
  const [courseProgress, setCourseProgress] = useState(0);

  // Estados del sidebar
  const [showSidebar, setShowSidebar] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    } else {
      setError('ID de curso no válido');
      setIsLoading(false);
    }
  }, [courseId]);
  
  // Track page view and time on page
  useEffect(() => {
    if (courseId && course) {
      trackPageView(`course-view-${courseId}`, {
        course_id: courseId,
        course_title: course.title
      });
      
      const cleanup = trackTimeOnPage(`course-view-${courseId}`);
      return cleanup;
    }
  }, [courseId, course?.title]);

  useEffect(() => {
    calculateCourseProgress();
  }, [lessonProgress]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [CourseViewPage] Loading course data for ID:', courseId);

      // ✅ FIX DIRECTO: Usar fetch con baseURL completa
      const courseResponse = await fetch(`http://localhost:8000/api/v1/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!courseResponse.ok) {
        throw new Error(`Error ${courseResponse.status}: ${courseResponse.statusText}`);
      }

      const courseData = await courseResponse.json();
      
      console.log('✅ [CourseViewPage] Course data loaded:', courseData.title);
      console.log('📋 [CourseViewPage] Lessons in course:', courseData.lessons?.length || 0);
      
      // ✅ Asegurar que lessons sea un array
      if (!courseData.lessons) {
        courseData.lessons = [];
      }
      
      setCourse(courseData);

      // Cargar progreso para lecciones de video solo si hay lecciones
      const progressData: Record<string, VideoProgress> = {};
      const completed = new Set<string>();

      if (courseData.lessons && courseData.lessons.length > 0) {
        for (const lesson of courseData.lessons) {
          // Verificar tanto lesson_type como content_type para compatibilidad
          if ((lesson.lesson_type === 'video' || lesson.content_type === 'video') && lesson.video_id) {
          try {
            const progress = await progressService.getVideoProgress(lesson.id, lesson.video_id || lesson.id);
            if (progress) {
              progressData[lesson.id] = progress;
              if (progress.is_completed) {
                completed.add(lesson.id);
              }
            }
          } catch (error) {
            console.warn(`Could not load progress for lesson ${lesson.id}:`, error);
          }
          }
        }
      }

      setLessonProgress(progressData);
      setCompletedLessons(completed);

    } catch (error) {
      console.error('Error loading course:', error);
      setError('Error al cargar el curso');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCourseProgress = () => {
    // ✅ FIX CRÍTICO: Verificar que course.lessons existe y es array
    if (!course || !course.lessons || !Array.isArray(course.lessons) || course.lessons.length === 0) {
      setCourseProgress(0);
      return;
    }

    try {
      const totalLessons = course.lessons.length;
      const completedCount = completedLessons.size;
      const progressPercentage = Math.round((completedCount / totalLessons) * 100);
    
    // Track course completion when reaching 100%
    if (progressPercentage === 100 && courseProgress < 100) {
      const totalWatchTime = Object.values(lessonProgress)
        .reduce((total, progress) => total + (progress.total_watch_time || 0), 0);
      
      trackCourseComplete(courseId || '', course.title, totalWatchTime);
    }
    
      setCourseProgress(progressPercentage);
    } catch (error) {
      console.error('Error calculating course progress:', error);
      setCourseProgress(0);
    }
  };

  const handleLessonSelect = (lessonIndex: number) => {
    setCurrentLessonIndex(lessonIndex);
  };

  const handleProgressUpdate = (lessonId: string, progress: VideoProgress) => {
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: progress
    }));

    if (progress.is_completed) {
      setCompletedLessons(prev => new Set([...prev, lessonId]));
    }
  };

  const handleLessonComplete = () => {
    const currentLesson = course?.lessons[currentLessonIndex];
    if (!currentLesson) return;

    // Marcar lección como completada
    setCompletedLessons(prev => new Set([...prev, currentLesson.id]));

    // Auto-avanzar a la siguiente lección
    if (currentLessonIndex < (course?.lessons.length || 0) - 1) {
      setTimeout(() => {
        setCurrentLessonIndex(prev => prev + 1);
      }, 2000); // Esperar 2 segundos antes de avanzar
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el curso</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/platform/courses')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Cursos
          </button>
        </div>
      </div>
    );
  }

  // 🔥 FIX: Handle courses without lessons elegantly
  if (course && (!course.lessons || course.lessons.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-yellow-500 mb-6">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Curso en Construcción</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-3">
              Este curso está siendo preparado por nuestro equipo. Las lecciones estarán disponibles muy pronto.
            </p>
            <div className="text-sm text-gray-500">
              <p><strong>Instructor:</strong> {course.instructor_name}</p>
              <p><strong>Estado:</strong> {course.total_lessons > 0 ? 'Lecciones en desarrollo' : 'Contenido en preparación'}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/platform/courses')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Otros Cursos
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Actualizar
            </button>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            <p>💡 Te notificaremos cuando el contenido esté listo</p>
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = course.lessons[currentLessonIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de lecciones */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${showSidebar ? 'w-80' : 'w-0 overflow-hidden'}`}>
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h2>
          <p className="text-sm text-gray-600 mb-4">
            Instructor: {course.instructor_name}
          </p>
          
          {/* Progreso del curso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progreso del curso</span>
              <span>{courseProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${courseProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completedLessons.size} de {course.lessons.length} lecciones completadas
            </p>
          </div>
        </div>

        {/* Lista de lecciones */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {course.lessons.map((lesson, index) => {
            const isActive = index === currentLessonIndex;
            const isCompleted = completedLessons.has(lesson.id);
            const progress = lessonProgress[lesson.id];

            return (
              <div
                key={lesson.id}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleLessonSelect(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Icono de tipo de lección */}
                      {lesson.lesson_type === 'video' ? (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      
                      <span className="text-xs text-gray-500">Lección {index + 1}</span>
                    </div>
                    
                    <h3 className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                      {lesson.title}
                    </h3>
                    
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDuration(lesson.estimated_duration)}
                    </p>
                    
                    {/* Progreso de video */}
                    {lesson.lesson_type === 'video' && progress && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full"
                            style={{ width: `${progress.watch_percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(progress.watch_percentage)}% visto
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Estado de completado */}
                  <div className="ml-2">
                    {isCompleted ? (
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"/>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{currentLesson?.title}</h1>
              <p className="text-sm text-gray-600">
                Lección {currentLessonIndex + 1} de {course.lessons.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Navegación de lecciones */}
            <button
              onClick={() => handleLessonSelect(Math.max(0, currentLessonIndex - 1))}
              disabled={currentLessonIndex === 0}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            
            <button
              onClick={() => handleLessonSelect(Math.min(course.lessons.length - 1, currentLessonIndex + 1))}
              disabled={currentLessonIndex === course.lessons.length - 1}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>

            <button
              onClick={() => navigate('/platform/courses')}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Salir del Curso
            </button>
          </div>
        </div>

        {/* Contenido de la lección */}
        <div className="flex-1 p-6">
          {currentLesson?.lesson_type === 'video' && currentLesson.video_url && currentLesson.video_id ? (
            <div className="max-w-4xl mx-auto">
              <AdvancedVideoPlayer
                videoUrl={currentLesson.video_url}
                lessonId={currentLesson.id}
                videoId={currentLesson.video_id}
                title={currentLesson.title}
                onProgressUpdate={(progress) => handleProgressUpdate(currentLesson.id, progress)}
                onLessonComplete={handleLessonComplete}
                className="w-full"
              />
              
              {/* Contenido adicional de la lección */}
              {currentLesson.content && (
                <div className="mt-6 bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Descripción de la lección</h3>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />
                </div>
              )}
            </div>
          ) : (
            // Lección de texto
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">{currentLesson?.title}</h2>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentLesson?.content || '' }}
                />
                
                {/* Botón para marcar como completada */}
                <div className="mt-8 border-t pt-6">
                  <button
                    onClick={() => {
                      if (currentLesson) {
                        setCompletedLessons(prev => new Set([...prev, currentLesson.id]));
                        handleLessonComplete();
                      }
                    }}
                    disabled={completedLessons.has(currentLesson?.id || '')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {completedLessons.has(currentLesson?.id || '') ? 'Lección Completada ✓' : 'Marcar como Completada'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseViewPage;
