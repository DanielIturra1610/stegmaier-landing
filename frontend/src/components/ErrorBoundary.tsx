/**
 * Error Boundary Component - Critical production fix
 * Prevents white screen crashes by catching React component errors
 * ✅ SOLUCIÓN: Implementación robusta con logging y recovery
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('🚨 [ErrorBoundary] Caught error:', error);
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('🚨 [ErrorBoundary] Component Error Details');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error boundary props:', this.props);
    console.groupEnd();

    // Store detailed error info
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track error in analytics if available
    this.trackError(error, errorInfo);
  }

  private trackError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Attempt to track error without causing additional crashes
      if (window && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: `${error.message} | ${errorInfo.componentStack}`,
          fatal: false
        });
      }
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  };

  private handleRetry = () => {
    console.log('🔄 [ErrorBoundary] Attempting to recover from error');
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    // Add a small delay to prevent immediate re-error
    this.retryTimeoutId = setTimeout(() => {
      console.log('✅ [ErrorBoundary] Retry completed');
    }, 100);
  };

  private handleReload = () => {
    console.log('🔄 [ErrorBoundary] Reloading application');
    window.location.reload();
  };

  private handleHome = () => {
    console.log('🏠 [ErrorBoundary] Navigating to home');
    window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      console.error('🚨 [ErrorBoundary] Rendering error fallback UI');

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, retryCount } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl border border-red-200 overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 text-white p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-8 h-8 text-red-200" />
                <div>
                  <h1 className="text-2xl font-bold">¡Ups! Algo salió mal</h1>
                  <p className="text-red-100 mt-1">
                    Se produjo un error inesperado en la aplicación
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-400">
                <h3 className="font-semibold text-gray-900 mb-2">Error técnico:</h3>
                <p className="text-gray-700 font-mono text-sm break-words">
                  {error?.message || 'Error desconocido'}
                </p>
                {retryCount > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Intentos de recuperación: {retryCount}
                  </p>
                )}
              </div>

              {/* Development Details */}
              {isDevelopment && errorInfo && (
                <details className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs">
                  <summary className="cursor-pointer text-white font-bold mb-2">
                    🐛 Detalles técnicos (desarrollo)
                  </summary>
                  <div className="space-y-2 mt-2">
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{error?.stack}</pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
                    </div>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1"
                  disabled={retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4" />
                  {retryCount >= 3 ? 'Máx. intentos alcanzados' : 'Intentar de nuevo'}
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recargar página
                </button>
                
                <button
                  onClick={this.handleHome}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-1"
                >
                  <Home className="w-4 h-4" />
                  Ir al inicio
                </button>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <h4 className="font-semibold text-blue-900 mb-2">¿Qué puedes hacer?</h4>
                <ul className="text-blue-800 space-y-1">
                  <li>• Intenta recargar la página</li>
                  <li>• Verifica tu conexión a internet</li>
                  <li>• Si el problema persiste, contacta al soporte técnico</li>
                  <li>• Incluye el mensaje de error técnico mostrado arriba</li>
                </ul>
              </div>

              {/* Contact Support */}
              <div className="text-center text-gray-500 text-sm">
                <p>
                  ¿Necesitas ayuda? Contacta a{' '}
                  <a 
                    href="mailto:soporte@stegmaier.com" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    soporte técnico
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('🚨 [useErrorHandler] Manual error reported:', error);
    console.error('🚨 [useErrorHandler] Additional info:', errorInfo);
    
    // You could integrate with error reporting service here
    throw error; // Re-throw to trigger Error Boundary
  };

  return { handleError };
};

// HOC version for wrapping components
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
};
