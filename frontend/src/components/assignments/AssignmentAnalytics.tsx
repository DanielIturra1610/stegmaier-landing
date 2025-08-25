/**
 * Componente de analytics avanzados para assignments
 * Proporciona insights y métricas para el dashboard administrativo
 */
import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Assignment, AssignmentSubmission } from '../../types/assignment';
import { assignmentService } from '../../services/assignmentService';

interface AssignmentAnalyticsProps {
  courseId?: string;
  assignmentId?: string;
  timeframe?: 'week' | 'month' | 'semester' | 'all';
}

interface AnalyticsData {
  overview: {
    total_assignments: number;
    total_submissions: number;
    completion_rate: number;
    average_grade: number;
    late_submissions: number;
    pending_grading: number;
  };
  trends: {
    submission_trend: Array<{ date: string; count: number }>;
    grade_trend: Array<{ date: string; average: number }>;
    completion_trend: Array<{ date: string; rate: number }>;
  };
  distributions: {
    grade_distribution: Array<{ range: string; count: number; percentage: number }>;
    submission_time_distribution: Array<{ hour: number; count: number }>;
    days_before_due: Array<{ days: number; count: number }>;
  };
  performance: {
    top_performers: Array<{ student_name: string; average_grade: number; assignments_completed: number }>;
    struggling_students: Array<{ student_name: string; average_grade: number; late_submissions: number }>;
    assignment_difficulty: Array<{ assignment_title: string; average_grade: number; completion_rate: number }>;
  };
  engagement: {
    submission_patterns: {
      early_birds: number; // Submit > 3 days before due
      on_time: number;     // Submit within 1 day of due
      last_minute: number; // Submit on due date
      late: number;        // Submit after due date
    };
    revision_requests: number;
    feedback_engagement: number;
  };
}

