import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

interface Course {
  id: string;
  title: string;
  instructor_id: string;
  level: string;
  category: string;
  is_published: boolean;
  total_students: number;
  created_at: string;
}

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const isPublished = filter === 'all' ? undefined : filter === 'published';
        const data = await adminService.getCourses(0, 50, isPublished);
        setCourses(data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('No se pudieron cargar los cursos');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [filter]);

  if (loading) {
    return <div className="text-center py-8">Cargando cursos...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Cursos</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Crear Nuevo Curso
        </button>
      </div>
      
      {/* Filtros */}
      <div className="mb-6">
        <div className="sm:hidden">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Todos los cursos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`${
                filter === 'published'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Publicados
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`${
                filter === 'draft'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Borradores
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {courses.map((course) => (
            <li key={course.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {course.title}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        course.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>{course.level}</span>
                    <span className="mx-2">•</span>
                    <span>{course.category}</span>
                    <span className="mx-2">•</span>
                    <span>{course.total_students || 0} estudiantes</span>
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 text-sm">
                    Editar
                  </button>
                  <button className="text-red-600 hover:text-red-900 text-sm">
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {courses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron cursos
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
