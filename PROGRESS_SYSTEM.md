# Sistema de Progreso de Videos - Documentación Técnica

## Resumen General

El sistema de progreso de videos implementa un seguimiento granular del progreso de visualización de videos, incluyendo marcadores (bookmarks), notas, y tracking detallado de sesiones. El sistema está diseñado para proporcionar una experiencia de aprendizaje avanzada con funcionalidades similares a plataformas modernas como YouTube o Netflix.

## Arquitectura del Sistema

### Backend

#### 1. Entidades de Dominio (`backend/app/domain/entities/progress.py`)

**VideoProgress**
- Tracking granular de progreso de video
- Campos: posición actual, duración, porcentaje visto, estado de completado
- Información de sesiones y tiempo total de visualización
- Referencias a marcadores y notas

**VideoBookmark**
- Marcadores en timestamps específicos
- Campos: timestamp, título, descripción, metadatos

**VideoNote**
- Notas privadas del usuario en timestamps específicos
- Campos: timestamp, contenido, privacidad, metadatos

#### 2. Repositorio (`backend/app/domain/repositories/progress_repository.py`)

**ProgressRepository (Interface)**
- Define contratos para CRUD de progreso, marcadores y notas
- Métodos async para operaciones de base de datos
- Abstracción para futura migración a diferentes backends de persistencia

**FileSystemProgressRepository (Implementación)**
- Implementación basada en archivos JSON
- Almacenamiento local para desarrollo y testing
- Generación automática de IDs únicos
- Manejo robusto de errores y carga/guardado

#### 3. Servicio de Aplicación (`backend/app/application/services/progress_service.py`)

**ProgressService**
- Lógica de negocio para gestión de progreso
- Cálculo automático de porcentajes de completado
- Tracking de sesiones y tiempo de visualización
- Gestión de marcadores y notas
- Generación de resúmenes de progreso

#### 4. API Endpoints (`backend/app/api/v1/endpoints/progress.py`)

**Endpoints RESTful:**
- `PUT /progress/videos/{lesson_id}/{video_id}` - Actualizar progreso
- `GET /progress/videos/{lesson_id}/{video_id}` - Obtener progreso
- `POST /progress/videos/{lesson_id}/{video_id}/bookmarks` - Crear marcador
- `GET /progress/videos/{lesson_id}/{video_id}/bookmarks` - Listar marcadores
- `POST /progress/videos/{lesson_id}/{video_id}/notes` - Crear nota
- `GET /progress/videos/{lesson_id}/{video_id}/notes` - Listar notas
- `GET /progress/summary` - Resumen general de progreso

#### 5. Integración del Sistema (`backend/app/dependencies.py`, `backend/app/api/v1/api.py`)

- Inyección de dependencias configurada
- Router integrado en API principal
- Autenticación JWT requerida en todos los endpoints

### Frontend

#### 1. Servicio de Progreso (`frontend/src/services/progressService.ts`)

**ProgressService (Clase)**
- Cliente HTTP para comunicación con API
- Métodos para todas las operaciones CRUD
- Utilidades de formateo y cálculo
- Manejo de errores y tipos TypeScript

#### 2. Componente Reproductor Avanzado (`frontend/src/components/video/AdvancedVideoPlayer.tsx`)

**AdvancedVideoPlayer (Componente React)**
- Reproductor de video personalizado con controles avanzados
- Auto-guardado de progreso cada 5 segundos
- Interfaz para marcadores y notas
- Controles de velocidad, volumen, pantalla completa
- Indicadores visuales de progreso en barra de progreso
- Modales para creación de marcadores y notas

#### 3. Página de Visualización de Curso (`frontend/src/pages/platform/CourseViewPage.tsx`)

**CourseViewPage (Componente React)**
- Interfaz completa de curso con sidebar de lecciones
- Integración del reproductor avanzado
- Tracking de progreso por lección y curso completo
- Navegación entre lecciones
- Auto-avance al completar lecciones
- Soporte para lecciones de video y texto

#### 4. Rutas Actualizadas (`frontend/src/routes/index.tsx`)

- Ruta `/platform/courses/:courseId/view` para visualización de cursos
- Integración con sistema de autenticación
- Layout responsivo

## Flujo de Datos

### 1. Carga Inicial
```
CourseViewPage → loadCourseData() → API Course + Progress Services → Estado Local
```

### 2. Reproducción de Video
```
AdvancedVideoPlayer → timeupdate event → debouncedSaveProgress() → API Progress Update
```

### 3. Creación de Marcadores/Notas
```
User Action → Modal → API Create Bookmark/Note → Local State Update
```

### 4. Navegación entre Lecciones
```
Lesson Navigation → Progress Calculation → Auto-advance Logic → Course Completion
```

## Características Técnicas

### Persistencia
- **Desarrollo**: Archivos JSON locales
- **Producción**: Preparado para migración a PostgreSQL/MongoDB
- **Backup**: Estructura de archivos organizados por usuario

### Performance
- **Debounced Saving**: Guardado cada 5 segundos durante reproducción
- **Lazy Loading**: Carga bajo demanda de marcadores y notas
- **Optimistic UI**: Actualizaciones instantáneas en interfaz

