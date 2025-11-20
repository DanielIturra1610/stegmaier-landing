import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  FileText,
  Award,
  Users,
  Settings,
  Search,
  AlertCircle,
  Inbox,
  Package,
  FileQuestion,
  LucideIcon
} from 'lucide-react';

/**
 * EmptyState Component
 *
 * Professional empty state component for when there's no data to display
 * Provides clear messaging and optional actions
 */
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}) => {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {/* Icon */}
        <div className="mb-4 p-3 bg-muted rounded-full">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {description}
        </p>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex items-center gap-3">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Predefined Empty State variants for common scenarios
 */

export const NoCoursesEmptyState: React.FC<{ onCreateCourse?: () => void }> = ({
  onCreateCourse
}) => (
  <EmptyState
    icon={BookOpen}
    title="No hay cursos disponibles"
    description="Aún no hay cursos en esta sección. Los cursos aparecerán aquí cuando estén disponibles."
    action={onCreateCourse ? {
      label: 'Crear curso',
      onClick: onCreateCourse
    } : undefined}
  />
);

export const NoEnrolledCourses: React.FC<{ onBrowseCourses?: () => void }> = ({
  onBrowseCourses
}) => (
  <EmptyState
    icon={BookOpen}
    title="No estás inscrito en ningún curso"
    description="Explora nuestro catálogo y comienza tu viaje de aprendizaje hoy. Encuentra el curso perfecto para ti."
    action={onBrowseCourses ? {
      label: 'Explorar cursos',
      onClick: onBrowseCourses
    } : undefined}
  />
);

export const NoSearchResults: React.FC<{ onClearSearch?: () => void }> = ({
  onClearSearch
}) => (
  <EmptyState
    icon={Search}
    title="No se encontraron resultados"
    description="No pudimos encontrar lo que buscas. Intenta con otros términos de búsqueda o ajusta los filtros."
    action={onClearSearch ? {
      label: 'Limpiar búsqueda',
      onClick: onClearSearch,
      variant: 'outline'
    } : undefined}
  />
);

export const NoAssignments: React.FC<{ onCreateAssignment?: () => void }> = ({
  onCreateAssignment
}) => (
  <EmptyState
    icon={FileText}
    title="No hay tareas disponibles"
    description="Aún no hay tareas para este curso. Las tareas aparecerán aquí cuando sean asignadas."
    action={onCreateAssignment ? {
      label: 'Crear tarea',
      onClick: onCreateAssignment
    } : undefined}
  />
);

export const NoCertificates: React.FC<{ onBrowseCourses?: () => void }> = ({
  onBrowseCourses
}) => (
  <EmptyState
    icon={Award}
    title="No tienes certificados aún"
    description="Completa tus cursos para obtener certificados profesionales que demuestren tus habilidades."
    action={onBrowseCourses ? {
      label: 'Ver mis cursos',
      onClick: onBrowseCourses
    } : undefined}
  />
);

export const NoStudents: React.FC<{ onInviteStudents?: () => void }> = ({
  onInviteStudents
}) => (
  <EmptyState
    icon={Users}
    title="No hay estudiantes inscritos"
    description="Aún no hay estudiantes en este curso. Los estudiantes aparecerán aquí cuando se inscriban."
    action={onInviteStudents ? {
      label: 'Invitar estudiantes',
      onClick: onInviteStudents
    } : undefined}
  />
);

export const NoNotifications: React.FC = () => (
  <EmptyState
    icon={Inbox}
    title="No tienes notificaciones"
    description="Estás al día! Aquí aparecerán las notificaciones importantes sobre tus cursos y actividades."
  />
);

export const ErrorState: React.FC<{ onRetry?: () => void; error?: string }> = ({
  onRetry,
  error = 'Ocurrió un error al cargar los datos.'
}) => (
  <EmptyState
    icon={AlertCircle}
    title="Algo salió mal"
    description={error}
    action={onRetry ? {
      label: 'Reintentar',
      onClick: onRetry
    } : undefined}
  />
);

export const NoData: React.FC<{ message?: string }> = ({
  message = 'No hay datos para mostrar en este momento.'
}) => (
  <EmptyState
    icon={Package}
    title="Sin datos"
    description={message}
  />
);

export const PageNotFound: React.FC<{ onGoHome?: () => void }> = ({
  onGoHome
}) => (
  <EmptyState
    icon={FileQuestion}
    title="Página no encontrada"
    description="La página que buscas no existe o ha sido movida. Verifica la URL o regresa al inicio."
    action={onGoHome ? {
      label: 'Ir al inicio',
      onClick: onGoHome
    } : undefined}
  />
);

export default EmptyState;
