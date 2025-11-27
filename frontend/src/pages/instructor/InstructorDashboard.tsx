import React, { useState, useEffect } from 'react';
import { User, Book, Users, TrendingUp, Bell, Calendar, Plus, BarChart3, GraduationCap, AlertCircle } from 'lucide-react';
import { instructorService } from '../../services/instructorService';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  pendingReviews: number;
  newEnrollments: number;
  activeQuizzes: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'quiz_completion' | 'course_progress' | 'review';
  message: string;
  timestamp: string;
  studentName?: string;
  courseName?: string;
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    averageRating: 0,
    pendingReviews: 0,
    newEnrollments: 0,
    activeQuizzes: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 [InstructorDashboard] Loading dashboard data...');
      setLoading(true);
      setError(null);
      
      const [statsResponse, activityResponse] = await Promise.all([
        instructorService.getDashboardStats(),
        instructorService.getRecentActivity()
      ]);
      
      console.log('✅ [InstructorDashboard] Dashboard data loaded successfully');
      console.log('📊 [InstructorDashboard] Stats:', statsResponse);
      console.log('📋 [InstructorDashboard] Activity items:', activityResponse.length);
      
      setStats(statsResponse);
      setRecentActivity(activityResponse);
    } catch (error: any) {
      console.error('❌ [InstructorDashboard] Error loading dashboard data:', error);
      const errorMessage = error?.message || 'Error al cargar los datos del panel. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
      
      // Provide fallback data to prevent blank dashboard
      setStats({
        totalCourses: 0,
        totalStudents: 0,
        averageRating: 0,
        pendingReviews: 0,
        newEnrollments: 0,
        activeQuizzes: 0
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    console.log('🔄 [InstructorDashboard] Retrying dashboard data fetch...');
    loadDashboardData();
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }> = ({ title, value, icon, change, changeType = 'neutral' }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${
            changeType === 'positive' ? 'text-green-600' :
            changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const ActivityItem: React.FC<{ activity: RecentActivity }> = ({ activity }) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case 'enrollment':
          return <Users className="h-4 w-4 text-green-600" />;
        case 'quiz_completion':
          return <Book className="h-4 w-4 text-blue-600" />;
        case 'course_progress':
          return <TrendingUp className="h-4 w-4 text-orange-600" />;
        case 'review':
          return <Bell className="h-4 w-4 text-purple-600" />;
        default:
          return <Calendar className="h-4 w-4 text-gray-600" />;
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 mt-1">
          {getActivityIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{activity.message}</p>
          <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Instructor
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenido de vuelta, {user?.firstName} {user?.lastName}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error al cargar el panel</AlertTitle>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Cursos Totales"
            value={stats?.totalCourses || 0}
            icon={<Book className="h-8 w-8" />}
            change="+2 este mes"
            changeType="positive"
          />
          <StatCard
            title="Estudiantes Activos"
            value={stats?.totalStudents || 0}
            icon={<Users className="h-8 w-8" />}
            change="+12% vs mes anterior"
            changeType="positive"
          />
          <StatCard
            title="Calificación Promedio"
            value={(stats?.averageRating || 0).toFixed(1)}
            icon={<TrendingUp className="h-8 w-8" />}
            change="4.8/5.0"
            changeType="positive"
          />
          <StatCard
            title="Nuevas Inscripciones"
            value={stats?.newEnrollments || 0}
            icon={<Bell className="h-8 w-8" />}
            change="Esta semana"
            changeType="neutral"
          />
          <StatCard
            title="Quizzes Activos"
            value={stats?.activeQuizzes || 0}
            icon={<Calendar className="h-8 w-8" />}
            change="Pendientes de revisión"
            changeType="neutral"
          />
          <StatCard
            title="Reseñas Pendientes"
            value={stats?.pendingReviews || 0}
            icon={<User className="h-8 w-8" />}
            change="Por revisar"
            changeType="neutral"
          />
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Últimas actualizaciones de tus cursos y estudiantes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                <div className="p-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">No hay actividad reciente</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Gestiona tus cursos y estudiantes fácilmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => window.location.href = '/platform/instructor/courses/new'}
                className="w-full justify-start"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Curso
              </Button>

              <Button
                onClick={() => window.location.href = '/platform/instructor/courses'}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <Book className="h-4 w-4 mr-2" />
                Ver Mis Cursos
              </Button>

              <Button
                onClick={() => window.location.href = '/platform/instructor/students'}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <Users className="h-4 w-4 mr-2" />
                Ver Estudiantes
              </Button>

              <Button
                onClick={() => window.location.href = '/platform/instructor/analytics'}
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
