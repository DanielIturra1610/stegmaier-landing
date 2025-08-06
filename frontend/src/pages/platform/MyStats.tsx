import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface UserStats {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  user: {
    user_id: string;
    name: string;
    joined_date: string;
  };
  learning: {
    courses_enrolled: number;
    courses_completed: number;
    courses_in_progress: number;
    completion_rate: number;
    total_watch_time_seconds: number;
    total_watch_time_hours: number;
    average_session_duration: number;
  };
  engagement: {
    login_streak: number;
    total_logins: number;
    last_login: string;
    favorite_category: string;
    activity_score: number;
    lessons_completed: number;
  };
  achievements: {
    certificates_earned: number;
    badges_earned: string[];
    milestones: string[];
  };
  recent_activity: Array<{
    date: string;
    activity: string;
    course_title: string;
    details: string;
  }>;
}

const CircularProgress: React.FC<{ percentage: number; size?: number; strokeWidth?: number; color?: string }> = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  color = "#3B82F6" 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-900">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

const MyStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user, selectedPeriod]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/analytics/users/me?period_days=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      } else {
        throw new Error('Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Error cargando tus estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⭐';
    if (streak >= 7) return '✨';
    return '📚';
  };

  const getActivityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Requerido</h2>
          <p className="text-gray-600">Debes iniciar sesión para ver tus estadísticas</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUserStats}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Estadísticas</h1>
              <p className="mt-1 text-gray-600">
                Tu progreso de aprendizaje y actividad en la plataforma
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="365">Todo el tiempo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                ¡Hola, {stats?.user.name || user.firstName}! 👋
              </h2>
              <p className="text-blue-100">
                Miembro desde {stats?.user.joined_date ? formatDate(stats.user.joined_date) : 'hace poco'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">
                {getStreakEmoji(stats?.engagement.login_streak || 0)}
              </div>
              <div className="text-sm text-blue-100">
                {stats?.engagement.login_streak || 0} días consecutivos
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Completion Rate */}
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tasa de Finalización</h3>
            <CircularProgress 
              percentage={stats?.learning.completion_rate || 0} 
              color="#10B981"
            />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {stats?.learning.courses_completed || 0} de {stats?.learning.courses_enrolled || 0} cursos completados
              </p>
            </div>
          </div>

          {/* Activity Score */}
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Puntuación de Actividad</h3>
            <CircularProgress 
              percentage={stats?.engagement.activity_score || 0} 
              color="#F59E0B"
            />
            <div className="mt-4">
              <p className={`text-sm font-medium ${getActivityScoreColor(stats?.engagement.activity_score || 0)}`}>
                {(stats?.engagement.activity_score || 0) >= 80 ? 'Muy Activo' :
                 (stats?.engagement.activity_score || 0) >= 60 ? 'Activo' :
                 (stats?.engagement.activity_score || 0) >= 40 ? 'Moderado' : 'Poco Activo'}
              </p>
            </div>
          </div>

          {/* Watch Time */}
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tiempo de Estudio</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {formatTime(stats?.learning.total_watch_time_seconds || 0)}
            </div>
            <p className="text-sm text-gray-600">
              Tiempo total invertido
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Promedio por sesión: {formatTime(stats?.learning.average_session_duration || 0)}
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Courses Enrolled */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Cursos Inscritos</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.learning.courses_enrolled || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-600">
                {stats?.learning.courses_in_progress || 0} en progreso
              </div>
            </div>
          </div>

          {/* Lessons Completed */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Lecciones Completadas</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.engagement.lessons_completed || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-600">
                Gran trabajo 🎉
              </div>
            </div>
          </div>

          {/* Login Streak */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Racha de Login</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.engagement.login_streak || 0} días
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-600">
                {stats?.engagement.total_logins || 0} logins totales
              </div>
            </div>
          </div>

          {/* Favorite Category */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Categoría Favorita</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.engagement.favorite_category || 'N/A'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-600">
                Tu preferencia
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
          </div>
          <div className="p-6">
            {stats?.recent_activity?.length ? (
              <div className="space-y-4">
                {stats.recent_activity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.activity}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.course_title}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.details}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2">No hay actividad reciente</p>
                <p className="text-sm text-gray-400">
                  Comienza a tomar cursos para ver tu actividad aquí
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Logros y Reconocimientos</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certificates */}
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats?.achievements.certificates_earned || 0}
                </div>
                <div className="text-sm text-yellow-800">Certificados Obtenidos</div>
              </div>

              {/* Badges */}
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">🎖️</div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.achievements.badges_earned?.length || 0}
                </div>
                <div className="text-sm text-purple-800">Insignias Ganadas</div>
              </div>
            </div>

            {/* Milestones */}
            {stats?.achievements.milestones?.length ? (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Hitos Alcanzados</h4>
                <div className="space-y-2">
                  {stats.achievements.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center p-2 bg-green-50 rounded">
                      <span className="text-green-600 mr-2">✅</span>
                      <span className="text-sm text-green-800">{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center text-gray-500">
                <p className="text-sm">
                  Sigue aprendiendo para desbloquear logros y reconocimientos 🚀
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStats;
