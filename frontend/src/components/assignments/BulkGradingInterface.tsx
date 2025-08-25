/**
 * Interfaz de calificación masiva para instructores
 * Permite calificar múltiples submissions de manera eficiente
 */
import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
  PencilSquareIcon,
  EyeIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Assignment, AssignmentSubmission } from '../../types/assignment';
import { assignmentService } from '../../services/assignmentService';
import { assignmentNotificationService } from '../../services/assignmentNotificationService';

interface BulkGradingInterfaceProps {
  assignment: Assignment;
  onGradingComplete?: () => void;
}

interface SubmissionGrade {
  submission_id: string;
  grade: number | null;
  feedback: string;
  status: 'not_graded' | 'graded' | 'pending';
}

interface GradingStats {
  total_submissions: number;
  graded_count: number;
  pending_count: number;
  average_grade: number;
  grade_distribution: { range: string; count: number }[];
}

export const BulkGradingInterface: React.FC<BulkGradingInterfaceProps> = ({
  assignment,
  onGradingComplete
}) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [grades, setGrades] = useState<Record<string, SubmissionGrade>>({});
  const [loading, setLoading] = useState(true);
  const [bulkGrading, setBulkGrading] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [bulkGrade, setBulkGrade] = useState<number | ''>('');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [stats, setStats] = useState<GradingStats | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    loadSubmissions();
  }, [assignment.id]);

  const loadSubmissions = async () => {
    try {
      console.log('📚 [BulkGrading] Loading submissions for assignment:', assignment.id);
      
      const submissionList = await assignmentService.getAssignmentSubmissions(assignment.id);
      setSubmissions(submissionList);
      
      // Inicializar grades state
      const initialGrades: Record<string, SubmissionGrade> = {};
      submissionList.forEach(submission => {
        initialGrades[submission.id] = {
          submission_id: submission.id,
          grade: submission.grade,
          feedback: submission.feedback || '',
          status: submission.grade !== null ? 'graded' : 'not_graded'
        };
      });
      setGrades(initialGrades);
      
      // Calcular estadísticas
      calculateStats(submissionList);
      
      console.log('✅ [BulkGrading] Loaded', submissionList.length, 'submissions');
    } catch (error) {
      console.error('❌ [BulkGrading] Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (submissionList: AssignmentSubmission[]) => {
    const gradedSubmissions = submissionList.filter(s => s.grade !== null);
    const totalGrade = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
    const averageGrade = gradedSubmissions.length > 0 ? totalGrade / gradedSubmissions.length : 0;

    // Distribución de calificaciones
    const ranges = [
      { range: '90-100', min: 90, max: 100 },
      { range: '80-89', min: 80, max: 89 },
      { range: '70-79', min: 70, max: 79 },
      { range: '60-69', min: 60, max: 69 },
      { range: '0-59', min: 0, max: 59 }
    ];

    const distribution = ranges.map(range => ({
      range: range.range,
      count: gradedSubmissions.filter(s => 
        (s.grade || 0) >= range.min && (s.grade || 0) <= range.max
      ).length
    }));

    setStats({
      total_submissions: submissionList.length,
      graded_count: gradedSubmissions.length,
      pending_count: submissionList.length - gradedSubmissions.length,
      average_grade: averageGrade,
      grade_distribution: distribution
    });
  };

  const handleGradeChange = (submissionId: string, grade: number | null, feedback?: string) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        grade,
        feedback: feedback !== undefined ? feedback : prev[submissionId].feedback,
        status: grade !== null ? 'graded' : 'not_graded'
      }
    }));
  };

  const handleBulkGradeApply = () => {
    if (bulkGrade === '' || selectedSubmissions.size === 0) return;

    selectedSubmissions.forEach(submissionId => {
      handleGradeChange(submissionId, Number(bulkGrade), bulkFeedback);
    });

    setBulkGrade('');
    setBulkFeedback('');
    setSelectedSubmissions(new Set());
    setBulkGrading(false);
  };

  const handleSubmissionSelect = (submissionId: string, selected: boolean) => {
    const newSelected = new Set(selectedSubmissions);
    if (selected) {
      newSelected.add(submissionId);
    } else {
      newSelected.delete(submissionId);
    }
    setSelectedSubmissions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map(s => s.id)));
    }
  };

  const handleSaveGrades = async () => {
    try {
      console.log('💾 [BulkGrading] Saving grades...');
      
      const gradesToSave = Object.values(grades).filter(g => g.status === 'graded' || g.status === 'pending');
      
      if (gradesToSave.length === 0) {
        console.log('⚠️ No grades to save');
        return;
      }

      // Marcar como pending mientras se guarda
      gradesToSave.forEach(grade => {
        setGrades(prev => ({
          ...prev,
          [grade.submission_id]: { ...prev[grade.submission_id], status: 'pending' }
        }));
      });

      // Guardar calificaciones
      const savePromises = gradesToSave.map(async (gradeData) => {
        const submission = submissions.find(s => s.id === gradeData.submission_id);
        if (!submission) return;

        await assignmentService.gradeSubmission(gradeData.submission_id, {
          grade: gradeData.grade!,
          feedback: gradeData.feedback
        });

        // Enviar notificación al estudiante
        await assignmentNotificationService.notifyGradeAvailable(
          { ...submission, grade: gradeData.grade!, feedback: gradeData.feedback },
          assignment
        );

        return gradeData.submission_id;
      });

      const savedIds = await Promise.all(savePromises);
      
      // Actualizar estado a graded
      savedIds.forEach(submissionId => {
        if (submissionId) {
          setGrades(prev => ({
            ...prev,
            [submissionId]: { ...prev[submissionId], status: 'graded' }
          }));
        }
      });

      // Recargar submissions para obtener datos actualizados
      await loadSubmissions();
      
      if (onGradingComplete) {
        onGradingComplete();
      }
      
      console.log('✅ [BulkGrading] Grades saved successfully');
      
    } catch (error) {
      console.error('❌ [BulkGrading] Error saving grades:', error);
      
      // Revertir estado en caso de error
      Object.values(grades).forEach(grade => {
        if (grade.status === 'pending') {
          setGrades(prev => ({
            ...prev,
            [grade.submission_id]: { ...prev[grade.submission_id], status: 'not_graded' }
          }));
        }
      });
    }
  };

  const getGradeColor = (grade: number | null, maxPoints: number) => {
    if (grade === null) return 'text-gray-400';
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const pendingGrades = Object.values(grades).filter(g => g.status === 'pending').length;
  const hasChanges = Object.values(grades).some(g => g.status !== 'graded');

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Calificación Masiva - {assignment.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Califica múltiples submissions de manera eficiente
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {viewMode === 'grid' ? (
                <>
                  <DocumentChartBarIcon className="h-4 w-4 mr-2" />
                  Vista Tabla
                </>
              ) : (
                <>
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Vista Grid
                </>
              )}
            </button>
            
            {hasChanges && (
              <button
                onClick={handleSaveGrades}
                disabled={pendingGrades > 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {pendingGrades > 0 ? `Guardando... (${pendingGrades})` : 'Guardar Calificaciones'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total_submissions}</div>
              <div className="text-sm text-gray-600">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.graded_count}</div>
              <div className="text-sm text-gray-600">Calificadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending_count}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.average_grade.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Promedio</div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedSubmissions.size === submissions.length && submissions.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Seleccionar todas ({selectedSubmissions.size} de {submissions.length})
              </span>
            </label>
            
            {selectedSubmissions.size > 0 && (
              <button
                onClick={() => setBulkGrading(!bulkGrading)}
                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                Calificación Masiva
              </button>
            )}
          </div>
        </div>

        {/* Bulk Grading Form */}
        {bulkGrading && selectedSubmissions.size > 0 && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calificación (máx: {assignment.max_points})
                </label>
                <input
                  type="number"
                  min="0"
                  max={assignment.max_points}
                  value={bulkGrade}
                  onChange={(e) => setBulkGrade(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback (opcional)
                </label>
                <input
                  type="text"
                  value={bulkFeedback}
                  onChange={(e) => setBulkFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comentarios para las submissions seleccionadas..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setBulkGrading(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkGradeApply}
                disabled={bulkGrade === ''}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Aplicar a {selectedSubmissions.size} submissions
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submissions */}
      <div className="p-6">
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay submissions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Los estudiantes aún no han enviado submissions para este assignment.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => {
              const grade = grades[submission.id];
              return (
                <div
                  key={submission.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    selectedSubmissions.has(submission.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.has(submission.id)}
                        onChange={(e) => handleSubmissionSelect(submission.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <h4 className="font-medium text-gray-900 text-sm">
                        {submission.student_name || 'Estudiante'}
                      </h4>
                    </div>
                    
                    <div className={`text-sm font-medium ${getGradeColor(grade.grade, assignment.max_points)}`}>
                      {grade.grade !== null ? `${grade.grade}/${assignment.max_points}` : 'Sin calificar'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Enviado: {new Date(submission.submitted_at || submission.created_at).toLocaleDateString('es-ES')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        grade.status === 'graded' ? 'bg-green-100 text-green-800' :
                        grade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {grade.status === 'graded' ? 'Calificada' :
                         grade.status === 'pending' ? 'Guardando...' :
                         'Pendiente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Puntos
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={assignment.max_points}
                          value={grade.grade || ''}
                          onChange={(e) => handleGradeChange(
                            submission.id, 
                            e.target.value === '' ? null : Number(e.target.value)
                          )}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            // Implementar vista de archivos de submission
                            console.log('Ver archivos de:', submission.id);
                          }}
                          className="w-full px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                        >
                          <EyeIcon className="h-3 w-3 mx-auto" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Feedback
                      </label>
                      <textarea
                        value={grade.feedback}
                        onChange={(e) => handleGradeChange(submission.id, grade.grade, e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Comentarios..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Table view
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.size === submissions.length && submissions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enviado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => {
                  const grade = grades[submission.id];
                  return (
                    <tr key={submission.id} className={selectedSubmissions.has(submission.id) ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.has(submission.id)}
                          onChange={(e) => handleSubmissionSelect(submission.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {submission.student_name || 'Estudiante'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.submitted_at || submission.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          max={assignment.max_points}
                          value={grade.grade || ''}
                          onChange={(e) => handleGradeChange(
                            submission.id, 
                            e.target.value === '' ? null : Number(e.target.value)
                          )}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500 ml-1">/ {assignment.max_points}</span>
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          value={grade.feedback}
                          onChange={(e) => handleGradeChange(submission.id, grade.grade, e.target.value)}
                          rows={1}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Comentarios..."
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          grade.status === 'graded' ? 'bg-green-100 text-green-800' :
                          grade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {grade.status === 'graded' ? 'Calificada' :
                           grade.status === 'pending' ? 'Guardando...' :
                           'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            console.log('Ver archivos de:', submission.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            console.log('Descargar archivos de:', submission.id);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkGradingInterface;
