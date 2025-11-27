/**
 * Tenant Service
 * Servicio para gestión de tenants (organizaciones multi-tenant)
 * Solo accesible por usuarios con rol superadmin
 */

import { buildApiUrl, getAuthHeaders, API_ENDPOINTS } from '../config/api.config';

// ============================================
// Types & Interfaces
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  database_name: string;
  node_number: number;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
}

export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export interface CreateTenantDTO {
  name: string;
  slug: string;
  description?: string;
  email: string;
  phone: string;
  address?: string;
  website?: string;
}

export interface UpdateTenantDTO {
  name?: string;
  status?: TenantStatus;
}

export interface TenantListResponse {
  tenants: Tenant[];
  total: number;
  skip: number;
  limit: number;
}

interface APIError {
  response?: {
    status: number;
    data: {
      detail: string;
      message?: string;
    };
  };
  message?: string;
}

// ============================================
// Tenant Service Class
// ============================================

class TenantService {
  private readonly ENDPOINT = '/superadmin/tenants';

  /**
   * Obtiene headers de autenticación
   */
  private getHeaders(): HeadersInit {
    return getAuthHeaders();
  }

  /**
   * Maneja errores de API de forma consistente
   */
  private handleError(error: unknown, operation: string): never {
    const apiError = error as APIError;
    console.error(`❌ [tenantService] ${operation} error:`, apiError);

    const errorMessage =
      apiError.response?.data?.detail ||
      apiError.response?.data?.message ||
      apiError.message ||
      `Error en operación: ${operation}`;

    throw new Error(errorMessage);
  }

  /**
   * GET /api/v1/superadmin/tenants
   * Obtiene lista de tenants con paginación
   */
  async getTenants(skip: number = 0, limit: number = 20): Promise<TenantListResponse> {
    try {
      console.log('🔍 [tenantService] Fetching tenants with skip:', skip, 'limit:', limit);

      const url = buildApiUrl(`${this.ENDPOINT}?skip=${skip}&limit=${limit}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Get tenants error:', response.status, errorText);
        throw new Error(`Error fetching tenants: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [tenantService] Tenants loaded:', data.length || 0, 'tenants');

      return {
        tenants: data,
        total: data.length,
        skip,
        limit
      };
    } catch (error) {
      return this.handleError(error, 'getTenants');
    }
  }

  /**
   * POST /api/v1/superadmin/tenants
   * Crea un nuevo tenant
   */
  async createTenant(data: CreateTenantDTO): Promise<Tenant> {
    try {
      console.log('🔍 [tenantService] Creating tenant:', data);

      // Validación básica
      if (!data.name || data.name.trim().length < 3) {
        throw new Error('El nombre del tenant debe tener al menos 3 caracteres');
      }

      if (!data.slug || !data.slug.match(/^[a-z0-9-]+$/)) {
        throw new Error('El slug solo puede contener letras minúsculas, números y guiones');
      }

      const url = buildApiUrl(this.ENDPOINT);
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Create tenant error:', response.status, errorText);

        // Manejo de errores específicos
        if (response.status === 409) {
          throw new Error('Ya existe un tenant con ese slug');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para crear tenants');
        }

        throw new Error(`Error creando tenant: ${response.status}`);
      }

      const tenant = await response.json();
      console.log('✅ [tenantService] Tenant created:', tenant.id);

      return tenant;
    } catch (error) {
      return this.handleError(error, 'createTenant');
    }
  }

