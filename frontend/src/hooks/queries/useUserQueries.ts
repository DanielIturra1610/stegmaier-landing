/**
 * React Query hooks para users
 * Cache compartido para información del usuario
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { queryKeys } from '../../lib/queryClient';

/**
 * Hook para obtener información del usuario actual
 * Integrado con AuthContext para consistencia
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: async () => {
      if (!user) throw new Error('No authenticated user');
      return user;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutos - info de usuario cambia poco
    gcTime: 30 * 60 * 1000, // 30 minutos
    initialData: user || undefined,
  });
}
