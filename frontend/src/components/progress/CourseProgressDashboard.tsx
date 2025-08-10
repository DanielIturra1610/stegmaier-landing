/**
 * Dashboard completo de progreso del curso
 */
import React, { useEffect, useState } from 'react';
import { Award, BookOpen, Clock, TrendingUp, Download, AlertCircle } from 'lucide-react';
import LessonProgressBar from './LessonProgressBar';
import progressService from '../../services/progressService';
import { ProgressStatus, CourseProgressResponse } from '../../types/progress';

interface CourseProgressDashboardProps {
  courseId: string;
  onLessonClick?: (lessonId: string) => void;
}

const CourseProgressDashboard: React.FC<CourseProgressDashboardProps> = ({
  courseId,
  onLessonClick
}) => {
  const [progressData, setProgressData] = useState<CourseProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourseProgress();
  }, [courseId]);

  const loadCourseProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await progressService.getCourseProgress(courseId);
      setProgressData(data);
    } catch (error) {
      console.error('Error loading course progress:', error);
      setError('Error cargando el progreso del curso');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const downloadCertificate = () => {
    if (progressData?.course_progress?.certificate_url) {
      window.open(progressData.course_progress.certificate_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
        <button 
          onClick={loadCourseProgress}
          className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!progressData?.course_progress) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aún no has comenzado este curso</p>
          <p className="text-sm text-gray-500 mt-1">
            ¡Empieza ahora y rastrea tu progreso!
          </p>
        </div>
      </div>
    );
  }

  const { course_progress, lessons_progress, next_lesson, completion_percentage, certificate_available } = progressData;

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Progreso del Curso
          </h2>
          {certificate_available && (
            <button
              onClick={downloadCertificate}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Award className="w-4 h-4" />
              <span>Descargar Certificado</span>
            </button>
          )}
        </div>

        {/* Progress Ring */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - completion_percentage / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">
                {Math.round(completion_percentage)}%
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Progreso Total</span>
              <span className="text-sm font-medium">
                {completion_percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completion_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {course_progress.lessons_completed}
            </p>
            <p className="text-sm text-gray-600">de {course_progress.total_lessons} lecciones</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatTime(course_progress.total_time_spent)}
            </p>
            <p className="text-sm text-gray-600">tiempo total</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {course_progress.status === ProgressStatus.COMPLETED ? '100' : Math.round(completion_percentage)}%
            </p>
            <p className="text-sm text-gray-600">completado</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-2">
              <Award className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {course_progress.certificate_issued ? '1' : '0'}
            </p>
            <p className="text-sm text-gray-600">certificado</p>
          </div>
        </div>
      </div>

      {/* Próxima Lección */}
      {next_lesson && course_progress.status !== ProgressStatus.COMPLETED && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Continúa tu aprendizaje
          </h3>
          <p className="text-gray-700 mb-4">
            Siguiente lección recomendada:
          </p>
          <LessonProgressBar
            lessonId={next_lesson.lesson_id}
            title={`Lección ${next_lesson.lesson_id}`}
            progress_percentage={next_lesson.progress_percentage}
            status={next_lesson.status}
            content_type={next_lesson.content_type}
            onClick={() => onLessonClick?.(next_lesson.lesson_id)}
            showDetails={false}
          />
        </div>
      )}

      {/* Lista de Lecciones */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Progreso por Lección
        </h3>
        
        <div className="space-y-3">
          {lessons_progress.map((lesson, index) => (
            <LessonProgressBar
              key={lesson.id}
              lessonId={lesson.lesson_id}
              title={`Lección ${index + 1}`}
              progress_percentage={lesson.progress_percentage}
              status={lesson.status}
              time_spent={lesson.time_spent}
              content_type={lesson.content_type}
              completed_at={lesson.completed_at}
              onClick={() => onLessonClick?.(lesson.lesson_id)}
            />
          ))}
        </div>

        {lessons_progress.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No hay lecciones disponibles</p>
          </div>
        )}
      </div>

      {/* Certificado Completado */}
      {course_progress.status === ProgressStatus.COMPLETED && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Award className="w-12 h-12 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">
                ¡Felicitaciones! 🎉
              </h3>
              <p className="text-green-700 mt-1">
                Has completado exitosamente este curso. 
                {course_progress.certificate_issued && ' Tu certificado está listo para descargar.'}
              </p>
              {course_progress.completed_at && (
                <p className="text-sm text-green-600 mt-2">
                  Completado el {new Date(course_progress.completed_at).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
            {course_progress.certificate_issued && (
              <button
                onClick={downloadCertificate}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseProgressDashboard;
