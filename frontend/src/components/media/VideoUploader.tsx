/**
 * Componente para subida de videos con drag & drop
 */
import React, { useState, useCallback } from 'react';
import { CloudArrowUpIcon, VideoCameraIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { mediaService, UploadProgress } from '../../services/mediaService';

interface VideoUploaderProps {
  onUploadSuccess?: (videoId: string, videoInfo: any) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  maxFiles?: number;
  showUploadForm?: boolean;
}

interface FileUpload {
  id: string;
  file: File;
  title: string;
  description: string;
  progress: UploadProgress;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  videoId?: string;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  className = '',
  maxFiles = 5,
  showUploadForm = true
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);

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
    // Filtrar solo archivos de video y validar
    const videoFiles = (Array.isArray(files) ? files : []).filter(file => {
      const validation = mediaService.validateVideoFile(file);
      if (!validation.isValid) {
        onUploadError?.(validation.error || 'Archivo no válido');
        return false;
      }
      return true;
    });

    // Verificar límite de archivos
    if (uploads.length + videoFiles.length > maxFiles) {
      onUploadError?.(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    // Crear objetos de upload
    const newUploads: FileUpload[] = videoFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remover extensión
      description: '',
      progress: { loaded: 0, total: 0, percentage: 0 },
      status: 'pending'
    }));

    setUploads(prev => [...prev, ...newUploads]);
  }, [uploads.length, maxFiles, onUploadError]);

  const updateUpload = useCallback((id: string, updates: Partial<FileUpload>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    ));
  }, []);

  const handleUpload = useCallback(async (upload: FileUpload) => {
    if (!upload.title.trim()) {
      updateUpload(upload.id, {
        status: 'error',
        error: 'El título es requerido'
      });
      return;
    }

    updateUpload(upload.id, { status: 'uploading' });

    try {
      const result = await mediaService.uploadVideo(
        upload.file,
        upload.title,
        upload.description || undefined,
        (progress) => {
          updateUpload(upload.id, { progress });
        }
      );

      updateUpload(upload.id, {
        status: 'success',
        videoId: result.video_id
      });

      onUploadSuccess?.(result.video_id, result);
    } catch (error: any) {
      updateUpload(upload.id, {
        status: 'error',
        error: error.message
      });
      onUploadError?.(error.message);
    }
  }, [updateUpload, onUploadSuccess, onUploadError]);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => (Array.isArray(prev) ? prev : []).filter(upload => upload.id !== id));
  }, []);

  const getStatusIcon = (status: FileUpload['status']) => {
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
        return <VideoCameraIcon className="h-5 w-5 text-gray-400" />;
    }
  };

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
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Arrastra videos aquí o{' '}
                <span className="text-blue-600 hover:text-blue-500">selecciona archivos</span>
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept="video/mp4,video/mpeg,video/quicktime,video/webm"
                onChange={handleFileInput}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              MP4, MPEG, MOV, WebM hasta 100MB
            </p>
          </div>
        </div>
      </div>

      {/* Lista de uploads */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Videos a subir ({uploads.length})
          </h3>
          
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
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
                      {mediaService.formatFileSize(upload.file.size)}
                    </p>

                    {/* Formulario de información */}
                    {showUploadForm && upload.status !== 'success' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Título del video *
                          </label>
                          <input
                            type="text"
                            value={upload.title}
                            onChange={(e) => updateUpload(upload.id, { title: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Título del video"
                            disabled={upload.status === 'uploading'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descripción (opcional)
                          </label>
                          <textarea
                            value={upload.description}
                            onChange={(e) => updateUpload(upload.id, { description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Descripción del video"
                            disabled={upload.status === 'uploading'}
                          />
                        </div>
                      </div>
                    )}

                    {/* Barra de progreso */}
                    {upload.status === 'uploading' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Subiendo...</span>
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
                      <div className="mt-2 text-xs text-red-600">
                        {upload.error}
                      </div>
                    )}

                    {/* Mensaje de éxito */}
                    {upload.status === 'success' && (
                      <div className="mt-2 text-xs text-green-600">
                        Video subido exitosamente
                      </div>
                    )}

                    {/* Botón de subir */}
                    {upload.status === 'pending' && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleUpload(upload)}
                          disabled={!upload.title.trim()}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Subir Video
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
