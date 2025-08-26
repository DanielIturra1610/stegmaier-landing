import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Activity, Clock, WifiOff } from 'lucide-react';
import UserProgressSummary from '../../components/progress/UserProgressSummary';
import { useUserProgressSummary, useOfflineSync } from '../../hooks/useProgress';
import { useUserExperience } from '../../hooks/useUserExperience';
import ExperienceBar from '../../components/experience/ExperienceBar';
import { StreakTracker } from '../../components/streak';
import analyticsService from '../../services/analyticsService';

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

const MyProgressPage: React.FC = () => {
  const { user } = useAuth();
  const { summary, loading: progressLoading, error: progressError, reload } = useUserProgressSummary();
  const { syncing, hasPendingUpdates, syncPendingProgress } = useOfflineSync();
  
  // Stats state
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Experience state
  const { 
    totalXP, 
    currentLevel, 
    isOnboardingComplete,
    loading: experienceLoading,
    error: experienceError
  } = useUserExperience(user?.id ? { userId: user.id } : { userId: '' });

  // Mock data for StreakTracker
  const mockStudyDates = [
    new Date(2024, 0, 1),
    new Date(2024, 0, 2),
    new Date(2024, 0, 5)
  ];

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      // Usar analyticsService correcto que llama a /my-stats
      const result = await analyticsService.getUserAnalytics();
      
      // ✅ Validación defensiva de estructura de datos
      const validatedStats = {
        period: result.data?.period || {
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          days: 30
        },
        user: result.data?.user || {
          user_id: user?.id || '',
          name: user?.full_name || user?.firstName || 'Usuario',
          joined_date: new Date().toISOString()
        },
        learning: result.data?.learning || {
          courses_enrolled: 0,
          courses_completed: 0,
          courses_in_progress: 0,
          completion_rate: 0,
          total_watch_time_seconds: 0,
          total_watch_time_hours: 0,
          average_session_duration: 0
        },
        engagement: result.data?.engagement || {
          login_streak: 0,
          total_logins: 0,
          last_login: new Date().toISOString(),
          favorite_category: 'General',
          activity_score: 0,
          lessons_completed: 0
        },
        achievements: result.data?.achievements || {
          certificates_earned: 0,
          badges_earned: [],
          milestones: []
        },
        recent_activity: result.data?.recent_activity || []
      };

      console.log('✅ [MyProgressPage] Validated stats structure:', validatedStats);
      setStats(validatedStats);
    } catch (err) {
      console.error('❌ [MyProgressPage] Error fetching user stats:', err);
      
      // ✅ Fallback con datos por defecto en caso de error
      const fallbackStats = {
        period: {
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          days: 30
        },
        user: {
          user_id: user?.id || '',
          name: user?.full_name || user?.firstName || 'Usuario',
          joined_date: new Date().toISOString()
        },
        learning: {
          courses_enrolled: 0,
          courses_completed: 0,
          courses_in_progress: 0,
          completion_rate: 0,
          total_watch_time_seconds: 0,
          total_watch_time_hours: 0,
          average_session_duration: 0
        },
        engagement: {
          login_streak: 0,
          total_logins: 0,
          last_login: new Date().toISOString(),
          favorite_category: 'General',
          activity_score: 0,
          lessons_completed: 0
        },
        achievements: {
          certificates_earned: 0,
          badges_earned: [],
          milestones: []
        },
        recent_activity: []
      };
      
      console.log('🔄 [MyProgressPage] Using fallback stats due to error');
      setStats(fallbackStats);
      setStatsError('Error cargando estadísticas. Mostrando datos por defecto.');
    } finally {
      setStatsLoading(false);
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
          <p className="text-gray-600">Debes iniciar sesión para ver tu progreso</p>
        </div>
      </div>
    );
  }

  const loading = progressLoading || statsLoading;
  const error = progressError || statsError;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu progreso...</p>
        </div>
      </div>
    );
  }
 
  // Variables para saludo dinámico
  const dayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const displayName =
    (stats?.user?.name && stats.user.name.trim()) ||
    (user?.full_name && user.full_name.split(' ')[0]) ||
    user?.firstName ||
    (user?.email ? user.email.split('@')[0] : 'Estudiante') ||
    'Estudiante';
  const greeting = `¡Feliz ${capitalizedDay}, ${displayName}!`;

  return (
    <div className="space-y-6 pb-10">
        {/* Offline alert */}
        {hasPendingUpdates && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Tienes datos sin sincronizar
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Algunos de tus progresos se guardaron offline. Haz clic en "Sincronizar datos" para subirlos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white mb-8 shadow-lg">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
                {greeting} 👋
              </h2>
              <p className="text-blue-100/90">Es un gran día para aprender. ¡Sigue con tu racha!</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">
                {getStreakEmoji(stats?.engagement?.login_streak || 0)}
              </div>
              <div className="text-sm text-blue-100">
                {stats?.engagement?.login_streak || 0} días consecutivos
              </div>
            </div>
          </div>
        </div>

        {/* Experience Bar */}
        {!experienceLoading && (
          <div className="mb-8">
            <ExperienceBar
              totalXP={totalXP || 0}
              currentLevel={currentLevel || 1}
              xpForNextLevel={1000}
              currentLevelXP={totalXP || 0}
              coursesCompleted={stats?.learning?.courses_completed || 0}
              lessonsCompleted={stats?.engagement?.lessons_completed || 0}
              certificates={stats?.achievements?.certificates_earned || 0}
            />
          </div>
        )}

        {/* Streak Tracker */}
        <div className="mb-8">
          <StreakTracker
            studyDates={mockStudyDates}
            currentStreak={stats?.engagement?.login_streak || 0}
            longestStreak={stats?.engagement?.login_streak || 0}
            weeklyGoal={5}
          />
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Completion Rate */}
          <div className="bg-white/95 backdrop-blur p-6 rounded-xl shadow-lg ring-1 ring-black/5 text-center transform transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-4 text-gray-900">
              <Award className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Tasa de Finalización</h3>
            </div>
            <CircularProgress 
              percentage={stats?.learning?.completion_rate || 0} 
              color="#10B981"
            />
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {stats?.learning?.courses_completed || 0} de {stats?.learning?.courses_enrolled || 0} cursos completados
              </p>
            </div>
          </div>

          {/* Activity Score */}
          <div className="bg-white/95 backdrop-blur p-6 rounded-xl shadow-lg ring-1 ring-black/5 text-center transform transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-4 text-gray-900">
              <Activity className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold">Puntuación de Actividad</h3>
            </div>
            <CircularProgress 
              percentage={stats?.engagement?.activity_score || 0} 
              color="#F59E0B"
            />
            <div className="mt-4">
              <p className={`text-sm font-medium ${getActivityScoreColor(stats?.engagement?.activity_score || 0)}`}>
                {(stats?.engagement?.activity_score || 0) >= 80 ? 'Muy Activo' :
                 (stats?.engagement?.activity_score || 0) >= 60 ? 'Activo' :
                 (stats?.engagement?.activity_score || 0) >= 40 ? 'Moderado' : 'Poco Activo'}
              </p>
            </div>
          </div>

          {/* Watch Time */}
          <div className="bg-white/95 backdrop-blur p-6 rounded-xl shadow-lg ring-1 ring-black/5 text-center transform transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-4 text-gray-900">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Tiempo de Estudio</h3>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {formatTime(stats?.learning?.total_watch_time_seconds || 0)}
            </div>
            <p className="text-sm text-gray-600">
              Tiempo total invertido
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Promedio por sesión: {formatTime(stats?.learning?.average_session_duration || 0)}
            </div>
          </div>
        </div>

        {/* Original Progress Summary Component */}
        <UserProgressSummary />

        {/* Footer Info */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            💡 Consejos para mejorar tu progreso
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Consistencia</h4>
              <p>
                Dedica al menos 15-30 minutos diarios al estudio para mantener el momentum.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Práctica</h4>
              <p>
                Aplica lo aprendido en proyectos reales para reforzar los conceptos.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
              <p>
                Toma notas durante los videos para mejorar la retención del conocimiento.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Certificados</h4>
              <p>
                Completa los cursos para obtener certificados que validen tu aprendizaje.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default MyProgressPage;
