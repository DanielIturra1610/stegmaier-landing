import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService, Course } from '../../services/courseService';
import { useAuth } from '../../contexts/AuthContext';
import AdminCourses from '../admin/AdminCourses';
import EnrollmentButton from '../../components/enrollment/EnrollmentButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

/**
 * Página que muestra todos los cursos disponibles para el usuario
 * Permite filtrar y buscar cursos
 */
const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Si el usuario es admin, mostrar la vista administrativa
  if (user?.role === 'admin') {
    return <AdminCourses />;
  }
  
  // Estados para la página
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Cargar cursos al montar el componente
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('🚀 [CoursesPage] Starting to fetch courses...');
        setLoading(true);
        setError(null);
        
        const response = await courseService.getAvailableCourses();
        console.log('📦 [CoursesPage] Raw API response:', response);
        console.log('📦 [CoursesPage] Response type:', typeof response);
        console.log('📦 [CoursesPage] Is array:', Array.isArray(response));
        
        const coursesArray = Array.isArray(response) ? response : response.courses || [];
        console.log('📋 [CoursesPage] Processed courses array:', coursesArray);
        console.log('📊 [CoursesPage] Number of courses:', coursesArray.length);
        
        if (coursesArray.length > 0) {
          console.log('🔍 [CoursesPage] First course details:', coursesArray[0]);
          console.log('🔍 [CoursesPage] First course lessons:', coursesArray[0].lessons);
          console.log('🔍 [CoursesPage] First course lessons_count:', coursesArray[0].lessons_count);
          console.log('🔍 [CoursesPage] First course lessons array check:', Array.isArray(coursesArray[0].lessons));
          console.log('🔍 [CoursesPage] First course lessons length:', Array.isArray(coursesArray[0].lessons) ? coursesArray[0].lessons.length : 'Not an array');
        }
        
        setCourses(coursesArray);
        console.log('✅ [CoursesPage] Courses set in state successfully');
      } catch (err: any) {
        console.error('❌ [CoursesPage] Error loading courses:', err);
        setError(err.message || 'Error al cargar los cursos');
        setCourses([]);
      } finally {
        setLoading(false);
        console.log('🏁 [CoursesPage] Loading finished');
      }
    };

    fetchCourses();
  }, []);
  
  // Handler para comenzar/continuar un curso
  const handleStartCourse = (courseId: string) => {
    console.log('🚀 [CoursesPage] Navigating to course:', courseId);
    navigate(`/platform/courses/${courseId}/view`);
  };
  
  // Función para filtrar cursos según búsqueda y categoría
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    console.log(`🔍 [Filter] Course "${course.title}":
      - Category: "${course.category}" vs Filter: "${categoryFilter}"
      - Matches category: ${matchesCategory}
      - Matches search: ${matchesSearch}
      - Final result: ${matchesSearch && matchesCategory}`);
    
    return matchesSearch && matchesCategory;
  });
  
  // RENDER STATE DEBUG (like debug component)
  console.log('🔄 [CoursesPage] Component render - Loading:', loading, 'Courses:', courses?.length || 0, 'Error:', error || 'None');
  console.log('🔍 [CoursesPage] All courses:', courses);
  console.log('🔍 [CoursesPage] Filtered courses:', filteredCourses.length, filteredCourses);
  console.log('🔍 [CoursesPage] Search query:', searchQuery, 'Category filter:', categoryFilter);
  
  // Si está cargando
  if (loading) {
    console.log('🔄 [CoursesPage] Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Si hay error
  if (error) {
    console.log('❌ [CoursesPage] Rendering error state:', error);
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar cursos</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  // Si no hay cursos disponibles
  if (filteredCourses.length === 0 && courses.length === 0) {
    console.log('🚨 [CoursesPage] Rendering empty state - no courses available');
    return (
      <div className="space-y-6 pb-10">
        {/* Cabecera */}
        <header className="bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Catálogo de Cursos</h1>
          <p className="text-primary-100">
            Explora nuestra selección de cursos especializados en consultoría y gestión empresarial
          </p>
        </header>
        
        {/* Estado vacío */}
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos disponibles</h3>
            <p className="text-gray-600 mb-4">
              Aún no hay cursos publicados en la plataforma. El administrador debe subir contenido para que puedas comenzar a aprender.
            </p>
            <div className="text-sm text-gray-500">
              <p>Mientras tanto, puedes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Completar tu perfil</li>
                <li>Explorar la configuración de la plataforma</li>
                <li>Contactar con soporte si necesitas ayuda</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera */}
      <header className="bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl shadow-md p-6 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Catálogo de Cursos</h1>
        <p className="text-primary-100">
          Explora nuestra selección de cursos especializados en consultoría y gestión empresarial
        </p>
      </header>
      
      {/* Filtros y barra de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="search" className="sr-only">Buscar cursos</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                name="search"
                id="search"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Buscar cursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <label htmlFor="category" className="sr-only">Filtrar por categoría</label>
            <select
              id="category"
              name="category"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              <option value="consulting">Consultoría</option>
              <option value="management">Gestión</option>
              <option value="operations">Operaciones</option>
              <option value="safety_training">Prevención de Riesgos</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Lista de cursos o mensaje de filtros vacíos */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.007-5.691-2.709M12 15l2-9m5 9a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">No se encontraron cursos</h3>
            <p className="text-yellow-700 mb-4">
              No hay cursos que coincidan con tu búsqueda. Intenta con diferentes términos o filtros.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    {(() => {
                      console.log(`🎯 [CourseCard] Processing course "${course.title}":
                        - lessons_count: ${course.lessons_count}
                        - lessons: ${JSON.stringify(course.lessons)}
                        - lessons is array: ${Array.isArray(course.lessons)}
                        - lessons length: ${Array.isArray(course.lessons) ? course.lessons.length : 'N/A'}`);
                      
                      // Lógica simplificada
                      let lessonsCount = 0;
                      
                      if (course.lessons_count !== undefined && course.lessons_count !== null) {
                        lessonsCount = course.lessons_count;
                        console.log(`🔢 [CourseCard] Using lessons_count: ${lessonsCount}`);
                      } else if (Array.isArray(course.lessons)) {
                        lessonsCount = course.lessons.length;
                        console.log(`📚 [CourseCard] Using lessons array length: ${lessonsCount}`);
                      } else {
                        lessonsCount = 0;
                        console.log(`❌ [CourseCard] No lessons data available, defaulting to 0`);
                      }
                      
                      console.log(`✅ [CourseCard] Final lessons count for "${course.title}": ${lessonsCount}`);
                      return lessonsCount;
                    })()} lecciones
                  </span>
                  <span>{course.total_duration || (Array.isArray(course.lessons) ? course.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0) : course.duration) || 0} min</span>
                </div>
                
                {course.progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progreso</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <EnrollmentButton
                  courseId={course.id}
                  courseName={course.title}
                  onEnrollmentChange={(enrolled) => {
                    // Opcional: recargar cursos para reflejar cambios
                    console.log(`Enrollment changed for ${course.title}:`, enrolled);
                  }}
                  onNavigateToCourse={handleStartCourse}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
