/**
 * Global Search Service
 *
 * Provides unified search across courses and users.
 * Integrates with backend search endpoints for both entities.
 */

import axios from 'axios';
import { buildApiUrl, getAuthHeaders } from '../config/api.config';

// ============================================
// Types
// ============================================

export interface SearchCourseResult {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructorId: string;
  instructorName?: string;
  categoryId?: string;
  categoryName?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  price: number;
  isFree: boolean;
  thumbnail?: string;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchUserResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
}

export interface GlobalSearchResults {
  courses: {
    results: SearchCourseResult[];
    total: number;
    hasMore: boolean;
  };
  users: {
    results: SearchUserResult[];
    total: number;
    hasMore: boolean;
  };
}

export interface SearchFilters {
  query: string;
  searchCourses?: boolean;
  searchUsers?: boolean;
  limit?: number;
  courseLevel?: 'beginner' | 'intermediate' | 'advanced';
  courseStatus?: 'draft' | 'published' | 'archived';
  userRole?: 'student' | 'instructor' | 'admin';
  onlyVerifiedUsers?: boolean;
}

// ============================================
// Search Service
// ============================================

class SearchService {
  private readonly API_ENDPOINTS = {
    COURSES: '/api/v1/courses',
    USERS: '/api/v1/admin/users'
  };

