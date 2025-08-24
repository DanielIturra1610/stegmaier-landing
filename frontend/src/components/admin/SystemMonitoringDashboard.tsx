/**
 * Dashboard de monitoreo del sistema integrado con Recharts
 */
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  CpuChipIcon, 
  CircleStackIcon, 
  ServerIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface SystemMetrics {
  timestamp: string;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  disk_usage_percent: number;
  response_time_ms: number;
  requests_per_minute: number;
  error_rate_percent: number;
  active_users: number;
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  message: string;
  details?: any;
}

interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

const SystemMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMonitoringData = async () => {
    try {
      const [metricsRes, healthRes, alertsRes] = await Promise.all([
        fetch(`/api/v1/monitoring/metrics?range=${timeRange}`),
        fetch('/api/v1/monitoring/health'),
        fetch('/api/v1/monitoring/alerts')
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.historical || []);
        setCurrentMetrics(data.current || null);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setServiceHealth(Object.entries(healthData.services || {}).map(([service, data]: [string, any]) => ({
          service,
          status: data.status,
          response_time_ms: data.response_time_ms,
          message: data.message,
          details: data.details
        })));
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-5 w-5" />;
      case 'degraded': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'unhealthy': return <XCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-l-red-600 bg-red-50';
      case 'error': return 'border-l-red-400 bg-red-25';
      case 'warning': return 'border-l-yellow-400 bg-yellow-50';
      case 'info': return 'border-l-blue-400 bg-blue-50';
      default: return 'border-l-gray-400 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
        <div className="flex space-x-2">
          {(['1h', '6h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas actuales */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CpuChipIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">CPU Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics.cpu_usage_percent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CircleStackIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics.memory_usage_percent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ServerIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics.response_time_ms.toFixed(0)}ms
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics.error_rate_percent.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de recursos del sistema */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">System Resources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()} 
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(time) => new Date(time).toLocaleString()}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cpu_usage_percent" 
                stroke="#3B82F6" 
                name="CPU" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="memory_usage_percent" 
                stroke="#10B981" 
                name="Memory" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="disk_usage_percent" 
                stroke="#8B5CF6" 
                name="Disk" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de performance */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">API Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()} 
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(time) => new Date(time).toLocaleString()}
                formatter={(value: number, name: string) => {
                  if (name === 'Response Time') return [`${value.toFixed(0)}ms`, name];
                  if (name === 'Error Rate') return [`${value.toFixed(2)}%`, name];
                  return [value, name];
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="response_time_ms" 
                stroke="#F59E0B" 
                fill="#FEF3C7" 
                name="Response Time"
              />
              <Area 
                type="monotone" 
                dataKey="error_rate_percent" 
                stroke="#EF4444" 
                fill="#FEE2E2" 
                name="Error Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de servicios */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Service Health</h3>
          <div className="space-y-3">
            {serviceHealth.map((service) => (
              <div 
                key={service.service}
                className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(service.status)}`}
              >
                <div className="flex items-center">
                  {getStatusIcon(service.status)}
                  <div className="ml-3">
                    <p className="font-medium">{service.service}</p>
                    <p className="text-sm">{service.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{service.response_time_ms.toFixed(0)}ms</p>
                  <p className="text-xs">{service.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas activas */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.filter(alert => !alert.resolved).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="h-12 w-12 mx-auto mb-2" />
                <p>No active alerts</p>
              </div>
            ) : (
              alerts
                .filter(alert => !alert.resolved)
                .map((alert) => (
                  <div 
                    key={alert.id}
                    className={`border-l-4 p-3 rounded ${getAlertColor(alert.level)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.level === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.level === 'error' ? 'bg-red-50 text-red-700' :
                        alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.level}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de requests por minuto */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Request Volume</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(time) => new Date(time).toLocaleTimeString()} 
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(time) => new Date(time).toLocaleString()}
              formatter={(value: number) => [`${value} req/min`, 'Requests']}
            />
            <Bar 
              dataKey="requests_per_minute" 
              fill="#3B82F6" 
              name="Requests per minute"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer con información */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Last updated: {currentMetrics ? new Date(currentMetrics.timestamp).toLocaleString() : 'Never'}</span>
          <span>Auto-refresh: Every 30 seconds</span>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoringDashboard;
