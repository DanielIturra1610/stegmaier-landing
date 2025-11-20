/**
 * Assignment Template File Uploader Component
 * Allows instructors to upload template files for assignments
 * (e.g., worksheets, starter code, documents to be completed)
 */
import React, { useState, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { assignmentService } from '../../services/assignmentService';
import { AssignmentFile, FileUploadProgress } from '../../types/assignment';

interface TemplateFileUpload {
  id: string;
  file: File;
  description: string;
  progress: FileUploadProgress;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: AssignmentFile;
}

interface AssignmentTemplateUploaderProps {
  assignmentId?: string; // Optional: if provided, upload immediately
  onTemplateUploaded?: (file: AssignmentFile) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  className?: string;
}

export const AssignmentTemplateUploader: React.FC<AssignmentTemplateUploaderProps> = ({
  assignmentId,
  onTemplateUploaded,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = [],
  className = ''
}) => {
  const [templateFile, setTemplateFile] = useState<TemplateFileUpload | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]); // Only allow one template file
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    // Validate file
    const validation = assignmentService.validateFile(file, allowedTypes, maxFileSize);
    if (!validation.isValid) {
      onUploadError?.(validation.error || 'Archivo no válido');
      return;
    }

    // Create upload object
    const newUpload: TemplateFileUpload = {
      id: `template-${Date.now()}`,
      file,
      description: '',
      progress: { loaded: 0, total: 0, percentage: 0 },
      status: 'pending'
    };

    setTemplateFile(newUpload);

    // If assignmentId is provided, upload immediately
    if (assignmentId) {
      uploadTemplate(newUpload, assignmentId);
    }
  }, [assignmentId, allowedTypes, maxFileSize, onUploadError]);

  const uploadTemplate = useCallback(async (upload: TemplateFileUpload, assId: string) => {
    setTemplateFile(prev => prev ? { ...prev, status: 'uploading' } : null);

    try {
      const uploadedFile = await assignmentService.uploadAssignmentFile(
        assId,
        upload.file,
        upload.description || undefined,
        true, // isTemplate = true
        (progress) => {
          setTemplateFile(prev => prev ? { ...prev, progress } : null);
        }
      );

      setTemplateFile(prev => prev ? {
        ...prev,
        status: 'success',
        uploadedFile
      } : null);

      onTemplateUploaded?.(uploadedFile);
    } catch (error: any) {
      setTemplateFile(prev => prev ? {
        ...prev,
        status: 'error',
        error: error.message
      } : null);
      onUploadError?.(error.message);
    }
  }, [onTemplateUploaded, onUploadError]);

  const handleUploadClick = () => {
    if (templateFile && assignmentId && templateFile.status === 'pending') {
      uploadTemplate(templateFile, assignmentId);
    }
  };

  const removeFile = () => {
    setTemplateFile(null);
  };

  const getStatusIcon = (status: TemplateFileUpload['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'uploading':
        return (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        );
      default:
        return null;
    }
  };

  const getMimeTypes = () => {
    if (allowedTypes.length > 0) {
      return allowedTypes.map(type => {
        // Map common extensions to MIME types
        const mimeMap: Record<string, string> = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'txt': 'text/plain',
          'zip': 'application/zip'
        };
        return mimeMap[type] || '*/*';
      }).join(',');
    }

    // Default: common document types
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ].join(',');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2 text-gray-700">
        <DocumentArrowDownIcon className="h-5 w-5" />
        <h3 className="text-sm font-medium">Archivo Plantilla (Opcional)</h3>
      </div>

      <p className="text-sm text-gray-500">
        Sube un archivo plantilla que los estudiantes deberán completar o usar como base para su trabajo.
        Por ejemplo: una plantilla de documento, código inicial, hoja de trabajo, etc.
      </p>

      {/* Drop Zone or File Display */}
      {!templateFile ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
            ${isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="template-file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Arrastra el archivo plantilla aquí o{' '}
                  <span className="text-blue-600 hover:text-blue-500">selecciona un archivo</span>
                </span>
                <input
                  id="template-file-upload"
                  name="template-file-upload"
                  type="file"
                  className="sr-only"
                  accept={getMimeTypes()}
                  onChange={handleFileInput}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                {allowedTypes.length > 0
                  ? `Tipos: ${allowedTypes.join(', ')} hasta ${assignmentService.formatFileSize(maxFileSize)}`
                  : `Documentos, hojas de cálculo, archivos comprimidos hasta ${assignmentService.formatFileSize(maxFileSize)}`
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* File Card */
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 flex items-center space-x-2">
              <DocumentIcon className="h-8 w-8 text-blue-500" />
              {getStatusIcon(templateFile.status)}
            </div>

            <div className="flex-1 min-w-0">
              {/* File info */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {templateFile.file.name}
                </p>
                <button
                  onClick={removeFile}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  disabled={templateFile.status === 'uploading'}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                {assignmentService.formatFileSize(templateFile.file.size)}
              </p>

              {/* Description input */}
              {templateFile.status !== 'success' && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Descripción del archivo plantilla
                  </label>
                  <input
                    type="text"
                    value={templateFile.description}
                    onChange={(e) => setTemplateFile(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Plantilla de informe que los estudiantes deben completar"
                    disabled={templateFile.status === 'uploading'}
                  />
                </div>
              )}

              {/* Progress bar */}
              {templateFile.status === 'uploading' && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Subiendo archivo plantilla...</span>
                    <span>{templateFile.progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${templateFile.progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {templateFile.status === 'error' && templateFile.error && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {templateFile.error}
                </div>
              )}

              {/* Success message */}
              {templateFile.status === 'success' && (
                <div className="mb-2 text-xs text-green-600 bg-green-50 p-2 rounded flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Archivo plantilla subido exitosamente
                </div>
              )}

              {/* Upload button (only if assignmentId is provided and status is pending) */}
              {assignmentId && templateFile.status === 'pending' && (
                <button
                  onClick={handleUploadClick}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Subir Plantilla
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> El archivo plantilla estará disponible para que los estudiantes lo descarguen
          antes de comenzar su trabajo en el assignment.
        </p>
      </div>
    </div>
  );
};

export default AssignmentTemplateUploader;
