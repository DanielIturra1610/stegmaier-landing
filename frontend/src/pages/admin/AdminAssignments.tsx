/**
 * Página de gestión administrativa de assignments
 * Permite crear, editar, eliminar assignments con integración de rúbricas y archivos template
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { assignmentService } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';
import { RubricEditor } from '../../components/assignments/RubricEditor';
import { AssignmentTemplateUploader } from '../../components/assignments/AssignmentTemplateUploader';
import {
  Assignment,
  AssignmentCreateDTO,
  AssignmentUpdateDTO,
  Rubric,
  AssignmentFile
} from '../../types/assignment';
import { Course } from '../../types/course';

interface AssignmentFormData {
  title: string;
  description: string;
  instructions: string;
  due_date: string;
  max_score: number;
  allow_late_submission: boolean;
  late_penalty_percent: number;
  max_attempts: number;
  require_file_submission: boolean;
  allow_text_submission: boolean;
  enable_peer_review: boolean;
  min_peer_reviews: number;
}

const AdminAssignments: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Estados principales
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para modal de creación/edición
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    max_score: 100,
    allow_late_submission: false,
    late_penalty_percent: 10,
    max_attempts: 1,
    require_file_submission: true,
    allow_text_submission: true,
    enable_peer_review: false,
    min_peer_reviews: 2
  });
  const [submitting, setSubmitting] = useState(false);

  // Estados para rúbrica
  const [showRubricEditor, setShowRubricEditor] = useState(false);
  const [rubric, setRubric] = useState<Partial<Rubric> | null>(null);

  // Estado para archivo template creado
  const [createdAssignmentId, setCreatedAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseAndAssignments();
    }
  }, [courseId]);

  const loadCourseAndAssignments = async () => {
    if (!courseId) return;

    console.log('🔍 [AdminAssignments] Loading course and assignments for:', courseId);
    setLoading(true);
    setError(null);

    try {
      const [courseData, assignmentsData] = await Promise.all([
        courseService.getCourse(courseId),
        assignmentService.getCourseAssignments(courseId)
      ]);

      console.log('✅ [AdminAssignments] Data loaded:', {
        course: courseData?.title,
        assignments: assignmentsData.length
      });

      setCourse(courseData);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('❌ [AdminAssignments] Error loading data:', err);
      setError('Error al cargar los assignments del curso');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      instructions: '',
      due_date: '',
      max_score: 100,
      allow_late_submission: false,
      late_penalty_percent: 10,
      max_attempts: 1,
      require_file_submission: true,
      allow_text_submission: true,
      enable_peer_review: false,
      min_peer_reviews: 2
    });
    setRubric(null);
    setCreatedAssignmentId(null);
    setShowModal(true);
  };

  const handleEditAssignment = async (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
      max_score: assignment.max_score,
      allow_late_submission: assignment.allow_late_submission,
      late_penalty_percent: assignment.late_penalty_percent || 10,
      max_attempts: assignment.max_attempts,
      require_file_submission: assignment.require_file_submission,
      allow_text_submission: assignment.allow_text_submission,
      enable_peer_review: assignment.enable_peer_review,
      min_peer_reviews: assignment.min_peer_reviews || 2
    });
    setCreatedAssignmentId(assignment.id);

    // Cargar rúbrica si existe
    if (assignment.rubric_id) {
      try {
        const rubricData = await assignmentService.getAssignmentRubric(assignment.id);
        setRubric(rubricData);
      } catch (err) {
        console.error('Error loading rubric:', err);
      }
    } else {
      setRubric(null);
    }

    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseId) return;

    setSubmitting(true);
    setError(null);

    try {
      if (editingAssignment) {
        // Actualizar assignment existente
        const updateData: AssignmentUpdateDTO = formData;
        await assignmentService.updateAssignment(editingAssignment.id, updateData);
        console.log('✅ [AdminAssignments] Assignment updated successfully');
      } else {
        // Crear nuevo assignment
        const createData: AssignmentCreateDTO = {
          ...formData,
          course_id: courseId
        };

        const newAssignment = await assignmentService.createAssignment(createData);
        console.log('✅ [AdminAssignments] Assignment created successfully:', newAssignment.id);

        // Guardar ID para permitir upload de template
        setCreatedAssignmentId(newAssignment.id);

        // Si hay rúbrica, crearla/actualizarla
        if (rubric && rubric.criteria && rubric.criteria.length > 0) {
          await assignmentService.createAssignmentRubric(newAssignment.id, rubric);
          console.log('✅ [AdminAssignments] Rubric created successfully');
        }
      }

      await loadCourseAndAssignments();

      // No cerrar el modal automáticamente si acabamos de crear el assignment
      // para permitir subir el template file
      if (editingAssignment) {
        setShowModal(false);
      }
    } catch (err: any) {
      console.error('❌ [AdminAssignments] Error saving assignment:', err);
      setError(err.message || 'Error al guardar el assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assignment: Assignment) => {
    if (!confirm(`¿Estás seguro de eliminar el assignment "${assignment.title}"?`)) {
      return;
    }

    try {
      await assignmentService.deleteAssignment(assignment.id);
      console.log('✅ [AdminAssignments] Assignment deleted successfully');
      await loadCourseAndAssignments();
    } catch (err) {
      console.error('❌ [AdminAssignments] Error deleting assignment:', err);
      setError('Error al eliminar el assignment');
    }
  };

  const handleTemplateUploaded = (file: AssignmentFile) => {
    console.log('✅ Template file uploaded:', file);
    // Opcional: Cerrar modal después de subir template
    // setShowModal(false);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Sin fecha límite';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assignments - {course?.title}</h1>
            <p className="text-gray-600 mt-1">Gestiona las asignaciones del curso</p>
          </div>
          <button
            onClick={handleCreateAssignment}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nuevo Assignment</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay assignments</h3>
            <p className="text-gray-600 mb-4">Comienza creando el primer assignment para este curso</p>
            <button
              onClick={handleCreateAssignment}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Crear Assignment</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{assignment.title}</h3>
                    <p className="text-gray-600 mb-4">{assignment.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDate(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <AcademicCapIcon className="w-4 h-4" />
                        <span>{assignment.max_score} puntos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {assignment.allow_late_submission ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-gray-700">Entregas tardías</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <ClockIcon className="w-4 h-4" />
                        <span>{assignment.max_attempts} intento(s)</span>
                      </div>
                    </div>

                    {assignment.rubric_id && (
                      <div className="mt-4 inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Con rúbrica de evaluación
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditAssignment(assignment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(assignment)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Creación/Edición */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full my-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAssignment ? 'Editar Assignment' : 'Nuevo Assignment'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Trabajo Final - Análisis de Caso"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Breve descripción del assignment"
                  />
                </div>

                {/* Instrucciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrucciones Detalladas
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Instrucciones paso a paso para completar el assignment..."
                  />
                </div>

                {/* Grid de campos numéricos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Límite
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puntuación Máxima
                    </label>
                    <input
                      type="number"
                      value={formData.max_score}
                      onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                      min={0}
                      max={100}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo de Intentos
                    </label>
                    <input
                      type="number"
                      value={formData.max_attempts}
                      onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
                      min={1}
                      max={10}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Penalización por Retraso (%)
                    </label>
                    <input
                      type="number"
                      value={formData.late_penalty_percent}
                      onChange={(e) => setFormData({ ...formData, late_penalty_percent: parseInt(e.target.value) })}
                      min={0}
                      max={100}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.allow_late_submission}
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_late_submission}
                      onChange={(e) => setFormData({ ...formData, allow_late_submission: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Permitir entregas tardías</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.require_file_submission}
                      onChange={(e) => setFormData({ ...formData, require_file_submission: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Requiere entrega de archivos</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_text_submission}
                      onChange={(e) => setFormData({ ...formData, allow_text_submission: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Permitir entrega de texto</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.enable_peer_review}
                      onChange={(e) => setFormData({ ...formData, enable_peer_review: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Habilitar revisión por pares</span>
                  </label>
                </div>

                {/* Sección de Rúbrica */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Rúbrica de Evaluación</h3>
                      <p className="text-sm text-gray-600">Opcional - Define criterios de evaluación</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRubricEditor(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      {rubric ? 'Editar Rúbrica' : 'Crear Rúbrica'}
                    </button>
                  </div>

                  {rubric && rubric.criteria && rubric.criteria.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-900">
                        {rubric.name || 'Rúbrica sin nombre'}
                      </p>
                      <p className="text-sm text-purple-700 mt-1">
                        {rubric.criteria.length} criterio(s) de evaluación
                      </p>
                    </div>
                  )}
                </div>

                {/* Sección de Template File - Solo mostrar después de crear el assignment */}
                {createdAssignmentId && (
                  <div className="border-t border-gray-200 pt-6">
                    <AssignmentTemplateUploader
                      assignmentId={createdAssignmentId}
                      onTemplateUploaded={handleTemplateUploaded}
                      onUploadError={(error) => setError(error)}
                    />
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {createdAssignmentId && !editingAssignment ? 'Cerrar' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Guardando...' : (editingAssignment ? 'Actualizar' : 'Crear Assignment')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Rubric Editor */}
        {showRubricEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <RubricEditor
                rubric={rubric as Rubric}
                onSave={(savedRubric) => {
                  setRubric(savedRubric);
                  setShowRubricEditor(false);
                }}
                onCancel={() => setShowRubricEditor(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssignments;
