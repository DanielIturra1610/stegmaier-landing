/**
 * Command Palette - Búsqueda global rápida (Cmd+K / Ctrl+K)
 * Permite navegar rápidamente a cursos, lecciones, configuración, etc.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  User,
  Settings,
  Award,
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  HelpCircle,
  Search,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  badge?: string;
  group: string;
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Usar open controlado si se proporciona, de lo contrario usar estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Toggle del command palette con Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Cerrar el palette cuando se navega
  const handleAction = useCallback((action: () => void) => {
    setOpen(false);
    setSearch('');
    action();
  }, []);

  // Acciones principales de navegación
  const navigationActions: CommandAction[] = [
    {
      id: 'dashboard',
      label: 'Panel Principal',
      description: 'Ir al dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => navigate('/platform'),
      keywords: ['home', 'inicio', 'dashboard'],
      group: 'Navegación',
    },
    {
      id: 'courses',
      label: 'Explorar Cursos',
      description: 'Ver todos los cursos disponibles',
      icon: <BookOpen className="w-4 h-4" />,
      action: () => navigate('/platform/courses'),
      keywords: ['courses', 'cursos', 'explorar'],
      group: 'Navegación',
    },
    {
      id: 'my-courses',
      label: 'Mis Cursos',
      description: 'Ver mis cursos inscritos',
      icon: <GraduationCap className="w-4 h-4" />,
      action: () => navigate('/platform/my-courses'),
      keywords: ['mis cursos', 'enrolled', 'inscritos'],
      group: 'Navegación',
    },
    {
      id: 'progress',
      label: 'Mi Progreso',
      description: 'Ver estadísticas de aprendizaje',
      icon: <TrendingUp className="w-4 h-4" />,
      action: () => navigate('/platform/my-progress'),
      keywords: ['progreso', 'progress', 'stats', 'estadísticas'],
      group: 'Navegación',
    },
    {
      id: 'certificates',
      label: 'Certificados',
      description: 'Ver mis certificados',
      icon: <Award className="w-4 h-4" />,
      action: () => navigate('/platform/certificates'),
      keywords: ['certificados', 'certificates', 'awards'],
      group: 'Navegación',
    },
  ];

  // Acciones de configuración
  const settingsActions: CommandAction[] = [
    {
      id: 'profile',
      label: 'Mi Perfil',
      description: 'Ver y editar perfil',
      icon: <User className="w-4 h-4" />,
      action: () => navigate('/platform/profile'),
      keywords: ['perfil', 'profile', 'cuenta', 'account'],
      group: 'Configuración',
    },
    {
      id: 'settings',
      label: 'Configuración',
      description: 'Ajustes de la plataforma',
      icon: <Settings className="w-4 h-4" />,
      action: () => navigate('/platform/settings'),
      keywords: ['settings', 'configuración', 'ajustes'],
      group: 'Configuración',
    },
    {
      id: 'support',
      label: 'Soporte',
      description: 'Centro de ayuda',
      icon: <HelpCircle className="w-4 h-4" />,
      action: () => navigate('/platform/support'),
      keywords: ['help', 'ayuda', 'support', 'soporte'],
      group: 'Configuración',
    },
  ];

  // Acciones de administración (solo para admins)
  const adminActions: CommandAction[] = user?.role === 'admin' ? [
    {
      id: 'admin-dashboard',
      label: 'Dashboard Admin',
      description: 'Panel de administración',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => navigate('/platform/admin/dashboard'),
      keywords: ['admin', 'dashboard', 'administración'],
      badge: 'Admin',
      group: 'Administración',
    },
    {
      id: 'admin-users',
      label: 'Gestión de Usuarios',
      description: 'Administrar usuarios',
      icon: <Users className="w-4 h-4" />,
      action: () => navigate('/platform/users'),
      keywords: ['users', 'usuarios', 'admin'],
      badge: 'Admin',
      group: 'Administración',
    },
    {
      id: 'admin-courses',
      label: 'Gestión de Cursos',
      description: 'Administrar cursos',
      icon: <FileText className="w-4 h-4" />,
      action: () => navigate('/platform/courses'),
      keywords: ['courses', 'cursos', 'admin', 'gestión'],
      badge: 'Admin',
      group: 'Administración',
    },
  ] : [];

  // Combinar todas las acciones
  const allActions = [...navigationActions, ...settingsActions, ...adminActions];

  // Filtrar acciones por búsqueda
  const filteredActions = search
    ? allActions.filter((action) => {
        const searchLower = search.toLowerCase();
        return (
          action.label.toLowerCase().includes(searchLower) ||
          action.description?.toLowerCase().includes(searchLower) ||
          action.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower))
        );
      })
    : allActions;

  // Agrupar acciones
  const groupedActions = filteredActions.reduce((groups, action) => {
    const group = action.group;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(action);
    return groups;
  }, {} as Record<string, CommandAction[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar acciones, cursos, configuración..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-sm">No se encontraron resultados</p>
            <p className="text-xs mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        </CommandEmpty>

        {Object.entries(groupedActions).map(([groupName, actions], groupIndex) => (
          <React.Fragment key={groupName}>
            {groupIndex > 0 && <CommandSeparator />}
            <CommandGroup heading={groupName}>
              {actions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={`${action.label} ${action.description} ${action.keywords?.join(' ')}`}
                  onSelect={() => handleAction(action.action)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {action.icon}
                    <div className="flex flex-col">
                      <span className="font-medium">{action.label}</span>
                      {action.description && (
                        <span className="text-xs text-muted-foreground">
                          {action.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {action.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}

        {/* Footer con instrucciones */}
        {!search && (
          <>
            <CommandSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Navegar con ↑↓</span>
                <span>Seleccionar con Enter</span>
                <span>Cerrar con Esc</span>
              </div>
            </div>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
