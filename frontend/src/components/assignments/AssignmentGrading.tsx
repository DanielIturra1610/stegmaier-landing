/**
 * Interfaz de calificación para instructores
 * Permite calificar submissions individuales y en lote, siguiendo patrones de AdminCourses
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { assignmentService } from '../../services/assignmentService';
import {
  Assignment,
  AssignmentSubmission,
  AssignmentGradingProps,
  SubmissionGrade,
  SubmissionStatus,
  GradeStatus,
  AssignmentStatistics
} from '../../types/assignment';

type FilterStatus = 'all' | 'submitted' | 'graded' | 'pending' | 'late';
type SortField = 'student_name' | 'submitted_at' | 'grade' | 'status';
type SortOrder = 'asc' | 'desc';

export const AssignmentGrading: React.FC<AssignmentGradingProps> = ({
  assignment,
  submissions: initialSubmissions,
  onGradeSubmitted,
  onBulkGrade
}) => {
  const { user } = useAuth();
  
  // State management
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(Array.isArray(initialSubmissions) ? initialSubmissions : []);
  const [filteredSubmissions, setFilteredSubmissions] = useState<AssignmentSubmission[]>(Array.isArray(initialSubmissions) ? initialSubmissions : []);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('submitted_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState<AssignmentStatistics | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { points: number; feedback: string }>>({});

  // Load submissions and statistics
  useEffect(() => {
    loadSubmissions();
    loadStatistics();
  }, [assignment.id]);

  // Filter and sort submissions
  useEffect(() => {
    let filtered = Array.isArray(submissions) ? [...submissions] : [];

    // Apply status filter
    switch (filterStatus) {
      case 'submitted':
        filtered = (Array.isArray(filtered) ? filtered : []).filter(s => s.status === SubmissionStatus.SUBMITTED);
        break;
      case 'graded':
        filtered = (Array.isArray(filtered) ? filtered : []).filter(s => s.grade_status === GradeStatus.COMPLETED);
        break;
      case 'pending':
        filtered = (Array.isArray(filtered) ? filtered : []).filter(s => 
          s.status === SubmissionStatus.SUBMITTED && s.grade_status !== GradeStatus.COMPLETED
        );
        break;
      case 'late':
        filtered = (Array.isArray(filtered) ? filtered : []).filter(s => s.is_late);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'student_name':
          aValue = a.student_name || '';
          bValue = b.student_name || '';
          break;
        case 'submitted_at':
          aValue = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
          bValue = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
          break;
        case 'grade':
          aValue = a.percentage_grade;
          bValue = b.percentage_grade;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSubmissions(filtered);
  }, [submissions, filterStatus, sortField, sortOrder]);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await assignmentService.getAssignmentSubmissions(assignment.id);
      setSubmissions(data);
    } catch (error: any) {
      console.error('Error loading submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await assignmentService.getAssignmentStatistics(assignment.id);
      setStatistics(stats);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId)
        ? (Array.isArray(prev) ? prev : []).filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAll = () => {
    const eligibleSubmissions = (Array.isArray(filteredSubmissions) ? filteredSubmissions : [])
      .filter(s => s.status === SubmissionStatus.SUBMITTED)
      .map(s => s.id);
    
    if (selectedSubmissions.length === eligibleSubmissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(eligibleSubmissions);
    }
  };

  const handleGradeChange = (submissionId: string, field: 'points' | 'feedback', value: string | number) => {
    setGradeInputs(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const handleGradeSubmission = async (submissionId: string) => {
    const gradeInput = gradeInputs[submissionId];
    if (!gradeInput) return;

    try {
      const grades: SubmissionGrade[] = [{
        points_earned: gradeInput.points,
        points_possible: assignment.max_points,
        feedback: gradeInput.feedback,
        grader_id: user?.id || 'current_user',
        graded_at: new Date().toISOString()
      }];

      const updatedSubmission = await assignmentService.gradeSubmission(
        submissionId,
        grades,
        gradeInput.feedback
      );

      // Update local state
      setSubmissions(prev => prev.map(s => s.id === submissionId ? updatedSubmission : s));
      setGradingSubmission(null);
      setGradeInputs(prev => {
        const { [submissionId]: removed, ...rest } = prev;
        return rest;
      });

      onGradeSubmitted?.(submissionId, grades);
      await loadStatistics(); // Refresh statistics
    } catch (error: any) {
      console.error('Error grading submission:', error);
    }
  };

  const handleBulkGrade = async () => {
    if (selectedSubmissions.length === 0) return;

    const bulkPoints = window.prompt('Puntos para todas las submissions seleccionadas:', '');
    const bulkFeedback = window.prompt('Feedback para todas las submissions:', '');
    
    if (bulkPoints === null) return;

    try {
      const points = parseFloat(bulkPoints);
      if (isNaN(points) || points < 0 || points > assignment.max_points) {
        alert('Puntos inválidos');
        return;
      }

      const grades = [{
        points_earned: points,
        points_possible: assignment.max_points,
        feedback: bulkFeedback || '',
        grader_id: user?.id || 'current_user',
        graded_at: new Date().toISOString()
      }];

      const updatedSubmissions = await assignmentService.bulkGrade({
        submission_ids: selectedSubmissions,
        grades,
        feedback: bulkFeedback || ''
      });

      // Update local state
      setSubmissions(prev => prev.map(s => {
        const updated = updatedSubmissions.find(u => u.id === s.id);
        return updated || s;
      }));

      setSelectedSubmissions([]);
      onBulkGrade?.(selectedSubmissions, grades);
      await loadStatistics();
    } catch (error: any) {
      console.error('Error bulk grading:', error);
    }
  };

  const getStatusBadge = (submission: AssignmentSubmission) => {
    const statusColor = assignmentService.getStatusColor(submission.status);
    const statusLabel = assignmentService.getStatusLabel(submission.status);
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
        {statusLabel}
      </span>
    );
  };

  const getGradeBadge = (submission: AssignmentSubmission) => {
    if (submission.grade_status !== GradeStatus.COMPLETED) {
      return <span className="text-gray-400 text-sm">Sin calificar</span>;
    }

    const letterGrade = assignmentService.calculateLetterGrade(submission.percentage_grade);
    const colorClass = submission.is_passing ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`text-sm font-medium ${colorClass}`}>
        {submission.total_points_earned}/{submission.total_points_possible}
        <span className="ml-1">({submission.percentage_grade.toFixed(1)}% - {letterGrade})</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando submissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{assignment.title}</h2>
            <p className="text-gray-600 mt-1">Calificación y gestión de entregas</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadSubmissions}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Estudiantes</p>
                  <p className="text-2xl font-bold text-blue-900">{statistics.total_students}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Entregas</p>
                  <p className="text-2xl font-bold text-green-900">{statistics.total_submissions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Calificadas</p>
                  <p className="text-2xl font-bold text-purple-900">{statistics.graded_submissions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Promedio</p>
                  <p className="text-2xl font-bold text-yellow-900">{statistics.average_grade.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todas las entregas</option>
                <option value="submitted">Enviadas</option>
                <option value="pending">Pendientes de calificar</option>
                <option value="graded">Calificadas</option>
                <option value="late">Entregas tardías</option>
              </select>
            </div>

            {/* Results count */}
            <span className="text-sm text-gray-600">
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Bulk Actions */}
          {selectedSubmissions.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedSubmissions.length} seleccionada{selectedSubmissions.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={handleBulkGrade}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Calificar en Lote
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedSubmissions.length === (Array.isArray(filteredSubmissions) ? filteredSubmissions : []).filter(s => s.status === SubmissionStatus.SUBMITTED).length}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Seleccionar todo
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id}>
              {/* Main submission row */}
              <div className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {submission.status === SubmissionStatus.SUBMITTED && (
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={() => handleSelectSubmission(submission.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {submission.student_name || `Estudiante ${submission.student_id}`}
                        </h3>
                        {getStatusBadge(submission)}
                        {submission.is_late && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {submission.days_late} día{submission.days_late !== 1 ? 's' : ''} tarde
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        {submission.submitted_at && (
                          <span className="flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(submission.submitted_at).toLocaleString()}
                          </span>
                        )}
                        {submission.files.length > 0 && (
                          <span>{submission.files.length} archivo{submission.files.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {getGradeBadge(submission)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setExpandedSubmission(
                          expandedSubmission === submission.id ? null : submission.id
                        )}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {expandedSubmission === submission.id ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5" />
                        )}
                      </button>
                      
                      {submission.status === SubmissionStatus.SUBMITTED && (
                        <button
                          onClick={() => setGradingSubmission(
                            gradingSubmission === submission.id ? null : submission.id
                          )}
                          className="p-2 text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded submission details */}
              {expandedSubmission === submission.id && (
                <div className="px-4 pb-4 bg-gray-50">
                  <div className="space-y-4">
                    {/* Text content */}
                    {submission.text_content && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Respuesta de texto:</h4>
                        <div className="bg-white p-3 rounded border text-sm">
                          {submission.text_content}
                        </div>
                      </div>
                    )}

                    {/* Files */}
                    {submission.files.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Archivos adjuntos:</h4>
                        <div className="space-y-2">
                          {submission.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div className="flex items-center space-x-2">
                                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{file.original_filename}</span>
                                <span className="text-xs text-gray-500">
                                  ({assignmentService.formatFileSize(file.file_size)})
                                </span>
                              </div>
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {submission.comments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Comentarios:</h4>
                        <div className="space-y-2">
                          {submission.comments.map((comment) => (
                            <div key={comment.id} className="bg-white p-3 rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {comment.author_name} ({comment.author_role})
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grading interface */}
              {gradingSubmission === submission.id && (
                <div className="px-4 pb-4 bg-blue-50 border-t border-blue-200">
                  <div className="py-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Calificar submission</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Puntos (máximo: {assignment.max_points})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={assignment.max_points}
                          value={gradeInputs[submission.id]?.points || ''}
                          onChange={(e) => handleGradeChange(submission.id, 'points', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Feedback
                        </label>
                        <textarea
                          value={gradeInputs[submission.id]?.feedback || ''}
                          onChange={(e) => handleGradeChange(submission.id, 'feedback', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Comentarios para el estudiante..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-3 mt-4">
                      <button
                        onClick={() => setGradingSubmission(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleGradeSubmission(submission.id)}
                        disabled={!gradeInputs[submission.id]?.points}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Guardar Calificación
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay submissions</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'all' 
                ? 'No se han enviado assignments todavía.'
                : 'No hay submissions que coincidan con el filtro seleccionado.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentGrading;
