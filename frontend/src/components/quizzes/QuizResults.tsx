/**
 * QuizResults - Muestra los resultados del quiz con retroalimentación detallada
 */
import React from 'react';
import { QuizResultsProps, QuestionType } from '../../types/quiz';
import quizService from '../../services/quizService';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  TrophyIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  attempt,
  onRetake,
  onClose,
  onNavigateBack
}) => {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 border-green-300';
    if (percentage >= 70) return 'bg-blue-100 border-blue-300';
    if (percentage >= 50) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const getGradeEmoji = (percentage: number) => {
    if (percentage >= 95) return '🏆';
    if (percentage >= 90) return '🥇';
    if (percentage >= 80) return '🥈';
    if (percentage >= 70) return '🥉';
    if (percentage >= 60) return '👍';
    return '📚';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = (percentage: number, isPassing: boolean) => {
    if (percentage >= 95) {
      return {
        title: '¡Excelente trabajo!',
        message: 'Has demostrado un dominio excepcional del tema. ¡Felicitaciones!',
        color: 'text-green-700'
      };
    }
    if (percentage >= 85) {
      return {
        title: '¡Muy bien hecho!',
        message: 'Tienes un muy buen entendimiento del material.',
        color: 'text-green-700'
      };
    }
    if (percentage >= 70) {
      return {
        title: isPassing ? '¡Buen trabajo!' : 'Resultado aceptable',
        message: isPassing 
          ? 'Has aprobado satisfactoriamente. Sigue así!' 
          : 'Estás cerca de aprobar. Revisa algunos conceptos y vuelve a intentarlo.',
        color: isPassing ? 'text-blue-700' : 'text-yellow-700'
      };
    }
    if (percentage >= 50) {
      return {
        title: 'Puedes mejorar',
        message: 'Considera revisar el material y practicar más antes del siguiente intento.',
        color: 'text-yellow-700'
      };
    }
    return {
      title: 'Necesitas más práctica',
      message: 'Te recomendamos repasar el material del curso antes de volver a intentarlo.',
      color: 'text-red-700'
    };
  };

  const getQuestionFeedback = (questionId: string) => {
    const answer = attempt.answers.find(a => a.question_id === questionId);
    const question = quiz.questions.find(q => q.id === questionId);
    
    if (!answer || !question) return null;

    return {
      question,
      answer,
      isCorrect: answer.is_correct || false,
      pointsEarned: answer.points_earned,
      timeSpent: answer.time_spent
    };
  };

  const correctAnswers = attempt.answers.filter(a => a.is_correct).length;
  const totalQuestions = quiz.questions.length;
  const performance = getPerformanceMessage(attempt.score_percentage, attempt.is_passing);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header con resultado principal */}
        <div className={`rounded-lg border-2 p-8 mb-8 ${getScoreBgColor(attempt.score_percentage)}`}>
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="text-6xl mr-4">{getGradeEmoji(attempt.score_percentage)}</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Quiz Completado
                </h1>
                <p className="text-lg text-gray-700">{quiz.title}</p>
              </div>
            </div>

            {/* Puntaje principal */}
            <div className="mb-6">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(attempt.score_percentage)}`}>
                {Math.round(attempt.score_percentage)}%
              </div>
              <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1 text-green-600" />
                  {correctAnswers} de {totalQuestions} correctas
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {formatTime(attempt.time_spent)}
                </div>
                <div className="flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-1" />
                  {attempt.points_earned.toFixed(1)} / {attempt.total_points} puntos
                </div>
              </div>
            </div>

            {/* Estado de aprobación */}
            <div className="mb-6">
              {attempt.is_passing ? (
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <TrophyIcon className="h-5 w-5 mr-2" />
                  <span className="font-semibold">¡Aprobado!</span>
                </div>
              ) : (
                <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full">
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  <span className="font-semibold">No Aprobado</span>
                  <span className="ml-2 text-sm">
                    (Mínimo: {quiz.config.passing_score}%)
                  </span>
                </div>
              )}
            </div>

            {/* Mensaje de retroalimentación */}
            <div className={`text-center ${performance.color}`}>
              <h2 className="text-xl font-semibold mb-2">{performance.title}</h2>
              <p className="text-base">{performance.message}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {Math.round((correctAnswers / totalQuestions) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Precisión</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatTime(attempt.time_spent)}
            </div>
            <div className="text-sm text-gray-600">Tiempo total</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {attempt.attempt_number}
            </div>
            <div className="text-sm text-gray-600">
              {attempt.attempt_number === 1 ? 'Primer intento' : `Intento #${attempt.attempt_number}`}
            </div>
          </div>
        </div>

        {/* Revisión de preguntas */}
        {quiz.config.show_correct_answers && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Revisión de Preguntas
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {quiz.questions.map((question, index) => {
                const feedback = getQuestionFeedback(question.id);
                if (!feedback) return null;

                return (
                  <div key={question.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-500 mr-3">
                            Pregunta {index + 1}
                          </span>
                          {feedback.isCorrect ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Correcta</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Incorrecta</span>
                            </div>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-2">
                          {question.title}
                        </h4>
                        
                        {question.content && (
                          <div 
                            className="text-sm text-gray-600 mb-3 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: question.content }}
                          />
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {feedback.pointsEarned.toFixed(1)} / {question.points} pts
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(feedback.timeSpent)}
                        </div>
                      </div>
                    </div>

                    {/* Mostrar respuesta del usuario si es incorrecta */}
                    {!feedback.isCorrect && question.type !== QuestionType.ESSAY && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Tu respuesta:</span>
                          {typeof feedback.answer.answer === 'string' ? (
                            <span className="ml-2">{feedback.answer.answer}</span>
                          ) : (
                            <span className="ml-2">{JSON.stringify(feedback.answer.answer)}</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Mostrar explicación si está disponible */}
                    {question.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Explicación:</span>
                          <span className="ml-2">{question.explanation}</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex space-x-4 justify-center">
          {onRetake && (
            <button
              onClick={onRetake}
              className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Intentar Nuevamente
            </button>
          )}
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Regresar al Curso
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cerrar
            </button>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-3">Información del Quiz</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Estado del intento:</span> {quizService.getStatusLabel(attempt.status)}
            </div>
            <div>
              <span className="font-medium">Enviado:</span> {
                attempt.submitted_at 
                  ? new Date(attempt.submitted_at).toLocaleString('es-ES') 
                  : 'No enviado'
              }
            </div>
            {quiz.config.max_attempts && (
              <div>
                <span className="font-medium">Intentos permitidos:</span> {quiz.config.max_attempts}
              </div>
            )}
            {quiz.config.time_limit && (
              <div>
                <span className="font-medium">Límite de tiempo:</span> {quiz.config.time_limit} minutos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
