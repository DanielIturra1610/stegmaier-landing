/**
 * Test Utilities - Helpers comunes para testing
 */
import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Providers básicos para testing simplificados
const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render básico
export const render = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return rtlRender(ui, { wrapper: TestProviders, ...options });
};

// Versiones simplificadas para compatibilidad
export const renderWithAuth = render;
export const renderWithAdminAuth = render;
export const renderUnauthenticated = render;

// Helper para simular delay en funciones async
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para mockear localStorage
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

// Helper para crear datos de test
export const createTestUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student' as const,
  ...overrides
});

export const createTestCourse = (overrides = {}) => ({
  id: '1',
  title: 'Test Course',
  description: 'Test course description',
  instructor_name: 'John Doe',
  instructor_id: '1',
  level: 'beginner' as const,
  category: 'occupational_safety' as const,
  is_published: true,
  lessons_count: 5,
  enrollments_count: 10,
  thumbnail_url: '/test-thumbnail.jpg',
  price: 99.99,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createTestLesson = (overrides = {}) => ({
  id: '1',
  title: 'Test Lesson',
  description: 'Test lesson description',
  content: 'Test lesson content',
  order: 1,
  duration: 900, // 15 minutes
  is_free: false,
  course_id: '1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});
