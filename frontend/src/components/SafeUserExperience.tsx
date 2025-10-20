import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import analyticsService from '../services/analyticsService';

interface SafeUserExperienceProps {
  children: (data: any) => React.ReactNode;
}

interface SafeAnalyticsData {
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
    badges_earned: any[];
    milestones: any[];
  };
  recent_activity: any[];
}

export const SafeUserExperience: React.FC<SafeUserExperienceProps> = ({ children }) => {
  const { user } = useAuth();
  const [experienceData, setExperienceData] = React.useState<SafeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initializeExperience = async () => {
      try {
        console.group('🚀 [SafeUserExperience] Initializing experience system');
        setIsLoading(true);
        setError(null);

        // CARGAR DATOS CON VALIDACIÓN EXHAUSTIVA
        let analyticsData = null;
        try {
          console.log('📡 [SafeUserExperience] Fetching analytics data...');
          analyticsData = await analyticsService.getUserAnalytics();
          console.log('✅ [SafeUserExperience] Analytics data received:', analyticsData);
        } catch (err) {
          console.warn('⚠️ [SafeUserExperience] Analytics service failed, using defaults:', err);
          analyticsData = null;
        }

        // CONSTRUIR OBJETO ULTRA SEGURO
        const safeExperienceData: SafeAnalyticsData = {
          // PERIOD DATA CON VALIDACIÓN MÚLTIPLE
          period: {
            start_date: analyticsData?.period?.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: analyticsData?.period?.end_date || new Date().toISOString(),
            days: Number(analyticsData?.period?.days) || 30
          },
          
          // USER DATA CON VALIDACIÓN MÚLTIPLE
          user: {
            user_id: analyticsData?.user?.user_id || user?.id || 'unknown-user',
            name: analyticsData?.user?.name || user?.full_name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario',
            joined_date: analyticsData?.user?.joined_date || new Date().toISOString()
          },
          
          // LEARNING DATA CON VALIDACIÓN EXHAUSTIVA
          learning: {
            courses_enrolled: Number(analyticsData?.learning?.courses_enrolled) || 0,
            courses_completed: Number(analyticsData?.learning?.courses_completed) || 0,
            courses_in_progress: Number(analyticsData?.learning?.courses_in_progress) || 0,
            completion_rate: (() => {
              // VALIDACIÓN ULTRA EXHAUSTIVA PARA COMPLETION_RATE
              console.log('🔍 [SafeUserExperience] Raw completion_rate:', analyticsData?.learning?.completion_rate);
              const rate = analyticsData?.learning?.completion_rate;
              
              if (rate === null || rate === undefined) {
                console.log('🔧 [SafeUserExperience] completion_rate is null/undefined, using 0');
                return 0;
              }
              
              const numRate = Number(rate);
              if (isNaN(numRate)) {
                console.log('🔧 [SafeUserExperience] completion_rate is NaN, using 0');
                return 0;
              }
              
              const safeRate = Math.max(0, Math.min(100, numRate));
              console.log('✅ [SafeUserExperience] Safe completion_rate:', safeRate);
              return safeRate;
            })(),
            total_watch_time_seconds: Number(analyticsData?.learning?.total_watch_time_seconds) || 0,
            total_watch_time_hours: Number(analyticsData?.learning?.total_watch_time_hours) || 0,
            average_session_duration: Number(analyticsData?.learning?.average_session_duration) || 0
          },

          // ENGAGEMENT DATA CON VALIDACIÓN MÚLTIPLE  
          engagement: {
            login_streak: Number(analyticsData?.engagement?.login_streak) || 0,
            total_logins: Number(analyticsData?.engagement?.total_logins) || 0,
            last_login: analyticsData?.engagement?.last_login || new Date().toISOString(),
            favorite_category: analyticsData?.engagement?.favorite_category || 'General',
            activity_score: Number(analyticsData?.engagement?.activity_score) || 0,
            lessons_completed: Number(analyticsData?.engagement?.lessons_completed) || 0
          },

          // ACHIEVEMENTS DATA SEGURO
          achievements: {
            certificates_earned: Number(analyticsData?.achievements?.certificates_earned) || 0,
            badges_earned: Array.isArray(analyticsData?.achievements?.badges_earned) 
              ? analyticsData.achievements.badges_earned 
              : [],
            milestones: Array.isArray(analyticsData?.achievements?.milestones) 
              ? analyticsData.achievements.milestones 
              : []
          },

          // RECENT ACTIVITY SEGURO
          recent_activity: Array.isArray(analyticsData?.recent_activity) 
            ? analyticsData.recent_activity 
            : []
        };

        // VALIDACIÓN FINAL ANTES DE SET STATE
        const criticalFields = [
          { field: 'completion_rate', value: safeExperienceData.learning.completion_rate },
          { field: 'courses_enrolled', value: safeExperienceData.learning.courses_enrolled },
          { field: 'user_id', value: safeExperienceData.user.user_id }
        ];

        const hasInvalidFields = criticalFields.some(({ field, value }) => {
          const isInvalid = value === undefined || value === null || 
            (typeof value === 'number' && isNaN(value));
          
          if (isInvalid) {
            console.error(`❌ [SafeUserExperience] Invalid ${field}:`, value);
            return true;
          }
          return false;
        });

        if (hasInvalidFields) {
          throw new Error('Critical fields validation failed');
        }

        console.log('✅ [SafeUserExperience] Safe experience data validated:', safeExperienceData);
        setExperienceData(safeExperienceData);

      } catch (error) {
        console.error('❌ [SafeUserExperience] Critical error:', error);
        
        // FALLBACK ULTRA SEGURO
        const fallbackData: SafeAnalyticsData = {
          period: {
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date().toISOString(),
            days: 30
          },
          user: {
            user_id: user?.id || 'fallback-user',
            name: user?.full_name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario',
            joined_date: new Date().toISOString()
          },
          learning: {
            courses_enrolled: 0,
            courses_completed: 0,
            courses_in_progress: 0,
            completion_rate: 0, // GARANTIZADO 0 EN FALLBACK
            total_watch_time_seconds: 0,
            total_watch_time_hours: 0,
            average_session_duration: 0
          },
          engagement: {
            login_streak: 0,
            total_logins: 1,
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

        console.log('🔄 [SafeUserExperience] Using ultra-safe fallback data');
        setExperienceData(fallbackData);
        setError(error instanceof Error ? error.message : 'Error loading experience data');

      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    };

    initializeExperience();
  }, [user]);

  if (isLoading) {
    console.log('🔄 [SafeUserExperience] Loading experience data...');
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
      </div>
    );
  }

  if (error) {
    console.error('❌ [SafeUserExperience] Error state:', error);
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="text-yellow-800 font-medium">Datos de experiencia no disponibles</h3>
        <p className="text-yellow-700 text-sm mt-1">
          Se están usando valores por defecto. La funcionalidad principal no se ve afectada.
        </p>
      </div>
    );
  }

  if (!experienceData) {
    console.warn('⚠️ [SafeUserExperience] No experience data available');
    return (
      <div className="text-gray-500">
        No hay datos de experiencia disponibles
      </div>
    );
  }

  console.log('✅ [SafeUserExperience] Rendering with validated data');
  return <>{children(experienceData)}</>;
};

export default SafeUserExperience;
