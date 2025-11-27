import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService, Course } from '../../services/courseService';
import { useAuth } from '../../contexts/AuthContext';
import AdminCourses from '../admin/AdminCourses';
import EnrollmentButton from '../../components/enrollment/EnrollmentButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Search, AlertCircle, BookOpen, Clock } from 'lucide-react';

/**
 * Página que muestra todos los cursos disponibles para el usuario
 * Permite filtrar y buscar cursos
 */
const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Si el usuario es admin, mostrar la vista administrativa
  if (user?.role === 'admin') {
    return <AdminCourses />;
  }
  
  // Estados para la página
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Cargar cursos al montar el componente
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('🚀 [CoursesPage] Starting to fetch courses...');
        setLoading(true);
        setError(null);
        
        const response = await courseService.getAvailableCourses();
        console.log('📦 [CoursesPage] Raw API response:', response);
        console.log('📦 [CoursesPage] Response type:', typeof response);
        console.log('📦 [CoursesPage] Is array:', Array.isArray(response));
        
        const coursesArray = Array.isArray(response) ? response : response.courses || [];
        console.log('📋 [CoursesPage] Processed courses array:', coursesArray);
        console.log('📊 [CoursesPage] Number of courses:', coursesArray.length);
        
        if (coursesArray.length > 0) {
          console.log('🔍 [CoursesPage] First course details:', coursesArray[0]);
          console.log('🔍 [CoursesPage] First course lessons:', coursesArray[0].lessons);
          console.log('🔍 [CoursesPage] First course lessons_count:', coursesArray[0].lessons_count);
          console.log('🔍 [CoursesPage] First course lessons array check:', Array.isArray(coursesArray[0].lessons));
          console.log('🔍 [CoursesPage] First course lessons length:', Array.isArray(coursesArray[0].lessons) ? coursesArray[0].lessons.length : 'Not an array');
        }
        
        setCourses(coursesArray);
        console.log('✅ [CoursesPage] Courses set in state successfully');
      } catch (err: any) {
        console.error('❌ [CoursesPage] Error loading courses:', err);
        setError(err.message || 'Error al cargar los cursos');
        setCourses([]);
      } finally {
        setLoading(false);
        console.log('🏁 [CoursesPage] Loading finished');
      }
    };

    fetchCourses();
  }, []);
  
  // Handler para comenzar/continuar un curso
  const handleStartCourse = (courseId: string) => {
    console.log('🚀 [CoursesPage] Navigating to course:', courseId);
    navigate(`/platform/courses/${courseId}/view`);
  };
  
  // Función para filtrar cursos según búsqueda y categoría
  const filteredCourses = (Array.isArray(courses) ? courses : []).filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    console.log(`🔍 [Filter] Course "${course.title}":
      - Category: "${course.category}" vs Filter: "${categoryFilter}"
      - Matches category: ${matchesCategory}
      - Matches search: ${matchesSearch}
      - Final result: ${matchesSearch && matchesCategory}`);
    
    return matchesSearch && matchesCategory;
  });
  
  // RENDER STATE DEBUG (like debug component)
  console.log('🔄 [CoursesPage] Component render - Loading:', loading, 'Courses:', courses?.length || 0, 'Error:', error || 'None');
  console.log('🔍 [CoursesPage] All courses:', courses);
  console.log('🔍 [CoursesPage] Filtered courses:', filteredCourses.length, filteredCourses);
  console.log('🔍 [CoursesPage] Search query:', searchQuery, 'Category filter:', categoryFilter);
  
  // Si está cargando
  if (loading) {
    console.log('🔄 [CoursesPage] Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Si hay error
  if (error) {
    console.log('❌ [CoursesPage] Rendering error state:', error);
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al cargar cursos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Si no hay cursos disponibles
  if (filteredCourses.length === 0 && courses.length === 0) {
    console.log('🚨 [CoursesPage] Rendering empty state - no courses available');
    return (
      <div className="space-y-6 pb-10">
        {/* Cabecera */}
        <Card className="bg-gradient-to-r from-primary-700 to-primary-800 text-white border-0">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-white">Catálogo de Cursos</CardTitle>
            <CardDescription className="text-primary-100">
              Explora nuestra selección de cursos especializados en consultoría y gestión empresarial
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Estado vacío */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No hay cursos disponibles</h3>
                <p className="text-muted-foreground mb-4">
                  Aún no hay cursos publicados en la plataforma. El administrador debe subir contenido para que puedas comenzar a aprender.
                </p>
              </div>
              <Alert>
                <AlertTitle>Mientras tanto, puedes:</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Completar tu perfil</li>
                    <li>Explorar la configuración de la plataforma</li>
                    <li>Contactar con soporte si necesitas ayuda</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera */}
      <Card className="bg-gradient-to-r from-primary-700 to-primary-800 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-white">Catálogo de Cursos</CardTitle>
          <CardDescription className="text-primary-100">
            Explora nuestra selección de cursos especializados en consultoría y gestión empresarial
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filtros y barra de búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cursos..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="consulting">Consultoría</SelectItem>
                <SelectItem value="management">Gestión</SelectItem>
                <SelectItem value="operations">Operaciones</SelectItem>
                <SelectItem value="safety_training">Prevención de Riesgos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de cursos o mensaje de filtros vacíos */}
      {filteredCourses.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <Alert className="border-l-4 border-yellow-400 bg-yellow-50">
              <Search className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">No se encontraron cursos</AlertTitle>
              <AlertDescription className="text-yellow-700">
                No hay cursos que coincidan con tu búsqueda. Intenta con diferentes términos o filtros.
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {(() => {
                        console.log(`🎯 [CourseCard] Processing course "${course.title}":
                          - lessons_count: ${course.lessons_count}
                          - lessons: ${JSON.stringify(course.lessons)}
                          - lessons is array: ${Array.isArray(course.lessons)}
                          - lessons length: ${Array.isArray(course.lessons) ? course.lessons.length : 'N/A'}`);

                        // Lógica simplificada
                        let lessonsCount = 0;

                        if (course.lessons_count !== undefined && course.lessons_count !== null) {
                          lessonsCount = course.lessons_count;
                          console.log(`🔢 [CourseCard] Using lessons_count: ${lessonsCount}`);
                        } else if (Array.isArray(course.lessons)) {
                          lessonsCount = course.lessons.length;
                          console.log(`📚 [CourseCard] Using lessons array length: ${lessonsCount}`);
                        } else {
                          lessonsCount = 0;
                          console.log(`❌ [CourseCard] No lessons data available, defaulting to 0`);
                        }

                        console.log(`✅ [CourseCard] Final lessons count for "${course.title}": ${lessonsCount}`);
                        return lessonsCount;
                      })()} lecciones
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.total_duration || (Array.isArray(course.lessons) ? course.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0) : course.duration) || 0} min</span>
                  </div>
                </div>

                {course.progress !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Progreso</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                )}

                <EnrollmentButton
                  courseId={course.id}
                  courseName={course.title}
                  onEnrollmentChange={(enrolled) => {
                    // Opcional: recargar cursos para reflejar cambios
                    console.log(`Enrollment changed for ${course.title}:`, enrolled);
                  }}
                  onNavigateToCourse={handleStartCourse}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
