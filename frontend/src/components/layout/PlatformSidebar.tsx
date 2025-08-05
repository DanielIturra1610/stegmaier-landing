import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore - Importar imágenes
import StegmaierLogoBlanco from '../../assets/images/Stegmaierlogoblanco.png';
import { useAuth } from '../../contexts/AuthContext';

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
  // Estado para controlar el tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      className="relative mb-1" 
      onMouseEnter={() => isCollapsed && setShowTooltip(true)} 
      onMouseLeave={() => setShowTooltip(false)}
      data-onboarding={`nav-item-${to.replace(/\//g, '-').replace(/^-/, '')}`}
    >
      <NavLink
        to={to}
        className={({ isActive }) => `
          flex items-center px-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
          relative overflow-hidden
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
      
      {/* Tooltip para modo colapsado */}
      <AnimatePresence>
        {isCollapsed && showTooltip && (
          <motion.div 
            className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md z-50 whitespace-nowrap"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {/* Triángulo indicador */}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-800"/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Sidebar para navegación en la plataforma de cursos
 */
const PlatformSidebar: React.FC<PlatformSidebarProps> = ({ isOpen, onClose }) => {
  // Estado para controlar el modo colapsado (solo iconos)
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Obtener datos del usuario para mostrar opciones basadas en rol
  const { user } = useAuth();
  
  // Estado para los elementos de navegación
  const baseNavItems = [
    {
      to: "/platform",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: "Dashboard",
      "data-onboarding": "dashboard-nav"
    },
    {
      to: "/platform/courses",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: "Mis Cursos",
      "data-onboarding": "courses-nav"
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
      to: "/platform/progress",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: "Mi Progreso"
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
    // Si es admin, mostrar navegación administrativa
    if (user?.role === 'admin') {
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
          to: "/platform/analytics",
          icon: (
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          label: "Analytics"
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
  }, [user?.role, baseNavItems]);

  // Animaciones para el sidebar
  const sidebarVariants = {
    expanded: { width: "16rem" }, // 64 en Tailwind
    collapsed: { width: "4.5rem" } // Aproximadamente para mostrar solo iconos
  };

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
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen overflow-hidden flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }} // Custom easing para movimiento natural
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
            onClick={() => setIsCollapsed(!isCollapsed)}
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
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          {navItems.map((item, index) => {
            // Si es un divisor
            if ('type' in item && item.type === 'divider') {
              return <div key={`divider-${index}`} className="border-t border-primary-700 my-2"></div>;
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
  
  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Manejar el clic en las opciones del menú
  const handleOptionClick = (action: string) => {
    setIsOpen(false);
    
    switch(action) {
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
      <div className="relative" ref={dropdownRef}>
        <motion.div 
          className={`flex items-center cursor-pointer p-2 rounded-lg hover:bg-primary-800/60 transition-all ${isOpen ? 'bg-primary-800/60' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Avatar de usuario o iniciales */}
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm shadow-md">
              {user.profileImage ? (
                <img src={user.profileImage} alt="Perfil" className="h-full w-full object-cover rounded-full" />
              ) : (
                getInitials()
              )}
            </div>
            {/* Indicador de estado (online) */}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-primary-900"></span>
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
                  <span className="text-xs text-gray-300 flex items-center gap-1">
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
              <motion.svg 
                className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Menú desplegable */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className={`absolute bottom-full mb-2 ${isCollapsed ? 'left-0' : 'left-0 right-0'} bg-primary-800 rounded-lg shadow-lg py-1 border border-primary-700 z-50`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-3 py-2 border-b border-primary-700">
                <div className="text-sm font-medium text-white">{user.full_name || `${user.firstName || ''} ${user.lastName || ''}`}</div>
                <div className="text-xs text-gray-300 truncate">{user.email}</div>
              </div>
              
              <button 
                className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-200 hover:bg-primary-700 transition-colors"
                onClick={() => handleOptionClick('profile')}
              >
                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Ver Perfil
              </button>
              
              <button 
                className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-200 hover:bg-primary-700 transition-colors"
                onClick={() => handleOptionClick('settings')}
              >
                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración
              </button>
              
              <div className="border-t border-primary-700 my-1"></div>
              
              <button 
                className="w-full text-left flex items-center px-3 py-2 text-sm text-red-400 hover:bg-primary-700 transition-colors"
                onClick={() => handleOptionClick('logout')}
              >
                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlatformSidebar;
