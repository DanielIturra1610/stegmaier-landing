/**
 * Componente de botón para inscripción en cursos
 * Maneja el estado de enrollment y muestra el botón apropiado
 */
import React, { useState, useEffect } from 'react';
import enrollmentService from '../../services/enrollmentService';
import { CourseEnrollmentStatus, EnrollmentStatus } from '../../types/enrollment';

interface EnrollmentButtonProps {
  courseId: string;
  courseName?: string;
  onEnrollmentChange?: (enrolled: boolean) => void;
  onNavigateToCourse?: (courseId: string) => void;
  className?: string;
  disabled?: boolean;
}

const EnrollmentButton: React.FC<EnrollmentButtonProps> = ({
  courseId,
  courseName = "este curso",
  onEnrollmentChange,
  onNavigateToCourse,
  className = "",
  disabled = false
}) => {
  const [enrollmentStatus, setEnrollmentStatus] = useState<CourseEnrollmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Cargar estado de enrollment al montar
  useEffect(() => {
    loadEnrollmentStatus();
  }, [courseId]);

  const loadEnrollmentStatus = async () => {
    try {
      setLoading(true);
      const status = await enrollmentService.getEnrollmentStatus(courseId);
      setEnrollmentStatus(status);
    } catch (error) {
      console.error('Error loading enrollment status:', error);
      // En caso de error, asumir que puede inscribirse
      setEnrollmentStatus({
        course_id: courseId,
        is_enrolled: false,
        can_enroll: true,
        enrollment_restrictions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!enrollmentStatus?.can_enroll || enrolling) return;

    try {
      setEnrolling(true);
      await enrollmentService.enrollInCourse(courseId);
      
      // Actualizar estado local
      setEnrollmentStatus(prev => prev ? {
        ...prev,
        is_enrolled: true,
        can_enroll: false,
        enrollment_restrictions: ['Ya está inscrito en este curso']
      } : null);

      // Notificar al componente padre
      onEnrollmentChange?.(true);

      // Mostrar mensaje de éxito
      console.log(`✅ Te has inscrito exitosamente en ${courseName}!`);
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      alert(`Error al inscribirse en ${courseName}: ${error.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinue = () => {
    if (onNavigateToCourse) {
      onNavigateToCourse(courseId);
    }
  };

  // Estado de loading
  if (loading) {
    return (
      <button 
        disabled 
        className={`w-full bg-gray-400 text-white py-2 px-4 rounded-md font-medium ${className}`}
      >
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Verificando...
        </div>
      </button>
    );
  }

  // No se pudo cargar el estado
  if (!enrollmentStatus) {
    return (
      <button 
        disabled 
        className={`w-full bg-red-500 text-white py-2 px-4 rounded-md font-medium ${className}`}
      >
        Error al cargar
      </button>
    );
  }

  // Usuario ya está inscrito - mostrar botón de continuar
  if (enrollmentStatus.is_enrolled) {
    const enrollment = enrollmentStatus.enrollment;
    const progress = enrollment?.progress || 0;
    
    return (
      <button 
        onClick={handleContinue}
        disabled={disabled}
        className={`w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors font-medium ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {progress > 0 ? `Continuar (${Math.round(progress)}%)` : 'Comenzar'}
      </button>
    );
  }

  // Usuario no está inscrito - mostrar botón de inscripción
  if (enrollmentStatus.can_enroll) {
    return (
      <button 
        onClick={handleEnroll}
        disabled={disabled || enrolling}
        className={`w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium ${className} ${disabled || enrolling ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {enrolling ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Inscribiendo...
          </div>
        ) : (
          'Inscribirse'
        )}
      </button>
    );
  }

  // No puede inscribirse - mostrar razón
  return (
    <button 
      disabled 
      className={`w-full bg-gray-400 text-white py-2 px-4 rounded-md font-medium cursor-not-allowed ${className}`}
      title={enrollmentStatus.enrollment_restrictions?.join(', ') || 'No disponible'}
    >
      No disponible
    </button>
  );
};

export default EnrollmentButton;
