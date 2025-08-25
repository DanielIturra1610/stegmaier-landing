/**
 * Componente para crear y editar rúbricas de evaluación
 * Permite gestionar criterios y niveles de desempeño
 */
import React, { useState, useCallback } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  Rubric,
  RubricCriterion,
  RubricLevel
} from '../../types/assignment';

interface RubricEditorProps {
  rubric?: Rubric;
  onSave: (rubric: Partial<Rubric>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface CriterionFormData extends Omit<RubricCriterion, 'id'> {
  id?: string;
}

const defaultLevels: RubricLevel[] = [
  { name: 'Excelente', points: 4, description: 'Supera las expectativas' },
  { name: 'Bueno', points: 3, description: 'Cumple las expectativas' },
  { name: 'Satisfactorio', points: 2, description: 'Casi cumple las expectativas' },
  { name: 'Necesita mejora', points: 1, description: 'No cumple las expectativas' }
];

export const RubricEditor: React.FC<RubricEditorProps> = ({
  rubric,
  onSave,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    name: rubric?.name || '',
    description: rubric?.description || '',
    is_template: rubric?.is_template || false
  });

  const [criteria, setCriteria] = useState<CriterionFormData[]>(
    rubric?.criteria || [
      {
        name: '',
        description: '',
        max_points: 10,
        weight: 1,
        levels: [...defaultLevels]
      }
    ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    criteria.forEach((criterion, index) => {
      if (!criterion.name.trim()) {
        newErrors[`criterion_${index}_name`] = 'El nombre del criterio es requerido';
      }
      if (!criterion.description.trim()) {
        newErrors[`criterion_${index}_description`] = 'La descripción del criterio es requerida';
      }
      if (criterion.max_points <= 0) {
        newErrors[`criterion_${index}_max_points`] = 'Los puntos máximos deben ser mayores a 0';
      }
      if (criterion.weight <= 0) {
        newErrors[`criterion_${index}_weight`] = 'El peso debe ser mayor a 0';
      }
      
      criterion.levels.forEach((level, levelIndex) => {
        if (!level.name.trim()) {
          newErrors[`criterion_${index}_level_${levelIndex}_name`] = 'El nombre del nivel es requerido';
        }
        if (level.points < 0) {
          newErrors[`criterion_${index}_level_${levelIndex}_points`] = 'Los puntos no pueden ser negativos';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const totalPoints = criteria.reduce((sum, criterion) => 
      sum + (criterion.max_points * criterion.weight), 0
    );

    const rubricData: Partial<Rubric> = {
      name: formData.name,
      description: formData.description,
      is_template: formData.is_template,
      criteria: criteria.map(criterion => ({
        ...criterion,
        id: criterion.id || `criterion_${Date.now()}_${Math.random()}`
      })),
      total_points: totalPoints
    };

    onSave(rubricData);
  };

  const addCriterion = () => {
    setCriteria(prev => [...prev, {
      name: '',
      description: '',
      max_points: 10,
      weight: 1,
      levels: [...defaultLevels]
    }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, field: keyof CriterionFormData, value: any) => {
    setCriteria(prev => prev.map((criterion, i) => 
      i === index ? { ...criterion, [field]: value } : criterion
    ));
  };

  const moveCriterion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === criteria.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setCriteria(prev => {
      const newCriteria = [...prev];
      const temp = newCriteria[index];
      newCriteria[index] = newCriteria[newIndex];
      newCriteria[newIndex] = temp;
      return newCriteria;
    });
  };

  const addLevel = (criterionIndex: number) => {
    updateCriterion(criterionIndex, 'levels', [
      ...criteria[criterionIndex].levels,
      { name: '', points: 0, description: '' }
    ]);
  };

  const removeLevel = (criterionIndex: number, levelIndex: number) => {
    const newLevels = criteria[criterionIndex].levels.filter((_, i) => i !== levelIndex);
    updateCriterion(criterionIndex, 'levels', newLevels);
  };

  const updateLevel = (criterionIndex: number, levelIndex: number, field: keyof RubricLevel, value: any) => {
    const newLevels = criteria[criterionIndex].levels.map((level, i) =>
      i === levelIndex ? { ...level, [field]: value } : level
    );
    updateCriterion(criterionIndex, 'levels', newLevels);
  };

  const calculateTotalPoints = () => {
    return criteria.reduce((sum, criterion) => sum + (criterion.max_points * criterion.weight), 0);
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {rubric ? 'Editar Rúbrica' : 'Crear Nueva Rúbrica'}
            </h2>
            <p className="text-gray-600 mt-1">
              Define criterios y niveles de evaluación para assignments
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium">{calculateTotalPoints()} puntos</span>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la rúbrica *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej. Rúbrica para ensayos argumentativos"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción opcional de la rúbrica"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_template}
              onChange={(e) => setFormData(prev => ({ ...prev, is_template: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Guardar como plantilla para reutilizar en otros assignments
            </span>
          </label>
        </div>
      </div>

      {/* Criteria */}
      <div className="space-y-4">
        {criteria.map((criterion, criterionIndex) => (
          <div key={criterionIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Criterion Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <AcademicCapIcon className="h-5 w-5 mr-2" />
                  Criterio {criterionIndex + 1}
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveCriterion(criterionIndex, 'up')}
                    disabled={criterionIndex === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveCriterion(criterionIndex, 'down')}
                    disabled={criterionIndex === criteria.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeCriterion(criterionIndex)}
                    disabled={criteria.length === 1}
                    className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Criterion Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del criterio *
                  </label>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => updateCriterion(criterionIndex, 'name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`criterion_${criterionIndex}_name`] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej. Calidad del argumento"
                  />
                  {errors[`criterion_${criterionIndex}_name`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`criterion_${criterionIndex}_name`]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntos máximos *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={criterion.max_points}
                      onChange={(e) => updateCriterion(criterionIndex, 'max_points', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`criterion_${criterionIndex}_max_points`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors[`criterion_${criterionIndex}_max_points`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`criterion_${criterionIndex}_max_points`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={criterion.weight}
                      onChange={(e) => updateCriterion(criterionIndex, 'weight', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`criterion_${criterionIndex}_weight`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors[`criterion_${criterionIndex}_weight`] && (
                      <p className="mt-1 text-xs text-red-600">{errors[`criterion_${criterionIndex}_weight`]}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del criterio *
                </label>
                <textarea
                  value={criterion.description}
                  onChange={(e) => updateCriterion(criterionIndex, 'description', e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[`criterion_${criterionIndex}_description`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe qué evalúa este criterio y cómo se debe aplicar..."
                />
                {errors[`criterion_${criterionIndex}_description`] && (
                  <p className="mt-1 text-xs text-red-600">{errors[`criterion_${criterionIndex}_description`]}</p>
                )}
              </div>

              {/* Performance Levels */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    Niveles de desempeño ({criterion.levels.length})
                  </h4>
                  <button
                    onClick={() => addLevel(criterionIndex)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Agregar Nivel
                  </button>
                </div>

                <div className="space-y-3">
                  {criterion.levels.map((level, levelIndex) => (
                    <div key={levelIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nombre del nivel *
                            </label>
                            <input
                              type="text"
                              value={level.name}
                              onChange={(e) => updateLevel(criterionIndex, levelIndex, 'name', e.target.value)}
                              className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                errors[`criterion_${criterionIndex}_level_${levelIndex}_name`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Ej. Excelente"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Puntos *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={criterion.max_points}
                              value={level.points}
                              onChange={(e) => updateLevel(criterionIndex, levelIndex, 'points', parseFloat(e.target.value) || 0)}
                              className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                errors[`criterion_${criterionIndex}_level_${levelIndex}_points`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Descripción
                            </label>
                            <input
                              type="text"
                              value={level.description}
                              onChange={(e) => updateLevel(criterionIndex, levelIndex, 'description', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Descripción del nivel..."
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => removeLevel(criterionIndex, levelIndex)}
                          disabled={criterion.levels.length === 1}
                          className="p-1.5 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Criterion Button */}
        <div className="flex justify-center">
          <button
            onClick={addCriterion}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Criterio
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{criteria.length}</span> criterio{criteria.length !== 1 ? 's' : ''} • 
            <span className="font-medium ml-1">{calculateTotalPoints()}</span> puntos totales
          </div>
          
          <div className="flex space-x-3">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {rubric ? 'Actualizar Rúbrica' : 'Crear Rúbrica'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RubricEditor;
