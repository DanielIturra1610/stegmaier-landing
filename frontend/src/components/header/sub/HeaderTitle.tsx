/**
 * Componente de título para el header contextual
 * Soporta títulos dinámicos y estáticos
 */
import React from 'react';

interface HeaderTitleProps {
  title: string | ((data: any) => string);
  data?: any;
  subtitle?: string;
  className?: string;
}

export const HeaderTitle: React.FC<HeaderTitleProps> = ({ 
  title, 
  data, 
  subtitle,
  className = '' 
}) => {
  const resolvedTitle = typeof title === 'function' ? title(data) : title;

  return (
    <div className={`${className}`}>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {resolvedTitle}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-600">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default HeaderTitle;
