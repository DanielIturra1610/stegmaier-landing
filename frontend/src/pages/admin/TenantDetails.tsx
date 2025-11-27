/**
 * TenantDetails Page
 * Vista detallada de un tenant específico con información completa,
 * estadísticas de usuarios y opciones de gestión (solo superadmin)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Edit,
  Trash2,
  Database,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  Shield,
  Mail,
  Activity,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import tenantService from '../../services/tenantService';
import { Tenant, TenantStatus } from '../../types/tenant';
import { User } from '../../types/user';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/alert';

// Componente de información
const InfoCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color = 'bg-blue-100' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  </div>
);

// Componente de confirmación
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: string;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  confirmColor = 'bg-red-600 hover:bg-red-700'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>

          <p className="text-sm text-gray-600 mb-6">{message}</p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${confirmColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TenantDetails: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const { user } = useAuth();

  // Estados
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmColor?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Verificar permisos
  if (user?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert
          type="error"
          message="No tienes permisos para acceder a esta página"
        />
      </div>
    );
  }

  // Cargar datos del tenant
  const loadTenantData = async () => {
    if (!tenantId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Cargar información del tenant
      const tenantData = await tenantService.getTenantById(tenantId);
      setTenant(tenantData);

      // Cargar usuarios del tenant
      const usersResponse = await tenantService.getTenantUsers(tenantId, 0, 10);
      setUsers(usersResponse.users || []);

      // Cargar contador de usuarios
      const count = await tenantService.getTenantUsersCount(tenantId);
      setUserCount(count);
    } catch (err: any) {
      setError(err.message || 'Error al cargar información del tenant');
      console.error('Error loading tenant data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  // Handlers
  const handleChangeStatus = async (newStatus: TenantStatus) => {
    if (!tenant) return;

    try {
      await tenantService.changeTenantStatus(tenant.id, newStatus);
      setSuccess(`Estado del tenant actualizado a ${newStatus}`);
      loadTenantData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteTenant = async () => {
    if (!tenant) return;

    try {
      await tenantService.deleteTenant(tenant.id);
      setSuccess('Tenant eliminado exitosamente');
      setTimeout(() => {
        navigate('/platform/admin/tenants');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar tenant');
      setTimeout(() => setError(null), 5000);
    }
  };

  const openStatusConfirm = (newStatus: TenantStatus) => {
    if (!tenant) return;

    const statusLabels: Record<TenantStatus, string> = {
      active: 'activar',
      inactive: 'desactivar',
      suspended: 'suspender',
      deleted: 'eliminar',
    };

    setConfirmDialog({
      isOpen: true,
      title: `${statusLabels[newStatus].charAt(0).toUpperCase() + statusLabels[newStatus].slice(1)} Tenant`,
      message: `¿Estás seguro de que deseas ${statusLabels[newStatus]} "${tenant.name}"?`,
      confirmText: statusLabels[newStatus].charAt(0).toUpperCase() + statusLabels[newStatus].slice(1),
      confirmColor: newStatus === 'suspended' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700',
      onConfirm: () => {
        handleChangeStatus(newStatus);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const openDeleteConfirm = () => {
    if (!tenant) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Tenant',
      message: `¿Estás seguro de que deseas eliminar "${tenant.name}"? Esta acción no se puede deshacer y se eliminará la base de datos "${tenant.database_name}".`,
      confirmText: 'Eliminar',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => {
        handleDeleteTenant();
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // Obtener badge de estado
  const getStatusBadge = (status: TenantStatus) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Activo' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Inactivo' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Suspendido' },
      deleted: { color: 'bg-red-100 text-red-800', icon: Trash2, label: 'Eliminado' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener badge de rol
  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { color: string; label: string }> = {
      student: { color: 'bg-green-100 text-green-800', label: 'Estudiante' },
      instructor: { color: 'bg-blue-100 text-blue-800', label: 'Instructor' },
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      superadmin: { color: 'bg-red-100 text-red-800', label: 'SuperAdmin' },
    };

    const config = roleConfig[role] || { color: 'bg-gray-100 text-gray-800', label: role };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Shield className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Calcular estadísticas de usuarios
  const userStats = {
    total: userCount,
    students: users.filter((u) => u.role === 'student').length,
    instructors: users.filter((u) => u.role === 'instructor').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert type="error" message="Tenant no encontrado" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/platform/admin/tenants')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Tenants
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-gray-600 mt-1">Detalles del tenant</p>
            </div>
            <div className="ml-4">
              {getStatusBadge(tenant.status)}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            {tenant.status !== 'active' && (
              <button
                onClick={() => openStatusConfirm('active')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Activar
              </button>
            )}

            {tenant.status !== 'suspended' && (
              <button
                onClick={() => openStatusConfirm('suspended')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Ban className="w-5 h-5" />
                Suspender
              </button>
            )}

            <button
              onClick={openDeleteConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {success && (
        <div className="mb-6">
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        </div>
      )}

      {/* Información General */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Información del Tenant */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Información General
          </h2>

          <div className="space-y-4">
            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre</p>
                <p className="text-base text-gray-900 mt-1">{tenant.name}</p>
              </div>
            </div>

            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-600">Slug</p>
                <p className="text-base font-mono text-gray-900 mt-1">{tenant.slug}</p>
              </div>
            </div>

            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-600">Base de Datos</p>
                </div>
                <p className="text-base font-mono text-gray-900 break-all">{tenant.database_name}</p>
              </div>
            </div>

            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-600">Nodo</p>
                <p className="text-base text-gray-900 mt-1">Nodo #{tenant.node_number}</p>
              </div>
            </div>

            <div className="flex items-start justify-between py-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-600">Creado</p>
                </div>
                <p className="text-base text-gray-900">{formatDate(tenant.created_at)}</p>
              </div>
            </div>

            <div className="flex items-start justify-between py-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-600">Última Actualización</p>
                </div>
                <p className="text-base text-gray-900">{formatDate(tenant.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de Usuarios */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Estadísticas de Usuarios
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-blue-900">{userStats.total}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-600 mb-1">Estudiantes</p>
              <p className="text-3xl font-bold text-green-900">{userStats.students}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-600 mb-1">Instructores</p>
              <p className="text-3xl font-bold text-purple-900">{userStats.instructors}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm font-medium text-orange-600 mb-1">Admins</p>
              <p className="text-3xl font-bold text-orange-900">{userStats.admins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Usuarios Recientes</h2>
          <p className="text-sm text-gray-600 mt-1">Últimos usuarios registrados en este tenant</p>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay usuarios
            </h3>
            <p className="text-gray-600">
              Este tenant aún no tiene usuarios registrados
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || 'Sin nombre'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {users.length > 0 && userCount > users.length && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Mostrando {users.length} de {userCount} usuarios
            </p>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
      />
    </div>
  );
};

export default TenantDetails;
