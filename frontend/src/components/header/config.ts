/**
 * Configuración de headers por ruta
 * POC inicial para /platform/my-progress
 */
import { HeaderConfig } from './types';

export const headerRouteConfig: Record<string, HeaderConfig> = {
  // === PLATFORM PAGES ===
  '/platform': {
    variant: 'analytics',
    title: 'Mi Progreso y Estadísticas',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Mi Progreso' }
    ],
    tabs: [
      { label: 'Resumen', to: '#resumen', ariaControls: 'resumen-panel' },
      { label: 'Actividad', to: '#actividad', ariaControls: 'actividad-panel' },
      { label: 'Logros', to: '#logros', ariaControls: 'logros-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showNotifications: true,
    showUserMenu: true
  },

  // === ANALYTICS PAGES ===
  '/platform/my-progress': {
    variant: 'analytics',
    title: 'Mi Progreso y Estadísticas',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Mi Progreso' }
    ],
    tabs: [
      { label: 'Resumen', to: '#resumen', ariaControls: 'resumen-panel' },
      { label: 'Actividad', to: '#actividad', ariaControls: 'actividad-panel' },
      { label: 'Logros', to: '#logros', ariaControls: 'logros-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showNotifications: true,
    showUserMenu: true
  },

  // === COURSE PAGES ===
  '/platform/courses': {
    variant: 'standard',
    title: 'Explorar Cursos',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Cursos' }
    ],
    tabs: [
      { label: 'Todos', to: '#todos', ariaControls: 'todos-panel' },
      { label: 'Categorías', to: '#categorias', ariaControls: 'categorias-panel' },
      { label: 'Populares', to: '#populares', ariaControls: 'populares-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showSearch: true,
    showNotifications: true
  },
  
  '/platform/my-courses': {
    variant: 'standard', 
    title: 'Mis Cursos',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Mis Cursos' }
    ],
    tabs: [
      { label: 'Activos', to: '#activos', ariaControls: 'activos-panel' },
      { label: 'Completados', to: '#completados', ariaControls: 'completados-panel' },
      { label: 'Favoritos', to: '#favoritos', ariaControls: 'favoritos-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showNotifications: true
  },

  // === COURSE DETAIL ===
  '/platform/courses/:courseId': {
    variant: 'courseDetail',
    title: (data) => data?.courseTitle || 'Detalles del Curso',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Cursos', to: '/platform/courses' },
      { label: 'Detalles del Curso' }
    ],
    tabs: [
      { label: 'Descripción', to: '#descripcion', ariaControls: 'descripcion-panel' },
      { label: 'Lecciones', to: '#lecciones', ariaControls: 'lecciones-panel' },
      { label: 'Reseñas', to: '#reseñas', ariaControls: 'reseñas-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showNotifications: true
  },

  // === COURSE VIEWER ===
  '/platform/courses/:courseId/lesson/:lessonId': {
    variant: 'courseViewer',
    title: (data) => data?.lessonTitle || 'Visualizando Lección',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Mis Cursos', to: '/platform/my-courses' },
      { label: (data) => data?.courseTitle || 'Curso' },
      { label: 'Lección' }
    ],
    theme: 'dark', // Tema oscuro para mejor concentración
    requires: ['auth', 'enrolled'],
    showNotifications: false // Sin distracciones durante el aprendizaje
  },

  // === ADMIN PAGES ===
  '/platform/admin': {
    variant: 'admin',
    title: 'Panel de Administración',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Administración' }
    ],
    tabs: [
      { label: 'Dashboard', to: '#dashboard', ariaControls: 'dashboard-panel' },
      { label: 'Usuarios', to: '#usuarios', ariaControls: 'usuarios-panel' },
      { label: 'Cursos', to: '#cursos', ariaControls: 'cursos-panel' },
      { label: 'Analytics', to: '#analytics', ariaControls: 'analytics-panel' }
    ],
    theme: 'brand',
    requires: ['auth', 'admin'],
    showNotifications: true,
    showUserMenu: true
  },

  '/platform/admin/courses': {
    variant: 'admin',
    title: 'Gestión de Cursos',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Administración', to: '/platform/admin' },
      { label: 'Cursos' }
    ],
    tabs: [
      { label: 'Lista', to: '#lista', ariaControls: 'lista-panel' },
      { label: 'Crear', to: '#crear', ariaControls: 'crear-panel' },
      { label: 'Categorías', to: '#categorias', ariaControls: 'categorias-panel' }
    ],
    theme: 'brand',
    requires: ['auth', 'admin'],
    showNotifications: true
  },

  '/platform/admin/users': {
    variant: 'admin',
    title: 'Gestión de Usuarios',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Administración', to: '/platform/admin' },
      { label: 'Usuarios' }
    ],
    tabs: [
      { label: 'Todos', to: '#todos', ariaControls: 'todos-panel' },
      { label: 'Instructores', to: '#instructores', ariaControls: 'instructores-panel' },
      { label: 'Estudiantes', to: '#estudiantes', ariaControls: 'estudiantes-panel' }
    ],
    theme: 'brand',
    requires: ['auth', 'admin'],
    showNotifications: true
  },

  '/platform/admin/analytics': {
    variant: 'admin',
    title: 'Analytics Administrativos',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Administración', to: '/platform/admin' },
      { label: 'Analytics' }
    ],
    tabs: [
      { label: 'General', to: '#general', ariaControls: 'general-panel' },
      { label: 'Usuarios', to: '#usuarios', ariaControls: 'usuarios-panel' },
      { label: 'Cursos', to: '#cursos', ariaControls: 'cursos-panel' },
      { label: 'Ingresos', to: '#ingresos', ariaControls: 'ingresos-panel' }
    ],
    theme: 'brand',
    requires: ['auth', 'admin'],
    showNotifications: true
  },

  // === PROFILE & SETTINGS ===
  '/platform/profile': {
    variant: 'standard',
    title: 'Mi Perfil',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Perfil' }
    ],
    tabs: [
      { label: 'Información', to: '#informacion', ariaControls: 'informacion-panel' },
      { label: 'Preferencias', to: '#preferencias', ariaControls: 'preferencias-panel' },
      { label: 'Seguridad', to: '#seguridad', ariaControls: 'seguridad-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showNotifications: true
  },

  '/platform/settings': {
    variant: 'standard',
    title: 'Configuración',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Configuración' }
    ],
    tabs: [
      { label: 'General', to: '#general', ariaControls: 'general-panel' },
      { label: 'Notificaciones', to: '#notificaciones', ariaControls: 'notificaciones-panel' },
      { label: 'Privacidad', to: '#privacidad', ariaControls: 'privacidad-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showNotifications: true
  },

  // === SUPPORT ===
  '/platform/support': {
    variant: 'standard',
    title: 'Centro de Ayuda',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Soporte' }
    ],
    tabs: [
      { label: 'FAQs', to: '#faqs', ariaControls: 'faqs-panel' },
      { label: 'Contacto', to: '#contacto', ariaControls: 'contacto-panel' },
      { label: 'Guías', to: '#guias', ariaControls: 'guias-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showNotifications: true
  },

  // === CERTIFICATES ===
  '/platform/certificates': {
    variant: 'standard',
    title: 'Mis Certificados',
    breadcrumbs: [
      { label: 'Plataforma', to: '/platform' },
      { label: 'Certificados' }
    ],
    tabs: [
      { label: 'Obtenidos', to: '#obtenidos', ariaControls: 'obtenidos-panel' },
      { label: 'En Progreso', to: '#progreso', ariaControls: 'progreso-panel' },
      { label: 'Compartir', to: '#compartir', ariaControls: 'compartir-panel' }
    ],
    theme: 'light',
    requires: ['auth'],
    showNotifications: true
  }
};

export function getHeaderConfigForRoute(pathname: string): HeaderConfig | null {
  return headerRouteConfig[pathname] || null;
}
