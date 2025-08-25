/**
 * Componente para mostrar calificaciones a estudiantes
 * Incluye rubric detallado, feedback y opción de comentarios
 */
import React, { useState, useCallback } from 'react';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { assignmentService } from '../../services/assignmentService';
import {
  Assignment,
  AssignmentSubmission,
  GradeViewerProps,
  GradeStatus,
  SubmissionComment,
  RubricCriterion
} from '../../types/assignment';

export const GradeViewer: React.FC<GradeViewerProps> = ({
  submission,
  assignment,
  showRubric = true,
  allowComments = true
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<SubmissionComment[]>(submission.comments);
  const [expandedCriterion, setExpandedCriterion] = useState<string | null>(null);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const comment = await assignmentService.addComment(submission.id, {
        content: newComment.trim(),
        is_private: false
      });
      
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error: any) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  }, [submission.id, newComment]);

  const getGradeStatusInfo = () => {
    switch (submission.grade_status) {
      case GradeStatus.COMPLETED:
        return {
          icon: CheckCircleIcon,
          text: 'Calificado',
          color: 'text-green-600 bg-green-100',
          description: 'Tu assignment ha sido calificado'
        };
      case GradeStatus.IN_PROGRESS:
        return {
          icon: ClockIcon,
          text: 'En revisión',
          color: 'text-yellow-600 bg-yellow-100',
          description: 'El instructor está revisando tu entrega'
        };
      case GradeStatus.NEEDS_REVISION:
        return {
          icon: ExclamationTriangleIcon,
          text: 'Necesita revisión',
          color: 'text-orange-600 bg-orange-100',
          description: 'Se requieren ajustes en tu entrega'
        };
      default:
        return {
          icon: ClockIcon,
          text: 'Pendiente',
          color: 'text-gray-600 bg-gray-100',
          description: 'Esperando calificación'
        };
    }
  };

  const getOverallGradeInfo = () => {
    if (submission.grade_status !== GradeStatus.COMPLETED) {
      return null;
    }

    const letterGrade = assignmentService.calculateLetterGrade(submission.percentage_grade);
    const isPassing = submission.is_passing;
    
    return {
      points: `${submission.total_points_earned}/${submission.total_points_possible}`,
      percentage: submission.percentage_grade,
      letter: letterGrade,
      isPassing,
      penalty: submission.penalty_applied
    };
  };

  const getRubricGradeInfo = (criterionId: string) => {
    const grade = submission.grades.find(g => g.criterion_id === criterionId);
    if (!grade) return null;

    const criterion = assignment.rubric?.criteria.find(c => c.id === criterionId);
    if (!criterion) return null;

    return {
      pointsEarned: grade.points_earned,
      pointsPossible: grade.points_possible,
      percentage: (grade.points_earned / grade.points_possible) * 100,
      feedback: grade.feedback
    };
  };

  const statusInfo = getGradeStatusInfo();
  const gradeInfo = getOverallGradeInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{assignment.title}</h2>
            <p className="text-gray-600 mt-1">Calificación y retroalimentación</p>
          </div>
          
          <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {statusInfo.text}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Enviado:</span>
            <span className="ml-2 font-medium">
              {submission.submitted_at 
                ? new Date(submission.submitted_at).toLocaleString()
                : 'No enviado'
              }
            </span>
          </div>
          
          <div className="flex items-center">
            <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Versión:</span>
            <span className="ml-2 font-medium">#{submission.submission_number}</span>
          </div>
          
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Estado:</span>
            <span className="ml-2 font-medium">{assignmentService.getStatusLabel(submission.status)}</span>
          </div>
        </div>
      </div>

      {/* Overall Grade */}
      {gradeInfo && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <AcademicCapIcon className="h-6 w-6 mr-2" />
              Calificación Final
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Points */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {gradeInfo.points}
              </div>
              <div className="text-sm text-gray-600">Puntos</div>
            </div>

            {/* Percentage */}
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                gradeInfo.isPassing ? 'text-green-600' : 'text-red-600'
              }`}>
                {gradeInfo.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Porcentaje</div>
            </div>

            {/* Letter Grade */}
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                gradeInfo.isPassing ? 'text-green-600' : 'text-red-600'
              }`}>
                {gradeInfo.letter}
              </div>
              <div className="text-sm text-gray-600">Calificación</div>
            </div>
          </div>

          {/* Pass/Fail Status */}
          <div className="mt-6 flex items-center justify-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              gradeInfo.isPassing 
                ? 'text-green-800 bg-green-100' 
                : 'text-red-800 bg-red-100'
            }`}>
              {gradeInfo.isPassing ? (
                <CheckCircleIcon className="h-4 w-4 mr-2" />
              ) : (
                <XCircleIcon className="h-4 w-4 mr-2" />
              )}
              {gradeInfo.isPassing ? 'Aprobado' : 'No Aprobado'}
              {gradeInfo.penalty > 0 && (
                <span className="ml-2 text-xs">
                  (Penalización: -{gradeInfo.penalty.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>

          {/* Late submission warning */}
          {submission.is_late && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Entrega tardía: {submission.days_late} día{submission.days_late !== 1 ? 's' : ''} de retraso
                    {gradeInfo.penalty > 0 && (
                      <span className="block mt-1">
                        Se aplicó una penalización del {gradeInfo.penalty.toFixed(1)}% por entrega tardía.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rubric Breakdown */}
      {showRubric && assignment.rubric && submission.grade_status === GradeStatus.COMPLETED && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2" />
            Desglose por Criterios
          </h3>

          <div className="space-y-4">
            {assignment.rubric.criteria.map((criterion) => {
              const gradeInfo = getRubricGradeInfo(criterion.id);
              const isExpanded = expandedCriterion === criterion.id;
              
              return (
                <div key={criterion.id} className="border border-gray-200 rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedCriterion(isExpanded ? null : criterion.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          {criterion.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {criterion.description}
                        </p>
                      </div>
                      
                      <div className="text-right ml-4">
                        {gradeInfo ? (
                          <div className="text-lg font-semibold text-gray-900">
                            {gradeInfo.pointsEarned}/{gradeInfo.pointsPossible}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Sin calificar</div>
                        )}
                      </div>
                    </div>

                    {gradeInfo && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              gradeInfo.percentage >= 70 ? 'bg-green-500' : 
                              gradeInfo.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${gradeInfo.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>{gradeInfo.percentage.toFixed(1)}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isExpanded && gradeInfo && gradeInfo.feedback && (
                    <div className="border-t border-gray-200 p-4 bg-blue-50">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Retroalimentación:
                      </h5>
                      <p className="text-sm text-gray-700">{gradeInfo.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructor Feedback */}
      {submission.instructor_feedback && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-6 w-6 mr-2" />
            Comentarios del Instructor
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {submission.instructor_feedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {allowComments && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
            Conversación ({comments.length})
          </h3>

          {/* Existing Comments */}
          <div className="space-y-4 mb-6">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>No hay comentarios todavía.</p>
                <p className="text-sm">¡Inicia la conversación!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`flex space-x-3 ${
                    comment.author_role === 'student' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                    comment.author_role === 'instructor' ? 'bg-blue-500' : 
                    comment.author_role === 'student' ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    {comment.author_name?.charAt(0) || 'U'}
                  </div>
                  
                  <div className={`flex-1 ${comment.author_role === 'student' ? 'text-right' : ''}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.author_name || 'Usuario'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      {comment.author_role === 'instructor' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Instructor
                        </span>
                      )}
                    </div>
                    <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${
                      comment.author_role === 'student' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-medium text-white">
                T
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe tu pregunta o comentario..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">
                    {newComment.length}/500 caracteres
                  </div>
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmittingComment || newComment.length > 500}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingComment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        Enviar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {submission.grade_status !== GradeStatus.COMPLETED && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {statusInfo.description}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Recibirás una notificación cuando tu assignment sea calificado.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeViewer;
