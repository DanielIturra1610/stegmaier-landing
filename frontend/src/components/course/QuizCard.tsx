/**
 * QuizCard - Componente para mostrar quizzes dentro de lecciones
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { Quiz } from '../../types/quiz';

interface QuizCardProps {
  quiz: Quiz;
  userAttempts?: number;
  bestScore?: number;
  canTake?: boolean;
  lastAttemptPassed?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  userAttempts = 0,
  bestScore,
  canTake = true,
  lastAttemptPassed
}) => {
  const navigate = useNavigate();

  const handleTakeQuiz = () => {
    // Navigate to quiz taking page
    navigate(`/platform/quiz/take/${quiz.id}`, {
      state: { 
        returnTo: window.location.pathname,
        courseId: quiz.course_id,
        lessonId: quiz.lesson_id 
      }
    });
  };

  const getStatusIcon = () => {
    if (lastAttemptPassed) {
      return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
    }
    if (userAttempts > 0 && !lastAttemptPassed) {
      return <XCircleIcon className="h-6 w-6 text-red-600" />;
    }
    return <PlayIcon className="h-6 w-6 text-blue-600" />;
  };

  const getStatusColor = () => {
    if (lastAttemptPassed) return 'border-green-200 bg-green-50';
    if (userAttempts > 0 && !lastAttemptPassed) return 'border-red-200 bg-red-50';
    return 'border-blue-200 bg-blue-50';
  };

  const getButtonStyle = () => {
    if (!canTake) return 'bg-gray-400 cursor-not-allowed';
    if (lastAttemptPassed) return 'bg-green-600 hover:bg-green-700';
    if (userAttempts > 0) return 'bg-orange-600 hover:bg-orange-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const getButtonText = () => {
    if (!canTake) return 'Quiz Bloqueado';
    if (lastAttemptPassed) return 'Revisar Quiz';
    if (userAttempts > 0) return 'Reintentar';
    return 'Comenzar Quiz';
  };

  return (
    <div className={`border-2 rounded-lg p-6 transition-all hover:shadow-lg ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
            <p className="text-sm text-gray-600">{quiz.description}</p>
          </div>
        </div>
        {lastAttemptPassed && (
          <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
            <TrophyIcon className="h-4 w-4" />
            <span>Aprobado</span>
          </div>
        )}
      </div>

      {/* Quiz Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {quiz.questions?.length || 0}
          </div>
          <div className="text-xs text-gray-600">Preguntas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {quiz.time_limit_minutes > 0 ? `${quiz.time_limit_minutes}m` : '∞'}
          </div>
          <div className="text-xs text-gray-600">Tiempo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {quiz.passing_score}%
          </div>
          <div className="text-xs text-gray-600">Puntaje Mín.</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {userAttempts}/{quiz.max_attempts}
          </div>
          <div className="text-xs text-gray-600">Intentos</div>
        </div>
      </div>

      {/* Score Display */}
      {bestScore !== undefined && (
        <div className="bg-white rounded-lg p-4 mb-4 border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Mejor Puntaje:</span>
            <span className={`text-lg font-bold ${
              bestScore >= quiz.passing_score ? 'text-green-600' : 'text-red-600'
            }`}>
              {bestScore.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Instructions Preview */}
      {quiz.instructions && (
        <div className="bg-white rounded-lg p-4 mb-4 border">
          <div className="flex items-start space-x-2">
            <BookOpenIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Instrucciones:</h4>
              <p className="text-sm text-gray-700 line-clamp-2">{quiz.instructions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleTakeQuiz}
        disabled={!canTake}
        className={`w-full text-white px-6 py-3 rounded-lg font-medium transition-colors ${getButtonStyle()}`}
      >
        {getButtonText()}
      </button>

      {/* Attempts Warning */}
      {userAttempts >= quiz.max_attempts && !lastAttemptPassed && (
        <div className="mt-3 text-center">
          <p className="text-sm text-red-600">
            Has agotado todos los intentos disponibles
          </p>
        </div>
      )}

      {/* Time Limit Warning */}
      {quiz.time_limit_minutes > 0 && canTake && userAttempts === 0 && (
        <div className="mt-3 flex items-center justify-center text-sm text-orange-600">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>Tiempo límite: {quiz.time_limit_minutes} minutos</span>
        </div>
      )}
    </div>
  );
};

export default QuizCard;