/**
 * Página de visualización de curso con reproductor avanzado
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayer from '../../components/video/VideoPlayer';
import progressService, { VideoProgress } from '../../services/progressService';
import { useAnalytics } from '../../hooks/useAnalytics';
import moduleService from '../../services/moduleService';
import enrollmentService from '../../services/enrollmentService';
import { ModuleWithLessons, CourseStructureResponse } from '../../types/module';
import { ChevronDownIcon, ChevronRightIcon, BookOpenIcon, ClockIcon, CheckCircleIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import quizService from '../../services/quizService';
import QuizCard from '../../components/course/QuizCard';
import AssignmentLessonRenderer from '../../components/assignments/AssignmentLessonRenderer';
import { buildApiUrl, getAuthHeaders, API_ENDPOINTS } from '../../config/api.config';

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  videoId?: string;
  lessonType: 'video' | 'text' | 'assignment';
  orderIndex: number;
  estimatedDuration: number;
  // Legacy snake_case aliases for backward compatibility
  video_url?: string;
  video_id?: string;
  lesson_type?: 'video' | 'text' | 'assignment';
  content_type?: 'video' | 'text' | 'assignment';
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  lessons: Lesson[];
  totalLessons: number;
  estimatedDuration: number;
  // Legacy snake_case aliases
  instructor_name?: string;
  total_lessons?: number;
  estimated_duration?: number;
}

const CourseViewPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { trackPageView, trackCourseComplete, trackTimeOnPage } = useAnalytics();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [courseStructure, setCourseStructure] = useState<CourseStructureResponse | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, VideoProgress>>({});
  const [courseProgress, setCourseProgress] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

  // Estados del sidebar - Iniciar oculto para experiencia inmersiva de video
  const [showSidebar, setShowSidebar] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [useModularView, setUseModularView] = useState(false);
  const [lessonQuizzes, setLessonQuizzes] = useState<Record<string, any[]>>({});
  const [userQuizAttempts, setUserQuizAttempts] = useState<Record<string, any>>({});

  useEffect(() => {
    if (courseId) {
      loadCourseData();
      loadCourseQuizzes();
      loadUserEnrollment();
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

  const loadCourseData = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 [CourseViewPage] Loading course data for ID:', courseId);

      // ✅ FIX: Usar buildApiUrl en lugar de URL hardcodeada
      const courseResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}`), {
        headers: getAuthHeaders()
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

      // Intentar cargar estructura modular del curso
      try {
        const structureData = await moduleService.getCourseStructure(courseId!);
        console.log('📚 [CourseViewPage] Course structure loaded:', structureData.modules.length, 'modules');
        setCourseStructure(structureData);
        setUseModularView(structureData.modules.length > 0);
        
        // Expandir el primer módulo por defecto
        if (structureData.modules.length > 0) {
          setExpandedModules(new Set([structureData.modules[0].id]));
        }
      } catch (moduleError) {
        console.log('ℹ️ [CourseViewPage] No modular structure found, using flat lesson list');
        setUseModularView(false);
      }

      // Cargar progreso para lecciones de video solo si hay lecciones
      const progressData: Record<string, VideoProgress> = {};
      const completed = new Set<string>();

      if (courseData.lessons && courseData.lessons.length > 0) {
        for (const lesson of courseData.lessons) {
          // Verificar tanto lessonType/lesson_type como contentType/content_type para compatibilidad
          const lessonType = lesson.lessonType || lesson.lesson_type;
          const contentType = lesson.content_type;
          const videoId = lesson.videoId || lesson.video_id;

          if ((lessonType === 'video' || contentType === 'video') && videoId) {
          try {
            const progress = await progressService.getVideoProgress(lesson.id, videoId || lesson.id);
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
  }, [courseId]);

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(moduleId)) {
        newExpanded.delete(moduleId);
      } else {
        newExpanded.add(moduleId);
      }
      return newExpanded;
    });
  };

  const handleModularLessonSelect = (moduleIndex: number, lessonIndex: number) => {
    if (!courseStructure) return;

    // Calcular el índice global de la lección
    let globalIndex = 0;
    for (let i = 0; i < moduleIndex; i++) {
      globalIndex += courseStructure.modules[i].lessons.length;
    }
    globalIndex += lessonIndex;

    setCurrentLessonIndex(globalIndex);
  };

  const findCurrentModuleAndLesson = () => {
    if (!courseStructure || !course?.lessons) return { moduleIndex: -1, lessonIndex: -1 };

    const currentLesson = course.lessons[currentLessonIndex];
    if (!currentLesson) return { moduleIndex: -1, lessonIndex: -1 };

    for (let moduleIndex = 0; moduleIndex < courseStructure.modules.length; moduleIndex++) {
      const module = courseStructure.modules[moduleIndex];
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
      if (lessonIndex !== -1) {
        return { moduleIndex, lessonIndex };
      }
    }

    return { moduleIndex: -1, lessonIndex: -1 };
  };

  const loadUserEnrollment = async () => {
    if (!courseId || !user) return;
    
    try {
      console.log('🎓 [CourseViewPage] Loading user enrollment for course:', courseId);
      const enrolledCourses = await enrollmentService.getUserEnrolledCourses();
      const courseEnrollment = enrolledCourses.find((e: any) => e.course.id === courseId);
      
      if (courseEnrollment) {
        setEnrollmentId(courseEnrollment.enrollment.id);
        console.log('✅ [CourseViewPage] Enrollment found:', courseEnrollment.enrollment.id);
      } else {
        console.log('⚠️ [CourseViewPage] No enrollment found for course');
      }
    } catch (error) {
      console.error('❌ [CourseViewPage] Error loading enrollment:', error);
    }
  };

  const loadCourseQuizzes = async () => {
    if (!courseId) return;
    
    try {
      console.log('🔍 [CourseViewPage] Loading quizzes for course:', courseId);
      // Commenting out quiz loading as quizService methods don't exist yet
      // const quizzes = await quizService.getQuizzes({ course_id: courseId, status: 'published' });
      
      // Group quizzes by lesson_id
      const quizzesByLesson: Record<string, any[]> = {};
      // quizzes.forEach((quiz: any) => {
      //   if (quiz.lesson_id) {
      //     if (!quizzesByLesson[quiz.lesson_id]) {
      //       quizzesByLesson[quiz.lesson_id] = [];
      //     }
      //     quizzesByLesson[quiz.lesson_id].push(quiz);
      //   }
      // });
      
      setLessonQuizzes(quizzesByLesson);
      
      console.log('✅ [CourseViewPage] Quizzes loaded:', Object.keys(quizzesByLesson).length, 'lessons with quizzes');
    } catch (error) {
      console.error('❌ [CourseViewPage] Error loading course quizzes:', error);
    }
  };

  const calculateCourseProgress = () => {
    if (!course || course.lessons.length === 0) {
      setCourseProgress(0);
      return;
    }

    const totalLessons = course.lessons.length;
    const completedCount = completedLessons.size;
    const progress = (completedCount / totalLessons) * 100;
    setCourseProgress(Math.round(progress));
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
              <p><strong>Instructor:</strong> {course.instructorName || course.instructor_name}</p>
              <p><strong>Estado:</strong> {(course.totalLessons || course.total_lessons || 0) > 0 ? 'Lecciones en desarrollo' : 'Contenido en preparación'}</p>
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
        <div className="p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>

              <div className="text-sm text-gray-500">
                {course.instructorName || course.instructor_name}
              </div>
            </div>
            
            {/* Información de módulos si están disponibles */}
            {courseStructure && courseStructure.modules.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <BookOpenIcon className="w-4 h-4" />
                  <span>{courseStructure.modules.length} módulos</span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{moduleService.formatDuration(
                    courseStructure.modules.reduce((total, m) => total + m.estimated_duration, 0)
                  )}</span>
                </div>
              </div>
            )}
          </div>
          
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

          {/* Lista de lecciones */}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {useModularView && courseStructure ? (
            // Vista Modular
            <div className="space-y-2">
              {courseStructure.modules.map((module, moduleIndex) => {
                const isExpanded = expandedModules.has(module.id);
                const { moduleIndex: currentModuleIndex, lessonIndex: currentLessonIndex } = findCurrentModuleAndLesson();
                const isCurrentModule = moduleIndex === currentModuleIndex;
                
                return (
                  <div key={module.id} className="border rounded-lg overflow-hidden">
                    {/* Header del módulo */}
                    <div 
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                        isCurrentModule ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                        )}
                        <BookOpenIcon className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{module.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>{module.lessons.length} lecciones</span>
                            {module.estimated_duration > 0 && (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{moduleService.formatDuration(module.estimated_duration)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Indicador de progreso del módulo */}
                      <div className="flex items-center gap-2">
                        {module.is_required && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                            Obligatorio
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          Módulo {module.order}
                        </span>
                      </div>
                    </div>

                    {/* Lista de lecciones del módulo */}
                    {isExpanded && (
                      <div className="border-t">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const globalIndex = courseStructure.modules
                            .slice(0, moduleIndex)
                            .reduce((acc, m) => acc + m.lessons.length, 0) + lessonIndex;
                          const isActive = globalIndex === currentLessonIndex;
                          const isCompleted = completedLessons.has(lesson.id);
                          const progress = lessonProgress[lesson.id];

                          return (
                            <div
                              key={lesson.id}
                              className={`p-4 border-b last:border-b-0 cursor-pointer transition-colors ${
                                isActive 
                                  ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleModularLessonSelect(moduleIndex, lessonIndex)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {/* Icono de tipo de lección */}
                                    {lesson.content_type === 'video' ? (
                                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    )}
                                    <span className="text-xs text-gray-500">Lección {lessonIndex + 1}</span>
                                  </div>
                                  
                                  <h4 className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {lesson.title}
                                  </h4>
                                  
                                  <p className="text-xs text-gray-500 mt-1">
                                    Lección {lessonIndex + 1}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                  {/* Indicador de progreso */}
                                  {progress && progress.watch_percentage > 0 && (
                                    <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-green-600 transition-all duration-300"
                                        style={{ width: `${progress.watch_percentage}%` }}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Icono de completado */}
                                  {isCompleted && (
                                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Vista Plana (original)
            course.lessons.map((lesson, index) => {
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
                      {(() => {
                        const lessonType = lesson.lessonType || lesson.lesson_type;
                        if (lessonType === 'video') {
                          return (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                            </svg>
                          );
                        } else if (lessonType === 'assignment') {
                          return (
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          );
                        } else {
                          return (
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          );
                        }
                      })()}

                      <span className="text-xs text-gray-500">Lección {index + 1}</span>
                    </div>
                    
                    <h3 className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                      {lesson.title}
                    </h3>

                    <p className="text-xs text-gray-600 mt-1">
                      {formatDuration(lesson.estimatedDuration || 0)}
                    </p>

                    {/* Progreso de video */}
                    {((lesson.lessonType || lesson.lesson_type) === 'video') && progress && (
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
          })
          )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header unificado con controles */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Controles izquierda: Toggle sidebar + Info lección */}
            <div className="flex items-center gap-3">
              {/* Botón toggle sidebar */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50 transition-colors"
                title={showSidebar ? 'Ocultar índice' : 'Mostrar índice'}
              >
                {showSidebar ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {/* Información de la lección */}
              <div className="flex flex-col">
                <h2 className="font-semibold text-base">{currentLesson?.title || 'Selecciona una lección'}</h2>
                <p className="text-xs text-gray-500">
                  Lección {currentLessonIndex + 1} de {course?.lessons?.length || 0}
                </p>
              </div>
            </div>

            {/* Controles derecha: Vista modular + Volver */}
            <div className="flex items-center gap-2">
              {/* Toggle vista modular */}
              {courseStructure && courseStructure.modules.length > 0 && (
                <button
                  onClick={() => setUseModularView(!useModularView)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    useModularView
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {useModularView ? 'Vista Lista' : 'Vista Módulos'}
                </button>
              )}

              {/* Botón Volver a Explorar Cursos */}
              <button
                onClick={() => navigate('/platform/courses')}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Volver a explorar cursos"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Explorar Cursos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navegación de lecciones */}
        <div className="flex items-center justify-between mb-4 p-4">
          <button
            onClick={() => handleLessonSelect(Math.max(0, currentLessonIndex - 1))}
            disabled={currentLessonIndex === 0}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Lección Anterior
          </button>
          <button
            onClick={() => handleLessonSelect(Math.min((course?.lessons?.length || 0) - 1, currentLessonIndex + 1))}
            disabled={currentLessonIndex === (course?.lessons?.length || 0) - 1}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente Lección →
          </button>
        </div>

        {/* Contenido de la lección */}
        <div className="flex-1 p-6">
          {(() => {
            const lessonType = currentLesson?.lessonType || currentLesson?.lesson_type;
            const videoUrl = currentLesson?.videoUrl || currentLesson?.video_url;
            const videoId = currentLesson?.videoId || currentLesson?.video_id;

            if (lessonType === 'assignment') {
              return (
                <AssignmentLessonRenderer
                  lesson={currentLesson as any}
                  courseId={courseId}
                  enrollmentId={enrollmentId || undefined}
                  onComplete={handleLessonComplete}
                />
              );
            } else if (lessonType === 'video' && videoUrl && videoId) {
              return (
                <div className="w-full max-w-7xl mx-auto">
                  <VideoPlayer
                    videoUrl={videoUrl}
                    lessonId={currentLesson?.id || ''}
                    videoId={videoId || currentLesson?.id || ''}
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
              
              {/* Quizzes de la lección */}
              {lessonQuizzes[currentLesson.id] && lessonQuizzes[currentLesson.id].length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Evaluaciones de esta lección</h3>
                  </div>
                  {lessonQuizzes[currentLesson.id].map((quiz) => {
                    const attempts = userQuizAttempts[quiz.id] || [];
                    const bestAttempt = attempts.length > 0 ? attempts.reduce((best: any, current: any) => 
                      current.score > (best.score || 0) ? current : best
                    ) : null;
                    
                    return (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        userAttempts={attempts.length}
                        bestScore={bestAttempt?.score}
                        canTake={attempts.length < quiz.max_attempts}
                        lastAttemptPassed={bestAttempt?.score >= quiz.passing_score}
                      />
                    );
                  })}
                </div>
              )}
            </div>
              );
            } else {
              // Lección de texto
              return (
                <div className="w-full max-w-7xl mx-auto">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6">{currentLesson?.title}</h2>
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentLesson?.content || '' }}
                    />
                
                {/* Quizzes de la lección */}
                {lessonQuizzes[currentLesson?.id || ''] && lessonQuizzes[currentLesson?.id || ''].length > 0 && (
                  <div className="mt-8 border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Evaluaciones de esta lección</h3>
                    </div>
                    <div className="space-y-4">
                      {lessonQuizzes[currentLesson?.id || ''].map((quiz) => {
                        const attempts = userQuizAttempts[quiz.id] || [];
                        const bestAttempt = attempts.length > 0 ? attempts.reduce((best: any, current: any) => 
                          current.score > (best.score || 0) ? current : best
                        ) : null;
                        
                        return (
                          <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            userAttempts={attempts.length}
                            bestScore={bestAttempt?.score}
                            canTake={attempts.length < quiz.max_attempts}
                            lastAttemptPassed={bestAttempt?.score >= quiz.passing_score}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
                
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
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default CourseViewPage;
