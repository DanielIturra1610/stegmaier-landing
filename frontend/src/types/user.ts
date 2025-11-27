/**
 * User Types
 * Definiciones de tipos para gestión de usuarios
 */

import { UserRole } from './tenant';

// Re-export UserRole for backwards compatibility
export { UserRole } from './tenant';

// ============================================
// User Entity
// ============================================

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

export interface CreateUserDTO {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface UpdateUserDTO {
  email?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface ChangePasswordDTO {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// ============================================
// User Profile
// ============================================

export interface UserProfile extends User {
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  language?: string;
  enrolled_courses_count?: number;
  completed_courses_count?: number;
  certificates_count?: number;
}

// ============================================
// User List Response
// ============================================

export interface UserListResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

// ============================================
// User Statistics
// ============================================

export interface UserStats {
  total_users: number;
  active_users: number;
  verified_users: number;
  students_count: number;
  instructors_count: number;
  admins_count: number;
  new_users_this_month: number;
}

// ============================================
// User Filters
// ============================================

export interface UserFilters {
  role?: UserRole;
  is_verified?: boolean;
  is_active?: boolean;
  search?: string;
  created_after?: string;
  created_before?: string;
  skip?: number;
  limit?: number;
}

// ============================================
// Form State Types
// ============================================

export interface UserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: UserRole;
}

export interface UserFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_name?: string;
  role?: string;
}

// ============================================
// Password Validation
// ============================================

export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  isValid: boolean;
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Valida requisitos de contraseña
 */
export function validatePasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password)
  };
}

/**
 * Calcula score de fortaleza de contraseña
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = validatePasswordRequirements(password);
  const feedback: string[] = [];

  let score = 0;

  if (requirements.minLength) score++;
  else feedback.push('Mínimo 8 caracteres');

  if (requirements.hasUppercase) score++;
  else feedback.push('Al menos una mayúscula');

  if (requirements.hasLowercase) score++;
  else feedback.push('Al menos una minúscula');

  if (requirements.hasNumber) score++;
  else feedback.push('Al menos un número');

  if (requirements.hasSpecialChar) score++;
  else feedback.push('Al menos un carácter especial');

  const isValid = score === 5;

  return { score, feedback, isValid };
}

/**
 * Verifica si la contraseña es suficientemente fuerte
 */
export function isPasswordStrong(password: string): boolean {
  const { isValid } = calculatePasswordStrength(password);
  return isValid;
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Obtiene iniciales del nombre
 */
export function getUserInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Formatea fecha de última actividad
 */
export function formatLastActivity(lastLogin?: string): string {
  if (!lastLogin) return 'Nunca';

  const date = new Date(lastLogin);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

  return date.toLocaleDateString('es-ES');
}
