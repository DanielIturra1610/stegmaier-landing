import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Calendar,
  FileText,
  User,
  Clock
} from 'lucide-react';
import { mediaService, VideoInfo } from '../../services/mediaService';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';

const VideoPreviewPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del video',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
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
      toast({
        title: 'Éxito',
        description: 'Video eliminado correctamente',
      });
      navigate(-1); // Volver a la página anterior
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el video',
        variant: 'destructive',
      });
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
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>
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
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{video.title}</h1>
            <p className="text-gray-600">{video.original_filename}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={video.status === 'uploaded' ? 'default' : 'secondary'}>
            {video.status}
          </Badge>
          {(user?.role === 'admin' || user?.role === 'instructor') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteVideo}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
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
                    variant="secondary"
                    onClick={handlePlayPause}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleMuteToggle}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleFullscreen}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Information */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Información del Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tamaño</span>
                <span className="text-sm font-medium">{formatFileSize(video.file_size)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duración</span>
                <span className="text-sm font-medium">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {formatDuration(video.duration || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tipo MIME</span>
                <Badge variant="outline" className="text-xs">
                  {video.mime_type}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <Badge variant={video.status === 'uploaded' ? 'default' : 'secondary'}>
                  {video.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Upload Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Información de Subida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de subida</label>
                <p className="text-sm">{formatDate(video.upload_date)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Subido por
                </label>
                <p className="text-sm">{video.uploaded_by}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open(videoStreamUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Video
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // TODO: Implementar edición de video
                  toast({
                    title: 'Funcionalidad en desarrollo',
                    description: 'La edición de videos estará disponible pronto',
                  });
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Información
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewPage;