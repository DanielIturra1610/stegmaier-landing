/**
 * Resumen completo del progreso del usuario
 */
import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Target,
  CheckCircle
} from 'lucide-react';
import progressService from '../../services/progressService';
import { UserProgressSummaryResponse } from '../../types/progress';

interface UserProgressSummaryProps {
  className?: string;
}

const UserProgressSummary: React.FC<UserProgressSummaryProps> = ({
  className = ''
}) => {
  const [summaryData, setSummaryData] = useState<UserProgressSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgressSummary();
  }, []);

  const loadProgressSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await progressService.getUserProgressSummary();
      setSummaryData(data);
    } catch (error) {
      console.error('Error loading progress summary:', error);
      setError('Error cargando resumen de progreso');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-3">{error || 'No hay datos disponibles'}</p>
          <button 
            onClick={loadProgressSummary}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { summary, recent_courses = [] } = summaryData || { summary: null, recent_courses: [] };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estadísticas Principales */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Mi Progreso de Aprendizaje
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {summary?.last_activity 
                ? `Última actividad: ${formatDate(summary.last_activity)}`
                : 'Sin actividad reciente'
              }
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">
              {summary?.total_courses_enrolled || 0}
            </div>
            <div className="text-sm text-gray-600">Cursos Inscritos</div>
          </div>

          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-gray-900">
              {summary?.courses_completed || 0}
            </div>
            <div className="text-sm text-gray-600">Completados</div>
          </div>

          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(summary?.total_time_spent || 0)}
            </div>
            <div className="text-sm text-gray-600">Tiempo Total</div>
          </div>

          <div className="text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-gray-900">
              {summary?.certificates_earned || 0}
            </div>
            <div className="text-sm text-gray-600">Certificados</div>
          </div>
        </div>
      </div>

      {/* Progreso Detallado */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tasa de Completitud */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Tasa de Completitud
            </h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Progreso
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {(() => {
                    console.log('🔍 [UserProgressSummary] summary:', summary);
                    console.log('🔍 [UserProgressSummary] completion_rate:', summary?.completion_rate);
                    console.log('🔍 [UserProgressSummary] completion_rate type:', typeof summary?.completion_rate);
                    
                    // 🚨 CRÍTICO: Triple validación para completion_rate
                    const rate = summary?.completion_rate;
                    const safeRate = (typeof rate === 'number' && !isNaN(rate)) ? rate : 0;
                    console.log('🔍 [UserProgressSummary] safe completion_rate:', safeRate);
                    return safeRate.toFixed(1);
                  })()}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div 
                style={{ width: `${(() => {
                  const rate = summary?.completion_rate;
                  const safeRate = (typeof rate === 'number' && !isNaN(rate)) ? rate : 0;
                  return safeRate;
                })()}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
              />
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>En progreso:</span>
              <span className="font-medium">{summary?.courses_in_progress || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Sin empezar:</span>
              <span className="font-medium">{summary?.courses_not_started || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Lecciones completadas:</span>
              <span className="font-medium">{summary?.total_lessons_completed || 0}</span>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Cursos Recientes
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          {recent_courses && recent_courses.length > 0 ? (
            <div className="space-y-3">
              {recent_courses.slice(0, 5).map((course) => (
                <div key={course.course_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Curso {course.course_id}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {course.status.replace('_', ' ').toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(course.progress_percentage)}%
                    </p>
                    {course.last_accessed_at && (
                      <p className="text-xs text-gray-500">
                        {formatDate(course.last_accessed_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay cursos recientes</p>
              <p className="text-sm text-gray-500">¡Empieza tu primer curso!</p>
            </div>
          )}
        </div>
      </div>

      {/* Motivacional */}
      {(summary?.completion_rate ?? 0) > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ¡Buen progreso! 🚀
              </h3>
              <p className="text-gray-700 mt-1">
                {(summary?.completion_rate ?? 0) >= 80 
                  ? 'Tienes una excelente tasa de completitud. ¡Sigue así!'
                  : (summary?.completion_rate ?? 0) >= 50
                  ? 'Vas por buen camino. ¡Continúa con el siguiente curso!'
                  : 'Cada paso cuenta. ¡Sigue avanzando en tu aprendizaje!'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProgressSummary;
