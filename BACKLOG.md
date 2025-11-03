# BACKLOG DE MEJORAS - STEGMAIER LMS
## Product Improvement Backlog

**Fecha de Creación:** 2025-10-20
**Última Actualización:** 2025-10-20
**Estado del Proyecto:** En Desarrollo

---

## 🚨 CRÍTICO - Prioridad Máxima

### 1. **[BUG CRÍTICO] Reproductor de Video No Funcional**
**Archivo:** `frontend/src/components/video/AdvancedVideoPlayer.tsx:378-395`
**Descripción:** El componente AdvancedVideoPlayer no renderiza el elemento `<video>` real. Solo muestra un mensaje placeholder, impidiendo que los estudiantes vean los videos de las lecciones.

**Causa Raíz:**
- El componente tiene toda la lógica implementada (event handlers, progreso, bookmarks) pero el `return` del componente solo renderiza un mensaje informativo en lugar del reproductor completo.
- Comentario en línea 376 indica código incompleto: `// [Continuación en el siguiente archivo...]`

**Impacto:**
- **Severidad:** 🔴 CRÍTICA
- Los estudiantes NO pueden ver videos
- Funcionalidad principal del LMS completamente rota
- Backend funciona correctamente, solo falla el frontend

**Solución Propuesta:**
1. **Opción 1 (Rápida):** Crear un componente VideoPlayer básico con `<video>` nativo de HTML5
2. **Opción 2 (Completa):** Implementar el render completo de AdvancedVideoPlayer con todos los controles
   - Controles personalizados (play/pause, seek, volume)
   - Overlay con información de progreso
   - Botones para bookmarks y notas
   - Selector de velocidad de reproducción
   - Botón de pantalla completa

**Estimación:**
- Opción 1: 2 horas
- Opción 2: 8-12 horas

**Archivos Afectados:**
- `frontend/src/components/video/AdvancedVideoPlayer.tsx` (modificar líneas 378-395)

---

### 2. **[UX CRÍTICO] Exceso de Padding en Vista de Curso**
**Archivo:** `frontend/src/pages/platform/CourseViewPage.tsx:729`
**Descripción:** El contenedor del reproductor de video tiene clase `max-w-4xl` que limita el ancho a 896px, dejando mucho espacio en blanco en pantallas grandes.

**Causa Raíz:**
```tsx
<div className="max-w-4xl mx-auto">  {/* ← Limitación de ancho */}
  <AdvancedVideoPlayer ... />
</div>
```

**Impacto:**
- **Severidad:** 🟠 ALTA
- UX deficiente en monitores anchos (>1920px)
- Videos pequeños con mucho espacio desperdiciado
- Interfaz no responsiva al espacio disponible

**Solución Propuesta:**
1. Cambiar `max-w-4xl` por un sistema de ancho responsive:
   ```tsx
   <div className="w-full max-w-[90%] mx-auto lg:max-w-[85%] xl:max-w-[80%]">
   ```
2. Implementar layout flex que aproveche mejor el espacio:
   ```tsx
   <div className="flex-1 max-w-7xl mx-auto">
   ```
3. Considerar layout de 2 columnas en pantallas muy anchas:
   - Columna izquierda: Video (70%)
   - Columna derecha: Notas/Recursos (30%)

**Estimación:** 1-2 horas

**Archivos Afectados:**
- `frontend/src/pages/platform/CourseViewPage.tsx` (línea 729, 780)

---

## 🔴 ALTA PRIORIDAD

### 3. **Implementar Componente VideoPlayer Básico**
**Descripción:** Crear un componente VideoPlayer funcional y simple que pueda reemplazar temporalmente a AdvancedVideoPlayer mientras se completa la implementación avanzada.

**Requisitos Funcionales:**
- Elemento `<video>` HTML5 nativo
- Controles básicos (play, pause, seek, volume)
- Tracking de progreso con progressService
- Auto-guardado de posición cada 5 segundos
- Evento onLessonComplete cuando se completa el 90%
- Responsive y con aspect ratio 16:9

