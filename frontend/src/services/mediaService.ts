/**
 * Media Service - Frontend service for multimedia file management
 * ✅ CORREGIDO: URLs centralizadas, headers centralizados, sin URLs relativas
 */
import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../config/api.config';

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
      console.log('📹 [mediaService] Uploading video:', title);
      
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.MEDIA}/upload/video`),
        formData,
        {
          headers: {
            ...getAuthHeaders(),
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

      console.log('✅ [mediaService] Video uploaded successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [mediaService] Error uploading video:', error);
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
      console.log('🖼️ [mediaService] Uploading image with purpose:', purpose);
      
      const response = await axios.post(
        buildApiUrl(`${API_ENDPOINTS.MEDIA}/upload/image`),
        formData,
        {
          headers: {
            ...getAuthHeaders(),
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

      console.log('✅ [mediaService] Image uploaded successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [mediaService] Error uploading image:', error);
      throw new Error(error.response?.data?.detail || 'Error al subir imagen');
    }
  }

  /**
   * Obtener información de un video
   */
  async getVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
      console.log('📹 [mediaService] Getting video info:', videoId);
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.MEDIA}/video/${videoId}/info`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [mediaService] Video info retrieved:', response.data.title);
      return response.data;
    } catch (error: any) {
      console.error('❌ [mediaService] Error getting video info:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener información del video');
    }
  }

  /**
   * Obtener información de una imagen
   */
  async getImageInfo(imageId: string): Promise<ImageInfo> {
    try {
      console.log('🖼️ [mediaService] Getting image info:', imageId);
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.MEDIA}/image/${imageId}/info`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [mediaService] Image info retrieved:', response.data.purpose);
      return response.data;
    } catch (error: any) {
      console.error('❌ [mediaService] Error getting image info:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener información de la imagen');
    }
  }

  /**
   * Obtener URL de streaming de video
   */
  getVideoStreamUrl(videoId: string): string {
    const token = localStorage.getItem('auth_token');
    const url = buildApiUrl(`${API_ENDPOINTS.MEDIA}/video/${videoId}/stream?token=${token}`);
    console.log('🎥 [mediaService] Generated video stream URL for:', videoId);
    return url;
  }

  /**
   * Obtener URL de imagen
   */
  getImageUrl(imageId: string): string {
    const token = localStorage.getItem('auth_token');
    const url = buildApiUrl(`${API_ENDPOINTS.MEDIA}/image/${imageId}?token=${token}`);
    console.log('🖼️ [mediaService] Generated image URL for:', imageId);
    return url;
  }

  /**
   * Eliminar video (solo admins)
   */
  async deleteVideo(videoId: string): Promise<{ message: string }> {
    try {
      console.log('🗑️ [mediaService] Deleting video:', videoId);
      
      const response = await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.MEDIA}/video/${videoId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [mediaService] Video deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [mediaService] Error deleting video:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar video');
    }
  }

  /**
   * Eliminar imagen (solo admins)
   */
  async deleteImage(imageId: string): Promise<{ message: string }> {
    try {
      console.log('🗑️ [mediaService] Deleting image:', imageId);
      
      const response = await axios.delete(
        buildApiUrl(`${API_ENDPOINTS.MEDIA}/image/${imageId}`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [mediaService] Image deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [mediaService] Error deleting image:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar imagen');
    }
  }

  /**
   * Listar videos del usuario (o todos si es admin)
   */
  async listVideos(): Promise<VideoInfo[]> {
    try {
      console.log('📚 [mediaService] Listing videos');
      
      const response = await axios.get(
        buildApiUrl(`${API_ENDPOINTS.MEDIA}/videos`),
        { headers: getAuthHeaders() }
      );

      console.log('✅ [mediaService] Videos listed:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [mediaService] Error listing videos:', error);
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
