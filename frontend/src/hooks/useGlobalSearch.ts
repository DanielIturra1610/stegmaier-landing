/**
 * useGlobalSearch Hook
 *
 * Provides global search functionality with debouncing and caching.
 *
 * Features:
 * - Debounced search (configurable delay)
 * - Loading and error states
 * - Search history
 * - Recent searches persistence
 * - Auto-suggestions
 *
 * Usage:
 * ```tsx
 * const {
 *   query,
 *   setQuery,
 *   results,
 *   isLoading,
 *   error,
 *   clearSearch
 * } = useGlobalSearch({
 *   searchCourses: true,
 *   searchUsers: false,
 *   debounceMs: 300
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import searchService, { type GlobalSearchResults, type SearchFilters } from '../services/searchService';

export interface UseGlobalSearchOptions {
  /**
   * Enable course search
   * @default true
   */
  searchCourses?: boolean;

  /**
   * Enable user search (requires admin permissions)
   * @default false
   */
  searchUsers?: boolean;

  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number;

  /**
   * Minimum query length to trigger search
   * @default 2
   */
  minQueryLength?: number;

  /**
   * Maximum number of results per category
   * @default 5
   */
  limit?: number;

  /**
   * Course level filter
   */
  courseLevel?: 'beginner' | 'intermediate' | 'advanced';

  /**
   * Course status filter
   */
  courseStatus?: 'draft' | 'published' | 'archived';

  /**
   * User role filter
   */
  userRole?: 'student' | 'instructor' | 'admin';

  /**
   * Only show verified users
   */
  onlyVerifiedUsers?: boolean;

  /**
   * Auto-search on mount with initial query
   */
  initialQuery?: string;

  /**
   * Callback when search completes
   */
  onSearchComplete?: (results: GlobalSearchResults) => void;

  /**
   * Callback when search fails
   */
  onSearchError?: (error: Error) => void;
}

export interface UseGlobalSearchReturn {
  /**
   * Current search query
   */
  query: string;

  /**
   * Update search query
   */
  setQuery: (query: string) => void;

  /**
   * Search results
   */
  results: GlobalSearchResults | null;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error if search failed
   */
  error: Error | null;

  /**
   * Clear current search
   */
  clearSearch: () => void;

  /**
   * Manually trigger search
   */
  search: (customQuery?: string) => Promise<void>;

  /**
   * Recent search queries
   */
  recentSearches: string[];

  /**
   * Clear search history
   */
  clearHistory: () => void;

  /**
   * Search suggestions
   */
  suggestions: string[];

  /**
   * Whether suggestions are loading
   */
  suggestionsLoading: boolean;
}

const RECENT_SEARCHES_KEY = 'globalSearch_recentSearches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Hook for global search functionality
 */
export const useGlobalSearch = (
  options: UseGlobalSearchOptions = {}
): UseGlobalSearchReturn => {
  const {
    searchCourses = true,
    searchUsers = false,
    debounceMs = 300,
    minQueryLength = 2,
    limit = 5,
    courseLevel,
    courseStatus,
    userRole,
    onlyVerifiedUsers,
    initialQuery = '',
    onSearchComplete,
    onSearchError
  } = options;

  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Refs to track debounce timers and prevent stale searches
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Load recent searches from localStorage
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  /**
   * Save recent searches to localStorage
   */
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < minQueryLength) {
      return;
    }

    setRecentSearches(prev => {
      const updated = [
        searchQuery,
        ...prev.filter(q => q !== searchQuery)
      ].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent searches:', error);
      }

      return updated;
    });
  }, [minQueryLength]);

  /**
   * Perform the search
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < minQueryLength) {
      setResults(null);
      return;
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [useGlobalSearch] Searching for:', searchQuery);

      const filters: SearchFilters = {
        query: searchQuery,
        searchCourses,
        searchUsers,
        limit,
        courseLevel,
        courseStatus,
        userRole,
        onlyVerifiedUsers
      };

      const searchResults = await searchService.globalSearch(filters);

      setResults(searchResults);
      saveRecentSearch(searchQuery);

      console.log('✅ [useGlobalSearch] Search completed:', {
        courses: searchResults.courses.results.length,
        users: searchResults.users.results.length
      });

      onSearchComplete?.(searchResults);
    } catch (err) {
      console.error('❌ [useGlobalSearch] Search error:', err);
      const error = err as Error;
      setError(error);
      onSearchError?.(error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    minQueryLength,
    searchCourses,
    searchUsers,
    limit,
    courseLevel,
    courseStatus,
    userRole,
    onlyVerifiedUsers,
    saveRecentSearch,
    onSearchComplete,
    onSearchError
  ]);

  /**
   * Debounced search effect
   */
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length >= minQueryLength) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(query);
      }, debounceMs);
    } else {
      setResults(null);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, minQueryLength, debounceMs, performSearch]);

  /**
   * Load suggestions with debouncing
   */
  useEffect(() => {
    if (suggestionsTimerRef.current) {
      clearTimeout(suggestionsTimerRef.current);
    }

    if (query.length >= minQueryLength) {
      setSuggestionsLoading(true);

      suggestionsTimerRef.current = setTimeout(async () => {
        try {
          const type = searchCourses && searchUsers
            ? 'all'
            : searchCourses
            ? 'courses'
            : 'users';

          const newSuggestions = await searchService.getSearchSuggestions(
            query,
            type
          );

          setSuggestions(newSuggestions);
        } catch (error) {
          console.error('Error loading suggestions:', error);
          setSuggestions([]);
        } finally {
          setSuggestionsLoading(false);
        }
      }, debounceMs);
    } else {
      setSuggestions([]);
      setSuggestionsLoading(false);
    }

    return () => {
      if (suggestionsTimerRef.current) {
        clearTimeout(suggestionsTimerRef.current);
      }
    };
  }, [query, minQueryLength, debounceMs, searchCourses, searchUsers]);

  /**
   * Manual search trigger
   */
  const search = useCallback(async (customQuery?: string) => {
    const searchQuery = customQuery || query;
    await performSearch(searchQuery);
  }, [query, performSearch]);

  /**
   * Clear current search
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
    setSuggestions([]);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (suggestionsTimerRef.current) {
      clearTimeout(suggestionsTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (suggestionsTimerRef.current) {
        clearTimeout(suggestionsTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
    search,
    recentSearches,
    clearHistory,
    suggestions,
    suggestionsLoading
  };
};

export default useGlobalSearch;
