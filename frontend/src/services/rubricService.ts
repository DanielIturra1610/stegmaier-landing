/**
 * Rubric Service - Handles all rubric-related API calls
 * Backend endpoints: internal/controllers/assignments.go
 */
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../config/api.config';
import type { Rubric, RubricCriterion } from '../types/assignment';

// ============================================================
// TypeScript Interfaces (matching backend DTOs)
// ============================================================

export interface CreateRubricRequest {
  name: string;
  description?: string;
  criteria: RubricCriterion[];
  is_template?: boolean;
}

export interface UpdateRubricRequest {
  name?: string;
  description?: string;
  criteria?: RubricCriterion[];
  is_template?: boolean;
}

export interface RubricResponse {
  id: string;
  tenantId: string;
  createdBy: string;
  name: string;
  description?: string;
  criteria: RubricCriterion[];
  is_template: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListRubricsResponse {
  rubrics: RubricResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// Rubric Service Class
// ============================================================

class RubricService {
  /**
   * Create a new rubric
   * POST /api/v1/rubrics
   */
  async createRubric(data: CreateRubricRequest): Promise<RubricResponse> {
    try {
      console.log('📝 [rubricService] Creating rubric:', data.name);

      const response = await axios.post<RubricResponse>(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/rubrics`),
        data,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [rubricService] Rubric created:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ [rubricService] Error creating rubric:', error);
      throw new Error(error.response?.data?.error || 'Failed to create rubric');
    }
  }

  /**
   * Get a rubric by ID
   * GET /api/v1/rubrics/:id
   */
  async getRubric(rubricId: string): Promise<RubricResponse> {
    try {
      console.log('🔍 [rubricService] Getting rubric:', rubricId);

      const response = await axios.get<RubricResponse>(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/rubrics/${rubricId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [rubricService] Rubric retrieved');
      return response.data;
    } catch (error: any) {
      console.error('❌ [rubricService] Error getting rubric:', error);
      throw new Error(error.response?.data?.error || 'Failed to get rubric');
    }
  }

  /**
   * Get all rubrics for current tenant
   * GET /api/v1/rubrics
   */
  async getTenantRubrics(page = 1, pageSize = 20): Promise<ListRubricsResponse> {
    try {
      console.log('📚 [rubricService] Getting tenant rubrics');

      const response = await axios.get<ListRubricsResponse>(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/rubrics`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );

      console.log('✅ [rubricService] Retrieved rubrics:', response.data.totalCount);
      return response.data;
    } catch (error: any) {
      console.error('❌ [rubricService] Error getting rubrics:', error);
      throw new Error(error.response?.data?.error || 'Failed to get rubrics');
    }
  }

  /**
   * Get rubric templates
   * GET /api/v1/rubrics/templates
   */
  async getRubricTemplates(): Promise<RubricResponse[]> {
    try {
      console.log('📋 [rubricService] Getting rubric templates');

      const response = await axios.get<RubricResponse[]>(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/rubrics/templates`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [rubricService] Retrieved templates:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [rubricService] Error getting templates:', error);
      throw new Error(error.response?.data?.error || 'Failed to get rubric templates');
    }
  }

  /**
   * Update a rubric
   * PUT /api/v1/rubrics/:id
   */
  async updateRubric(rubricId: string, data: UpdateRubricRequest): Promise<RubricResponse> {
    try {
      console.log('✏️ [rubricService] Updating rubric:', rubricId);

      const response = await axios.put<RubricResponse>(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/rubrics/${rubricId}`),
        data,
        { headers: getAuthHeaders() }
      );

      console.log('✅ [rubricService] Rubric updated');
      return response.data;
    } catch (error: any) {
      console.error('❌ [rubricService] Error updating rubric:', error);
      throw new Error(error.response?.data?.error || 'Failed to update rubric');
    }
  }

  /**
   * Delete a rubric
   * DELETE /api/v1/rubrics/:id
   */
  async deleteRubric(rubricId: string): Promise<void> {
    try {
      console.log('🗑️ [rubricService] Deleting rubric:', rubricId);

      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/rubrics/${rubricId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [rubricService] Rubric deleted');
    } catch (error: any) {
      console.error('❌ [rubricService] Error deleting rubric:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete rubric');
    }
  }

  /**
   * Attach a rubric to an assignment
   * POST /api/v1/assignments/:assignmentId/rubric/:rubricId
   */
  async attachRubricToAssignment(assignmentId: string, rubricId: string): Promise<void> {
    try {
      console.log('🔗 [rubricService] Attaching rubric to assignment:', { assignmentId, rubricId });

      await axios.post(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/rubric/${rubricId}`),
        {},
        { headers: getAuthHeaders() }
      );

      console.log('✅ [rubricService] Rubric attached to assignment');
    } catch (error: any) {
      console.error('❌ [rubricService] Error attaching rubric:', error);
      throw new Error(error.response?.data?.error || 'Failed to attach rubric to assignment');
    }
  }

  /**
   * Detach rubric from assignment
   * DELETE /api/v1/assignments/:assignmentId/rubric
   */
  async detachRubricFromAssignment(assignmentId: string): Promise<void> {
    try {
      console.log('🔗 [rubricService] Detaching rubric from assignment:', assignmentId);

      await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/rubric`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [rubricService] Rubric detached from assignment');
    } catch (error: any) {
      console.error('❌ [rubricService] Error detaching rubric:', error);
      throw new Error(error.response?.data?.error || 'Failed to detach rubric from assignment');
    }
  }

  /**
   * Get rubric for an assignment
   * GET /api/v1/assignments/:assignmentId/rubric
   */
  async getAssignmentRubric(assignmentId: string): Promise<RubricResponse | null> {
    try {
      console.log('🔍 [rubricService] Getting assignment rubric:', assignmentId);

      const response = await axios.get<RubricResponse>(
        buildApiUrl(`${API_ENDPOINTS.ASSIGNMENTS}/${assignmentId}/rubric`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [rubricService] Assignment rubric retrieved');
      return response.data;
    } catch (error: any) {
      // If no rubric attached, return null instead of throwing
      if (error.response?.status === 404) {
        console.log('ℹ️ [rubricService] No rubric attached to assignment');
        return null;
      }
      console.error('❌ [rubricService] Error getting assignment rubric:', error);
      throw new Error(error.response?.data?.error || 'Failed to get assignment rubric');
    }
  }
}

// Export singleton instance
const rubricService = new RubricService();
export default rubricService;
