import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import profileService, { ProfileResponse } from '../../services/profileService';
import {
  User,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  Edit,
  Camera,
  BookOpen,
  Award,
  TrendingUp,
  Lock,
  Key,
  Trash2,
  Bell,
  Eye,
  Moon,
  Upload,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Página de perfil del usuario
 * Permite ver y editar información del perfil
 */
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch user profile to get avatar URL
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileService.getMyProfile();
        if (response.success && response.data?.avatarUrl) {
          setProfileImage(response.data.avatarUrl);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // En una implementación completa, aquí tendrías estados para los campos del formulario
  // y funciones para manejar la actualización del perfil

  // Función para generar iniciales del usuario
  const getUserInitials = () => {
    if (!user) return 'U';
    
    // Si existe full_name, usar eso para generar iniciales
    if (user?.full_name) {
      const nameParts = user.full_name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
      } else if (nameParts.length === 1 && nameParts[0]) {
        return nameParts[0].charAt(0);
      }
    }
    
    // Fallback a firstName y lastName si están disponibles
    const firstInitial = user?.firstName ? user.firstName.charAt(0) : '';
    const lastInitial = user?.lastName ? user.lastName.charAt(0) : '';
    
    // Si no hay iniciales disponibles, devolver 'U' por defecto
    return firstInitial || lastInitial ? `${firstInitial}${lastInitial}` : 'U';
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Section with Cover Image */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-32 md:h-40 bg-gradient-to-r from-primary-600 to-primary-800">
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4"
            onClick={() => {/* Implement cover upload */}}
          >
            <Camera className="w-4 h-4 mr-2" />
            Cambiar portada
          </Button>
        </div>

        {/* Profile Info */}
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-16 md:-mt-12">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Avatar"
                  className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-28 w-28 md:h-32 md:w-32 bg-primary-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                  {getUserInitials()}
                </div>
              )}
              {user?.verified && (
                <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1.5 border-2 border-white shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              )}
              <button
                className="absolute bottom-1 left-1 bg-primary-500 rounded-full p-1.5 border-2 border-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer"
                onClick={() => setShowAvatarModal(true)}
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left pt-16 md:pt-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {user ? (
                  user?.full_name ?
                    user.full_name :
                    (user?.firstName || user?.lastName ?
                      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() :
                      'Usuario')
                ) : 'Usuario'}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <p>{user?.email || 'Correo no disponible'}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                <Badge variant={user?.role === 'admin' ? 'destructive' : 'default'} className="flex items-center gap-1">
                  {user?.role === 'admin' ? (
                    <>
                      <Shield className="w-3 h-3" />
                      Administrador
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3" />
                      Estudiante
                    </>
                  )}
                </Badge>
                {user?.verified && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="w-3 h-3" />
                    Verificado
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', {month: 'short', year: 'numeric'}) : 'N/A'}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowEditModal(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar perfil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cursos</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Certificados</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Puntos XP</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nivel</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Información Personal</span>
            <span className="sm:hidden">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Preferencias</span>
            <span className="sm:hidden">Prefs</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Seguridad</span>
            <span className="sm:hidden">Segur</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
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
                  <Separator className="my-4" />
                  <div className="flex space-x-3 justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button>
                      Guardar
                    </Button>
                  </div>
                  <Alert className="mt-4">
                    <AlertDescription>
                      La funcionalidad de edición de perfil estará disponible próximamente.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Información básica
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Nombre completo</p>
                        <p className="text-base font-medium">{user ? (user?.full_name ? user.full_name : `${user?.firstName || ''} ${user?.lastName || ''}`.trim()) : 'No disponible'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Correo electrónico</p>
                        <p className="text-base font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {user?.email || 'No disponible'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Estado de cuenta</p>
                        <Badge variant={user?.verified ? "secondary" : "outline"} className={user?.verified ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {user?.verified ? 'Verificado' : 'Pendiente de verificación'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Fecha de registro</p>
                        <p className="text-base font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Biografía</h3>
                    <p className="text-sm text-muted-foreground italic">
                      No has proporcionado una biografía aún.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium">Notificaciones por email</h4>
                  <p className="text-sm text-muted-foreground">
                    Recibe actualizaciones sobre nuevos cursos y contenido
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium">Recordatorios de cursos</h4>
                  <p className="text-sm text-muted-foreground">
                    Recibe recordatorios para continuar tus cursos
                  </p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium">Notificaciones de logros</h4>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones cuando completes logros
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preferencias de visualización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium">Mostrar progreso en dashboard</h4>
                  <p className="text-sm text-muted-foreground">
                    Ver tu progreso de cursos en el panel principal
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  <div>
                    <h4 className="text-sm font-medium">Modo oscuro</h4>
                    <p className="text-sm text-muted-foreground">
                      Cambiar entre modo claro y oscuro
                    </p>
                  </div>
                </div>
                <Switch />
              </div>

              <Alert className="mt-4">
                <AlertDescription>
                  La funcionalidad de preferencias estará disponible próximamente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Cambiar contraseña
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Separator className="my-4" />
              <Button>
                <Lock className="w-4 h-4 mr-2" />
                Actualizar contraseña
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verificación en dos pasos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Activa la verificación en dos pasos para añadir una capa extra de seguridad a tu cuenta.
              </p>
              <Button>
                <Shield className="w-4 h-4 mr-2" />
                Configurar verificación en dos pasos
              </Button>
              <Alert className="mt-4">
                <AlertDescription>
                  La funcionalidad de seguridad estará disponible próximamente.
                </AlertDescription>
              </Alert>
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
                    Esta acción no se puede deshacer. Eliminará permanentemente tu cuenta y todos tus datos.
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar cuenta
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flow-root">
            <ul className="-mb-8 space-y-6">
              <li className="relative">
                <span className="absolute top-10 left-5 -ml-px h-full w-0.5 bg-border" aria-hidden="true"></span>
                <div className="relative flex items-start space-x-4">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-4 ring-background">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="text-sm font-medium">Inscripción a curso</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Te has inscrito al curso "Introducción a la consultoría estratégica"
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Hace 2 días</p>
                  </div>
                </div>
              </li>

              <li className="relative">
                <span className="absolute top-10 left-5 -ml-px h-full w-0.5 bg-border" aria-hidden="true"></span>
                <div className="relative flex items-start space-x-4">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center ring-4 ring-background">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="text-sm font-medium">Verificación de cuenta</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Has verificado tu cuenta correctamente
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Hace 3 días</p>
                  </div>
                </div>
              </li>

              <li className="relative">
                <div className="relative flex items-start space-x-4">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center ring-4 ring-background">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="text-sm font-medium">Registro de cuenta</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Te has registrado en la plataforma
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Hace 7 días</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar perfil
            </DialogTitle>
            <DialogDescription>
              Actualiza tu información personal y avatar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                La funcionalidad de edición de perfil estará disponible próximamente.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Upload Modal */}
      <Dialog open={showAvatarModal} onOpenChange={(open) => {
        setShowAvatarModal(open);
        if (!open) {
          setAvatarPreview(null);
          setAvatarFile(null);
          setUploadError(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Cambiar foto de perfil
            </DialogTitle>
            <DialogDescription>
              Sube una nueva foto para tu perfil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Error message */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Preview area */}
            <div className="flex flex-col items-center gap-4">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Vista previa"
                    className="h-32 w-32 rounded-full object-cover border-4 border-primary-200"
                  />
                  <button
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarFile(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Upload input */}
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{avatarPreview ? 'Cambiar imagen' : 'Seleccionar imagen'}</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (5MB max)
                      if (file.size > 5 * 1024 * 1024) {
                        setUploadError('El archivo es demasiado grande. Tamaño máximo: 5MB');
                        return;
                      }
                      setUploadError(null);
                      setAvatarFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatarPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <p className="text-xs text-muted-foreground text-center">
                Formatos permitidos: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB
              </p>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarPreview(null);
                  setAvatarFile(null);
                  setUploadError(null);
                }}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                disabled={!avatarFile || isUploading}
                onClick={async () => {
                  if (!avatarFile) return;

                  setIsUploading(true);
                  setUploadError(null);

                  try {
                    const response = await profileService.uploadAvatar(avatarFile);
                    if (response.success) {
                      // Update avatar URL in state
                      if (response.data?.avatarUrl) {
                        setProfileImage(response.data.avatarUrl);
                      }
                      setShowAvatarModal(false);
                      setAvatarPreview(null);
                      setAvatarFile(null);
                    } else {
                      setUploadError(response.message || 'Error al subir la imagen');
                    }
                  } catch (error: any) {
                    console.error('Error uploading avatar:', error);
                    setUploadError(
                      error.response?.data?.message ||
                      error.message ||
                      'Error al subir la imagen. Intenta de nuevo.'
                    );
                  } finally {
                    setIsUploading(false);
                  }
                }}
              >
                {isUploading ? 'Subiendo...' : 'Guardar foto'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
