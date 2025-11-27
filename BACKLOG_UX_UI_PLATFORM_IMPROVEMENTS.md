# Backlog: UX/UI Platform Improvements with Shadcn/UI

**Objetivo**: Refactorizar la plataforma LMS (Learning Management System) con componentes de shadcn/ui para hacerla más profesional y atractiva, manteniendo toda la funcionalidad existente.

**Alcance**: Solo la plataforma de cursos (rutas `/platform/*`, `/admin/*`, áreas de estudiantes e instructores). **NO tocar** las páginas de landing (Inicio, Consultoría, Empresa).

---

## 📋 Índice de Contenidos

1. [Fase 0: Preparación y Setup](#fase-0-preparación-y-setup)
2. [Fase 1: Sistema de Diseño Base](#fase-1-sistema-de-diseño-base)
3. [Fase 2: Componentes de Layout y Navegación](#fase-2-componentes-de-layout-y-navegación)
4. [Fase 3: Dashboard y Vistas Principales](#fase-3-dashboard-y-vistas-principales)
5. [Fase 4: Cursos y Contenido](#fase-4-cursos-y-contenido)
6. [Fase 5: Evaluaciones (Quizzes & Assignments)](#fase-5-evaluaciones-quizzes--assignments)
7. [Fase 6: Administración y Gestión](#fase-6-administración-y-gestión)
8. [Fase 7: Experiencia de Usuario Avanzada](#fase-7-experiencia-de-usuario-avanzada)
9. [Fase 8: Refinamiento y Optimización](#fase-8-refinamiento-y-optimización)

---

## Fase 0: Preparación y Setup

### 🎯 Objetivo
Preparar el entorno para integrar shadcn/ui y establecer el sistema de diseño.

### 📦 Tareas

#### T0.1: Instalar y Configurar Shadcn/UI
**Prioridad**: 🔴 Crítica
**Estimación**: 2 horas
**Archivos**: `package.json`, `components.json`, `tailwind.config.js`

- [ ] Verificar configuración actual de shadcn en `components.json`
- [ ] Instalar componentes base de shadcn que necesitaremos:
  - `npx shadcn@latest add button`
  - `npx shadcn@latest add card`
  - `npx shadcn@latest add input`
  - `npx shadcn@latest add label`
  - `npx shadcn@latest add select`
  - `npx shadcn@latest add dropdown-menu`
  - `npx shadcn@latest add dialog`
  - `npx shadcn@latest add sheet`
  - `npx shadcn@latest add tabs`
  - `npx shadcn@latest add table`
  - `npx shadcn@latest add badge`
  - `npx shadcn@latest add avatar`
  - `npx shadcn@latest add progress`
  - `npx shadcn@latest add skeleton`
  - `npx shadcn@latest add toast`
  - `npx shadcn@latest add alert`
  - `npx shadcn@latest add separator`
  - `npx shadcn@latest add scroll-area`
  - `npx shadcn@latest add tooltip`
  - `npx shadcn@latest add accordion`
  - `npx shadcn@latest add alert-dialog`
  - `npx shadcn@latest add aspect-ratio`
  - `npx shadcn@latest add breadcrumb`
  - `npx shadcn@latest add calendar`
  - `npx shadcn@latest add checkbox`
  - `npx shadcn@latest add command`
  - `npx shadcn@latest add context-menu`
  - `npx shadcn@latest add form`
  - `npx shadcn@latest add hover-card`
  - `npx shadcn@latest add menubar`
  - `npx shadcn@latest add navigation-menu`
  - `npx shadcn@latest add popover`
  - `npx shadcn@latest add radio-group`
  - `npx shadcn@latest add slider`
  - `npx shadcn@latest add switch`
  - `npx shadcn@latest add textarea`
- [ ] Configurar tema personalizado en `tailwind.config.js` manteniendo colores corporativos
- [ ] Crear archivo de documentación: `docs/SHADCN_MIGRATION_GUIDE.md`

**Criterios de Aceptación**:
- Todos los componentes de shadcn instalados correctamente
- Tema corporativo aplicado y funcionando
- Guía de migración documentada

---

#### T0.2: Crear Sistema de Tokens de Diseño
**Prioridad**: 🔴 Crítica
**Estimación**: 3 horas
**Archivos**: `src/styles/design-tokens.css`, `tailwind.config.js`

- [ ] Definir paleta de colores para la plataforma:
  - Primary: Mantener colores corporativos azules
  - Secondary: Colores de acento (verde)
  - Neutral: Grises para fondos y texto
  - Semantic: Success, Warning, Error, Info
- [ ] Definir sistema de tipografía:
  - Tamaños de fuente (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
  - Line heights
  - Font weights
- [ ] Definir espaciado consistente (siguiendo escala de Tailwind)
- [ ] Definir border radius estándar
- [ ] Definir sombras (sm, md, lg, xl)
- [ ] Definir transiciones y animaciones estándar

**Criterios de Aceptación**:
- CSS custom properties definidas
- Tokens integrados con Tailwind
- Documentación de uso de tokens

---

#### T0.3: Crear Componente de Demostración
**Prioridad**: 🟡 Media
**Estimación**: 2 horas
**Archivos**: `src/pages/platform/ComponentShowcase.tsx`

- [ ] Crear página de showcase para ver todos los componentes
- [ ] Mostrar ejemplos de uso de cada componente de shadcn
- [ ] Agregar variantes y estados de cada componente
- [ ] Solo visible en desarrollo

**Criterios de Aceptación**:
- Página accesible en `/platform/showcase`
- Todos los componentes visibles con ejemplos
- Solo disponible en modo desarrollo

---

## Fase 1: Sistema de Diseño Base

### 🎯 Objetivo
Establecer componentes base reutilizables para toda la plataforma.

### 📦 Tareas

#### T1.1: Refactorizar Button Component
**Prioridad**: 🔴 Crítica
**Estimación**: 2 horas
**Archivos**: `src/components/ui/button.tsx`

**Componente Actual**: Button personalizado con CVA
**Componente Objetivo**: Shadcn Button

- [ ] Comparar props actuales vs shadcn Button
- [ ] Extender shadcn Button con variantes personalizadas si es necesario
- [ ] Agregar variante "loading" con spinner
- [ ] Agregar soporte para iconos (left/right)
- [ ] Mantener todas las variantes existentes: default, secondary, ghost, link
- [ ] Agregar nuevas variantes: destructive, outline

**Criterios de Aceptación**:
- Shadcn Button reemplaza al actual
- Todas las variantes existentes funcionan
- Loading state implementado
- Sin romper componentes que usan Button

---

#### T1.2: Refactorizar Card Components
**Prioridad**: 🔴 Crítica
**Estimación**: 3 horas
**Archivos**: `src/components/ui/Card.tsx`, `src/components/course/CourseCard.tsx`, `src/components/ui/ServiceCard.tsx`

**Componentes Actuales**: Cards personalizadas
**Componente Objetivo**: Shadcn Card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)

- [ ] Refactorizar `CourseCard` usando shadcn Card
- [ ] Mantener diseño visual actual pero con estructura de shadcn
- [ ] Agregar hover effects mejorados
- [ ] Optimizar imagen de thumbnail con lazy loading
- [ ] Agregar skeleton loading state

**Criterios de Aceptación**:
- Cards usan estructura de shadcn
- Diseño visual se mantiene o mejora
- Hover effects suaves
- Loading states implementados

---

#### T1.3: Refactorizar Form Components
**Prioridad**: 🔴 Crítica
**Estimación**: 4 horas
**Archivos**: `src/components/ui/FormInput.tsx`, `src/components/ui/form/*`

**Componente Actual**: FormInput personalizado con Formik
**Componentes Objetivo**: Shadcn Form + Input + Label + Textarea + Select

- [ ] Integrar shadcn Form con Formik
- [ ] Crear wrapper `FormField` que combina shadcn + Formik
- [ ] Refactorizar Input component
- [ ] Refactorizar Textarea component
- [ ] Refactorizar Select component
- [ ] Agregar estados de validación visual mejorados
- [ ] Agregar mensajes de error con animaciones

**Criterios de Aceptación**:
- Formularios usan shadcn components
- Integración con Formik funciona perfectamente
- Validación visual mejorada
- Accesibilidad mantenida (labels, aria-*)

---

#### T1.4: Mejorar Alert y Toast Components
**Prioridad**: 🟡 Media
**Estimación**: 2 horas
**Archivos**: `src/components/ui/Alert.tsx`, configuración de toast

**Componente Actual**: Alert personalizado + react-hot-toast
**Componentes Objetivo**: Shadcn Alert + Shadcn Toast (Sonner)

- [ ] Reemplazar Alert con shadcn Alert
- [ ] Considerar migrar de react-hot-toast a Sonner (shadcn toast)
- [ ] Agregar variantes: default, destructive, warning, success
- [ ] Agregar iconos según tipo
- [ ] Agregar close button

**Criterios de Aceptación**:
- Alert component mejorado
- Toast notifications más profesionales
- Variantes semánticas funcionando

---

#### T1.5: Crear Loading States Consistentes
**Prioridad**: 🟡 Media
**Estimación**: 3 horas
**Archivos**: `src/components/ui/LoadingSpinner.tsx`, `src/components/ui/skeleton/*`

**Componente Actual**: LoadingSpinner personalizado
**Componentes Objetivo**: Shadcn Skeleton + Spinner mejorado

- [ ] Refactorizar LoadingSpinner con animaciones mejoradas
- [ ] Crear skeleton loaders para cada tipo de contenido:
  - CourseCardSkeleton
  - LessonListSkeleton
  - DashboardSkeleton
  - TableSkeleton
  - FormSkeleton
- [ ] Crear hook `useLoadingState` para manejo consistente

**Criterios de Aceptación**:
- Skeletons para todos los componentes principales
- Loading states consistentes en toda la app
- Hook reutilizable implementado

---

## Fase 2: Componentes de Layout y Navegación

### 🎯 Objetivo
Mejorar la experiencia de navegación y estructura de la plataforma.

### 📦 Tareas

#### T2.1: Rediseñar Platform Sidebar
**Prioridad**: 🔴 Crítica
**Estimación**: 5 horas
**Archivos**: `src/components/layout/PlatformSidebar.tsx`

**Componente Actual**: Sidebar personalizado con toggle
**Componente Objetivo**: Sidebar moderno con Sheet de shadcn para móvil

**Mejoras UX/UI**:
- [ ] Implementar sidebar colapsable con animaciones suaves
- [ ] Agregar tooltips cuando está colapsado (shadcn Tooltip)
- [ ] Mejorar indicadores de ruta activa
- [ ] Agregar iconos más expresivos (lucide-react)
- [ ] Implementar Sheet para vista móvil
- [ ] Agregar sección de user profile en sidebar
- [ ] Agregar shortcuts de teclado (Cmd+K para search)
- [ ] Agregar mini breadcrumbs en el top
- [ ] Mejorar agrupación de items por categorías

**Estructura Propuesta**:
```
┌─────────────────────┐
│ [Logo] Stegmaier    │ ← Header colapsable
├─────────────────────┤
│ 🔍 Search...        │ ← Command palette (Cmd+K)
├─────────────────────┤
│ 📚 Mis Cursos       │
│ 📊 Mi Progreso      │
│ 🎓 Certificados     │
├─────────────────────┤
│ INSTRUCTOR          │ ← Sección condicional
│ 📝 Mis Clases       │
│ 👥 Estudiantes      │
├─────────────────────┤
│ ADMIN               │ ← Sección condicional
│ ⚙️  Dashboard       │
│ 📚 Cursos           │
│ 👥 Usuarios         │
│ 📈 Analytics        │
├─────────────────────┤
│ [Avatar] Usuario    │ ← User profile
│ John Doe            │
│ Estudiante          │
└─────────────────────┘
```

**Criterios de Aceptación**:
- Sidebar responsive y colapsable
- Sheet funcionando en móvil
- Tooltips en modo colapsado
- Indicadores de ruta activa claros
- Accesibilidad mejorada (keyboard navigation)

---

#### T2.2: Rediseñar Platform Header
**Prioridad**: 🔴 Crítica
**Estimación**: 4 horas
**Archivos**: `src/components/layout/PlatformLayout.tsx` (header section)

**Componente Actual**: Header básico
**Componente Objetivo**: Header profesional con shadcn components

**Mejoras UX/UI**:
- [ ] Agregar breadcrumbs dinámicos (shadcn Breadcrumb)
- [ ] Mejorar notification center (shadcn Popover + Badge)
- [ ] Agregar theme toggle (dark/light mode)
- [ ] Mejorar dropdown de usuario (shadcn DropdownMenu)
- [ ] Agregar search global (shadcn Command)
- [ ] Agregar indicador de progreso global (si aplicable)

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [☰] Home > Cursos > Introducción ISO 9001    [🔍][🔔3][🌓][👤] │
│       ↑ Breadcrumbs                            ↑  ↑  ↑    ↑     │
│                                           Search│  │Theme User   │
│                                              Notif│              │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Breadcrumbs funcionando dinámicamente
- Notification center con contador
- Theme toggle funcional
- User dropdown con opciones (Profile, Settings, Logout)
- Search global implementado

---

#### T2.3: Crear Command Palette (Search Global)
**Prioridad**: 🟡 Media
**Estimación**: 6 horas
**Archivos**: `src/components/platform/CommandPalette.tsx`

**Componente Nuevo**: Command Palette usando shadcn Command
**Inspiración**: GitHub command palette (Cmd+K)

**Funcionalidades**:
- [ ] Buscar cursos por nombre
- [ ] Buscar lecciones
- [ ] Navegación rápida a secciones
- [ ] Atajos de teclado documentados
- [ ] Historial de búsquedas recientes
- [ ] Resultados agrupados por tipo
- [ ] Keyboard navigation (arrow keys, enter, esc)

**Criterios de Aceptación**:
- Cmd+K / Ctrl+K abre el palette
- Búsqueda funcional en tiempo real
- Navegación con teclado fluida
- ESC cierra el palette

---

#### T2.4: Mejorar Breadcrumbs
**Prioridad**: 🟢 Baja
**Estimación**: 2 horas
**Archivos**: `src/components/layout/Breadcrumbs.tsx`

**Componente Nuevo**: Breadcrumbs dinámicos usando shadcn

- [ ] Implementar breadcrumbs automáticos basados en ruta
- [ ] Agregar iconos por tipo de página
- [ ] Hacer últimos crumbs clickeables con dropdown si hay submenu
- [ ] Agregar animaciones de transición

**Criterios de Aceptación**:
- Breadcrumbs se generan automáticamente
- Navegación funcional
- Visual mejorado

---

## Fase 3: Dashboard y Vistas Principales

### 🎯 Objetivo
Mejorar los dashboards principales para estudiantes, instructores y administradores.

### 📦 Tareas

#### T3.1: Rediseñar Dashboard de Estudiante
**Prioridad**: 🔴 Crítica
**Estimación**: 8 horas
**Archivos**: `src/pages/platform/MyCourses.tsx`, `src/components/progress/CourseProgressDashboard.tsx`

**Vista Actual**: Lista básica de cursos
**Vista Objetivo**: Dashboard moderno con estadísticas y quick actions

**Mejoras UX/UI**:
- [ ] Agregar sección de "Continuar donde lo dejaste" con últimas lecciones
- [ ] Mostrar stats principales en cards:
  - Cursos completados
  - Horas de estudio
  - Racha actual (streak)
  - Certificados obtenidos
- [ ] Agregar timeline de actividades recientes
- [ ] Mejorar visualización de progreso con shadcn Progress
- [ ] Agregar filtros y búsqueda de cursos
- [ ] Agregar tabs: "En Progreso" | "Completados" | "Todos"
- [ ] Agregar vista de grid/lista toggleable

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 👋 Bienvenido, John!                                            │
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 📚 5     │ │ ⏱️ 24h   │ │ 🔥 7 días│ │ 🎓 3     │           │
│ │ Cursos   │ │ Estudio  │ │ Racha    │ │ Certif.  │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│ 📖 Continuar donde lo dejaste                                   │
│ ┌────────────────────────────────────────┐                     │
│ │ [IMG] Introducción ISO 9001            │                     │
│ │ Lección 5: Auditoría Interna           │                     │
│ │ ████████░░░░░░ 65% completado          │                     │
│ │ [Continuar →]                          │                     │
│ └────────────────────────────────────────┘                     │
│                                                                  │
│ 📚 Mis Cursos                    [En Progreso|Completados|...]  │
│ [🔍 Buscar...] [Grid|List]                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│ │ [IMG]    │ │ [IMG]    │ │ [IMG]    │                        │
│ │ Curso 1  │ │ Curso 2  │ │ Curso 3  │                        │
│ │ ████ 45% │ │ ████ 80% │ │ ████ 10% │                        │
│ └──────────┘ └──────────┘ └──────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Stats cards funcionando con datos reales
- "Continuar donde lo dejaste" muestra última lección vista
- Filtros y búsqueda funcionales
- Vista grid/lista toggleable
- Responsive design

---

#### T3.2: Rediseñar Dashboard de Instructor
**Prioridad**: 🔴 Crítica
**Estimación**: 8 horas
**Archivos**: `src/pages/InstructorDashboard.tsx`, `src/pages/InstructorCourses.tsx`

**Vista Actual**: Dashboard básico
**Vista Objetivo**: Dashboard analítico con métricas y quick actions

**Mejoras UX/UI**:
- [ ] Agregar stats principales:
  - Total estudiantes
  - Cursos activos
  - Assignments pendientes de calificar
  - Rating promedio
- [ ] Agregar gráfica de estudiantes activos (shadcn + recharts)
- [ ] Agregar lista de "Pending Actions":
  - Assignments to grade
  - Questions to answer
  - Reviews pending
- [ ] Agregar vista de cursos con métricas por curso
- [ ] Agregar calendario de próximos deadlines

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 👨‍🏫 Dashboard - Instructor                                       │
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 👥 150   │ │ 📚 8     │ │ 📝 24    │ │ ⭐ 4.8   │           │
│ │ Estudian │ │ Cursos   │ │ Pending  │ │ Rating   │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│ ┌─────────────────────────┐ ┌──────────────────────────────┐  │
│ │ 📊 Estudiantes Activos  │ │ ⚡ Acciones Pendientes       │  │
│ │ [Gráfica de líneas]     │ │ • 12 assignments to grade    │  │
│ │                         │ │ • 5 questions to answer      │  │
│ │                         │ │ • 3 course reviews pending   │  │
│ └─────────────────────────┘ └──────────────────────────────┘  │
│                                                                  │
│ 📚 Mis Cursos                                                   │
│ [Table con métricas por curso]                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Stats cards con datos reales
- Gráfica de estudiantes activos
- Lista de pending actions clickeable
- Tabla de cursos con métricas

---

#### T3.3: Rediseñar Admin Dashboard
**Prioridad**: 🔴 Crítica
**Estimación**: 10 horas
**Archivos**: `src/pages/admin/AdminDashboard.tsx`, `src/components/admin/SystemMonitoringDashboard.tsx`

**Vista Actual**: Dashboard con monitoring básico
**Vista Objetivo**: Dashboard ejecutivo con métricas clave y visualizaciones

**Mejoras UX/UI**:
- [ ] Agregar KPI cards principales:
  - Total usuarios (con growth %)
  - Total cursos
  - Engagement rate
  - Revenue (si aplicable)
- [ ] Agregar gráficas:
  - Usuarios activos últimos 30 días (línea)
  - Cursos más populares (bar chart)
  - Completion rate por curso (bar chart)
  - User growth (área chart)
- [ ] Agregar tabla de "Recent Activities"
- [ ] Agregar system health indicators
- [ ] Agregar quick actions: Create Course, Add User, View Reports

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚙️  Admin Dashboard                              [Quick Actions▾]│
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 👥 1,247 │ │ 📚 45    │ │ 📊 78%   │ │ 💰 $45K  │           │
│ │ Users    │ │ Courses  │ │ Engage.  │ │ Revenue  │           │
│ │ ↑ 12%    │ │ ↑ 3      │ │ ↑ 5%     │ │ ↑ 18%    │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│ ┌─────────────────────────┐ ┌──────────────────────────────┐  │
│ │ 📈 User Growth          │ │ 🔥 Top Courses               │  │
│ │ [Area Chart]            │ │ [Bar Chart horizontal]       │  │
│ │                         │ │                              │  │
│ └─────────────────────────┘ └──────────────────────────────┘  │
│                                                                  │
│ 🔄 Recent Activities                    [View All →]            │
│ [Table with avatars, actions, timestamps]                       │
│                                                                  │
│ 💚 System Health                                                │
│ [Health indicators: API, Database, Storage, Email]              │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- KPI cards con growth indicators
- Gráficas funcionales con datos reales
- Recent activities table
- System health monitoring
- Quick actions funcionando

---

#### T3.4: Mejorar Vista de Progreso Personal
**Prioridad**: 🟡 Media
**Estimación**: 6 horas
**Archivos**: `src/pages/platform/ProgressPage.tsx`, `src/pages/platform/MyProgressPage.tsx`

**Vista Actual**: Lista de progreso básica
**Vista Objetivo**: Vista analítica con visualizaciones

**Mejoras UX/UI**:
- [ ] Agregar overview con stats:
  - Total horas estudiadas
  - Cursos completados / Total
  - Promedio de quizzes
  - Racha actual
- [ ] Agregar gráfica de progreso semanal
- [ ] Agregar timeline de achievements
- [ ] Agregar badges/insignias ganadas
- [ ] Agregar comparativa con promedio de la plataforma (opcional)
- [ ] Agregar export de progreso a PDF

**Criterios de Aceptación**:
- Stats de overview funcionales
- Gráficas de progreso
- Timeline de achievements
- Export a PDF funcionando

---

## Fase 4: Cursos y Contenido

### 🎯 Objetivo
Mejorar la experiencia de consumo de contenido educativo.

### 📦 Tareas

#### T4.1: Rediseñar Course Detail Page
**Prioridad**: 🔴 Crítica
**Estimación**: 10 horas
**Archivos**: `src/pages/platform/CourseDetailPage.tsx`, `src/components/course/CourseHero.tsx`

**Vista Actual**: Hero + descripción + módulos
**Vista Objetivo**: Vista moderna con tabs, sidebar y mejor organización

**Mejoras UX/UI**:
- [ ] Rediseñar Hero section:
  - Thumbnail más grande
  - Stats visuales (estudiantes, rating, duración)
  - CTA button más prominente
  - Instructor info con avatar
- [ ] Agregar tabs para organizar contenido:
  - Overview (descripción, objetivos, requisitos)
  - Curriculum (módulos y lecciones)
  - Reviews (opiniones de estudiantes)
  - Instructor (info del instructor)
  - FAQ (preguntas frecuentes)
- [ ] Mejorar sidebar sticky con:
  - Precio (si aplicable)
  - Botón de inscripción
  - What's included (videos, quizzes, certificate, etc.)
  - Share buttons
- [ ] Agregar preview de video (si disponible)
- [ ] Mejorar lista de módulos/lecciones:
  - Acordeón con shadcn Accordion
  - Iconos por tipo de contenido (video, quiz, assignment)
  - Duración por lección
  - Lock icons para contenido bloqueado
  - Progress indicators si está inscrito

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back to Courses]                                              │
│                                                                  │
│ ┌──────────────────────────────┐ ┌────────────────────────┐    │
│ │ [Large Thumbnail/Video]      │ │ 💰 $99 USD             │    │
│ │                              │ │ [Inscribirse →]        │    │
│ │                              │ │                        │    │
│ └──────────────────────────────┘ │ ✅ What's Included:    │    │
│                                  │ • 24 hours video       │    │
│ 📚 Introducción a ISO 9001       │ • 12 quizzes           │    │
│ ⭐ 4.8 (340 reviews) • 1,234     │ • Certificate          │    │
│ estudiantes                      │ • Lifetime access      │    │
│                                  │                        │    │
│ 👨‍🏫 Por John Doe, Experto ISO    │ [Share] [❤️ Save]      │    │
│                                  └────────────────────────┘    │
│ [Overview][Curriculum][Reviews][Instructor][FAQ]               │
│ ──────────────────────────────────────────────────────────      │
│                                                                  │
│ 📋 Overview Tab Content:                                        │
│ Lorem ipsum descripción del curso...                            │
│                                                                  │
│ 🎯 Objetivos de Aprendizaje:                                    │
│ • Objetivo 1                                                    │
│ • Objetivo 2                                                    │
│                                                                  │
│ 📚 Curriculum Tab Content:                                      │
│ ▼ Módulo 1: Introducción                           3h 45min    │
│   🎥 Lección 1: Bienvenida                         15min ✓     │
│   🎥 Lección 2: Historia ISO                       30min ✓     │
│   📝 Quiz 1: Conceptos básicos                     15min 🔒    │
│ ▶ Módulo 2: Fundamentos                            5h 20min    │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Hero visualmente atractivo
- Tabs funcionando correctamente
- Sidebar sticky en desktop
- Accordion de curriculum funcionando
- Preview de video (si aplica)
- Responsive design

---

#### T4.2: Rediseñar Course Viewer (Lección Individual)
**Prioridad**: 🔴 Crítica
**Estimación**: 12 horas
**Archivos**: `src/pages/platform/CourseViewPage.tsx`, `src/components/course/CourseContent.tsx`

**Vista Actual**: Video/contenido + sidebar con lecciones
**Vista Objetivo**: Viewer inmersivo con mejor navegación

**Mejoras UX/UI**:
- [ ] Implementar layout immersivo:
  - Video/contenido a pantalla completa opcional
  - Sidebar colapsable con lista de lecciones
  - Notas integradas (tab lateral)
  - Resources/attachments (tab lateral)
- [ ] Mejorar video player:
  - Usar shadcn components para controles custom
  - Agregar speed controls
  - Agregar quality selector
  - Agregar picture-in-picture
  - Keyboard shortcuts (space, arrows, f)
  - Progress tracking automático
- [ ] Agregar navigation footer:
  - Previous lesson button
  - Mark as complete button
  - Next lesson button
  - Progress indicator del curso
- [ ] Agregar tabs debajo del video:
  - Overview (descripción de la lección)
  - Transcript (si disponible)
  - Notes (notas del estudiante)
  - Resources (archivos descargables)
  - Q&A (preguntas y respuestas)
- [ ] Agregar sidebar con:
  - Curso progress ring
  - Lista de todas las lecciones (accordion por módulo)
  - Search de lecciones
  - Toggle para auto-play next lesson

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Exit] Introducción a ISO 9001               [⚙️] [🔍] [☰]   │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │ 📚 Contenido del Curso   │
│                                      │ ────────────────────     │
│                                      │ 🔵 65% Completado        │
│                                      │                          │
│      [VIDEO PLAYER LARGE]            │ ▼ Módulo 1 ✓            │
│                                      │   🎥 Lección 1 ✓        │
│                                      │   🎥 Lección 2 ✓ [NOW]  │
│                                      │   📝 Quiz 1              │
│                                      │ ▶ Módulo 2               │
│                                      │   🎥 Lección 3           │
│────────────────────────────          │   🎥 Lección 4           │
│ [Overview][Transcript][Notes][Q&A]   │                          │
│ ─────────────────────────────        │ 🔍 Search...             │
│ 📝 Lesson Description:               │                          │
│ En esta lección aprenderás...        │ ⚙️ Settings:             │
│                                      │ ☑️ Auto-play next        │
└──────────────────────────────────────┴──────────────────────────┘
│ [← Previous] [✓ Mark Complete] [Next →]          █████░░ 65%    │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Layout immersivo funcional
- Video player con controles avanzados
- Navigation entre lecciones fluida
- Sidebar colapsable
- Tabs de contenido adicional
- Progress tracking automático
- Responsive (sidebar se vuelve sheet en móvil)

---

#### T4.3: Mejorar Courses List/Browse Page
**Prioridad**: 🟡 Media
**Estimación**: 6 horas
**Archivos**: `src/pages/platform/CoursesPage.tsx`, `src/pages/platform/CoursesListPage.tsx`

**Vista Actual**: Grid de cursos básico
**Vista Objetivo**: Browse experience mejorado con filtros

**Mejoras UX/UI**:
- [ ] Agregar filters sidebar:
  - Por categoría
  - Por nivel (Beginner, Intermediate, Advanced)
  - Por duración
  - Por rating
  - Por precio (si aplica)
- [ ] Agregar sorting:
  - Más populares
  - Mejor rating
  - Más recientes
  - A-Z
- [ ] Agregar search bar con autocomplete
- [ ] Mejorar course cards:
  - Hover effects más atractivos
  - Quick actions en hover (View, Enroll, Save)
  - Better badge para "New" o "Bestseller"
- [ ] Agregar pagination o infinite scroll
- [ ] Agregar vista de lista/grid toggleable

**Criterios de Aceptación**:
- Filters funcionando
- Sorting funcionando
- Search con autocomplete
- Course cards mejorados
- Pagination implementada

---

#### T4.4: Crear Interactive Content Viewer
**Prioridad**: 🟢 Baja
**Estimación**: 8 horas
**Archivos**: `src/components/interactive/InteractiveContent.tsx`, `src/pages/InteractiveLessonDemo.tsx`

**Componente Actual**: InteractiveContent con drag & drop
**Componente Objetivo**: Viewer mejorado con mejor UX

**Mejoras UX/UI**:
- [ ] Mejorar feedback visual en drag & drop
- [ ] Agregar confetti/celebration en completar actividad
- [ ] Agregar hints button
- [ ] Agregar reset button
- [ ] Agregar progress indicator
- [ ] Mejorar instrucciones visuales
- [ ] Agregar timer opcional para challenges

**Criterios de Aceptación**:
- Drag & drop con mejor feedback
- Celebrations implementadas
- Hints funcionales
- Timer opcional

---

## Fase 5: Evaluaciones (Quizzes & Assignments)

### 🎯 Objetivo
Mejorar la experiencia de evaluación y retroalimentación.

### 📦 Tareas

#### T5.1: Rediseñar Quiz Taking Interface
**Prioridad**: 🔴 Crítica
**Estimación**: 10 horas
**Archivos**: `src/pages/platform/QuizTakePage.tsx`, `src/components/quizzes/QuizTaker.tsx`

**Vista Actual**: Quiz taker básico con timer
**Vista Objetivo**: Interface moderna tipo examen profesional

**Mejoras UX/UI**:
- [ ] Rediseñar layout:
  - Question numbering sidebar (1, 2, 3, ... con estados: answered, flagged, current)
  - Main area para pregunta actual
  - Fixed header con timer y progress
  - Fixed footer con navigation buttons
- [ ] Mejorar timer:
  - Usar shadcn Progress para barra de tiempo
  - Warning cuando quedan 5 minutos
  - Alert dialog antes de que expire
- [ ] Agregar features:
  - Flag question para revisión
  - Navigate to any question desde sidebar
  - Review all answers antes de submit
  - Auto-save progress cada 30 segundos
  - Confirm dialog en submit
- [ ] Mejorar question renderer:
  - Better radio/checkbox styling
  - Image zoom si tiene imágenes
  - Code syntax highlighting si es quiz de programación
  - Math rendering si tiene fórmulas

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Quiz: Fundamentos ISO 9001           ⏱️ 15:30     📊 5/10      │
│ ███████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 50%              │
├──────┬──────────────────────────────────────────────────────────┤
│ ☑️ 1 │ Pregunta 5 de 10                                         │
│ ☑️ 2 │                                                          │
│ ☑️ 3 │ ¿Cuál es el propósito principal de ISO 9001?            │
│ ☑️ 4 │                                                          │
│ ⭕ 5 │ ○ Opción A: ...                                         │
│ ☐ 6 │ ● Opción B: ... (seleccionada)                          │
│ ☐ 7 │ ○ Opción C: ...                                         │
│ ☐ 8 │ ○ Opción D: ...                                         │
│ ☐ 9 │                                                          │
│ ☐ 10│ [🚩 Flag for review]                                     │
│      │                                                          │
│      │ [← Previous] [Submit Quiz] [Next →]                     │
└──────┴──────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Sidebar de navegación funcional
- Timer con warnings
- Flag system funcionando
- Auto-save implementado
- Review page antes de submit
- Responsive design

---

#### T5.2: Rediseñar Quiz Results Page
**Prioridad**: 🟡 Media
**Estimación**: 6 horas
**Archivos**: `src/components/quizzes/QuizResults.tsx`

**Vista Actual**: Resultados básicos
**Vista Objetivo**: Results page detallados con feedback

**Mejoras UX/UI**:
- [ ] Agregar hero section con score:
  - Score visual grande (circular progress)
  - Pass/Fail indicator
  - Confetti animation si pasó
  - Time taken
- [ ] Agregar breakdown de resultados:
  - Correct/Incorrect/Skipped
  - Score por sección (si aplica)
  - Percentile rank (comparado con otros estudiantes)
- [ ] Agregar review de respuestas:
  - Question by question review
  - Show correct answer
  - Explanation (si está disponible)
  - What you answered vs correct answer
- [ ] Agregar actions:
  - Retake quiz button
  - View certificate (si pasó y es final)
  - Continue to next lesson
  - Share results (opcional)

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    🎉 ¡Felicidades!                             │
│                                                                  │
│                      ┌─────────┐                                │
│                      │    85%  │  ⭐ ¡Aprobado!                 │
│                      │  █████  │                                │
│                      └─────────┘                                │
│                                                                  │
│              8/10 Correctas • 2 Incorrectas                     │
│              Tiempo: 12:45 de 20:00                             │
│              Mejor que el 67% de estudiantes                    │
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│ │ ✅ 8     │ │ ❌ 2     │ │ ⏭️ 0     │                         │
│ │ Correct  │ │ Wrong    │ │ Skipped  │                         │
│ └──────────┘ └──────────┘ └──────────┘                         │
│                                                                  │
│ 📋 Review Your Answers                                          │
│ ▼ Question 1 ✅                                                 │
│   ¿Cuál es...?                                                  │
│   ✅ Your answer: B (Correct)                                   │
│                                                                  │
│ ▼ Question 2 ❌                                                 │
│   ¿Qué significa...?                                            │
│   ❌ Your answer: A (Incorrect)                                 │
│   ✅ Correct answer: C                                          │
│   💡 Explanation: ...                                           │
│                                                                  │
│ [🔄 Retake Quiz] [Continue Learning →]                          │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Score display con animación
- Confetti si aprobó
- Breakdown de resultados
- Review detallado de respuestas
- Actions buttons funcionando

---

#### T5.3: Rediseñar Assignment Submission Interface
**Prioridad**: 🔴 Crítica
**Estimación**: 8 horas
**Archivos**: `src/components/assignments/AssignmentSubmission.tsx`

**Vista Actual**: Form de submission básico
**Vista Objetivo**: Interface profesional con preview y validation

**Mejoras UX/UI**:
- [ ] Mejorar assignment brief section:
  - Title y descripción más visible
  - Due date con countdown timer
  - Points possible
  - Rubric preview (expandible)
  - Resources/attachments del assignment
- [ ] Mejorar file uploader:
  - Drag & drop area más grande y atractiva
  - Preview de archivos subidos (thumbnails para imágenes, icons para otros)
  - Progress bar durante upload
  - Validation de tipo de archivo y tamaño
  - Multiple files support con list view
- [ ] Agregar text editor (si aplica):
  - Rich text editor para respuestas de texto
  - Word count
  - Auto-save draft cada 30 segundos
- [ ] Agregar submission history:
  - Show previous submissions
  - Attempts used / total attempts allowed
  - Previous grades
- [ ] Mejorar submit flow:
  - Confirmation dialog
  - Success state con animation
  - Clear next steps

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back to Course]                                               │
│                                                                  │
│ 📝 Assignment: Análisis de Sistema de Calidad                   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 📋 Instructions                                              ││
│ │ ─────────────────────────────────────────────────────────   ││
│ │ Descripción completa del assignment...                      ││
│ │                                                              ││
│ │ 📎 Resources: [documento.pdf] [template.xlsx]               ││
│ │                                                              ││
│ │ 📊 Rubric: [View Detailed Rubric →]                         ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────┐ ┌──────────────────┐ ┌────────────┐              │
│ │ 📅 Due:  │ │ ⏱️ Due in 3 days │ │ 💯 100 pts │              │
│ │ Oct 15   │ │                  │ │            │              │
│ └──────────┘ └──────────────────┘ └────────────┘              │
│                                                                  │
│ 📤 Your Submission                                               │
│ ─────────────────────────────────────────────────────────────   │
│                                                                  │
│ [Text Editor Area con toolbar]                                  │
│ │ Write your response here...                                   │
│ │                                                               │
│ │ [500 words]                                                   │
│ └───────────────────────────────────────────────────────────────│
│                                                                  │
│ 📎 Attachments                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │     Drag & drop files here or click to browse               ││
│ │           [📁 Click to Upload]                              ││
│ │                                                              ││
│ │     Uploaded files:                                         ││
│ │     📄 analysis.pdf (2.5 MB) [X]                            ││
│ │     📊 data.xlsx (1.2 MB) [X]                               ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│ 📜 Submission History                                            │
│ Attempt 1 of 3 • Previous grade: 85/100                         │
│                                                                  │
│ [💾 Save Draft] [Submit Assignment →]                           │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Assignment brief claro y completo
- File uploader con drag & drop
- Preview de archivos
- Rich text editor si aplica
- Auto-save de drafts
- Submission history visible
- Confirmation en submit

---

#### T5.4: Rediseñar Assignment Grading Interface
**Prioridad**: 🔴 Crítica
**Estimación**: 10 horas
**Archivos**: `src/components/assignments/AssignmentGrading.tsx`, `src/components/assignments/BulkGradingInterface.tsx`

**Vista Actual**: Form de grading básico
**Vista Objetivo**: Interface profesional para instructores

**Mejoras UX/UI**:
- [ ] Implementar layout de 2 columnas:
  - Left: Student submission (viewer)
  - Right: Grading panel
- [ ] Mejorar submission viewer:
  - PDF viewer integrado para archivos
  - Image viewer con zoom
  - Text response con formatting preserved
  - Download all files button
- [ ] Mejorar grading panel:
  - Rubric-based grading (si hay rubric)
  - Points input con visual feedback
  - Grade slider alternative
  - Comments/feedback text area
  - Private notes (solo para instructor)
  - File attachments para feedback
- [ ] Agregar quick actions:
  - Save grade
  - Save and next student
  - Return to student
  - Flag for review
- [ ] Agregar student context:
  - Student name y avatar
  - Submission date
  - Previous submissions
  - Student's course progress
- [ ] Implementar bulk grading improvements:
  - Queue de submissions pendientes
  - Keyboard shortcuts para navegar
  - Quick grade templates
  - Bulk comments

**Estructura Propuesta**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Grading: Análisis de Sistema      [5/24 graded] [⚙️]  │
├──────────────────────────────────┬──────────────────────────────┤
│ 📄 Student Submission            │ 📊 Grading Panel             │
│ ──────────────────────────────   │ ──────────────────────────   │
│                                  │ 👤 John Doe                  │
│ [PDF Viewer / Text Display]     │ Submitted: Oct 14, 3:45 PM   │
│                                  │ ⏱️ On time                   │
│ Lorem ipsum student response...  │                              │
│                                  │ 💯 Grade                     │
│                                  │ ┌──────────────────────────┐ │
│                                  │ │ [85] / 100 points        │ │
│                                  │ │ ████████░░ 85%           │ │
│                                  │ └──────────────────────────┘ │
│                                  │                              │
│ 📎 Attachments (2):              │ 📋 Rubric Grading            │
│ • analysis.pdf (2.5 MB) [View]   │ ☑️ Content Quality: 40/40   │
│ • data.xlsx (1.2 MB) [Download]  │ ☑️ Analysis Depth: 30/35    │
│                                  │ ☑️ Formatting: 15/15        │
│                                  │ ☐ References: __/10         │
│                                  │                              │
│                                  │ 💬 Feedback to Student       │
│                                  │ ┌──────────────────────────┐ │
│                                  │ │ Great work on...         │ │
│                                  │ │                          │ │
│                                  │ │ [Templates▾]             │ │
│                                  │ └──────────────────────────┘ │
│                                  │                              │
│                                  │ 📎 Attach files              │
│                                  │                              │
│                                  │ 📝 Private Notes (internal)  │
│                                  │ [Text area...]               │
│                                  │                              │
│                                  │ [💾 Save] [Save & Next →]   │
└──────────────────────────────────┴──────────────────────────────┘
```

**Criterios de Aceptación**:
- Layout de 2 columnas funcional
- PDF/file viewer integrado
- Rubric grading si aplica
- Feedback text area con templates
- Save and next funcionando
- Keyboard shortcuts

---

#### T5.5: Mejorar Grade Viewer (Student Side)
**Prioridad**: 🟡 Media
**Estimación**: 4 horas
**Archivos**: `src/components/assignments/GradeViewer.tsx`

**Vista Actual**: Display de grade básico
**Vista Objetivo**: Vista detallada con feedback

**Mejoras UX/UI**:
- [ ] Agregar grade overview:
  - Score visual (circular progress)
  - Grade letter (A, B, C, etc.) si aplica
  - Passed/Failed indicator
  - Percentile (comparado con clase)
- [ ] Mostrar rubric breakdown si aplica
- [ ] Mostrar feedback del instructor destacado
- [ ] Mostrar archivos adjuntos de feedback
- [ ] Agregar action buttons:
  - View submission
  - Resubmit (si está permitido)
  - Ask question to instructor

**Criterios de Aceptación**:
- Grade display visual
- Rubric breakdown visible
- Feedback destacado
- Actions funcionando

---

## Fase 6: Administración y Gestión

### 🎯 Objetivo
Mejorar las interfaces administrativas para gestión de cursos, usuarios y contenido.

### 📦 Tareas

#### T6.1: Rediseñar Admin Course Management
**Prioridad**: 🔴 Crítica
**Estimación**: 10 horas
**Archivos**: `src/pages/admin/AdminCourses.tsx`, `src/pages/admin/AdminCourseForm.tsx`

**Vista Actual**: Tabla básica + form
**Vista Objetivo**: Interface moderna con mejor UX

**Mejoras UX/UI**:
- [ ] Mejorar tabla de cursos:
  - Usar shadcn Table con sorting
  - Agregar filtros: Published/Draft, Category, Instructor
  - Agregar search
  - Agregar bulk actions: Delete, Publish, Archive
  - Agregar quick actions en cada row: Edit, Preview, Duplicate, Analytics
  - Agregar stats por curso: Estudiantes, Rating, Revenue
- [ ] Rediseñar Course Form:
  - Multi-step wizard en lugar de form largo:
    - Step 1: Basic Info (title, description, thumbnail)
    - Step 2: Curriculum (módulos y lecciones)
    - Step 3: Pricing & Access
    - Step 4: Settings
    - Step 5: Review & Publish
  - Usar shadcn Form components
  - Agregar preview en tiempo real
  - Agregar auto-save de draft
  - Agregar validación visual mejorada
- [ ] Agregar course templates para crear rápido
- [ ] Agregar course duplication feature

**Criterios de Aceptación**:
- Tabla con sorting y filtering
- Wizard multi-step funcional
- Auto-save implementado
- Preview en tiempo real
- Templates funcionando

---

#### T6.2: Rediseñar Admin Lesson Management
**Prioridad**: 🔴 Crítica
**Estimación**: 8 horas
**Archivos**: `src/pages/admin/AdminLessons.tsx`

**Vista Actual**: Lista básica de lecciones
**Vista Objetivo**: Interface con mejor organización

**Mejoras UX/UI**:
- [ ] Implementar vista de árbol para módulos y lecciones:
  - Drag & drop para reordenar
  - Indent visual para jerarquía
  - Expand/collapse módulos
  - Quick actions: Edit, Delete, Duplicate, Preview
- [ ] Mejorar lesson form:
  - Tabs para diferentes tipos de contenido: Video, Text, Interactive, Quiz
  - Rich text editor para contenido de texto
  - Video upload con progress
  - Resources section para attachments
- [ ] Agregar bulk actions:
  - Move to module
  - Duplicate
  - Delete
  - Publish/Unpublish

**Criterios de Aceptación**:
- Tree view con drag & drop
- Lesson form con tabs
- Rich text editor
- Bulk actions funcionando

---

#### T6.3: Rediseñar Admin User Management
**Prioridad**: 🟡 Media
**Estimación**: 8 horas
**Archivos**: `src/pages/admin/AdminUsers.tsx`, `src/pages/admin/UserCreation.tsx`

**Vista Actual**: Tabla básica + form
**Vista Objetivo**: Interface moderna con búsqueda avanzada

**Mejoras UX/UI**:
- [ ] Mejorar tabla de usuarios:
  - Shadcn Table con sorting
  - Filtros: Role, Status (Active/Inactive), Registration Date
  - Search avanzado: por name, email, tenant
  - Bulk actions: Activate, Deactivate, Delete, Send Email
  - Quick actions: Edit, View Profile, Login As, Send Message
  - Avatar thumbnails
  - Status badges
- [ ] Mejorar user form:
  - Better layout con sections
  - Avatar upload con preview
  - Role selector con descriptions
  - Password generator
  - Send welcome email checkbox
- [ ] Agregar user detail view:
  - User profile overview
  - Enrolled courses
  - Progress summary
  - Activity timeline
  - Notes/comments section

**Criterios de Aceptación**:
- Tabla con filtros avanzados
- User form mejorado
- User detail view implementado
- Bulk actions funcionando

---

#### T6.4: Rediseñar Admin Analytics
**Prioridad**: 🟡 Media
**Estimación**: 12 horas
**Archivos**: `src/pages/admin/AdminAnalytics.tsx`, `src/components/progress/AdvancedReports.tsx`

**Vista Actual**: Dashboard con gráficas básicas
**Vista Objetivo**: Analytics avanzado con múltiples vistas

**Mejoras UX/UI**:
- [ ] Implementar tabs para diferentes reports:
  - Overview (KPIs principales)
  - Users Analytics (crecimiento, engagement)
  - Course Analytics (popularidad, completion rates)
  - Revenue Analytics (si aplica)
  - Engagement Analytics (activity heatmap, peak times)
- [ ] Mejorar visualizaciones:
  - Usar recharts con diseños profesionales
  - Agregar date range selector
  - Agregar comparison period (vs last month, vs last year)
  - Agregar export to PDF/Excel
- [ ] Agregar custom reports:
  - Report builder simple
  - Save custom reports
  - Schedule reports (email automático)

**Criterios de Aceptación**:
- Tabs de analytics funcionando
- Gráficas profesionales
- Date range selector
- Export funcionando

---

#### T6.5: Rediseñar Quiz Management
**Prioridad**: 🟡 Media
**Estimación**: 8 horas
**Archivos**: `src/pages/admin/AdminQuizzes.tsx`, `src/pages/admin/AdminQuizForm.tsx`, `src/pages/admin/QuizAnalyticsPage.tsx`

**Vista Actual**: Form básico de quiz
**Vista Objetivo**: Quiz builder avanzado

**Mejoras UX/UI**:
- [ ] Implementar quiz builder visual:
  - Add question button con tipos: Multiple Choice, True/False, Short Answer, etc.
  - Drag & drop para reordenar preguntas
  - Preview en tiempo real
  - Question bank (reutilizar preguntas)
- [ ] Mejorar question editor:
  - Rich text para pregunta
  - Image upload
  - Options editor con correct answer indicator
  - Explanation field (mostrar después de responder)
  - Points per question
- [ ] Agregar quiz settings:
  - Time limit
  - Passing score
  - Attempts allowed
  - Randomize questions
  - Show correct answers after completion
- [ ] Mejorar quiz analytics:
  - Question difficulty analysis
  - Most missed questions
  - Average time per question
  - Pass/fail rate

**Criterios de Aceptación**:
- Quiz builder visual funcional
- Drag & drop questions
- Preview en tiempo real
- Analytics detallados

---

#### T6.6: Mejorar Tenant Management
**Prioridad**: 🟢 Baja
**Estimación**: 6 horas
**Archivos**: `src/pages/admin/TenantManagement.tsx`, `src/pages/admin/TenantDetails.tsx`

**Vista Actual**: Tabla básica
**Vista Objetivo**: Gestión multi-tenant mejorada

**Mejoras UX/UI**:
- [ ] Mejorar tenant list:
  - Cards en lugar de tabla
  - Stats por tenant: Users, Courses, Storage
  - Status indicators: Active, Trial, Suspended
  - Quick actions: View, Edit, Settings, Billing
- [ ] Mejorar tenant detail view:
  - Overview con stats
  - Users list
  - Courses list
  - Settings & customization
  - Billing & usage

**Criterios de Aceptación**:
- Tenant cards visuales
- Detail view completo
- Actions funcionando

---

## Fase 7: Experiencia de Usuario Avanzada

### 🎯 Objetivo
Agregar features que mejoren significativamente la experiencia del usuario.

### 📦 Tareas

#### T7.1: Implementar Notifications Center Mejorado
**Prioridad**: 🟡 Media
**Estimación**: 8 horas
**Archivos**: `src/components/notifications/NotificationCenter.tsx`, componentes relacionados

**Componente Actual**: Notification center básico
**Componente Objetivo**: Centro de notificaciones profesional

**Mejoras UX/UI**:
- [ ] Rediseñar notification popover:
  - Header con "Mark all as read" y Settings
  - Tabs: All, Unread, Mentions
  - Notifications list con avatars
  - Timestamp relativo (hace 2 horas)
  - Mark as read on click
  - Delete notification
- [ ] Agregar notification types con iconos:
  - Course updates (🔔)
  - Grades posted (📊)
  - New assignment (📝)
  - Quiz available (❓)
  - Certificate ready (🎓)
  - Messages (💬)
- [ ] Agregar notification preferences:
  - Email notifications toggle
  - Push notifications toggle
  - Granular settings por tipo
- [ ] Agregar real-time con WebSocket (si backend lo soporta)
- [ ] Agregar badge con contador en header

**Estructura Propuesta**:
```
┌──────────────────────────────────────┐
│ 🔔 Notifications       [⚙️] [✓ All] │
│ ──────────────────────────────────── │
│ [All] [Unread (3)] [Mentions]        │
│ ──────────────────────────────────── │
│                                      │
│ 👤 📊 Grade Posted                   │
│    Your assignment "ISO Analysis"    │
│    has been graded: 85/100          │
│    2 hours ago                [✓]   │
│ ──────────────────────────────────── │
│ 👤 📝 New Assignment                 │
│    "Quality Audit Report" due in     │
│    3 days                            │
│    5 hours ago                [✓]   │
│ ──────────────────────────────────── │
│ 👤 🔔 Course Update                  │
│    New lesson added to ISO 9001      │
│    Yesterday                  [✓]   │
│ ──────────────────────────────────── │
│                                      │
│ [View All Notifications →]           │
└──────────────────────────────────────┘
```

**Criterios de Aceptación**:
- Popover con tabs
- Mark as read funcionando
- Preferences panel
- Real-time updates (si backend lo permite)
- Badge con contador

---

#### T7.2: Implementar Gamification UI Improvements
**Prioridad**: 🟢 Baja
**Estimación**: 8 horas
**Archivos**: `src/components/StreakTracker.tsx`, `src/components/ExperienceBar.tsx`, `src/components/WeeklyChallenges.tsx`

**Componentes Actuales**: Gamification básico
**Componentes Objetivo**: Gamification atractivo y motivador

**Mejoras UX/UI**:
- [ ] Mejorar Streak Tracker:
  - Visual más atractivo (calendario con checkmarks)
  - Animaciones de fuego para streaks largos
  - Milestone rewards (7 días, 30 días, 100 días)
  - Reminder notification si está por perder racha
- [ ] Mejorar Experience Bar:
  - Progress bar más visible
  - Level up animation con confetti
  - XP breakdown tooltip (cómo ganaste XP)
  - Next level preview
- [ ] Mejorar Weekly Challenges:
  - Cards más atractivas con progress
  - Reward preview
  - Celebration al completar
  - Share achievement button
- [ ] Agregar Achievements/Badges page:
  - Grid de badges
  - Locked/unlocked states
  - Progress to unlock
  - Share badges en redes sociales

**Criterios de Aceptación**:
- Streak tracker visual mejorado
- XP bar con animaciones
- Challenges cards atractivas
- Achievements page implementada

---

#### T7.3: Implementar Profile & Settings Mejorado
**Prioridad**: 🟡 Media
**Estimación**: 8 horas
**Archivos**: `src/pages/platform/ProfilePage.tsx`, `src/pages/platform/SettingsPage.tsx`

**Vista Actual**: Profile y settings básicos
**Vista Objetivo**: Profile completo con settings organizados

**Mejoras UX/UI para Profile**:
- [ ] Rediseñar profile page:
  - Hero section con cover image y avatar
  - Stats cards: Courses, Certificates, XP, Rank
  - Bio section editable
  - Achievements section
  - Recent activity timeline
  - Enrolled courses list
  - Public profile toggle
- [ ] Agregar profile edit modal
- [ ] Agregar avatar upload con crop

**Mejoras UX/UI para Settings**:
- [ ] Organizar settings en tabs:
  - Account (email, password, 2FA)
  - Profile (avatar, bio, social links)
  - Preferences (language, timezone, theme)
  - Notifications (email, push settings)
  - Privacy (public profile, data sharing)
  - Billing (si aplica)
- [ ] Usar shadcn Form components
- [ ] Agregar confirmaciones para cambios sensibles
- [ ] Agregar "Danger Zone" para delete account

**Criterios de Aceptación**:
- Profile page visual completo
- Avatar upload funcional
- Settings organizados en tabs
- Save changes funcionando

---

#### T7.4: Implementar Certificates Page Mejorado
**Prioridad**: 🟡 Media
**Estimación**: 6 horas
**Archivos**: `src/pages/platform/CertificatesPage.tsx`, `src/components/certificates/*`

**Vista Actual**: Lista de certificados
**Vista Objetivo**: Gallery de certificados atractiva

**Mejoras UX/UI**:
- [ ] Implementar grid de certificados:
  - Thumbnail visual del certificado
  - Course name y completion date
  - Hover effects con quick actions
  - Filter: All, Recent, By Course
- [ ] Mejorar certificate preview:
  - Modal con preview grande
  - Download button
  - Share button (LinkedIn, Twitter)
  - Verify certificate link
- [ ] Agregar certificate verification page pública
- [ ] Agregar "Share achievements" feature

**Criterios de Aceptación**:
- Grid visual de certificados
- Preview modal funcionando
- Download y share funcionando
- Verification page pública

---

#### T7.5: Implementar Onboarding Mejorado
**Prioridad**: 🟡 Media
**Estimación**: 8 horas
**Archivos**: `src/components/onboarding/FirstDayExperience.tsx`, componentes relacionados

**Componente Actual**: Onboarding básico
**Componente Objetivo**: Onboarding guiado paso a paso

**Mejoras UX/UI**:
- [ ] Implementar onboarding wizard:
  - Welcome screen con animación
  - Profile setup (avatar, bio)
  - Interests selection
  - Recommended courses
  - Tour de la plataforma
- [ ] Agregar tooltips interactivos para features principales
- [ ] Agregar checklist de primeros pasos:
  - Complete profile
  - Enroll in first course
  - Complete first lesson
  - Take first quiz
- [ ] Agregar skip option pero guardar progreso
- [ ] Agregar "Re-take tour" option en settings

**Criterios de Aceptación**:
- Wizard multi-step funcional
- Tooltips interactivos
- Checklist visible en dashboard
- Re-take tour disponible

---

#### T7.6: Implementar Search Mejorado
**Prioridad**: 🟡 Media
**Estimación**: 6 horas
**Archivos**: Nuevo componente de search

**Componente Nuevo**: Search global avanzado

**Mejoras UX/UI**:
- [ ] Implementar search con autocomplete
- [ ] Agregar filters en search results:
  - Type: Courses, Lessons, Assignments, Users
  - Date range
  - Relevance sort
- [ ] Agregar search history
- [ ] Agregar popular searches
- [ ] Highlight search terms en results

**Criterios de Aceptación**:
- Autocomplete funcional
- Filters funcionando
- Search history guardada
- Highlight en resultados

---

## Fase 8: Refinamiento y Optimización

### 🎯 Objetivo
Pulir detalles, optimizar performance y asegurar consistencia.

### 📦 Tareas

#### T8.1: Implementar Dark Mode Completo
**Prioridad**: 🟡 Media
**Estimación**: 8 horas
**Archivos**: Múltiples, theme configuration

**Estado Actual**: Theme context existe
**Estado Objetivo**: Dark mode completo y pulido

**Tareas**:
- [ ] Revisar todos los componentes para dark mode
- [ ] Ajustar colores en theme para dark mode:
  - Backgrounds
  - Borders
  - Text colors
  - Shadows
- [ ] Agregar smooth transition entre themes
- [ ] Persistir preferencia en localStorage
- [ ] Respetar preferencia del sistema (prefers-color-scheme)
- [ ] Agregar toggle en header

**Criterios de Aceptación**:
- Todos los componentes funcionan en dark mode
- Transición suave entre themes
- Preferencia persistida
- Toggle accesible

---

#### T8.2: Optimizar Loading States
**Prioridad**: 🟡 Media
**Estimación**: 6 horas
**Archivos**: Múltiples componentes

**Estado Actual**: Loading spinners básicos
**Estado Objetivo**: Loading states consistentes y atractivos

**Tareas**:
- [ ] Reemplazar todos los spinners con shadcn Skeleton donde sea apropiado
- [ ] Agregar loading states para:
  - Initial page load
  - Data fetching
  - Form submission
  - File upload
  - Navigation transitions
- [ ] Implementar Suspense boundaries
- [ ] Agregar empty states atractivos

**Criterios de Aceptación**:
- Skeletons en todas las vistas principales
- Empty states diseñados
- Suspense boundaries implementados

---

#### T8.3: Mejorar Error Handling UI
**Prioridad**: 🟡 Media
**Estimación**: 6 horas
**Archivos**: `src/components/ui/ErrorState.tsx`, `src/components/ErrorBoundary.tsx`

**Estado Actual**: Error states básicos
**Estado Objetivo**: Error handling profesional

**Tareas**:
- [ ] Rediseñar ErrorState component:
  - Ilustraciones para diferentes tipos de errores
  - Clear error messages
  - Suggested actions
  - Retry button
  - Contact support link
- [ ] Mejorar ErrorBoundary:
  - Fallback UI atractivo
  - Log errors apropiadamente
  - Recovery options
- [ ] Agregar error types específicos:
  - 404 Not Found (página personalizada)
  - 403 Forbidden
  - 500 Server Error
  - Network Error
  - Timeout Error

**Criterios de Aceptación**:
- Error states visuales mejorados
- ErrorBoundary funcional
- 404 page personalizada
- Recovery options funcionando

---

#### T8.4: Optimizar Animaciones y Transiciones
**Prioridad**: 🟢 Baja
**Estimación**: 6 horas
**Archivos**: Múltiples componentes

**Estado Actual**: Algunas animaciones con Framer Motion
**Estado Objetivo**: Animaciones consistentes y performantes

**Tareas**:
- [ ] Definir transiciones estándar para:
  - Page transitions
  - Modal open/close
  - Dropdown open/close
  - List item hover
  - Button hover/active
- [ ] Reducir uso de Framer Motion donde no sea necesario
- [ ] Usar CSS transitions para animaciones simples
- [ ] Agregar `prefers-reduced-motion` support
- [ ] Optimizar animaciones para 60fps

**Criterios de Aceptación**:
- Transiciones consistentes
- Performance 60fps
- Reduced motion support
- No janky animations

---

#### T8.5: Mejorar Responsive Design
**Prioridad**: 🟡 Media
**Estimación**: 10 horas
**Archivos**: Múltiples componentes

**Estado Actual**: Responsive parcial
**Estado Objetivo**: Mobile-first design completo

**Tareas**:
- [ ] Auditar todos los componentes en:
  - Mobile (320px - 768px)
  - Tablet (768px - 1024px)
  - Desktop (1024px+)
- [ ] Ajustar layouts problemáticos
- [ ] Implementar Sheet para modals en móvil
- [ ] Mejorar touch targets (mínimo 44x44px)
- [ ] Mejorar navigation en móvil
- [ ] Optimizar tables para móvil (scroll horizontal o cards)
- [ ] Probar en dispositivos reales

**Criterios de Aceptación**:
- Todos los componentes responsive
- Touch targets apropiados
- Navigation móvil mejorada
- Probado en múltiples dispositivos

---

#### T8.6: Mejorar Accesibilidad (a11y)
**Prioridad**: 🟡 Media
**Estimación**: 8 horas
**Archivos**: Múltiples componentes

**Estado Actual**: Accesibilidad básica
**Estado Objetivo**: WCAG 2.1 AA compliance

**Tareas**:
- [ ] Auditar con herramientas:
  - Lighthouse
  - axe DevTools
  - Screen reader testing
- [ ] Corregir issues encontrados:
  - Color contrast
  - ARIA labels
  - Keyboard navigation
  - Focus management
  - Alt text para imágenes
- [ ] Agregar skip links
- [ ] Mejorar form labels y errors
- [ ] Agregar live regions para updates dinámicos

**Criterios de Aceptación**:
- Lighthouse a11y score > 90
- Keyboard navigation funcional
- Screen reader friendly
- Color contrast AA compliant

---

#### T8.7: Implementar Performance Optimizations
**Prioridad**: 🟡 Media
**Estimación**: 10 horas
**Archivos**: Múltiples, configuración de Vite

**Estado Actual**: Performance básica
**Estado Objetivo**: Performance optimizada

**Tareas**:
- [ ] Implementar code splitting agresivo
- [ ] Lazy load todas las rutas
- [ ] Optimizar imágenes:
  - Lazy loading
  - Responsive images
  - WebP format
- [ ] Implementar virtual scrolling para listas largas
- [ ] Optimizar React Query caching:
  - Stale time apropiado
  - Cache time apropiado
  - Background refetching inteligente
- [ ] Memoizar componentes pesados
- [ ] Reducir bundle size:
  - Tree shaking
  - Remove unused dependencies
  - Analyze bundle con vite-bundle-visualizer
- [ ] Implementar service worker para caching (opcional)

**Criterios de Aceptación**:
- Lighthouse performance score > 85
- First Contentful Paint < 2s
- Time to Interactive < 3.5s
- Bundle size reducido 20%

---

#### T8.8: Crear Design System Documentation
**Prioridad**: 🟢 Baja
**Estimación**: 6 horas
**Archivos**: `docs/DESIGN_SYSTEM.md`

**Objetivo**: Documentar el sistema de diseño para futuros desarrolladores

**Tareas**:
- [ ] Documentar design tokens:
  - Colors
  - Typography
  - Spacing
  - Shadows
  - Border radius
- [ ] Documentar componentes con ejemplos
- [ ] Crear guía de uso de shadcn components
- [ ] Documentar patterns comunes:
  - Forms
  - Tables
  - Cards
  - Modals
- [ ] Crear Storybook (opcional pero recomendado)

**Criterios de Aceptación**:
- Documentación completa
- Ejemplos de código
- Screenshots de componentes
- Storybook setup (opcional)

---

#### T8.9: Testing y QA Final
**Prioridad**: 🔴 Crítica
**Estimación**: 16 horas
**Archivos**: Test files, QA checklist

**Objetivo**: Asegurar que todo funciona correctamente

**Tareas**:
- [ ] Crear checklist de QA completo
- [ ] Testing manual de todos los flujos:
  - Student flows
  - Instructor flows
  - Admin flows
  - Auth flows
- [ ] Testing en diferentes browsers:
  - Chrome
  - Firefox
  - Safari
  - Edge
- [ ] Testing en diferentes dispositivos:
  - iOS
  - Android
  - Tablet
- [ ] Testing de performance
- [ ] Testing de accesibilidad
- [ ] Fix bugs encontrados
- [ ] Update tests automatizados si es necesario

**Criterios de Aceptación**:
- Checklist completado 100%
- Critical bugs: 0
- High bugs: 0
- Medium/Low bugs: documentados

---

#### T8.10: Migration Guide y Training
**Prioridad**: 🟡 Media
**Estimación**: 4 horas
**Archivos**: `docs/MIGRATION_GUIDE.md`, `docs/TRAINING.md`

**Objetivo**: Facilitar la adopción del nuevo UI

**Tareas**:
- [ ] Crear migration guide:
  - Qué cambió
  - Breaking changes (si hay)
  - Cómo usar nuevos componentes
  - Ejemplos de migración
- [ ] Crear video tutorial (opcional)
- [ ] Crear training materials para usuarios:
  - New features
  - How to use new UI
  - Tips and tricks
- [ ] Documentar keyboard shortcuts

**Criterios de Aceptación**:
- Migration guide completo
- Training materials creados
- Shortcuts documentados

---

## 📊 Resumen de Prioridades

### 🔴 Críticas (Hacer primero)
- Fase 0: Setup completo
- T1.1, T1.2, T1.3: Componentes base (Button, Card, Forms)
- T2.1, T2.2: Sidebar y Header
- T3.1, T3.2, T3.3: Dashboards principales
- T4.1, T4.2: Course detail y viewer
- T5.1, T5.3, T5.4: Quizzes y assignments
- T6.1, T6.2: Admin course y lesson management
- T8.9: Testing final

### 🟡 Media (Hacer después)
- T1.4, T1.5: Alerts y loading states
- T2.3: Command palette
- T3.4: Progress page
- T4.3: Courses list
- T5.2, T5.5: Quiz results y grade viewer
- T6.3, T6.4, T6.5: Admin users, analytics, quizzes
- T7.1, T7.3, T7.4, T7.5, T7.6: Features avanzados
- T8.1, T8.2, T8.3, T8.5, T8.6, T8.7, T8.10: Optimizaciones

### 🟢 Baja (Hacer al final o si hay tiempo)
- T2.4: Breadcrumbs mejorados
- T4.4: Interactive content viewer
- T6.6: Tenant management
- T7.2: Gamification
- T8.4: Animaciones
- T8.8: Documentation

---

## 🎯 Roadmap Sugerido

### Sprint 1 (2-3 semanas): Fundamentos
- Fase 0: Setup completo
- Fase 1: Sistema de diseño base
- T2.1, T2.2: Layout principal

### Sprint 2 (2-3 semanas): Dashboards
- Fase 3: Todos los dashboards
- T3.1, T3.2, T3.3

### Sprint 3 (3-4 semanas): Contenido Educativo
- Fase 4: Cursos y contenido
- T4.1, T4.2, T4.3

### Sprint 4 (3-4 semanas): Evaluaciones
- Fase 5: Quizzes y assignments
- T5.1, T5.2, T5.3, T5.4, T5.5

### Sprint 5 (2-3 semanas): Administración
- Fase 6: Admin interfaces
- T6.1, T6.2, T6.3, T6.4, T6.5

### Sprint 6 (2-3 semanas): Features Avanzados
- Fase 7: UX avanzada
- T7.1, T7.3, T7.4, T7.5

### Sprint 7 (2-3 semanas): Refinamiento
- Fase 8: Optimización y pulido
- T8.1 a T8.10

**Total Estimado**: 16-23 semanas (4-6 meses)

---

## 📝 Notas Importantes

### Principios a Mantener

1. **No Romper Funcionalidad Existente**
   - Cada refactorización debe mantener la funcionalidad actual
   - Hacer tests antes y después de cada cambio mayor
   - Usar feature flags si es necesario para cambios grandes

2. **Migración Gradual**
   - No intentar cambiar todo de una vez
   - Empezar con componentes base y ir subiendo
   - Permitir convivencia de componentes viejos y nuevos temporalmente

3. **Consistencia Visual**
   - Seguir el design system establecido
   - Usar componentes de shadcn como base
   - Mantener colores corporativos

4. **Accesibilidad Primero**
   - Cada componente debe ser accesible
   - Probar con keyboard navigation
   - Probar con screen readers

5. **Performance**
   - Optimizar imágenes
   - Code splitting
   - Lazy loading
   - Memoización cuando sea necesario

### Recursos Necesarios

- **Diseñador UX/UI**: Para mockups detallados (opcional pero recomendado)
- **Desarrolladores Frontend**: 1-2 developers full-time
- **QA Tester**: Para testing exhaustivo
- **Stakeholders**: Para feedback y aprobación de diseños

### Herramientas Recomendadas

- **Figma**: Para diseños y mockups
- **Storybook**: Para documentar componentes
- **Lighthouse**: Para auditorías de performance y a11y
- **axe DevTools**: Para auditorías de accesibilidad
- **React DevTools**: Para debugging
- **Vite Bundle Visualizer**: Para analizar bundle size

---

## ✅ Definition of Done

Cada tarea se considera completa cuando:

1. ✅ Código implementado y funcionando
2. ✅ Tests actualizados (si aplica)
3. ✅ Responsive design verificado
4. ✅ Accesibilidad verificada
5. ✅ Dark mode funcional (si aplica)
6. ✅ Performance aceptable (no regresiones)
7. ✅ Code review completado
8. ✅ QA testing pasado
9. ✅ Documentación actualizada (si aplica)
10. ✅ Deployed a staging para review

---

## 🚀 Getting Started

Para empezar con este backlog:

1. **Review y Priorización**
   - Revisar este backlog con el equipo
   - Ajustar prioridades según necesidades del negocio
   - Estimar esfuerzo más detalladamente

2. **Setup Inicial**
   - Completar Fase 0 completa
   - Configurar entorno de desarrollo
   - Crear branch de feature

3. **Crear Tickets**
   - Crear tickets en tu sistema de tracking (Jira, Linear, etc.)
   - Asignar a desarrolladores
   - Definir sprints

4. **Comenzar Desarrollo**
   - Empezar por componentes base
   - Hacer reviews frecuentes
   - Iterar basado en feedback

---

**Última actualización**: 2025-11-10
**Autor**: Claude (Anthropic)
**Proyecto**: Stegmaier LMS Platform Redesign
