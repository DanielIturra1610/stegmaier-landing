/**
 * Página de gestión administrativa de módulos
 * Permite crear, editar, eliminar y reordenar módulos de un curso
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BookOpenIcon,
  ClockIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import moduleService from '../../services/moduleService';
import { courseService } from '../../services/courseService';
import { lessonService } from '../../services/lessonService';
import {
  ModuleResponse,
  ModuleWithLessons,
  ModuleCreate,
  ModuleUpdate,
  ModuleFormData,
  ModuleFormErrors
} from '../../types/module';
import { Course } from '../../types/course';

const AdminModules: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Estados principales
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para estadísticas de lecciones por módulo
  const [moduleStats, setModuleStats] = useState<Record<string, { lessonsCount: number; totalDuration: number }>>({});

  // Estados para modal de creación/edición
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleResponse | null>(null);
  const [formData, setFormData] = useState<ModuleFormData>({
    title: '',
    description: '',
    estimated_duration: 0,
    is_required: true,
    unlock_previous: true
  });
  const [formErrors, setFormErrors] = useState<ModuleFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Estados para reordenamiento
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseAndModules();
    }
  }, [courseId]);

  const loadCourseAndModules = async () => {
    if (!courseId) return;

    console.log('🔍 [AdminModules] Loading course and modules for:', courseId);
    setLoading(true);
    setError(null);

    try {
      // Cargar curso, módulos y lecciones
      const [courseData, modulesData, lessonsData] = await Promise.all([
        courseService.getCourse(courseId),
        moduleService.getCourseModules(courseId),
        lessonService.getCourseLessons(courseId)
      ]);

      console.log('✅ [AdminModules] Data loaded:', {
        course: courseData?.title,
        modules: modulesData.length,
        lessons: lessonsData.length
      });

      setCourse(courseData);
      setModules(modulesData);

      // Calcular estadísticas por módulo
      // Nota: Como actualmente las lecciones no tienen module_id en el backend,
      // vamos a dividir las lecciones entre los módulos basado en el orden
      const stats: Record<string, { lessonsCount: number; totalDuration: number }> = {};

      modulesData.forEach((module, index) => {
        // Por ahora, vamos a mostrar las lecciones divididas proporcionalmente
        const lessonsPerModule = Math.ceil(lessonsData.length / modulesData.length);
        const startIndex = index * lessonsPerModule;
        const endIndex = Math.min(startIndex + lessonsPerModule, lessonsData.length);
        const moduleLessons = lessonsData.slice(startIndex, endIndex);

        stats[module.id] = {
          lessonsCount: moduleLessons.length,
          totalDuration: moduleLessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0)
        };
      });

      setModuleStats(stats);

    } catch (err) {
      console.error('❌ [AdminModules] Error loading data:', err);
      setError('Error al cargar los módulos del curso');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = () => {
    setEditingModule(null);
    setFormData({
      title: '',
      description: '',
      estimated_duration: 0,
      is_required: true,
      unlock_previous: true
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditModule = (module: ModuleResponse) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      // Si la descripción es el placeholder, mostrar campo vacío para edición
      description: module.description === 'Descripción pendiente' ? '' : module.description,
      estimated_duration: module.estimated_duration,
      is_required: module.is_required,
      unlock_previous: module.unlock_previous
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Following CLAUDE.md: "Keep functions small and focused on single responsibility"
  const validateForm = (): boolean => {
    const errors: ModuleFormErrors = {};

    // Validación de título (obligatorio)
    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    } else if (formData.title.length < 3) {
      errors.title = 'El título debe tener al menos 3 caracteres';
    }

    // Validación de descripción (opcional, pero si se proporciona debe ser válida)
    if (formData.description.trim() && formData.description.length < 10) {
      errors.description = 'La descripción debe tener al menos 10 caracteres si se proporciona';
    }

    // Validación de duración
    if (formData.estimated_duration < 0) {
      errors.estimated_duration = 'La duración no puede ser negativa';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !validateForm()) return;

    console.log('🔍 [AdminModules] Submitting module:', { editingModule: !!editingModule, formData });
    setSubmitting(true);

    try {
      if (editingModule) {
        // Actualizar módulo existente - Following CLAUDE.md: "Use consistent naming conventions"
        const updateData: ModuleUpdate = {
          title: formData.title.trim(),
          // Siempre incluir descripción en updates (puede ser string vacío)
          description: formData.description.trim(),
          estimated_duration: formData.estimated_duration,
          is_required: formData.is_required,
          unlock_previous: formData.unlock_previous
        };

        await moduleService.updateModule(editingModule.id, updateData);
        console.log('✅ [AdminModules] Module updated successfully');
      } else {
        // Crear nuevo módulo - Following CLAUDE.md: "Write self-documenting code"
        const descriptionValue = formData.description.trim() || 'Descripción pendiente';

        const createData: ModuleCreate = {
          title: formData.title.trim(),
          // Backend requiere description con min_length=1, usar placeholder si está vacía
          description: descriptionValue,
          estimated_duration: formData.estimated_duration,
          is_required: formData.is_required,
          unlock_previous: formData.unlock_previous,
          order: modules.length + 1 // Auto-asignar orden basado en módulos existentes
        };

        // 🔍 DEBUG: Log completo del payload antes de enviar
        console.log('🚀 [AdminModules] PAYLOAD COMPLETO ANTES DE ENVIAR:', {
          originalDescription: formData.description,
          trimmedDescription: formData.description.trim(),
          finalDescription: descriptionValue,
          descriptionLength: descriptionValue.length,
          completePayload: JSON.stringify(createData, null, 2),
          timestamp: new Date().toISOString()
        });

        // 🛡️ VALIDACIÓN FRONTEND: Asegurar que nunca se envíe descripción vacía
        if (!createData.description || createData.description.trim().length === 0) {
          console.error('🚨 [AdminModules] CRÍTICO: Descripción vacía detectada, forzando placeholder');
          createData.description = 'Descripción pendiente';
        }

        // 🔍 VERIFICACIÓN FINAL
        console.log('🔒 [AdminModules] PAYLOAD FINAL VALIDADO:', {
          descriptionFinal: createData.description,
          lengthFinal: createData.description.length,
          isValidForBackend: createData.description.length >= 1
        });

        const createdModule = await moduleService.createModule(courseId, createData);
        console.log('✅ [AdminModules] Module created successfully');

        // Preguntar si quiere agregar lecciones inmediatamente
        const shouldAddLessons = window.confirm(
          `✅ Módulo "${createData.title}" creado exitosamente.\n\n¿Quieres agregar lecciones a este módulo ahora?`
        );

        if (shouldAddLessons) {
          // Navegar directamente a gestión de lecciones del módulo recién creado
          navigate(`/platform/admin/courses/${courseId}/modules/${createdModule.id}/lessons`);
          return; // No cerrar modal ni recargar, ya que navegamos
        }
      }

      setShowModal(false);
      await loadCourseAndModules(); // Recargar datos
    } catch (err) {
      console.error('❌ [AdminModules] Error submitting module:', err);
      setError(editingModule ? 'Error al actualizar el módulo' : 'Error al crear el módulo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (module: ModuleResponse) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el módulo "${module.title}"?`)) {
      return;
    }

    console.log('🔍 [AdminModules] Deleting module:', module.id);

    try {
      await moduleService.deleteModule(module.id);
      console.log('✅ [AdminModules] Module deleted successfully');
      await loadCourseAndModules(); // Recargar datos
    } catch (err) {
      console.error('❌ [AdminModules] Error deleting module:', err);
      setError('Error al eliminar el módulo');
    }
  };

  const handleMoveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const targetIndex = direction === 'up' ? moduleIndex - 1 : moduleIndex + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    console.log('🔍 [AdminModules] Moving module:', { moduleId, direction, from: moduleIndex, to: targetIndex });
    setReordering(true);

    try {
      // Crear array de nuevos órdenes
      const newOrders = modules.map((module, index) => {
        let newOrder = index + 1;
        
        if (index === moduleIndex) {
          newOrder = targetIndex + 1;
        } else if (index === targetIndex) {
          newOrder = moduleIndex + 1;
        }

        return {
          id: module.id,
          order: newOrder
        };
      });

      await moduleService.reorderModules(courseId!, newOrders);
      console.log('✅ [AdminModules] Modules reordered successfully');
      await loadCourseAndModules(); // Recargar datos
    } catch (err) {
      console.error('❌ [AdminModules] Error reordering modules:', err);
      setError('Error al reordenar los módulos');
    } finally {
      setReordering(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return 'No especificada';
    return moduleService.formatDuration(minutes);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/platform/courses')}
                className="text-blue-600 hover:text-blue-800 mb-2 text-sm font-medium"
              >
                ← Volver a Cursos
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Módulos
              </h1>
              {course && (
                <p className="text-gray-600 mt-1">
                  Curso: <span className="font-medium">{course.title}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleCreateModule}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Módulo
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-800 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Lista de Módulos */}
        <div className="space-y-4">
          {modules.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay módulos creados
              </h3>
              <p className="text-gray-600 mb-6">
                Crea el primer módulo para estructurar tu curso
              </p>
              <button
                onClick={handleCreateModule}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Crear Primer Módulo
              </button>
            </div>
          ) : (
            modules.map((module, index) => (
              <div key={module.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                          Módulo {module.order}
                        </span>
                        {module.is_required && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                            Obligatorio
                          </span>
                        )}
                        {module.unlock_previous ? (
                          <LockClosedIcon className="w-4 h-4 text-gray-400" title="Requiere módulo anterior" />
                        ) : (
                          <LockOpenIcon className="w-4 h-4 text-green-600" title="Acceso libre" />
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {module.title}
                      </h3>
                      
                      {/* Descripción con fallback - Following CLAUDE.md: "Show user-friendly error messages" */}
                      <p className="text-gray-600 mb-4">
                        {module.description === 'Descripción pendiente' ? (
                          <span className="italic text-gray-400">
                            Sin descripción - Puedes agregar una editando el módulo
                          </span>
                        ) : (
                          module.description
                        )}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <BookOpenIcon className="w-4 h-4" />
                          <span>{moduleStats[module.id]?.lessonsCount || 0} lecciones</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatDuration(moduleStats[module.id]?.totalDuration || module.estimated_duration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Botones de reordenamiento */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleMoveModule(module.id, 'up')}
                          disabled={index === 0 || reordering}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover arriba"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveModule(module.id, 'down')}
                          disabled={index === modules.length - 1 || reordering}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Mover abajo"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Botones de acción */}
                      <button
                        onClick={() => navigate(`/platform/admin/courses/${courseId}/modules/${module.id}/lessons`)}
                        className="px-3 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md text-sm font-medium border border-green-300"
                        title="Gestionar lecciones de este módulo"
                      >
                        Lecciones
                      </button>

                      <button
                        onClick={() => handleEditModule(module)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Editar módulo"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteModule(module)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Eliminar módulo"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de Creación/Edición */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingModule ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
                </h2>

                <form onSubmit={handleSubmitModule} className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Módulo 1: Introducción a SICMON"
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                    )}
                  </div>

                  {/* Descripción - Following CLAUDE.md: "Maintain design system consistency" */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción <span className="text-gray-400 text-xs">(opcional)</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Describe el contenido y objetivos del módulo (opcional)..."
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Puedes agregar la descripción más tarde si prefieres crear el módulo primero
                    </p>
                  </div>

                  {/* Duración estimada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración estimada (minutos)
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.estimated_duration ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="120"
                    />
                    {formErrors.estimated_duration && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.estimated_duration}</p>
                    )}
                  </div>

                  {/* Opciones */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_required"
                        checked={formData.is_required}
                        onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="is_required" className="ml-2 text-sm text-gray-700">
                        Módulo obligatorio para completar el curso
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="unlock_previous"
                        checked={formData.unlock_previous}
                        onChange={(e) => setFormData({ ...formData, unlock_previous: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="unlock_previous" className="ml-2 text-sm text-gray-700">
                        Requiere completar el módulo anterior
                      </label>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Guardando...' : editingModule ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModules;
