import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de perfil del usuario
 * Permite ver y editar información del perfil
 */
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // En una implementación completa, aquí tendrías estados para los campos del formulario
  // y funciones para manejar la actualización del perfil

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona tu información personal y preferencias
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Información Personal</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <p className="text-sm text-yellow-600">
                La funcionalidad de edición de perfil estará disponible próximamente.
              </p>
              {/* Aquí iría el formulario de edición */}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre completo</p>
                <p className="mt-1 text-gray-900">{user ? `${user.firstName} ${user.lastName}` : 'No disponible'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Correo electrónico</p>
                <p className="mt-1 text-gray-900">{user?.email || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado de cuenta</p>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.verified 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user?.verified ? 'Verificado' : 'Pendiente de verificación'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de registro</p>
                <p className="mt-1 text-gray-900">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString() 
                    : 'No disponible'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Preferencias de Cuenta</h2>
          
          {/* Opciones de preferencias (simuladas) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Notificaciones por email</h3>
                <p className="text-sm text-gray-500">Recibe actualizaciones sobre nuevos cursos y contenido</p>
              </div>
              <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="translate-x-5 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Recordatorios de cursos</h3>
                  <p className="text-sm text-gray-500">Recibe recordatorios para continuar tus cursos</p>
                </div>
                <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <span className="translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
