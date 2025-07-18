import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de perfil del usuario
 * Permite ver y editar información del perfil
 */
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // En una implementación completa, aquí tendrías estados para los campos del formulario
  // y funciones para manejar la actualización del perfil

  // Función para generar iniciales del usuario
  const getUserInitials = () => {
    if (!user) return 'U';
    
    // Si existe full_name, usar eso para generar iniciales
    if (user.full_name) {
      const nameParts = user.full_name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
      } else if (nameParts.length === 1 && nameParts[0]) {
        return nameParts[0].charAt(0);
      }
    }
    
    // Fallback a firstName y lastName si están disponibles
    const firstInitial = user.firstName ? user.firstName.charAt(0) : '';
    const lastInitial = user.lastName ? user.lastName.charAt(0) : '';
    
    // Si no hay iniciales disponibles, devolver 'U' por defecto
    return firstInitial || lastInitial ? `${firstInitial}${lastInitial}` : 'U';
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header con información del perfil destacada */}
      <header className="bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="h-24 w-24 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white">
                {getUserInitials()}
              </div>
              {user?.verified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Información de usuario */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold">
              {user ? (
                user.full_name ? 
                  user.full_name : 
                  (user.firstName || user.lastName ? 
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                    'Usuario')
              ) : 'Usuario'}
            </h1>
            <p className="text-primary-100 mt-1">
              {user?.email || 'Correo no disponible'}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-500 text-white">
                Estudiante
              </span>
              {user?.verified && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-500 text-white">
                  Verificado
                </span>
              )}
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-500 text-white">
                Desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex-shrink-0 flex flex-col space-y-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              {isEditing ? 'Cancelar' : 'Editar perfil'}
            </button>
          </div>
        </div>
      </header>
      
      {/* Navegación por pestañas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('personal')}
              className={`${activeTab === 'personal' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200`}
            >
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`${activeTab === 'preferences' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200`}
            >
              Preferencias
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`${activeTab === 'security' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200`}
            >
              Seguridad
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido dinámico según la pestaña activa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* Pestaña de información personal */}
          {activeTab === 'personal' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Información Personal</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input 
                        type="text" 
                        id="firstName"
                        name="firstName" 
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" 
                        defaultValue={user?.firstName || ''} 
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <input 
                        type="text" 
                        id="lastName"
                        name="lastName" 
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" 
                        defaultValue={user?.lastName || ''} 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                      <textarea 
                        id="bio"
                        name="bio" 
                        rows={3}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" 
                        placeholder="Cuéntanos sobre ti"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Guardar
                    </button>
                  </div>
                  <p className="text-xs text-center text-yellow-600 mt-2">
                    La funcionalidad de edición de perfil estará disponible próximamente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Información básica</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nombre completo</p>
                        <p className="mt-1 text-gray-900 font-medium">{user ? `${user.firstName} ${user.lastName}` : 'No disponible'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Correo electrónico</p>
                        <p className="mt-1 text-gray-900 font-medium">{user?.email || 'No disponible'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Estado de cuenta</p>
                        <p className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user?.verified 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user?.verified ? 'Verificado' : 'Pendiente de verificación'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Información adicional</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fecha de registro</p>
                        <p className="mt-1 text-gray-900 font-medium">
                          {user?.createdAt 
                            ? new Date(user.createdAt).toLocaleDateString('es-ES', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'No disponible'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Biografía</p>
                        <p className="mt-1 text-gray-500 italic">
                          No has proporcionado una biografía aún.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pestaña de preferencias */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Preferencias de Cuenta</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Notificaciones</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Notificaciones por email</h4>
                        <p className="text-sm text-gray-500">Recibe actualizaciones sobre nuevos cursos y contenido</p>
                      </div>
                      <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span className="translate-x-5 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Recordatorios de cursos</h4>
                          <p className="text-sm text-gray-500">Recibe recordatorios para continuar tus cursos</p>
                        </div>
                        <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                          <span className="translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Notificaciones de logros</h4>
                          <p className="text-sm text-gray-500">Recibe notificaciones cuando completes logros</p>
                        </div>
                        <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                          <span className="translate-x-5 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Preferencias de visualización</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Mostrar progreso en dashboard</h4>
                        <p className="text-sm text-gray-500">Ver tu progreso de cursos en el panel principal</p>
                      </div>
                      <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span className="translate-x-5 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Modo oscuro</h4>
                          <p className="text-sm text-gray-500">Cambiar entre modo claro y oscuro</p>
                        </div>
                        <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                          <span className="translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-yellow-600 mt-4">
                    La funcionalidad de preferencias estará disponible próximamente.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Pestaña de seguridad */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Seguridad de la cuenta</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Cambiar contraseña</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                      <input 
                        type="password" 
                        id="currentPassword"
                        name="currentPassword" 
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" 
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                      <input 
                        type="password" 
                        id="newPassword"
                        name="newPassword" 
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" 
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                      <input 
                        type="password" 
                        id="confirmPassword"
                        name="confirmPassword" 
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" 
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Actualizar contraseña
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Verificación en dos pasos</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Activa la verificación en dos pasos para añadir una capa extra de seguridad a tu cuenta.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Configurar verificación en dos pasos
                  </button>
                  <p className="text-xs text-center text-yellow-600 mt-4">
                    La funcionalidad de seguridad estará disponible próximamente.
                  </p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-medium text-red-800 mb-3">Zona de peligro</h3>
                  <p className="text-sm text-red-600 mb-4">
                    Esta acción no se puede deshacer. Eliminará permanentemente tu cuenta y todos tus datos.
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Eliminar cuenta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sección de actividad reciente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Actividad reciente</h2>
          
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <a href="#" className="font-medium text-primary-600">Inscripción a curso</a>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">Te has inscrito al curso "Introducción a la consultoría estratégica"</p>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Hace 2 días</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <a href="#" className="font-medium text-primary-600">Verificación de cuenta</a>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">Has verificado tu cuenta correctamente</p>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Hace 3 días</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              
              <li>
                <div className="relative">
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <a href="#" className="font-medium text-primary-600">Registro de cuenta</a>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">Te has registrado en la plataforma</p>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Hace 7 días</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
