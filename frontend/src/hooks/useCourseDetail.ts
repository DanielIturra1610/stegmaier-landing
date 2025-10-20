/**
 * Hook personalizado para manejar datos de CourseDetailPage
 */
import { useState, useEffect, useCallback } from 'react';
import { CourseDetailPageData, CourseDetailState } from '../types/course';
import { courseService } from '../services/courseService';

interface UseCourseDetailProps {
  courseId: string;
  enabled?: boolean; // Para deshabilitar la carga automática
}

interface UseCourseDetailReturn extends CourseDetailState {
  refetch: () => Promise<void>;
  resetError: () => void;
}

export const useCourseDetail = ({ 
  courseId, 
  enabled = true 
}: UseCourseDetailProps): UseCourseDetailReturn => {
  const [data, setData] = useState<CourseDetailPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Función para cargar datos del curso
  const fetchCourseData = useCallback(async () => {
    if (!courseId || !enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 [useCourseDetail] Fetching course data for ID:', courseId);
      
      const courseData = await courseService.getCourseWithLessons(courseId);
      
      console.log('✅ [useCourseDetail] Course data loaded successfully');
      setData(courseData);
    } catch (err: any) {
      console.error('❌ [useCourseDetail] Error loading course data:', err);
      
      // Manejar diferentes tipos de errores
      if (err.message?.includes('404') || err.response?.status === 404) {
        setError('Curso no encontrado');
      } else if (err.message?.includes('403') || err.response?.status === 403) {
        setError('No tienes permisos para ver este curso');
      } else if (err.message?.includes('Network Error')) {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        setError(err.message || 'Error al cargar el curso');
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, enabled]);

  // Función para recargar datos
  const refetch = useCallback(async () => {
    await fetchCourseData();
  }, [fetchCourseData]);

  // Función para limpiar errores
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (enabled && courseId) {
      fetchCourseData();
    }
  }, [fetchCourseData, courseId, enabled]);

  // Estado combinado para compatibilidad con CourseDetailState
  const state: CourseDetailState = {
    course: data?.course || null,
    lessons: data?.lessons || [],
    loading,
    error,
    enrollment_loading: enrollmentLoading
  };

  return {
    ...state,
    refetch,
    resetError
  };
};

// Hook simplificado solo para verificar disponibilidad del curso
export const useCourseAvailability = (courseId: string) => {
  const [availability, setAvailability] = useState<{
    exists: boolean;
    published: boolean;
    accessible: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const checkAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await courseService.checkCourseAvailability(courseId);
        setAvailability(result);
      } catch (err: any) {
        console.error('Error checking course availability:', err);
        setError(err.message || 'Error al verificar disponibilidad del curso');
        setAvailability({ exists: false, published: false, accessible: false });
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [courseId]);

  return { availability, loading, error };
};

export default useCourseDetail;
