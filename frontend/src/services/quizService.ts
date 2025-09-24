/**
 * Quiz Service - Frontend service for quiz management
 * ✅ CORREGIDO: URLs centralizadas, sin URLs relativas
 */
import {
  Quiz, QuizListItem, Question, QuizAttempt, QuizAnswer, StudentAnswer,
  QuizCreate, QuizUpdate, QuizConfiguration, QuizStatistics, StudentQuizProgress,
  QuestionType, QuizStatus, AttemptStatus
} from '../types/quiz';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.config';
import axios from 'axios';

// Error handling interface
interface APIError {
  response?: {
    data?: {
      detail?: string;
    };
    status?: number;
  };
  message?: string;
}

class QuizService {
  // Quiz Management (Admin/Instructor)
  async createQuiz(quizData: QuizCreate): Promise<Quiz> {
    try {
      console.log(' [quizService] Creating quiz:', quizData.title);
      console.log('📝 [quizService] Creating quiz:', quizData.title);
      
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.QUIZZES),
        quizData,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz created:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error creating quiz:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to create quiz');
    }
  }

  async getQuizzes(filters?: Record<string, unknown>): Promise<QuizListItem[]> {
    try {
      console.log('📚 [quizService] Getting quizzes');
      
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.QUIZZES),
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quizzes:', response.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error fetching quizzes:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to fetch quizzes');
    }
  }

  async getQuizzesByCourse(courseId: string, publishedOnly: boolean = true): Promise<QuizListItem[]> {
    try {
      console.log('📚 [quizService] Getting quizzes by course:', { courseId, publishedOnly });
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/course/${courseId}?published_only=${publishedOnly}`),
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved course quizzes:', response.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error fetching course quizzes:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to fetch course quizzes');
    }
  }

  async getQuiz(quizId: string): Promise<Quiz> {
    try {
      console.log('📝 [quizService] Getting quiz:', quizId);
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${quizId}`),
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quiz:', response.data.title);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error fetching quiz:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to fetch quiz');
    }
  }

  async updateQuiz(quizId: string, updateData: QuizUpdate): Promise<Quiz> {
    try {
      console.log('📝 [quizService] Updating quiz:', quizId);
      
      const response = await axios.put(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${quizId}`),
        updateData,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz updated:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error updating quiz:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to update quiz');
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      console.log('🗑️ [quizService] Deleting quiz:', quizId);
      
      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${quizId}`),
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz deleted successfully');
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error deleting quiz:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to delete quiz');
    }
  }

  async publishQuiz(quizId: string): Promise<Quiz> {
    try {
      console.log('📢 [quizService] Publishing quiz:', quizId);
      
      const response = await axios.put(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${quizId}/publish`),
        {},
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz published:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error publishing quiz:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to publish quiz');
    }
  }

  // Student Quiz Taking
  async startQuizAttempt(quizId: string): Promise<QuizAttempt> {
    try {
      console.log('🚀 [quizService] Starting quiz attempt:', quizId);
      
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${quizId}/attempts`),
        {},
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz attempt started:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error starting quiz attempt:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to start quiz attempt');
    }
  }

  async submitQuizAnswer(attemptId: string, answers: StudentAnswer[]): Promise<QuizAttempt> {
    try {
      console.log('📤 [quizService] Submitting quiz answers:', { attemptId, answersCount: answers.length });
      
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/attempts/${attemptId}/submit`),
        { answers },
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz answers submitted:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error submitting quiz answers:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to submit quiz answers');
    }
  }

  async getQuizAttempt(attemptId: string): Promise<QuizAttempt> {
    try {
      console.log('📊 [quizService] Getting quiz attempt:', attemptId);
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/attempts/${attemptId}`),
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quiz attempt:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error fetching quiz attempt:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to fetch quiz attempt');
    }
  }

  async getStudentQuizProgress(quizId: string): Promise<StudentQuizProgress> {
    try {
      console.log('📈 [quizService] Getting student quiz progress:', quizId);
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${quizId}/progress`),
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quiz progress:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error fetching quiz progress:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to fetch quiz progress');
    }
  }

  async getQuizStatistics(quizId: string): Promise<QuizStatistics> {
    try {
      console.log('📊 [quizService] Getting quiz statistics for admin:', quizId);
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/admin/statistics/${quizId}`),
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quiz statistics:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error fetching quiz statistics:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to fetch quiz statistics');
    }
  }

  async getStudentAttempts(quizId: string): Promise<QuizAttempt[]> {
    try {
      console.log('📚 [quizService] Getting student attempts for quiz:', quizId);
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/${quizId}/my-attempts`),
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved student attempts:', response.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [quizService] Error fetching student attempts:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to fetch student attempts');
    }
  }

  // Métodos para vincular quizzes a lecciones
  async createQuizForLesson(lessonId: string, quizData: Omit<QuizCreate, 'lesson_id'>): Promise<Quiz> {
    try {
      console.log(`[quizService] Creating quiz for lesson: ${lessonId}`);
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/lesson/${lessonId}`),
        quizData,
        { headers: getAuthHeaders() }
      );
      console.log('[quizService] Quiz created for lesson:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('[quizService] Error creating quiz for lesson:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to create quiz for lesson');
    }
  }

  async getQuizByLessonId(lessonId: string): Promise<Quiz | null> {
    try {
      console.log(`[quizService] Getting quiz for lesson: ${lessonId}`);
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.QUIZZES}/lesson/${lessonId}/quiz`),
        { headers: getAuthHeaders() }
      );
      console.log('[quizService] Retrieved quiz for lesson:', response.data);
      return response.data;
    } catch (error) {
      const apiError = error as APIError;
      if (apiError.response?.status === 404) {
        return null;
      }
      console.error('[quizService] Error fetching quiz for lesson:', apiError);
      throw new Error(apiError.response?.data?.detail || 'Failed to fetch quiz for lesson');
    }
  }

  // Utility methods
  calculateScore(answers: StudentAnswer[], questions: Question[]): number {
    let correctAnswers = 0;
    
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.question_id);
      if (!question) return;

      switch (question.type) {
        case 'multiple_choice':
        case 'true_false':
          // Para multiple choice, answer es un string con la opción seleccionada
          if (question.correct_answers.includes(answer.answer)) {
            correctAnswers++;
          }
          break;
        case 'multiple_select':
          const correctOptions = question.correct_answers || [];
          const selectedOptions = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
          if (this.arraysEqual(correctOptions.sort(), selectedOptions.sort())) {
            correctAnswers++;
          }
          break;
        // Para short_answer y essay, la calificación debe ser manual
        default:
          break;
      }
    });

    return questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
  }

  validateAnswer(question: Question, answer: unknown): boolean {
    console.log('🔍 [quizService] Validating answer for question:', question.id);
    return true;
  }

  formatTimeRemaining(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  async submitAnswer(quizId: string, questionId: string, answer: unknown): Promise<QuizAttempt> {
    console.log('📝 [quizService] Submitting answer:', { quizId, questionId });
    const answerData: StudentAnswer = { 
      question_id: questionId, 
      answer, 
      time_spent: 0,
      created_at: new Date().toISOString()
    };
    return this.submitQuizAnswer(quizId, [answerData]);
  }

  async submitQuizAttempt(quizId: string, answers: StudentAnswer[]): Promise<QuizAttempt> {
    console.log('📤 [quizService] Submitting quiz attempt:', quizId);

    // TODO: Implement actual API call when backend is ready
    const mockAttempt: QuizAttempt = {
      id: 'temp-attempt-' + Date.now(),
      quiz_id: quizId,
      student_id: 'current-user-id',
      attempt_number: 1,
      status: AttemptStatus.SUBMITTED,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      score: 85,
      score_percentage: 85,
      percentage: 85,
      is_passing: true,
      time_spent: 300, // 5 minutes
      answers: answers,
      points_earned: 17,
      total_points: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return mockAttempt;
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'published': return 'text-green-600 bg-green-50';
      case 'draft': return 'text-yellow-600 bg-yellow-50';
      case 'archived': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  formatTimeLimit(minutes?: number): string {
    if (!minutes) return 'Sin límite';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every(val => b.includes(val));
  }

  getQuestionTypeLabel(type: QuestionType): string {
    const labels = {
      'multiple_choice': 'Opción Múltiple',
      'true_false': 'Verdadero/Falso', 
      'short_answer': 'Respuesta Corta',
      'essay': 'Ensayo',
      'multiple_select': 'Selección Múltiple',
      'matching': 'Emparejamiento'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: QuizStatus | AttemptStatus): string {
    const labels = {
      'draft': 'Borrador',
      'published': 'Publicado',
      'archived': 'Archivado',
      'in_progress': 'En Progreso',
      'completed': 'Completado',
      'graded': 'Calificado',
      'expired': 'Expirado'
    };
    return labels[status as keyof typeof labels] || status;
  }
}

// Export singleton instance
const quizService = new QuizService();
export default quizService;
