/**
 * Barra de progreso para lecciones individuales
 */
import React from 'react';
import { CheckCircle, Clock, PlayCircle, BookOpen } from 'lucide-react';
import { ProgressStatus } from '../../types/progress';

interface LessonProgressBarProps {
  lessonId: string;
  title: string;
  progress_percentage: number;
  status: ProgressStatus;
  time_spent?: number;
  content_type?: string;
  completed_at?: string;
  onClick?: () => void;
  showDetails?: boolean;
}

const LessonProgressBar: React.FC<LessonProgressBarProps> = ({
  lessonId,
  title,
  progress_percentage,
  status,
  time_spent = 0,
  content_type = 'video',
  completed_at,
  onClick,
  showDetails = true
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case ProgressStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case ProgressStatus.IN_PROGRESS:
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case ProgressStatus.NOT_STARTED:
      default:
        return <BookOpen className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case ProgressStatus.COMPLETED:
        return 'bg-green-500';
      case ProgressStatus.IN_PROGRESS:
        return 'bg-blue-500';
      case ProgressStatus.NOT_STARTED:
      default:
        return 'bg-gray-300';
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatCompletedDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-4 
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
              {title}
            </h4>
            {showDetails && (
              <p className="text-xs text-gray-500 capitalize">
                {content_type} • {status.replace('_', ' ').toLowerCase()}
              </p>
            )}
          </div>
        </div>
        
        {status === ProgressStatus.COMPLETED && completed_at && (
          <span className="text-xs text-gray-500">
            {formatCompletedDate(completed_at)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Progreso</span>
          <span className="text-xs font-medium text-gray-900">
            {Math.round(progress_percentage)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${Math.min(progress_percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Details */}
      {showDetails && time_spent > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatTime(time_spent)} estudiado</span>
          </div>
          
          {status === ProgressStatus.IN_PROGRESS && (
            <span className="text-blue-600 font-medium">
              Continuar
            </span>
          )}
          
          {status === ProgressStatus.NOT_STARTED && (
            <span className="text-gray-600 font-medium">
              Comenzar
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonProgressBar;
