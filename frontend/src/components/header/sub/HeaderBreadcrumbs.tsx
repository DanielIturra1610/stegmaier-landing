/**
 * Componente de breadcrumbs accesible para el header
 * Implementa WCAG AA y navegación semántica
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Crumb } from '../types';

interface HeaderBreadcrumbsProps {
  breadcrumbs: Crumb[];
  className?: string;
}

export const HeaderBreadcrumbs: React.FC<HeaderBreadcrumbsProps> = ({
  breadcrumbs,
  className = ''
}) => {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const label = typeof crumb.label === 'function' ? crumb.label(crumb) : crumb.label;

          return (
            <React.Fragment key={`breadcrumb-${index}`}>
              <BreadcrumbItem>
                {crumb.to && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to} aria-label={`Navegar a ${label}`}>
                      {label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default HeaderBreadcrumbs;
