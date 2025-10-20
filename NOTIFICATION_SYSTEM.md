# Sistema de Notificaciones LMS - Documentación Completa

## Resumen General

El sistema de notificaciones de Stegmaier LMS implementa una solución completa que combina notificaciones web push, emails con templates responsive y un centro de notificaciones en tiempo real, siguiendo los principios de desarrollo del EncoderGroup para arquitectura limpia, escalable y mantenible.

## Arquitectura del Sistema

### Backend Components

#### 1. Dominio (Domain Layer)
**Archivo**: `backend/app/domain/entities/notification.py`
- **Entidad Notification**: Modelo principal con tipos, estados, metadata y acciones
- **Tipos soportados**: Course completion, progress, enrollment, quiz completion, announcements, system updates, reminders, achievements
- **Estados**: unread, read, archived
- **Metadata flexible**: Información contextual de cursos, lecciones, quizzes, certificados

#### 2. Servicios de Aplicación
**Archivo**: `backend/app/application/services/notification_service.py`
- **NotificationService**: CRUD completo para notificaciones
- **Métodos específicos del dominio**: 
  - `send_course_completion_notification()`
  - `send_progress_notification()`
  - `send_enrollment_notification()`
  - `send_quiz_completion_notification()`
  - `send_new_course_announcement()`
- **Filtrado avanzado**: Por estado, tipo, fecha, paginación
- **Bulk operations**: Creación y marcado masivo

#### 3. Endpoints API
**Archivo**: `backend/app/api/v1/endpoints/notifications.py`
- **GET /notifications**: Lista paginada con filtros
- **POST /notifications**: Crear notificación
- **GET /notifications/unread/count**: Contador en tiempo real
- **PUT /notifications/{id}/read**: Marcar como leída
- **DELETE /notifications/{id}**: Eliminar notificación
- **POST /notifications/mark-all-read**: Marcado masivo
- **Endpoints específicos**: Course completion, progress, enrollment, quiz completion, announcements

#### 4. Sistema de Email
**Archivo**: `backend/app/infrastructure/email/email_service.py`
- **EmailService**: Envío de emails con SMTP y templates Jinja2
- **Templates responsive**: Welcome, course completion, reminders, new courses, password reset
- **Configuración**: Variables de entorno para SMTP, branding personalizable
- **Error handling**: Logging detallado y fallback graceful

### Frontend Components

#### 1. Context API para Estado Global
**Archivo**: `frontend/src/contexts/NotificationContext.tsx`
- **NotificationContext**: Gestión centralizada del estado
- **Funcionalidades**:
  - Carga paginada de notificaciones
  - Conteo de no leídas en tiempo real
  - CRUD completo con optimistic updates
  - Integración con Push Notifications API
  - Manejo de preferencias del usuario
  - Error handling y recovery

#### 2. Componentes de UI

##### NotificationCenter
**Archivo**: `frontend/src/components/notifications/NotificationCenter.tsx`
- **Modal completo** con tabs para notificaciones y preferencias
- **Filtrado avanzado**: Por estado (all, unread, read, archived)
- **Acciones masivas**: Marcar todas como leídas
- **Carga infinita**: Paginación automática con Intersection Observer

##### NotificationList
**Archivo**: `frontend/src/components/notifications/NotificationList.tsx`
- **Virtual scrolling** optimizado para grandes volúmenes
- **Estados**: Loading, empty, error con UX apropiada
- **Carga automática**: Intersection Observer para infinite scroll

##### NotificationItem
**Archivo**: `frontend/src/components/notifications/NotificationItem.tsx`
- **Acciones individuales**: Read/unread, archive, delete
- **Tipos visuales**: Iconos y colores diferenciados por tipo
- **Acciones contextuales**: Dropdown menú con confirmaciones
- **Formateo temporal**: Timestamps relativos en español

##### HeaderNotifications
**Archivo**: `frontend/src/components/header/sub/HeaderNotifications.tsx`
- **Dropdown compacto** para vista rápida
- **Badge animado** con contador de no leídas
- **Integración completa** con NotificationCenter
- **Fallback UX**: Manejo elegante de errores

#### 3. Servicios

##### Web Push Notifications
**Archivo**: `frontend/src/services/pushNotificationService.ts`
- **Service Worker registration**: Manejo completo del ciclo de vida
- **VAPID keys**: Configuración segura con variables de entorno
- **Subscription management**: Sincronización con backend
- **Permission handling**: Estados y flujo de permisos
- **Background sync**: Offline support y retry logic

##### NotificationService
**Archivo**: `frontend/src/services/notificationService.ts`
- **API client completa**: Integración con todos los endpoints
- **Type mapping**: Conversión entre backend y frontend types
- **Error handling**: Retry logic y fallback strategies
- **Caching strategy**: Optimización de requests repetitivos

#### 4. Service Worker
**Archivo**: `frontend/public/sw.js`
- **Caching strategies**: Static assets y API responses
- **Push event handling**: Recepción y display de notificaciones
- **Background sync**: Offline actions y retry queue
- **Click handling**: Navegación contextual desde notificaciones

## Tipos de Notificaciones Implementadas

### 1. Course Completion
- **Trigger**: Cuando un estudiante completa un curso
- **Canales**: Email, Push, In-app
- **Metadata**: Course name, completion date, certificate availability
- **Email template**: Congratulatory design con certificado

