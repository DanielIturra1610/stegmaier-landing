/**
 * TenantSelector Component
 * Dropdown selector para cambiar entre tenants (organizaciones)
 * Solo visible para usuarios con rol superadmin
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Tenant, isTenantActive } from '../../types/tenant';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface TenantSelectorProps {
  className?: string;
  showLabel?: boolean;
}

const TenantSelector: React.FC<TenantSelectorProps> = ({
  className = '',
  showLabel = true
}) => {
  const { currentTenantId, availableTenants, setCurrentTenantId, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Solo mostrar para superadmin o usuarios con múltiples tenants
  const shouldShowSelector = user?.role === 'superadmin' && availableTenants.length > 1;

  // Encontrar el tenant actual
  const currentTenant = availableTenants.find(t => t.id === currentTenantId);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Manejar selección de tenant
  const handleSelectTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setIsOpen(false);

    // Opcional: recargar página para refrescar datos
    // window.location.reload();
  };

  // No mostrar si el usuario no tiene acceso
  if (!shouldShowSelector) {
    return null;
  }

  // Obtener iniciales del tenant
  const getTenantInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Obtener badge de estado
  const getStatusBadge = (tenant: Tenant) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      deleted: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[tenant.status]}`}>
        {tenant.status}
      </span>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {/* Icon */}
        <Building2 className="w-4 h-4 text-gray-500" />

        {/* Current Tenant */}
        {showLabel && (
          <span className="max-w-[150px] truncate">
            {currentTenant ? currentTenant.name : 'Seleccionar tenant'}
          </span>
        )}

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Organización
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {availableTenants.length} {availableTenants.length === 1 ? 'tenant disponible' : 'tenants disponibles'}
            </p>
          </div>

          {/* Tenant List */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {availableTenants.map((tenant) => {
              const isActive = tenant.id === currentTenantId;
              const isActiveStatus = isTenantActive(tenant);

              return (
                <button
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant.id)}
                  disabled={!isActiveStatus}
                  className={`
                    w-full px-4 py-3 text-left flex items-center justify-between
                    transition-colors
                    ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    ${!isActiveStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Tenant Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm
                      ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                    `}>
                      {getTenantInitials(tenant.name)}
                    </div>

                    {/* Name & Slug */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                        {tenant.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {tenant.slug}
                      </p>
                    </div>
                  </div>

                  {/* Check Icon for Selected */}
                  {isActive && (
                    <Check className="flex-shrink-0 w-5 h-5 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Empty State */}
          {availableTenants.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay tenants disponibles</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantSelector;
