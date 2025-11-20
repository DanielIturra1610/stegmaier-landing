/**
 * TenantManagement Page
 * Página completa de gestión de tenants (solo superadmin)
 * Incluye estadísticas, tabla, filtros, paginación y CRUD completo
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import tenantService from '../../services/tenantService';
import { Tenant, TenantStatus } from '../../types/tenant';
import CreateTenantModal from '../../components/tenant/CreateTenantModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/alert';

// Componente de estadísticas
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
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

const TenantManagement: React.FC = () => {
  const { user } = useAuth();

  // Estados
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Menú de acciones
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  // Cargar tenants
  const loadTenants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await tenantService.getTenants(0, 100);
      setTenants(response.tenants);
      setFilteredTenants(response.tenants);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tenants');
      console.error('Error loading tenants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let result = [...tenants];

    // Filtro de búsqueda
    if (searchTerm) {
      result = result.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.database_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      result = result.filter((tenant) => tenant.status === statusFilter);
    }

    setFilteredTenants(result);
    setCurrentPage(1); // Reset página al filtrar
  }, [searchTerm, statusFilter, tenants]);

  // Calcular estadísticas
  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    inactive: tenants.filter((t) => t.status === 'inactive').length,
    suspended: tenants.filter((t) => t.status === 'suspended').length,
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTenants = filteredTenants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);

  // Handlers
  const handleCreateSuccess = () => {
    setSuccess('Tenant creado exitosamente');
    loadTenants();
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      await tenantService.deleteTenant(tenantId);
      setSuccess('Tenant eliminado exitosamente');
      loadTenants();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar tenant');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleChangeStatus = async (tenantId: string, newStatus: TenantStatus) => {
    try {
      await tenantService.changeTenantStatus(tenantId, newStatus);
      setSuccess(`Estado del tenant actualizado a ${newStatus}`);
      loadTenants();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado');
      setTimeout(() => setError(null), 5000);
    }
  };

  const openDeleteConfirm = (tenant: Tenant) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Tenant',
      message: `¿Estás seguro de que deseas eliminar "${tenant.name}"? Esta acción no se puede deshacer y se eliminará la base de datos "${tenant.database_name}".`,
      confirmText: 'Eliminar',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => {
        handleDeleteTenant(tenant.id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const openStatusConfirm = (tenant: Tenant, newStatus: TenantStatus) => {
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
        handleChangeStatus(tenant.id, newStatus);
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
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              Gestión de Tenants
            </h1>
            <p className="text-gray-600 mt-2">
              Administra las organizaciones del sistema
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Tenant
          </button>
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Tenants"
          value={stats.total}
          icon={<Building2 className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Activos"
          value={stats.active}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Inactivos"
          value={stats.inactive}
          icon={<XCircle className="w-6 h-6 text-gray-600" />}
          color="bg-gray-100"
        />
        <StatCard
          title="Suspendidos"
          value={stats.suspended}
          icon={<AlertCircle className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-100"
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, slug o database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro de estado */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TenantStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="suspended">Suspendidos</option>
              <option value="deleted">Eliminados</option>
            </select>
          </div>
        </div>

        {/* Resultados */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredTenants.length} de {tenants.length} tenants
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : currentTenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron tenants
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primer tenant'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Crear Tenant
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Database
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {tenant.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600">
                          {tenant.slug}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600">
                          {tenant.database_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(tenant.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(tenant.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === tenant.id ? null : tenant.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>

                          {openMenuId === tenant.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      navigate(`/platform/admin/tenants/${tenant.id}`);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver detalles
                                  </button>

                                  {tenant.status !== 'active' && (
                                    <button
                                      onClick={() => {
                                        openStatusConfirm(tenant, 'active');
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-sm text-green-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Activar
                                    </button>
                                  )}

                                  {tenant.status !== 'suspended' && (
                                    <button
                                      onClick={() => {
                                        openStatusConfirm(tenant, 'suspended');
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-sm text-yellow-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Ban className="w-4 h-4" />
                                      Suspender
                                    </button>
                                  )}

                                  {tenant.status !== 'inactive' && (
                                    <button
                                      onClick={() => {
                                        openStatusConfirm(tenant, 'inactive');
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Desactivar
                                    </button>
                                  )}

                                  <div className="border-t border-gray-100 my-1" />

                                  <button
                                    onClick={() => {
                                      openDeleteConfirm(tenant);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow px-6 py-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  {/* Números de página */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modales */}
      <CreateTenantModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

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

export default TenantManagement;
