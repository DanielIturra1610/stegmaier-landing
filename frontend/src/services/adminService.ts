/**
 * Servicio para operaciones administrativas
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:8000/api/v1';

interface AdminStats {
  users_total: number;
  courses_total: number;
  users_new_month: number;
  courses_published: number;
}

class AdminService {
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getDashboardStats(): Promise<AdminStats> {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching dashboard stats');
    }

    return await response.json();
  }

  async getUsers(skip: number = 0, limit: number = 20) {
    const response = await fetch(`${API_BASE_URL}/admin/users?skip=${skip}&limit=${limit}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Error fetching users');
    }

    return await response.json();
  }

  async getCourses(skip: number = 0, limit: number = 20, isPublished?: boolean) {
    let url = `${API_BASE_URL}/admin/courses?skip=${skip}&limit=${limit}`;
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
    
    const response = await fetch(`${API_BASE_URL}/admin/courses?${params.toString()}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error fetching courses');
    }
    
    return response.json();
  }
  
  async getCourse(courseId: string) {
    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error fetching course');
    }
    
    return response.json();
  }
  
  async createCourse(courseData: FormData) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/courses`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`
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
    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/publish`, {
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
    const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error deleting course');
    }
    
    return response.json();
  }
}

export const adminService = new AdminService();
export default adminService;
