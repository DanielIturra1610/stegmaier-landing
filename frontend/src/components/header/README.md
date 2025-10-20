# Sistema de Headers Contextuales

## Descripción

Sistema modular, configurable y accesible de headers contextuales que reemplaza el navbar global con headers específicos por página. Implementado siguiendo principios de desarrollo responsivo, mantenible y escalable.

## Arquitectura

### Componentes Principales

- **PageHeader.tsx**: Componente principal que orquesta todos los subcomponentes
- **types.ts**: Tipos TypeScript estrictos para configuración y datos
- **config.ts**: Configuración por ruta con mapeo de headers
- **useHeaderConfig.ts**: Hook personalizado para manejo de datos y estado

### Subcomponentes

- **HeaderBreadcrumbs**: Navegación breadcrumb accesible (ARIA)
- **HeaderTitle**: Títulos dinámicos y estáticos
- **HeaderStats**: KPIs con iconos y colores (analytics variant)
- **HeaderActions**: Controles (período, refresh, online status, menú móvil)
- **HeaderTabs**: Navegación por pestañas con roles ARIA

## Características

### Accesibilidad (WCAG AA)
- ✅ Roles semánticos (`banner`, `navigation`, `tablist`, `tab`)
- ✅ ARIA labels y properties correctos
- ✅ `aria-current="page"` en elementos activos
- ✅ Foco visible y navegación por teclado
- ✅ Contraste WCAG AA compliant

### Variantes Soportadas
- **analytics**: Con KPIs, stats, período selector (POC en MyProgressPage)
- **standard**: Header básico con breadcrumbs y título
- **minimal**: Solo título
- **courseDetail**: Para páginas de curso (futuro)
- **courseViewer**: Para visualización de cursos (futuro)
- **admin**: Para panel administrativo (futuro)

### Responsividad
- ✅ Layout adaptativo móvil/desktop
- ✅ Stats ocultas en móvil con versión compacta
- ✅ Botón menú hamburguesa solo en móvil
- ✅ Breakpoints Tailwind consistentes

## Configuración por Ruta

```typescript
// En config.ts
'/platform/my-progress': {
  variant: 'analytics',
  title: 'Mi Progreso y Estadísticas',
  breadcrumbs: [
    { label: 'Plataforma', to: '/platform' },
    { label: 'Mi Progreso' }
  ],
  tabs: [
    { label: 'Resumen', to: '#resumen' },
    { label: 'Actividad', to: '#actividad' },
    { label: 'Logros', to: '#logros' }
  ],
  theme: 'light',
  requires: ['auth']
}
```

## Hook de Datos

```typescript
const { config, data, period, setPeriod, refresh, loading, error } = useHeaderConfig();
```

### Datos del Analytics Variant
- **completionRate**: Porcentaje de finalización de cursos
- **totalWatchTimeFormatted**: Tiempo de estudio formateado (ej: "2h 30m")
- **streakDays**: Días consecutivos de estudio
- **period**: Período seleccionado (7/30/90/365 días)

## Integración

### En PlatformLayout.tsx
```tsx
<PageHeader onMenuClick={toggleSidebar} />
```

### En páginas específicas
No es necesario renderizar header adicional. El sistema detecta automáticamente la ruta y aplica la configuración correspondiente.

## APIs Utilizadas

- `GET /api/v1/analytics/my-stats` - Estadísticas del usuario
- `GET /api/v1/progress/summary` - Resumen de progreso
- `GET /api/v1/users/me` - Información del usuario

## Testing

- Renderizado correcto por variante
- ARIA attributes y roles
- Interacciones (refresh, período, menú)
- Estados de loading y error
- Navegación por pestañas

## Próximas Mejoras

- [ ] Migrar a React Query/SWR para cache compartido
- [ ] Expandir configuraciones para todas las rutas de la plataforma
- [ ] Implementar variantes courseDetail, courseViewer, admin
- [ ] Añadir animaciones y transiciones
- [ ] Integrar con sistema de notificaciones
- [ ] Soporte para temas dark/light

## Rollback

Para volver al sistema anterior:
1. Restaurar `PlatformNavbar.tsx.backup` → `PlatformNavbar.tsx`
2. Revertir cambios en `PlatformLayout.tsx`
3. Restaurar header block en `MyProgressPage.tsx`
4. Eliminar directorio `components/header/`
