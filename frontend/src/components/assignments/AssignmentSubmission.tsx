/**
 * Componente principal para la entrega de assignments por estudiantes
 * Integra editor de texto y upload de archivos múltiples
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { assignmentService } from '../../services/assignmentService';
import { FileUploader } from './FileUploader';
import {
  Assignment,
  AssignmentSubmission,
  AssignmentSubmissionProps,
  SubmissionStatus,
  AssignmentFile
} from '../../types/assignment';

export const AssignmentSubmissionComponent: React.FC<AssignmentSubmissionProps> = ({
  assignment,
  existingSubmission,
  onSubmissionUpdate,
  onError
}) => {
  // State management
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(existingSubmission || null);
  const [textContent, setTextContent] = useState(existingSubmission?.text_content || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<AssignmentFile[]>(existingSubmission?.files || []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Refs
  const fileUploaderRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing submission on mount
  useEffect(() => {
    loadSubmission();
  }, [assignment.id]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && submission) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [textContent, hasUnsavedChanges]);

  const loadSubmission = async () => {
    try {
      setIsLoading(true);
      const existingSubmission = await assignmentService.getMySubmission(assignment.id);
      
      if (existingSubmission) {
        setSubmission(existingSubmission);
        setTextContent(existingSubmission.text_content);
        setUploadedFiles(existingSubmission.files);
      }
    } catch (error: any) {
      console.error('Error loading submission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async () => {
    if (!submission) return;

    try {
      await assignmentService.updateSubmission(submission.id, {
        text_content: textContent,
        status: SubmissionStatus.IN_PROGRESS
      });
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  const handleCreateSubmission = async () => {
    try {
      setIsLoading(true);
      const newSubmission = await assignmentService.createSubmission({
        assignment_id: assignment.id,
        text_content: textContent,
        is_final: false
      });
      
      setSubmission(newSubmission);
      onSubmissionUpdate?.(newSubmission);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!submission) {
      await handleCreateSubmission();
      return;
    }

    try {
      setIsSaving(true);
      const updatedSubmission = await assignmentService.updateSubmission(submission.id, {
        text_content: textContent,
        status: SubmissionStatus.IN_PROGRESS
      });
      
      setSubmission(updatedSubmission);
      onSubmissionUpdate?.(updatedSubmission);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submission) {
      await handleCreateSubmission();
      if (!submission) return;
    }

    try {
      setIsLoading(true);
      
      // First upload any pending files
      if (fileUploaderRef.current && fileUploaderRef.current.uploadAllFiles) {
        await fileUploaderRef.current.uploadAllFiles(submission.id);
      }
      
      // Then submit the assignment
      const submittedAssignment = await assignmentService.submitAssignment(submission.id);
      setSubmission(submittedAssignment);
      onSubmissionUpdate?.(submittedAssignment);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesUploaded = useCallback((files: AssignmentFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const handleUploadError = useCallback((error: string) => {
    onError?.(error);
  }, [onError]);

  const removeFile = async (fileId: string) => {
    if (!submission) return;

    try {
      await assignmentService.deleteSubmissionFile(submission.id, fileId);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error: any) {
      onError?.(error.message);
    }
  };

  // Calculate remaining time
  const getRemainingTime = () => {
    if (!assignment.due_date) return null;
    
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const diff = dueDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Vencido';
    
    return assignmentService.formatTimeUntilDue(assignment.due_date);
  };

  const isSubmitted = submission?.status === SubmissionStatus.SUBMITTED || 
                     submission?.status === SubmissionStatus.GRADED;
  const isOverdue = assignment.is_overdue && !isSubmitted;
  const canSubmit = submission && (textContent.trim() || uploadedFiles.length > 0);
  const remainingTime = getRemainingTime();

  if (isLoading && !submission) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando assignment...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Assignment Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{assignment.title}</h2>
            <p className="mt-2 text-gray-600">{assignment.description}</p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            {remainingTime && (
              <div className={`flex items-center px-3 py-1 rounded-full ${
                isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                <ClockIcon className="h-4 w-4 mr-1" />
                {remainingTime}
              </div>
            )}
            
            {submission && (
              <div className={`flex items-center px-3 py-1 rounded-full ${
                assignmentService.getStatusColor(submission.status)
              }`}>
                {assignmentService.getStatusLabel(submission.status)}
              </div>
            )}
          </div>
        </div>

        {/* Assignment Details */}
        {assignment.instructions && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="flex items-center text-sm font-medium text-blue-900 mb-2">
              <InformationCircleIcon className="h-4 w-4 mr-1" />
              Instrucciones
            </h3>
            <div className="text-sm text-blue-800 whitespace-pre-wrap">
              {assignment.instructions}
            </div>
          </div>
        )}

        {/* Assignment Requirements */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Puntos máximos:</span>
            <span className="ml-2">{assignment.max_points}</span>
          </div>
          <div>
            <span className="font-medium">Archivos máximos:</span>
            <span className="ml-2">{assignment.max_files}</span>
          </div>
          <div>
            <span className="font-medium">Tamaño máximo:</span>
            <span className="ml-2">{assignmentService.formatFileSize(assignment.max_file_size)}</span>
          </div>
        </div>
      </div>

      {/* Submission Status Warning */}
      {isSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Assignment Enviado</h3>
              <p className="text-sm text-green-700 mt-1">
                Tu assignment ha sido enviado exitosamente. Ya no puedes realizar cambios.
                {submission?.submitted_at && (
                  <span className="block mt-1">
                    Enviado el: {new Date(submission.submitted_at).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {isOverdue && !isSubmitted && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Assignment Vencido</h3>
              <p className="text-sm text-red-700 mt-1">
                La fecha límite ha pasado. Las entregas tardías pueden tener penalización.
                {assignment.late_penalty_per_day > 0 && (
                  <span className="block mt-1">
                    Penalización: {(assignment.late_penalty_per_day * 100).toFixed(0)}% por día
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor Section */}
      {!isSubmitted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Respuesta de Texto
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {hasUnsavedChanges && (
                <span className="text-yellow-600">● Cambios sin guardar</span>
              )}
              {isSaving && (
                <span className="text-blue-600">Guardando...</span>
              )}
            </div>
          </div>
          
          <textarea
            value={textContent}
            onChange={handleTextChange}
            placeholder="Escribe tu respuesta aquí..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitted}
          />
          
          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
            <span>{textContent.length} caracteres</span>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="px-3 py-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              {isSaving ? 'Guardando...' : 'Guardar borrador'}
            </button>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      {!isSubmitted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Archivos Adjuntos
          </h3>
          
          <FileUploader
            ref={fileUploaderRef}
            onFilesUploaded={handleFilesUploaded}
            onUploadError={handleUploadError}
            maxFiles={assignment.max_files}
            maxFileSize={assignment.max_file_size}
            allowedTypes={assignment.allowed_file_types}
          />
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Archivos Enviados ({uploadedFiles.length})
          </h3>
          
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.original_filename}</p>
                    <p className="text-xs text-gray-500">
                      {assignmentService.formatFileSize(file.file_size)}
                      {file.description && ` • ${file.description}`}
                    </p>
                  </div>
                </div>
                
                {!isSubmitted && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isSubmitted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {assignment.allow_multiple_submissions 
                ? 'Puedes enviar múltiples veces hasta la fecha límite'
                : 'Solo puedes enviar una vez'
              }
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2 inline" />
                Guardar Borrador
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2 inline" />
                    Enviar Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissionComponent;
