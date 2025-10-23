/**
 * AdminQuizForm - Formulario para crear/editar quizzes
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import quizService from '../../services/quizService';
import { Quiz, QuizCreate, Question, QuestionType, QuizStatus } from '../../types/quiz';
import { courseService } from '../../services/courseService';
import { adminService } from '../../services/adminService';

interface Course {
  id: string;
  title: string;
}

const AdminQuizForm: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = !!quizId;

  // Context parameters from URL
  const courseId = searchParams.get('courseId');
  const moduleId = searchParams.get('moduleId');
  const lessonId = searchParams.get('lessonId');
  const lessonTitle = searchParams.get('lessonTitle') ? decodeURIComponent(searchParams.get('lessonTitle')!) : '';
  const moduleTitle = searchParams.get('moduleTitle') ? decodeURIComponent(searchParams.get('moduleTitle')!) : '';

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  // Quiz form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    lesson_id: '',
    instructions: '',
    time_limit_minutes: 0,
    max_attempts: 3,
    passing_score: 70,
    shuffle_questions: false,
    show_results: true,
    allow_review: true,
    tags: [] as string[],
    status: QuizStatus.DRAFT
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: QuestionType.MULTIPLE_CHOICE,
    text: '',
    content: '',
    options: [
      { id: '1', text: '', is_correct: false, order: 0 },
      { id: '2', text: '', is_correct: false, order: 1 },
      { id: '3', text: '', is_correct: false, order: 2 },
      { id: '4', text: '', is_correct: false, order: 3 }
    ],
    correct_answers: [],
    explanation: '',
    points: 1,
    tags: []
  });

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [quizId]);

  // Initialize form with context data when creating from lesson
  useEffect(() => {
    if (!isEditing && lessonId && courseId) {
      setFormData(prev => ({
        ...prev,
        lesson_id: lessonId,
        course_id: courseId,
        title: lessonTitle ? `Quiz para ${lessonTitle}` : prev.title
      }));
    }
  }, [lessonId, courseId, lessonTitle, isEditing]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load courses
      const coursesData = await adminService.getCourses(0, 100);
      setCourses(coursesData);

      // Load quiz data if editing
      if (isEditing && quizId) {
        const quiz = await quizService.getQuiz(quizId);
        setFormData({
          title: quiz.title,
          description: quiz.description,
          course_id: quiz.course_id,
          lesson_id: quiz.lesson_id || '',
          instructions: quiz.instructions || '',
          time_limit_minutes: quiz.time_limit_minutes || quiz.config?.time_limit || 0,
          max_attempts: quiz.max_attempts || quiz.config?.max_attempts || 3,
          passing_score: quiz.passing_score || quiz.config?.passing_score || 70,
          shuffle_questions: quiz.shuffle_questions ?? quiz.config?.shuffle_questions ?? false,
          show_results: quiz.show_results ?? quiz.config?.show_correct_answers ?? true,
          allow_review: quiz.allow_review ?? quiz.config?.allow_review ?? true,
          tags: quiz.tags || [],
          status: quiz.status
        });
        setQuestions(quiz.questions || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (field: string, value: any) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addOrUpdateQuestion = () => {
    const questionText = currentQuestion.text?.trim() || currentQuestion.content?.trim();
    if (!questionText) {
      alert('El texto de la pregunta es requerido');
      return;
    }

    // Validaciones específicas por tipo de pregunta
    if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE || currentQuestion.type === QuestionType.MULTIPLE_SELECT) {
      const validOptions = Array.isArray(currentQuestion.options) ? currentQuestion.options.filter(opt => opt.text?.trim()) : [];
      if (validOptions.length < 2) {
        alert('Debes proporcionar al menos 2 opciones válidas');
        return;
      }

      // Verificar que haya al menos una opción correcta
      const correctOptions = validOptions.filter(opt => opt.is_correct);
      if (correctOptions.length === 0) {
        alert('Debes marcar al menos una opción como correcta');
        return;
      }

      // Para multiple choice, solo debe haber una opción correcta
      if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE && correctOptions.length > 1) {
        alert('Para preguntas de opción múltiple, solo una respuesta puede ser correcta');
        return;
      }

      currentQuestion.options = validOptions;
    }

    if (currentQuestion.type === QuestionType.TRUE_FALSE) {
      if (!currentQuestion.correct_answers?.length) {
        alert('Debes seleccionar Verdadero o Falso como respuesta correcta');
        return;
      }
    }

    // Para otros tipos de preguntas, correct_answers puede estar vacío (evaluación manual)

    const questionData: Question = {
      ...currentQuestion as Question,
      order: editingQuestionIndex !== null ? editingQuestionIndex + 1 : questions.length + 1
    };

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = questionData;
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
    } else {
      setQuestions([...questions, questionData]);
    }

    resetQuestionForm();
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const deleteQuestion = (index: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      setQuestions((Array.isArray(questions) ? questions : []).filter((_, i) => i !== index));
    }
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      type: QuestionType.MULTIPLE_CHOICE,
      text: '',
      content: '',
      options: [
        { id: '1', text: '', is_correct: false, order: 0 },
        { id: '2', text: '', is_correct: false, order: 1 },
        { id: '3', text: '', is_correct: false, order: 2 },
        { id: '4', text: '', is_correct: false, order: 3 }
      ],
      correct_answers: [],
      explanation: '',
      points: 1,
      tags: []
    });
    setShowQuestionForm(false);
    setEditingQuestionIndex(null);
  };

  const handleSubmit = async (status: QuizStatus = QuizStatus.DRAFT) => {
    try {
      if (!formData.title.trim() || !formData.description.trim() || !formData.course_id) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      if (status === QuizStatus.PUBLISHED && questions.length === 0) {
        alert('No puedes publicar un quiz sin preguntas');
        return;
      }

      setLoading(true);

      // 1. First, create or update questions and get their IDs
      console.log('📝 [AdminQuizForm] Creating/updating questions...');
      const questionIds: string[] = [];

      for (const question of questions) {
        try {
          // Convert frontend Question format to backend QuestionCreate format
          const questionData = {
            type: question.type,
            title: question.text?.substring(0, 50) || 'Pregunta', // Backend expects title field
            content: question.text || '', // Backend expects content field instead of text
            explanation: question.explanation || '',
            points: question.points || 1,
            time_limit: question.time_limit,
            options: question.options || [],
            correct_answers: question.correct_answers || [],
            case_sensitive: question.case_sensitive || false,
            pairs: question.pairs || [],
            tags: question.tags || [],
            difficulty: question.difficulty || 'medium'
          };

          let createdQuestion;
          if (question.id && isEditing) {
            // Update existing question
            createdQuestion = await quizService.updateQuestion(question.id, questionData);
          } else {
            // Create new question
            createdQuestion = await quizService.createQuestion(questionData);
          }

          questionIds.push(createdQuestion.id);
          console.log(`✅ [AdminQuizForm] Question processed: ${createdQuestion.id}`);
        } catch (error) {
          console.error('❌ [AdminQuizForm] Error processing question:', error);
          throw new Error(`Error al procesar pregunta: ${question.text?.substring(0, 30) || 'Sin título'}`);
        }
      }

      console.log(`📝 [AdminQuizForm] All questions processed. Question IDs: ${questionIds.join(', ')}`);

      // 2. Now create or update the quiz with question IDs
      const quizData: QuizCreate = {
        ...formData,
        questions: questionIds, // Send only question IDs
        question_pool: [],
        config: {
          shuffle_questions: formData.shuffle_questions || false,
          shuffle_answers: false,
          show_results_immediately: formData.show_results ?? true,
          show_correct_answers: formData.show_results ?? true,
          allow_review: formData.allow_review ?? true,
          allow_retakes: true,
          max_attempts: formData.max_attempts && formData.max_attempts >= 1 && formData.max_attempts <= 10 ? formData.max_attempts : null,
          passing_score: Number(formData.passing_score) || 70.0,
          time_limit: formData.time_limit_minutes && formData.time_limit_minutes >= 1 && formData.time_limit_minutes <= 600 ? formData.time_limit_minutes : null,
          available_from: null,
          available_until: null,
          require_proctor: false,
          randomize_from_pool: false,
          questions_per_attempt: null
        },
        estimatedDuration: formData.time_limit_minutes || 30
      };

      if (isEditing && quizId) {
        // For editing, use QuizUpdate which includes questions
        const updateData = {
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          questions: questionIds, // Include question IDs in update
          question_pool: [],
          config: quizData.config,
          estimated_duration: quizData.estimated_duration,
          status: status
        };
        await quizService.updateQuiz(quizId, updateData);
      } else {
        // For creation
        const newQuiz = await quizService.createQuiz(quizData);
        // Si se quiere publicar directamente, actualizar el estado
        if (status === QuizStatus.PUBLISHED) {
          await quizService.updateQuiz(newQuiz.id, {
            status: QuizStatus.PUBLISHED,
            questions: questionIds
          });
        }
      }

      console.log('✅ [AdminQuizForm] Quiz saved successfully');
      navigate('/platform/admin/quizzes');
    } catch (error) {
      console.error('❌ [AdminQuizForm] Error saving quiz:', error);
      alert(`Error al guardar el quiz: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Context Information - Solo si viene desde lección/módulo */}
      {(moduleTitle || lessonTitle) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-blue-700">📁 Módulo:</span>
              <span>{moduleTitle || 'Sin especificar'}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="font-medium text-blue-700">📖 Lección:</span>
              <span>{lessonTitle || 'Sin especificar'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Details Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Información General</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título del Quiz *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="Título del quiz..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Descripción del quiz..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso *
            </label>
            <select
              value={formData.course_id}
              onChange={(e) => handleFormChange('course_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona un curso</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiempo límite (minutos)
            </label>
            <input
              type="number"
              min="0"
              value={formData.time_limit_minutes}
              onChange={(e) => handleFormChange('time_limit_minutes', parseInt(e.target.value) || 0)}
              placeholder="0 = sin límite"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máximo intentos
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_attempts}
              onChange={(e) => handleFormChange('max_attempts', parseInt(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puntaje mínimo para aprobar (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.passing_score}
              onChange={(e) => handleFormChange('passing_score', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instrucciones (opcional)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => handleFormChange('instructions', e.target.value)}
              placeholder="Instrucciones especiales para el quiz..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Configuration checkboxes */}
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.shuffle_questions}
                onChange={(e) => handleFormChange('shuffle_questions', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mezclar preguntas</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.show_results}
                onChange={(e) => handleFormChange('show_results', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mostrar resultados al finalizar</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.allow_review}
                onChange={(e) => handleFormChange('allow_review', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Permitir revisión de respuestas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Preguntas ({questions.length})
          </h2>
          <button
            onClick={() => setShowQuestionForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Agregar Pregunta</span>
          </button>
        </div>

        {/* Question Form - Simplified for space */}
        {showQuestionForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingQuestionIndex !== null ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </h3>

            <div className="space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pregunta *
                </label>
                <textarea
                  value={currentQuestion.text || currentQuestion.content || ''}
                  onChange={(e) => {
                    // Update both text and content to maintain compatibility
                    handleQuestionChange('text', e.target.value);
                    handleQuestionChange('content', e.target.value);
                  }}
                  placeholder="Escribe tu pregunta aquí..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pregunta *
                </label>
                <select
                  value={currentQuestion.type}
                  onChange={(e) => handleQuestionChange('type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={QuestionType.MULTIPLE_CHOICE}>Opción Múltiple</option>
                  <option value={QuestionType.TRUE_FALSE}>Verdadero/Falso</option>
                  <option value={QuestionType.FILL_IN_BLANK}>Completar Texto</option>
                  <option value={QuestionType.MULTIPLE_SELECT}>Selección Múltiple</option>
                  <option value={QuestionType.ESSAY}>Ensayo</option>
                </select>
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntos
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentQuestion.points}
                  onChange={(e) => handleQuestionChange('points', parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Options for Multiple Choice/Multiple Select */}
              {(currentQuestion.type === QuestionType.MULTIPLE_CHOICE || currentQuestion.type === QuestionType.MULTIPLE_SELECT) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opciones de Respuesta *
                  </label>
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type={currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'radio' : 'checkbox'}
                          name="correct_answer"
                          checked={option.is_correct}
                          onChange={(e) => {
                            const updatedOptions = [...(currentQuestion.options || [])];
                            if (currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
                              // Para múltiple choice, solo una puede ser correcta
                              updatedOptions.forEach((opt, i) => {
                                opt.is_correct = i === index;
                              });
                            } else {
                              // Para múltiple select, múltiples pueden ser correctas
                              updatedOptions[index].is_correct = e.target.checked;
                            }
                            handleQuestionChange('options', updatedOptions);
                            // Actualizar correct_answers
                            const correctIds = updatedOptions.filter(opt => opt.is_correct).map(opt => opt.id);
                            handleQuestionChange('correct_answers', correctIds);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const updatedOptions = [...(currentQuestion.options || [])];
                            updatedOptions[index].text = e.target.value;
                            handleQuestionChange('options', updatedOptions);
                          }}
                          placeholder={`Opción ${index + 1}`}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {(currentQuestion.options?.length || 0) > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedOptions = (currentQuestion.options || []).filter((_, i) => i !== index);
                              handleQuestionChange('options', updatedOptions);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newOption = {
                          id: String((currentQuestion.options?.length || 0) + 1),
                          text: '',
                          is_correct: false,
                          order: currentQuestion.options?.length || 0
                        };
                        handleQuestionChange('options', [...(currentQuestion.options || []), newOption]);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Agregar opción
                    </button>
                  </div>
                </div>
              )}

              {/* True/False specific handling */}
              {currentQuestion.type === QuestionType.TRUE_FALSE && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Respuesta Correcta *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="true_false_answer"
                        value="true"
                        checked={currentQuestion.correct_answers?.includes('true')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleQuestionChange('correct_answers', ['true']);
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Verdadero</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="true_false_answer"
                        value="false"
                        checked={currentQuestion.correct_answers?.includes('false')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleQuestionChange('correct_answers', ['false']);
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Falso</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Fill in Blank/Essay specific handling */}
              {(currentQuestion.type === QuestionType.FILL_IN_BLANK || currentQuestion.type === QuestionType.ESSAY) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Respuesta Esperada (opcional)
                  </label>
                  <textarea
                    value={currentQuestion.correct_answers?.[0] || ''}
                    onChange={(e) => handleQuestionChange('correct_answers', [e.target.value])}
                    placeholder="Respuesta esperada o palabras clave..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para preguntas de texto libre y ensayo, la evaluación será manual
                  </p>
                </div>
              )}

              {/* Explanation field for all question types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explicación (opcional)
                </label>
                <textarea
                  value={currentQuestion.explanation}
                  onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                  placeholder="Explicación de la respuesta correcta..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetQuestionForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addOrUpdateQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingQuestionIndex !== null ? 'Actualizar' : 'Agregar'} Pregunta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {quizService.getQuestionTypeLabel(question.type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {question.points} {question.points === 1 ? 'punto' : 'puntos'}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {index + 1}. {question.text || question.content}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => editQuestion(index)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(index)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {questions.length === 0 && !showQuestionForm && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No hay preguntas en este quiz</p>
            <button
              onClick={() => setShowQuestionForm(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Agregar la primera pregunta
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate('/platform/admin/quizzes')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSubmit(QuizStatus.DRAFT)}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl"
          >
            <CheckIcon className="h-4 w-4" />
            <span>Guardar Borrador</span>
          </button>
          <button
            onClick={() => handleSubmit(QuizStatus.PUBLISHED)}
            disabled={loading || questions.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Publicar Quiz</span>
              </>
            )}
          </button>
        </div>
        {questions.length === 0 && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            💡 Agrega al menos una pregunta para poder publicar el quiz
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminQuizForm;
