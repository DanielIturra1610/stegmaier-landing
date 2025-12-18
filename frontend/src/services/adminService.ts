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

// User creation interface
export interface CreateUserDTO {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'instructor' | 'admin' | 'superadmin';
  roles?: ('student' | 'instructor' | 'admin' | 'superadmin')[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
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

      // El backend devuelve { success: true, data: { users: [...], total_count, ... } }
      // Extraemos el array de usuarios
      const rawUsers = data?.data?.users || data?.users || (Array.isArray(data) ? data : []);

      // Mapear campos del backend al formato esperado por el frontend
      // El nuevo endpoint de tenant members devuelve user_created_at en lugar de created_at
      const users = rawUsers.map((user: any) => ({
        ...user,
        // El campo created_at puede venir como user_created_at del endpoint de tenant members
        created_at: user.created_at || user.user_created_at,
        // Asegurar que is_active está presente (puede estar en el root o como parte del membership)
        is_active: user.is_active ?? (user.status === 'active'),
      }));

      console.log('✅ [adminService] Users loaded:', users.length, 'users');
      return users;
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

  /**
   * POST /api/v1/tenants/users
   * Crea un nuevo usuario con rol específico en el tenant actual
   * Este endpoint crea el usuario Y su membership en el tenant
   */
  async createUser(userData: CreateUserDTO): Promise<User> {
    try {
      console.log('🔍 [adminService] Creating user in tenant:', { email: userData.email, role: userData.role });

      // Validación básica
      if (!userData.email || !userData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Email inválido');
      }

      if (!userData.password || userData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      if (!userData.full_name || userData.full_name.trim().length < 3) {
        throw new Error('El nombre completo debe tener al menos 3 caracteres');
      }

      if (!['student', 'instructor', 'admin'].includes(userData.role)) {
        throw new Error('Rol inválido. Debe ser: student, instructor o admin');
      }

      // Usar el endpoint de tenants que crea usuario + membership
      // La ruta es /api/v1/tenants/users (no /superadmin/tenants)
      const response = await fetch(buildApiUrl('/tenants/users'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ [adminService] Create user error:', response.status, errorData);

        // Manejar errores específicos
        if (response.status === 409) {
          throw new Error('Ya existe un usuario con ese email');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para crear usuarios');
        }

        throw new Error(errorData.detail || errorData.message || `Error creating user: ${response.status}`);
      }

      const result = await response.json();
      // El endpoint devuelve { success: true, data: { user_id, email, ... } }
      const user = result?.data || result;
      console.log('✅ [adminService] User created successfully:', user.user_id || user.id);

      return user;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Create user exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error creating user';
      throw new Error(errorMessage);
    }
  }

  /**
   * GET /api/v1/admin/users/:id
   * Obtiene un usuario específico por ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      console.log('🔍 [adminService] Fetching user:', userId);

      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/users/${userId}`), {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ [adminService] Get user by ID error:', response.status, errorData);

        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        }

        throw new Error(errorData.detail || `Error fetching user: ${response.status}`);
      }

      const result = await response.json();
      const user = result.data?.user || result;
      console.log('✅ [adminService] User loaded:', user.id);

      return user;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Get user by ID exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error fetching user';
      throw new Error(errorMessage);
    }
  }

  /**
   * PUT /api/v1/admin/users/:id
   * Actualiza un usuario existente
   */
  async updateUser(userId: string, updates: Partial<CreateUserDTO>): Promise<User> {
    try {
      console.log('🔍 [adminService] Updating user:', userId);

      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/users/${userId}`), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ [adminService] Update user error:', response.status, errorData);

        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para actualizar este usuario');
        }

        throw new Error(errorData.detail || `Error updating user: ${response.status}`);
      }

      const result = await response.json();
      const user = result.data?.user || result;
      console.log('✅ [adminService] User updated successfully:', user.id);

      return user;
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Update user exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error updating user';
      throw new Error(errorMessage);
    }
  }

  /**
   * DELETE /api/v1/admin/users/:id
   * Elimina un usuario (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log('🔍 [adminService] Deleting user:', userId);

      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ADMIN}/users/${userId}`), {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('❌ [adminService] Delete user error:', response.status, errorData);

        if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para eliminar este usuario');
        }

        throw new Error(errorData.detail || `Error deleting user: ${response.status}`);
      }

      console.log('✅ [adminService] User deleted successfully:', userId);
    } catch (error) {
      const apiError = error as APIError;
      console.error('❌ [adminService] Delete user exception:', apiError);
      const errorMessage = apiError.response?.data?.detail || (error as Error).message || 'Error deleting user';
      throw new Error(errorMessage);
    }
  }

  /**
   * Validación: Verifica fortaleza de contraseña
   * Retorna array de requisitos no cumplidos
   */
  validatePasswordStrength(password: string): string[] {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Al menos una letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Al menos un número');
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Al menos un carácter especial (@$!%*?&)');
    }

    return errors;
  }

  /**
   * Validación: Verifica si un email es válido
   */
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export const adminService = new AdminService();
export default adminService;
