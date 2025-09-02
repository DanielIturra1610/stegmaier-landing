/**
 * Página de calificación de assignments para administradores/instructores
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { AssignmentGrading } from '../../components/assignments/AssignmentGrading';
import { assignmentService } from '../../services/assignmentService';
import { Assignment, AssignmentSubmission } from '../../types/assignment';

const AdminAssignmentGrading: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentId) {
      loadAssignmentData();
    }
  }, [assignmentId]);

  const loadAssignmentData = async () => {
    if (!assignmentId) return;

    try {
      setLoading(true);
      console.log('🔄 [AdminAssignmentGrading] Loading assignment data for:', assignmentId);
      
      // Cargar assignment
      const assignmentData = await assignmentService.getAssignment(assignmentId);
      setAssignment(assignmentData);
      console.log('📋 [AdminAssignmentGrading] Assignment loaded:', assignmentData.title);
      
      // Cargar submissions del assignment
      const submissionsData = await assignmentService.getAssignmentSubmissions(assignmentId);
      setSubmissions(submissionsData);
      console.log('📝 [AdminAssignmentGrading] Submissions loaded:', submissionsData.length);
      
    } catch (error: any) {
      console.error('❌ [AdminAssignmentGrading] Error loading data:', error);
      setError('Error al cargar el assignment y submissions');
      toast.error('Error al cargar datos del assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeUpdate = async () => {
    console.log('🔄 [AdminAssignmentGrading] Grade updated, reloading submissions...');
    await loadAssignmentData();
    toast.success('Calificación actualizada exitosamente');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Assignment no encontrado'}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-500"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Calificación de Assignment
            </h1>
            <p className="text-gray-600">{assignment.title}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Total submissions: {submissions.length}</span>
          <span>
            Calificadas: {(Array.isArray(submissions) ? submissions : []).filter(s => s.status === 'graded').length}
          </span>
          <span>
            Pendientes: {(Array.isArray(submissions) ? submissions : []).filter(s => s.status === 'submitted').length}
          </span>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-500">Fecha límite</div>
            <div className="mt-1 text-lg font-medium text-gray-900">
              {assignment.due_date 
                ? new Date(assignment.due_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Sin fecha límite'
              }
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Puntuación máxima</div>
            <div className="mt-1 text-lg font-medium text-gray-900">
              {assignment.max_points} puntos
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Submissions múltiples</div>
            <div className="mt-1 text-lg font-medium text-gray-900">
              {assignment.allow_multiple_submissions ? 'Permitidas' : 'No permitidas'}
            </div>
          </div>
        </div>
        
        {assignment.instructions && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-2">Instrucciones</div>
            <div className="text-gray-900 whitespace-pre-wrap">
              {assignment.instructions}
            </div>
          </div>
        )}
      </div>

      {/* Assignment Grading Component */}
      <div className="bg-white shadow rounded-lg">
        <AssignmentGrading
          assignment={assignment}
          submissions={submissions}
          onGradeUpdate={handleGradeUpdate}
        />
      </div>
    </div>
  );
};

export default AdminAssignmentGrading;
