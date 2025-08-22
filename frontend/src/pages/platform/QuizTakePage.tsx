/**
 * QuizTakePage - Interfaz para que los estudiantes tomen quizzes
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon,
  BookOpenIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { quizService, Quiz, Question, QuizAttempt, QuizAnswer } from '../../services/quizService';

interface TimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ timeLimit, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // Convert to seconds

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeLeft / (timeLimit * 60)) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`flex items-center space-x-2 ${getTimeColor()}`}>
      <ClockIcon className="h-5 w-5" />
      <span className="font-mono text-lg font-semibold">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

const QuizTakePage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string[] }>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (quizId) {
      loadQuizAndStartAttempt();
    }
  }, [quizId]);

  const loadQuizAndStartAttempt = async () => {
    try {
      setLoading(true);
      const quizData = await quizService.getQuiz(quizId!);
      setQuiz(quizData);

      // Start quiz attempt
      const attemptData = await quizService.startQuizAttempt(quizId!);
      setAttempt(attemptData);
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Error al cargar el quiz');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: Array.isArray(answer) ? answer : [answer]
    }));
  };

  const toggleQuestionFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleTimeUp = useCallback(() => {
    alert('¡Tiempo agotado! El quiz se enviará automáticamente.');
    submitQuiz();
  }, []);

  const submitQuiz = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // Format answers for submission
      const formattedAnswers: QuizAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer_text: answer.join(', '),
        selected_options: answer
      }));

      await quizService.submitQuizAttempt(attempt!.id, formattedAnswers);
      
      if (quiz?.show_results) {
        loadResults();
      } else {
        navigate(`/platform/courses/${quiz?.course_id}`, {
          state: { message: 'Quiz enviado exitosamente' }
        });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error al enviar el quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadResults = async () => {
    try {
      const results = await quizService.getQuizAttempt(attempt!.id);
      setAttempt(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const renderQuestion = (question: Question) => {
    const questionAnswers = answers[question.id] || [];

    return (
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                Pregunta {currentQuestionIndex + 1} de {quiz?.questions?.length}
              </span>
              <span className="text-sm text-gray-500">
                {question.points} {question.points === 1 ? 'punto' : 'puntos'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {question.text}
            </h2>
          </div>
          <button
            onClick={() => toggleQuestionFlag(question.id)}
            className={`p-2 rounded-lg transition-colors ${
              flaggedQuestions.has(question.id)
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
            title={flaggedQuestions.has(question.id) ? 'Quitar marca' : 'Marcar para revisar'}
          >
            <FlagIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Question Options */}
        <div className="space-y-3">
          {question.type === 'multiple_choice' && (
            <div className="space-y-3">
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    questionAnswers.includes(option)
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={questionAnswers.includes(option)}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'multiple_select' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">Selecciona todas las opciones correctas:</p>
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    questionAnswers.includes(option)
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={questionAnswers.includes(option)}
                    onChange={(e) => {
                      const newAnswers = e.target.checked
                        ? [...questionAnswers, option]
                        : questionAnswers.filter(a => a !== option);
                      handleAnswerChange(question.id, newAnswers);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'true_false' && (
            <div className="space-y-3">
              {['Verdadero', 'Falso'].map((option) => (
                <label
                  key={option}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    questionAnswers.includes(option)
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={questionAnswers.includes(option)}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-900 font-medium">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'short_answer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu respuesta:
              </label>
              <textarea
                value={questionAnswers[0] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Question Explanation (if available) */}
        {question.explanation && showResults && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-3">
              <LightBulbIcon className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Explicación</h4>
                <p className="text-green-800">{question.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!attempt || !quiz) return null;

    const passed = (attempt.score || 0) >= quiz.passing_score;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Header */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed ? (
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            ) : (
              <XCircleIcon className="h-10 w-10 text-red-600" />
            )}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {passed ? '¡Felicitaciones!' : 'Quiz Completado'}
          </h1>
          <p className={`text-xl mb-6 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? 'Has aprobado el quiz exitosamente' : 'No has alcanzado el puntaje mínimo requerido'}
          </p>

          {/* Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold mb-2 ${
                passed ? 'text-green-600' : 'text-red-600'
              }`}>
                {attempt.score?.toFixed(1)}%
              </div>
              <div className="text-gray-600 font-medium">Tu Puntaje</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {quiz.passing_score}%
              </div>
              <div className="text-gray-600 font-medium">Puntaje Mínimo</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {attempt.answers?.length || 0}/{quiz.questions?.length || 0}
              </div>
              <div className="text-gray-600 font-medium">Preguntas Respondidas</div>
            </div>
          </div>
        </div>

        {/* Performance Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Rendimiento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(((attempt.score || 0) / 100) * (quiz.questions?.length || 0))}
              </div>
              <div className="text-sm text-blue-800">Respuestas Correctas</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {attempt.time_spent ? Math.round(attempt.time_spent / 60) : 0}
              </div>
              <div className="text-sm text-gray-800">Minutos Utilizados</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {flaggedQuestions.size}
              </div>
              <div className="text-sm text-yellow-800">Preguntas Marcadas</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {attempt.attempt_number || 1}
              </div>
              <div className="text-sm text-purple-800">Intento Número</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate(`/platform/courses/${quiz.course_id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
          >
            <BookOpenIcon className="h-5 w-5" />
            <span>Volver al Curso</span>
          </button>
          {quiz.allow_review && (
            <button
              onClick={() => setShowResults(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Revisar Respuestas
            </button>
          )}
          {(attempt.attempt_number || 1) < quiz.max_attempts && !passed && (
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Intentar de Nuevo
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz no encontrado</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Regresar
        </button>
      </div>
    );
  }

  if (showResults) {
    return renderResults();
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / (quiz.questions?.length || 1)) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600 mt-1">{quiz.description}</p>
            </div>
          </div>
          {quiz.time_limit_minutes > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <Timer
                timeLimit={quiz.time_limit_minutes}
                onTimeUp={handleTimeUp}
                isActive={!showResults}
              />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Pregunta {currentQuestionIndex + 1} de {quiz.questions?.length}</span>
          <span>{Math.round(progress)}% completado</span>
        </div>

        {/* Instructions */}
        {quiz.instructions && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-3">
              <LightBulbIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Instrucciones</h3>
                <p className="text-blue-800">{quiz.instructions}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {currentQuestion && renderQuestion(currentQuestion)}
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Anterior</span>
          </button>

          {/* Question Navigator */}
          <div className="flex items-center space-x-2 overflow-x-auto max-w-md">
            {quiz.questions?.map((question, index) => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : answers[question.id]?.length > 0
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : flaggedQuestions.has(question.id)
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={`Pregunta ${index + 1}${answers[question.id]?.length > 0 ? ' (Respondida)' : ''}${flaggedQuestions.has(question.id) ? ' (Marcada)' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === (quiz.questions?.length || 0) - 1 ? (
            <button
              onClick={submitQuiz}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Quiz'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
            >
              <span>Siguiente</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTakePage;