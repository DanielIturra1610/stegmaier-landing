import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de detalle de curso individual
 * Muestra información detallada del curso, lecciones/módulos y progreso del usuario
 */
const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'instructor'>('overview');
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  // Datos simulados del curso (en una aplicación real, estos datos vendrían de una API)
  const courseData = {
    id: parseInt(courseId || '1'),
    title: 'Introducción a la consultoría estratégica',
    description: 'Fundamentos y metodologías básicas para la consultoría estratégica empresarial. Aprenderás a analizar problemas de negocio, desarrollar soluciones efectivas y presentar recomendaciones a clientes.',
    longDescription: 'Este curso está diseñado para profesionales que buscan adentrarse en el mundo de la consultoría estratégica. A través de casos prácticos y metodologías probadas, aprenderás cómo los consultores profesionales abordan los problemas empresariales complejos, desarrollan soluciones y comunican recomendaciones efectivas. El curso incluye herramientas prácticas, plantillas y técnicas que podrás aplicar inmediatamente en tu trabajo.',
    image: '/assets/images/courses/course1.jpg',
    duration: '6 horas',
    level: 'Principiante',
    category: 'estrategia',
    featured: true,
    progress: 65,
    enrolledStudents: 324,
    lastUpdated: '2025-05-10',
    language: 'Español',
    objectives: [
      'Comprender los fundamentos de la consultoría estratégica',
      'Aplicar metodologías de análisis para resolver problemas empresariales',
      'Desarrollar recomendaciones fundamentadas en datos',
      'Presentar resultados de manera efectiva a clientes y stakeholders',
      'Implementar planes de acción y seguimiento de resultados'
    ],
    requirements: [
      'Conocimientos básicos de administración de empresas',
      'No se requiere experiencia previa en consultoría'
    ],
    instructor: {
      id: 1,
      name: 'Carlos Rodríguez',
      title: 'Consultor Senior y Docente Universitario',
      bio: 'Carlos cuenta con más de 15 años de experiencia en consultoría para empresas Fortune 500. Es especialista en transformación organizacional y optimización de procesos. Ha liderado proyectos en América Latina, Europa y Asia.',
      image: '/assets/images/instructors/instructor1.jpg',
      rating: 4.8,
      courses: 5,
      students: 1240
    },
    modules: [
      {
        id: 1,
        title: 'Fundamentos de la consultoría estratégica',
        lessons: [
          { id: 1, title: 'Introducción a la consultoría', duration: '15 min', completed: true },
          { id: 2, title: 'El rol del consultor estratégico', duration: '20 min', completed: true },
          { id: 3, title: 'Ciclo de vida de un proyecto de consultoría', duration: '25 min', completed: false }
        ]
      },
      {
        id: 2,
        title: 'Análisis de problemas empresariales',
        lessons: [
          { id: 4, title: 'Identificación de problemas raíz', duration: '30 min', completed: false },
          { id: 5, title: 'Recopilación de datos relevantes', duration: '25 min', completed: false },
          { id: 6, title: 'Análisis FODA aplicado', duration: '20 min', completed: false },
          { id: 7, title: 'Mapeo de procesos críticos', duration: '35 min', completed: false }
        ]
      },
      {
        id: 3,
        title: 'Desarrollo de soluciones',
        lessons: [
          { id: 8, title: 'Generación de alternativas', duration: '20 min', completed: false },
          { id: 9, title: 'Evaluación de opciones estratégicas', duration: '30 min', completed: false },
          { id: 10, title: 'Diseño de planes de implementación', duration: '25 min', completed: false }
        ]
      },
      {
        id: 4,
        title: 'Comunicación efectiva',
        lessons: [
          { id: 11, title: 'Estructura de presentaciones impactantes', duration: '20 min', completed: false },
          { id: 12, title: 'Manejo de objeciones y preguntas difíciles', duration: '15 min', completed: false }
        ]
      }
    ]
  };

  // Cálculo del número total de lecciones
  const totalLessons = courseData.modules.reduce((total, module) => total + module.lessons.length, 0);
  
  // Cálculo del número de lecciones completadas
  const completedLessons = courseData.modules.reduce((total, module) => {
    return total + module.lessons.filter(lesson => lesson.completed).length;
  }, 0);
  
  // Cálculo del progreso en porcentaje
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100) || 0;

  // Función para expandir/colapsar módulos
  const toggleModule = (moduleId: number) => {
    if (expandedModules.includes(moduleId)) {
      setExpandedModules(expandedModules.filter(id => id !== moduleId));
    } else {
      setExpandedModules([...expandedModules, moduleId]);
    }
  };

  // Función para manejar el inicio del curso
  const handleStartCourse = () => {
    // En una implementación real, esto podría dirigir a la primera lección no completada
    const firstIncompleteLesson = courseData.modules
      .flatMap(module => module.lessons)
      .find(lesson => !lesson.completed);
    
    if (firstIncompleteLesson) {
      // Aquí se navegaría a la lección (en una implementación real)
      alert(`Navegando a la lección: ${firstIncompleteLesson.title}`);
    } else {
      // Si todas están completas, ir a la primera lección
      alert('Navegando a la primera lección del curso');
    }
  };

  // Efecto para cargar los datos del curso (en una implementación real)
  useEffect(() => {
    // Aquí se haría la llamada a la API para cargar los datos del curso
    // En una implementación real podría ser algo como:
    // const fetchCourseData = async () => {
    //   try {
    //     const response = await api.getCourseDetails(courseId);
    //     setCourseData(response.data);
    //   } catch (error) {
    //     console.error('Error al cargar los datos del curso:', error);
    //     // Manejar error
    //   }
    // };
    // fetchCourseData();

    // Por defecto, expandir el primer módulo
    if (courseData.modules.length > 0) {
      setExpandedModules([courseData.modules[0].id]);
    }
  }, [courseId]);

  if (!courseData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Cargando información del curso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera del curso */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="relative h-48 md:h-64 lg:h-80">
          <img 
            src={courseData.image || '/assets/images/course-placeholder.jpg'} 
            alt={courseData.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
            <div className="p-4 md:p-6 w-full">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-md">
                  {courseData.level}
                </span>
                <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded-md">
                  {courseData.category.charAt(0).toUpperCase() + courseData.category.slice(1)}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {courseData.title}
              </h1>
              <div className="flex items-center mt-2 text-white text-opacity-90">
                <div className="flex items-center mr-4">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{courseData.duration}</span>
                </div>
                <div className="flex items-center mr-4">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  <span className="text-sm">{totalLessons} lecciones</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="text-sm">{courseData.enrolledStudents} estudiantes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Descripción General
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap ${
                activeTab === 'content'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Contenido del Curso
            </button>
            <button
              onClick={() => setActiveTab('instructor')}
              className={`py-4 px-6 text-sm font-medium whitespace-nowrap ${
                activeTab === 'instructor'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Instructor
            </button>
          </nav>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="p-4 md:p-6">
          {/* Tab: Descripción General */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sección de progreso */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Tu progreso</h3>
                    <p className="text-sm text-gray-600">
                      Has completado {completedLessons} de {totalLessons} lecciones
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={handleStartCourse}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      {progressPercentage > 0 ? 'Continuar' : 'Comenzar'} curso
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-medium text-gray-500">Progreso</div>
                    <div className="text-xs font-medium text-primary-600">{progressPercentage}%</div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-100">
                    <div 
                      style={{ width: `${progressPercentage}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción del curso */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">Acerca de este curso</h2>
                <p className="text-gray-600 mb-6">
                  {courseData.longDescription}
                </p>

                {/* Lo que aprenderás */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Lo que aprenderás</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    {courseData.objectives.map((objective, index) => (
                      <div key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requisitos */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Requisitos previos</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {courseData.requirements.map((requirement, index) => (
                      <li key={index} className="text-gray-600">{requirement}</li>
                    ))}
                  </ul>
                </div>

                {/* Información adicional */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Información adicional</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Idioma</p>
                      <p className="text-gray-700">{courseData.language}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Última actualización</p>
                      <p className="text-gray-700">{courseData.lastUpdated}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nivel</p>
                      <p className="text-gray-700">{courseData.level}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Contenido del curso */}
          {activeTab === 'content' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Contenido del curso</h2>
              <p className="text-gray-600 mb-6">
                Este curso incluye {totalLessons} lecciones organizadas en {courseData.modules.length} módulos.
              </p>
              
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {courseData.modules.map((module) => (
                  <div key={module.id} className="overflow-hidden">
                    <button 
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 focus:outline-none"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full mr-3 flex items-center justify-center ${
                          module.lessons.every(lesson => lesson.completed) 
                            ? 'bg-green-100 text-green-500' 
                            : module.lessons.some(lesson => lesson.completed)
                              ? 'bg-yellow-100 text-yellow-500'
                              : 'bg-gray-100 text-gray-400'
                        }`}>
                          {module.lessons.every(lesson => lesson.completed) ? (
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs font-medium">
                              {module.lessons.filter(lesson => lesson.completed).length}/{module.lessons.length}
                            </span>
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm md:text-base font-medium text-gray-900">
                            {module.title}
                          </h3>
                          <p className="text-xs text-gray-500">{module.lessons.length} lecciones</p>
                        </div>
                      </div>
                      <svg 
                        className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`} 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Lista de lecciones del módulo */}
                    {expandedModules.includes(module.id) && (
                      <div className="bg-gray-50 px-4 py-2">
                        <ul className="divide-y divide-gray-100">
                          {module.lessons.map((lesson) => (
                            <li key={lesson.id} className="py-2">
                              <button 
                                className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  // Aquí iría la navegación a la lección específica
                                  alert(`Navegando a: ${lesson.title}`);
                                }}
                              >
                                <div className="flex items-center">
                                  <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mr-3 ${
                                    lesson.completed ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {lesson.completed ? (
                                      <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-700">{lesson.title}</span>
                                </div>
                                <div className="text-xs text-gray-500">{lesson.duration}</div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Instructor */}
          {activeTab === 'instructor' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Acerca del instructor</h2>
              
              <div className="flex flex-col md:flex-row md:items-center p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <img 
                    src={courseData.instructor.image || '/assets/images/instructor-placeholder.jpg'} 
                    alt={courseData.instructor.name} 
                    className="h-24 w-24 rounded-full object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-medium text-gray-900">{courseData.instructor.name}</h3>
                  <p className="text-primary-600 mb-2">{courseData.instructor.title}</p>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex items-center mr-4">
                      <svg className="h-4 w-4 text-yellow-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm">{courseData.instructor.rating} valoración</span>
                    </div>
                    <div className="flex items-center mr-4">
                      <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                      <span className="text-sm">{courseData.instructor.courses} cursos</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      <span className="text-sm">{courseData.instructor.students} estudiantes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-600">{courseData.instructor.bio}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante para continuar curso (en móvil) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-10">
        <button 
          onClick={handleStartCourse}
          className="w-full bg-primary-600 text-white font-medium py-3 px-4 rounded-md shadow-sm hover:bg-primary-700 transition-colors"
        >
          {progressPercentage > 0 ? 'Continuar' : 'Comenzar'} curso
        </button>
      </div>
    </div>
  );
};

export default CourseDetailPage;