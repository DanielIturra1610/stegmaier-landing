import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de configuración de la plataforma
 * Permite al usuario gestionar preferencias, notificaciones y ajustes generales
 */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'appearance' | 'advanced'>('general');
  
  // Estados para opciones de configuración
  const [settings, setSettings] = useState({
    general: {
      language: 'es',
      timeZone: 'America/Santiago',
      emailNotifications: true,
    },
    notifications: {
      courseUpdates: true,
      newLessons: true,
      completionReminders: true,
      marketingEmails: false,
      achievements: true,
    },
    appearance: {
      theme: 'light',
      fontScale: 'medium',
      reducedMotion: false,
      highContrast: false,
    },
    advanced: {
      autoPlay: true,
      autoAdvance: false,
      downloadTranscripts: true,
      showCaptions: false,
    }
  });

  // Función para cambiar configuraciones booleanas
  const handleToggle = (category: 'general' | 'notifications' | 'appearance' | 'advanced', setting: string) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: !settings[category][setting as keyof typeof settings[typeof category]]
      }
    });
  };

  // Función para cambiar valores de selección
  const handleSelectChange = (category: 'general' | 'notifications' | 'appearance' | 'advanced', setting: string, value: string) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    });
  };

  // Clases para pestañas activas/inactivas
  const getTabClasses = (tab: 'general' | 'notifications' | 'appearance' | 'advanced') => {
    return activeTab === tab
      ? "text-primary-600 border-b-2 border-primary-600 px-4 py-2 font-medium text-sm"
      : "text-gray-500 hover:text-gray-700 px-4 py-2 font-medium text-sm cursor-pointer border-b-2 border-transparent hover:border-gray-300";
  };

  // Componente para toggles de configuración
  const ToggleSwitch: React.FC<{
    label: string;
    description?: string;
    isChecked: boolean;
    onChange: () => void;
  }> = ({ label, description, isChecked, onChange }) => {
    return (
      <div className="flex items-center justify-between py-3">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{label}</h4>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <button
          type="button"
          className={`${
            isChecked ? 'bg-primary-600' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
          role="switch"
          aria-checked={isChecked}
          onClick={onChange}
        >
          <span className="sr-only">{label}</span>
          <span
            aria-hidden="true"
            className={`${
              isChecked ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>
    );
  };

  // Componente para selección de opciones
  const SelectOption: React.FC<{
    label: string;
    description?: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }> = ({ label, description, options, value, onChange }) => {
    return (
      <div className="py-3">
        <div className="mb-1">
          <label htmlFor={label.toLowerCase().replace(/\s+/g, '-')} className="text-sm font-medium text-gray-900">
            {label}
          </label>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <select
          id={label.toLowerCase().replace(/\s+/g, '-')}
          name={label.toLowerCase().replace(/\s+/g, '-')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera */}
      <header className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus preferencias y ajustes de la plataforma
        </p>
      </header>

      {/* Contenido principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Navegación por pestañas */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={getTabClasses('general')}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={getTabClasses('notifications')}
            >
              Notificaciones
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={getTabClasses('appearance')}
            >
              Apariencia
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={getTabClasses('advanced')}
            >
              Avanzado
            </button>
          </nav>
        </div>
        
        {/* Contenido de cada pestaña */}
        <div className="p-6">
          {/* Configuración general */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Configuración General
              </h2>

              <SelectOption
                label="Idioma"
                description="Idioma de la plataforma"
                options={[
                  { value: 'es', label: 'Español' },
                  { value: 'en', label: 'English' },
                  { value: 'pt', label: 'Português' }
                ]}
                value={settings.general.language}
                onChange={(value) => handleSelectChange('general', 'language', value)}
              />

              <SelectOption
                label="Zona horaria"
                description="Zona horaria para fechas y horarios"
                options={[
                  { value: 'America/Santiago', label: 'Santiago (GMT-4)' },
                  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
                  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
                  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
                  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' }
                ]}
                value={settings.general.timeZone}
                onChange={(value) => handleSelectChange('general', 'timeZone', value)}
              />

              <div className="border-t border-gray-200 pt-4 mt-4">
                <ToggleSwitch
                  label="Notificaciones por correo"
                  description="Recibir notificaciones importantes por correo electrónico"
                  isChecked={settings.general.emailNotifications}
                  onChange={() => handleToggle('general', 'emailNotifications')}
                />
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          )}

          {/* Configuración de notificaciones */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Preferencias de Notificaciones
              </h2>

              <div className="divide-y divide-gray-200">
                <ToggleSwitch
                  label="Actualizaciones de cursos"
                  description="Recibir notificaciones cuando los cursos se actualicen"
                  isChecked={settings.notifications.courseUpdates}
                  onChange={() => handleToggle('notifications', 'courseUpdates')}
                />

                <ToggleSwitch
                  label="Nuevas lecciones"
                  description="Notificaciones cuando se añadan nuevas lecciones a tus cursos"
                  isChecked={settings.notifications.newLessons}
                  onChange={() => handleToggle('notifications', 'newLessons')}
                />

                <ToggleSwitch
                  label="Recordatorios de finalización"
                  description="Recordatorios para continuar cursos en progreso"
                  isChecked={settings.notifications.completionReminders}
                  onChange={() => handleToggle('notifications', 'completionReminders')}
                />

                <ToggleSwitch
                  label="Emails de marketing"
                  description="Recibir información sobre nuevos cursos y ofertas"
                  isChecked={settings.notifications.marketingEmails}
                  onChange={() => handleToggle('notifications', 'marketingEmails')}
                />

                <ToggleSwitch
                  label="Logros y certificados"
                  description="Notificaciones cuando obtengas logros o certificados"
                  isChecked={settings.notifications.achievements}
                  onChange={() => handleToggle('notifications', 'achievements')}
                />
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          )}

          {/* Configuración de apariencia */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Apariencia y Accesibilidad
              </h2>

              <SelectOption
                label="Tema"
                description="Apariencia visual de la plataforma"
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'system', label: 'Ajuste del sistema' }
                ]}
                value={settings.appearance.theme}
                onChange={(value) => handleSelectChange('appearance', 'theme', value)}
              />

              <SelectOption
                label="Tamaño de fuente"
                description="Escala del texto en la plataforma"
                options={[
                  { value: 'small', label: 'Pequeño' },
                  { value: 'medium', label: 'Mediano' },
                  { value: 'large', label: 'Grande' }
                ]}
                value={settings.appearance.fontScale}
                onChange={(value) => handleSelectChange('appearance', 'fontScale', value)}
              />

              <div className="divide-y divide-gray-200 pt-2">
                <ToggleSwitch
                  label="Movimiento reducido"
                  description="Reducir o eliminar animaciones y transiciones"
                  isChecked={settings.appearance.reducedMotion}
                  onChange={() => handleToggle('appearance', 'reducedMotion')}
                />

                <ToggleSwitch
                  label="Alto contraste"
                  description="Aumentar el contraste para mejor legibilidad"
                  isChecked={settings.appearance.highContrast}
                  onChange={() => handleToggle('appearance', 'highContrast')}
                />
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Aplicar cambios
                </button>
              </div>
            </div>
          )}

          {/* Configuración avanzada */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Configuración Avanzada
              </h2>

              <div className="divide-y divide-gray-200">
                <ToggleSwitch
                  label="Reproducción automática"
                  description="Reproducir videos automáticamente al cargar lecciones"
                  isChecked={settings.advanced.autoPlay}
                  onChange={() => handleToggle('advanced', 'autoPlay')}
                />

                <ToggleSwitch
                  label="Avance automático"
                  description="Avanzar automáticamente a la siguiente lección al completar"
                  isChecked={settings.advanced.autoAdvance}
                  onChange={() => handleToggle('advanced', 'autoAdvance')}
                />

                <ToggleSwitch
                  label="Descargar transcripciones"
                  description="Habilitar opción para descargar transcripciones de lecciones"
                  isChecked={settings.advanced.downloadTranscripts}
                  onChange={() => handleToggle('advanced', 'downloadTranscripts')}
                />

                <ToggleSwitch
                  label="Mostrar subtítulos"
                  description="Mostrar subtítulos en videos automáticamente"
                  isChecked={settings.advanced.showCaptions}
                  onChange={() => handleToggle('advanced', 'showCaptions')}
                />
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Datos del curso</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <svg className="mr-2 -ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Exportar datos de progreso
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <svg className="mr-2 -ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Sincronizar progreso
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-md font-medium text-red-600 mb-2">Zona de peligro</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Las siguientes acciones son permanentes y no se pueden deshacer.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Reiniciar progreso de cursos
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Eliminar cuenta y datos
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