### Seguridad
- **Autenticación JWT**: Obligatoria en todos los endpoints
- **Aislamiento de Usuarios**: Cada usuario solo ve su progreso
- **Validación**: Doble validación frontend/backend

### Escalabilidad
- **Arquitectura Modular**: Servicios independientes
- **Interfaces Abstractas**: Fácil migración de persistencia
- **Microservices Ready**: Preparado para separación de servicios

## Configuración

### Variables de Entorno
```env
MEDIA_ROOT=/path/to/media/storage
JWT_SECRET_KEY=your-secret-key
API_BASE_URL=http://localhost:8000
```

### Estructura de Archivos
```
media/
├── progress/
│   ├── user_{user_id}/
│   │   ├── progress.json
│   │   ├── bookmarks.json
│   │   └── notes.json
│   └── ...
└── videos/
    └── ...
```

## API Documentation

### Actualizar Progreso
```http
PUT /api/v1/progress/videos/{lesson_id}/{video_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "current_position": 120.5,
  "duration": 1800,
  "session_time": 300
}
```

**Respuesta:**
```json
{
  "progress": {
    "lesson_id": "lesson_123",
    "video_id": "video_456",
    "current_position": 120.5,
    "duration": 1800,
    "watch_percentage": 6.69,
    "is_completed": false,
    "total_watch_time": 2400,
    "sessions_count": 3,
    "last_watched": "2024-01-15T10:30:00Z",
    "bookmarks": 2,
    "notes": 1
  }
}
```

### Crear Marcador
```http
POST /api/v1/progress/videos/{lesson_id}/{video_id}/bookmarks
Content-Type: application/json
Authorization: Bearer {token}

{
  "timestamp": 120.5,
  "title": "Concepto Importante",
  "description": "Explicación de algoritmos de ordenamiento"
}
```

### Crear Nota
```http
POST /api/v1/progress/videos/{lesson_id}/{video_id}/notes
Content-Type: application/json
Authorization: Bearer {token}

{
  "timestamp": 180.0,
  "content": "Recordar revisar este ejemplo más tarde",
  "is_private": true
}
```

## Testing

### Backend Tests
```bash
# Ejecutar tests unitarios
pytest backend/tests/test_progress_service.py

# Ejecutar tests de integración
pytest backend/tests/test_progress_api.py

# Coverage
pytest --cov=backend/app/application/services/progress_service
```

### Frontend Tests
```bash
# Tests de componentes
npm test -- --testPathPattern=AdvancedVideoPlayer

# Tests de servicios
npm test -- --testPathPattern=progressService

# E2E tests
npm run e2e:progress
```

## Métricas y Monitoreo

### Métricas Clave
- **Engagement Rate**: Porcentaje de videos completados
- **Session Duration**: Tiempo promedio por sesión
- **Dropout Rate**: Puntos donde usuarios abandonan videos
- **Feature Usage**: Uso de marcadores y notas

### Logs
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "user_id": "user_123",
  "action": "progress_update",
  "lesson_id": "lesson_456",
  "video_id": "video_789",
  "current_position": 120.5,
  "session_duration": 300
}
```

## Roadmap Futuro

### Fase 2 - Mejoras de Performance
- [ ] Migración a PostgreSQL
- [ ] Caching con Redis
- [ ] CDN para videos
- [ ] Thumbnails automáticos

### Fase 3 - Analytics Avanzados
- [ ] Dashboard de analytics
- [ ] A/B testing de features
- [ ] Recomendaciones personalizadas
- [ ] Insights de engagement

### Fase 4 - Funcionalidades Sociales
- [ ] Marcadores públicos
- [ ] Comentarios en timestamps
- [ ] Sharing de notas
- [ ] Collaborative viewing

### Fase 5 - Tecnologías Avanzadas
- [ ] Transcripciones automáticas
- [ ] Búsqueda dentro de videos
- [ ] Adaptive bitrate streaming
- [ ] Offline viewing

## Troubleshooting

### Problemas Comunes

**1. Progreso no se guarda**
- Verificar autenticación JWT
- Comprobar permisos de escritura en MEDIA_ROOT
- Revisar logs de API para errores

**2. Videos no cargan**
- Verificar URL de video válida
- Comprobar configuración CORS
- Revisar serving de archivos estáticos

**3. Performance issues**
- Ajustar intervalo de guardado automático
- Implementar lazy loading de datos
- Optimizar queries de base de datos

### Debug Mode
```env
DEBUG=True
LOG_LEVEL=DEBUG
PROGRESS_SAVE_INTERVAL=10  # Segundos
```

## Mantenimiento

### Backup
```bash
# Backup de datos de progreso
tar -czf progress_backup_$(date +%Y%m%d).tar.gz media/progress/

# Restore
tar -xzf progress_backup_YYYYMMDD.tar.gz -C media/
```

### Limpieza de Datos
```python
# Script para limpiar progreso antiguo
python scripts/cleanup_old_progress.py --days=90
```

---

## Créditos

**Desarrollado por**: EncoderGroup  
**Versión**: 1.0.0  
**Fecha**: Enero 2024  
**Licencia**: MIT  

Para soporte técnico o consultas, contactar al equipo de desarrollo.