export const AssignmentAnalytics: React.FC<AssignmentAnalyticsProps> = ({
  courseId,
  assignmentId,
  timeframe = 'month'
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'performance' | 'engagement'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [courseId, assignmentId, timeframe]);

  const loadAnalytics = async () => {
    try {
      console.log('📊 [AssignmentAnalytics] Loading analytics data...');
      
      // En implementación real, esto vendría del backend
      // const analyticsData = await assignmentService.getAnalytics({ courseId, assignmentId, timeframe });
      
      // Datos de ejemplo para demostración
      const mockData: AnalyticsData = {
        overview: {
          total_assignments: 8,
          total_submissions: 156,
          completion_rate: 87.5,
          average_grade: 82.3,
          late_submissions: 23,
          pending_grading: 12
        },
        trends: {
          submission_trend: generateTrendData(30, 5, 15),
          grade_trend: generateTrendData(30, 75, 95),
          completion_trend: generateTrendData(30, 80, 95)
        },
        distributions: {
          grade_distribution: [
            { range: '90-100', count: 45, percentage: 28.8 },
            { range: '80-89', count: 62, percentage: 39.7 },
            { range: '70-79', count: 35, percentage: 22.4 },
            { range: '60-69', count: 10, percentage: 6.4 },
            { range: '0-59', count: 4, percentage: 2.6 }
          ],
          submission_time_distribution: generateHourlyData(),
          days_before_due: [
            { days: 7, count: 12 },
            { days: 3, count: 28 },
            { days: 1, count: 45 },
            { days: 0, count: 38 },
            { days: -1, count: 18 },
            { days: -3, count: 8 }
          ]
        },
        performance: {
          top_performers: [
            { student_name: 'María González', average_grade: 95.2, assignments_completed: 8 },
            { student_name: 'Carlos Rodríguez', average_grade: 92.8, assignments_completed: 8 },
            { student_name: 'Ana López', average_grade: 90.5, assignments_completed: 7 }
          ],
          struggling_students: [
            { student_name: 'Pedro Martínez', average_grade: 65.3, late_submissions: 4 },
            { student_name: 'Laura Díaz', average_grade: 68.7, late_submissions: 3 },
            { student_name: 'José Silva', average_grade: 71.2, late_submissions: 2 }
          ],
          assignment_difficulty: [
            { assignment_title: 'Análisis de Datos', average_grade: 78.5, completion_rate: 85.0 },
            { assignment_title: 'Proyecto Final', average_grade: 85.2, completion_rate: 92.3 },
            { assignment_title: 'Investigación', average_grade: 81.7, completion_rate: 88.9 }
          ]
        },
        engagement: {
          submission_patterns: {
            early_birds: 25,
            on_time: 89,
            last_minute: 38,
            late: 23
          },
          revision_requests: 15,
          feedback_engagement: 78.5
        }
      };
      
      setAnalytics(mockData);
      console.log('✅ [AssignmentAnalytics] Analytics loaded successfully');
      
    } catch (error) {
      console.error('❌ [AssignmentAnalytics] Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos disponibles</h3>
        <p className="mt-1 text-sm text-gray-500">
          No se pudieron cargar los datos de analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics de Assignments</h2>
          <p className="text-sm text-gray-600">
            Insights y métricas detalladas de rendimiento
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value as any)}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="overview">Resumen</option>
            <option value="trends">Tendencias</option>
            <option value="performance">Rendimiento</option>
            <option value="engagement">Engagement</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      {selectedView === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Total Assignments"
              value={analytics.overview.total_assignments}
              icon={<DocumentCheckIcon className="h-6 w-6" />}
              color="blue"
            />
            <MetricCard
              title="Submissions"
              value={analytics.overview.total_submissions}
              icon={<UserGroupIcon className="h-6 w-6" />}
              color="green"
            />
            <MetricCard
              title="Tasa Completitud"
              value={`${analytics.overview.completion_rate}%`}
              icon={<ChartBarIcon className="h-6 w-6" />}
              color="purple"
            />
            <MetricCard
              title="Promedio General"
              value={analytics.overview.average_grade.toFixed(1)}
              icon={<TrendingUpIcon className="h-6 w-6" />}
              color="indigo"
            />
            <MetricCard
              title="Enviadas Tarde"
              value={analytics.overview.late_submissions}
              icon={<ExclamationTriangleIcon className="h-6 w-6" />}
              color="orange"
              trend="warning"
            />
            <MetricCard
              title="Por Calificar"
              value={analytics.overview.pending_grading}
              icon={<ClockIcon className="h-6 w-6" />}
              color="red"
              trend="urgent"
            />
          </div>

          {/* Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Calificaciones</h3>
              <div className="space-y-3">
                {analytics.distributions.grade_distribution.map((range) => (
                  <div key={range.range} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600">{range.range}</div>
                    <div className="flex-1 mx-3">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${range.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-900 text-right">
                      {range.count}
                    </div>
                    <div className="w-12 text-xs text-gray-500 text-right">
                      ({range.percentage.toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patrones de Envío</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Enviadas Temprano (>3 días)</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{analytics.engagement.submission_patterns.early_birds}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">A Tiempo (1 día)</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{analytics.engagement.submission_patterns.on_time}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Último Momento</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{analytics.engagement.submission_patterns.last_minute}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Tarde</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{analytics.engagement.submission_patterns.late}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Performance View */}
      {selectedView === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
              Mejores Estudiantes
            </h3>
            <div className="space-y-3">
              {analytics.performance.top_performers.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{student.student_name}</div>
                    <div className="text-sm text-gray-600">{student.assignments_completed} assignments completados</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{student.average_grade.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">promedio</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TrendingDownIcon className="h-5 w-5 text-red-500 mr-2" />
              Estudiantes que Necesitan Apoyo
            </h3>
            <div className="space-y-3">
              {analytics.performance.struggling_students.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{student.student_name}</div>
                    <div className="text-sm text-gray-600">{student.late_submissions} envíos tarde</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{student.average_grade.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">promedio</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dificultad por Assignment</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promedio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completitud
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dificultad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.performance.assignment_difficulty.map((assignment, index) => {
                    const difficulty = assignment.average_grade < 70 ? 'Difícil' : 
                                     assignment.average_grade < 80 ? 'Moderado' : 'Fácil';
                    const difficultyColor = assignment.average_grade < 70 ? 'text-red-600 bg-red-100' : 
                                          assignment.average_grade < 80 ? 'text-yellow-600 bg-yellow-100' : 'text-green-600 bg-green-100';
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assignment.assignment_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.average_grade.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.completion_rate.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${difficultyColor}`}>
                            {difficulty}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Engagement View */}
      {selectedView === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Solicitudes de Revisión</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{analytics.engagement.revision_requests}</div>
              <div className="text-sm text-gray-500 mt-1">Total este mes</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement con Feedback</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analytics.engagement.feedback_engagement}%</div>
              <div className="text-sm text-gray-500 mt-1">Responden a comentarios</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios de Envío</h3>
            <div className="space-y-2">
              {analytics.distributions.submission_time_distribution
                .filter(h => h.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map((hour) => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{hour.hour}:00h</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(hour.count / Math.max(...analytics.distributions.submission_time_distribution.map(h => h.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{hour.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para métricas
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'orange' | 'red';
  trend?: 'up' | 'down' | 'warning' | 'urgent';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium truncate">{title}</dt>
            <dd className="text-lg font-semibold">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares para generar datos de ejemplo
function generateTrendData(days: number, min: number, max: number) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * (max - min) + min),
    average: Math.floor(Math.random() * (max - min) + min),
    rate: Math.floor(Math.random() * (max - min) + min)
  }));
}

function generateHourlyData() {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hour >= 8 && hour <= 22 ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * 3)
  }));
}

export default AssignmentAnalytics;
