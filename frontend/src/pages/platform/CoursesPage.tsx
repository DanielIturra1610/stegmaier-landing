import React, { useState } from 'react';
import CourseCard, { CourseProps } from '../../components/courses/CourseCard';

/**
 * Página que muestra todos los cursos disponibles para el usuario
 * Permite filtrar y buscar cursos
 */
const CoursesPage: React.FC = () => {
  // Estado para filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Datos de ejemplo para los cursos
  const courses: CourseProps[] = [
    {
      id: 1,
      title: 'Introducción a la consultoría estratégica',
      description: 'Aprende los fundamentos de la consultoría estratégica y cómo aplicarlos en situaciones reales de negocio.',
      progress: 65,
      lessons: 12,
      completedLessons: 8,
    },
    {
      id: 2,
      title: 'Análisis de procesos empresariales',
      description: 'Técnicas avanzadas para el análisis y optimización de procesos en organizaciones de todos los tamaños.',
      progress: 25,
      lessons: 8,
      completedLessons: 2,
    },
    {
      id: 3,
      title: 'Optimización de operaciones',
      description: 'Metodologías y herramientas para mejorar la eficiencia operativa en empresas manufactureras y de servicios.',
      progress: 0,
      lessons: 10,
      completedLessons: 0,
    },
    {
      id: 4,
      title: 'Gestión del cambio organizacional',
      description: 'Estrategias efectivas para implementar y gestionar procesos de cambio en organizaciones complejas.',
      progress: 0,
      lessons: 9,
      completedLessons: 0,
    },
    {
      id: 5,
      title: 'Implementación de sistemas de gestión ISO 9001',
      description: 'Guía completa para implementar sistemas de gestión de calidad basados en ISO 9001:2015.',
      progress: 10,
      lessons: 15,
      completedLessons: 1,
    },
    {
      id: 6,
      title: 'Liderazgo en entornos de consultoría',
      description: 'Desarrolla habilidades de liderazgo efectivas para gestionar equipos y proyectos de consultoría.',
      progress: 0,
      lessons: 8,
      completedLessons: 0,
    },
  ];
  
  // Categorías para filtrar
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'in-progress', name: 'En progreso' },
    { id: 'not-started', name: 'No comenzados' },
    { id: 'completed', name: 'Completados' }
  ];
  
  // Filtrar cursos según la búsqueda y la categoría
  const filteredCourses = courses.filter(course => {
    // Filtrar por texto de búsqueda
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    // Filtrar por categoría
    let matchesCategory = true;
    if (categoryFilter === 'in-progress') {
      matchesCategory = (course.progress || 0) > 0 && (course.progress || 0) < 100;
    } else if (categoryFilter === 'not-started') {
      matchesCategory = (course.progress || 0) === 0;
    } else if (categoryFilter === 'completed') {
      matchesCategory = (course.progress || 0) === 100;
    }
    
    return matchesSearch && matchesCategory;
  });

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
              className="focus:ring-primary-500 focus:border-primary-500 relative block w-full sm:text-sm border-gray-300 rounded-md"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Resultados de cursos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <CourseCard key={course.id} {...course} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center bg-white p-8 rounded-xl border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron cursos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Intenta ajustar los filtros o la búsqueda para encontrar cursos.
            </p>
          </div>
        )}
      </div>
      
      {/* Sección de cursos destacados */}
      {categoryFilter === 'all' && !searchQuery && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cursos destacados</h2>
          <div className="bg-primary-50 rounded-xl p-4 md:p-6 border border-primary-100">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl h-40 w-full md:w-64 flex-shrink-0 flex items-center justify-center text-white p-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Programa de Certificación en Consultoría</h3>
                <p className="text-gray-600 mb-4">
                  Obtén una certificación profesional en consultoría estratégica con nuestro programa completo de formación.
                </p>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
                  Más información
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
