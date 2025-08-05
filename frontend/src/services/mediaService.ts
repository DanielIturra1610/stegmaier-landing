/**
 * Servicio para gestión de archivos multimedia
 */
import axios from 'axios';
import { authService } from './auth.service';

export interface VideoInfo {
  id: string;
  title: string;
  description?: string;
  original_filename: string;
  file_size: number;
  upload_date: string;
  mime_type: string;
  duration?: number;
  status: string;
  uploaded_by: string;
}

export interface ImageInfo {
  id: string;
  purpose: string;
  original_filename: string;
  file_size: number;
  upload_date: string;
  mime_type: string;
  extension: string;
  uploaded_by: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class MediaService {
  private baseURL = '/api/v1/media';

  /**
   * Subir archivo de video con progress tracking
   */
  async uploadVideo(
    file: File,
    title: string,
    description?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ message: string; video_id: string; title: string; status: string; upload_date: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) {
      formData.append('description', description);
    }

    try {
      const response = await axios.post(`${this.baseURL}/upload/video`, formData, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const loaded = progressEvent.loaded;
            const total = progressEvent.total;
            const percentage = Math.round((loaded * 100) / total);
            onProgress({ loaded, total, percentage });
          }
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading video:', error);
      throw new Error(error.response?.data?.detail || 'Error al subir video');
    }
  }

  /**
   * Subir archivo de imagen
   */
  async uploadImage(
    file: File,
    purpose: string = 'general',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ message: string; image_id: string; purpose: string; upload_date: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    try {
      const response = await axios.post(`${this.baseURL}/upload/image`, formData, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const loaded = progressEvent.loaded;
            const total = progressEvent.total;
            const percentage = Math.round((loaded * 100) / total);
            onProgress({ loaded, total, percentage });
          }
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw new Error(error.response?.data?.detail || 'Error al subir imagen');
    }
  }

  /**
   * Obtener información de un video
   */
  async getVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
      const response = await axios.get(`${this.baseURL}/video/${videoId}/info`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting video info:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener información del video');
    }
  }

  /**
   * Obtener información de una imagen
   */
  async getImageInfo(imageId: string): Promise<ImageInfo> {
    try {
      const response = await axios.get(`${this.baseURL}/image/${imageId}/info`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting image info:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener información de la imagen');
    }
  }

  /**
   * Obtener URL de streaming de video
   */
  getVideoStreamUrl(videoId: string): string {
    return `${this.baseURL}/video/${videoId}/stream?token=${authService.getToken()}`;
  }

  /**
   * Obtener URL de imagen
   */
  getImageUrl(imageId: string): string {
    return `${this.baseURL}/image/${imageId}?token=${authService.getToken()}`;
  }

  /**
   * Eliminar video (solo admins)
   */
  async deleteVideo(videoId: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`${this.baseURL}/video/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error deleting video:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar video');
    }
  }

  /**
   * Eliminar imagen (solo admins)
   */
  async deleteImage(imageId: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`${this.baseURL}/image/${imageId}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error deleting image:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar imagen');
    }
  }

  /**
   * Listar videos del usuario (o todos si es admin)
   */
  async listVideos(): Promise<VideoInfo[]> {
    try {
      const response = await axios.get(`${this.baseURL}/videos`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error listing videos:', error);
      throw new Error(error.response?.data?.detail || 'Error al listar videos');
    }
  }

  /**
   * Validar archivo de video
   */
  validateVideoFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de archivo no válido. Tipos permitidos: MP4, MPEG, MOV, WebM'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 100MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Validar archivo de imagen
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de archivo no válido. Tipos permitidos: JPEG, PNG, WebP, GIF'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatear duración de video
   */
  formatDuration(seconds?: number): string {
    if (!seconds) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
}

export const mediaService = new MediaService();
