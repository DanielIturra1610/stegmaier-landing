import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore - Importar imágenes
import StegmaierLogoBlanco from '../../assets/images/Stegmaierlogoblanco.png';
import { useAuth } from '../../contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BookOpen,
  GraduationCap,
  User,
  Settings,
  Award,
  HelpCircle,
  LayoutDashboard,
  Users,
  LogOut,
} from 'lucide-react';

interface PlatformSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  index: number;
  isCollapsed: boolean;
}

type NavItem = {
  to: string;
  icon: React.ReactNode;
  label: string;
} | {
  type: 'divider';
}

/**
 * Elemento de navegación para el sidebar con efectos mejorados
 */
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, index, isCollapsed }) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative mb-1"
            data-onboarding={`nav-item-${to.replace(/\//g, '-').replace(/^-/, '')}`}
          >
            <NavLink
              to={to}
              className={({ isActive }) => `
                flex items-center px-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                relative
                ${isActive ?
                  'bg-primary-700/90 text-white shadow-lg shadow-primary-500/20 border-l-4 border-primary-400' :
                  'text-gray-300 hover:bg-primary-600/50 hover:text-white hover:shadow-md'}
              `}
              end={to === '/platform'} // Solo para la ruta principal
            >
              {/* Fondo hover sin difuminado */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"></div>

              {/* Icono con animación */}
              <motion.div
                className={`flex items-center justify-center ${isCollapsed ? 'w-full mx-auto' : 'mr-3'}`}
                style={isCollapsed ? { minWidth: '100%' } : undefined}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {icon}
              </motion.div>

              {/* Texto que se oculta en modo colapsado */}
              <motion.span
                className="flex-1 whitespace-nowrap"
                animate={{
                  opacity: isCollapsed ? 0 : 1,
                  width: isCollapsed ? 0 : 'auto',
                  marginLeft: isCollapsed ? 0 : undefined
                }}
                transition={{ duration: 0.2 }}
              >
                {label}
              </motion.span>
            </NavLink>
          </div>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="bg-gray-800 text-white border-gray-700">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Sidebar para navegación en la plataforma de cursos
 */
const PlatformSidebar: React.FC<PlatformSidebarProps> = ({ isOpen, onClose }) => {
  // Estado para controlar el modo colapsado (solo iconos)
  // Usar localStorage para persistir la preferencia del usuario
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  
  // Obtener datos del usuario para mostrar opciones basadas en rol
  const { user } = useAuth();
  
  // Estado para los elementos de navegación
  const baseNavItems = [
    {
      to: "/platform/my-progress",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      label: "Mi Progreso",
      "data-onboarding": "progress-dashboard-nav"
    },
    {
      to: "/platform/courses",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: "Explorar Cursos",
      "data-onboarding": "courses-nav"
    },
    {
      to: "/platform/my-courses",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      label: "Mis Cursos",
      "data-onboarding": "my-courses-nav"
    },
    { type: 'divider' },
    {
      to: "/platform/profile",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: "Mi Perfil"
    },
    {
      to: "/platform/settings",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Configuración"
    },
    { type: 'divider' },
    {
      to: "/platform/certificates",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: "Certificados",
      "data-onboarding": "certificates-nav"
    },
    {
      to: "/platform/support",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Soporte"
    }
  ];
  
  // Construir elementos de navegación dinámicamente basado en el rol
  const navItems = React.useMemo(() => {
    // Si es admin, instructor o superadmin, mostrar navegación administrativa
    const isAdminRole = user?.role === 'admin' || user?.role === 'instructor' || user?.role === 'superadmin';
    if (isAdminRole) {
      return [
        {
          to: "/platform/courses",
          icon: (
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
          label: "Gestión de Cursos",
          "data-onboarding": "admin-courses-nav"
        },
        {
          to: "/platform/users",
          icon: (
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          label: "Gestión de Usuarios",
          "data-onboarding": "admin-users-nav"
        },
        { type: 'divider' },
        {
          to: "/platform/admin/dashboard",
          icon: (
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          label: "Dashboard Admin",
          "data-onboarding": "admin-dashboard-nav"
        },
        {
          to: "/platform/settings",
          icon: (
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          label: "Configuración Sistema"
        },
        { type: 'divider' },
        {
          to: "/platform/profile",
          icon: (
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          label: "Mi Perfil Admin"
        }
      ];
    }
    
    // Si no es admin, mostrar navegación normal de estudiante
    return baseNavItems;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  return (
    <>
      {/* Overlay para cerrar el sidebar en dispositivos móviles */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 lg:hidden"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar principal con animación de ancho */}
      <motion.div
        className={`
          fixed inset-y-0 left-0 z-30 bg-primary-800 transform transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:translate-x-0 lg:h-screen flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        animate={{
          width: isCollapsed ? '4.5rem' : '18rem',
          minWidth: isCollapsed ? '4.5rem' : '18rem'
        }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        initial={false}
        data-onboarding="platform-sidebar"
      >
        {/* Logo y cabecera con botón de colapso */}
        <div className="flex items-center justify-between px-4 py-4 bg-primary-900 gap-1">
          <div className="flex items-center overflow-hidden">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.img 
                  src={StegmaierLogoBlanco} 
                  alt="Stegmaier Consulting Logo" 
                  className="h-10 object-contain"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "12rem" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  data-onboarding="platform-logo"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Botón para colapsar/expandir en desktop */}
          <motion.button
            onClick={() => {
              const newValue = !isCollapsed;
              setIsCollapsed(newValue);
              localStorage.setItem('sidebar-collapsed', String(newValue));
            }}
            className="hidden lg:flex items-center justify-center text-gray-300 hover:text-white p-1 rounded-md hover:bg-primary-700 transition-colors"
            style={{ width: "40px", height: "40px" }} /* Tamaño fijo para mejor centrado */
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            whileHover={{ scale: 0.95 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg 
              className="h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </motion.button>

          {/* Botón para cerrar en móviles */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-300 hover:text-white"
            aria-label="Cerrar menú lateral"
          >
            <svg 
              className="h-6 w-6" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Enlaces de navegación con animaciones escalonadas */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav>
            {navItems.map((item, index) => {
              // Si es un divisor
              if ('type' in item && item.type === 'divider') {
                return <Separator key={`divider-${index}`} className="bg-primary-700 my-2" />;
              }

              // Si es un elemento de navegación normal
              if ('to' in item && 'label' in item && 'icon' in item) {
                return (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.05, // Delay escalonado
                      duration: 0.3
                    }}
                  >
                    <NavItem
                      to={item.to as string}
                      icon={item.icon}
                      label={item.label as string}
                      index={index}
                      isCollapsed={isCollapsed}
                    />
                  </motion.div>
                );
              }

              return null;
            })}
          </nav>
        </ScrollArea>
        
        {/* Sección de perfil de usuario en la parte inferior */}
        <UserProfileSection isCollapsed={isCollapsed} />
      </motion.div>
    </>
  );
};

interface UserProfileSectionProps {
  isCollapsed: boolean;
}

/**
 * Componente para la sección de perfil de usuario en la parte inferior del sidebar
 */
const UserProfileSection: React.FC<UserProfileSectionProps> = ({ isCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Generar iniciales para el avatar si no hay imagen de perfil
  const getInitials = () => {
    if (!user) return 'U';
    if (user.full_name) {
      const nameParts = user.full_name.split(' ');
      return `${nameParts[0][0]}${nameParts.length > 1 ? nameParts[1][0] : ''}`;
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.email[0].toUpperCase();
  };

  // Manejar el clic en las opciones del menú
  const handleOptionClick = (action: string) => {
    switch (action) {
      case 'profile':
        navigate('/platform/profile');
        break;
      case 'settings':
        navigate('/platform/settings');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  if (!user) return null;

  return (
    <div className="mt-auto border-t border-primary-700 bg-primary-900/80 px-3 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-primary-800/60 transition-all"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Avatar de usuario con badge de estado */}
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.profileImage} alt="Perfil" />
                <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-600 text-white font-medium text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {/* Indicador de estado (online) */}
              <Badge
                variant="secondary"
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 p-0 bg-green-500 hover:bg-green-500 border-2 border-primary-900 rounded-full"
              />
            </div>

            {/* Nombre de usuario - solo visible cuando no está colapsado */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  className="ml-3 flex-1"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white truncate">
                      {user.full_name || `${user.firstName || ''} ${user.lastName || ''}`}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      Conectado
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flecha para indicar desplegable - solo visible cuando no está colapsado */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={isCollapsed ? 'right' : 'top'}
          align="start"
          className="w-56 bg-primary-800 border-primary-700 text-white"
        >
          <DropdownMenuLabel className="border-b border-primary-700">
            <div className="text-sm font-medium text-white">
              {user.full_name || `${user.firstName || ''} ${user.lastName || ''}`}
            </div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => handleOptionClick('profile')}
            className="text-gray-200 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer"
          >
            <User className="w-4 h-4 mr-3" />
            Ver Perfil
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleOptionClick('settings')}
            className="text-gray-200 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-3" />
            Configuración
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-primary-700" />

          <DropdownMenuItem
            onClick={() => handleOptionClick('logout')}
            className="text-red-400 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PlatformSidebar;
