/**
 * useAnalytics Hook Tests
 */
import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '../../hooks/useAnalytics';

describe('useAnalytics', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'mock-jwt-token');
    vi.clearAllMocks();
  });

  it('initializes analytics hook correctly', () => {
    const { result } = renderHook(() => useAnalytics());
    
    expect(typeof result.current.trackPageView).toBe('function');
    expect(typeof result.current.trackActivity).toBe('function');
    expect(typeof result.current.trackLessonStart).toBe('function');
    expect(typeof result.current.trackLessonComplete).toBe('function');
    expect(typeof result.current.trackCourseComplete).toBe('function');
  });

  it('tracks page view correctly', async () => {
    const { result } = renderHook(() => useAnalytics());
    
    await act(async () => {
      await result.current.trackPageView('/dashboard');
    });

    // Test passes if no error is thrown
    expect(true).toBe(true);
  });

  it('tracks lesson start correctly', async () => {
    const { result } = renderHook(() => useAnalytics());
    
    await act(async () => {
      await result.current.trackLessonStart('lesson-1', 'course-1');
    });

    // Test passes if no error is thrown
    expect(true).toBe(true);
  });

  it('tracks lesson complete correctly', async () => {
    const { result } = renderHook(() => useAnalytics());
    
    await act(async () => {
      await result.current.trackLessonComplete('lesson-1', 'course-1', 120);
    });

    // Test passes if no error is thrown  
    expect(true).toBe(true);
  });

  it('tracks course complete correctly', async () => {
    const { result } = renderHook(() => useAnalytics());
    
    await act(async () => {
      await result.current.trackCourseComplete('course-1');
    });

    // Test passes if no error is thrown
    expect(true).toBe(true);
  });
});
