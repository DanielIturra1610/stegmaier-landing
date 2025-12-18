/**
 * UserCreation Page
 * Página para crear nuevos usuarios (Admin e Instructor pueden crear estudiantes)
 * Incluye validación de contraseña, indicador de fortaleza y gestión de roles
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import { CreateUserDTO, UserRole, validatePasswordRequirements, isPasswordStrong } from '../../types/user';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Componente de indicador de fortaleza de contraseña
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const requirements = validatePasswordRequirements(password);

  const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-300" />
      )}
      <span className={`text-sm ${met ? 'text-green-700' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
      <p className="text-sm font-medium text-gray-700 mb-3">
        Requisitos de contraseña:
      </p>
      <div className="space-y-2">
        <RequirementItem met={requirements.minLength} text="Mínimo 8 caracteres" />
        <RequirementItem met={requirements.hasUppercase} text="Al menos una mayúscula" />
        <RequirementItem met={requirements.hasLowercase} text="Al menos una minúscula" />
        <RequirementItem met={requirements.hasNumber} text="Al menos un número" />
        <RequirementItem met={requirements.hasSpecialChar} text="Al menos un carácter especial (@$!%*?&)" />
      </div>
    </div>
  );
};

// Validación con Yup
const UserSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email inválido')
    .required('Email requerido'),
  password: Yup.string()
    .min(8, 'Mínimo 8 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .matches(/[a-z]/, 'Debe contener al menos una minúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número')
    .matches(/[@$!%*?&]/, 'Debe contener al menos un carácter especial (@$!%*?&)')
    .required('Contraseña requerida'),
  full_name: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('Nombre completo requerido'),
  role: Yup.string()
    .oneOf(['student', 'instructor', 'admin', 'superadmin'], 'Rol inválido')
    .required('Rol requerido')
});

const UserCreation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Determinar roles disponibles según el rol del usuario actual
  const getAvailableRoles = (): { value: UserRole; label: string; description: string }[] => {
    const allRoles = [
      {
        value: 'student' as UserRole,
        label: 'Estudiante',
        description: 'Puede inscribirse en cursos y completar lecciones'
      },
      {
        value: 'instructor' as UserRole,
        label: 'Instructor',
        description: 'Puede crear y gestionar cursos'
      },
      {
        value: 'admin' as UserRole,
        label: 'Administrador',
        description: 'Puede gestionar usuarios y configuración del tenant'
      },
      {
        value: 'superadmin' as UserRole,
        label: 'Super Administrador',
        description: 'Acceso completo al sistema y todos los tenants'
      }
    ];

    // Superadmin puede crear todos los roles
    if (user?.role === 'superadmin') {
      return allRoles;
    }

    // Admin puede crear estudiantes, instructores y otros admins
    if (user?.role === 'admin') {
      return allRoles.filter((r) => r.value !== 'superadmin');
    }

    // Instructor solo puede crear estudiantes
    if (user?.role === 'instructor') {
      return allRoles.filter((r) => r.value === 'student');
    }

    // Por defecto, solo estudiantes
    return allRoles.filter((r) => r.value === 'student');
  };

  const availableRoles = getAvailableRoles();

  // Verificar permisos
  if (!user || !['instructor', 'admin', 'superadmin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a esta página
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Manejar submit
  const handleSubmit = async (
    values: CreateUserDTO,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      setError(null);
      setSuccess(null);

      // Combinar rol principal con roles adicionales (sin duplicados)
      const allRoles = new Set<string>([values.role]);
      if (values.roles && values.roles.length > 0) {
        values.roles.forEach(r => allRoles.add(r));
      }
      
      // Crear payload con roles combinados
      const payload = {
        ...values,
        roles: Array.from(allRoles)
      };

      console.log('📤 Creating user with roles:', payload.roles);

      // Crear usuario
      await adminService.createUser(payload);

      // Mostrar éxito
      setSuccess(`Usuario ${values.email} creado exitosamente`);

      // Reset formulario
      resetForm();

      // Opcional: redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/platform/users');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear usuario';
      setError(errorMsg);
      console.error('Error creating user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Crear Nuevo Usuario
            </h1>
            <p className="text-gray-600 mt-1">
              Registra un nuevo usuario en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {success && (
        <div className="mb-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Formulario */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-8">
          <Formik
            initialValues={{
              email: '',
              password: '',
              full_name: '',
              role: availableRoles[0]?.value || 'student',
              roles: [] as UserRole[]
            }}
            validationSchema={UserSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ values, isSubmitting, errors, touched }) => (
              <Form className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      className={`
                        w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.email && touched.email ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Nombre completo */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Field
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Juan Pérez"
                      className={`
                        w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.full_name && touched.full_name ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                  </div>
                  <ErrorMessage
                    name="full_name"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`
                        w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.password && touched.password ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="mt-1 text-sm text-red-600"
                  />

                  {/* Indicador de fortaleza */}
                  {values.password && (
                    <PasswordStrengthIndicator password={values.password} />
                  )}
                </div>

                {/* Rol Principal */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Rol Principal
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Field
                      as="select"
                      id="role"
                      name="role"
                      className={`
                        w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none
                        ${errors.role && touched.role ? 'border-red-300' : 'border-gray-300'}
                      `}
                    >
                      {availableRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </Field>
                  </div>

                  {/* Descripción del rol seleccionado */}
                  {values.role && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {availableRoles.find((r) => r.value === values.role)?.label}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            {availableRoles.find((r) => r.value === values.role)?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Roles Adicionales (Opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Roles Adicionales (Opcional)
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Selecciona roles adicionales si el usuario necesita acceso a múltiples funciones
                  </p>
                  <div className="space-y-3">
                    {availableRoles.map((role) => (
                      <label
                        key={role.value}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <Field
                          type="checkbox"
                          name="roles"
                          value={role.value}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{role.label}</div>
                          <div className="text-sm text-gray-600">{role.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {values.roles && values.roles.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-900">
                        Roles seleccionados: {values.roles.length + 1} 
                        (Principal: {availableRoles.find(r => r.value === values.role)?.label})
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        El usuario podrá cambiar entre estos roles después de iniciar sesión
                      </p>
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        Información importante
                      </p>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                        <li>El usuario recibirá un email con sus credenciales de acceso</li>
                        <li>Se recomienda que el usuario cambie su contraseña en el primer inicio de sesión</li>
                        <li>Los permisos del usuario dependerán del rol asignado</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || Object.keys(errors).length > 0}
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Creando usuario...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Crear Usuario</span>
                      </>
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* Ayuda adicional */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Jerarquía de Roles
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-medium text-gray-900">Estudiante</p>
                <p className="text-sm text-gray-600">Nivel más básico, solo puede acceder a cursos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium text-gray-900">Instructor</p>
                <p className="text-sm text-gray-600">Puede crear cursos y gestionar estudiantes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mt-2" />
              <div>
                <p className="font-medium text-gray-900">Administrador</p>
                <p className="text-sm text-gray-600">Gestiona usuarios y configuración del tenant</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2" />
              <div>
                <p className="font-medium text-gray-900">Super Administrador</p>
                <p className="text-sm text-gray-600">Acceso total al sistema y gestión de tenants</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCreation;
