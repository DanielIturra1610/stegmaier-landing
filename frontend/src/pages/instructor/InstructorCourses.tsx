import React, { useState, useEffect } from 'react';
import { Book, Users, Star, Calendar, Eye, Edit, MoreVertical, Plus } from 'lucide-react';
import { instructorService, InstructorCourse } from '../../services/instructorService';

const InstructorCourses: React.FC = () => {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadCourses();
  }, [filter, currentPage]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await instructorService.getMyCourses({
        page: currentPage,
        limit,
        status: filter
      });
      setCourses(response.courses);
      setTotalCourses(response.total);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (courseId: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await instructorService.unpublishCourse(courseId);
      } else {
        await instructorService.publishCourse(courseId);
      }
      await loadCourses();
    } catch (error) {
      console.error('Error toggling course publication:', error);
    }
  };

  const CourseCard: React.FC<{ course: InstructorCourse }> = ({ course }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {course.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {course.description}
            </p>
          </div>
          <div className="ml-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {course.total_students} estudiantes
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Book className="h-4 w-4 mr-2" />
            {course.lessons_count} lecciones
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Star className="h-4 w-4 mr-2" />
            {course.average_rating.toFixed(1)} / 5.0
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {Math.floor(course.total_duration / 60)}h {course.total_duration % 60}m
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              course.is_published 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {course.is_published ? 'Publicado' : 'Borrador'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.href = `/platform/instructor/courses/${course.id}/students`}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Eye className="h-4 w-4 inline mr-1" />
              Ver
            </button>
            <button
              onClick={() => window.location.href = `/platform/admin/courses/${course.id}/edit`}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Edit className="h-4 w-4 inline mr-1" />
              Editar
            </button>
            <button
              onClick={() => handlePublishToggle(course.id, course.is_published)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                course.is_published
                  ? 'text-yellow-600 hover:bg-yellow-50'
                  : 'text-green-600 hover:bg-green-50'
              }`}
            >
              {course.is_published ? 'Despublicar' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const totalPages = Math.ceil(totalCourses / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Cursos</h1>
            <p className="text-gray-600 mt-2">
              Gestiona y monitorea tus cursos
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/platform/admin/courses/new'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los cursos</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes cursos aún
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza creando tu primer curso para compartir conocimiento
            </p>
            <button
              onClick={() => window.location.href = '/platform/admin/courses/new'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Primer Curso
            </button>
          </div>
        ) : (
          <>
            {/* Courses Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorCourses;