  /**
   * GET /api/v1/superadmin/tenants/:id
   * Obtiene un tenant por ID
   */
  async getTenantById(id: string): Promise<Tenant> {
    try {
      console.log('🔍 [tenantService] Fetching tenant:', id);

      if (!id) {
        throw new Error('ID de tenant requerido');
      }

      const url = buildApiUrl(`${this.ENDPOINT}/${id}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Get tenant by ID error:', response.status, errorText);

        if (response.status === 404) {
          throw new Error('Tenant no encontrado');
        }

        throw new Error(`Error obteniendo tenant: ${response.status}`);
      }

      const tenant = await response.json();
      console.log('✅ [tenantService] Tenant loaded:', tenant.id);

      return tenant;
    } catch (error) {
      return this.handleError(error, 'getTenantById');
    }
  }

  /**
   * PUT /api/v1/superadmin/tenants/:id
   * Actualiza un tenant
   */
  async updateTenant(id: string, data: UpdateTenantDTO): Promise<Tenant> {
    try {
      console.log('🔍 [tenantService] Updating tenant:', id, data);

      if (!id) {
        throw new Error('ID de tenant requerido');
      }

      // Validar que al menos un campo esté presente
      if (!data.name && !data.status) {
        throw new Error('Debe proporcionar al menos un campo para actualizar');
      }

      const url = buildApiUrl(`${this.ENDPOINT}/${id}`);
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Update tenant error:', response.status, errorText);

        if (response.status === 404) {
          throw new Error('Tenant no encontrado');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para actualizar este tenant');
        }

        throw new Error(`Error actualizando tenant: ${response.status}`);
      }

      const tenant = await response.json();
      console.log('✅ [tenantService] Tenant updated:', tenant.id);

      return tenant;
    } catch (error) {
      return this.handleError(error, 'updateTenant');
    }
  }

  /**
   * DELETE /api/v1/superadmin/tenants/:id
   * Elimina un tenant (soft delete)
   */
  async deleteTenant(id: string): Promise<void> {
    try {
      console.log('🔍 [tenantService] Deleting tenant:', id);

      if (!id) {
        throw new Error('ID de tenant requerido');
      }

      const url = buildApiUrl(`${this.ENDPOINT}/${id}`);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Delete tenant error:', response.status, errorText);

        if (response.status === 404) {
          throw new Error('Tenant no encontrado');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para eliminar este tenant');
        }
        if (response.status === 409) {
          throw new Error('No se puede eliminar un tenant con usuarios activos');
        }

        throw new Error(`Error eliminando tenant: ${response.status}`);
      }

      console.log('✅ [tenantService] Tenant deleted:', id);
    } catch (error) {
      return this.handleError(error, 'deleteTenant');
    }
  }

  /**
   * PATCH /api/v1/superadmin/tenants/:id/status
   * Cambia el estado de un tenant (activo, inactivo, suspendido)
   */
  async changeTenantStatus(id: string, status: TenantStatus): Promise<Tenant> {
    try {
      console.log('🔍 [tenantService] Changing tenant status:', id, 'to', status);

      return await this.updateTenant(id, { status });
    } catch (error) {
      return this.handleError(error, 'changeTenantStatus');
    }
  }

  /**
   * GET /api/v1/superadmin/tenants/:id/users
   * Obtiene usuarios de un tenant específico
   */
  async getTenantUsers(tenantId: string, skip: number = 0, limit: number = 20) {
    try {
      console.log('🔍 [tenantService] Fetching users for tenant:', tenantId);

      if (!tenantId) {
        throw new Error('ID de tenant requerido');
      }

      const url = buildApiUrl(`${this.ENDPOINT}/${tenantId}/users?skip=${skip}&limit=${limit}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Get tenant users error:', response.status, errorText);
        throw new Error(`Error fetching tenant users: ${response.status}`);
      }

      const users = await response.json();
      console.log('✅ [tenantService] Tenant users loaded:', users.length || 0, 'users');

      return users;
    } catch (error) {
      return this.handleError(error, 'getTenantUsers');
    }
  }

