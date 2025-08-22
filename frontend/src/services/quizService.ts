/**
 * Quiz Service - Frontend service for quiz management
 */
import axios from 'axios';

// Types and interfaces for Quiz system
export interface Question {
  id?: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'multiple_select';
  text: string;
  options?: string[];
  correct_answers: string[];
  explanation?: string;
  points: number;
  order?: number;
  required: boolean;
  tags?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  course_id: string;
  lesson_id?: string;
  instructions?: string;
  time_limit_minutes?: number;
  max_attempts: number;
  passing_score: number;
  shuffle_questions: boolean;
  show_results: boolean;
  allow_review: boolean;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
  questions?: Question[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuizCreate {
  title: string;
  description: string;
  course_id: string;
  lesson_id?: string;
  instructions?: string;
  time_limit_minutes?: number;
  max_attempts: number;
  passing_score: number;
  shuffle_questions: boolean;
  show_results: boolean;
  allow_review: boolean;
  tags?: string[];
  questions?: Omit<Question, 'id' | 'order'>[];
}

export interface QuizUpdate {
  title?: string;
  description?: string;
  instructions?: string;
  time_limit_minutes?: number;
  max_attempts?: number;
  passing_score?: number;
  shuffle_questions?: boolean;
  show_results?: boolean;
  allow_review?: boolean;
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  submitted_at?: string;
  end_time?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  points_earned?: number;
  total_points?: number;
  answers: { [question_id: string]: any };
}

export interface QuizResult {
  attempt_id: string;
  quiz_id: string;
  score: number;
  points_earned: number;
  total_points: number;
  passed: boolean;
  submitted_at: string;
  question_results?: { [question_id: string]: any };
}

export interface QuizStatistics {
  quiz_id: string;
  total_attempts: number;
  completed_attempts: number;
  average_score: number;
  completion_rate: number;
  pass_rate: number;
  question_statistics: QuestionStatistics[];
}

export interface QuestionStatistics {
  question_id: string;
  question_text: string;
  total_answers: number;
  correct_answers: number;
  accuracy_percentage: number;
}

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

  async getQuizzes(filters?: {
    course_id?: string;
    lesson_id?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<Quiz[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.course_id) params.append('course_id', filters.course_id);
      if (filters?.lesson_id) params.append('lesson_id', filters.lesson_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.skip) params.append('skip', filters.skip.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get(`${this.baseURL}?${params.toString()}`, {
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

  // Question Management
  async addQuestion(quizId: string, questionData: Omit<Question, 'id' | 'order'>): Promise<Question> {
    try {
      const response = await axios.post(`${this.baseURL}/${quizId}/questions`, questionData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to add question');
    }
  }

  async updateQuestion(questionId: string, questionData: Partial<Question>): Promise<Question> {
    try {
      const response = await axios.put(`${this.baseURL}/questions/${questionId}`, questionData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update question');
    }
  }

  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/questions/${questionId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to delete question');
    }
  }

  // Quiz Taking (Students)
  async startQuizAttempt(quizId: string): Promise<QuizAttempt> {
    try {
      const response = await axios.post(`${this.baseURL}/${quizId}/start`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to start quiz attempt');
    }
  }

  async submitAnswer(attemptId: string, questionId: string, answer: any): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/attempts/${attemptId}/answers`, {
        question_id: questionId,
        answer: answer
      }, {
        headers: this.getAuthHeaders()
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to submit answer');
    }
  }

  async submitQuizAttempt(attemptId: string): Promise<QuizResult> {
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

  async getUserQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    try {
      const response = await axios.get(`${this.baseURL}/${quizId}/attempts`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz attempts');
    }
  }

  // Statistics (Admin/Instructor)
  async getQuizStatistics(quizId: string): Promise<QuizStatistics> {
    try {
      const response = await axios.get(`${this.baseURL}/${quizId}/statistics`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch quiz statistics');
    }
  }

  // Utility methods
  formatTimeLimit(minutes?: number): string {
    if (!minutes) return 'Sin límite de tiempo';
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} horas`;
  }

  getQuestionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'multiple_choice': 'Opción múltiple',
      'true_false': 'Verdadero/Falso',
      'short_answer': 'Respuesta corta',
      'multiple_select': 'Selección múltiple'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Borrador',
      'published': 'Publicado',
      'archived': 'Archivado',
      'in_progress': 'En progreso',
      'completed': 'Completado',
      'abandoned': 'Abandonado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'draft': 'yellow',
      'published': 'green',
      'archived': 'gray',
      'in_progress': 'blue',
      'completed': 'green',
      'abandoned': 'red'
    };
    return colors[status] || 'gray';
  }
}

export const quizService = new QuizService();
export default quizService;
