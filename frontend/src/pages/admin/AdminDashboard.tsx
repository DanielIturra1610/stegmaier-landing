import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

interface DashboardStats {
  users_total: number;
  courses_total: number;
  users_new_month: number;
  courses_published: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  if (loading) {
    return <div className="text-center py-8">Cargando estadísticas...</div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Usuarios</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.users_total || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Cursos</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.courses_total || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Nuevos Usuarios</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.users_new_month || 0}</p>
          <p className="text-sm text-gray-500">Último mes</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Cursos Publicados</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.courses_published || 0}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <a 
            href="/platform/admin/courses/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Crear Nuevo Curso
          </a>
          <a 
            href="/platform/users" 
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Ver Usuarios
          </a>
          <a 
            href="/platform/admin/analytics" 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Analytics
          </a>
          <a 
            href="/platform/admin/monitoring" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
          >
            Monitoreo del Sistema
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
