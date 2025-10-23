/**
 * Componente para mostrar el estado de inscripción de un usuario
 * Incluye progreso, estado, y acciones disponibles
 */
import React from 'react';
import { EnrollmentStatus, EnrollmentProgressResponse } from '../../types/enrollment';

interface EnrollmentStatusProps {
  enrollment: EnrollmentProgressResponse;
  showProgress?: boolean;
  showActions?: boolean;
  onContinue?: () => void;
  onUnenroll?: () => void;
  className?: string;
}

const EnrollmentStatusComponent: React.FC<EnrollmentStatusProps> = ({
  enrollment,
  showProgress = true,
  showActions = true,
  onContinue,
  onUnenroll,
  className = ""
}) => {
  const getStatusConfig = (status: EnrollmentStatus) => {
    switch (status) {
      case EnrollmentStatus.ACTIVE:
        return {
          label: 'Activo',
          color: 'text-green-700 bg-green-100',
          icon: '✓'
        };
      case EnrollmentStatus.COMPLETED:
        return {
          label: 'Completado',
          color: 'text-blue-700 bg-blue-100',
          icon: '🎓'
        };
      case EnrollmentStatus.EXPIRED:
        return {
          label: 'Expirado',
          color: 'text-red-700 bg-red-100',
          icon: '⏰'
        };
      case EnrollmentStatus.CANCELLED:
        return {
          label: 'Cancelado',
          color: 'text-gray-700 bg-gray-100',
          icon: '❌'
        };
      default:
        return {
          label: 'Desconocido',
          color: 'text-gray-700 bg-gray-100',
          icon: '?'
        };
    }
  };

  const statusConfig = getStatusConfig(enrollment.status);
  const progress = Math.round(enrollment.progress);
  const isCompleted = enrollment.status === EnrollmentStatus.COMPLETED;
  const isActive = enrollment.status === EnrollmentStatus.ACTIVE;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header con estado */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
            <span className="mr-1">{statusConfig.icon}</span>
            {statusConfig.label}
          </span>
          {enrollment.certificate_issued && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow-700 bg-yellow-100">
              🏆 Certificado
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(enrollment.enrolled_at || enrollment.enrollment_date)}
        </div>
      </div>

      {/* Barra de progreso */}
      {showProgress && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Progreso del curso</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-blue-600' : 'bg-primary-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {enrollment.completedLessonsCount !== undefined && (enrollment.totalLessonsCount !== undefined || enrollment.totalLessons !== undefined) && (
            <div className="text-xs text-gray-500 mt-1">
              {enrollment.completedLessonsCount} de {enrollment.totalLessons || enrollment.totalLessonsCount || 0} lecciones completadas
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        {enrollment.lastActivity && (
          <div>
            <span className="text-gray-500">Última actividad:</span>
            <div className="font-medium">{formatDate(enrollment.lastActivity)}</div>
          </div>
        )}
        {enrollment.expected_completion_date && (
          <div>
            <span className="text-gray-500">Finalización estimada:</span>
            <div className="font-medium">{formatDate(enrollment.expected_completion_date)}</div>
          </div>
        )}
        {enrollment.timeSpentMinutes !== undefined && (
          <div>
            <span className="text-gray-500">Tiempo invertido:</span>
            <div className="font-medium">
              {enrollment.timeSpentMinutes > 60
                ? `${Math.floor(enrollment.timeSpentMinutes / 60)}h ${enrollment.timeSpentMinutes % 60}m`
                : `${enrollment.timeSpentMinutes}m`
              }
            </div>
          </div>
        )}
        {enrollment.completion_date && (
          <div>
            <span className="text-gray-500">Fecha de finalización:</span>
            <div className="font-medium text-green-600">{formatDate(enrollment.completion_date)}</div>
          </div>
        )}
      </div>

      {/* Acciones */}
      {showActions && (
        <div className="flex space-x-2">
          {isActive && onContinue && (
            <button
              onClick={onContinue}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors font-medium"
            >
              {progress > 0 ? 'Continuar' : 'Comenzar'}
            </button>
          )}
          
          {isCompleted && enrollment.certificate_issued && (
            <button
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
              onClick={() => {
                // TODO: Implementar descarga de certificado
                console.log('Download certificate for enrollment:', enrollment.id);
              }}
            >
              Descargar Certificado
            </button>
          )}
          
          {(isActive || enrollment.status === EnrollmentStatus.EXPIRED) && onUnenroll && (
            <button
              onClick={onUnenroll}
              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors font-medium border border-red-300"
            >
              Desincribirse
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EnrollmentStatusComponent;
