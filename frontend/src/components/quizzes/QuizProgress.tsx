/**
 * QuizProgress - Componente que muestra el progreso del quiz
 */
import React from 'react';
import { QuizProgressProps } from '../../types/quiz';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  timeRemaining,
  duration
}) => {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  const answeredPercentage = (answeredQuestions / totalQuestions) * 100;
  
  const getProgressColor = () => {
    if (progressPercentage >= 80) return 'bg-green-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    if (progressPercentage >= 25) return 'bg-yellow-500';
    return 'bg-primary-500';
  };

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return null;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds?: number) => {
    if (!seconds || !duration) return 'text-gray-600';
    
    const percentageRemaining = (seconds / (duration * 60)) * 100;
    
    if (percentageRemaining <= 10) return 'text-red-600';
    if (percentageRemaining <= 25) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-3">
      {/* Barra de progreso principal */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <span className="font-medium text-gray-700">
            Pregunta {currentQuestion} de {totalQuestions}
          </span>
          
          <div className="flex items-center text-green-600">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            <span>{answeredQuestions} respondidas</span>
          </div>
        </div>

        {timeRemaining && (
          <div className={`flex items-center ${getTimeColor(timeRemaining)}`}>
            <ClockIcon className="h-4 w-4 mr-1" />
            <span className="font-medium">
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Barra de progreso visual */}
      <div className="relative">
        {/* Fondo de la barra */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          {/* Progreso de preguntas respondidas */}
          <div 
            className="bg-green-200 h-2 rounded-full transition-all duration-300"
            style={{ width: `${answeredPercentage}%` }}
          />
          
          {/* Progreso actual de navegación */}
          <div 
            className={`absolute top-0 h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Indicadores de preguntas */}
        <div className="flex justify-between mt-1">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const questionNumber = index + 1;
            const isCurrent = questionNumber === currentQuestion;
            const isAnswered = questionNumber <= answeredQuestions;
            const isPast = questionNumber < currentQuestion;

            return (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  isCurrent
                    ? 'bg-primary-600 scale-125 ring-2 ring-primary-200'
                    : isAnswered
                      ? 'bg-green-500'
                      : isPast
                        ? 'bg-gray-400'
                        : 'bg-gray-300'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Información adicional */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {Math.round(progressPercentage)}% completado
        </span>
        
        {duration && timeRemaining && (
          <span>
            {Math.round((timeRemaining / (duration * 60)) * 100)}% tiempo restante
          </span>
        )}
      </div>
    </div>
  );
};

export default QuizProgress;
