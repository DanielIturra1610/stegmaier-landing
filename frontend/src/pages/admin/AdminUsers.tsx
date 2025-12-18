/**
 * AdminUsers Page - Versión Mejorada
 * Gestión completa de usuarios con filtros, búsqueda, estadísticas y acciones CRUD
 * Accesible para admin, instructor y superadmin
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Shield,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import { User, UserRole } from '../../types/user';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Menú de acciones
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
  if (!currentUser || !['instructor', 'admin', 'superadmin'].includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta página
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let result = [...users];

    // Filtro de búsqueda
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de rol
    if (roleFilter !== 'all') {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      result = result.filter((user) =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(result);
    setCurrentPage(1); // Reset página al filtrar
  }, [searchTerm, roleFilter, statusFilter, users]);

  // Calcular estadísticas
  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === 'student').length,
    instructors: users.filter((u) => u.role === 'instructor').length,
    admins: users.filter((u) => u.role === 'admin').length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handlers
  const handleDeleteUser = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      setSuccess('Usuario eliminado exitosamente');
      loadUsers();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
      setTimeout(() => setError(null), 5000);
    }
  };

  const openDeleteConfirm = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de que deseas eliminar a "${user.full_name || user.email}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: () => {
        handleDeleteUser(user.id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // Obtener badge de rol
  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      student: { className: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Estudiante' },
      instructor: { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'Instructor' },
      admin: { className: 'bg-purple-100 text-purple-800 hover:bg-purple-100', label: 'Admin' },
      superadmin: { className: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'SuperAdmin' },
    };

    const config = roleConfig[role];

    return (
      <Badge variant="secondary" className={config.className}>
        <Shield className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
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

  // Obtener iniciales
  const getUserInitials = (name: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground mt-2">
              Administra los usuarios del sistema
            </p>
          </div>
          <Button
            onClick={() => navigate('/platform/admin/users/new')}
            className="bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Crear Usuario
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Usuarios</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estudiantes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.students}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Instructores</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.instructors}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro de rol */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="student">Estudiantes</SelectItem>
                  <SelectItem value="instructor">Instructores</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  {currentUser.role === 'superadmin' && (
                    <SelectItem value="superadmin">Super Administradores</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de estado */}
            <div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resultados */}
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : currentUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron usuarios
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primer usuario'}
          </p>
          {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
            <Button onClick={() => navigate('/platform/admin/users/new')}>
              <UserPlus className="w-5 h-5 mr-2" />
              Crear Usuario
            </Button>
          )}
        </Card>
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {getUserInitials(user.full_name || user.email)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'Sin nombre'}
                            </div>
                          </div>
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
                        {user.is_active ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{formatDate(user.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block text-left">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </Button>

                          {openMenuId === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                  <Button
                                    variant="ghost"
                                    onClick={() => {
                                      navigate(`/platform/admin/users/${user.id}/edit`);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full justify-start gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                  </Button>

                                  <div className="border-t border-gray-100 my-1" />

                                  <Button
                                    variant="ghost"
                                    onClick={() => {
                                      openDeleteConfirm(user);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full justify-start gap-2 text-red-700 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                  </Button>
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
          </Card>

          {/* Paginación */}
          {totalPages > 1 && (
            <Card className="px-6 py-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

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
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Modal de confirmación */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <DialogTitle>{confirmDialog.title}</DialogTitle>
            </div>
            <DialogDescription>{confirmDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDialog.onConfirm}
            >
              {confirmDialog.confirmText || 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
