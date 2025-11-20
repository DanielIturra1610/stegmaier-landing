/**
 * Componente para mostrar estados de error
 * Refactored with shadcn/ui components
 */
import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Home, XCircle, WifiOff, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        title: title || 'Recurso no encontrado',
        description: description || 'El recurso que buscas no existe o ha sido eliminado.',
        icon: XCircle,
        iconColor: 'text-muted-foreground',
        variant: '404' as const
      };
    }

    if (error.toLowerCase().includes('403') || error.toLowerCase().includes('permiso')) {
      return {
        title: title || 'Acceso restringido',
        description: description || 'No tienes permisos para acceder a este recurso.',
        icon: ShieldAlert,
        iconColor: 'text-orange-500',
        variant: '403' as const
      };
    }

    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('conexión')) {
      return {
        title: title || 'Error de conexión',
        description: description || 'Verifica tu conexión a internet e inténtalo de nuevo.',
        icon: WifiOff,
        iconColor: 'text-destructive',
        variant: 'network' as const
      };
    }

    return {
      title: title || 'Error inesperado',
      description: description || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      variant: 'generic' as const
    };
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  return (
    <Card className="max-w-2xl mx-auto border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
        {/* Icono */}
        <div className={`p-4 bg-muted rounded-full ${errorInfo.iconColor}`}>
          <Icon className="w-12 h-12" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {errorInfo.title}
          </h2>

          {/* Descripción */}
          <p className="text-muted-foreground">
            {errorInfo.description}
          </p>
        </div>

        {/* Mensaje de error técnico */}
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription className="text-sm font-mono">
            {error}
          </AlertDescription>
        </Alert>

        {/* Botones de acción */}
        <div className="w-full max-w-md space-y-3">
          {/* Botón de reintentar */}
          {onRetry && (
            <Button
              onClick={onRetry}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          )}

          <div className="flex gap-3">
            {/* Botón de volver */}
            {showBackButton && (
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            )}

            {/* Botón de inicio */}
            {showHomeButton && (
              <Button
                onClick={() => navigate('/platform')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
            )}
          </div>
        </div>

        {/* Enlaces adicionales para errores específicos */}
        {errorInfo.variant === '404' && (
          <Alert className="max-w-md">
            <AlertDescription>
              <p className="text-sm font-semibold mb-2">¿No encuentras lo que buscas?</p>
              <Button
                onClick={() => navigate('/platform/courses')}
                variant="link"
                className="p-0 h-auto text-primary"
              >
                Ver todos los cursos disponibles
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {errorInfo.variant === '403' && (
          <Alert className="max-w-md">
            <AlertDescription className="space-y-2">
              <p className="text-sm font-semibold">¿Necesitas acceso?</p>
              <div className="flex flex-col gap-1">
                <Button
                  onClick={() => navigate('/login')}
                  variant="link"
                  className="p-0 h-auto text-primary justify-start"
                >
                  Iniciar sesión
                </Button>
                <Button
                  onClick={() => navigate('/platform/courses')}
                  variant="link"
                  className="p-0 h-auto text-primary justify-start"
                >
                  Ver cursos públicos
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorState;
