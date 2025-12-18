export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  full_name?: string; // Agregado para soportar la respuesta del backend
  role: 'student' | 'instructor' | 'admin' | 'superadmin';
  roles?: ('student' | 'instructor' | 'admin' | 'superadmin')[]; // All assigned roles
  active_role?: 'student' | 'instructor' | 'admin' | 'superadmin'; // Currently active role
  has_multiple_roles?: boolean; // Flag indicating multiple roles
  profileImage?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponseUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  roles?: string[]; // All assigned roles
  active_role?: string; // Currently active role
  has_multiple_roles?: boolean; // Flag for multi-role users
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  username: string;
  email: string;
  role: string;
  roles?: string[]; // All assigned roles
  active_role?: string; // Currently active role
  has_multiple_roles?: boolean; // Flag for multi-role users
  message?: string;
  // User object from backend
  user?: AuthResponseUser;
  // Campos adicionales para soporte de nombre completo y fechas
  first_name?: string;
  last_name?: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
}
