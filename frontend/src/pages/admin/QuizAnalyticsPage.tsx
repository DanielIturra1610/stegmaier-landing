import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import quizService from '../../services/quizService';
import { QuizStatistics } from '../../types/quiz';

const QuizAnalyticsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [statistics, setStatistics] = useState<QuizStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) {
      navigate(-1);
      return;
    }

    const fetchStatistics = async () => {
      setLoading(true);
      setError(null);
      try {
        // The service method needs to be created
        const stats = await quizService.getQuizStatistics(quizId);
        setStatistics(stats);
      } catch (err: any) {
        console.error('Error fetching quiz statistics:', err);
        setError(err.response?.data?.detail || 'No se pudo cargar las estadísticas del quiz.');
        toast.error('Error al cargar las estadísticas.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [quizId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Estadísticas no encontradas'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 hover:text-blue-500"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analíticas del Quiz: {statistics.quiz_title}
          </h1>
        </div>
      </div>

      {/* General Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Intentos Totales</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{statistics.total_attempts}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Estudiantes Únicos</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{statistics.unique_students}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Tasa de Aprobación</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{statistics.pass_rate.toFixed(2)}%</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Puntaje Promedio</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{statistics.average_score.toFixed(2)}%</p>
        </div>
      </div>

      {/* Question Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Estadísticas por Pregunta
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pregunta
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Correcto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo Promedio (seg)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Omitido
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.question_statistics.map((q_stat) => (
                <tr key={q_stat.question_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{q_stat.question_title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q_stat.correct_percentage.toFixed(2)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q_stat.average_time.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q_stat.skip_rate.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuizAnalyticsPage;
