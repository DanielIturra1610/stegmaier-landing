import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, TrendingUp, BookOpen, Clock, Mail, Eye } from 'lucide-react';
import { instructorService, StudentProgress } from '../../services/instructorService';

const InstructorStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'enrollment_date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [courses, setCourses] = useState<Array<{id: string, title: string}>>([]);
  const limit = 20;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [searchTerm, selectedCourse, sortBy, sortOrder, currentPage]);

  const loadInitialData = async () => {
    try {
      // Load instructor's courses for filtering
      const coursesResponse = await instructorService.getMyCourses({ limit: 100 });
      setCourses(coursesResponse.courses.map(course => ({
        id: course.id,
        title: course.title
      })));
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      
      let response;
      if (selectedCourse === 'all') {
        response = await instructorService.getAllMyStudents({
          page: currentPage,
          limit,
          search: searchTerm || undefined
        });
      } else {
        response = await instructorService.getCourseStudents(selectedCourse, {
          page: currentPage,
          limit,
          sort: sortBy,
          order: sortOrder
        });
      }
      
      setStudents(response.students);
      setTotalStudents(response.total);
    } catch (error) {
      console.error('Error loading students:', error);
      // Mock data for development
      setStudents([
        {
          student_id: '1',
          student_name: 'María González',
          student_email: 'maria@example.com',
          enrollment_date: '2024-01-15',
          progress_percentage: 85,
          completed_lessons: 12,
          total_lessons: 15,
          last_activity: '2024-01-20',
          quiz_scores: [
            { quiz_id: '1', quiz_title: 'Evaluación Módulo 1', score: 95, completed_at: '2024-01-18' },
            { quiz_id: '2', quiz_title: 'Evaluación Módulo 2', score: 88, completed_at: '2024-01-20' }
          ]
        },
        {
          student_id: '2',
          student_name: 'Carlos López',
          student_email: 'carlos@example.com',
          enrollment_date: '2024-01-10',
          progress_percentage: 92,
          completed_lessons: 14,
          total_lessons: 15,
          last_activity: '2024-01-21',
          quiz_scores: [
            { quiz_id: '1', quiz_title: 'Evaluación Módulo 1', score: 92, completed_at: '2024-01-16' }
          ]
        }
      ]);
      setTotalStudents(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (studentId: string) => {
    // This would open a modal or navigate to messaging interface
    console.log('Send message to student:', studentId);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getLastActivityText = (lastActivity: string | undefined) => {
    // Validación defensiva para last_activity
    if (!lastActivity) {
      return 'Sin actividad reciente';
    }
    
    try {
      const date = new Date(lastActivity);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Sin actividad reciente';
      }
      
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Hoy';
      if (diffInDays === 1) return 'Ayer';
      if (diffInDays < 7) return `Hace ${diffInDays} días`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error parsing last_activity date:', error);
      return 'Sin actividad reciente';
    }
  };

  const StudentCard: React.FC<{ student: StudentProgress }> = ({ student }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{student.student_name}</h3>
          <p className="text-sm text-gray-600">{student.student_email}</p>
          <p className="text-xs text-gray-500 mt-1">
            Inscrito: {new Date(student.enrollment_date).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSendMessage(student.student_id)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Enviar mensaje"
          >
            <Mail className="h-4 w-4" />
          </button>
          <button
            onClick={() => window.location.href = `/platform/instructor/students/${student.student_id}/detail`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso del Curso</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(student.progress_percentage)}`}>
            {student.progress_percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${student.progress_percentage}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
          <span>{student.completed_lessons} de {student.total_lessons} lecciones</span>
          <span>Última actividad: {getLastActivityText(student?.last_activity)}</span>
        </div>
      </div>

      {/* Quiz Scores */}
      {student.quiz_scores.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Calificaciones de Quizzes</h4>
          <div className="space-y-2">
            {student.quiz_scores.slice(0, 2).map((quiz) => (
              <div key={quiz.quiz_id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate flex-1 mr-2">{quiz.quiz_title}</span>
                <span className={`font-medium ${quiz.score >= 80 ? 'text-green-600' : quiz.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {quiz.score}%
                </span>
              </div>
            ))}
            {student.quiz_scores.length > 2 && (
              <p className="text-xs text-gray-500">
                +{student.quiz_scores.length - 2} quizzes más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const totalPages = Math.ceil(totalStudents / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Estudiantes</h1>
          <p className="text-gray-600 mt-2">
            Monitorea el progreso y rendimiento de tus estudiantes
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar estudiantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Course Filter */}
            <div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los cursos</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="progress">Ordenar por progreso</option>
                <option value="enrollment_date">Ordenar por fecha inscripción</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron estudiantes
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Intenta ajustar los filtros de búsqueda' : 'Aún no tienes estudiantes inscritos en tus cursos'}
            </p>
          </div>
        ) : (
          <>
            {/* Students Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {students.map((student) => (
                <StudentCard key={student.student_id} student={student} />
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
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
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
                  );
                })}
                
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

export default InstructorStudents;