  /**
   * Search courses by query string
   */
  async searchCourses(
    query: string,
    filters?: {
      level?: 'beginner' | 'intermediate' | 'advanced';
      status?: 'draft' | 'published' | 'archived';
      categoryId?: string;
      instructorId?: string;
      minPrice?: number;
      maxPrice?: number;
      isFree?: boolean;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{
    courses: SearchCourseResult[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 [SearchService] Searching courses:', { query, filters });

      const params: Record<string, string | number | boolean> = {
        search: query,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 10
      };

      // Add optional filters
      if (filters?.level) params.level = filters.level;
      if (filters?.status) params.status = filters.status;
      if (filters?.categoryId) params.categoryId = filters.categoryId;
      if (filters?.instructorId) params.instructorId = filters.instructorId;
      if (filters?.minPrice !== undefined) params.minPrice = filters.minPrice;
      if (filters?.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
      if (filters?.isFree !== undefined) params.isFree = filters.isFree;

      const response = await axios.get(
        buildApiUrl(this.API_ENDPOINTS.COURSES),
        {
          headers: getAuthHeaders(),
          params
        }
      );

      const data = response.data?.data || response.data;

      console.log('✅ [SearchService] Courses found:', {
        count: data.courses?.length || 0,
        total: data.total
      });

      return {
        courses: data.courses || [],
        total: data.total || 0,
        page: data.page || 1,
        pageSize: data.pageSize || 10,
        totalPages: data.totalPages || 0
      };
    } catch (error) {
      console.error('❌ [SearchService] Error searching courses:', error);
      throw error;
    }
  }

  /**
   * Search users by query string (admin only)
   */
  async searchUsers(
    query: string,
    filters?: {
      role?: 'student' | 'instructor' | 'admin';
      tenantId?: string;
      isVerified?: boolean;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{
    users: SearchUserResult[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      console.log('🔍 [SearchService] Searching users:', { query, filters });

      const params: Record<string, string | number | boolean> = {
        search: query,
        page: filters?.page || 1,
        page_size: filters?.pageSize || 10
      };

      // Add optional filters
      if (filters?.role) params.role = filters.role;
      if (filters?.tenantId) params.tenant_id = filters.tenantId;
      if (filters?.isVerified !== undefined) params.is_verified = filters.isVerified;

      const response = await axios.get(
        buildApiUrl(this.API_ENDPOINTS.USERS),
        {
          headers: getAuthHeaders(),
          params
        }
      );

      const data = response.data?.data || response.data;

      console.log('✅ [SearchService] Users found:', {
        count: data.users?.length || 0,
        total: data.total
      });

      return {
        users: data.users || [],
        total: data.total || 0,
        page: data.page || 1,
        pageSize: data.page_size || 10,
        totalPages: data.total_pages || 0
      };
    } catch (error) {
      console.error('❌ [SearchService] Error searching users:', error);
      throw error;
    }
  }

  /**
   * Global search across courses and users
   */
  async globalSearch(filters: SearchFilters): Promise<GlobalSearchResults> {
    const {
      query,
      searchCourses = true,
      searchUsers = false, // Users search requires admin permissions
      limit = 5,
      courseLevel,
      courseStatus,
      userRole,
      onlyVerifiedUsers
    } = filters;

    if (!query || query.trim().length === 0) {
      return {
        courses: { results: [], total: 0, hasMore: false },
        users: { results: [], total: 0, hasMore: false }
      };
    }

    try {
      console.log('🔍 [SearchService] Global search:', {
        query,
        searchCourses,
        searchUsers,
        limit
      });

      // Execute searches in parallel
      const promises: Promise<any>[] = [];

      if (searchCourses) {
        promises.push(
          this.searchCourses(query, {
            level: courseLevel,
            status: courseStatus,
            pageSize: limit
          })
        );
      } else {
        promises.push(Promise.resolve({ courses: [], total: 0 }));
      }

      if (searchUsers) {
        promises.push(
          this.searchUsers(query, {
            role: userRole,
            isVerified: onlyVerifiedUsers,
            pageSize: limit
          })
        );
      } else {
        promises.push(Promise.resolve({ users: [], total: 0 }));
      }

      const [coursesResult, usersResult] = await Promise.all(promises);

      const results: GlobalSearchResults = {
        courses: {
          results: coursesResult.courses || [],
          total: coursesResult.total || 0,
          hasMore: (coursesResult.total || 0) > limit
        },
        users: {
          results: usersResult.users || [],
          total: usersResult.total || 0,
          hasMore: (usersResult.total || 0) > limit
        }
      };

      console.log('✅ [SearchService] Global search completed:', {
        coursesFound: results.courses.results.length,
        usersFound: results.users.results.length,
        totalCourses: results.courses.total,
        totalUsers: results.users.total
      });

      return results;
    } catch (error) {
      console.error('❌ [SearchService] Error in global search:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(
    query: string,
    type: 'courses' | 'users' | 'all' = 'all'
  ): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const suggestions: Set<string> = new Set();

      if (type === 'courses' || type === 'all') {
        const coursesResult = await this.searchCourses(query, {
          pageSize: 5
        });

        coursesResult.courses.forEach(course => {
          suggestions.add(course.title);
          if (course.categoryName) {
            suggestions.add(course.categoryName);
          }
        });
      }

      if (type === 'users' || type === 'all') {
        try {
          const usersResult = await this.searchUsers(query, {
            pageSize: 5
          });

          usersResult.users.forEach(user => {
            suggestions.add(`${user.firstName} ${user.lastName}`);
          });
        } catch (error) {
          // User search might fail due to permissions, ignore silently
          console.log('ℹ️ [SearchService] User suggestions not available (permissions)');
        }
      }

      return Array.from(suggestions).slice(0, 10);
    } catch (error) {
      console.error('❌ [SearchService] Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Search courses by category
   */
  async searchCoursesByCategory(
    categoryId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    courses: SearchCourseResult[];
    total: number;
  }> {
    try {
      console.log('🔍 [SearchService] Searching courses by category:', categoryId);

      const response = await axios.get(
        buildApiUrl(`${this.API_ENDPOINTS.COURSES}/category/${categoryId}`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );

      const data = response.data?.data || response.data;

      return {
        courses: data.courses || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ [SearchService] Error searching by category:', error);
      throw error;
    }
  }

  /**
   * Search courses by instructor
   */
  async searchCoursesByInstructor(
    instructorId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    courses: SearchCourseResult[];
    total: number;
  }> {
    try {
      console.log('🔍 [SearchService] Searching courses by instructor:', instructorId);

      const response = await axios.get(
        buildApiUrl(`${this.API_ENDPOINTS.COURSES}/instructor/${instructorId}`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );

      const data = response.data?.data || response.data;

      return {
        courses: data.courses || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ [SearchService] Error searching by instructor:', error);
      throw error;
    }
  }

  /**
   * Get published courses (no search query required)
   */
  async getPublishedCourses(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    courses: SearchCourseResult[];
    total: number;
  }> {
    try {
      console.log('🔍 [SearchService] Getting published courses');

      const response = await axios.get(
        buildApiUrl(`${this.API_ENDPOINTS.COURSES}/published`),
        {
          headers: getAuthHeaders(),
          params: { page, pageSize }
        }
      );

      const data = response.data?.data || response.data;

      return {
        courses: data.courses || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('❌ [SearchService] Error getting published courses:', error);
      throw error;
    }
  }
}

// Export singleton instance
const searchService = new SearchService();
export default searchService;
