import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Activity, Clock, WifiOff, TrendingUp, BookOpen, GraduationCap, Target } from 'lucide-react';
import UserProgressSummary from '../../components/progress/UserProgressSummary';
import { useUserProgressSummary, useOfflineSync } from '../../hooks/useProgress';
import { useUserExperience } from '../../hooks/useUserExperience';
import ExperienceBar from '../../components/experience/ExperienceBar';
import { StreakTracker } from '../../components/streak';
import analyticsService from '../../services/analyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface UserStats {
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  user: {
    userId: string;
    name: string;
    joinedDate: string;
  };
  learning: {
    coursesEnrolled: number;
    coursesCompleted: number;
    coursesInProgress: number;
    completionRate: number;
    totalWatchTimeSeconds: number;
    totalWatchTimeHours: number;
    averageSessionDuration: number;
  };
  engagement: {
    loginStreak: number;
    totalLogins: number;
    lastLogin: string;
    favoriteCategory: string;
    activityScore: number;
    lessonsCompleted: number;
  };
  achievements: {
    certificatesEarned: number;
    badgesEarned: string[];
    milestones: string[];
  };
  recentActivity: Array<{
    date: string;
    activity: string;
    courseTitle: string;
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
  
  // Logging para debugging (TEMPORAL - remover después de resolver)
  console.log('📊 [MyProgressPage] Componente renderizando:', {
    userId: user?.id,
    userRole: user?.role,
    userEmail: user?.email,
    timestamp: new Date().toISOString()
  });
  
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
      
      // Validación defensiva de estructura de datos
      const validatedStats = {
        period: result.data?.period || {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          days: 30
        },
        user: result.data?.user || {
          userId: user?.id || '',
          name: user?.full_name || user?.firstName || 'Usuario',
          joinedDate: new Date().toISOString()
        },
        learning: result.data?.learning || {
          coursesEnrolled: 0,
          coursesCompleted: 0,
          coursesInProgress: 0,
          completionRate: 0,
          totalWatchTimeSeconds: 0,
          totalWatchTimeHours: 0,
          averageSessionDuration: 0
        },
        engagement: result.data?.engagement || {
          loginStreak: 0,
          totalLogins: 0,
          lastLogin: new Date().toISOString(),
          favoriteCategory: 'General',
          activityScore: 0,
          lessonsCompleted: 0
        },
        achievements: result.data?.achievements || {
          certificatesEarned: 0,
          badgesEarned: [],
          milestones: []
        },
        recentActivity: result.data?.recentActivity || []
      };

      console.log(' Validated stats structure:', validatedStats);
      setStats(validatedStats);
    } catch (err) {
      console.error(' Error fetching user stats:', err);
      
      // Fallback con datos por defecto en caso de error
      const fallbackStats = {
        period: {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          days: 30
        },
        user: {
          userId: user?.id || '',
          name: user?.full_name || user?.firstName || 'Usuario',
          joinedDate: new Date().toISOString()
        },
        learning: {
          coursesEnrolled: 0,
          coursesCompleted: 0,
          coursesInProgress: 0,
          completionRate: 0,
          totalWatchTimeSeconds: 0,
          totalWatchTimeHours: 0,
          averageSessionDuration: 0
        },
        engagement: {
          loginStreak: 0,
          totalLogins: 0,
          lastLogin: new Date().toISOString(),
          favoriteCategory: 'General',
          activityScore: 0,
          lessonsCompleted: 0
        },
        achievements: {
          certificatesEarned: 0,
          badgesEarned: [],
          milestones: []
        },
        recentActivity: []
      };
      
      console.log(' Using fallback stats due to error');
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
    (stats?.user?.name?.trim()) ||
    (user?.full_name ? user.full_name.split(' ')[0] : '') ||
    user?.firstName ||
    (user?.email ? user.email.split('@')[0] : 'Estudiante') ||
    'Estudiante';
  const greeting = `¡Feliz ${capitalizedDay}, ${displayName}!`;

  return (
    <div className="space-y-6 pb-10">
        {/* Offline alert */}
        {hasPendingUpdates && (
          <Alert variant="default" className="border-yellow-200 bg-yellow-50">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Tienes datos sin sincronizar</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Algunos de tus progresos se guardaron offline. Haz clic en "Sincronizar datos" para subirlos.
            </AlertDescription>
          </Alert>
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
                {getStreakEmoji(stats?.engagement?.loginStreak || 0)}
              </div>
              <div className="text-sm text-blue-100">
                {stats?.engagement?.loginStreak || 0} días consecutivos
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
              coursesCompleted={stats?.learning?.coursesCompleted || 0}
              lessonsCompleted={stats?.engagement?.lessonsCompleted || 0}
              certificates={stats?.achievements?.certificatesEarned || 0}
            />
          </div>
        )}

        {/* Streak Tracker */}
        <div className="mb-8">
          <StreakTracker
            studyDates={mockStudyDates}
            currentStreak={stats?.engagement?.loginStreak || 0}
            longestStreak={stats?.engagement?.loginStreak || 0}
            weeklyGoal={5}
          />
        </div>

        {/* Progress Overview - Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Courses Enrolled */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Inscritos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.learning?.coursesEnrolled || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de cursos disponibles
              </p>
            </CardContent>
          </Card>

          {/* Courses In Progress */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.learning?.coursesInProgress || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cursos activos ahora
              </p>
            </CardContent>
          </Card>

          {/* Courses Completed */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.learning?.coursesCompleted || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cursos finalizados exitosamente
              </p>
            </CardContent>
          </Card>

          {/* Total Study Time */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(stats?.learning?.totalWatchTimeSeconds || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Horas de estudio acumuladas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Progress Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Completion Rate */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Tasa de Finalización
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CircularProgress
                percentage={(() => {
                  console.log('🔍 [MyProgressPage] stats:', stats);
                  console.log('🔍 [MyProgressPage] completionRate:', stats?.learning?.completionRate);
                  return stats?.learning?.completionRate ?? 0;
                })()}
                color="#10B981"
              />
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  {stats?.learning?.coursesCompleted || 0} de {stats?.learning?.coursesEnrolled || 0} cursos completados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Score */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                Puntuación de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CircularProgress
                percentage={stats?.engagement?.activityScore || 0}
                color="#F59E0B"
              />
              <div className="mt-4">
                <Badge
                  variant={(stats?.engagement?.activityScore || 0) >= 60 ? "default" : "secondary"}
                  className={`${getActivityScoreColor(stats?.engagement?.activityScore || 0)}`}
                >
                  {(stats?.engagement?.activityScore || 0) >= 80 ? 'Muy Activo' :
                   (stats?.engagement?.activityScore || 0) >= 60 ? 'Activo' :
                   (stats?.engagement?.activityScore || 0) >= 40 ? 'Moderado' : 'Poco Activo'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Watch Time Details */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Tiempo de Estudio
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatTime(stats?.learning?.totalWatchTimeSeconds || 0)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Tiempo total invertido
              </p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Promedio por sesión: <span className="font-medium text-foreground">{formatTime(stats?.learning?.averageSessionDuration || 0)}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Original Progress Summary Component */}
        <UserProgressSummary />

        {/* Tips Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Consejos para mejorar tu progreso
            </CardTitle>
            <CardDescription>
              Aprende de manera más efectiva con estas recomendaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  Consistencia
                </h4>
                <p className="text-sm text-muted-foreground">
                  Dedica al menos 15-30 minutos diarios al estudio para mantener el momentum.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  Práctica
                </h4>
                <p className="text-sm text-muted-foreground">
                  Aplica lo aprendido en proyectos reales para reforzar los conceptos.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  Notas
                </h4>
                <p className="text-sm text-muted-foreground">
                  Toma notas durante los videos para mejorar la retención del conocimiento.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  Certificados
                </h4>
                <p className="text-sm text-muted-foreground">
                  Completa los cursos para obtener certificados que validen tu aprendizaje.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default MyProgressPage;
