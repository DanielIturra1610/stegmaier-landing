/**
 * AdvancedReports - Reportes avanzados exportables para Admin Analytics
 */
import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Activity,
  Target,
  Award,
  Clock
} from 'lucide-react';

interface AdvancedReportData {
  cohortAnalysis: Array<{
    cohort: string;
    month1: number;
    month2: number;
    month3: number;
    month6: number;
    retention: number;
  }>;
  conversionFunnel: Array<{
    stage: string;
    users: number;
    conversionRate: number;
  }>;
  coursePerformanceMatrix: Array<{
    courseId: string;
    courseName: string;
    difficulty: number;
    satisfaction: number;
    completion: number;
    revenue: number;
    size: number;
  }>;
  learningPathAnalytics: Array<{
    path: string;
    users: number;
    avgTime: number;
    completionRate: number;
    satisfaction: number;
  }>;
  timeBasedMetrics: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
    courseCompletions: number;
    revenue: number;
    avgSessionTime: number;
  }>;
  competencyAnalysis: Array<{
    subject: string;
    beginner: number;
    intermediate: number;
    advanced: number;
  }>;
}

const AdvancedReports: React.FC = () => {
  const [reportData, setReportData] = useState<AdvancedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  useEffect(() => {
    loadAdvancedReports();
  }, [dateRange, selectedReport]);

  const loadAdvancedReports = async () => {
    try {
      setLoading(true);
      // Simular datos avanzados hasta que se implemente el backend
      const mockData: AdvancedReportData = {
        cohortAnalysis: [
          { cohort: 'Ene 2024', month1: 100, month2: 78, month3: 65, month6: 52, retention: 52 },
          { cohort: 'Feb 2024', month1: 120, month2: 89, month3: 71, month6: 58, retention: 48 },
          { cohort: 'Mar 2024', month1: 95, month2: 72, month3: 61, month6: 49, retention: 52 },
          { cohort: 'Abr 2024', month1: 110, month2: 81, month3: 68, month6: 55, retention: 50 },
          { cohort: 'May 2024', month1: 135, month2: 98, month3: 82, month6: 67, retention: 50 },
          { cohort: 'Jun 2024', month1: 140, month2: 105, month3: 89, month6: 73, retention: 52 }
        ],
        conversionFunnel: [
          { stage: 'Visitantes', users: 10000, conversionRate: 100 },
          { stage: 'Registro', users: 2500, conversionRate: 25 },
          { stage: 'Exploración', users: 1875, conversionRate: 75 },
          { stage: 'Inscripción', users: 750, conversionRate: 40 },
          { stage: 'Inicio Curso', users: 600, conversionRate: 80 },
          { stage: 'Finalización', users: 420, conversionRate: 70 }
        ],
        coursePerformanceMatrix: [
          { courseId: '1', courseName: 'SICMON Básico', difficulty: 3, satisfaction: 4.7, completion: 78, revenue: 15600, size: 142 },
          { courseId: '2', courseName: 'SICMON Avanzado', difficulty: 8, satisfaction: 4.8, completion: 65, revenue: 24800, size: 98 },
          { courseId: '3', courseName: 'Aplicaciones Prácticas', difficulty: 6, satisfaction: 4.6, completion: 72, revenue: 18400, size: 76 },
          { courseId: '4', courseName: 'Machine Learning', difficulty: 9, satisfaction: 4.9, completion: 58, revenue: 31200, size: 54 },
          { courseId: '5', courseName: 'Fundamentos', difficulty: 2, satisfaction: 4.5, completion: 85, revenue: 12800, size: 186 }
        ],
        learningPathAnalytics: [
          { path: 'Data Science', users: 245, avgTime: 180, completionRate: 68, satisfaction: 4.7 },
          { path: 'Web Development', users: 189, avgTime: 120, completionRate: 75, satisfaction: 4.6 },
          { path: 'Machine Learning', users: 134, avgTime: 240, completionRate: 62, satisfaction: 4.8 },
          { path: 'Business Analytics', users: 156, avgTime: 90, completionRate: 82, satisfaction: 4.5 }
        ],
        timeBasedMetrics: [
          { date: '2024-01', newUsers: 234, activeUsers: 1245, courseCompletions: 89, revenue: 12500, avgSessionTime: 45 },
          { date: '2024-02', newUsers: 267, activeUsers: 1398, courseCompletions: 104, revenue: 14200, avgSessionTime: 48 },
          { date: '2024-03', newUsers: 298, activeUsers: 1502, courseCompletions: 112, revenue: 15800, avgSessionTime: 52 },
          { date: '2024-04', newUsers: 312, activeUsers: 1634, courseCompletions: 134, revenue: 17600, avgSessionTime: 49 },
          { date: '2024-05', newUsers: 345, activeUsers: 1789, courseCompletions: 156, revenue: 19400, avgSessionTime: 54 },
          { date: '2024-06', newUsers: 378, activeUsers: 1923, courseCompletions: 172, revenue: 21200, avgSessionTime: 56 }
        ],
        competencyAnalysis: [
          { subject: 'Programación', beginner: 45, intermediate: 78, advanced: 34 },
          { subject: 'Análisis de Datos', beginner: 62, intermediate: 89, advanced: 45 },
          { subject: 'Machine Learning', beginner: 34, intermediate: 56, advanced: 67 },
          { subject: 'Visualización', beginner: 78, intermediate: 92, advanced: 23 },
          { subject: 'Estadística', beginner: 56, intermediate: 73, advanced: 41 }
        ]
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Error loading advanced reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    // Implementar exportación real
    const reportName = `analytics-report-${selectedReport}-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      // Exportar como CSV
      const csvData = convertToCSV();
      downloadFile(csvData, `${reportName}.csv`, 'text/csv');
    } else if (format === 'excel') {
      // Implementar exportación Excel
      console.log('Exporting to Excel...');
      // Aquí se implementaría la lógica de Excel con librerías como xlsx
    } else {
      // Implementar exportación PDF
      console.log('Exporting to PDF...');
      // Aquí se implementaría la lógica de PDF con librerías como jsPDF
    }
  };

  const convertToCSV = () => {
    if (!reportData) return '';
    
    // Ejemplo para cohort analysis
    const headers = ['Cohorte,Mes 1,Mes 2,Mes 3,Mes 6,Retención'];
    const rows = reportData.cohortAnalysis.map(row => 
      `${row.cohort},${row.month1},${row.month2},${row.month3},${row.month6},${row.retention}%`
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay datos disponibles para generar reportes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes Avanzados</h2>
          <p className="text-gray-600">Análisis profundo y exportación de datos</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border rounded px-2 py-1 text-sm"
            />
            <span className="text-gray-500">a</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          
          {/* Export Options */}
          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            
            <button
              onClick={() => exportReport(exportFormat)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Vista General', icon: Activity },
          { id: 'cohort', label: 'Análisis de Cohortes', icon: Users },
          { id: 'funnel', label: 'Embudo de Conversión', icon: TrendingUp },
          { id: 'performance', label: 'Performance Cursos', icon: BookOpen },
          { id: 'competency', label: 'Análisis de Competencias', icon: Award },
          { id: 'revenue', label: 'Análisis de Ingresos', icon: DollarSign }
        ].map(report => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${
                selectedReport === report.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{report.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {selectedReport === 'cohort' && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Análisis de Cohortes - Retención de Usuarios</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={reportData.cohortAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cohort" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="month1" fill="#3B82F6" name="Mes 1" />
                <Bar yAxisId="left" dataKey="month3" fill="#10B981" name="Mes 3" />
                <Bar yAxisId="left" dataKey="month6" fill="#F59E0B" name="Mes 6" />
                <Line yAxisId="right" type="monotone" dataKey="retention" stroke="#EF4444" strokeWidth={3} name="% Retención" />
              </ComposedChart>
            </ResponsiveContainer>
            
            <div className="mt-6 grid grid-cols-4 gap-4">
              {reportData.cohortAnalysis.map((cohort, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{cohort.cohort}</h4>
                  <p className="text-2xl font-bold text-blue-600">{cohort.retention}%</p>
                  <p className="text-sm text-gray-500">Retención 6 meses</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReport === 'funnel' && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Embudo de Conversión</h3>
            <ResponsiveContainer width="100%" height={400}>
              <FunnelChart>
                <Funnel
                  dataKey="users"
                  data={reportData.conversionFunnel}
                  isAnimationActive
                  fill="#3B82F6"
                >
                  <LabelList position="center" fill="#fff" stroke="none" />
                </Funnel>
                <Tooltip />
              </FunnelChart>
            </ResponsiveContainer>
            
            <div className="mt-6">
              <h4 className="font-semibold mb-4">Tasas de Conversión por Etapa</h4>
              <div className="space-y-3">
                {reportData.conversionFunnel.map((stage, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{stage.stage}</span>
                      <p className="text-sm text-gray-500">{stage.users.toLocaleString()} usuarios</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">{stage.conversionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'performance' && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Matrix de Performance de Cursos</h3>
            <ResponsiveContainer width="100%" height={400}>
                <Treemap
                  data={reportData.coursePerformanceMatrix}
                  dataKey="size"
                  aspectRatio={4/3}
                  stroke="#fff"
                  fill="#8884d8"
                />
            </ResponsiveContainer>
            
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiantes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completión</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfacción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ROI</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.coursePerformanceMatrix.map((course) => (
                    <tr key={course.courseId}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {course.courseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {course.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${course.completion}%` }}
                            />
                          </div>
                          <span className="text-sm">{course.completion}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span>{course.satisfaction}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                        ${course.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {((course.revenue / course.size) / 100).toFixed(1)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'competency' && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Análisis de Competencias por Nivel</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={reportData.competencyAnalysis}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Principiante" dataKey="beginner" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Radar name="Intermedio" dataKey="intermediate" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Radar name="Avanzado" dataKey="advanced" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Resumen Ejecutivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {reportData.cohortAnalysis[reportData.cohortAnalysis.length - 1]?.retention || 0}%
            </div>
            <div className="text-gray-600">Retención Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {reportData.conversionFunnel[reportData.conversionFunnel.length - 1]?.conversionRate || 0}%
            </div>
            <div className="text-gray-600">Tasa Final de Conversión</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {reportData.coursePerformanceMatrix.reduce((acc, course) => acc + course.revenue, 0).toLocaleString()}$
            </div>
            <div className="text-gray-600">Ingresos Totales</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;