**Implementación:**
```typescript
interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  videoId: string;
  title?: string;
  onProgressUpdate?: (progress: VideoProgress) => void;
  onLessonComplete?: () => void;
  className?: string;
}
```

**Estimación:** 3-4 horas

**Archivos Nuevos:**
- `frontend/src/components/video/VideoPlayer.tsx`
- `frontend/src/components/video/VideoPlayer.test.tsx`

---

### 4. **Prevenir Múltiples Llamadas API Duplicadas**
**Descripción:** Implementar estrategias para evitar llamadas API redundantes que pueden causar problemas de performance y carga innecesaria en el backend.

**Problemas Identificados:**
1. **CourseViewPage.tsx (líneas 63-72):**
   - `loadCourseData()`, `loadCourseQuizzes()`, `loadUserEnrollment()` se llaman en paralelo sin caché
   - Si el componente se re-renderiza, las llamadas se repiten

2. **Falta de React Query en algunos servicios:**
   - `progressService`, `enrollmentService`, `moduleService` no usan React Query
   - Cada llamada es directa sin caché ni deduplicación

**Solución Propuesta:**
1. **Migrar servicios a React Query:**
   ```typescript
   // useProgress.ts
   export function useVideoProgress(lessonId: string, videoId: string) {
     return useQuery({
       queryKey: ['video-progress', lessonId, videoId],
       queryFn: () => progressService.getVideoProgress(lessonId, videoId),
       staleTime: 1000 * 60 * 5, // 5 minutos
       cacheTime: 1000 * 60 * 10, // 10 minutos
     });
   }
   ```

2. **Implementar Request Deduplication:**
   - React Query automáticamente deduplica requests con misma queryKey
   - Evita llamadas simultáneas al mismo endpoint

3. **Usar Suspense Boundaries:**
   - Implementar React Suspense para mejor UX durante loading
   - Evitar múltiples estados de loading en cascada

**Estimación:** 8-12 horas

**Archivos Afectados:**
- `frontend/src/hooks/useProgress.ts` (crear)
- `frontend/src/hooks/useEnrollment.ts` (crear)
- `frontend/src/hooks/useCourse.ts` (actualizar)
- `frontend/src/pages/platform/CourseViewPage.tsx` (refactorizar)

---

### 5. **Refactorizar CourseViewPage - Componente Muy Grande**
**Archivo:** `frontend/src/pages/platform/CourseViewPage.tsx` (842 líneas)
**Descripción:** CourseViewPage es un componente monolítico con demasiadas responsabilidades. Viola principios SOLID y DRY.

**Problemas:**
- 842 líneas de código en un solo archivo
- Múltiples responsabilidades: navegación, progreso, quizzes, assignments, módulos
- 15+ estados locales (`useState`)
- Lógica de negocio mezclada con presentación
- Difícil de testear y mantener

**Solución Propuesta - Extraer Componentes:**

1. **CourseSidebar.tsx:**
   - Lista de módulos/lecciones
   - Indicadores de progreso
   - Navegación entre lecciones
   - Estados: `showSidebar`, `expandedModules`, `completedLessons`

2. **LessonContentRenderer.tsx:**
   - Renderiza contenido según tipo (video, text, assignment)
   - Maneja transiciones entre lecciones
   - Delega a VideoPlayer, TextLesson, AssignmentRenderer

3. **CourseProgressBar.tsx:**
   - Barra de progreso del curso
   - Estadísticas de lecciones completadas
   - Porcentaje de avance

4. **LessonNavigation.tsx:**
   - Botones Anterior/Siguiente
   - Lógica de navegación
   - Validación de progreso secuencial

5. **useCourseData.ts (Custom Hook):**
   - Toda la lógica de fetching de datos
   - Manejo de estados de loading/error
   - Sincronización de progreso

**Arquitectura Propuesta:**
```
CourseViewPage/
├── index.tsx (orquestador principal, 150 líneas max)
├── components/
│   ├── CourseSidebar.tsx
│   ├── LessonContentRenderer.tsx
│   ├── CourseProgressBar.tsx
│   ├── LessonNavigation.tsx
│   └── ModuleList.tsx
├── hooks/
│   ├── useCourseData.ts
│   ├── useLessonProgress.ts
│   └── useModuleNavigation.ts
└── utils/
    ├── courseHelpers.ts
    └── progressCalculator.ts
```

