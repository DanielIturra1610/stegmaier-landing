import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import enrollmentService from '../../services/enrollmentService';
import { EnrollmentProgressResponse } from '../../types/enrollment';

export interface CourseCompletionStatus {
  isEligible: boolean;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  missingRequirements: string[];
  canGenerateCertificate: boolean;
}

export interface CertificateEligibilityProps {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  onEligibilityCheck: (status: CourseCompletionStatus) => void;
  children: (status: CourseCompletionStatus, loading: boolean) => React.ReactNode;
}

/**
 * Componente para verificar si un estudiante es elegible para recibir un certificado
 * Valida el progreso del curso y los requisitos de completitud
 */
const CertificateEligibilityChecker: React.FC<CertificateEligibilityProps> = ({
  enrollmentId,
  courseId,
  courseName,
  onEligibilityCheck,
  children
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completionStatus, setCompletionStatus] = useState<CourseCompletionStatus>({
    isEligible: false,
    progress: 0,
    completedLessons: 0,
    totalLessons: 0,
    missingRequirements: [],
    canGenerateCertificate: false
  });

  /**
   * Verificar elegibilidad para certificado
   */
  const checkEligibility = async (): Promise<void> => {
    if (!user || !enrollmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Obtener progreso del enrollment
      const progressData: EnrollmentProgressResponse = await enrollmentService.getEnrollmentProgress(enrollmentId);
      
      const missingRequirements: string[] = [];
      const progress = progressData.progress || 0;
      const completedLessons = progressData.completed_lessons_count || 0;
      const totalLessons = progressData.total_lessons || 0;

      // Validar progreso mínimo requerido (100%)
      if (progress < 100) {
        missingRequirements.push(`Progreso del curso: ${progress.toFixed(1)}% (se requiere 100%)`);
      }

      // Validar que todas las lecciones estén completadas
      if (completedLessons < totalLessons) {
        const pendingLessons = totalLessons - completedLessons;
        missingRequirements.push(`${pendingLessons} lección${pendingLessons > 1 ? 'es' : ''} pendiente${pendingLessons > 1 ? 's' : ''} por completar`);
      }

      // Validar tiempo mínimo (opcional, se puede configurar por curso)
      const minimumTimeRequired = 0; // En minutos, 0 = sin requisito mínimo
      const timeSpentMinutes = (progressData.time_spent || 0) / 60;
      
      if (minimumTimeRequired > 0 && timeSpentMinutes < minimumTimeRequired) {
        missingRequirements.push(`Tiempo mínimo requerido: ${minimumTimeRequired} minutos (actual: ${Math.round(timeSpentMinutes)} minutos)`);
      }

      // Verificar que el enrollment esté en estado completado
      if (progressData.status !== 'completed' && progress >= 100) {
        // Si el progreso es 100% pero el status no es completed, intentar actualizarlo
        // Esto puede ocurrir si el sistema no actualizó el estado automáticamente
        console.log('Course completed but status not updated, this should be handled by the backend');
      }

      if (progressData.status !== 'completed' && progress < 100) {
        missingRequirements.push('El curso debe estar marcado como completado');
      }

      const isEligible = missingRequirements.length === 0;
      const canGenerateCertificate = isEligible;

      const status: CourseCompletionStatus = {
        isEligible,
        progress,
        completedLessons,
        totalLessons,
        missingRequirements,
        canGenerateCertificate
      };

      setCompletionStatus(status);
      onEligibilityCheck(status);

    } catch (error: any) {
      console.error('Error checking certificate eligibility:', error);
      
      const status: CourseCompletionStatus = {
        isEligible: false,
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
        missingRequirements: ['Error al verificar el progreso del curso'],
        canGenerateCertificate: false
      };

      setCompletionStatus(status);
      onEligibilityCheck(status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEligibility();
  }, [enrollmentId, user]);

  return (
    <>
      {children(completionStatus, loading)}
    </>
  );
};

/**
 * Hook para verificar elegibilidad de certificado
 */
export const useCertificateEligibility = (enrollmentId: string) => {
  const [status, setStatus] = useState<CourseCompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkEligibility = async () => {
    if (!enrollmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const progressData = await enrollmentService.getEnrollmentProgress(enrollmentId);
      
      const missingRequirements: string[] = [];
      const progress = progressData.progress || 0;
      const completedLessons = progressData.completed_lessons_count || 0;
      const totalLessons = progressData.total_lessons || 0;

      if (progress < 100) {
        missingRequirements.push(`Progreso: ${progress.toFixed(1)}% (se requiere 100%)`);
      }

      if (completedLessons < totalLessons) {
        const pending = totalLessons - completedLessons;
        missingRequirements.push(`${pending} lección${pending > 1 ? 'es' : ''} pendiente${pending > 1 ? 's' : ''}`);
      }

      const eligibilityStatus: CourseCompletionStatus = {
        isEligible: missingRequirements.length === 0,
        progress,
        completedLessons,
        totalLessons,
        missingRequirements,
        canGenerateCertificate: missingRequirements.length === 0
      };

      setStatus(eligibilityStatus);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setStatus({
        isEligible: false,
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
        missingRequirements: ['Error al verificar progreso'],
        canGenerateCertificate: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEligibility();
  }, [enrollmentId]);

  return { status, loading, recheckEligibility: checkEligibility };
};

/**
 * Componente de estado de elegibilidad
 */
export const EligibilityStatusCard: React.FC<{
  status: CourseCompletionStatus;
  courseName: string;
}> = ({ status, courseName }) => {
  if (status.isEligible) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              ¡Certificado disponible!
            </h3>
            <div className="mt-1 text-sm text-green-700">
              <p>Has completado exitosamente el curso "{courseName}"</p>
              <p className="mt-1">
                • Progreso: {status.progress}%
              </p>
              <p>
                • Lecciones completadas: {status.completedLessons}/{status.totalLessons}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Requisitos pendientes para el certificado
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            <p>Curso: "{courseName}"</p>
            <p className="mt-1">Progreso actual: {status.progress}%</p>
            <p>Lecciones completadas: {status.completedLessons}/{status.totalLessons}</p>
            <div className="mt-2">
              <p className="font-medium">Para obtener tu certificado necesitas:</p>
              <ul className="mt-1 list-disc list-inside">
                {status.missingRequirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateEligibilityChecker;
