/**
 * Servicio para operaciones administrativas
 */

import { buildApiUrl, getAuthHeaders, API_ENDPOINTS } from '../config/api.config';

// ELIMINADO: Usar buildApiUrl() centralizado para evitar Mixed Content

interface APIError {
  response?: {
    status: number;
    data: {
      detail: string;
    };
  };
}

interface AdminStats {
  users_total: number;
  courses_total: number;
  users_new_month: number;
  courses_published: number;
}

class AdminService {
  private getHeaders() {
    return getAuthHeaders();
  }

  async getDashboardStats(): Promise<AdminStats> {
    try {
      console.log('🔍 [adminService] Fetching dashboard stats...');
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/dashboard`), {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [adminService] Dashboard stats error:', response.status, errorText);
        throw new Error(`Error fetching dashboard stats: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [adminService] Dashboard stats loaded:', data);
      return data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Dashboard stats exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error fetching dashboard stats';
      throw new Error(errorMessage);
    }
  }

  async getUsers(skip: number = 0, limit: number = 20) {
    try {
      console.log('🔍 [adminService] Fetching users with skip:', skip, 'limit:', limit);
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/users?skip=${skip}&limit=${limit}`), {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [adminService] Get users error:', response.status, errorText);
        throw new Error(`Error fetching users: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [adminService] Users loaded:', data.length || 0, 'users');
      return data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Get users exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error fetching users';
      throw new Error(errorMessage);
    }
  }

  async getCourses(skip: number = 0, limit: number = 20, isPublished?: boolean) {
    try {
      console.log('🔍 [adminService] Fetching courses with filters:', { skip, limit, isPublished });
      let url = buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses?skip=${skip}&limit=${limit}`);
      if (isPublished !== undefined) {
        url += `&is_published=${isPublished}`;
      }

      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [adminService] Get courses error:', response.status, errorText);
        throw new Error(`Error fetching courses: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [adminService] Courses loaded:', data.length || 0, 'courses');
      return data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Get courses exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error fetching courses';
      throw new Error(errorMessage);
    }
  }

  // Nuevos métodos para gestión avanzada de cursos
  async getCoursesWithFilters(filters?: {
    is_published?: boolean;
    category?: string;
    instructor_id?: string;
    skip?: number;
    limit?: number;
  }) {
    try {
      console.log('🔍 [adminService] Fetching courses with advanced filters:', filters);
      const params = new URLSearchParams();
      
      if (filters?.is_published !== undefined) {
        params.append('is_published', filters.is_published.toString());
      }
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.instructor_id) {
        params.append('instructor_id', filters.instructor_id);
      }
      if (filters?.skip) {
        params.append('skip', filters.skip.toString());
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      const response = await fetch(`${buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses`)}?${params.toString()}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [adminService] Filtered courses error:', response.status, errorText);
        throw new Error(`Error fetching filtered courses: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [adminService] Filtered courses loaded:', data.length || 0, 'courses');
      return data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Filtered courses exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error fetching filtered courses';
      throw new Error(errorMessage);
    }
  }
  
  async getCourse(courseId: string) {
    try {
      console.log('🔍 [adminService] Fetching course:', courseId);
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses/${courseId}`), {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [adminService] Get course error:', response.status, errorText);
        throw new Error(`Error fetching course: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [adminService] Course loaded:', data.title || courseId);
      return data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Get course exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error fetching course';
      throw new Error(errorMessage);
    }
  }
  
  async createCourse(courseData: FormData) {
    try {
      console.log('🔍 [adminService] Creating course with FormData');
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses`), {
        method: 'POST',
        headers: { 
          'Authorization': getAuthHeaders()['Authorization']
          // No incluir Content-Type para FormData
        },
        body: courseData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ [adminService] Create course error:', response.status, errorData);
        throw new Error(errorData.detail || `Error creating course: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [adminService] Course created successfully:', data.id || 'new course');
      return data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Create course exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error creating course';
      throw new Error(errorMessage);
    }
  }
  
  async updateCourse(courseId: string, courseData: FormData) {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses/${courseId}`), {
      method: 'PUT',
      headers: { 
        'Authorization': getAuthHeaders()['Authorization']
        // No incluir Content-Type para FormData
      },
      body: courseData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error updating course');
    }
    
    return response.json();
  }
  
  async toggleCoursePublication(courseId: string) {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses/${courseId}/publish`), {
      method: 'POST',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error toggling course publication');
    }
    
    return response.json();
  }
  
  async deleteCourse(courseId: string) {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses/${courseId}`), {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error deleting course');
    }
    
    return response.json();
  }
  
  async changeUserRole(userId: string, newRole: string) {
    try {
      console.log('🔍 [adminService] Changing user role:', { userId, newRole });
      const response = await fetch(buildApiUrl(`users/${userId}/role?new_role=${encodeURIComponent(newRole)}`), {
        method: 'PUT',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ [adminService] Change user role error:', response.status, errorData);
        throw new Error(errorData.detail || `Error changing user role: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [adminService] User role changed successfully:', { userId, newRole });
      return data;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Change user role exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error changing user role';
      throw new Error(errorMessage);
    }
  }
}

export const adminService = new AdminService();
export default adminService;
