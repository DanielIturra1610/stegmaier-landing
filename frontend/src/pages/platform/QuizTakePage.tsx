/**
 * QuizTakePage - Página wrapper para el componente QuizTaker
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { quizService } from '../../services/quizService';
import QuizTaker from '../../components/quizzes/QuizTaker';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { Quiz } from '../../types/quiz';


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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el quiz</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleNavigateBack}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al Curso
            </button>
            <button
              onClick={loadQuiz}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
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
              <button
                onClick={handleNavigateBack}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                title="Volver al curso"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">Evaluación del curso</p>
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