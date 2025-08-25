/**
 * QuizTaker - Componente principal para tomar quizzes
 * Maneja el estado del quiz, navegación entre preguntas, timer, y envío de respuestas
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Quiz, Question, StudentAnswer, AttemptStatus, 
  QuizTakerProps, QuizState 
} from '../../types/quiz';
import { quizService } from '../../services/quizService';
import { analyticsService } from '../../services/analyticsService';
import { useAnalytics } from '../../hooks/useAnalytics';
import QuestionRenderer from './QuestionRenderer';
import QuizProgress from './QuizProgress';
import QuizTimer from './QuizTimer';
import QuizResults from './QuizResults';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const QuizTaker: React.FC<QuizTakerProps> = ({ 
  quizId, 
  onComplete, 
  onError,
  onNavigateBack 
}) => {
  const navigate = useNavigate();
  const { trackActivity } = useAnalytics();
  
  const [state, setState] = useState<QuizState>({
    quiz: null,
    attempt: null,
    currentQuestionIndex: 0,
    answers: new Map(),
    isSubmitting: false,
    showResults: false
  });

  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar quiz al montar el componente
  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  // Auto-guardar respuestas cada 30 segundos
  useEffect(() => {
    if (!hasUnsavedChanges || !state.attempt) return;

    const autoSaveInterval = setInterval(() => {
      saveCurrentAnswer();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, state.attempt]);

  // Prevenir cierre accidental
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.attempt?.status === AttemptStatus.IN_PROGRESS && hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.attempt?.status, hasUnsavedChanges]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const quiz = await quizService.getQuiz(quizId);
      
      if (!quiz.is_available) {
        throw new Error('Este quiz no está disponible actualmente');
      }

      setState(prev => ({ ...prev, quiz }));
      
      // Iniciar intento automáticamente
      await startAttempt(quiz);
      
    } catch (error: any) {
      handleError(error.message || 'Error al cargar el quiz');
    } finally {
      setLoading(false);
    }
  };

  const startAttempt = async (quiz: Quiz) => {
    try {
      const attempt = await quizService.startQuizAttempt(quizId);
      
      setState(prev => ({ 
        ...prev, 
        attempt,
        answers: new Map()
      }));

      analyticsService.trackEvent('quiz_started', {
        quiz_id: quizId,
        quiz_title: quiz.title,
        attempt_id: attempt.id
      });

    } catch (error: any) {
      handleError(error.message || 'Error al iniciar el quiz');
    }
  };

  const handleAnswerChange = useCallback((answer: any) => {
    if (!state.quiz || !state.attempt) return;

    const currentQuestion = state.quiz.questions[state.currentQuestionIndex];
    
    setState(prev => ({
      ...prev,
      answers: new Map(prev.answers).set(currentQuestion.id, answer)
    }));

    setHasUnsavedChanges(true);
  }, [state.quiz, state.attempt, state.currentQuestionIndex]);

  const saveCurrentAnswer = async () => {
    if (!state.quiz || !state.attempt || !hasUnsavedChanges) return;

    const currentQuestion = state.quiz.questions[state.currentQuestionIndex];
    const answer = state.answers.get(currentQuestion.id);
    
    if (answer === undefined) return;

    try {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      
      const answerData: StudentAnswer = {
        question_id: currentQuestion.id,
        answer,
        time_spent: timeSpent,
        created_at: new Date().toISOString()
      };

      await quizService.submitAnswer(state.attempt.id, answerData);
      setHasUnsavedChanges(false);
      
    } catch (error: any) {
      console.error('Error saving answer:', error);
      // No mostrar error al usuario para no interrumpir el flujo
    }
  };

  const navigateToQuestion = async (index: number) => {
    if (!state.quiz || index < 0 || index >= state.quiz.questions.length) return;

    // Guardar respuesta actual antes de navegar
    await saveCurrentAnswer();

    setState(prev => ({ 
      ...prev, 
      currentQuestionIndex: index 
    }));
    
    setQuestionStartTime(Date.now());
  };

  const goToPreviousQuestion = () => {
    navigateToQuestion(state.currentQuestionIndex - 1);
  };

  const goToNextQuestion = () => {
    navigateToQuestion(state.currentQuestionIndex + 1);
  };

  const submitQuiz = async () => {
    if (!state.attempt || state.isSubmitting) return;

    // Confirmar envío
    const confirmSubmit = window.confirm(
      '¿Estás seguro de que quieres enviar el quiz? No podrás hacer cambios después.'
    );
    
    if (!confirmSubmit) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Guardar respuesta actual
      await saveCurrentAnswer();
      
      // Enviar quiz
      const completedAttempt = await quizService.submitQuizAttempt(state.attempt.id);
      
      setState(prev => ({ 
        ...prev, 
        attempt: completedAttempt,
        showResults: true,
        isSubmitting: false
      }));

      analyticsService.trackEvent('quiz_completed', {
        quiz_id: quizId,
        attempt_id: state.attempt.id,
        score: completedAttempt.percentage,
        is_passing: completedAttempt.is_passing,
        time_spent: completedAttempt.time_spent
      });

      onComplete?.(completedAttempt);
      
    } catch (error: any) {
      setState(prev => ({ ...prev, isSubmitting: false }));
      handleError(error.message || 'Error al enviar el quiz');
    }
  };

  const handleTimeUp = async () => {
    if (!state.attempt) return;
    
    alert('Se agotó el tiempo para completar el quiz. Se enviará automáticamente.');
    await submitQuiz();
  };

  const handleRetake = async () => {
    if (!state.quiz) return;
    
    setState(prev => ({
      ...prev,
      attempt: null,
      currentQuestionIndex: 0,
      answers: new Map(),
      showResults: false,
      isSubmitting: false
    }));

    await startAttempt(state.quiz);
  };

  const handleError = (message: string) => {
    setState(prev => ({ ...prev, error: message }));
    onError?.(message);
  };

  const getAnsweredQuestions = () => {
    return Array.from(state.answers.keys()).length;
  };

  const getCurrentQuestion = (): Question | null => {
    if (!state.quiz || state.currentQuestionIndex >= state.quiz.questions.length) {
      return null;
    }
    return state.quiz.questions[state.currentQuestionIndex];
  };

  const canGoNext = () => {
    return state.currentQuestionIndex < (state.quiz?.questions.length || 0) - 1;
  };

  const canGoPrevious = () => {
    return state.currentQuestionIndex > 0;
  };

  const isLastQuestion = () => {
    return state.currentQuestionIndex === (state.quiz?.questions.length || 0) - 1;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="flex items-center text-red-600 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-700 mb-6">{state.error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Results state
  if (state.showResults && state.quiz && state.attempt) {
    return (
      <QuizResults
        quiz={state.quiz}
        attempt={state.attempt}
        onRetake={state.quiz.config.allow_retakes ? handleRetake : undefined}
        onClose={() => navigate(-1)}
        onNavigateBack={onNavigateBack}
      />
    );
  }

  // Main quiz interface
  const currentQuestion = getCurrentQuestion();
  if (!state.quiz || !state.attempt || !currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con progreso y timer */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {state.quiz.title}
            </h1>
            
            {state.attempt.time_remaining && (
              <div className="flex items-center text-orange-600">
                <ClockIcon className="h-5 w-5 mr-1" />
                <QuizTimer
                  timeRemaining={state.attempt.time_remaining}
                  onTimeUp={handleTimeUp}
                  showWarnings
                />
              </div>
            )}
          </div>
          
          <QuizProgress
            currentQuestion={state.currentQuestionIndex + 1}
            totalQuestions={state.quiz.questions.length}
            answeredQuestions={getAnsweredQuestions()}
            timeRemaining={state.attempt.time_remaining}
            duration={state.quiz.config.time_limit}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Información de la pregunta */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">
                Pregunta {state.currentQuestionIndex + 1} de {state.quiz.questions.length}
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'punto' : 'puntos'}
              </span>
            </div>
            
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {currentQuestion.title}
            </h2>
            
            {currentQuestion.content && (
              <div 
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: currentQuestion.content }}
              />
            )}
          </div>

          {/* Renderizador de pregunta */}
          <div className="px-6 py-6">
            <QuestionRenderer
              question={currentQuestion}
              answer={state.answers.get(currentQuestion.id)}
              onAnswerChange={handleAnswerChange}
              disabled={state.isSubmitting}
              timeRemaining={currentQuestion.time_limit}
            />
          </div>

          {/* Navegación */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={goToPreviousQuestion}
              disabled={!canGoPrevious() || state.isSubmitting}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Anterior
            </button>

            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 flex items-center">
                  <div className="h-2 w-2 bg-amber-500 rounded-full mr-2"></div>
                  Cambios no guardados
                </span>
              )}
              
              {isLastQuestion() ? (
                <button
                  onClick={submitQuiz}
                  disabled={state.isSubmitting}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {state.isSubmitting ? 'Enviando...' : 'Enviar Quiz'}
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  disabled={!canGoNext() || state.isSubmitting}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        {state.quiz.instructions && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instrucciones</h3>
            <div 
              className="text-blue-800 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: state.quiz.instructions }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizTaker;