**Estimación:** 12-16 horas

**Beneficios:**
- Código más mantenible y testeable
- Componentes reutilizables
- Mejor separación de responsabilidades
- Más fácil agregar nuevas features

---

### 6. **Mejorar Manejo de Errores Global**
**Descripción:** Implementar un sistema robusto de manejo de errores con Error Boundaries, logging categorizado y notificaciones al usuario.

**Problemas Actuales:**
- Try-catch inconsistente en servicios
- Errores silenciosos en algunos componentes
- No hay Error Boundaries en rutas principales
- Logs mezclados sin categorización

**Solución Propuesta:**

1. **Implementar Error Boundaries:**
```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('ErrorBoundary', error, errorInfo);
    notificationService.error('Error inesperado', error.message);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

2. **Crear servicio de logging estructurado:**
```typescript
// logger.ts
export const logger = {
  api: (message: string, data?: any) => log('API', message, data),
  auth: (message: string, data?: any) => log('AUTH', message, data),
  ui: (message: string, data?: any) => log('UI', message, data),
  error: (category: string, error: Error) => logError(category, error),
};
```

3. **Implementar retry logic para requests:**
```typescript
async function fetchWithRetry(url: string, options: RequestOptions, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

4. **Agregar Error Pages específicas:**
   - `404NotFound.tsx`
   - `500ServerError.tsx`
   - `403Forbidden.tsx`
   - `NetworkError.tsx`

**Estimación:** 6-8 horas

**Archivos Nuevos:**
- `frontend/src/components/errors/ErrorBoundary.tsx`
- `frontend/src/components/errors/ErrorFallback.tsx`
- `frontend/src/utils/logger.ts`
- `frontend/src/utils/retry.ts`
- `frontend/src/pages/errors/` (varios)

---

## 🟡 PRIORIDAD MEDIA

### 7. **Implementar Tests Unitarios y de Integración**
**Descripción:** Aumentar cobertura de tests del proyecto. Actualmente solo hay algunos tests básicos.

**Estado Actual:**
- Test setup configurado con Vitest + Testing Library
- Solo 1 test en `courseService.test.ts`
- 0% de cobertura en componentes
- 0% de cobertura en hooks

**Objetivos:**
- **Cobertura mínima:** 70% en servicios
- **Cobertura mínima:** 60% en componentes críticos
- **Cobertura mínima:** 80% en utils y helpers

**Tests a Implementar:**

1. **Servicios (Unit Tests):**
   - `progressService.test.ts` - tracking, bookmarks, notes
   - `enrollmentService.test.ts` - enroll, unenroll
   - `moduleService.test.ts` - structure, navigation
   - `authService.test.ts` - login, logout, refresh

2. **Componentes (Integration Tests):**
   - `VideoPlayer.test.tsx` - playback, progress, controls
   - `CourseViewPage.test.tsx` - navegación, progreso
   - `CourseSidebar.test.tsx` - expansión, selección
   - `QuizCard.test.tsx` - render, attempts, scoring

3. **Hooks (Unit Tests):**
   - `useProgress.test.ts` - mutations, queries
   - `useAnalytics.test.ts` - tracking events
   - `useAuth.test.ts` - authentication state

4. **Utils (Unit Tests):**
   - `api.config.test.ts` - URL building, headers
   - `formatters.test.ts` - time, duration, percentages

**Tecnologías:**
- Vitest (ya configurado)
- Testing Library (ya configurado)
- MSW para mocking API (ya instalado)

**Estimación:** 16-20 horas

**Archivos Nuevos:** ~20 archivos de test

---

### 8. **Optimizar Rendimiento deBundle**
**Descripción:** Reducir tamaño del bundle y mejorar tiempos de carga inicial.

**Análisis Actual:**
- Bundle size warning en build: >600KB
- Algunas dependencias pesadas no lazy-loaded
- Importaciones completas de librerías grandes

**Problemas Identificados:**

1. **@heroicons/react:** Importación completa en lugar de específica
   ```typescript
   // ❌ Malo
   import { ChevronDownIcon } from '@heroicons/react/24/outline';

   // ✅ Mejor (tree-shaking)
   import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';
   ```

2. **Rutas no lazy-loaded:**
   - Todas las páginas se cargan en el bundle inicial
   - Administración, instructor, cursos en el mismo chunk

3. **Dependencias grandes:**
   - `recharts` (455KB) - usado solo en admin dashboard
   - `jspdf` (189KB) - usado solo en certificados
   - `html2canvas` (145KB) - usado solo en certificados

**Solución Propuesta:**

1. **Implementar Code Splitting agresivo:**
```typescript
// routes/index.tsx
const CourseViewPage = lazy(() => import('../pages/platform/CourseViewPage'));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const CertificateGenerator = lazy(() => import('../components/certificates/Generator'));
```

2. **Optimizar imports de iconos:**
```typescript
// Crear barrel export personalizado
// icons/index.ts
export { default as ChevronDownIcon } from '@heroicons/react/24/outline/ChevronDownIcon';
export { default as BookOpenIcon } from '@heroicons/react/24/outline/BookOpenIcon';
```

3. **Dynamic imports para features pesadas:**
```typescript
// Cargar jspdf solo cuando se necesita
const generatePDF = async () => {
  const jsPDF = (await import('jspdf')).default;
  // usar jsPDF...
};
```

4. **Configurar bundle analyzer:**
```bash
npm install --save-dev rollup-plugin-visualizer
```

**Objetivos:**
- Reducir bundle inicial de ~800KB a ~400KB
- Tiempo de carga inicial < 3 segundos en 3G
- First Contentful Paint < 1.5 segundos

**Estimación:** 8-10 horas

**Archivos Afectados:**
- `vite.config.ts` (optimizaciones)
- `routes/index.tsx` (lazy loading)
- Múltiples componentes (optimizar imports)

---

### 9. **Implementar Sistema de Caché Offline**
**Descripción:** Permitir que los estudiantes accedan a contenido previamente cargado sin conexión.

**Funcionalidades:**
1. **Service Worker para caché:**
   - Caché de assets estáticos
   - Caché de API responses (progreso, lecciones)
   - Estrategia cache-first para contenido estático

2. **IndexedDB para datos:**
   - Guardar lecciones vistas recientemente
   - Guardar progreso localmente
   - Sincronización cuando vuelve conexión

3. **Indicadores de estado offline:**
   - Banner "Sin conexión"
   - Modo offline activado
   - Cola de sincronización pendiente

**Tecnologías:**
- Workbox (service worker library)
- Dexie.js (IndexedDB wrapper)
- React Query persistent cache

**Estimación:** 12-16 horas

---

### 10. **Mejorar Accesibilidad (A11y)**
**Descripción:** Asegurar que la aplicación cumple con WCAG 2.1 Level AA.

**Problemas Actuales:**
- Falta `aria-labels` en muchos botones
- Navegación por teclado incompleta
- Contraste de colores insuficiente en algunos lugares
- Videos sin subtítulos

**Mejoras Necesarias:**

1. **Navegación por teclado:**
   - Implementar focus management en modales
   - Keyboard shortcuts en reproductor de video
   - Skip links para navegación rápida

2. **Screen reader support:**
   - Agregar `aria-labels` descriptivos
   - Roles ARIA en componentes complejos
   - Live regions para notificaciones

3. **Contraste y colores:**
   - Auditoría de contraste con herramientas (axe DevTools)
   - Modo alto contraste
   - Soporte para prefers-color-scheme

4. **Videos accesibles:**
   - Soporte para subtítulos (WebVTT)
   - Audio descriptions
   - Transcripciones de texto

**Herramientas:**
- axe DevTools (auditoría)
- NVDA/JAWS (testing screen readers)
- Lighthouse (scores)

**Estimación:** 10-12 horas

---

## 🟢 PRIORIDAD BAJA / MEJORAS FUTURAS

### 11. **Implementar Dark Mode Completo**
**Estado:** Parcialmente implementado (ThemeContext existe pero no está completo)

**Tareas:**
- Completar variantes dark en todos los componentes
- Persistir preferencia en localStorage
- Smooth transitions entre modos
- Imágenes optimizadas para dark mode

**Estimación:** 6-8 horas

---

### 12. **Internacionalización (i18n)**
**Descripción:** Soporte para múltiples idiomas (español, inglés, portugués).

**Tecnología Sugerida:**
- react-i18next
- JSON translation files
- Language switcher en navbar

**Estimación:** 12-16 horas

---

### 13. **Analytics Avanzados**
**Descripción:** Dashboard de analytics más detallado para instructores y admins.

**Features:**
- Heatmaps de engagement en videos
- Análisis de drop-off points
- Tiempo promedio por lección
- Métricas de quizzes (preguntas más difíciles)

**Estimación:** 16-20 horas

---

### 14. **Gamificación**
**Descripción:** Sistema de puntos, badges y leaderboards para motivar estudiantes.

**Features:**
- Sistema de puntos por completar lecciones
- Badges por logros (primera lección, racha de 7 días, etc.)
- Leaderboard semanal/mensual
- Perfil público con logros

**Estimación:** 20-24 horas

---

### 15. **Mobile App (React Native)**
**Descripción:** Aplicación móvil nativa para iOS y Android.

**Ventajas:**
- Offline-first desde el diseño
- Push notifications nativas
- Mejor performance en móviles
- App Store / Play Store presence

**Estimación:** 200+ horas (proyecto separado)

---

## 📋 DEUDA TÉCNICA

### DT-1: Eliminar console.logs en Producción
**Archivo:** Múltiples archivos
**Descripción:** Muchos `console.log` en código de producción. Vite config elimina algunos pero no todos.

**Solución:** Usar logger centralizado con niveles (debug, info, warn, error)

**Estimación:** 2-3 horas

---

### DT-2: Tipado Incompleto en Algunos Servicios
**Archivos:**
- `frontend/src/services/quizService.ts`
- `frontend/src/services/notificationService.ts`

**Descripción:** Algunos métodos usan `any` o tipos implícitos.

**Solución:** Definir interfaces TypeScript para todos los DTOs

**Estimación:** 3-4 horas

---

### DT-3: Duplicación de Lógica de Formateo
**Descripción:** Funciones `formatTime()`, `formatDuration()` duplicadas en múltiples archivos.

**Solución:** Centralizar en `frontend/src/utils/formatters.ts`

**Estimación:** 2 horas

---

### DT-4: Inconsistencia en Nombres de Propiedades
**Descripción:** Backend usa `snake_case` pero algunos lugares en frontend usan `camelCase` directamente.

**Solución:**
- Definir transformers en servicios
- O usar una librería como `humps` para conversión automática

**Estimación:** 4-6 horas

---

### DT-5: Falta Documentación JSDoc
**Descripción:** Componentes y funciones sin documentación inline.

**Solución:** Agregar JSDoc comments a todas las funciones públicas y componentes exportados

**Estimación:** 8-10 horas

---

## 🔒 SEGURIDAD

### SEC-1: Validar Inputs en Frontend
**Descripción:** Agregar validación de inputs antes de enviar al backend.

**Riesgo:** XSS, injection attacks

**Solución:**
- Usar Yup schemas para validación
- Sanitizar inputs con DOMPurify
- Validar URLs de videos

**Estimación:** 4-6 horas

---

### SEC-2: Implementar CSRF Protection
**Descripción:** Agregar tokens CSRF para formularios críticos.

**Solución:** Cookie-based CSRF tokens en requests POST/PUT/DELETE

**Estimación:** 3-4 horas

---

### SEC-3: Rate Limiting en Frontend
**Descripción:** Prevenir spam de requests desde cliente.

**Solución:** Implementar debouncing/throttling en llamadas API críticas

**Estimación:** 2-3 horas

---

### SEC-4: Content Security Policy (CSP)
**Descripción:** Configurar CSP headers para prevenir XSS.

**Solución:** Configurar CSP en servidor o meta tags

**Estimación:** 2-3 horas

---

## 🎨 UX/UI IMPROVEMENTS

### UI-1: Skeleton Screens en Lugar de Spinners
**Descripción:** Reemplazar spinners genéricos con skeleton screens para mejor perceived performance.

**Estimación:** 6-8 horas

---

### UI-2: Animaciones y Transiciones Mejoradas
**Descripción:** Agregar animaciones smooth usando Framer Motion (ya instalado).

**Áreas:**
- Transiciones entre lecciones
- Modales y overlays
- Expansión de módulos
- Progreso de carga

**Estimación:** 8-10 horas

---

### UI-3: Toast Notifications Mejoradas
**Descripción:** Sistema de notificaciones más sofisticado.

**Features:**
- Posiciones configurables
- Diferentes tipos (success, error, warning, info)
- Acciones en toasts (undo, retry)
- Persistencia de notificaciones importantes

**Estimación:** 4-6 horas

---

### UI-4: Empty States Mejorados
**Descripción:** Diseños atractivos para estados vacíos (cursos sin lecciones, sin enrollments, etc.)

**Estimación:** 4-6 horas

---

### UI-5: Responsive Design Mejorado para Tablets
**Descripción:** Optimizar diseño para tablets (768px - 1024px).

**Problemas:** Algunos componentes no se ven bien en tablets

**Estimación:** 6-8 horas

---

## 🚀 PERFORMANCE

### PERF-1: Implementar React.memo en Componentes Pesados
**Descripción:** Memoizar componentes que re-renderizan frecuentemente sin necesidad.

**Componentes Candidatos:**
- `LessonCard`
- `ModuleListItem`
- `CourseCard`
- `ProgressBar`

**Estimación:** 3-4 horas

---

### PERF-2: Virtualización de Listas Largas
**Descripción:** Usar react-window o react-virtualized para listas de >50 items.

**Listas Candidatas:**
- Lista de cursos en admin
- Lista de estudiantes
- Lista de notificaciones

**Estimación:** 4-6 horas

---

### PERF-3: Optimizar Imágenes
**Descripción:** Implementar lazy loading y responsive images.

**Solución:**
- WebP format con fallback
- Srcset para diferentes tamaños
- Lazy loading con Intersection Observer
- Placeholder blur effect

**Estimación:** 6-8 horas

---

### PERF-4: Prefetching de Rutas
**Descripción:** Prefetch de rutas probables para navegación instantánea.

**Ejemplo:** Cuando usuario está en lista de cursos, prefetch de la primera lección del curso en hover.

**Estimación:** 3-4 horas

---

## 📱 MOBILE OPTIMIZATIONS

### MOB-1: Touch Gestures en Reproductor de Video
**Descripción:** Gestos táctiles intuitivos para controlar video.

**Features:**
- Swipe para buscar
- Double-tap para adelantar/retroceder 10s
- Pinch para zoom
- Arrastrar para ajustar volumen/brillo

**Estimación:** 8-10 horas

---

### MOB-2: PWA Optimizations
**Descripción:** Mejorar experiencia como PWA.

**Features:**
- Manifest.json completo
- Iconos de diferentes tamaños
- Splash screens
- Install prompts

**Estimación:** 4-6 horas

---

### MOB-3: Optimizar para Conexiones Lentas
**Descripción:** Modo "Lite" para conexiones 3G/2G.

**Features:**
- Reducir calidad de videos automáticamente
- Cargar menos datos en listas
- Comprimir imágenes más agresivamente

**Estimación:** 6-8 horas

---

## 🧪 TESTING & QUALITY

### TEST-1: E2E Tests con Playwright
**Descripción:** Tests end-to-end para flujos críticos.

**Flujos a Testear:**
- Login → Ver curso → Completar lección → Ver certificado
- Admin → Crear curso → Agregar lecciones → Publicar
- Estudiante → Enrollarse → Tomar quiz → Pasar/Fallar

**Estimación:** 12-16 horas

---

### TEST-2: Visual Regression Testing
**Descripción:** Prevenir cambios visuales no intencionados.

**Herramienta:** Percy o Chromatic

**Estimación:** 6-8 horas

---

### TEST-3: Lighthouse CI Integration
**Descripción:** Auditorías automáticas de performance en CI/CD.

**Métricas a Monitorear:**
- Performance score > 90
- Accessibility score > 90
- Best Practices score > 90
- SEO score > 90

**Estimación:** 3-4 horas

---

## 📚 DOCUMENTATION

### DOC-1: Storybook para Componentes
**Descripción:** Catálogo interactivo de componentes.

**Beneficios:**
- Documentación visual
- Desarrollo aislado
- Testing de variantes
- Design system reference

**Estimación:** 12-16 horas

---

### DOC-2: API Documentation con TypeDoc
**Descripción:** Generar documentación automática de código TypeScript.

**Estimación:** 4-6 horas

---

### DOC-3: User Guides y Tutorials
**Descripción:** Guías en video y texto para usuarios.

**Contenido:**
- Cómo usar la plataforma (estudiantes)
- Cómo crear cursos (instructores)
- Cómo administrar (admins)

**Estimación:** 16-20 horas

---

## 🔄 CI/CD & DevOps

### CICD-1: Pipeline de CI/CD Completo
**Descripción:** Automatizar testing, build y deployment.

**Stages:**
1. Lint & Format check
2. Unit tests
3. Integration tests
4. Build
5. E2E tests
6. Deploy to staging
7. Manual approval
8. Deploy to production

**Herramientas:** GitHub Actions o GitLab CI

**Estimación:** 8-12 horas

---

### CICD-2: Preview Deployments para PRs
**Descripción:** Deploy automático de preview para cada PR.

**Beneficio:** QA más fácil, feedback visual

**Herramienta:** Vercel Preview Deployments o Netlify Deploy Previews

**Estimación:** 4-6 horas

---

### CICD-3: Monitoring y Alertas
**Descripción:** Monitoreo de errores y performance en producción.

**Herramientas:**
- Sentry (error tracking)
- LogRocket (session replay)
- Datadog (APM)

**Estimación:** 6-8 horas

---

## 📊 ANALYTICS & TRACKING

### AN-1: Google Analytics 4 Integration
**Descripción:** Tracking detallado de user behavior.

**Events a Trackear:**
- Page views
- Video watch time
- Quiz completions
- Certificate downloads
- User registration funnel

**Estimación:** 4-6 horas

---

### AN-2: Hotjar para Heatmaps
**Descripción:** Entender cómo usuarios interactúan con la plataforma.

**Estimación:** 2-3 horas

---

## 🎯 BUSINESS FEATURES

### BIZ-1: Sistema de Cupones y Descuentos
**Descripción:** Permitir cupones promocionales para cursos.

**Estimación:** 12-16 horas

---

### BIZ-2: Subscripciones Recurrentes
**Descripción:** Modelo de subscription mensual/anual.

**Integración:** Stripe Subscriptions

**Estimación:** 16-20 horas

---

### BIZ-3: Afiliados y Referrals
**Descripción:** Programa de afiliados para instructores y estudiantes.

**Estimación:** 20-24 horas

---

## 📝 NOTAS FINALES

### Metodología de Priorización
Las prioridades se asignan basadas en:
1. **Impacto en usuarios:** Bugs críticos que bloquean funcionalidad
2. **Deuda técnica:** Problemas que dificultan desarrollo futuro
3. **ROI:** Esfuerzo vs beneficio
4. **Dependencias:** Bloquea otras mejoras

### Estimaciones
- Basadas en 1 desarrollador full-time
- Incluyen: desarrollo, testing, code review, documentación
- No incluyen: diseño UI/UX, product management

### Siguiente Sprint Sugerido (2 semanas)
1. ✅ Implementar VideoPlayer básico (3-4h)
2. ✅ Corregir padding en CourseViewPage (1-2h)
3. 🟠 Prevenir múltiples llamadas API (8-12h)
4. 🟠 Mejorar manejo de errores (6-8h)
5. 🟠 Refactorizar CourseViewPage (12-16h)

**Total:** ~35-45 horas (capacidad de 1 sprint de 2 semanas)

---

**Documento generado por:** Claude Code
**Versión:** 1.0.0
**Última revisión:** 2025-10-20
