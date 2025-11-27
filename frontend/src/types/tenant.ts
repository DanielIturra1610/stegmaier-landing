/**
 * Tenant Types
 * Definiciones de tipos para el sistema multi-tenant
 */

// ============================================
// Tenant Entity
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

// ============================================
// Tenant Status
// ============================================

export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export const TenantStatusLabels: Record<TenantStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  deleted: 'Eliminado'
};

export const TenantStatusColors: Record<TenantStatus, string> = {
  active: 'green',
  inactive: 'gray',
  suspended: 'yellow',
  deleted: 'red'
};

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

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

// ============================================
// API Response Types
// ============================================

export interface TenantListResponse {
  tenants: Tenant[];
  total: number;
  skip: number;
  limit: number;
}

export interface TenantDetailsResponse extends Tenant {
  users_count?: number;
  courses_count?: number;
  storage_used?: number;
  last_activity?: string;
}

// ============================================
// Tenant Statistics
// ============================================

export interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  inactive_tenants: number;
  suspended_tenants: number;
  total_users: number;
  total_courses: number;
}

// ============================================
// Form State Types
// ============================================

export interface TenantFormData {
  name: string;
  slug: string;
}

export interface TenantFormErrors {
  name?: string;
  slug?: string;
}

// ============================================
// Tenant Settings
// ============================================

export interface TenantSettings {
  tenant_id: string;
  max_users: number;
  max_courses: number;
  max_storage_gb: number;
  features: TenantFeatures;
  branding?: TenantBranding;
}

export interface TenantFeatures {
  certificates: boolean;
  analytics: boolean;
  custom_branding: boolean;
  api_access: boolean;
  sso: boolean;
  webhooks: boolean;
}

export interface TenantBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_domain?: string;
}

// ============================================
// User-Tenant Relationship
// ============================================

export interface UserTenantAssignment {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  assigned_at: string;
}

export type UserRole = 'student' | 'instructor' | 'admin' | 'superadmin';

export const UserRoleLabels: Record<UserRole, string> = {
  student: 'Estudiante',
  instructor: 'Instructor',
  admin: 'Administrador',
  superadmin: 'Super Administrador'
};

export const UserRoleHierarchy: Record<UserRole, number> = {
  student: 1,
  instructor: 2,
  admin: 3,
  superadmin: 4
};

// ============================================
// Helper Functions
// ============================================

/**
 * Verifica si un usuario tiene al menos el rol especificado
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return UserRoleHierarchy[userRole] >= UserRoleHierarchy[requiredRole];
}

/**
 * Verifica si un tenant está activo
 */
export function isTenantActive(tenant: Tenant): boolean {
  return tenant.status === 'active';
}

/**
 * Genera un slug desde un nombre
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Valida un slug
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,50}$/.test(slug);
}

/**
 * Preview del nombre de base de datos
 */
export function previewDatabaseName(slug: string): string {
  return `stegmaier_tenant_${slug}`;
}
