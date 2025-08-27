import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [changingRole, setChangingRole] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEditRole = (userId: string, currentRole: string) => {
    setEditingUserId(userId);
    setNewRole(currentRole);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNewRole('');
  };

  const handleSaveRole = async (userId: string) => {
    if (newRole === users.find(u => u.id === userId)?.role) {
      handleCancelEdit();
      return;
    }

    setChangingRole(true);
    try {
      const result = await adminService.changeUserRole(userId, newRole);
      
      // Actualizar el usuario en la lista local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      setEditingUserId(null);
      setNewRole('');
      
      // Mostrar mensaje de éxito (opcional)
      console.log('Rol actualizado exitosamente:', result);
      
    } catch (err) {
      console.error('Error cambiando rol:', err);
      setError('Error al cambiar el rol del usuario');
    } finally {
      setChangingRole(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Usuarios</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {(user?.full_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.full_name || 'No disponible'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user?.email || 'No disponible'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {editingUserId === user.id ? (
                    <div className="flex items-center space-x-2">
                      <select 
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={changingRole}
                      >
                        <option value="student">student</option>
                        <option value="instructor">instructor</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        onClick={() => handleSaveRole(user.id)}
                        disabled={changingRole}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        title="Guardar cambios"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={changingRole}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Cancelar"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                      <button
                        onClick={() => handleEditRole(user.id, user.role)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Editar rol"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron usuarios
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
