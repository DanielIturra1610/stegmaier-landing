/**
 * Panel de preferencias de notificaciones
 * Maneja configuración de tipos, canales y horarios de notificaciones
 * Siguiendo principios del EncoderGroup para UX consistente
 */
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Volume2, 
  VolumeX, 
  Save, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import { useNotifications } from '../../contexts/NotificationContext';

interface NotificationPreferencesProps {
  className?: string;
}

type NotificationChannel = 'email' | 'push' | 'in_app';
type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'disabled';

interface PreferenceGroup {
  id: string;
  name: string;
  description: string;
  channels: {
    [key in NotificationChannel]: boolean;
  };
  frequency: NotificationFrequency;
}

const defaultPreferences: PreferenceGroup[] = [
  {
    id: 'course_completion',
    name: 'Finalización de Cursos',
    description: 'Cuando completes un curso o obtengas un certificado',
    channels: { email: true, push: true, in_app: true },
    frequency: 'immediate'
  },
  {
    id: 'course_progress',
    name: 'Progreso de Cursos',
    description: 'Actualizaciones sobre tu avance en los cursos',
    channels: { email: false, push: true, in_app: true },
    frequency: 'daily'
  },
  {
    id: 'new_courses',
    name: 'Nuevos Cursos',
    description: 'Cuando se publiquen cursos que puedan interesarte',
    channels: { email: true, push: false, in_app: true },
    frequency: 'weekly'
  },
  {
    id: 'reminders',
    name: 'Recordatorios',
    description: 'Recordatorios para continuar cursos o completar actividades',
    channels: { email: true, push: true, in_app: true },
    frequency: 'daily'
  },
  {
    id: 'system_updates',
    name: 'Actualizaciones del Sistema',
    description: 'Mantenimiento, nuevas funciones y cambios importantes',
    channels: { email: true, push: false, in_app: true },
    frequency: 'immediate'
  }
];

const frequencyOptions = [
  { value: 'immediate' as const, label: 'Inmediato' },
  { value: 'hourly' as const, label: 'Cada hora' },
  { value: 'daily' as const, label: 'Diariamente' },
  { value: 'weekly' as const, label: 'Semanalmente' },
  { value: 'disabled' as const, label: 'Deshabilitado' }
];

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ 
  className = '' 
}) => {
  const { 
    preferences, 
    updatePreferences, 
    pushPermission,
    requestPushPermission 
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState<PreferenceGroup[]>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Cargar preferencias desde el contexto
  useEffect(() => {
    if (preferences) {
      // Merging logic with stored preferences
      const mergedPreferences = defaultPreferences.map(defaultPref => {
        const storedPref = preferences[defaultPref.id];
        return storedPref ? { ...defaultPref, ...storedPref } : defaultPref;
      });
      setLocalPreferences(mergedPreferences);
    }
  }, [preferences]);

  const handleChannelToggle = (groupId: string, channel: NotificationChannel, enabled: boolean) => {
    setLocalPreferences(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, channels: { ...group.channels, [channel]: enabled } }
        : group
    ));
    setHasChanges(true);
  };

  const handleFrequencyChange = (groupId: string, frequency: NotificationFrequency) => {
    setLocalPreferences(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, frequency }
        : group
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Convertir a formato que espera el backend
      const preferencesToSave = localPreferences.reduce((acc, pref) => {
        acc[pref.id] = {
          channels: pref.channels,
          frequency: pref.frequency
        };
        return acc;
      }, {} as any);

      await updatePreferences(preferencesToSave);
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Auto-hide success message
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveError('No se pudieron guardar las preferencias. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Estás seguro de que quieres restaurar la configuración predeterminada?')) {
      setLocalPreferences(defaultPreferences);
      setHasChanges(true);
    }
  };

  const handleRequestPushPermission = async () => {
    try {
      await requestPushPermission();
    } catch (error) {
      console.error('Error requesting push permission:', error);
    }
  };

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Preferencias de Notificaciones
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configura cómo y cuándo quieres recibir notificaciones sobre tus cursos.
        </p>
      </div>

      {/* Push Notifications Permission */}
      {pushPermission !== 'granted' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Notificaciones Push Deshabilitadas
              </h4>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {pushPermission === 'denied' 
                  ? 'Has bloqueado las notificaciones push. Puedes habilitarlas desde la configuración del navegador.'
                  : 'Habilita las notificaciones push para recibir alertas incluso cuando no estés en la plataforma.'
                }
              </p>
              {pushPermission === 'default' && (
                <button
                  onClick={handleRequestPushPermission}
                  className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md transition-colors"
                >
                  Habilitar Notificaciones Push
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preferences Groups */}
      <div className="space-y-6">
        {localPreferences.map((group) => (
          <div key={group.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="space-y-4">
              {/* Group Header */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {group.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {group.description}
                </p>
              </div>

              {/* Channels */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                  </div>
                  <Switch.Root
                    checked={group.channels.email}
                    onCheckedChange={(checked) => handleChannelToggle(group.id, 'email', checked)}
                    className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500 transition-colors"
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5 transform shadow-sm" />
                  </Switch.Root>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Push</span>
                    {pushPermission !== 'granted' && (
                      <span className="text-xs text-gray-400">(No disponible)</span>
                    )}
                  </div>
                  <Switch.Root
                    checked={group.channels.push && pushPermission === 'granted'}
                    onCheckedChange={(checked) => handleChannelToggle(group.id, 'push', checked)}
                    disabled={pushPermission !== 'granted'}
                    className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500 disabled:opacity-50 transition-colors"
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5 transform shadow-sm" />
                  </Switch.Root>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">En la App</span>
                  </div>
                  <Switch.Root
                    checked={group.channels.in_app}
                    onCheckedChange={(checked) => handleChannelToggle(group.id, 'in_app', checked)}
                    className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500 transition-colors"
                  >
                    <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5 transform shadow-sm" />
                  </Switch.Root>
                </div>
              </div>

              {/* Frequency */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Frecuencia</span>
                </div>
                
                <Select.Root value={group.frequency} onValueChange={(value) => handleFrequencyChange(group.id, value as NotificationFrequency)}>
                  <Select.Trigger className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <Select.Value />
                    <Select.Icon />
                  </Select.Trigger>
                  
                  <Select.Portal>
                    <Select.Content className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
                      <Select.Viewport className="p-1">
                        {frequencyOptions.map(option => (
                          <Select.Item
                            key={option.value}
                            value={option.value}
                            className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-600"
                          >
                            <Select.ItemText>{option.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restaurar predeterminado</span>
        </button>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardado correctamente</span>
            </div>
          )}
          
          {saveError && (
            <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="max-w-xs">{saveError}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
