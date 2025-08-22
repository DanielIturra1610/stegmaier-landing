/**
 * AdminQuizForm - Formulario para crear/editar quizzes
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { quizService, Quiz, QuizCreate, Question } from '../../services/quizService';
import { courseService } from '../../services/courseService';
import { adminService } from '../../services/adminService';

interface Course {
  id: string;
  title: string;
}

const AdminQuizForm: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const isEditing = !!quizId;

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
    status: 'draft' as 'draft' | 'published' | 'archived'
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple_choice',
    text: '',
    options: ['', '', '', ''],
    correct_answers: [],
    explanation: '',
    points: 1,
    required: true,
    tags: []
  });

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [quizId]);

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
          time_limit_minutes: quiz.time_limit_minutes || 0,
          max_attempts: quiz.max_attempts,
          passing_score: quiz.passing_score,
          shuffle_questions: quiz.shuffle_questions,
          show_results: quiz.show_results,
          allow_review: quiz.allow_review,
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
    if (!currentQuestion.text?.trim()) {
      alert('El texto de la pregunta es requerido');
      return;
    }

    if (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'multiple_select') {
      const validOptions = currentQuestion.options?.filter(opt => opt.trim()) || [];
      if (validOptions.length < 2) {
        alert('Debes proporcionar al menos 2 opciones válidas');
        return;
      }
      currentQuestion.options = validOptions;
    }

    if (!currentQuestion.correct_answers?.length) {
      alert('Debes especificar al menos una respuesta correcta');
      return;
    }

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
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      type: 'multiple_choice',
      text: '',
      options: ['', '', '', ''],
      correct_answers: [],
      explanation: '',
      points: 1,
      required: true,
      tags: []
    });
    setShowQuestionForm(false);
    setEditingQuestionIndex(null);
  };

  const handleSubmit = async (status: 'draft' | 'published' = 'draft') => {
    try {
      if (!formData.title.trim() || !formData.description.trim() || !formData.course_id) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }

      if (status === 'published' && questions.length === 0) {
        alert('No puedes publicar un quiz sin preguntas');
        return;
      }

      setLoading(true);

      const quizData: QuizCreate = {
        ...formData,
        questions: questions.map(({ id, order, ...question }) => question)
      };

      if (isEditing && quizId) {
        await quizService.updateQuiz(quizId, { status });
      } else {
        const newQuiz = await quizService.createQuiz(quizData);
        // Si se quiere publicar directamente, actualizar el estado
        if (status === 'published') {
          await quizService.updateQuiz(newQuiz.id, { status: 'published' });
        }
      }

      navigate('/platform/admin/quizzes');
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Error al guardar el quiz');
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/platform/admin/quizzes')}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Quiz' : 'Nuevo Quiz'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Modifica los detalles del quiz' : 'Crea un nuevo quiz de evaluación'}
            </p>
          </div>
        </div>
      </div>

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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
                  value={currentQuestion.text}
                  onChange={(e) => handleQuestionChange('text', e.target.value)}
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
                  <option value="multiple_choice">Opción Múltiple</option>
                  <option value="true_false">Verdadero/Falso</option>
                  <option value="short_answer">Respuesta Corta</option>
                  <option value="multiple_select">Selección Múltiple</option>
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
                      {index + 1}. {question.text}
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
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => navigate('/admin/quizzes')}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => handleSubmit('draft')}
          disabled={loading}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <CheckIcon className="h-4 w-4" />
          <span>Guardar Borrador</span>
        </button>
        <button
          onClick={() => handleSubmit('published')}
          disabled={loading || questions.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Publicar Quiz
        </button>
      </div>
    </div>
  );
};

export default AdminQuizForm;
