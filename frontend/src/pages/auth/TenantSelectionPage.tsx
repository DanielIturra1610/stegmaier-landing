/**
 * TenantSelectionPage
 * Página intermedia después del login donde el usuario debe seleccionar o crear un tenant
 * Flujo: Login → TenantSelection → Platform
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Tenant } from '../../types/tenant';
import { Building2, Plus, ChevronRight, Check } from 'lucide-react';
import CreateTenantModal from '../../components/tenant/CreateTenantModal';

const TenantSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, availableTenants, currentTenantId, setCurrentTenantId, loadAvailableTenants } = useAuth();

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(currentTenantId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar tenants al montar
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadAvailableTenants();
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Si ya tiene tenant seleccionado (por alguna razón), ir directo a plataforma
  useEffect(() => {
    if (currentTenantId && availableTenants.length > 0) {
      // Ya tiene tenant, puede ir a la plataforma
      // navigate('/platform');
    }
  }, [currentTenantId, availableTenants]);

  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setError(null);
  };

  const handleConfirmSelection = async () => {
    if (!selectedTenantId) return;

    try {
      setIsSelecting(true);
      setError(null);

      // Llamar al backend para seleccionar el tenant y obtener nuevo JWT
      await setCurrentTenantId(selectedTenantId);

      // MULTI-ROLE: Verificar si el usuario tiene múltiples roles después de seleccionar tenant
      const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
      if (userData.has_multiple_roles && userData.roles && userData.roles.length > 1) {
        console.log(`Usuario con múltiples roles detectado después de seleccionar tenant, redirigiendo a selección de rol`);
        navigate('/auth/role-selection', { state: { from: '/platform' } });
        return;
      }

      // Navegar a la plataforma
      navigate('/platform');
    } catch (err: any) {
      console.error('Error selecting tenant:', err);
      setError(err.message || 'Error al seleccionar la organización');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleTenantCreated = async (newTenant: Tenant) => {
    setShowCreateModal(false);
    try {
      // Recargar lista de tenants
      await loadAvailableTenants();

      // Auto-seleccionar el tenant recién creado y establecer contexto
      await setCurrentTenantId(newTenant.id);

      // Redirigir automáticamente al dashboard de admin
      // El usuario es automáticamente admin del tenant que creó
      navigate('/platform/admin/courses');
    } catch (err: any) {
      console.error('Error setting up new tenant:', err);
      setError(err.message || 'Error al configurar la organización');
      // Fallback: auto-seleccionar para que el usuario pueda confirmar manualmente
      setSelectedTenantId(newTenant.id);
    }
  };

  // UI Helper: Obtener iniciales del tenant
  const getTenantInitials = (name: string | undefined): string => {
    if (!name) return 'T';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // UI Helper: Obtener color del badge de estado
  const getStatusBadgeClass = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      deleted: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.inactive;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando organizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selecciona tu Organización
          </h1>
          <p className="text-gray-700">
            Elige la organización con la que deseas trabajar o crea una nueva
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tenants List */}
        {availableTenants.length > 0 ? (
          <div className="space-y-3 mb-6">
            {availableTenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelectTenant(tenant.id)}
                disabled={tenant.status !== 'active'}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all duration-200
                  flex items-center justify-between
                  ${tenant.status !== 'active'
                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                    : selectedTenantId === tenant.id
                      ? 'bg-indigo-50 border-indigo-600 shadow-md'
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                  }
                `}
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                    ${tenant.status === 'active' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-400'}
                  `}>
                    {getTenantInitials(tenant.name)}
                  </div>

                  {/* Info */}
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 text-lg">{tenant.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600 font-mono">
                        {tenant.slug}
                      </span>
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full font-medium
                        ${getStatusBadgeClass(tenant.status)}
                      `}>
                        {tenant.status === 'active' ? 'Activo' :
                         tenant.status === 'suspended' ? 'Suspendido' :
                         tenant.status === 'deleted' ? 'Eliminado' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Check icon */}
                {selectedTenantId === tenant.id && tenant.status === 'active' && (
                  <Check className="w-6 h-6 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg mb-6">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay organizaciones disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera organización para comenzar
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          {/* Create Tenant Button - Available for all users */}
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isSelecting}
            className="
              flex items-center gap-2 px-4 py-2
              text-indigo-600 hover:text-indigo-700
              border border-indigo-600 hover:border-indigo-700
              rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Plus className="w-5 h-5" />
            <span>Crear Nueva Organización</span>
          </button>

          {/* Continue Button */}
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedTenantId || isSelecting}
            className={`
              ml-auto flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
              transition-all duration-200
              ${selectedTenantId && !isSelecting
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSelecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Seleccionando...</span>
              </>
            ) : (
              <>
                <span>Continuar a la Plataforma</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          Conectado como: <span className="font-medium text-gray-900">{user?.email}</span>
          {' '} ({user?.role})
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTenantCreated}
        />
      )}
    </div>
  );
};

export default TenantSelectionPage;
