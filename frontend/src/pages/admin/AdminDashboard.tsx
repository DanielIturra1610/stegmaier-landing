import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { Users, BookOpen, TrendingUp, CheckCircle, Plus, BarChart3, Activity, Settings, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu plataforma educativa desde un solo lugar
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar estadísticas</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={retryFetch}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Reintentar'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users_total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuarios registrados en la plataforma
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.courses_total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cursos disponibles en el catálogo
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Usuarios</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.users_new_month || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registrados en el último mes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Publicados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.courses_published || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cursos activos y disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>
            Accede rápidamente a las funciones administrativas principales
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => window.location.href = '/platform/admin/courses/new'}
            className="w-full justify-start"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Nuevo Curso
          </Button>

          <Button
            onClick={() => window.location.href = '/platform/users'}
            variant="outline"
            className="w-full justify-start"
            size="lg"
          >
            <Users className="h-4 w-4 mr-2" />
            Ver Usuarios
          </Button>

          <Button
            onClick={() => window.location.href = '/platform/admin/analytics'}
            variant="outline"
            className="w-full justify-start"
            size="lg"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>

          <Button
            onClick={() => window.location.href = '/platform/admin/monitoring'}
            variant="outline"
            className="w-full justify-start"
            size="lg"
          >
            <Settings className="h-4 w-4 mr-2" />
            Monitoreo del Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
