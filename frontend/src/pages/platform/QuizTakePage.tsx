/**
 * QuizTakePage - Página wrapper para el componente QuizTaker
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import quizService from '../../services/quizService';
import QuizTaker from '../../components/quizzes/QuizTaker';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { Quiz } from '../../types/quiz';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';


const QuizTakePage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackActivity } = useAnalytics();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    } else {
      setError('ID de quiz no válido');
      setLoading(false);
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [QuizTakePage] Loading quiz:', quizId);
      const quizData = await quizService.getQuiz(quizId!);
      setQuiz(quizData);
      
      // Track quiz start event
      trackActivity({
        activity_type: 'quiz_started',
        course_id: quizData.course_id,
        metadata: {
          quiz_id: quizId,
          quiz_title: quizData.title
        }
      });
      
      console.log('✅ [QuizTakePage] Quiz loaded:', quizData.title);
    } catch (error) {
      console.error('❌ [QuizTakePage] Error loading quiz:', error);
      setError('Error al cargar el quiz. Verifica que tienes permisos para acceder.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (attempt: any) => {
    // Track quiz completion
    trackActivity({
      activity_type: 'quiz_completed',
      course_id: quiz?.course_id,
      metadata: {
        quiz_id: quizId,
        quiz_title: quiz?.title,
        score: attempt.score_percentage,
        passed: attempt.is_passing
      }
    });

    console.log('✅ [QuizTakePage] Quiz completed:', attempt);
  };

  const handleNavigateBack = () => {
    // Use location state for better navigation
    const state = location.state as { returnTo?: string; courseId?: string; lessonId?: string } | null;
    
    if (state?.returnTo) {
      // Return to the exact page we came from
      navigate(state.returnTo);
    } else if (quiz?.course_id) {
      // Fallback to course view
      navigate(`/platform/courses/${quiz.course_id}/view`);
    } else {
      // Last resort - go back
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al cargar el quiz</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-6 flex gap-3 justify-center">
              <Button onClick={handleNavigateBack}>
                Volver al Curso
              </Button>
              <Button variant="secondary" onClick={loadQuiz}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back navigation */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNavigateBack}
                title="Volver al curso"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-muted-foreground">Evaluación del curso</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QuizTaker Component */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuizTaker
          quizId={quizId!}
          onComplete={handleQuizComplete}
          onNavigateBack={handleNavigateBack}
        />
      </div>
    </div>
  );
};

export default QuizTakePage;