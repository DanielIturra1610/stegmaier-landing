/**
 * GlobalSearchModal Component
 *
 * Command palette-style global search interface.
 * Allows searching across courses and users with keyboard navigation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Search, BookOpen, Users, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchCourses?: boolean;
  searchUsers?: boolean;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  searchCourses = true,
  searchUsers = false
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const {
    query,
    setQuery,
    results,
    isLoading,
    clearSearch,
    recentSearches
  } = useGlobalSearch({
    searchCourses,
    searchUsers,
    debounceMs: 300,
    minQueryLength: 2,
    limit: 5
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
      setSelectedIndex(0);
    }
  }, [isOpen, clearSearch]);

  // Calculate total results for keyboard navigation
  const totalResults =
    (results?.courses.results.length || 0) +
    (results?.users.results.length || 0);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < totalResults - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          handleSelectResult(selectedIndex);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, totalResults, onClose]);

  const handleSelectResult = (index: number) => {
    if (!results) return;

    const courseResults = results.courses.results;
    const userResults = results.users.results;

    if (index < courseResults.length) {
      const course = courseResults[index];
      navigate(`/platform/courses/${course.id}`);
      onClose();
    } else {
      const userIndex = index - courseResults.length;
      if (userIndex < userResults.length) {
        const user = userResults[userIndex];
        navigate(`/admin/users/${user.id}`);
        onClose();
      }
    }
  };

  const handleSelectRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={
                searchCourses && searchUsers
                  ? 'Search courses and users...'
                  : searchCourses
                  ? 'Search courses...'
                  : 'Search users...'
              }
              className="flex-1 text-lg outline-none text-gray-900 placeholder-gray-400"
              aria-label="Search input"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="mt-3 text-sm text-gray-500">Searching...</p>
              </div>
            )}

            {!isLoading && !query && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-700">
                    Recent Searches
                  </h3>
                </div>
                <div className="space-y-1">
                  {recentSearches.slice(0, 5).map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectRecentSearch(recentQuery)}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {recentQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && query && results && (
              <div className="p-4 space-y-4">
                {/* Course Results */}
                {searchCourses && results.courses.results.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-primary-600" />
                      <h3 className="text-sm font-semibold text-gray-900">
                        Courses ({results.courses.total})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {results.courses.results.map((course, index) => (
                        <button
                          key={course.id}
                          onClick={() => handleSelectResult(index)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedIndex === index
                              ? 'bg-primary-50 border-primary-200'
                              : 'hover:bg-gray-50 border-transparent'
                          } border`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {course.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {course.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                {course.instructorName && (
                                  <span className="text-xs text-gray-500">
                                    by {course.instructorName}
                                  </span>
                                )}
                                {course.rating > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <TrendingUp className="w-3 h-3" />
                                    {course.rating.toFixed(1)}
                                  </div>
                                )}
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {course.level}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                    {results.courses.hasMore && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        +{results.courses.total - results.courses.results.length} more courses
                      </p>
                    )}
                  </div>
                )}

                {/* User Results */}
                {searchUsers && results.users.results.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-primary-600" />
                      <h3 className="text-sm font-semibold text-gray-900">
                        Users ({results.users.total})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {results.users.results.map((user, index) => {
                        const resultIndex =
                          results.courses.results.length + index;
                        return (
                          <button
                            key={user.id}
                            onClick={() => handleSelectResult(resultIndex)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              selectedIndex === resultIndex
                                ? 'bg-primary-50 border-primary-200'
                                : 'hover:bg-gray-50 border-transparent'
                            } border`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-700">
                                      {user.firstName[0]}
                                      {user.lastName[0]}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {user.firstName} {user.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-600 truncate">
                                    {user.email}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                                      {user.role}
                                    </span>
                                    {user.isVerified && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {results.users.hasMore && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        +{results.users.total - results.users.results.length} more users
                      </p>
                    )}
                  </div>
                )}

                {/* No Results */}
                {results.courses.results.length === 0 &&
                  results.users.results.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No results found
                      </h3>
                      <p className="text-sm text-gray-500">
                        Try searching with different keywords
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Footer with keyboard shortcuts */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                    ↑↓
                  </kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                    Enter
                  </kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                    Esc
                  </kbd>
                  Close
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSearchModal;
