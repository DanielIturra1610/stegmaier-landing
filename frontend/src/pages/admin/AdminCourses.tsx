import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  GraduationCap,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCategoryLabel, getCategoryOptions } from '../../utils/courseCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando cursos...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error al cargar cursos</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={retryFetch}
            disabled={loading}
            className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 border-red-300"
          >
            {loading ? 'Cargando...' : 'Reintentar'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Gestión de Cursos
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra y publica los cursos de la plataforma
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/platform/admin/courses/new">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Curso
          </Link>
        </Button>
      </div>
      
      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Borradores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {getCategoryOptions().map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabla de cursos */}
      <Card>
        <div className="overflow-x-auto">
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
                  <Badge
                    variant="secondary"
                    className={course.is_published
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                    }
                  >
                    {course.is_published ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {course.status_label}
                  </Badge>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link to={`/platform/admin/courses/${course.id}/edit`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(course.id)}
                      className={course.is_published
                        ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                      }
                    >
                      {course.is_published ? (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Despublicar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Publicar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay cursos disponibles
            </h3>
            <p className="text-muted-foreground mb-6">
              Comienza creando tu primer curso
            </p>
            <Button asChild>
              <Link to="/platform/admin/courses/new">
                <Plus className="w-5 h-5 mr-2" />
                Crear Curso
              </Link>
            </Button>
          </div>
        )}
        </div>
      </Card>
    </div>
  );
};

export default AdminCourses;
