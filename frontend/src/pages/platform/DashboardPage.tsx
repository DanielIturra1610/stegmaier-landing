import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Dashboard principal de la plataforma
 * Muestra resumen de cursos, progreso y accesos rápidos
 */
const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Datos de ejemplo para el dashboard
  const courses = [
    {
      id: 1,
      title: 'Introducción a la consultoría estratégica',
      progress: 65,
      image: '/assets/images/courses/course1.jpg',
      lessons: 12,
      completedLessons: 8,
    },
    {
      id: 2,
      title: 'Análisis de procesos empresariales',
      progress: 25,
      image: '/assets/images/courses/course2.jpg',
      lessons: 8,
      completedLessons: 2,
    },
    {
      id: 3,
      title: 'Optimización de operaciones',
      progress: 0,
      image: '/assets/images/courses/course3.jpg',
      lessons: 10,
      completedLessons: 0,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera de bienvenida */}
      <header>
        <div className="bg-primary-700 rounded-lg shadow-md p-6">
          <div className="content-overlay">
            <h1 className="text-2xl font-bold text-white mb-2">
              Bienvenido, {user?.firstName || 'Estudiante'}
            </h1>
            <p className="text-primary-100">
              Continúa tu aprendizaje donde lo dejaste
            </p>
          </div>
        </div>
      </header>

      {/* Accesos rápidos */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center hover:shadow-md transition-shadow duration-200">
          <div className="rounded-full bg-primary-100 p-3 mr-4">
            <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">Mis Cursos</h3>
            <p className="text-sm text-gray-500">Accede a todos tus cursos</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center hover:shadow-md transition-shadow duration-200">
          <div className="rounded-full bg-primary-100 p-3 mr-4">
            <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">Certificados</h3>
            <p className="text-sm text-gray-500">Visualiza tus logros</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center hover:shadow-md transition-shadow duration-200">
          <div className="rounded-full bg-primary-100 p-3 mr-4">
            <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium">Mi Perfil</h3>
            <p className="text-sm text-gray-500">Edita tu información</p>
          </div>
        </div>
      </section>

      {/* Continuar aprendiendo */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Continúa aprendiendo</h2>
          <Link to="/platform/courses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todos los cursos
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.length > 0 ? (
            courses.slice(0, 2).map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-48 md:h-auto relative">
                    <img 
                      src={course.image || '/assets/images/course-placeholder.jpg'} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 left-0 p-2 bg-primary-600 text-white text-xs font-medium">
                      {course.progress > 0 ? 'En progreso' : 'Nuevo'}
                    </div>
                  </div>
                  
                  <div className="p-4 md:w-2/3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{course.completedLessons} de {course.lessons} lecciones completadas</span>
                      </div>
                      
                      {/* Barra de progreso */}
                      <div className="relative pt-1">
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
                    </div>
                    
                    <div className="mt-4">
                      <Link 
                        to={`/platform/courses/${course.id}`}
                        className="inline-block px-4 py-2 border border-primary-600 text-primary-600 rounded-md text-sm font-medium hover:bg-primary-600 hover:text-white transition-colors duration-200"
                      >
                        {course.progress > 0 ? 'Continuar' : 'Comenzar'} curso
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white rounded-lg p-6 text-center">
              <svg className="h-12 w-12 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No has iniciado ningún curso</h3>
              <p className="mt-1 text-gray-500">Explora nuestro catálogo de cursos para comenzar.</p>
              <div className="mt-6">
                <Link
                  to="/platform/courses"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Explorar cursos
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Estadísticas generales */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tu progreso general</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 mb-1">3</div>
            <div className="text-sm text-gray-500">Cursos inscritos</div>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 mb-1">10</div>
            <div className="text-sm text-gray-500">Lecciones completadas</div>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-600 mb-1">0</div>
            <div className="text-sm text-gray-500">Certificados obtenidos</div>
          </div>
        </div>
      </section>
      
      {/* Próximas actualizaciones */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-lg shadow-md p-6 text-white">
        <div className="content-overlay">
          <h2 className="text-xl font-bold mb-2">Próximamente</h2>
          <p className="text-primary-100 mb-4">
            Estamos trabajando en nuevos cursos y características que mejorarán tu experiencia de aprendizaje.
          </p>
          <div className="inline-block px-4 py-2 bg-white bg-opacity-10 rounded-lg text-sm">
            Lanzamiento de nuevos cursos: Agosto 2025
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
