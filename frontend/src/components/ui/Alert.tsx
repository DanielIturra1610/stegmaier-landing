import React from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Componente de alerta para mostrar mensajes de estado
 */
const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
}) => {
  // Configuración de estilos según tipo
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      icon: 'text-green-400',
      title: 'text-green-800',
      text: 'text-green-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      icon: 'text-red-400',
      title: 'text-red-800',
      text: 'text-red-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      icon: 'text-yellow-400',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
  };

  const currentStyle = styles[type];

  // Iconos según tipo de alerta
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`rounded-lg p-4 mb-4 border ${currentStyle.bg} ${currentStyle.border} ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${currentStyle.icon}`}>
          {icons[type]}
        </div>
        <div className="ml-3 w-full">
          <div className="flex items-center justify-between">
            {title && (
              <p className={`text-sm font-medium ${currentStyle.title}`}>{title}</p>
            )}
            {onClose && (
              <button
                type="button"
                className={`${currentStyle.text} hover:opacity-75 focus:outline-none`}
                onClick={onClose}
                aria-label="Cerrar"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
          <p className={`text-sm ${currentStyle.text}`}>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Alert;
