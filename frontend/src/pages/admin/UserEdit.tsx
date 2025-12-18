/**
 * UserEdit Page
 * Página para editar usuarios existentes (cambiar roles, nombre, etc.)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Save
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import { UserRole } from '../../types/user';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  roles?: UserRole[];
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface EditUserFormValues {
  full_name: string;
  roles: UserRole[];
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'student',
    label: 'Estudiante',
    description: 'Puede inscribirse en cursos y completar lecciones'
  },
  {
    value: 'instructor',
    label: 'Instructor',
    description: 'Puede crear y gestionar cursos'
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Puede gestionar usuarios y configuración del tenant'
  }
];

const UserEditSchema = Yup.object().shape({
  full_name: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .required('Nombre completo requerido'),
  roles: Yup.array()
    .of(Yup.string().oneOf(['student', 'instructor', 'admin', 'superadmin']))
    .min(1, 'Debe seleccionar al menos un rol')
    .required('Debe seleccionar al menos un rol')
});

const UserEdit: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Verificar permisos
  if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role)) {
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

  // Cargar datos del usuario
  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        setError('ID de usuario no proporcionado');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const user = await adminService.getUserById(userId);
        setUserData({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role as UserRole,
          roles: (user as any).roles || [user.role as UserRole],
          is_active: (user as any).is_active ?? true,
          is_verified: user.is_verified,
          created_at: user.created_at
        });
      } catch (err: any) {
        setError(err.message || 'Error al cargar usuario');
        console.error('Error loading user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  // Manejar submit
  const handleSubmit = async (values: EditUserFormValues) => {
    if (!userId) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await adminService.updateUser(userId, {
        full_name: values.full_name,
        roles: values.roles,
        role: values.roles[0] // El primer rol como rol principal
      });

      setSuccess('Usuario actualizado exitosamente');

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/platform/users');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario');
      console.error('Error updating user:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Obtener roles disponibles según el rol del usuario actual
  const getAvailableRoles = (): typeof roleOptions => {
    if (currentUser?.role === 'superadmin') {
      return [
        ...roleOptions,
        {
          value: 'superadmin' as UserRole,
          label: 'Super Administrador',
          description: 'Acceso completo al sistema y todos los tenants'
        }
      ];
    }
    return roleOptions;
  };

  const availableRoles = getAvailableRoles();

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'No se pudo cargar el usuario'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Editar Usuario
            </h1>
            <p className="text-gray-600 mt-1">
              Modifica los datos y roles del usuario
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
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Éxito</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info del usuario */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {(userData?.full_name || userData?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{userData.email}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Rol actual: <Badge variant="secondary">{userData.role}</Badge>
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {userData.is_verified ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Email verificado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Email no verificado</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                {userData.is_active ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Usuario activo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Usuario inactivo</span>
                  </>
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Creado: {formatDate(userData.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de edición */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Editar Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <Formik
              initialValues={{
                full_name: userData.full_name || '',
                roles: userData.roles || [userData.role]
              }}
              validationSchema={UserEditSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, setFieldValue, errors, touched }) => (
                <Form className="space-y-6">
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
                        placeholder="Nombre del usuario"
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

                  {/* Roles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Roles del Usuario
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      Selecciona los roles que tendrá el usuario. El primer rol seleccionado será el rol principal.
                    </p>
                    <div className="space-y-3">
                      {availableRoles.map((role) => {
                        const isSelected = values.roles.includes(role.value);
                        return (
                          <label
                            key={role.value}
                            className={`
                              flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all
                              ${isSelected 
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:bg-gray-50'}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFieldValue('roles', [...values.roles, role.value]);
                                } else {
                                  const newRoles = values.roles.filter(r => r !== role.value);
                                  setFieldValue('roles', newRoles);
                                }
                              }}
                              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{role.label}</span>
                                {isSelected && values.roles[0] === role.value && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {errors.roles && touched.roles && (
                      <div className="mt-2 text-sm text-red-600">
                        {typeof errors.roles === 'string' ? errors.roles : 'Debe seleccionar al menos un rol'}
                      </div>
                    )}

                    {values.roles.length > 1 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              Usuario con múltiples roles
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              El usuario podrá cambiar entre estos roles después de iniciar sesión.
                              Roles seleccionados: {values.roles.map(r => 
                                availableRoles.find(ar => ar.value === r)?.label
                              ).join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving || Object.keys(errors).length > 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserEdit;
