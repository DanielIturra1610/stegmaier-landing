import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import courseService, { Course } from '../../services/courseService';

const CoursesPageDebug: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('🚀 [DEBUG] Starting to fetch courses...');
        setLoading(true);
        setError(null);
        
        const response = await courseService.getAvailableCourses();
        console.log('📦 [DEBUG] Raw API response:', response);
        console.log('📦 [DEBUG] Response type:', typeof response);
        console.log('📦 [DEBUG] Is array:', Array.isArray(response));
        
        const coursesArray = Array.isArray(response) ? response : response.courses || [];
        console.log('📋 [DEBUG] Processed courses array:', coursesArray);
        console.log('📊 [DEBUG] Number of courses:', coursesArray.length);
        
        if (coursesArray.length > 0) {
          console.log('🔍 [DEBUG] First course details:', coursesArray[0]);
        }
        
        setCourses(coursesArray);
        console.log('✅ [DEBUG] Courses set in state successfully');
      } catch (err: any) {
        console.error('❌ [DEBUG] Error loading courses:', err);
        setError(err.message || 'Error al cargar los cursos');
        setCourses([]);
      } finally {
        setLoading(false);
        console.log('🏁 [DEBUG] Loading finished');
      }
    };

    fetchCourses();
  }, []);

  console.log('🔄 [DEBUG] Component render - Loading:', loading, 'Courses:', courses?.length || 0);

  if (loading) {
    return <div className="p-8 text-center">🔄 Cargando cursos...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">❌ Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">DEBUG - Cursos Disponibles</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p><strong>Usuario:</strong> {user?.email} (Rol: {user?.role})</p>
        <p><strong>Número de cursos:</strong> {courses.length}</p>
        <p><strong>Estado loading:</strong> {loading ? 'Sí' : 'No'}</p>
        <p><strong>Error:</strong> {error || 'Ninguno'}</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay cursos disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, index) => (
            <div key={course.id || index} className="p-4 border rounded-lg bg-white shadow">
              <h3 className="font-semibold text-lg">{course.title}</h3>
              <p className="text-gray-600 mt-1">{course.description}</p>
              <div className="mt-2 text-sm text-gray-500">
                <span>📂 Categoría: {course.category || 'Sin categoría'}</span>
                <span className="ml-4">📊 Nivel: {course.level || 'Sin nivel'}</span>
                <span className="ml-4">📚 Lecciones: {course.lessons || 0}</span>
                <span className="ml-4">⏱️ Duración: {course.duration || 0} min</span>
                <span className="ml-4">✅ Publicado: {course.is_published ? 'Sí' : 'No'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPageDebug;
