import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de progreso de la plataforma
 * Muestra el avance del usuario en cursos, tiempo de estudio y estadísticas
 */
const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('week');

  // Datos de ejemplo para estadísticas de progreso
  const progressStats = {
    completedCourses: 2,
    inProgressCourses: 3,
    totalCourses: 5,
    completedLessons: 27,
    totalLessons: 78,
    totalHours: 34.5,
    averageScore: 87,
  };

  // Datos de ejemplo para gráficos
  const activityData = {
    week: [2.5, 1.8, 3.2, 0, 4.5, 1.2, 2.0], // horas por día
    month: [8.5, 12.3, 10.2, 15.7], // horas por semana
    year: [45, 38, 52, 64, 35, 42, 57, 68, 48, 32, 44, 34], // horas por mes
  };

  // Calcular porcentajes para las barras de progreso
  const courseCompletionPercent = Math.round((progressStats.completedCourses / progressStats.totalCourses) * 100);
  const lessonCompletionPercent = Math.round((progressStats.completedLessons / progressStats.totalLessons) * 100);

  // Datos de ejemplo para la tabla de cursos recientes
  const recentCourses = [
    {
      id: 1,
      title: 'Introducción a la consultoría estratégica',
      lastActive: '2025-07-17T10:30:00',
      progress: 100,
      remainingLessons: 0,
      totalLessons: 12,
    },
    {
      id: 2,
      title: 'Análisis de procesos empresariales',
      lastActive: '2025-07-15T14:45:00',
      progress: 65,
      remainingLessons: 5,
      totalLessons: 14,
    },
    {
      id: 3,
      title: 'Optimización de operaciones',
      lastActive: '2025-07-10T09:15:00',
      progress: 25,
      remainingLessons: 9,
      totalLessons: 12,
    },
  ];

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Función para obtener etiquetas del eje X según el período seleccionado
  const getTimeFrameLabels = () => {
    switch (timeFrame) {
      case 'week':
        return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      case 'month':
        return ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
      case 'year':
        return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera */}
      <header className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Progreso</h1>
        <p className="text-gray-600 mt-1">
          Visualiza tu avance y estadísticas de aprendizaje
        </p>
      </header>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cursos completados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Cursos Completados</h3>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{progressStats.completedCourses}</p>
                <p className="ml-2 text-sm text-gray-500">de {progressStats.totalCourses}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${courseCompletionPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">{courseCompletionPercent}% completado</p>
          </div>
        </div>

        {/* Lecciones completadas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Lecciones Completadas</h3>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{progressStats.completedLessons}</p>
                <p className="ml-2 text-sm text-gray-500">de {progressStats.totalLessons}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${lessonCompletionPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">{lessonCompletionPercent}% completado</p>
          </div>
        </div>

        {/* Total horas de estudio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Horas de Estudio</h3>
              <p className="text-2xl font-semibold text-gray-900">{progressStats.totalHours}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Última semana</p>
              <p className="text-xs font-medium text-purple-600">
                <span className="font-semibold">+{activityData.week.reduce((a, b) => a + b, 0)}</span> horas
              </p>
            </div>
          </div>
        </div>

        {/* Puntuación promedio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Puntuación Promedio</h3>
              <p className="text-2xl font-semibold text-gray-900">{progressStats.averageScore}%</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full" 
                  style={{ width: `${progressStats.averageScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de actividad */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Actividad de Estudio</h2>
          <div className="mt-3 sm:mt-0">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setTimeFrame('week')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  timeFrame === 'week'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setTimeFrame('month')}
                className={`px-4 py-2 text-sm font-medium ${
                  timeFrame === 'month'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-white text-gray-700 border-t border-b border-gray-300 hover:bg-gray-50'
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setTimeFrame('year')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  timeFrame === 'year'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Año
              </button>
            </div>
          </div>
        </div>

        {/* Gráfico visual simple con barras */}
        <div className="mt-6">
          <div className="flex h-60 items-end space-x-2 sm:space-x-4">
            {activityData[timeFrame].map((value, index) => {
              const maxValue = Math.max(...activityData[timeFrame]);
              const percentage = Math.round((value / maxValue) * 100);
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative">
                    <div
                      className="w-full bg-primary-100 rounded-t-sm transition-all duration-500"
                      style={{ height: `${percentage}%`, maxHeight: '200px' }}
                    >
                      {/* Barra del gráfico */}
                      <div className="absolute bottom-0 w-full bg-primary-500 rounded-t-sm transition-all duration-500"
                        style={{ height: `${percentage}%` }}>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {getTimeFrameLabels()[index]}
                  </div>
                  <div className="text-xs font-medium text-gray-700 mt-1">
                    {value}h
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla de cursos recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Cursos Recientes</h2>
          <p className="text-gray-500 text-sm mt-1">
            Actividad reciente en tus cursos en progreso
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última actividad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restante
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentCourses.map((course) => (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{course.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(course.lastActive)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full mr-2 sm:mr-4">
                        <div
                          className="h-1.5 bg-primary-600 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">{course.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {course.remainingLessons > 0 ? `${course.remainingLessons} lecciones` : 'Completado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/platform/courses/${course.id}`} className="text-primary-600 hover:text-primary-900">
                      {course.progress < 100 ? 'Continuar' : 'Repasar'}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sugerencias y consejos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recomendaciones para tu aprendizaje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="p-2 bg-indigo-100 rounded-md">
                <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Establece metas diarias</h3>
              <p className="mt-1 text-sm text-gray-500">
                Dedica al menos 20 minutos diarios para mantener consistencia en tu aprendizaje
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="p-2 bg-green-100 rounded-md">
                <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Completa los ejercicios prácticos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Los ejercicios prácticos refuerzan tu comprensión del material
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="p-2 bg-amber-100 rounded-md">
                <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Establece horarios fijos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Asigna bloques específicos de tiempo para maximizar la concentración
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="p-2 bg-blue-100 rounded-md">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Participa en los foros</h3>
              <p className="mt-1 text-sm text-gray-500">
                Discutir el material con otros estudiantes mejora la retención
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
