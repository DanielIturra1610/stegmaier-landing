import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

/**
 * Componente para proteger rutas que requieren autenticación
 * y opcionalmente verificación de email
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireVerified = true 
}) => {
  const { isAuthenticated, isVerified, isLoading } = useAuth();
  const location = useLocation();

  // Mostrar spinner mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirigir a la página principal si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // Si requiere verificación y no está verificado, redirigir a página de recordatorio
  if (requireVerified && !isVerified) {
    return <Navigate to="/verify-reminder" replace />;
  }

  // Si pasa todas las verificaciones, mostrar los hijos (contenido protegido)
  return <>{children}</>;
};

export default ProtectedRoute;
