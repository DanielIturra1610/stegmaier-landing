import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Página de listado de cursos disponibles
 * Incluye filtrado y búsqueda
 */
const CoursesListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');

  // Datos de ejemplo para categorías
  const categories = [
    { id: 'todos', name: 'Todos los cursos' },
    { id: 'estrategia', name: 'Estrategia' },
    { id: 'procesos', name: 'Procesos' },
    { id: 'operaciones', name: 'Operaciones' },
    { id: 'liderazgo', name: 'Liderazgo' }
  ];

  // Datos de ejemplo para cursos
  const coursesData = [
    {
      id: 1,
      title: 'Introducción a la consultoría estratégica',
      description: 'Fundamentos y metodologías básicas para la consultoría estratégica empresarial.',
      image: '/assets/images/courses/course1.jpg',
      lessons: 12,
      duration: '6 horas',
      level: 'Principiante',
      category: 'estrategia',
      featured: true,
      progress: 65
    },
    {
      id: 2,
      title: 'Análisis de procesos empresariales',
      description: 'Herramientas y técnicas para analizar, documentar y mejorar procesos empresariales.',
      image: '/assets/images/courses/course2.jpg',
      lessons: 8,
      duration: '4 horas',
      level: 'Intermedio',
      category: 'procesos',
      featured: false,
      progress: 25
    },
    {
      id: 3,
      title: 'Optimización de operaciones',
      description: 'Técnicas avanzadas para optimizar operaciones y reducir costos operativos.',
      image: '/assets/images/courses/course3.jpg',
      lessons: 10,
      duration: '5 horas',
      level: 'Avanzado',
      category: 'operaciones',
      featured: true,
      progress: 0
    },
    {
      id: 4,
      title: 'Liderazgo efectivo en equipos de trabajo',
      description: 'Desarrollo de habilidades de liderazgo para gestionar equipos de alto rendimiento.',
      image: '/assets/images/courses/course4.jpg',
      lessons: 9,
      duration: '4.5 horas',
      level: 'Intermedio',
      category: 'liderazgo',
      featured: false,
      progress: 0
    },
    {
      id: 5,
      title: 'Gestión del cambio organizacional',
      description: 'Estrategias para implementar y gestionar el cambio en organizaciones.',
      image: '/assets/images/courses/course5.jpg',
      lessons: 7,
      duration: '3.5 horas',
      level: 'Intermedio',
      category: 'estrategia',
      featured: false,
      progress: 0
    },
    {
      id: 6,
      title: 'Análisis de datos para la toma de decisiones',
      description: 'Uso de herramientas de análisis de datos para mejorar la toma de decisiones empresariales.',
      image: '/assets/images/courses/course6.jpg',
      lessons: 11,
      duration: '5.5 horas',
      level: 'Avanzado',
      category: 'operaciones',
      featured: false,
      progress: 0
    },
  ];

  // Filtrar cursos según categoría y término de búsqueda
  const filteredCourses = coursesData.filter(course => {
    const matchesCategory = activeCategory === 'todos' || course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cursos destacados
  const featuredCourses = coursesData.filter(course => course.featured);

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera de la página */}
      <header>
        <div className="bg-primary-700 rounded-lg shadow-md p-6">
          <div className="content-overlay">
            <h1 className="text-2xl font-bold text-white mb-2">
              Nuestros cursos
            </h1>
            <p className="text-primary-100">
              Explora nuestra biblioteca de cursos especializados en consultoría y optimización de procesos
            </p>
          </div>
        </div>
      </header>

      {/* Filtros y búsqueda */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
          <div>
            <div className="flex overflow-x-auto space-x-2 pb-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-auto md:min-w-[240px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                placeholder="Buscar cursos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cursos destacados */}
      {featuredCourses.length > 0 && activeCategory === 'todos' && !searchTerm && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cursos destacados</h2>
          <div className="grid grid-cols-1 gap-6">
            {featuredCourses.map(course => (
              <div 
                key={course.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-60 md:h-auto relative">
                    <img 
                      src={course.image || '/assets/images/course-placeholder.jpg'} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 right-0 mt-4 mr-4">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Destacado
                      </span>
                    </div>
                  </div>
                  <div className="p-6 md:w-2/3 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 mb-4">{course.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <svg className="h-5 w-5 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                          {course.level}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <svg className="h-5 w-5 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {course.duration}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <svg className="h-5 w-5 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                          </svg>
                          {course.lessons} lecciones
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      {course.progress > 0 ? (
                        <div className="mb-4 sm:mb-0 sm:mr-4 flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium text-gray-500">Progreso</div>
                            <div className="text-xs font-medium text-primary-600">{course.progress}%</div>
                          </div>
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-100">
                            <div 
                              style={{ width: `${course.progress}%` }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600"
                            />
                          </div>
                        </div>
                      ) : (
                        <div></div>
                      )}
                      <Link 
                        to={`/platform/courses/${course.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                      >
                        {course.progress > 0 ? 'Continuar' : 'Comenzar'} curso
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Listado de todos los cursos */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {activeCategory !== 'todos' ? categories.find(cat => cat.id === activeCategory)?.name : 'Todos los cursos'}
        </h2>
        
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div 
                key={course.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200"
              >
                <div className="relative h-48">
                  <img 
                    src={course.image || '/assets/images/course-placeholder.jpg'} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                  {course.featured && (
                    <div className="absolute top-0 right-0 mt-2 mr-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Destacado
                      </span>
                    </div>
                  )}
                  {course.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-white text-xs font-medium px-2 py-1">
                      En progreso: {course.progress}%
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 flex-1">{course.description}</p>
                  <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                      {course.level}
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {course.duration}
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      {course.lessons} lecciones
                    </div>
                  </div>
                  <Link 
                    to={`/platform/courses/${course.id}`}
                    className="text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    {course.progress > 0 ? 'Continuar' : 'Comenzar'} curso
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <svg className="h-12 w-12 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron cursos</h3>
            <p className="mt-1 text-gray-500">Intenta con otra búsqueda o categoría.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CoursesListPage;
