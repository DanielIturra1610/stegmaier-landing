/**
 * Configuración de React Query para cache compartido
 * Implementa principios de desarrollo responsivo, mantenible y escalable
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por defecto
      staleTime: 5 * 60 * 1000,
      // Mantener en cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry en caso de error
      retry: 1,
      // Refetch en focus del window
      refetchOnWindowFocus: false,
      // Refetch en reconexión
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations una vez
      retry: 1,
    },
  },
});

// Query Keys para consistencia
export const queryKeys = {
  users: {
    me: ['users', 'me'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    userStats: () => [...queryKeys.analytics.all, 'user', 'stats'] as const,
    userStatsByPeriod: (period: string) => [...queryKeys.analytics.userStats(), period] as const,
  },
  progress: {
    all: ['progress'] as const,
    summary: () => [...queryKeys.progress.all, 'summary'] as const,
    summaryByCourse: (courseId: string) => [...queryKeys.progress.summary(), courseId] as const,
  },
  courses: {
    all: ['courses'] as const,
    available: () => [...queryKeys.courses.all, 'available'] as const,
    enrolled: () => [...queryKeys.courses.all, 'enrolled'] as const,
    detail: (id: string) => [...queryKeys.courses.all, 'detail', id] as const,
  },
} as const;
