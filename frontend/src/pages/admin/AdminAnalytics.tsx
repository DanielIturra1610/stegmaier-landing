import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService, { PlatformMetrics, PopularCourse, RevenueData } from '../../services/analyticsService';

// Las interfaces ahora se importan desde analyticsService

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminAnalytics: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // días
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Solo ejecutar cuando el usuario esté completamente autenticado y no estemos en estado de loading
    if (!authLoading && isAuthenticated && user?.role === 'admin' && user?.id) {
      const token = localStorage.getItem('auth_token');
      if (token && token !== 'null' && token !== 'undefined') {
        fetchAnalyticsData();
      } else {
        console.warn('No valid token found for analytics');
        setError('No se encontró token de autenticación');
        setLoading(false);
      }
    } else if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      setError('Acceso denegado: Se requieren permisos de administrador');
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.id, user?.role, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar el servicio de analytics para hacer las llamadas
      const [metricsData, popularCoursesData, revenueData] = await Promise.all([
        analyticsService.getPlatformMetrics().catch(err => {
          console.error('Error fetching platform metrics:', err);
          return null;
        }),
        analyticsService.getPopularCourses(selectedPeriod).catch(err => {
          console.error('Error fetching popular courses:', err);
          return { courses: [] };
        }),
        analyticsService.getRevenueData().catch(err => {
          console.error('Error fetching revenue data:', err);
          return null;
        })
      ]);

      setMetrics(metricsData);
      setPopularCourses(popularCoursesData.courses);
      setRevenueData(revenueData);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Error cargando datos de analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Mostrar loading mientras se carga la autenticación o los datos
  if (authLoading || (isAuthenticated && user?.role === 'admin' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos después de que la autenticación esté completa
  if (!authLoading && (!isAuthenticated || !user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los administradores pueden acceder a este panel</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-1 text-gray-600">Métricas y estadísticas de la plataforma</p>
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
                <option value="365">Último año</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Vista General', icon: '📊' },
                { id: 'users', name: 'Usuarios', icon: '👥' },
                { id: 'courses', name: 'Cursos', icon: '📚' },
                { id: 'revenue', name: 'Ingresos', icon: '💰' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Users */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Usuarios</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {metrics?.users.total_users?.toLocaleString() ?? '0'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">
                      +{metrics?.users.new_users || 0}
                    </span>
                    <span className="text-gray-600"> nuevos este período</span>
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Usuarios Activos</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {metrics?.users.active_users?.toLocaleString() ?? '0'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="text-gray-600">
                      {(((metrics?.users.active_users ?? 0) / (metrics?.users.total_users ?? 1)) * 100).toFixed(1)}% del total
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Courses */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Cursos</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {metrics?.content.total_courses || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="text-gray-600">
                      {metrics?.content.total_enrollments || 0} enrollments totales
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Tasa de Finalización</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {(() => {
                            console.log('🔍 [AdminAnalytics] metrics:', metrics);
                            console.log('🔍 [AdminAnalytics] completion_rate:', metrics?.content?.completion_rate);
                            const rate = metrics?.content?.completion_rate;
                            const safeRate = (typeof rate === 'number' && !isNaN(rate)) ? rate : 0;
                            return safeRate.toFixed(1);
                          })()}%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="text-gray-600">
                      {metrics?.content.completed_enrollments || 0} cursos completados
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Watch Time Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tiempo de Visualización</h3>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {formatTime(metrics?.engagement.total_watch_time_seconds || 0)}
                  </div>
                  <p className="text-gray-600">Total acumulado</p>
                  <div className="mt-4 text-sm text-gray-500">
                    Promedio por usuario: {metrics?.engagement.average_watch_time_per_user?.toFixed(1) ?? '0'}h
                  </div>
                </div>
              </div>

              {/* Popular Courses */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cursos Más Populares</h3>
                <div className="space-y-3">
                  {popularCourses.slice(0, 5).map((course, index) => (
                    <div key={course.course_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs" title={course.course_title}>
                            {course.course_title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(() => {
                              const rate = course?.completion_rate;
                              const safeRate = (typeof rate === 'number' && !isNaN(rate)) ? rate : 0;
                              return safeRate.toFixed(1);
                            })()}% completado
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {course.enrollment_count} estudiantes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas de Usuarios</h3>
              
              {/* User Growth Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Sem 1', usuarios: (metrics?.users.total_users ?? 0) - (metrics?.users.new_users ?? 0) },
                    { name: 'Sem 2', usuarios: (metrics?.users.total_users ?? 0) - Math.floor((metrics?.users.new_users ?? 0) * 0.7) },
                    { name: 'Sem 3', usuarios: (metrics?.users.total_users ?? 0) - Math.floor((metrics?.users.new_users ?? 0) * 0.4) },
                    { name: 'Actual', usuarios: metrics?.users.total_users ?? 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="usuarios" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* User Stats */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics?.users.user_growth_rate?.toFixed(1) ?? '0'}%
                  </div>
                  <div className="text-sm text-blue-800">Tasa de Crecimiento</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(((metrics?.users.active_users ?? 0) / (metrics?.users.total_users ?? 1)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-800">Usuarios Activos</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {metrics?.users.new_users || 0}
                  </div>
                  <div className="text-sm text-purple-800">Nuevos Usuarios</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas de Cursos</h3>
              
              {/* Course Performance */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Curso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estudiantes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasa de Finalización
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating Promedio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(popularCourses || []).filter(course => course && course.course_id).map((course) => (
                      <tr key={course.course_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {course.course_title || 'Sin título'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.enrollment_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${(() => {
                                  // PROTECCIÓN COMPLETA CONTRA UNDEFINED
                                  if (!course) return 0;
                                  
                                  const rate = course.completion_rate;
                                  let safeRate = 0;
                                  
                                  if (rate !== null && rate !== undefined && !isNaN(Number(rate))) {
                                    safeRate = Math.max(0, Math.min(100, Number(rate)));
                                  }
                                  
                                  return safeRate;
                                })()}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">
                              {(() => {
                                // PROTECCIÓN COMPLETA CONTRA UNDEFINED
                                if (!course) return '0%';
                                const rate = course.completion_rate;
                                let safeRate = 0;
                                
                                if (rate !== null && rate !== undefined && !isNaN(Number(rate))) {
                                  safeRate = Math.max(0, Math.min(100, Number(rate)));
                                }
                                
                                return safeRate.toFixed(1);
                              })()}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= course.average_rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 text-sm text-gray-500">
                              ({course.average_rating.toFixed(1)})
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Revenue Cards */}
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(revenueData?.total_revenue || 0)}
                </div>
                <div className="text-gray-600">Ingresos Totales</div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {revenueData?.monthly_revenue || 0}
                </div>
                <div className="text-gray-600">Ingresos Mensuales</div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {revenueData?.revenue_growth?.toFixed(1) || 0}%
                </div>
                <div className="text-gray-600">Crecimiento %</div>
              </div>
            </div>

            {/* Top Selling Courses */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cursos Más Vendidos</h3>
              
              {revenueData?.top_earning_courses.length ? (
                <div className="space-y-4">
                  {revenueData.top_earning_courses.map((course, index) => (
                    <div key={course.course_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-600 mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {course.course_title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {course.enrollments} enrollments
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(course.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay datos de ventas disponibles</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
