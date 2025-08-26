/**
 * Assignment Service - Frontend service for assignment management
 * ✅ CORREGIDO: URLs centralizadas, headers centralizados, sin URLs relativas
 */
import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../config/api.config';
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
  private getMultipartHeaders() {
    return {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data'
    };
  }

  // ============ ASSIGNMENTS MANAGEMENT ============

  /**
   * Obtener todos los assignments de un curso
   */
  async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    try {
      console.log('📚 [assignmentService] Getting course assignments for:', courseId);
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/course/${courseId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Course assignments retrieved:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error getting course assignments:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener assignments del curso');
    }
  }

  /**
   * Obtener assignments del usuario actual
   */
  async getUserAssignments(): Promise<Assignment[]> {
    try {
      console.log('👤 [assignmentService] Getting user assignments');
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/user/assignments`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] User assignments retrieved:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error getting user assignments:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener assignments del usuario');
    }
  }

  /**
   * Obtener submissions del usuario actual
   */
  async getUserSubmissions(): Promise<AssignmentSubmission[]> {
    try {
      console.log('📝 [assignmentService] Getting user submissions');
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/user/submissions`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] User submissions retrieved:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error getting user submissions:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener submissions del usuario');
    }
  }

  /**
   * Obtener assignment por ID
   */
  async getAssignment(assignmentId: string): Promise<Assignment> {
    try {
      console.log('📋 [assignmentService] Getting assignment:', assignmentId);
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment retrieved:', response.data.title);
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error getting assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener assignment');
    }
  }

  /**
   * Crear nuevo assignment (instructores/admin)
   */
  async createAssignment(data: AssignmentCreateDTO): Promise<Assignment> {
    try {
      console.log('➕ [assignmentService] Creating assignment:', data.title);
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.ASSIGNMENTS),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment created:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error creating assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al crear assignment');
    }
  }

  /**
   * Actualizar assignment
   */
  async updateAssignment(assignmentId: string, data: AssignmentUpdateDTO): Promise<Assignment> {
    try {
      console.log('✏️ [assignmentService] Updating assignment:', assignmentId);
      const response = await axios.put(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error updating assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar assignment');
    }
  }

  /**
   * Eliminar assignment
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      console.log('🗑️ [assignmentService] Deleting assignment:', assignmentId);
      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment deleted successfully');
    } catch (error: any) {
      console.error('❌ [assignmentService] Error deleting assignment:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar assignment');
    }
  }

  /**
   * Publicar assignment
   */
  async publishAssignment(assignmentId: string): Promise<Assignment> {
    try {
      console.log('🚀 [assignmentService] Publishing assignment:', assignmentId);
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/publish`),
        {},
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment published successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error publishing assignment:', error);
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

      console.log('📎 [assignmentService] Uploading assignment file for:', assignmentId);
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/files`),
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

      console.log('✅ [assignmentService] Assignment file uploaded successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error uploading assignment file:', error);
      throw new Error(error.response?.data?.detail || 'Error al subir archivo');
    }
  }

  /**
   * Eliminar archivo de assignment
   */
  async deleteAssignmentFile(assignmentId: string, fileId: string): Promise<void> {
    try {
      console.log('🗑️ [assignmentService] Deleting assignment file:', fileId);
      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/files/${fileId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment file deleted successfully');
    } catch (error: any) {
      console.error('❌ [assignmentService] Error deleting assignment file:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar archivo');
    }
  }

  // ============ SUBMISSIONS MANAGEMENT ============

  /**
   * Obtener submissions de un assignment (instructor view)
   */
  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      console.log('📥 [assignmentService] Getting assignment submissions for:', assignmentId);
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/submissions`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment submissions retrieved:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error getting assignment submissions:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener entregas');
    }
  }

  /**
   * Obtener submission del estudiante actual
   */
  async getMySubmission(assignmentId: string): Promise<AssignmentSubmission | null> {
    try {
      console.log('📝 [assignmentService] Getting my submission for assignment:', assignmentId);
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/my-submission`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] My submission retrieved');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('ℹ️ [assignmentService] No submission found for assignment:', assignmentId);
        return null; // No submission found
      }
      console.error('❌ [assignmentService] Error getting my submission:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener mi entrega');
    }
  }

  /**
   * Crear nueva submission
   */
  async createSubmission(data: SubmissionCreateDTO): Promise<AssignmentSubmission> {
    try {
      console.log('➕ [assignmentService] Creating submission for assignment:', data.assignment_id);
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${data.assignment_id}/submissions`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Submission created:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error creating submission:', error);
      throw new Error(error.response?.data?.detail || 'Error al crear entrega');
    }
  }

  /**
   * Actualizar submission existente
   */
  async updateSubmission(submissionId: string, data: SubmissionUpdateDTO): Promise<AssignmentSubmission> {
    try {
      console.log('✏️ [assignmentService] Updating submission:', submissionId);
      const response = await axios.put(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/submissions/${submissionId}`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Submission updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error updating submission:', error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar entrega');
    }
  }

  /**
   * Enviar submission final
   */
  async submitAssignment(submissionId: string): Promise<AssignmentSubmission> {
    try {
      console.log('📤 [assignmentService] Submitting assignment:', submissionId);
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/submissions/${submissionId}/submit`),
        {},
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment submitted successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error submitting assignment:', error);
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

      console.log('📎 [assignmentService] Uploading submission file for:', submissionId);
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/submissions/${submissionId}/files`),
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

      console.log('✅ [assignmentService] Submission file uploaded successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error uploading submission file:', error);
      throw new Error(error.response?.data?.detail || 'Error al subir archivo');
    }
  }

  /**
   * Eliminar archivo de submission
   */
  async deleteSubmissionFile(submissionId: string, fileId: string): Promise<void> {
    try {
      console.log('🗑️ [assignmentService] Deleting submission file:', fileId);
      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/submissions/${submissionId}/files/${fileId}`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Submission file deleted successfully');
    } catch (error: any) {
      console.error('❌ [assignmentService] Error deleting submission file:', error);
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
      console.log('🎖️ [assignmentService] Grading submission:', submissionId);
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/submissions/${submissionId}/grade`),
        { grades, feedback },
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Submission graded successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error grading submission:', error);
      throw new Error(error.response?.data?.detail || 'Error al calificar entrega');
    }
  }

  /**
   * Calificación en lote
   */
  async bulkGrade(data: BulkGradeCreateDTO): Promise<AssignmentSubmission[]> {
    try {
      console.log('📈 [assignmentService] Bulk grading submissions');
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/submissions/bulk-grade`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Bulk grading completed:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error bulk grading:', error);
      throw new Error(error.response?.data?.detail || 'Error en calificación masiva');
    }
  }

  // ============ COMMENTS ============

  /**
   * Agregar comentario a submission
   */
  async addComment(submissionId: string, data: SubmissionCommentCreateDTO) {
    try {
      console.log('💬 [assignmentService] Adding comment to submission:', submissionId);
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/submissions/${submissionId}/comments`),
        data,
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Comment added successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error adding comment:', error);
      throw new Error(error.response?.data?.detail || 'Error al agregar comentario');
    }
  }

  // ============ STATISTICS ============

  /**
   * Obtener estadísticas de assignment
   */
  async getAssignmentStatistics(assignmentId: string): Promise<AssignmentStatistics> {
    try {
      console.log('📈 [assignmentService] Getting assignment statistics:', assignmentId);
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/statistics`),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Assignment statistics retrieved');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error getting assignment statistics:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener estadísticas');
    }
  }

  /**
   * Obtener progreso de estudiante en assignments
   */
  async getStudentProgress(courseId: string, studentId?: string): Promise<StudentAssignmentProgress> {
    try {
      console.log('📉 [assignmentService] Getting student progress for course:', courseId);
      const endpoint = studentId 
        ? `${API_ENDPOINTS.ASSIGNMENTS}/progress/${courseId}/${studentId}`
        : `${API_ENDPOINTS.ASSIGNMENTS}/progress/${courseId}/me`;
        
      const response = await axios.get(
        buildApiUrl(endpoint),
        { headers: getAuthHeaders() }
      );
      console.log('✅ [assignmentService] Student progress retrieved');
      return response.data;
    } catch (error: any) {
      console.error('❌ [assignmentService] Error getting student progress:', error);
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
