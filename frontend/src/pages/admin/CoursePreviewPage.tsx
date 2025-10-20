/**
 * CoursePreviewPage - Página para que un admin/instructor vea un curso como estudiante
 */
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { CourseResponse, CourseDetail, UserCourseAccess, LessonOverview, LessonDetail as LessonInCourse } from '../../types/course';
import { buildApiUrl, API_ENDPOINTS, getAuthHeaders } from '../../config/api.config';

// Componentes reutilizados
import CourseHero from '../../components/course/CourseHero';
import CourseContent from '../../components/course/CourseContent';
import CourseDetailSkeleton from '../../components/course/CourseDetailSkeleton';
import ErrorState from '../../components/ui/ErrorState';

const CoursePreviewPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const simulateEnrollment = searchParams.get('mode') === 'enrolled';

  useEffect(() => {
    const savedPreviewMode = localStorage.getItem('previewMode');
    if (savedPreviewMode) {
      try {
        const { courseId: savedCourseId, mode } = JSON.parse(savedPreviewMode);
        if (savedCourseId === courseId && searchParams.get('mode') !== mode) {
          searchParams.set('mode', mode);
          navigate(`?${searchParams.toString()}`, { replace: true });
          return;
        }
      } catch (e) {
        console.error("Failed to parse previewMode from localStorage", e);
        localStorage.removeItem('previewMode');
      }
    }

    if (!courseId || !user) {
      navigate('/login');
      return;
    }

    const fetchCoursePreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = buildApiUrl(`${API_ENDPOINTS.COURSES}/${courseId}/preview?simulate_enrollment=${simulateEnrollment}`);
        const response = await axios.get<CourseResponse>(url, { headers: getAuthHeaders() });
        setCourse(response.data);
      } catch (err: any) {
        console.error('Error fetching course preview:', err);
        setError(err.response?.data?.detail || 'No se pudo cargar la vista previa del curso.');
        toast.error('Error al cargar la vista previa.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoursePreview();
  }, [courseId, user, simulateEnrollment, navigate, searchParams]);

  const handleLessonClick = (lessonId: string) => {
    const lesson = course?.lessons.find((l: LessonInCourse) => l.id === lessonId);
    if (lesson && (simulateEnrollment || lesson.is_free_preview)) {
        toast.success(`Navegarías a la lección: ${lesson.title}`);
    } else {
        toast.error('Esta lección no está disponible en la vista previa para no inscritos.');
    }
  };

  if (loading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <ErrorState 
        error={error || 'Curso no encontrado'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // --- Lógica de Adaptación de Datos ---
  const courseForHero: CourseDetail = {
    ...course,
    lessons: course.lessons,
    instructor: {
      id: course.instructor_id,
      name: 'Instructor (Vista Previa)',
    },
    stats: {
      enrollments_count: course.total_students || 0,
      lessons_count: course.lessons.length || 0,
      reviews_count: 0, // No disponible en preview
    },
    user_enrollment: simulateEnrollment ? {
      enrolled_at: new Date().toISOString(),
      progress: 30, // Valor de ejemplo
      status: 'active',
    } : undefined,
  };

  const lessonsForContent: LessonOverview[] = course.lessons.map((lesson: LessonInCourse) => ({
    id: lesson.id,
    title: lesson.title,
    order: lesson.order,
    duration: lesson.duration,
    is_free_preview: lesson.is_free_preview,
    content_type: lesson.content_type as 'video' | 'text' | 'quiz',
    has_access: simulateEnrollment || lesson.is_free_preview,
  }));

  const userAccess: UserCourseAccess = {
    can_view_detail: true,
    is_enrolled: simulateEnrollment,
    can_enroll: false,
    access_type: simulateEnrollment ? 'premium' : 'free',
    restrictions: simulateEnrollment ? [] : ['Vista previa para no inscritos'],
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="bg-yellow-400 text-black text-center p-2 font-semibold sticky top-0 z-10 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
        <span>Estás en Modo Preview ({simulateEnrollment ? 'Estudiante Inscrito' : 'Visitante'})</span>
        <button 
            onClick={() => {
              localStorage.removeItem('previewMode');
              navigate(`/platform/admin/courses/${courseId}/edit`);
            }} 
            className="px-3 py-1 bg-black text-white rounded-md text-sm font-medium"
        >
            Salir del Modo Preview
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <CourseHero
            course={courseForHero}
            userAccess={userAccess}
            onEnroll={() => {}} // No-op
            onStart={() => handleLessonClick(lessonsForContent[0]?.id || '')}
            enrollmentLoading={false}
          />

          <CourseContent
            course={courseForHero}
            lessons={lessonsForContent}
            userAccess={userAccess}
            onLessonClick={handleLessonClick}
          />
        </div>
      </div>
    </div>
  );
};

export default CoursePreviewPage;
