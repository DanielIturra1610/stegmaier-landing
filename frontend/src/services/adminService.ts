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
}

export const adminService = new AdminService();
export default adminService;
