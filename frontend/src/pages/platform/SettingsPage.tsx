import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Settings,
  Bell,
  Palette,
  Sliders,
  Globe,
  Clock,
  Mail,
  BookOpen,
  Award,
  Moon,
  Sun,
  Type,
  Play,
  Download,
  CheckCircle,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Página de configuración de la plataforma
 * Permite al usuario gestionar preferencias, notificaciones y ajustes generales
 */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  
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

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Configuración
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Administra las preferencias de tu cuenta y la plataforma
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Apariencia</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Avanzado</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Idioma, zona horaria y preferencias básicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Idioma
                </label>
                <p className="text-xs text-muted-foreground">
                  Idioma de la plataforma
                </p>
                <Select
                  value={settings.general.language}
                  onValueChange={(value) => handleSelectChange('general', 'language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Zona horaria
                </label>
                <p className="text-xs text-muted-foreground">
                  Zona horaria para fechas y horarios
                </p>
                <Select
                  value={settings.general.timeZone}
                  onValueChange={(value) => handleSelectChange('general', 'timeZone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Santiago">Santiago (GMT-4)</SelectItem>
                    <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                    <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                    <SelectItem value="America/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                    <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Notificaciones por correo
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Recibir notificaciones importantes por correo electrónico
                  </p>
                </div>
                <Switch
                  checked={settings.general.emailNotifications}
                  onCheckedChange={() => handleToggle('general', 'emailNotifications')}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>
                Controla qué notificaciones quieres recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Actualizaciones de cursos
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Recibir notificaciones cuando los cursos se actualicen
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.courseUpdates}
                  onCheckedChange={() => handleToggle('notifications', 'courseUpdates')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Nuevas lecciones
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Notificaciones cuando se añadan nuevas lecciones a tus cursos
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.newLessons}
                  onCheckedChange={() => handleToggle('notifications', 'newLessons')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Recordatorios de finalización
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Recordatorios para continuar cursos en progreso
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.completionReminders}
                  onCheckedChange={() => handleToggle('notifications', 'completionReminders')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Emails de marketing
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Recibir información sobre nuevos cursos y ofertas
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.marketingEmails}
                  onCheckedChange={() => handleToggle('notifications', 'marketingEmails')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Logros y certificados
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Notificaciones cuando obtengas logros o certificados
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.achievements}
                  onCheckedChange={() => handleToggle('notifications', 'achievements')}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Apariencia y Accesibilidad
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia visual de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Tema
                </label>
                <p className="text-xs text-muted-foreground">
                  Apariencia visual de la plataforma
                </p>
                <Select
                  value={settings.appearance.theme}
                  onValueChange={(value) => handleSelectChange('appearance', 'theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Claro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Oscuro
                      </div>
                    </SelectItem>
                    <SelectItem value="system">Ajuste del sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Tamaño de fuente
                </label>
                <p className="text-xs text-muted-foreground">
                  Escala del texto en la plataforma
                </p>
                <Select
                  value={settings.appearance.fontScale}
                  onValueChange={(value) => handleSelectChange('appearance', 'fontScale', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeño</SelectItem>
                    <SelectItem value="medium">Mediano</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    Movimiento reducido
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Reducir o eliminar animaciones y transiciones
                  </p>
                </div>
                <Switch
                  checked={settings.appearance.reducedMotion}
                  onCheckedChange={() => handleToggle('appearance', 'reducedMotion')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Alto contraste
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Aumentar el contraste para mejor legibilidad
                  </p>
                </div>
                <Switch
                  checked={settings.appearance.highContrast}
                  onCheckedChange={() => handleToggle('appearance', 'highContrast')}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aplicar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                Configuración Avanzada
              </CardTitle>
              <CardDescription>
                Opciones avanzadas de reproducción y contenido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Reproducción automática
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Reproducir videos automáticamente al cargar lecciones
                  </p>
                </div>
                <Switch
                  checked={settings.advanced.autoPlay}
                  onCheckedChange={() => handleToggle('advanced', 'autoPlay')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Avance automático
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Avanzar automáticamente a la siguiente lección al completar
                  </p>
                </div>
                <Switch
                  checked={settings.advanced.autoAdvance}
                  onCheckedChange={() => handleToggle('advanced', 'autoAdvance')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Descargar transcripciones
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Habilitar opción para descargar transcripciones de lecciones
                  </p>
                </div>
                <Switch
                  checked={settings.advanced.downloadTranscripts}
                  onCheckedChange={() => handleToggle('advanced', 'downloadTranscripts')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Mostrar subtítulos</label>
                  <p className="text-xs text-muted-foreground">
                    Mostrar subtítulos en videos automáticamente
                  </p>
                </div>
                <Switch
                  checked={settings.advanced.showCaptions}
                  onCheckedChange={() => handleToggle('advanced', 'showCaptions')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management Card */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del curso</CardTitle>
              <CardDescription>
                Exportar y sincronizar tu progreso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar datos de progreso
                </Button>
                <Button variant="outline" className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Sincronizar progreso
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Alert variant="destructive">
            <Trash2 className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Zona de peligro</h3>
                  <p className="text-sm">
                    Las siguientes acciones son permanentes y no se pueden deshacer.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="destructive" size="sm" className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reiniciar progreso
                  </Button>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar cuenta
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
