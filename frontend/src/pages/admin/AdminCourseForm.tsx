import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface CourseFormData {
  title: string;
  description: string;
  level: string;
  category: string;
  price: number;
  instructor_id: string;
}

interface Instructor {
  id: string;
  full_name: string;
  email: string;
}

const AdminCourseForm: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    level: 'BEGINNER',
    category: 'PROGRAMMING',
    price: 0,
    instructor_id: ''
  });
  
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEditing = Boolean(courseId);
  
  // Cargar instructores disponibles
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch('/api/v1/admin/users?role=instructor', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setInstructors(data.filter((user: any) => 
            user.role === 'instructor' || user.role === 'admin'
          ));
        }
      } catch (err) {
        console.error('Error fetching instructors:', err);
      }
    };
    
    fetchInstructors();
  }, []);
  
  // Cargar datos del curso si estamos editando
  useEffect(() => {
    if (isEditing && courseId) {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/v1/admin/courses/${courseId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const course = data.course;
            
            setFormData({
              title: course.title,
              description: course.description,
              level: course.level,
              category: course.category,
              price: course.price,
              instructor_id: course.instructor_id
            });
          } else {
            setError('Error al cargar el curso');
          }
        } catch (err) {
          console.error('Error fetching course:', err);
          setError('Error de conexión');
        } finally {
          setLoading(false);
        }
      };
      
      fetchCourse();
    }
  }, [isEditing, courseId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      
      setCoverImage(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('La descripción es requerida');
      return;
    }
    
    if (!formData.instructor_id) {
      alert('Debes seleccionar un instructor');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Crear FormData para enviar archivo si existe
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('level', formData.level);
      submitData.append('category', formData.category);
      submitData.append('price', formData.price.toString());
      submitData.append('instructor_id', formData.instructor_id);
      
      if (coverImage) {
        submitData.append('cover_image', coverImage);
      }
      
      const url = isEditing 
        ? `/api/v1/admin/courses/${courseId}`
        : '/api/v1/admin/courses';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        
        if (result.redirect_url) {
          navigate(result.redirect_url);
        } else {
          navigate('/platform/admin/dashboard');
        }
      } else {
        const errorResult = await response.json();
        setError(errorResult.detail || 'Error al guardar el curso');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEditing) {
    return <div className="text-center py-8">Cargando curso...</div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Curso' : 'Crear Nuevo Curso'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Modifica los datos del curso' : 'Completa la información básica del curso'}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        {/* Título */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título del curso *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Introducción a React.js"
            required
          />
        </div>
        
        {/* Descripción */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe qué aprenderán los estudiantes en este curso..."
            required
          />
        </div>
        
        {/* Grid de 2 columnas para nivel y categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
              Nivel *
            </label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="PROGRAMMING">Programación</option>
              <option value="DESIGN">Diseño</option>
              <option value="BUSINESS">Negocios</option>
              <option value="MARKETING">Marketing</option>
              <option value="PERSONAL_DEVELOPMENT">Desarrollo Personal</option>
              <option value="OTHER">Otros</option>
            </select>
          </div>
        </div>
        
        {/* Grid de 2 columnas para instructor y precio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="instructor_id" className="block text-sm font-medium text-gray-700 mb-2">
              Instructor *
            </label>
            <select
              id="instructor_id"
              name="instructor_id"
              value={formData.instructor_id}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.full_name} ({instructor.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Precio (USD)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>
        
        {/* Imagen de portada */}
        <div className="mb-6">
          <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
            Imagen de portada
          </label>
          <input
            type="file"
            id="cover_image"
            name="cover_image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
          </p>
          
          {coverImage && (
            <div className="mt-2 text-sm text-green-600">
              Archivo seleccionado: {coverImage.name}
            </div>
          )}
        </div>
        
        {/* Botones */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/platform/admin/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Curso' : 'Crear Curso')}
          </button>
        </div>
      </form>
      
      {/* Sección de lecciones si estamos editando */}
      {isEditing && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lecciones del curso</h2>
            <button 
              onClick={() => navigate(`/platform/admin/courses/${courseId}/lessons`)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Gestionar Lecciones
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Una vez guardados los datos básicos del curso, podrás añadir y organizar las lecciones.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminCourseForm;
