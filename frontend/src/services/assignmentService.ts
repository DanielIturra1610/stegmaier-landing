/**
 * Servicio para gestión de assignments
 * Reutiliza patrones del mediaService existente
 */
import axios from 'axios';
import { authService } from './auth.service';
import {
  Assignment,
  AssignmentSubmission,
  AssignmentCreateDTO,
  AssignmentUpdateDTO,
  SubmissionCreateDTO,
  SubmissionUpdateDTO,
  SubmissionCommentCreateDTO,
  SubmissionGradeCreateDTO,
  BulkGradeCreateDTO,
  AssignmentFile,
  FileUploadProgress,
  AssignmentStatistics,
  StudentAssignmentProgress,
  PeerReview
} from '../types/assignment';

class AssignmentService {
  private baseURL = '/api/v1/assignments';

  // Configuración de axios con interceptors
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private getMultipartHeaders() {
    const token = authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    };
  }

  // ============ ASSIGNMENTS MANAGEMENT ============

  /**
   * Obtener todos los assignments de un curso
   */
  async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/course/${courseId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting course assignments:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener assignments del curso');
    }
  }

  /**
   * Obtener assignment por ID
   */
  async getAssignment(assignmentId: string): Promise<Assignment> {
    try {
      const response = await axios.get(
        `${this.baseURL}/${assignmentId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener assignment');
    }
  }

  /**
   * Crear nuevo assignment (instructores/admin)
   */
  async createAssignment(data: AssignmentCreateDTO): Promise<Assignment> {
    try {
      const response = await axios.post(
        this.baseURL,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al crear assignment');
    }
  }

  /**
   * Actualizar assignment
   */
  async updateAssignment(assignmentId: string, data: AssignmentUpdateDTO): Promise<Assignment> {
    try {
      const response = await axios.put(
        `${this.baseURL}/${assignmentId}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar assignment');
    }
  }

  /**
   * Eliminar assignment
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseURL}/${assignmentId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar assignment');
    }
  }

  /**
   * Publicar assignment
   */
  async publishAssignment(assignmentId: string): Promise<Assignment> {
    try {
      const response = await axios.post(
        `${this.baseURL}/${assignmentId}/publish`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error publishing assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al publicar assignment');
    }
  }

  // ============ FILE MANAGEMENT ============

  /**
   * Subir archivo para assignment con progreso
   */
  async uploadAssignmentFile(
    assignmentId: string,
    file: File,
    description?: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<AssignmentFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await axios.post(
        `${this.baseURL}/${assignmentId}/files`,
        formData,
        {
          headers: this.getMultipartHeaders(),
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100)
              };
              onProgress(progress);
            }
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error uploading assignment file:', error);
      throw new Error(error.response?.data?.detail || 'Error al subir archivo');
    }
  }

  /**
   * Eliminar archivo de assignment
   */
  async deleteAssignmentFile(assignmentId: string, fileId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseURL}/${assignmentId}/files/${fileId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      console.error('Error deleting assignment file:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar archivo');
    }
  }

  // ============ SUBMISSIONS MANAGEMENT ============

  /**
   * Obtener submissions de un assignment (instructor view)
   */
  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/${assignmentId}/submissions`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting assignment submissions:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener entregas');
    }
  }

  /**
   * Obtener submission del estudiante actual
   */
  async getMySubmission(assignmentId: string): Promise<AssignmentSubmission | null> {
    try {
      const response = await axios.get(
        `${this.baseURL}/${assignmentId}/my-submission`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No submission found
      }
      console.error('Error getting my submission:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener mi entrega');
    }
  }

  /**
   * Crear nueva submission
   */
  async createSubmission(data: SubmissionCreateDTO): Promise<AssignmentSubmission> {
    try {
      const response = await axios.post(
        `${this.baseURL}/${data.assignment_id}/submissions`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating submission:', error);
      throw new Error(error.response?.data?.detail || 'Error al crear entrega');
    }
  }

  /**
   * Actualizar submission existente
   */
  async updateSubmission(submissionId: string, data: SubmissionUpdateDTO): Promise<AssignmentSubmission> {
    try {
      const response = await axios.put(
        `${this.baseURL}/submissions/${submissionId}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating submission:', error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar entrega');
    }
  }

  /**
   * Enviar submission final
   */
  async submitAssignment(submissionId: string): Promise<AssignmentSubmission> {
    try {
      const response = await axios.post(
        `${this.baseURL}/submissions/${submissionId}/submit`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al enviar assignment');
    }
  }

  // ============ SUBMISSION FILES ============

  /**
   * Subir archivo para submission
   */
  async uploadSubmissionFile(
    submissionId: string,
    file: File,
    description?: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<AssignmentFile> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await axios.post(
        `${this.baseURL}/submissions/${submissionId}/files`,
        formData,
        {
          headers: this.getMultipartHeaders(),
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100)
              };
              onProgress(progress);
            }
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error uploading submission file:', error);
      throw new Error(error.response?.data?.detail || 'Error al subir archivo');
    }
  }

  /**
   * Eliminar archivo de submission
   */
  async deleteSubmissionFile(submissionId: string, fileId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseURL}/submissions/${submissionId}/files/${fileId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      console.error('Error deleting submission file:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar archivo');
    }
  }

  // ============ GRADING ============

  /**
   * Calificar submission
   */
  async gradeSubmission(
    submissionId: string,
    grades: SubmissionGradeCreateDTO[],
    feedback?: string
  ): Promise<AssignmentSubmission> {
    try {
      const response = await axios.post(
        `${this.baseURL}/submissions/${submissionId}/grade`,
        { grades, feedback },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error grading submission:', error);
      throw new Error(error.response?.data?.detail || 'Error al calificar entrega');
    }
  }

  /**
   * Calificación en lote
   */
  async bulkGrade(data: BulkGradeCreateDTO): Promise<AssignmentSubmission[]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/submissions/bulk-grade`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error bulk grading:', error);
      throw new Error(error.response?.data?.detail || 'Error en calificación masiva');
    }
  }

  // ============ COMMENTS ============

  /**
   * Agregar comentario a submission
   */
  async addComment(submissionId: string, data: SubmissionCommentCreateDTO) {
    try {
      const response = await axios.post(
        `${this.baseURL}/submissions/${submissionId}/comments`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      throw new Error(error.response?.data?.detail || 'Error al agregar comentario');
    }
  }

  // ============ STATISTICS ============

  /**
   * Obtener estadísticas de assignment
   */
  async getAssignmentStatistics(assignmentId: string): Promise<AssignmentStatistics> {
    try {
      const response = await axios.get(
        `${this.baseURL}/${assignmentId}/statistics`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting assignment statistics:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener estadísticas');
    }
  }

  /**
   * Obtener progreso de estudiante en assignments
   */
  async getStudentProgress(courseId: string, studentId?: string): Promise<StudentAssignmentProgress> {
    try {
      const url = studentId 
        ? `${this.baseURL}/progress/${courseId}/${studentId}`
        : `${this.baseURL}/progress/${courseId}/me`;
        
      const response = await axios.get(url, { headers: this.getAuthHeaders() });
      return response.data;
    } catch (error: any) {
      console.error('Error getting student progress:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener progreso');
    }
  }

  // ============ UTILITIES ============

  /**
   * Validar archivo para assignments
   */
  validateFile(file: File, allowedTypes: string[], maxSize: number) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension) {
      return { isValid: false, error: 'Archivo sin extensión válida' };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(fileExtension)) {
      return { 
        isValid: false, 
        error: `Tipo de archivo no permitido. Tipos aceptados: ${allowedTypes.join(', ')}` 
      };
    }

    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `Archivo demasiado grande. Máximo: ${this.formatFileSize(maxSize)}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatear tiempo restante hasta la fecha límite
   */
  formatTimeUntilDue(dueDate: string): string {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();

    if (diff < 0) {
      return 'Vencido';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} minuto${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}`;
    }
  }

  /**
   * Obtener etiqueta de estado de submission
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'not_started': 'No iniciado',
      'in_progress': 'En progreso',
      'submitted': 'Enviado',
      'under_review': 'En revisión',
      'graded': 'Calificado',
      'returned': 'Devuelto',
      'late_submission': 'Entrega tardía',
      'missing': 'No entregado'
    };
    return labels[status] || status;
  }

  /**
   * Obtener color de estado de submission
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'not_started': 'text-gray-500 bg-gray-100',
      'in_progress': 'text-blue-700 bg-blue-100',
      'submitted': 'text-green-700 bg-green-100',
      'under_review': 'text-yellow-700 bg-yellow-100',
      'graded': 'text-purple-700 bg-purple-100',
      'returned': 'text-red-700 bg-red-100',
      'late_submission': 'text-orange-700 bg-orange-100',
      'missing': 'text-red-700 bg-red-100'
    };
    return colors[status] || 'text-gray-500 bg-gray-100';
  }

  /**
   * Calcular letra de calificación
   */
  calculateLetterGrade(percentage: number): string {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D';
    return 'F';
  }
}

export const assignmentService = new AssignmentService();
