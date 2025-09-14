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
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔍 [AdminDashboard] Fetching dashboard statistics...');
        setError(null); // Clear previous errors
        const data = await adminService.getDashboardStats();
        setStats(data);
        console.log('✅ [AdminDashboard] Dashboard statistics loaded successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error cargando estadísticas del dashboard';
        console.error('❌ [AdminDashboard] Error fetching dashboard stats:', error);
        setError(errorMessage);
        // Set fallback stats to prevent blank dashboard
        setStats({
          users_total: 0,
          courses_total: 0,
          users_new_month: 0,
          courses_published: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const retryFetch = () => {
    setLoading(true);
    setError(null);
    // Re-trigger the useEffect by changing a state that will cause re-render
    const fetchStats = async () => {
      try {
        console.log('🔄 [AdminDashboard] Retrying dashboard statistics fetch...');
        const data = await adminService.getDashboardStats();
        setStats(data);
        setError(null);
        console.log('✅ [AdminDashboard] Dashboard statistics loaded on retry');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error cargando estadísticas del dashboard';
        console.error('❌ [AdminDashboard] Retry failed:', error);
        setError(errorMessage);
        setStats({
          users_total: 0,
          courses_total: 0,
          users_new_month: 0,
          courses_published: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  };
  
  if (loading) {
    return <div className="text-center py-8">Cargando estadísticas...</div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Administrativo</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar estadísticas</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 hover:bg-red-200 border border-transparent rounded"
                  onClick={retryFetch}
                  disabled={loading}
                >
                  {loading ? 'Cargando...' : 'Reintentar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