### 2. Course Progress  
- **Trigger**: Avance significativo en un curso
- **Canales**: Push, In-app (Email opcional)
- **Metadata**: Progress percentage, lessons completed, time spent
- **Frecuencia**: Configurable (daily, weekly)

### 3. Course Enrollment
- **Trigger**: Inscripción exitosa en un curso
- **Canales**: Email, In-app
- **Metadata**: Course details, instructor, start date
- **Email template**: Welcome y próximos pasos

### 4. Quiz Completion
- **Trigger**: Finalización de un quiz
- **Canales**: Push, In-app
- **Metadata**: Quiz score, pass/fail status, feedback
- **Actions**: Ver resultados, continuar curso

### 5. New Course Announcements
- **Trigger**: Publicación de nuevos cursos
- **Canales**: Email, In-app
- **Metadata**: Course details, launch offer, early access
- **Email template**: Marketing-focused con CTA

### 6. System Updates
- **Trigger**: Mantenimiento, nuevas features
- **Canales**: In-app, Email (críticos)
- **Metadata**: Update type, impact, action required
- **Frecuencia**: Immediate para críticos

### 7. Reminders
- **Trigger**: Cursos inactivos, deadlines
- **Canales**: Email, Push
- **Metadata**: Last activity, recommended actions
- **Frecuencia**: Configurable por usuario

## Flujo End-to-End

### 1. Creación de Notificación (Backend)
```python
# Ejemplo: Course completion
notification_service.send_course_completion_notification(
    user_id=user_id,
    course_id=course_id,
    certificate_url=cert_url
)
```

### 2. Procesamiento
1. **Crear entidad** en base de datos
2. **Enviar email** con template apropiado
3. **Push notification** si está habilitada
4. **Update contador** de no leídas

### 3. Frontend Reception
1. **Context refresh** automático
2. **UI update** en HeaderNotifications
3. **Push display** en navegador
4. **Badge animation** para contador

### 4. User Interaction
1. **Click notificación**: Navegación contextual
2. **Mark as read**: Update local y backend
3. **Manage preferences**: Por tipo y canal

## Configuración Requerida

### Variables de Entorno Backend
```bash
# SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=notifications@stegmaier.com
SMTP_PASSWORD=app_password
FROM_EMAIL=notifications@stegmaier.com
FROM_NAME="Stegmaier LMS"

# Template Configuration
FRONTEND_URL=https://app.stegmaier.com
SUPPORT_EMAIL=support@stegmaier.com
```

### Variables de Entorno Frontend
```bash
# Push Notifications
REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### VAPID Keys Setup
```bash
# Generar keys para push notifications
npx web-push generate-vapid-keys
```

## Integración y Testing

### 1. Desarrollo
```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Frontend  
cd frontend
npm install
npm run dev
```

### 2. Testing Manual
1. **Crear usuario** y realizar login
2. **Inscribirse en curso** → Verificar email de bienvenida
3. **Completar lecciones** → Verificar notificación de progreso
4. **Finalizar curso** → Verificar email de completion y certificado
5. **Abrir NotificationCenter** → Verificar UI completa
6. **Configurar preferencias** → Verificar persistencia

### 3. Push Notifications Testing
1. **Permitir notificaciones** en navegador
2. **Completar acción** que genere notificación
3. **Minimizar navegador** → Verificar push notification
4. **Click push** → Verificar navegación correcta

## Arquitectura de Archivos

```
backend/
├── app/
│   ├── domain/entities/notification.py
│   ├── application/services/notification_service.py
│   ├── api/v1/endpoints/notifications.py
│   └── infrastructure/email/
│       ├── email_service.py
│       └── templates/
│           ├── welcome.html
│           ├── course_completion.html
│           ├── course_reminder.html
│           └── new_course.html

frontend/
├── src/
│   ├── contexts/NotificationContext.tsx
│   ├── components/notifications/
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationList.tsx
│   │   ├── NotificationItem.tsx
│   │   └── NotificationPreferences.tsx
│   ├── services/
│   │   ├── pushNotificationService.ts
│   │   └── notificationService.ts
│   ├── types/notification.ts
│   └── components/header/sub/HeaderNotifications.tsx
└── public/sw.js
```

## Próximas Mejoras

### 1. Analytics y Métricas
- Open rates para emails
- Click-through rates para push notifications
- User engagement metrics
- A/B testing para templates

### 2. Personalization
- ML-based notification timing
- Content personalization por user behavior
- Smart frequency adjustment
- Notification batching inteligente

### 3. Advanced Features
- Rich notifications con images/actions
- Notification scheduling y delays
- Multi-language template support
- Integration con external providers (OneSignal, Firebase)

### 4. Performance Optimizations  
- CDN para email assets
- Background sync improvements
- Caching strategies optimization
- Database indexing para queries complejas

## Soporte y Mantenimiento

### Logs y Debugging
- **Backend logs**: Structured logging para email sending y push notifications
- **Frontend errors**: Error boundary y Sentry integration
- **Service Worker**: Debug tools y fallback strategies

### Monitoring
- **Email delivery rates**: SMTP logs y bounce handling
- **Push subscription health**: Active subscriptions tracking
- **API performance**: Response times y error rates
- **User engagement**: Notification interaction analytics

Este sistema de notificaciones está diseñado para ser completamente funcional, escalable y fácil de mantener, siguiendo las mejores prácticas del EncoderGroup y proporcionando una experiencia de usuario excepcional en la plataforma Stegmaier LMS.
