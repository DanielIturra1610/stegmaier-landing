/**
 * Componente reproductor de video básico y funcional
 * Solución temporal mientras se completa AdvancedVideoPlayer
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import progressService, { VideoProgress } from '../../services/progressService';

interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  videoId: string;
  title?: string;
  onProgressUpdate?: (progress: VideoProgress) => void;
  onLessonComplete?: () => void;
  autoPlay?: boolean;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  lessonId,
  videoId,
  title,
  onProgressUpdate,
  onLessonComplete,
  autoPlay = false,
  className = ""
}) => {
  const { user } = useAuth();
  const { trackLessonStart, trackVideoProgress, trackLessonComplete } = useAnalytics();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lessonStartedRef = useRef<boolean>(false);

  // Agregar token JWT como query parameter para autenticación
  const getAuthenticatedVideoUrl = (url: string): string => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('⚠️ [VideoPlayer] No auth token found');
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
  };

  const authenticatedVideoUrl = getAuthenticatedVideoUrl(videoUrl);

  // Estados del reproductor
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchPercentage, setWatchPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Estados para UI
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tracking de sesión
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [sessionWatchTime, setSessionWatchTime] = useState(0);

  // Cargar progreso inicial
  useEffect(() => {
    loadInitialProgress();
  }, [lessonId, videoId]);

  // Setup de event listeners del video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      console.log('📺 [VideoPlayer] Video metadata loaded, duration:', video.duration);
    };

    const handleTimeUpdate = () => {
      const newCurrentTime = video.currentTime;
      setCurrentTime(newCurrentTime);

      // Calcular porcentaje
      if (video.duration > 0) {
        const percentage = Math.round((newCurrentTime / video.duration) * 100);
        setWatchPercentage(percentage);

        // Verificar si está completado (>= 90%)
        if (percentage >= 90 && !isCompleted) {
          setIsCompleted(true);
          handleVideoCompleted();
        }
      }

      // Guardar progreso periódicamente
      debouncedSaveProgress(newCurrentTime, video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setSessionStartTime(Date.now());

      // Track lesson start solo una vez por sesión
      if (!lessonStartedRef.current) {
        trackLessonStart(lessonId, videoId, title);
        lessonStartedRef.current = true;
        console.log('🎬 [VideoPlayer] Lesson started');
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      updateSessionWatchTime();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      updateSessionWatchTime();
      setIsCompleted(true);
      handleVideoCompleted();

      // Track lesson complete
      trackLessonComplete(lessonId, videoId, video.duration, title);
      console.log('✅ [VideoPlayer] Video ended');
    };

    const handleError = (e: Event) => {
      console.error('❌ [VideoPlayer] Error loading video:', e);
      setError('Error al cargar el video. Por favor, intenta de nuevo.');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    // Agregar listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      // Cleanup listeners
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);

      // Guardar progreso final
      if (progressSaveRef.current) {
        clearTimeout(progressSaveRef.current);
      }
      if (video.currentTime > 0 && video.duration > 0) {
        saveProgress(video.currentTime, video.duration, true);
      }
    };
  }, [lessonId, videoId]);

  // Auto-hide controls después de 3 segundos de inactividad
  useEffect(() => {
    if (isPlaying && showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  const loadInitialProgress = async () => {
    try {
      console.log('📊 [VideoPlayer] Loading initial progress for lesson:', lessonId);
      const progress = await progressService.getVideoProgress(lessonId, videoId);

      if (progress && videoRef.current) {
        // Restaurar posición guardada
        if (progress.current_position > 0 && progress.current_position < videoRef.current.duration) {
          videoRef.current.currentTime = progress.current_position;
          setCurrentTime(progress.current_position);
          console.log('⏩ [VideoPlayer] Restored position:', progress.current_position);
        }

        setWatchPercentage(progress.watch_percentage);
        setIsCompleted(progress.is_completed);

        if (onProgressUpdate) {
          onProgressUpdate(progress);
        }
      }
    } catch (error) {
      console.error('❌ [VideoPlayer] Error loading progress:', error);
    }
  };

  const updateSessionWatchTime = () => {
    if (isPlaying && sessionStartTime) {
      const additionalTime = Math.floor((Date.now() - sessionStartTime) / 1000);
      setSessionWatchTime(prev => prev + additionalTime);
    }
  };

  const debouncedSaveProgress = useCallback((currentTime: number, duration: number) => {
    // Cancelar timeout anterior
    if (progressSaveRef.current) {
      clearTimeout(progressSaveRef.current);
    }

    // Programar nuevo guardado
    progressSaveRef.current = setTimeout(() => {
      saveProgress(currentTime, duration);
    }, 5000); // Guardar cada 5 segundos
  }, []);

  const saveProgress = async (currentTime: number, duration: number, isSessionEnd = false) => {
    try {
      updateSessionWatchTime();

      const response = await progressService.updateVideoProgress(lessonId, videoId, {
        current_position: currentTime,
        duration: duration,
        session_time: isSessionEnd ? sessionWatchTime : 0
      });

      if (response) {
        setWatchPercentage(response.watch_percentage);

        if (onProgressUpdate) {
          onProgressUpdate(response);
        }

        // Track video progress milestones
        const progressPercentage = response.watch_percentage;
        if ([25, 50, 75, 90].includes(progressPercentage)) {
          trackVideoProgress(lessonId, videoId, progressPercentage, sessionWatchTime, duration);
        }

        // Reset session time si se guardó
        if (isSessionEnd) {
          setSessionWatchTime(0);
        }
      }
    } catch (error) {
      console.error('❌ [VideoPlayer] Error saving progress:', error);
    }
  };

  const handleVideoCompleted = () => {
    console.log('🎉 [VideoPlayer] Video completed!');
    if (onLessonComplete) {
      onLessonComplete();
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const formatTime = (timeInSeconds: number): string => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Manejo de errores
  if (error) {
    return (
      <div className={`bg-gray-900 rounded-lg overflow-hidden relative ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center text-white p-6">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">Error al Cargar Video</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-black rounded-lg overflow-hidden relative group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        src={authenticatedVideoUrl}
        autoPlay={autoPlay}
        playsInline
        onClick={togglePlayPause}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Cargando video...</p>
          </div>
        </div>
      )}

      {/* Play/Pause overlay (center) */}
      {!isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlayPause}
        >
          {!isPlaying && (
            <div className="bg-black bg-opacity-60 rounded-full p-4 transition-transform hover:scale-110">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Controls overlay (bottom) */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Time display */}
            <div className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            {/* Progress percentage */}
            <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
              {watchPercentage}%
            </div>

            {/* Completion badge */}
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-400 text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Completado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title overlay (top) */}
      {title && (
        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h3 className="text-white font-semibold text-lg">{title}</h3>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
