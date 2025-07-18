import React from 'react';
import { Link } from 'react-router-dom';

export interface CourseProps {
  id: number;
  title: string;
  description?: string;
  image?: string;
  progress?: number;
  lessons?: number;
  completedLessons?: number;
}

/**
 * Componente de tarjeta de curso que muestra información sobre un curso específico
 * Si no hay imagen disponible, muestra un diseño con degradado y un ícono
 */
const CourseCard: React.FC<CourseProps> = ({
  id,
  title,
  description = 'Curso de la plataforma Stegmaier Consulting',
  image,
  progress = 0,
  lessons = 0,
  completedLessons = 0,
}) => {
  // Colores para el degradado cuando no hay imagen
  const gradientColors = [
    'from-blue-500 to-purple-600',
    'from-primary-500 to-primary-700',
    'from-indigo-500 to-blue-600',
    'from-purple-500 to-pink-500',
    'from-green-500 to-teal-500',
  ];
  
  // Selección aleatoria pero consistente basada en el ID
  const colorIndex = (id % gradientColors.length);
  const gradientColor = gradientColors[colorIndex];
  
  // Íconos para cursos sin imagen
  const icons = [
    (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  ];
  
  const iconIndex = (id % icons.length);
  const icon = icons[iconIndex];

  // Status del progreso
  let progressStatus = 'No comenzado';
  if (progress > 0 && progress < 100) {
    progressStatus = 'En progreso';
  } else if (progress === 100) {
    progressStatus = 'Completado';
  }

  // Clases para el status del progreso
  let statusClasses = 'bg-gray-100 text-gray-800';
  if (progress > 0 && progress < 100) {
    statusClasses = 'bg-yellow-100 text-yellow-800';
  } else if (progress === 100) {
    statusClasses = 'bg-green-100 text-green-800';
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg border border-gray-200 h-full flex flex-col">
      {/* Imagen del curso o alternativa con gradiente si no hay imagen */}
      <div className="h-48 relative overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientColor} flex items-center justify-center p-4`}>
            {icon}
            <div className="absolute bottom-0 left-0 w-full p-3 bg-black bg-opacity-50">
              <span className="text-white text-sm font-medium truncate block">
                Curso {id}
              </span>
            </div>
          </div>
        )}
        
        {/* Badge de progreso */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}>
            {progressStatus}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-2">
          {description}
        </p>
        
        {/* Información de progreso y lecciones */}
        {lessons > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progreso: {progress}%</span>
              <span>{completedLessons} de {lessons} lecciones</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Botón de acción */}
        <Link 
          to={`/platform/courses/${id}`}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
        >
          {progress > 0 ? 'Continuar' : 'Comenzar'} curso
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
