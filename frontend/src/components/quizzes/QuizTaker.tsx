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
import quizService from '../../services/quizService';
import { analyticsService } from '../../services/analyticsService';
import { useAnalytics } from '../../hooks/useAnalytics';
import QuestionRenderer from './QuestionRenderer';
import QuizProgress from './QuizProgress';
import QuizTimer from './QuizTimer';
import QuizResults from './QuizResults';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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

      await quizService.submitAnswer(state.quiz!.id, currentQuestion.id, answerData.answer);
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
      
      // Enviar quiz - Following CLAUDE.md: "Always define proper types"
      const allAnswers: StudentAnswer[] = Array.from(state.answers.entries()).map(([questionId, answer]) => ({
        question_id: questionId,
        answer,
        time_spent: 0,
        created_at: new Date().toISOString()
      }));
      const completedAttempt = await quizService.submitQuizAttempt(state.quiz!.id, allAnswers);
      
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
            <div className="mt-6">
              <Button onClick={() => navigate(-1)} className="w-full">
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
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
      <Card className="sticky top-0 z-10 rounded-none border-t-0 border-l-0 border-r-0">
        <CardHeader className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-xl">
              {state.quiz.title}
            </CardTitle>

            {state.attempt.time_remaining && (
              <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-600">
                <Clock className="h-4 w-4" />
                <QuizTimer
                  timeRemaining={state.attempt.time_remaining}
                  onTimeUp={handleTimeUp}
                  showWarnings
                />
              </Badge>
            )}
          </div>

          <QuizProgress
            currentQuestion={state.currentQuestionIndex + 1}
            totalQuestions={state.quiz.questions.length}
            answeredQuestions={getAnsweredQuestions()}
            timeRemaining={state.attempt.time_remaining}
            duration={state.quiz.config.time_limit}
          />
        </CardHeader>
      </Card>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary">
                Pregunta {state.currentQuestionIndex + 1} de {state.quiz.questions.length}
              </Badge>
              <Badge variant="outline">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'punto' : 'puntos'}
              </Badge>
            </div>

            <CardTitle className="text-lg">
              {currentQuestion.title}
            </CardTitle>

            {currentQuestion.content && (
              <div
                className="text-muted-foreground prose prose-sm max-w-none mt-2"
                dangerouslySetInnerHTML={{ __html: currentQuestion.content }}
              />
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Renderizador de pregunta */}
            <QuestionRenderer
              question={currentQuestion}
              answer={state.answers.get(currentQuestion.id)}
              onAnswerChange={handleAnswerChange}
              disabled={state.isSubmitting}
              timeRemaining={currentQuestion.time_limit}
            />

            {/* Navegación */}
            <Separator />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={!canGoPrevious() || state.isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center space-x-3">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    <div className="h-2 w-2 bg-amber-500 rounded-full mr-2"></div>
                    Cambios no guardados
                  </Badge>
                )}

                {isLastQuestion() ? (
                  <Button
                    onClick={submitQuiz}
                    disabled={state.isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {state.isSubmitting ? 'Enviando...' : 'Enviar Quiz'}
                  </Button>
                ) : (
                  <Button
                    onClick={goToNextQuestion}
                    disabled={!canGoNext() || state.isSubmitting}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones */}
        {state.quiz.instructions && (
          <Alert className="mt-6 border-l-4 border-blue-400 bg-blue-50">
            <AlertTitle className="text-blue-900">Instrucciones</AlertTitle>
            <AlertDescription asChild>
              <div
                className="text-blue-800 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: state.quiz.instructions }}
              />
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default QuizTaker;
