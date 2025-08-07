/**
 * CourseDetailPage refactorizada - conectada al backend
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCourseDetail } from '../../hooks/useCourseDetail';
import { UserCourseAccess } from '../../types/course';
import { enrollmentService } from '../../services/enrollmentService';

// Componentes
import CourseHero from '../../components/course/CourseHero';
import CourseContent from '../../components/course/CourseContent';
import CourseDetailSkeleton from '../../components/course/CourseDetailSkeleton';
import ErrorState from '../../components/ui/ErrorState';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  
  // Hook personalizado para cargar datos del curso
  const { 
    course, 
    lessons, 
    loading, 
    error, 
    refetch,
    resetError 
  } = useCourseDetail({ 
    courseId: courseId!, 
    enabled: !!courseId 
  });

  // Handler para inscripción en curso
  const handleEnrollment = async () => {
    if (!courseId || !user) {
      navigate('/login');
      return;
    }

    try {
      setEnrollmentLoading(true);
      await enrollmentService.enrollInCourse(courseId);
      
      // Recargar datos del curso para mostrar estado actualizado
      await refetch();
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      // TODO: Mostrar toast de error
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Handler para iniciar/continuar curso
  const handleStartCourse = () => {
    if (!courseId) return;
    
    // Navegar a la primera lección disponible
    const firstAvailableLesson = lessons.find(lesson => lesson.has_access);
    if (firstAvailableLesson) {
      navigate(`/platform/courses/${courseId}/lessons/${firstAvailableLesson.id}`);
    }
  };

  // Handler para click en lección
  const handleLessonClick = (lessonId: string) => {
    if (!courseId) return;
    navigate(`/platform/courses/${courseId}/lessons/${lessonId}`);
  };

  // Validación inicial
  if (!courseId) {
    return (
      <ErrorState 
        error="ID de curso no válido"
        title="Curso no válido"
        description="La URL del curso no es válida."
        showBackButton={false}
      />
    );
  }

  // Estado de carga
  if (loading) {
    return <CourseDetailSkeleton />;
  }

  // Estado de error
  if (error || !course) {
    return (
      <ErrorState 
        error={error || 'Curso no encontrado'}
        onRetry={refetch}
        showHomeButton={true}
        showBackButton={true}
      />
    );
  }

  // Determinar acceso del usuario
  const userAccess: UserCourseAccess = {
    can_view_detail: true,
    is_enrolled: !!course.user_enrollment,
    can_enroll: !course.user_enrollment && course.is_published,
    enrollment_status: course.user_enrollment?.status,
    access_type: (course.user_enrollment ? 'premium' : 'free') as 'premium' | 'free' | 'instructor' | 'admin',
    restrictions: course.user_enrollment ? [] : ['Inscríbete para acceder al contenido completo']
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <CourseHero
            course={course}
            userAccess={userAccess}
            onEnroll={handleEnrollment}
            onStart={handleStartCourse}
            enrollmentLoading={enrollmentLoading}
          />

          {/* Content Tabs */}
          <CourseContent
            course={course}
            lessons={lessons}
            userAccess={userAccess}
            onLessonClick={handleLessonClick}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
