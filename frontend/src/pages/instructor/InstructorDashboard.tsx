import React, { useState, useEffect } from 'react';
import { User, Book, Users, TrendingUp, Bell, Calendar } from 'lucide-react';
import { instructorService } from '../../services/instructorService';
import { useAuth } from '../../contexts/AuthContext';

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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        instructorService.getDashboardStats(),
        instructorService.getRecentActivity()
      ]);
      
      setStats(statsResponse);
      setRecentActivity(activityResponse);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }> = ({ title, value, icon, change, changeType = 'neutral' }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
    </div>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Cursos Totales"
            value={stats.totalCourses}
            icon={<Book className="h-8 w-8" />}
            change="+2 este mes"
            changeType="positive"
          />
          <StatCard
            title="Estudiantes Activos"
            value={stats.totalStudents}
            icon={<Users className="h-8 w-8" />}
            change="+12% vs mes anterior"
            changeType="positive"
          />
          <StatCard
            title="Calificación Promedio"
            value={stats.averageRating.toFixed(1)}
            icon={<TrendingUp className="h-8 w-8" />}
            change="4.8/5.0"
            changeType="positive"
          />
          <StatCard
            title="Nuevas Inscripciones"
            value={stats.newEnrollments}
            icon={<Bell className="h-8 w-8" />}
            change="Esta semana"
            changeType="neutral"
          />
          <StatCard
            title="Quizzes Activos"
            value={stats.activeQuizzes}
            icon={<Calendar className="h-8 w-8" />}
            change="Pendientes de revisión"
            changeType="neutral"
          />
          <StatCard
            title="Reseñas Pendientes"
            value={stats.pendingReviews}
            icon={<User className="h-8 w-8" />}
            change="Por revisar"
            changeType="neutral"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Actividad Reciente
              </h2>
            </div>
            <div className="p-3 max-h-96 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No hay actividad reciente
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Acciones Rápidas
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => window.location.href = '/platform/instructor/courses/new'}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Book className="h-4 w-4 mr-2" />
                Crear Nuevo Curso
              </button>
              
              <button
                onClick={() => window.location.href = '/platform/instructor/courses'}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Ver Mis Cursos
              </button>
              
              <button
                onClick={() => window.location.href = '/platform/instructor/students'}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Estudiantes
              </button>
              
              <button
                onClick={() => window.location.href = '/platform/instructor/analytics'}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Bell className="h-4 w-4 mr-2" />
                Ver Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
