import { apiClient } from './api';

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: {
    avatarUrl: string;
  };
}

export interface ProfileData {
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  timezone: string;
  language: string;
  theme: string;
  preferences: Record<string, any>;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: ProfileData;
}

const profileService = {
  /**
   * Upload a new avatar image
   * @param file - The image file to upload
   * @returns The URL of the uploaded avatar
   */
  async uploadAvatar(file: File): Promise<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<UploadAvatarResponse>(
      '/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Delete the current avatar
   */
  async deleteAvatar(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete('/profile/avatar');
    return response.data;
  },

  /**
   * Get the current user's profile
   */
  async getMyProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>('/profile/me');
    return response.data;
  },

  /**
   * Update the current user's profile
   */
  async updateMyProfile(data: {
    bio?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put('/profile/me', data);
    return response.data;
  },
};

export default profileService;