  /**
   * GET /api/v1/superadmin/tenants/:id/users/count
   * Obtiene el conteo de usuarios de un tenant
   */
  async getTenantUsersCount(tenantId: string): Promise<number> {
    try {
      console.log('🔍 [tenantService] Fetching user count for tenant:', tenantId);

      if (!tenantId) {
        throw new Error('ID de tenant requerido');
      }

      const url = buildApiUrl(`${this.ENDPOINT}/${tenantId}/users/count`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Get tenant user count error:', response.status, errorText);
        throw new Error(`Error fetching tenant user count: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [tenantService] Tenant user count:', data.count);

      return data.count || 0;
    } catch (error) {
      return this.handleError(error, 'getTenantUsersCount');
    }
  }

  /**
   * Utilidad: Genera slug desde nombre
   * Convierte "Acme Corporation" a "acme-corporation"
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-')          // Espacios a guiones
      .replace(/-+/g, '-')           // Múltiples guiones a uno
      .replace(/^-|-$/g, '');        // Remover guiones al inicio/fin
  }

  /**
   * Utilidad: Genera database name preview
   * Muestra cómo se verá el nombre de la base de datos
   */
  previewDatabaseName(slug: string): string {
    return `stegmaier_tenant_${slug}`;
  }

  /**
   * Validación: Verifica si un slug es válido
   */
  isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]{3,50}$/.test(slug);
  }

  /**
   * Validación: Verifica si un nombre es válido
   */
  isValidName(name: string): boolean {
    return name.trim().length >= 3 && name.trim().length <= 100;
  }

  // ============================================
  // Multi-Tenant User Methods
  // ============================================

  /**
   * GET /api/v1/tenants
   * Get all tenants for the current user (with their memberships)
   */
  async getUserTenants(): Promise<any[]> {
    try {
      console.log('🔍 [tenantService] Fetching user tenants');

      const url = buildApiUrl('/tenants');
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Get user tenants error:', response.status, errorText);
        throw new Error(`Error fetching user tenants: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [tenantService] User tenants loaded:', data.data?.length || 0);

      return data.data || [];
    } catch (error) {
      return this.handleError(error, 'getUserTenants');
    }
  }

  /**
   * GET /api/v1/tenants/invitations
   * Get pending invitations for the current user
   */
  async getPendingInvitations(): Promise<any[]> {
    try {
      console.log('🔍 [tenantService] Fetching pending invitations');

      const url = buildApiUrl('/tenants/invitations');
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Get invitations error:', response.status, errorText);
        throw new Error(`Error fetching invitations: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [tenantService] Invitations loaded:', data.data?.length || 0);

      return data.data || [];
    } catch (error) {
      return this.handleError(error, 'getPendingInvitations');
    }
  }

  /**
   * POST /api/v1/tenants
   * Create a new tenant (user becomes admin)
   */
  async createUserTenant(tenantData: CreateTenantDTO): Promise<any> {
    try {
      console.log('🔍 [tenantService] Creating user tenant:', tenantData);

      // DEBUG: Verificar token en localStorage
      const token = localStorage.getItem('auth_token');
      console.log('🔍 [tenantService] Token in localStorage:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      // Validación básica
      if (!tenantData.name || tenantData.name.trim().length < 3) {
        throw new Error('El nombre del tenant debe tener al menos 3 caracteres');
      }

      if (!tenantData.slug || !tenantData.slug.match(/^[a-z0-9-]+$/)) {
        throw new Error('El slug solo puede contener letras minúsculas, números y guiones');
      }

      if (!tenantData.email || !tenantData.email.includes('@')) {
        throw new Error('Email de contacto requerido');
      }

      if (!tenantData.phone || tenantData.phone.length < 9) {
        throw new Error('Teléfono requerido (mínimo 9 caracteres)');
      }

      const url = buildApiUrl('/tenants');
      const headers = this.getHeaders();

      // DEBUG: Verificar headers que se enviarán
      console.log('🔍 [tenantService] Headers to send:', headers);
      console.log('🔍 [tenantService] URL:', url);

      // Limpiar campos opcionales: convertir cadenas vacías a null
      const cleanedData = {
        ...tenantData,
        address: tenantData.address?.trim() || null,
        website: tenantData.website?.trim() || null,
      };

      console.log('🔍 [tenantService] Cleaned data to send:', cleanedData);

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Create user tenant error:', response.status, errorText);

        // Intentar parsear el mensaje de error del backend
        try {
          const errorData = JSON.parse(errorText);

          // Detectar errores de duplicación por slug
          if (errorData.message && errorData.message.includes('already exists')) {
            throw new Error('Ya existe una organización con ese slug. Por favor, elige otro slug único.');
          }

          // Detectar errores de validación
          if (errorData.message && errorData.message.includes('validation error')) {
            throw new Error(`Error de validación: ${errorData.message}`);
          }

          // Mostrar mensaje del backend si está disponible
          if (errorData.message) {
            throw new Error(errorData.message);
          }
        } catch (parseError) {
          // Si no se puede parsear, usar mensaje genérico
        }

        if (response.status === 409) {
          throw new Error('Ya existe una organización con ese slug');
        }

        throw new Error(`Error creando organización: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [tenantService] User tenant created:', data.data?.tenant_id);

      return data.data;
    } catch (error) {
      return this.handleError(error, 'createUserTenant');
    }
  }

  /**
   * POST /api/v1/tenants/select
   * Select a tenant (switches context and gets new JWT)
   */
  async selectTenant(tenantId: string): Promise<any> {
    try {
      console.log('🔍 [tenantService] Selecting tenant:', tenantId);

      if (!tenantId) {
        throw new Error('ID de tenant requerido');
      }

      const url = buildApiUrl('/tenants/select');
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ tenant_id: tenantId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Select tenant error:', response.status, errorText);
        throw new Error(`Error seleccionando tenant: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [tenantService] Tenant selected:', data.data?.tenant_id);

      return data.data;
    } catch (error) {
      return this.handleError(error, 'selectTenant');
    }
  }

  /**
   * POST /api/v1/tenants/invitations/accept
   * Accept an invitation
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      console.log('🔍 [tenantService] Accepting invitation:', invitationId);

      const url = buildApiUrl('/tenants/invitations/accept');
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ invitation_id: invitationId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Accept invitation error:', response.status, errorText);
        throw new Error(`Error aceptando invitación: ${response.status}`);
      }

      console.log('✅ [tenantService] Invitation accepted');
    } catch (error) {
      return this.handleError(error, 'acceptInvitation');
    }
  }

  /**
   * POST /api/v1/tenants/invitations/reject
   * Reject an invitation
   */
  async rejectInvitation(invitationId: string): Promise<void> {
    try {
      console.log('🔍 [tenantService] Rejecting invitation:', invitationId);

      const url = buildApiUrl('/tenants/invitations/reject');
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ invitation_id: invitationId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [tenantService] Reject invitation error:', response.status, errorText);
        throw new Error(`Error rechazando invitación: ${response.status}`);
      }

      console.log('✅ [tenantService] Invitation rejected');
    } catch (error) {
      return this.handleError(error, 'rejectInvitation');
    }
  }
}

// Exportar instancia singleton
const tenantService = new TenantService();
export default tenantService;
