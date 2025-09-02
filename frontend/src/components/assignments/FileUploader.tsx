/**
 * Componente especializado para subida de archivos múltiples en assignments
 * Reutiliza y extiende patrones del VideoUploader existente
 */
import React, { useState, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  ArchiveBoxIcon,
  CodeBracketIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { assignmentService } from '../../services/assignmentService';
import { AssignmentFile, FileType, FileUploadProgress, FileUploaderProps } from '../../types/assignment';

interface FileUploadItem {
  id: string;
  file: File;
  description: string;
  progress: FileUploadProgress;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: AssignmentFile;
}

export const FileUploader = React.forwardRef<{ uploadAllFiles: (submissionId: string) => Promise<AssignmentFile[]> }, FileUploaderProps>(({
  onFilesUploaded,
  onUploadError,
  maxFiles = 5,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = [],
  acceptedMimeTypes = [],
  className = ''
}, ref) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploads, setUploads] = useState<FileUploadItem[]>([]);

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
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    // Validar archivos
    const validFiles = (Array.isArray(files) ? files : []).filter(file => {
      const validation = assignmentService.validateFile(file, allowedTypes, maxFileSize);
      if (!validation.isValid) {
        onUploadError?.(validation.error || 'Archivo no válido');
        return false;
      }
      return true;
    });

    // Verificar límite de archivos
    if (uploads.length + validFiles.length > maxFiles) {
      onUploadError?.(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    // Crear objetos de upload
    const newUploads: FileUploadItem[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      description: '',
      progress: { loaded: 0, total: 0, percentage: 0 },
      status: 'pending'
    }));

    setUploads(prev => [...prev, ...newUploads]);
  }, [uploads.length, maxFiles, onUploadError, allowedTypes, maxFileSize]);

  const updateUpload = useCallback((id: string, updates: Partial<FileUploadItem>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    ));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => (Array.isArray(prev) ? prev : []).filter(upload => upload.id !== id));
  }, []);

  const handleUpload = useCallback(async (upload: FileUploadItem, submissionId: string) => {
    updateUpload(upload.id, { status: 'uploading' });

    try {
      const uploadedFile = await assignmentService.uploadSubmissionFile(
        submissionId,
        upload.file,
        upload.description || undefined,
        (progress) => {
          updateUpload(upload.id, { progress });
        }
      );

      updateUpload(upload.id, {
        status: 'success',
        uploadedFile
      });

      return uploadedFile;
    } catch (error: any) {
      updateUpload(upload.id, {
        status: 'error',
        error: error.message
      });
      onUploadError?.(error.message);
      throw error;
    }
  }, [updateUpload, onUploadError]);

  const uploadAllFiles = useCallback(async (submissionId: string) => {
    const pendingUploads = (Array.isArray(uploads) ? uploads : []).filter(upload => upload.status === 'pending');
    const uploadedFiles: AssignmentFile[] = [];

    for (const upload of pendingUploads) {
      try {
        const file = await handleUpload(upload, submissionId);
        uploadedFiles.push(file);
      } catch (error) {
        // Error already handled in handleUpload
        break;
      }
    }

    if (uploadedFiles.length > 0) {
      onFilesUploaded(uploadedFiles);
    }

    return uploadedFiles;
  }, [uploads, handleUpload, onFilesUploaded]);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "h-6 w-6";
    
    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <DocumentIcon className={`${iconClass} text-red-500`} />;
    }
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
      return <PhotoIcon className={`${iconClass} text-green-500`} />;
    }
    
    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return <VideoCameraIcon className={`${iconClass} text-purple-500`} />;
    }
    
    // Audio
    if (['mp3', 'wav', 'wma', 'm4a', 'aac', 'ogg'].includes(extension || '')) {
      return <MusicalNoteIcon className={`${iconClass} text-blue-500`} />;
    }
    
    // Presentations
    if (['ppt', 'pptx', 'odp'].includes(extension || '')) {
      return <PresentationChartBarIcon className={`${iconClass} text-orange-500`} />;
    }
    
    // Spreadsheets
    if (['xls', 'xlsx', 'ods', 'csv'].includes(extension || '')) {
      return <TableCellsIcon className={`${iconClass} text-green-600`} />;
    }
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <ArchiveBoxIcon className={`${iconClass} text-yellow-600`} />;
    }
    
    // Code
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'php', 'rb', 'go', 'rs'].includes(extension || '')) {
      return <CodeBracketIcon className={`${iconClass} text-indigo-500`} />;
    }
    
    // Default
    return <DocumentIcon className={`${iconClass} text-gray-500`} />;
  };

  const getStatusIcon = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        );
      default:
        return null;
    }
  };

  const getMimeTypes = () => {
    if (acceptedMimeTypes.length > 0) {
      return acceptedMimeTypes.join(',');
    }
    
    // Default mime types based on common file types
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed'
    ].join(',');
  };

  // Expose uploadAllFiles method through ref
  React.useImperativeHandle(ref, () => ({
    uploadAllFiles
  }), [uploadAllFiles]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
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
            <label htmlFor="assignment-file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Arrastra archivos aquí o{' '}
                <span className="text-blue-600 hover:text-blue-500">selecciona archivos</span>
              </span>
              <input
                id="assignment-file-upload"
                name="assignment-file-upload"
                type="file"
                className="sr-only"
                multiple
                accept={getMimeTypes()}
                onChange={handleFileInput}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              {allowedTypes.length > 0 
                ? `Tipos: ${allowedTypes.join(', ')} hasta ${assignmentService.formatFileSize(maxFileSize)}`
                : `Múltiples tipos de archivo hasta ${assignmentService.formatFileSize(maxFileSize)}`
              }
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Máximo {maxFiles} archivo{maxFiles > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de archivos */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Archivos seleccionados ({uploads.length})
            </h3>
            <div className="text-sm text-gray-500">
              {(Array.isArray(uploads) ? uploads : []).filter(u => u.status === 'success').length} de {uploads.length} completados
            </div>
          </div>
          
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {getFileIcon(upload.file.name)}
                    {getStatusIcon(upload.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Información del archivo */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {upload.file.name}
                      </p>
                      <button
                        onClick={() => removeUpload(upload.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        disabled={upload.status === 'uploading'}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">
                      {assignmentService.formatFileSize(upload.file.size)}
                    </p>

                    {/* Formulario de descripción */}
                    {upload.status !== 'success' && (
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Descripción (opcional)
                        </label>
                        <input
                          type="text"
                          value={upload.description}
                          onChange={(e) => updateUpload(upload.id, { description: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe el contenido del archivo"
                          disabled={upload.status === 'uploading'}
                        />
                      </div>
                    )}

                    {/* Barra de progreso */}
                    {upload.status === 'uploading' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Subiendo archivo...</span>
                          <span>{upload.progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${upload.progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Mensaje de error */}
                    {upload.status === 'error' && upload.error && (
                      <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        {upload.error}
                      </div>
                    )}

                    {/* Mensaje de éxito */}
                    {upload.status === 'success' && (
                      <div className="mb-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                        ✓ Archivo subido exitosamente
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botones de acción globales */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {(Array.isArray(uploads) ? uploads : []).filter(u => u.status === 'pending').length} archivo{(Array.isArray(uploads) ? uploads : []).filter(u => u.status === 'pending').length !== 1 ? 's' : ''} pendiente{(Array.isArray(uploads) ? uploads : []).filter(u => u.status === 'pending').length !== 1 ? 's' : ''}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setUploads([])}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploads.some(u => u.status === 'uploading')}
              >
                Limpiar Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default FileUploader;
