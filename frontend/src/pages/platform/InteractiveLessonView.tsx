/**
 * Vista completa de lección interactiva
 * Integra todos los componentes interactivos para una experiencia de aprendizaje dinámica
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

// Componentes interactivos
import InteractiveContent from '../../components/interactive/InteractiveContent';
import DragDropActivity from '../../components/interactive/DragDropActivity';
import ProcessMapBuilder from '../../components/interactive/ProcessMapBuilder';

// Datos de todas las lecciones del módulo 2
import modulo2Leccion1Content from '../../data/lessons/modulo2-leccion1';
import modulo2Leccion2Content from '../../data/lessons/modulo2-leccion2';
import modulo2Leccion3Content from '../../data/lessons/modulo2-leccion3';
import modulo2Leccion4Content from '../../data/lessons/modulo2-leccion4';
import modulo2Leccion5Content from '../../data/lessons/modulo2-leccion5';
import modulo2Leccion6Content from '../../data/lessons/modulo2-leccion6';
import modulo2Leccion7Content from '../../data/lessons/modulo2-leccion7';
import modulo2Leccion8Content from '../../data/lessons/modulo2-leccion8';

// Mapeo de lecciones disponibles
const lessonContentMap: Record<string, any> = {
  'modulo2-leccion1': modulo2Leccion1Content,
  'modulo2-leccion2': modulo2Leccion2Content,
  'modulo2-leccion3': modulo2Leccion3Content,
  'modulo2-leccion4': modulo2Leccion4Content,
  'modulo2-leccion5': modulo2Leccion5Content,
  'modulo2-leccion6': modulo2Leccion6Content,
  'modulo2-leccion7': modulo2Leccion7Content,
  'modulo2-leccion8': modulo2Leccion8Content,
};

const InteractiveLessonView: React.FC = () => {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lessonProgress, setLessonProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState(0);
  const [completedActivities, setCompletedActivities] = useState<Set<number>>(new Set());
  const [lessonStartTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  
  // Obtener contenido de la lección basado en los parámetros de ruta
  const getLessonContent = () => {
    const lessonKey = `${moduleId}-${lessonId}`;
    return lessonContentMap[lessonKey] || modulo2Leccion1Content;
  };
  
  const lessonContent = getLessonContent();

  // Timer para tracking de tiempo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Date.now() - lessonStartTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [lessonStartTime]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressUpdate = (progress: number) => {
    setLessonProgress(progress);
  };

  const handleActivityComplete = (activityIndex: number) => {
    setCompletedActivities(prev => new Set([...prev, activityIndex]));
  };

  const handleLessonComplete = () => {
    // Aquí se enviaría el progreso al backend
    console.log('Lección completada:', {
      courseId,
      moduleId, 
      lessonId,
      timeSpent,
      progress: 100
    });
  };

  const activities = [
    {
      title: "Contenido Principal",
      type: "content",
      component: (
        <InteractiveContent
          lessonId={lessonId!}
          content={lessonContent}
          onProgressUpdate={handleProgressUpdate}
          onLessonComplete={handleLessonComplete}
        />
      )
    },
    {
      title: "Actividad: Clasificar Beneficios",
      type: "drag-drop",
      component: (
        <DragDropActivity
          title="Clasifica los Beneficios del Process Mapping"
          description="Arrastra cada beneficio a su categoría correspondiente para demostrar tu comprensión."
          items={[
            { id: "1", text: "Identificar ineficiencias", category: "analysis" },
            { id: "2", text: "Mejora continua", category: "improvement" },
            { id: "3", text: "Comunicación clara", category: "communication" },
            { id: "4", text: "Coordinación de equipo", category: "teamwork" }
          ]}
          categories={[
            { id: "analysis", title: "Análisis" },
            { id: "improvement", title: "Mejora" },
            { id: "communication", title: "Comunicación" },
            { id: "teamwork", title: "Trabajo en Equipo" }
          ]}
          onComplete={() => handleActivityComplete(1)}
        />
      )
    },
    {
      title: "Constructor de Mapas",
      type: "interactive",
      component: (
        <ProcessMapBuilder 
          title="Constructor de Mapa de Procesos"
          description="Crea un mapa de procesos paso a paso arrastrando elementos"
          targetSteps={[
            { id: "1", type: "start", text: "Inicio", x: 100, y: 100, connections: ["2"] },
            { id: "2", type: "process", text: "Proceso", x: 300, y: 100, connections: ["3"] },
            { id: "3", type: "decision", text: "¿Decisión?", x: 500, y: 100, connections: ["4"] },
            { id: "4", type: "end", text: "Fin", x: 700, y: 100, connections: [] }
          ]}
          onComplete={() => handleActivityComplete(2)} 
        />
      )
    }
  ];

  const nextLesson = () => {
    // Navegación a la siguiente lección
    navigate(`/platform/courses/${courseId}/modules/${moduleId}/lessons/${parseInt(lessonId!) + 1}`);
  };

  const previousLesson = () => {
    // Navegación a la lección anterior
    navigate(`/platform/courses/${courseId}/modules/${moduleId}/lessons/${parseInt(lessonId!) - 1}`);
  };

  const backToModule = () => {
    navigate(`/platform/courses/${courseId}/modules/${moduleId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header de navegación */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={backToModule}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
                <span>Módulo 2</span>
              </button>
              
              <div className="text-sm text-gray-500">
                <span>Lección I: Qué es un mapa de procesos</span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Tiempo de estudio */}
              <div className="flex items-center space-x-2 text-gray-600">
                <ClockIcon className="h-5 w-5" />
                <span className="text-sm">{formatTime(timeSpent)}</span>
              </div>

              {/* Progreso general */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Progreso:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                    style={{ width: `${lessonProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(lessonProgress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar de navegación */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Contenido de la Lección</h3>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentActivity(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      currentActivity === index
                        ? 'bg-blue-50 border border-blue-200 text-blue-800'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{activity.title}</span>
                      {completedActivities.has(index) && (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Estadísticas de progreso */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">Tu Progreso</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Actividades completadas:</span>
                    <span className="font-medium">
                      {completedActivities.size}/{activities.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tiempo de estudio:</span>
                    <span className="font-medium">{formatTime(timeSpent)}</span>
                  </div>

                  {lessonProgress === 100 && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <StarIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          ¡Lección Completada!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="col-span-9">
            <motion.div
              key={currentActivity}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activities[currentActivity].component}
            </motion.div>

            {/* Navegación entre lecciones */}
            {lessonProgress === 100 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 bg-white rounded-lg shadow-sm border p-6"
              >
                <h3 className="font-semibold text-gray-800 mb-4">¿Qué sigue?</h3>
                <div className="flex justify-between items-center">
                  <button
                    onClick={previousLesson}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                    <span>Lección Anterior</span>
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Próxima lección:</p>
                    <p className="font-medium text-gray-800">Lección II: Tipos de Procesos</p>
                  </div>

                  <button
                    onClick={nextLesson}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Siguiente Lección</span>
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveLessonView;
