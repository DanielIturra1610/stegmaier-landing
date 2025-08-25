/**
 * Quiz Service - Frontend service for quiz management
 */
import axios from 'axios';
import {
  Quiz, QuizListItem, Question, QuizAttempt, QuizAnswer, StudentAnswer,
  QuizCreate, QuizUpdate, QuizConfiguration, QuizStatistics, StudentQuizProgress,
  QuestionType, QuizStatus, AttemptStatus
} from '../types/quiz';


class QuizService {
  private baseURL = '/api/v1/quizzes';

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Quiz Management (Admin/Instructor)
  async createQuiz(quizData: QuizCreate): Promise<Quiz> {
    try {
      const response = await axios.post(this.baseURL, quizData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to create quiz');
    }
  }

  async getQuizzes(filters?: any): Promise<QuizListItem[]> {
    try {
      const response = await axios.get(this.baseURL, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch quizzes');
    }
  }

  async getQuizzesByCourse(courseId: string, publishedOnly: boolean = true): Promise<QuizListItem[]> {
    try {
      const response = await axios.get(`${this.baseURL}/course/${courseId}?published_only=${publishedOnly}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch quizzes');
    }
  }

  async getQuiz(quizId: string): Promise<Quiz> {
    try {
      const response = await axios.get(`${this.baseURL}/${quizId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz');
    }
  }

  async updateQuiz(quizId: string, quizData: QuizUpdate): Promise<Quiz> {
    try {
      const response = await axios.put(`${this.baseURL}/${quizId}`, quizData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update quiz');
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/${quizId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete quiz');
    }
  }

  // Helper methods
  formatTimeLimit(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  // Question Management
  async createQuestion(questionData: any): Promise<Question> {
    try {
      const response = await axios.post(`${this.baseURL}/questions`, questionData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to create question');
    }
  }

  async addQuestionToQuiz(quizId: string, questionId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/${quizId}/questions/${questionId}`, {}, {
        headers: this.getAuthHeaders()
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to add question to quiz');
    }
  }

  // Quiz Taking (Students)
  async startQuizAttempt(quizId: string): Promise<QuizAttempt> {
    try {
      const response = await axios.post(`${this.baseURL}/${quizId}/attempts`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to start quiz attempt');
    }
  }

  async submitAnswer(attemptId: string, answerData: StudentAnswer): Promise<void> {
    try {
      await axios.put(`${this.baseURL}/attempts/${attemptId}/answers`, answerData, {
        headers: this.getAuthHeaders()
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to submit answer');
    }
  }

  async submitQuizAttempt(attemptId: string): Promise<QuizAttempt> {
    try {
      const response = await axios.post(`${this.baseURL}/attempts/${attemptId}/submit`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to submit quiz');
    }
  }

  async getQuizAttempt(attemptId: string): Promise<QuizAttempt> {
    try {
      const response = await axios.get(`${this.baseURL}/attempts/${attemptId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz attempt');
    }
  }

  async getStudentQuizProgress(studentId: string, courseId: string): Promise<StudentQuizProgress> {
    try {
      const response = await axios.get(`${this.baseURL}/student/${studentId}/progress?course_id=${courseId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch student progress');
    }
  }

  // Statistics (Admin/Instructor)
  async getQuizStatistics(quizId: string): Promise<QuizStatistics> {
    try {
      const response = await axios.get(`${this.baseURL}/admin/statistics/${quizId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz statistics');
    }
  }

  // Utility methods
  formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return 'Sin límite de tiempo';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  getQuestionTypeLabel(type: QuestionType): string {
    const labels: Record<QuestionType, string> = {
      [QuestionType.MULTIPLE_CHOICE]: 'Opción múltiple',
      [QuestionType.MULTIPLE_SELECT]: 'Selección múltiple',
      [QuestionType.TRUE_FALSE]: 'Verdadero/Falso',
      [QuestionType.FILL_IN_BLANK]: 'Completar espacios',
      [QuestionType.ESSAY]: 'Ensayo',
      [QuestionType.ORDERING]: 'Ordenar elementos',
      [QuestionType.MATCHING]: 'Emparejar'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: QuizStatus | AttemptStatus | string): string {
    const labels: Record<string, string> = {
      [QuizStatus.DRAFT]: 'Borrador',
      [QuizStatus.PUBLISHED]: 'Publicado',
      [QuizStatus.ARCHIVED]: 'Archivado',
      [AttemptStatus.IN_PROGRESS]: 'En progreso',
      [AttemptStatus.COMPLETED]: 'Completado',
      [AttemptStatus.SUBMITTED]: 'Enviado',
      [AttemptStatus.GRADED]: 'Calificado',
      [AttemptStatus.EXPIRED]: 'Expirado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: QuizStatus | AttemptStatus | string): string {
    const colors: Record<string, string> = {
      [QuizStatus.DRAFT]: 'yellow',
      [QuizStatus.PUBLISHED]: 'green',
      [QuizStatus.ARCHIVED]: 'gray',
      [AttemptStatus.IN_PROGRESS]: 'blue',
      [AttemptStatus.COMPLETED]: 'green',
      [AttemptStatus.SUBMITTED]: 'green',
      [AttemptStatus.GRADED]: 'green',
      [AttemptStatus.EXPIRED]: 'red'
    };
    return colors[status] || 'gray';
  }

  validateAnswer(question: Question, answer: any): { isValid: boolean; message?: string } {
    if (!answer && answer !== 0 && answer !== false) {
      return { isValid: false, message: 'Esta pregunta es obligatoria' };
    }

    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.TRUE_FALSE:
        if (typeof answer !== 'string') {
          return { isValid: false, message: 'Selecciona una opción válida' };
        }
        break;
      
      case QuestionType.FILL_IN_BLANK:
        if (typeof answer !== 'string' || answer.trim().length === 0) {
          return { isValid: false, message: 'Completa el campo de texto' };
        }
        break;
      
      case QuestionType.ORDERING:
        if (!Array.isArray(answer) || answer.length === 0) {
          return { isValid: false, message: 'Ordena todos los elementos' };
        }
        break;
      
      case QuestionType.MATCHING:
        if (typeof answer !== 'object' || Object.keys(answer).length === 0) {
          return { isValid: false, message: 'Completa todos los emparejamientos' };
        }
        break;
    }

    return { isValid: true };
  }
}

export const quizService = new QuizService();
export default quizService;
