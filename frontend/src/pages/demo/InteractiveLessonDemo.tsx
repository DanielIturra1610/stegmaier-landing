/**
 * Página de demostración para probar las lecciones interactivas del Módulo 2
 * Curso: Sistema de Gestión Integrado SICMON
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Importar todas las lecciones
import modulo2Leccion1Content from '../../data/lessons/modulo2-leccion1';
import modulo2Leccion2Content from '../../data/lessons/modulo2-leccion2';
import modulo2Leccion3Content from '../../data/lessons/modulo2-leccion3';
import modulo2Leccion4Content from '../../data/lessons/modulo2-leccion4';
import modulo2Leccion5Content from '../../data/lessons/modulo2-leccion5';
import modulo2Leccion6Content from '../../data/lessons/modulo2-leccion6';
import modulo2Leccion7Content from '../../data/lessons/modulo2-leccion7';
import modulo2Leccion8Content from '../../data/lessons/modulo2-leccion8';

// Importar componente interactivo
import InteractiveContent from '../../components/interactive/InteractiveContent';

const lessons = [
  { id: 'leccion1', content: modulo2Leccion1Content, estimatedTime: 25 },
  { id: 'leccion2', content: modulo2Leccion2Content, estimatedTime: 30 },
  { id: 'leccion3', content: modulo2Leccion3Content, estimatedTime: 35 },
  { id: 'leccion4', content: modulo2Leccion4Content, estimatedTime: 40 },
  { id: 'leccion5', content: modulo2Leccion5Content, estimatedTime: 45 },
  { id: 'leccion6', content: modulo2Leccion6Content, estimatedTime: 30 },
  { id: 'leccion7', content: modulo2Leccion7Content, estimatedTime: 35 },
  { id: 'leccion8', content: modulo2Leccion8Content, estimatedTime: 40 }
];

const InteractiveLessonDemo: React.FC = () => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [lessonStartTime] = useState(Date.now());
  
  const currentLesson = lessons[currentLessonIndex];
  const currentSection = currentLesson?.content?.sections?.[currentSectionIndex];
  
  const handleSectionComplete = () => {
    const nextSectionIndex = currentSectionIndex + 1;
    
    if (nextSectionIndex >= currentLesson.content.sections.length) {
      // Lección completada
      setCompletedLessons(prev => new Set([...prev, currentLessonIndex]));
      setCurrentSectionIndex(0);
    } else {
      setCurrentSectionIndex(nextSectionIndex);
    }
  };

  const handleLessonChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setCurrentSectionIndex(0);
    } else if (direction === 'next' && currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentSectionIndex(0);
    }
  };

  const formatTime = (minutes: number) => {
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const getProgressPercentage = () => {
    if (!currentLesson) return 0;
    return Math.round((currentSectionIndex / currentLesson.content.sections.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header del Curso */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Sistema de Gestión Integrado SICMON
            </h1>
            <p className="text-xl text-gray-600">
              Módulo 2: Fundamentos de Mapa de Procesos
            </p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <BookOpenIcon className="h-4 w-4 mr-2" />
                8 Lecciones Interactivas
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-2" />
                {lessons.reduce((total, lesson) => total + lesson.estimatedTime, 0)} min total
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {completedLessons.size}/{lessons.length} Completadas
              </div>
            </div>
          </div>

          {/* Progress Bar General */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedLessons.size / lessons.length) * 100}%` }}
            />
          </div>
          
          {/* Lista de Lecciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lessons.map((lesson, index) => (
              <motion.button
                key={lesson.id}
                onClick={() => {
                  setCurrentLessonIndex(index);
                  setCurrentSectionIndex(0);
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  currentLessonIndex === index
                    ? 'border-blue-500 bg-blue-50'
                    : completedLessons.has(index)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-gray-900">
                    Lección {index + 1}
                  </h3>
                  {completedLessons.has(index) && (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {lesson.content.title.replace('Lección I: ', '').replace('Lección II: ', '').replace('Lección III: ', '').replace('Lección IV: ', '').replace('Lección V: ', '').replace('Lección VI: ', '').replace('Lección VII: ', '').replace('Lección VIII: ', '')}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {lesson.estimatedTime} min
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Contenido de la Lección Actual */}
        {currentLesson && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            
            {/* Header de la Lección */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {currentLesson.content.title}
                  </h2>
                  <p className="text-blue-100">
                    Sección {currentSectionIndex + 1} de {currentLesson.content.sections.length}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {getProgressPercentage()}%
                  </div>
                  <div className="text-sm text-blue-100">
                    Progreso
                  </div>
                </div>
              </div>
              
              {/* Progress Bar de la Lección */}
              <div className="w-full bg-blue-800 rounded-full h-2 mt-4">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Contenido de la Sección Actual */}
            <div className="p-8">
              {currentSection && (
                <div className="max-w-4xl mx-auto">
                  
                  {/* Título de la Sección */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`${currentLessonIndex}-${currentSectionIndex}`}
                    className="mb-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {currentSection.title}
                    </h3>
                    
                    {/* Contenido Básico de la Sección */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <div className="prose max-w-none text-gray-700">
                        {currentSection.content.split('[REVEAL]')[0].split('\n').map((paragraph, idx) => (
                          <p key={idx} className="mb-4">
                            {paragraph.replace(/🎯|\•|→/g, '').trim()}
                          </p>
                        ))}
                      </div>
                      
                      {/* Mostrar información adicional si existe */}
                      {currentSection.content.includes('[REVEAL]') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded"
                        >
                          <div className="text-sm text-blue-800">
                            {currentSection.content.split('[REVEAL]')[1]?.split('\n').map((line, idx) => (
                              <div key={idx} className="mb-2">
                                {line.replace(/🎯|\•|→/g, '').trim()}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Información del Tipo Interactivo */}
                    {currentSection.interactive && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                          <PlayIcon className="h-5 w-5 text-yellow-600 mr-2" />
                          <span className="font-medium text-yellow-800">
                            Actividad Interactiva: {currentSection.interactive.type}
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-2">
                          Esta sección incluye elementos interactivos que requieren tu participación activa.
                        </p>
                      </div>
                    )}

                    {/* Botón de Completar Sección */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleSectionComplete}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transform transition-all hover:scale-105 shadow-lg"
                      >
                        {currentSectionIndex >= currentLesson.content.sections.length - 1 
                          ? 'Completar Lección' 
                          : 'Continuar a Siguiente Sección'
                        }
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Navegación Entre Lecciones */}
            <div className="bg-gray-50 p-6 flex justify-between">
              <button
                onClick={() => handleLessonChange('prev')}
                disabled={currentLessonIndex === 0}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Lección Anterior
              </button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Lección {currentLessonIndex + 1} de {lessons.length}
                </p>
              </div>
              
              <button
                onClick={() => handleLessonChange('next')}
                disabled={currentLessonIndex >= lessons.length - 1}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente Lección
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveLessonDemo;
