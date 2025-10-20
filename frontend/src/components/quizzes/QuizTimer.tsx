/**
 * QuizTimer - Componente de timer para quizzes con alertas visuales
 */
import React, { useState, useEffect } from 'react';
import { QuizTimerProps } from '../../types/quiz';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const QuizTimer: React.FC<QuizTimerProps> = ({
  timeRemaining,
  onTimeUp,
  showWarnings = true
}) => {
  const [currentTime, setCurrentTime] = useState(timeRemaining);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [hasShownCritical, setHasShownCritical] = useState(false);

  useEffect(() => {
    setCurrentTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (currentTime <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev - 1;
        
        // Mostrar advertencias
        if (showWarnings) {
          // Advertencia a los 5 minutos (300 segundos)
          if (newTime <= 300 && newTime > 60 && !hasShownWarning) {
            setHasShownWarning(true);
            if (window.Notification && Notification.permission === 'granted') {
              new Notification('Quiz Timer', {
                body: '⏰ Te quedan 5 minutos para completar el quiz',
                icon: '/favicon.ico'
              });
            }
          }
          
          // Advertencia crítica al minuto
          if (newTime <= 60 && !hasShownCritical) {
            setHasShownCritical(true);
            if (window.Notification && Notification.permission === 'granted') {
              new Notification('Quiz Timer - ¡Urgente!', {
                body: '🚨 ¡Solo queda 1 minuto! Finaliza el quiz pronto',
                icon: '/favicon.ico'
              });
            }
          }
        }

        if (newTime <= 0) {
          onTimeUp();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTime, onTimeUp, showWarnings, hasShownWarning, hasShownCritical]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (currentTime <= 60) return 'text-red-600 animate-pulse';
    if (currentTime <= 300) return 'text-orange-600';
    if (currentTime <= 900) return 'text-yellow-600';
    return 'text-gray-700';
  };

  const getBackgroundColor = (): string => {
    if (currentTime <= 60) return 'bg-red-50 border-red-200';
    if (currentTime <= 300) return 'bg-orange-50 border-orange-200';
    if (currentTime <= 900) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  const getProgressPercentage = (): number => {
    if (timeRemaining <= 0) return 0;
    return (currentTime / timeRemaining) * 100;
  };

  const shouldShowWarningIcon = (): boolean => {
    return showWarnings && currentTime <= 300;
  };

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-lg border transition-all duration-300 ${getBackgroundColor()}`}>
      {shouldShowWarningIcon() ? (
        <ExclamationTriangleIcon className={`h-4 w-4 mr-2 ${currentTime <= 60 ? 'text-red-600 animate-bounce' : 'text-orange-600'}`} />
      ) : (
        <ClockIcon className="h-4 w-4 mr-2 text-gray-600" />
      )}
      
      <div className="flex flex-col">
        <span className={`font-mono text-sm font-semibold ${getTimerColor()}`}>
          {formatTime(currentTime)}
        </span>
        
        {/* Barra de progreso miniatura */}
        <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
          <div 
            className={`h-1 rounded-full transition-all duration-1000 ${
              currentTime <= 60 
                ? 'bg-red-500' 
                : currentTime <= 300 
                  ? 'bg-orange-500' 
                  : 'bg-green-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default QuizTimer;
