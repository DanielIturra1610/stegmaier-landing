/**
 * AdvancedStats - Estadísticas avanzadas para instructores
 */
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, BookOpen, Award, Clock, Star } from 'lucide-react';

interface AdvancedStatsData {
  monthlyEnrollments: Array<{
    month: string;
    enrollments: number;
    completions: number;
  }>;
  coursePerformance: Array<{
    courseId: string;
    courseName: string;
    enrollments: number;
    completionRate: number;
    averageRating: number;
    revenue: number;
  }>;
  studentEngagement: Array<{
    week: string;
    activeStudents: number;
    avgSessionTime: number;
    quizAttempts: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    students: number;
    color: string;
  }>;
  revenueAnalytics: {
    totalRevenue: number;
    monthlyGrowth: number;
    averagePerStudent: number;
    topPerformingCourse: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedStats: React.FC = () => {
  const [stats, setStats] = useState<AdvancedStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAdvancedStats();
  }, [selectedPeriod]);

  const loadAdvancedStats = async () => {
    try {
      setLoading(true);
      // Por ahora usaremos datos mock mientras implementamos el backend
      const mockData: AdvancedStatsData = {
        monthlyEnrollments: [
          { month: 'Ene', enrollments: 45, completions: 38 },
          { month: 'Feb', enrollments: 52, completions: 44 },
          { month: 'Mar', enrollments: 61, completions: 51 },
          { month: 'Abr', enrollments: 58, completions: 49 },
          { month: 'May', enrollments: 67, completions: 58 },
          { month: 'Jun', enrollments: 71, completions: 62 }
        ],
        coursePerformance: [
          {
            courseId: '1',
            courseName: 'Fundamentos de SICMON',
            enrollments: 142,
            completionRate: 78,
            averageRating: 4.7,
            revenue: 14200
          },
          {
            courseId: '2',
            courseName: 'SICMON Avanzado',
            enrollments: 98,
            completionRate: 82,
            averageRating: 4.8,
            revenue: 19600
          },
          {
            courseId: '3',
            courseName: 'Aplicaciones Prácticas',
            enrollments: 76,
            completionRate: 75,
            averageRating: 4.6,
            revenue: 11400
          }
        ],
        studentEngagement: [
          { week: 'Sem 1', activeStudents: 156, avgSessionTime: 45, quizAttempts: 234 },
          { week: 'Sem 2', activeStudents: 167, avgSessionTime: 48, quizAttempts: 267 },
          { week: 'Sem 3', activeStudents: 189, avgSessionTime: 52, quizAttempts: 298 },
          { week: 'Sem 4', activeStudents: 203, avgSessionTime: 49, quizAttempts: 312 }
        ],
        categoryDistribution: [
          { category: 'Principiantes', students: 142, color: '#0088FE' },
          { category: 'Intermedios', students: 98, color: '#00C49F' },
          { category: 'Avanzados', students: 76, color: '#FFBB28' },
          { category: 'Especialización', students: 34, color: '#FF8042' }
        ],
        revenueAnalytics: {
          totalRevenue: 45200,
          monthlyGrowth: 12.5,
          averagePerStudent: 129,
          topPerformingCourse: 'SICMON Avanzado'
        }
      };
      
      setStats(mockData);
    } catch (error) {
      console.error('Error loading advanced stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas Avanzadas</h2>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedPeriod === period
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === '7d' ? '7 días' : period === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Ingresos Totales</p>
              <p className="text-2xl font-bold">${stats.revenueAnalytics.totalRevenue.toLocaleString()}</p>
            </div>
            <Award className="h-8 w-8 text-green-100" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Crecimiento Mensual</p>
              <p className="text-2xl font-bold">+{stats.revenueAnalytics.monthlyGrowth}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-100" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Promedio por Estudiante</p>
              <p className="text-2xl font-bold">${stats.revenueAnalytics.averagePerStudent}</p>
            </div>
            <Users className="h-8 w-8 text-purple-100" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Curso Top</p>
              <p className="text-sm font-bold truncate">{stats.revenueAnalytics.topPerformingCourse}</p>
            </div>
            <Star className="h-8 w-8 text-orange-100" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Enrollments & Completions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Inscripciones vs Completados</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyEnrollments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="enrollments" fill="#3B82F6" name="Inscripciones" />
              <Bar dataKey="completions" fill="#10B981" name="Completados" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Student Engagement */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Engagement de Estudiantes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.studentEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="activeStudents" 
                stroke="#8B5CF6" 
                name="Estudiantes Activos"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="avgSessionTime" 
                stroke="#F59E0B" 
                name="Tiempo Promedio (min)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Distribución por Nivel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, students, percent }) => 
                  `${category}: ${students} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="students"
              >
                {stats.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Course Performance */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Rendimiento por Curso</h3>
          <div className="space-y-4">
            {stats.coursePerformance.map((course) => (
              <div key={course.courseId} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                  <span className="text-sm text-gray-500">${course.revenue.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Inscripciones:</span>
                    <p className="font-medium">{course.enrollments}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Completión:</span>
                    <p className="font-medium">{course.completionRate}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rating:</span>
                    <p className="font-medium flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {course.averageRating}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
          Insights y Recomendaciones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📈 Tendencia Positiva</h4>
            <p className="text-sm text-blue-800">
              Las inscripciones han aumentado un 12.5% este mes. El curso "SICMON Avanzado" 
              muestra la mejor tasa de conversión.
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">💡 Oportunidad</h4>
            <p className="text-sm text-green-800">
              Los estudiantes intermedios muestran mayor engagement. Considera crear 
              más contenido para este nivel.
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Área de Mejora</h4>
            <p className="text-sm text-yellow-800">
              La tasa de finalización en "Aplicaciones Prácticas" es del 75%. 
              Revisa el contenido del módulo 3.
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">🎯 Recomendación</h4>
            <p className="text-sm text-purple-800">
              El tiempo de sesión promedio es alto (49 min). Los estudiantes están 
              comprometidos con tu contenido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStats;
