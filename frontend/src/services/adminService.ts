/**
 * Servicio para operaciones administrativas
 */

import { buildApiUrl, getAuthHeaders, API_ENDPOINTS } from '../config/api.config';

// ELIMINADO: Usar buildApiUrl() centralizado para evitar Mixed Content

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
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/dashboard`), {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching dashboard stats');
    }

    return await response.json();
  }

  async getUsers(skip: number = 0, limit: number = 20) {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/users?skip=${skip}&limit=${limit}`), {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching users');
    }

    return await response.json();
  }

  async getCourses(skip: number = 0, limit: number = 20, isPublished?: boolean) {
    let url = buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses?skip=${skip}&limit=${limit}`);
    if (isPublished !== undefined) {
      url += `&is_published=${isPublished}`;
    }

    const response = await fetch(url, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching courses');
    }

    return await response.json();
  }

  // Nuevos métodos para gestión avanzada de cursos
  async getCoursesWithFilters(filters?: {
    is_published?: boolean;
    category?: string;
    instructor_id?: string;
    skip?: number;
    limit?: number;
  }) {
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
      throw new Error('Error fetching courses');
    }
    
    return response.json();
  }
  
  async getCourse(courseId: string) {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses/${courseId}`), {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error fetching course');
    }
    
    return response.json();
  }
  
  async createCourse(courseData: FormData) {
    const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/courses`), {
      method: 'POST',
      headers: { 
        'Authorization': getAuthHeaders()['Authorization']
        // No incluir Content-Type para FormData
      },
      body: courseData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error creating course');
    }
    
    return response.json();
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
    const response = await fetch(buildApiUrl(`users/${userId}/role?new_role=${encodeURIComponent(newRole)}`), {
      method: 'PUT',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error changing user role');
    }
    
    return response.json();
  }
}

export const adminService = new AdminService();
export default adminService;
