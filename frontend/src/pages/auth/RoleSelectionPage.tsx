/**
 * RoleSelectionPage
 * Página para que usuarios con múltiples roles seleccionen su rol activo
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, GraduationCap, Shield, Star } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

interface RoleOption {
  value: 'student' | 'instructor' | 'admin' | 'superadmin';
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const roleOptions: RoleOption[] = [
  {
    value: 'student',
    label: 'Estudiante',
    description: 'Accede a cursos, lecciones y obtén certificados',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    value: 'instructor',
    label: 'Instructor',
    description: 'Crea y gestiona cursos, evalúa estudiantes',
    icon: User,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Gestiona usuarios, cursos y configuración',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    value: 'superadmin',
    label: 'Super Administrador',
    description: 'Control completo del sistema',
    icon: Star,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100'
  }
];

const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener roles disponibles del usuario
  const availableRoles = (user?.roles || []) as ('student' | 'instructor' | 'admin' | 'superadmin')[];
  const filteredRoleOptions = roleOptions.filter(option =>
    availableRoles.includes(option.value)
  );

  const handleRoleSelect = async (role: 'student' | 'instructor' | 'admin' | 'superadmin') => {
    setSelectedRole(role);
    setIsLoading(true);
    setError(null);

    try {
      // Cambiar el rol activo en el backend
      const response = await authService.switchRole(role);

      // Actualizar el contexto de autenticación
      if (response.user) {
        setUser({
          ...user!,
          role,
          active_role: role,
          roles: (response.user.roles || user?.roles) as ('student' | 'instructor' | 'admin' | 'superadmin')[] | undefined,
          has_multiple_roles: response.user.has_multiple_roles
        });
      }

      // Redirigir según el rol seleccionado
      const redirectTo = location.state?.from || getRoleDefaultRoute(role);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error('Error al cambiar rol:', err);
      setError(err.response?.data?.message || 'Error al cambiar de rol. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  const getRoleDefaultRoute = (role: string): string => {
    switch (role) {
      case 'student':
        return '/platform/dashboard';
      case 'instructor':
        return '/platform/instructor/dashboard';
      case 'admin':
      case 'superadmin':
        return '/platform/admin/dashboard';
      default:
        return '/platform/dashboard';
    }
  };

  if (!user || !user.has_multiple_roles) {
    // Si el usuario no tiene múltiples roles, redirigir a su dashboard
    navigate(getRoleDefaultRoute(user?.role || 'student'), { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selecciona tu Rol
          </h1>
          <p className="text-gray-600">
            Tienes múltiples roles asignados. Elige cómo deseas ingresar a la plataforma.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRoleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.value;
            const isDisabled = isLoading;

            return (
              <button
                key={option.value}
                onClick={() => !isDisabled && handleRoleSelect(option.value)}
                disabled={isDisabled}
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-200
                  ${isSelected ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${option.bgColor}
                `}
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-lg ${option.color.replace('text', 'bg').replace('600', '100')} mb-4`}>
                  <Icon className={`w-8 h-8 ${option.color}`} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {option.label}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm">
                  {option.description}
                </p>

                {/* Loading Indicator */}
                {isLoading && isSelected && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Cambiando rol...</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Puedes cambiar tu rol activo en cualquier momento desde el menú de tu perfil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
