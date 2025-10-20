/**
 * Hero section para CourseDetailPage
 */
import React from 'react';
import { CourseDetail, UserCourseAccess } from '../../types/course';
import { 
  Clock, 
  BookOpen, 
  Users, 
  Star, 
  Award,
  CheckCircle,
  PlayCircle 
} from 'lucide-react';

interface CourseHeroProps {
  course: CourseDetail;
  userAccess: UserCourseAccess;
  onEnroll?: () => void;
  onStart?: () => void;
  enrollmentLoading?: boolean;
}

const CourseHero: React.FC<CourseHeroProps> = ({
  course,
  userAccess,
  onEnroll,
  onStart,
  enrollmentLoading = false
}) => {
  // Formatear duración
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };

  // Obtener color del nivel
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto del nivel en español
  const getLevelText = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return level;
    }
  };

  // Renderizar botón de acción
  const renderActionButton = () => {
    if (userAccess.is_enrolled) {
      return (
        <button
          onClick={onStart}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          <PlayCircle className="w-5 h-5 mr-2" />
          {userAccess.enrollment_status === 'completed' ? 'Revisar Curso' : 'Continuar Curso'}
        </button>
      );
    }

    if (userAccess.can_enroll && onEnroll) {
      return (
        <button
          onClick={onEnroll}
          disabled={enrollmentLoading}
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {enrollmentLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Inscribiendo...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Inscribirse Gratis
            </>
          )}
        </button>
      );
    }

    return (
      <button
        disabled
        className="inline-flex items-center px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed"
      >
        No Disponible
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Imagen del curso */}
          <div className="lg:w-2/5">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
              {course.cover_image ? (
                <img
                  src={course.cover_image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <BookOpen className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
          </div>
          
          {/* Información del curso */}
          <div className="lg:w-3/5 space-y-6">
            {/* Tags y nivel */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(course.level)}`}>
                {getLevelText(course.level)}
              </span>
              
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                {course.category}
              </span>
              
              {userAccess.is_enrolled && (
                <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Inscrito
                </span>
              )}
            </div>

            {/* Título */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {course.title}
            </h1>

            {/* Descripción corta */}
            <p className="text-lg text-gray-600 leading-relaxed">
              {course.description}
            </p>

            {/* Instructor */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {course.instructor.avatar ? (
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {course.instructor.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{course.instructor.name}</p>
                {course.instructor.title && (
                  <p className="text-sm text-gray-500">{course.instructor.title}</p>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {formatDuration(course.total_duration)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Duración</p>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {course.stats.lessons_count}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Lecciones</p>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {course.stats.enrollments_count.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Estudiantes</p>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">
                    {course.average_rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  ({course.stats.reviews_count} reseñas)
                </p>
              </div>
            </div>

            {/* Progreso del usuario (solo si está inscrito) */}
            {userAccess.is_enrolled && course.user_enrollment && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Progreso del curso
                  </span>
                  <span className="text-sm font-bold text-blue-900">
                    {Math.round(course.user_enrollment.progress)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.user_enrollment.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Botón de acción */}
            <div className="pt-2">
              {renderActionButton()}
            </div>

            {/* Restricciones (si las hay) */}
            {userAccess.restrictions.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      {userAccess.restrictions.join('. ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseHero;
