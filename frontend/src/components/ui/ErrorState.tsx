/**
 * Componente para mostrar estados de error
 */
import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  title?: string;
  description?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  showHomeButton = true,
  showBackButton = true,
  title,
  description
}) => {
  const navigate = useNavigate();

  // Determinar título y descripción basados en el tipo de error
  const getErrorInfo = () => {
    if (error.toLowerCase().includes('404') || error.toLowerCase().includes('no encontrado')) {
      return {
        title: title || 'Curso no encontrado',
        description: description || 'El curso que buscas no existe o ha sido eliminado.',
        icon: <AlertTriangle className="w-16 h-16 text-gray-400" />
      };
    }

    if (error.toLowerCase().includes('403') || error.toLowerCase().includes('permiso')) {
      return {
        title: title || 'Acceso restringido',
        description: description || 'No tienes permisos para ver este curso.',
        icon: <AlertTriangle className="w-16 h-16 text-orange-400" />
      };
    }

    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('conexión')) {
      return {
        title: title || 'Error de conexión',
        description: description || 'Verifica tu conexión a internet e inténtalo de nuevo.',
        icon: <AlertTriangle className="w-16 h-16 text-red-400" />
      };
    }

    return {
      title: title || 'Error inesperado',
      description: description || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
      icon: <AlertTriangle className="w-16 h-16 text-red-400" />
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="max-w-md mx-auto text-center py-12 px-4">
      {/* Icono */}
      <div className="flex justify-center mb-6">
        {errorInfo.icon}
      </div>

      {/* Título */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {errorInfo.title}
      </h2>

      {/* Descripción */}
      <p className="text-gray-600 mb-2">
        {errorInfo.description}
      </p>

      {/* Mensaje de error técnico */}
      <p className="text-sm text-gray-400 mb-8">
        Error: {error}
      </p>

      {/* Botones de acción */}
      <div className="space-y-3">
        {/* Botón de reintentar */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reintentar
          </button>
        )}

        <div className="flex space-x-3">
          {/* Botón de volver */}
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </button>
          )}

          {/* Botón de inicio */}
          {showHomeButton && (
            <button
              onClick={() => navigate('/platform')}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <Home className="w-5 h-5 mr-2" />
              Inicio
            </button>
          )}
        </div>
      </div>

      {/* Enlaces adicionales para errores específicos */}
      {error.toLowerCase().includes('404') && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">¿No encuentras lo que buscas?</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/platform/courses')}
              className="block w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos los cursos disponibles
            </button>
          </div>
        </div>
      )}

      {error.toLowerCase().includes('403') && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">¿Necesitas acceso?</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="block w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate('/platform/courses')}
              className="block w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver cursos públicos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
