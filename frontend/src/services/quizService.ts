/**
 * Quiz Service - Frontend service for quiz management
 * ✅ CORREGIDO: URLs centralizadas, sin URLs relativas
 */
import axios from 'axios';
import {
  Quiz, QuizListItem, Question, QuizAttempt, QuizAnswer, StudentAnswer,
  QuizCreate, QuizUpdate, QuizConfiguration, QuizStatistics, StudentQuizProgress,
  QuestionType, QuizStatus, AttemptStatus
} from '../types/quiz';
import { API_CONFIG, API_ENDPOINTS, getAuthHeaders } from '../config/api.config';

class QuizService {
  // Quiz Management (Admin/Instructor)
  async createQuiz(quizData: QuizCreate): Promise<Quiz> {
    try {
      console.log('📝 [quizService] Creating quiz:', quizData.title);
      
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}`,
        quizData,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error creating quiz:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create quiz');
    }
  }

  async getQuizzes(filters?: any): Promise<QuizListItem[]> {
    try {
      console.log('📚 [quizService] Getting quizzes');
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}`,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quizzes:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error fetching quizzes:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch quizzes');
    }
  }

  async getQuizzesByCourse(courseId: string, publishedOnly: boolean = true): Promise<QuizListItem[]> {
    try {
      console.log('📚 [quizService] Getting quizzes by course:', { courseId, publishedOnly });
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/course/${courseId}?published_only=${publishedOnly}`,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved course quizzes:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error fetching course quizzes:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch course quizzes');
    }
  }

  async getQuiz(quizId: string): Promise<Quiz> {
    try {
      console.log('📝 [quizService] Getting quiz:', quizId);
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/${quizId}`,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quiz:', response.data.title);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error fetching quiz:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz');
    }
  }

  async updateQuiz(quizId: string, updateData: QuizUpdate): Promise<Quiz> {
    try {
      console.log('📝 [quizService] Updating quiz:', quizId);
      
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/${quizId}`,
        updateData,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error updating quiz:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update quiz');
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      console.log('🗑️ [quizService] Deleting quiz:', quizId);
      
      await axios.delete(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/${quizId}`,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz deleted successfully');
    } catch (error: any) {
      console.error('❌ [quizService] Error deleting quiz:', error);
      throw new Error(error.response?.data?.detail || 'Failed to delete quiz');
    }
  }

  async publishQuiz(quizId: string): Promise<Quiz> {
    try {
      console.log('📢 [quizService] Publishing quiz:', quizId);
      
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/${quizId}/publish`,
        {},
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz published:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error publishing quiz:', error);
      throw new Error(error.response?.data?.detail || 'Failed to publish quiz');
    }
  }

  // Student Quiz Taking
  async startQuizAttempt(quizId: string): Promise<QuizAttempt> {
    try {
      console.log('🚀 [quizService] Starting quiz attempt:', quizId);
      
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/${quizId}/attempts`,
        {},
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz attempt started:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error starting quiz attempt:', error);
      throw new Error(error.response?.data?.detail || 'Failed to start quiz attempt');
    }
  }

  async submitQuizAnswer(attemptId: string, answers: StudentAnswer[]): Promise<QuizAttempt> {
    try {
      console.log('📤 [quizService] Submitting quiz answers:', { attemptId, answersCount: answers.length });
      
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/attempts/${attemptId}/submit`,
        { answers },
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Quiz answers submitted:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error submitting quiz answers:', error);
      throw new Error(error.response?.data?.detail || 'Failed to submit quiz answers');
    }
  }

  async getQuizAttempt(attemptId: string): Promise<QuizAttempt> {
    try {
      console.log('📊 [quizService] Getting quiz attempt:', attemptId);
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/attempts/${attemptId}`,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quiz attempt:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error fetching quiz attempt:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz attempt');
    }
  }

  async getStudentQuizProgress(quizId: string): Promise<StudentQuizProgress> {
    try {
      console.log('📈 [quizService] Getting student quiz progress:', quizId);
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/${quizId}/progress`,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quiz progress:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error fetching quiz progress:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz progress');
    }
  }

  async getQuizStatistics(quizId: string): Promise<QuizStatistics> {
    try {
      console.log('📊 [quizService] Getting quiz statistics:', quizId);
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/${quizId}/statistics`,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved quiz statistics:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error fetching quiz statistics:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz statistics');
    }
  }

  async getStudentAttempts(quizId: string): Promise<QuizAttempt[]> {
    try {
      console.log('📚 [quizService] Getting student attempts for quiz:', quizId);
      
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.QUIZZES}/${quizId}/my-attempts`,
        { headers: getAuthHeaders() }
      );
      
      console.log('✅ [quizService] Retrieved student attempts:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [quizService] Error fetching student attempts:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch student attempts');
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
