import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCategoryLabel, getCategoryOptions } from '../../utils/courseCategories';

interface Course {
  id: string;
  title: string;
  instructor_id: string;
  level: string;
  category: string;
  is_published: boolean;
  lessons_count: number;
  enrollments_count: number;
  status_label: string;
  created_at: string;
  price?: number; // Hacemos el precio opcional
}

const AdminCourses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const fetchCourses = async () => {
    try {
      console.log('🔄 [AdminCourses] Loading courses with filters:', { publishedFilter, categoryFilter });
      setLoading(true);
      setError(null);
      
      let url = '/api/v1/admin/courses';
      const params = new URLSearchParams();
      
      if (publishedFilter !== 'all') {
        params.append('is_published', publishedFilter === 'published' ? 'true' : 'false');
      }
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🌐 [AdminCourses] Fetching from URL:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AdminCourses] Courses loaded successfully:', data.length);
        setCourses(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Error ${response.status}: ${response.statusText}`;
        console.error('❌ [AdminCourses] HTTP Error:', response.status, errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('❌ [AdminCourses] Network/Parse Error:', err);
      const errorMessage = err.message || 'Error de conexión al servidor. Verifica tu conexión a internet.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    console.log('🔄 [AdminCourses] Retrying courses fetch...');
    fetchCourses();
  };
  
  useEffect(() => {
    fetchCourses();
  }, [publishedFilter, categoryFilter]);
  
  const handleTogglePublish = async (courseId: string) => {
    try {
      const response = await fetch(`/api/v1/admin/courses/${courseId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchCourses(); // Recargar lista
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Error de conexión');
    }
  };
  
  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el curso "${courseTitle}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/v1/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('Curso eliminado exitosamente');
        fetchCourses(); // Recargar lista
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Error de conexión');
    }
  };
  
  if (loading) {
    return <div className="text-center py-8">Cargando cursos...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar cursos</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 hover:bg-red-200 border border-transparent rounded"
                onClick={retryFetch}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Reintentar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Cursos</h1>
        <Link
          to="/platform/admin/courses/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          + Nuevo Curso
        </Link>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Todas</option>
              {getCategoryOptions().map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Tabla de cursos */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Curso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lecciones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estudiantes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {course.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getCategoryLabel(course.category)} • {course.level}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    course.is_published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.status_label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {course.lessons_count}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {course.enrollments_count}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {course.price ? `$${course.price}` : 'Sin precio'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/platform/admin/courses/${course.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(course.id)}
                      className={`${
                        course.is_published 
                          ? 'text-yellow-600 hover:text-yellow-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {course.is_published ? 'Despublicar' : 'Publicar'}
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {courses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay cursos disponibles
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;
