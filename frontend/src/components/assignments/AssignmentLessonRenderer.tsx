import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AssignmentSubmissionComponent from './AssignmentSubmission';
import AssignmentGrading from './AssignmentGrading';
import GradeViewer from './GradeViewer';
import { Assignment, AssignmentSubmission as AssignmentSubmissionType } from '../../types/assignment';
import { assignmentService } from '../../services/assignmentService';
import progressService from '../../services/progressService';
import { 
  ClockIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

interface AssignmentLessonRendererProps {
  lesson: {
    id: string;
    title: string;
    content: string;
    lesson_type: string;
    assignment_id?: string;
  };
  courseId?: string;
  enrollmentId?: string;
  onComplete?: () => void;
}

/**
 * Componente que renderiza lecciones de tipo ASSIGNMENT
 * Maneja diferentes vistas según el rol del usuario (estudiante/instructor/admin)
 */
const AssignmentLessonRenderer: React.FC<AssignmentLessonRendererProps> = ({
  lesson,
  courseId,
  enrollmentId,
  onComplete
}) => {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmissionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la vista del instructor
  const [showGradingView, setShowGradingView] = useState(false);

  useEffect(() => {
    loadAssignmentData();
  }, [lesson.assignment_id]);

  const loadAssignmentData = async () => {
    if (!lesson.assignment_id) {
      setError('Assignment ID no encontrado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cargar datos del assignment
      const assignmentData = await assignmentService.getAssignment(lesson.assignment_id);
      setAssignment(assignmentData);

      // Si es estudiante, cargar su submission
      if (user?.role === 'student') {
        try {
          const submissionData = await assignmentService.getMySubmission(lesson.assignment_id);
          setSubmission(submissionData);
        } catch (submissionError) {
          // No hay submission yet, esto es normal
          console.log('No submission found yet');
        }
      }

    } catch (error) {
      console.error('Error loading assignment data:', error);
      setError('Error al cargar el assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionUpdate = async (updatedSubmission: AssignmentSubmissionType) => {
    setSubmission(updatedSubmission);
    
    // Tracking de progreso para assignments
    if (lesson.assignment_id && courseId && enrollmentId) {
      try {
        // Si es la primera vez que se hace una submission, marcar como iniciado
        if (!submission && updatedSubmission.status === 'in_progress') {
          await progressService.startAssignment(lesson.id, lesson.assignment_id, courseId, enrollmentId);
          console.log('🎯 [AssignmentProgress] Assignment iniciado:', lesson.assignment_id);
        }
        
        // Actualizar progreso basado en estado de submission
        let progressPercentage = 0;
        if (updatedSubmission.status === 'in_progress') {
          progressPercentage = 50;
        } else if (updatedSubmission.status === 'submitted') {
          progressPercentage = 100;
        } else if (updatedSubmission.status === 'graded') {
          progressPercentage = 100;
        }
        
        await progressService.updateAssignmentProgress(
          lesson.id,
          lesson.assignment_id,
          courseId,
          enrollmentId,
          {
            progress_percentage: progressPercentage,
            time_spent_delta: 0, // TODO: Implementar tracking de tiempo
            submission_status: updatedSubmission.status
          }
        );
        
        // Si la submission está finalizada, marcar assignment como completado
        if (updatedSubmission.status === 'submitted') {
          await progressService.completeAssignment(
            lesson.id,
            lesson.assignment_id,
            courseId,
            enrollmentId,
            updatedSubmission.id
          );
          console.log('✅ [AssignmentProgress] Assignment completado:', lesson.assignment_id);
          
          if (onComplete) {
            onComplete();
          }
        }
        
      } catch (error) {
        console.error('❌ [AssignmentProgress] Error actualizando progreso:', error);
        // No bloquear la UI si el progreso falla
      }
    } else if (updatedSubmission.status === 'submitted' && onComplete) {
      // Fallback si no hay tracking disponible
      onComplete();
    }
  };

  const formatDueDate = (dateString: string): string => {
    const dueDate = new Date(dateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Vencido hace ${Math.abs(diffDays)} días`;
    } else if (diffDays === 0) {
      return 'Vence hoy';
    } else if (diffDays === 1) {
      return 'Vence mañana';
    } else {
      return `Vence en ${diffDays} días`;
    }
  };

  const getDueDateColor = (dateString: string): string => {
    const dueDate = new Date(dateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600 bg-red-100';
    if (diffDays <= 1) return 'text-orange-600 bg-orange-100';
    if (diffDays <= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-600 bg-blue-100';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar assignment</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadAssignmentData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista para instructores/admins
  if (user?.role === 'instructor' || user?.role === 'admin') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header del Assignment */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Assignment</span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>Vence: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('es-ES') : 'Sin fecha límite'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PaperClipIcon className="w-4 h-4" />
                  <span>Entrega múltiple: {assignment.allow_multiple_submissions ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowGradingView(!showGradingView)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showGradingView
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showGradingView ? 'Ver Descripción' : 'Ver Entregas'}
              </button>
            </div>
          </div>

          {/* Descripción del assignment (solo cuando no está en vista de calificación) */}
          {!showGradingView && (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
            </div>
          )}
        </div>

        {/* Vista condicional: Descripción o Calificación */}
        {showGradingView ? (
          <AssignmentGrading 
            assignment={assignment}
            submissions={[]}
          />
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Vista de Instructor</h3>
                <p className="text-blue-800 text-sm">
                  Los estudiantes verán aquí la interfaz de entrega. 
                  Usa el botón "Ver Entregas" para revisar y calificar las submissions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista para estudiantes
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header del Assignment */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h2>
          
          {/* Info row con fecha de vencimiento y estado */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Assignment</span>
              </div>
              
              {/* Due date badge */}
              {assignment.due_date && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDueDateColor(assignment.due_date)}`}>
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  {formatDueDate(assignment.due_date)}
                </div>
              )}
              
              <div className="flex items-center gap-1 text-gray-600">
                <PaperClipIcon className="w-4 h-4" />
                <span>Entrega múltiple: {assignment.allow_multiple_submissions ? 'Sí' : 'No'}</span>
              </div>
            </div>

            {/* Submission status */}
            {submission && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                submission.status === 'submitted' 
                  ? 'bg-green-100 text-green-800'
                  : submission.status === 'graded'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {submission.status === 'submitted' && '✓ Entregado'}
                {submission.status === 'graded' && '✓ Calificado'}
                {submission.status === 'in_progress' && '📝 En progreso'}
              </div>
            )}
          </div>
        </div>

        {/* Descripción del assignment */}
        <div className="prose max-w-none border-t pt-4">
          <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
        </div>
      </div>

      {/* Interfaz de entrega o visualización de calificación */}
      {submission?.status === 'graded' ? (
        <GradeViewer 
          submission={submission}
          assignment={assignment}
        />
      ) : (
        <AssignmentSubmissionComponent 
          assignment={assignment}
          existingSubmission={submission || undefined}
          onSubmissionUpdate={handleSubmissionUpdate}
        />
      )}
    </div>
  );
};

export default AssignmentLessonRenderer;
