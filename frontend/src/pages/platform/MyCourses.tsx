/**
 * Página "Mis Cursos" - Lista de cursos en los que el usuario está inscrito
 */
import React, { useState, useEffect } from 'react';
import enrollmentService from '../../services/enrollmentService';
import { EnrolledCourse, EnrollmentStatus } from '../../types/enrollment';
import EnrollmentStatusComponent from '../../components/enrollment/EnrollmentStatus';
import { useNavigate } from 'react-router-dom';

const MyCourses: React.FC = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const courses = await enrollmentService.getUserEnrolledCourses();
      setEnrolledCourses(courses);
    } catch (error: any) {
      console.error('Error loading enrolled courses:', error);
      setError('Error al cargar tus cursos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueCourse = (courseId: string) => {
    navigate(`/platform/courses/${courseId}/view`);
  };

  const handleUnenroll = async (courseId: string, courseName: string) => {
    if (!confirm(`¿Estás seguro de que quieres desincribirte del curso "${courseName}"?`)) {
      return;
    }

    try {
      await enrollmentService.unenrollFromCourse(courseId);
      // Recargar la lista de cursos
      await loadEnrolledCourses();
      console.log(`Te has desincrito del curso ${courseName}`);
    } catch (error: any) {
      console.error('Error unenrolling from course:', error);
      alert(`Error al desincribirse del curso: ${error.message}`);
    }
  };

  const getFilteredCourses = () => {
    // Validación defensiva para evitar errores de undefined
    if (!enrolledCourses || !Array.isArray(enrolledCourses)) {
      return [];
    }
    
    switch (filter) {
      case 'active':
        return (Array.isArray(enrolledCourses) ? enrolledCourses : []).filter(course => course.enrollment.status === EnrollmentStatus.ACTIVE);
      case 'completed':
        return (Array.isArray(enrolledCourses) ? enrolledCourses : []).filter(course => course.enrollment.status === EnrollmentStatus.COMPLETED);
      default:
        return Array.isArray(enrolledCourses) ? enrolledCourses : [];
    }
  };

  const filteredCourses = getFilteredCourses();

  const getStatusCounts = () => {
    // Validación defensiva para evitar errores de undefined
    if (!enrolledCourses || !Array.isArray(enrolledCourses)) {
      return { active: 0, completed: 0, total: 0 };
    }
    
    const active = (Array.isArray(enrolledCourses) ? enrolledCourses : []).filter(course => course.enrollment.status === EnrollmentStatus.ACTIVE).length;
    const completed = (Array.isArray(enrolledCourses) ? enrolledCourses : []).filter(course => course.enrollment.status === EnrollmentStatus.COMPLETED).length;
    return { active, completed, total: enrolledCourses.length };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tus cursos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar cursos</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadEnrolledCourses}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">


        {/* Estadísticas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-primary-600">{statusCounts.total}</div>
            <div className="text-sm text-gray-500">Total de cursos</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
            <div className="text-sm text-gray-500">En progreso</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-500">Completados</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({statusCounts.total})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'active' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Activos ({statusCounts.active})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'completed' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completados ({statusCounts.completed})
            </button>
          </div>
        </div>

        {/* Lista de cursos */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' 
                ? 'No tienes cursos inscritos' 
                : filter === 'active'
                  ? 'No tienes cursos activos'
                  : 'No has completado ningún curso'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Explora nuestro catálogo y comienza tu aprendizaje' 
                : filter === 'active'
                  ? 'Inscríbete en un curso para comenzar tu aprendizaje'
                  : 'Completa tus cursos activos para ganar certificados'
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/platform/courses')}
                className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                Explorar Cursos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCourses.map((enrolledCourse) => (
              <div key={enrolledCourse.course.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Course Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {enrolledCourse.course.title}
                    </h3>
                  </div>
                  {enrolledCourse.course.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {enrolledCourse.course.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📊 {enrolledCourse.course.level}</span>
                    <span>🏷️ {enrolledCourse.course.category}</span>
                    {enrolledCourse.course.lessons_count && (
                      <span>📖 {enrolledCourse.course.lessons_count} lecciones</span>
                    )}
                  </div>
                </div>

                {/* Enrollment Status */}
                <div className="p-6">
                  <EnrollmentStatusComponent
                    enrollment={enrolledCourse.enrollment}
                    showProgress={true}
                    showActions={true}
                    onContinue={() => handleContinueCourse(enrolledCourse.course.id)}
                    onUnenroll={() => handleUnenroll(enrolledCourse.course.id, enrolledCourse.course.title)}
                    className="border-none bg-gray-50"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
