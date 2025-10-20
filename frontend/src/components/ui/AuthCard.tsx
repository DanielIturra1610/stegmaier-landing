import React, { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  className?: string;
}

/**
 * Componente contenedor para formularios de autenticación
 */
const AuthCard: React.FC<AuthCardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
}) => {
  return (
    <div className={`
      w-full max-w-md mx-auto
      bg-white rounded-xl shadow-lg overflow-hidden
      border border-gray-100
      ${className}
    `}>
      <div className="py-8 px-6 sm:p-10">
        <div className="text-center mb-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/images/Stegmaierlogo.png" 
              alt="Stegmaier Logo" 
              className="h-12"
            />
          </div>
          
          {/* Título y subtítulo */}
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
        
        {/* Contenido principal */}
        <div>{children}</div>
      </div>
      
      {/* Pie de tarjeta opcional */}
      {footer && (
        <div className="py-4 px-6 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default AuthCard;
