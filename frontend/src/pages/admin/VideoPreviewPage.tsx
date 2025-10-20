import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Button from '../../components/ui/button';
import { mediaService, VideoInfo } from '../../services/mediaService';
import { useAuth } from '../../contexts/AuthContext';

const VideoPreviewPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoId) {
      loadVideoInfo();
    }
  }, [videoId]);

  const loadVideoInfo = async () => {
    if (!videoId) return;

    try {
      setLoading(true);
      setError(null);
      const videoInfo = await mediaService.getVideoInfo(videoId);
      setVideo(videoInfo);
    } catch (error: any) {
      console.error('Error loading video info:', error);
      setError(error.message || 'Error al cargar información del video');
      toast.error('No se pudo cargar la información del video');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayIconPauseIcon = () => {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoElement) {
      videoElement.muted = !videoElement.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoElement) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      }
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoId || !video) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar el video "${video.title}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await mediaService.deleteVideo(videoId);
      toast.success('Video eliminado correctamente');
      navigate(-1); // Volver a la página anterior
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast.error(error.message || 'No se pudo eliminar el video');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds === 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const formatDate = (dateString: string): string => {
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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container mx-auto py-6">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Error al cargar el video
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'Video no encontrado'}
              </p>
              <Button onClick={() => navigate(-1)}>
                Volver
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const videoStreamUrl = mediaService.getVideoStreamUrl(video.id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{video.title}</h1>
            <p className="text-gray-600">{video.original_filename}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            video.status === 'uploaded'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {video.status}
          </span>
          {(user?.role === 'admin' || user?.role === 'instructor') && (
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              size="sm"
              onClick={handleDeleteVideo}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video PlayIconer */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="p-0">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={setVideoElement}
                  src={videoStreamUrl}
                  className="w-full h-auto max-h-[500px]"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
                >
                  Tu navegador no soporta la reproducción de videos.
                </video>

                {/* Custom controls overlay */}
                <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePlayIconPauseIcon}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMuteToggle}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    {isMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFullscreen}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Information */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Información del Video
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Título</label>
                <p className="text-gray-900">{video.title}</p>
              </div>

              {video.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Descripción</label>
                  <p className="text-gray-900 text-sm">{video.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Archivo Original</label>
                <p className="text-gray-900 text-sm">{video.original_filename}</p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detalles Técnicos</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tamaño</span>
                <span className="text-sm font-medium">{formatFileSize(video.file_size)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duración</span>
                <span className="text-sm font-medium">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  {formatDuration(video.duration || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tipo MIME</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                  {video.mime_type}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            video.status === 'uploaded'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
                  {video.status}
                </span>
              </div>
            </div>
          </div>

          {/* Upload Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Información de Subida
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de subida</label>
                <p className="text-sm">{formatDate(video.upload_date)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Subido por
                </label>
                <p className="text-sm">{video.uploaded_by}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Acciones</h3>
            </div>
            <div className="p-6 space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => window.open(videoStreamUrl, '_blank')}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Descargar Video
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => {
                  // TODO: Implementar edición de video
                  toast('La edición de videos estará disponible pronto');
                }}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                PencilIconar Información
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewPage;