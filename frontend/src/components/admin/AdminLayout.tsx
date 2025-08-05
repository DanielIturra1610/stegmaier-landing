import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder al panel administrativo</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">Panel Admin</h1>
        </div>
        <nav className="mt-6">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => 
              `block py-2 px-6 ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/admin/courses"
            className={({ isActive }) => 
              `block py-2 px-6 ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            Cursos
          </NavLink>
          <NavLink 
            to="/admin/users"
            className={({ isActive }) => 
              `block py-2 px-6 ${isActive ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-100'}`
            }
          >
            Usuarios
          </NavLink>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Administración</h2>
              <div className="text-sm text-gray-600">
                {user.full_name} ({user.role})
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
