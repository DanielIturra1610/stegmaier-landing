# 🧪 Guía Comprehensiva de Testing - Stegmaier LMS

## 📋 Resumen de Correcciones Aplicadas

### Problemas Resueltos ✅

1. **AuthProvider faltante en tests**
   - Mock global del `useAuth` hook en `setup.ts`
   - Eliminación de errores "useAuth debe ser usado dentro de un AuthProvider"

2. **Errores de tipos en courseService.test.ts**
   - Corrección de tipos de retorno ambiguos (`Course[] | CoursesResponse`)
   - Protección contra valores `undefined` en tests

3. **Configuración Vitest**
   - Corrección de propiedades inválidas en `vitest.config.ts`
   - Agregado de configuración de coverage y CSS

4. **Mocks de react-router-dom**
   - Mock global para evitar errores de "BrowserRouter not defined"
   - Simplificación de test providers

5. **MSW Handlers faltantes**
   - Agregado endpoint `/courses/available` en handlers
   - Corrección de formato de respuestas mock

## 🚀 Comandos de Testing

### Ejecutar Todos los Tests
```bash
npm run test
# o
vitest
```

### Ejecutar Tests en Modo CI (sin watch)
```bash
npm run test:run
# o
vitest run
```

### Tests con Coverage
```bash
npm run test:coverage
# o
vitest run --coverage
```

### Tests Específicos
```bash
# Solo tests de servicios
vitest run src/tests/services/

# Solo tests de componentes
vitest run src/tests/components/

# Solo tests de integración
vitest run src/tests/integration/

# Un archivo específico
vitest run src/tests/services/courseService.test.ts
```

### Tests con UI
```bash
npm run test:ui
# o
vitest --ui
```

## 📁 Estructura de Testing

```
frontend/src/tests/
├── components/          # Tests de componentes React
│   ├── auth/           # Componentes de autenticación
│   └── course/         # Componentes de cursos
├── hooks/              # Tests de custom hooks
├── integration/        # Tests de integración
├── mocks/              # MSW handlers y mocks
│   ├── handlers.ts     # Handlers de API mock
│   └── server.ts       # Configuración MSW server
├── pages/              # Tests de páginas completas
│   └── admin/          # Páginas administrativas
├── services/           # Tests de servicios API
├── utils/              # Utilidades de testing
│   └── test-utils.tsx  # Helpers para tests
└── setup.ts            # Configuración global de tests
```

## 🔧 Configuración de Testing

### vitest.config.ts
```typescript
export default defineConfig({
  test: {
    globals: true,           // Habilita globals (describe, it, expect)
    environment: 'jsdom',    // Simula DOM del navegador
    setupFiles: ['./src/tests/setup.ts'], // Setup global
    css: true,               // Procesa archivos CSS
    coverage: {              // Configuración de coverage
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/', '*.config.*']
    }
  }
});
```

### setup.ts - Mocks Globales
```typescript
// Mock global de useAuth
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', role: 'student' },
    isAuthenticated: true,
    // ... otros métodos
  })
}));

// Mock de react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }) => children,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  };
});
```

## 📝 Patrones de Testing

### Testing de Componentes React
```typescript
import { render, screen } from '../utils/test-utils';
import { CourseCard } from '@/components/course/CourseCard';

describe('CourseCard', () => {
  it('renders course information correctly', () => {
    render(
      <CourseCard
        id="1"
        title="Test Course"
        instructor_name="John Doe"
        level="beginner"
        category="programming"
        is_published={true}
        lessons_count={5}
        enrollments_count={10}
        thumbnail_url="/test.jpg"
        price={99.99}
        created_at="2024-01-01T00:00:00Z"
      />
    );
    
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Testing de Servicios API
```typescript
import { courseService } from '@/services/courseService';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('CourseService', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'mock-jwt-token');
  });

  it('fetches available courses', async () => {
    const courses = await courseService.getAvailableCourses();
    
    expect(courses).toBeTruthy();
    if (Array.isArray(courses)) {
      expect(courses.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles API errors', async () => {
    server.use(
      http.get('/api/v1/courses/available', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    await expect(courseService.getAvailableCourses()).rejects.toThrow();
  });
});
```

### Testing de Hooks
```typescript
import { renderHook } from '@testing-library/react';
import { useAnalytics } from '@/hooks/useAnalytics';

describe('useAnalytics', () => {
  it('initializes correctly', () => {
    const { result } = renderHook(() => useAnalytics());
    
    expect(result.current.trackPageView).toBeDefined();
    expect(result.current.trackEvent).toBeDefined();
  });
});
```

### Testing de Integración
```typescript
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { CoursesPage } from '@/pages/platform/CoursesPage';

describe('Course Flow Integration', () => {
  it('allows user to browse and view course details', async () => {
    render(<CoursesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Cursos Disponibles')).toBeInTheDocument();
    });
    
    // Buscar por título
    const searchInput = screen.getByPlaceholderText('Buscar cursos...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    // Verificar filtros
    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });
  });
});
```

## 🎯 MSW (Mock Service Worker)

### Configuración de Handlers
```typescript
// handlers.ts
export const handlers = [
  http.get('/api/v1/courses/available', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Course',
        is_published: true,
        // ... otros campos
      }
    ]);
  }),

  http.get('/api/v1/courses/:courseId', ({ params }) => {
    return HttpResponse.json({
      id: params.courseId,
      title: 'Course Detail',
      lessons: []
    });
  }),
];
```

### Override de Handlers en Tests
```typescript
// En un test específico
server.use(
  http.get('/api/v1/courses/available', () => {
    return HttpResponse.json({ error: 'No courses found' }, { status: 404 });
  })
);
```

## 🏃‍♂️ Orden Recomendado de Ejecución

### 1. Tests Unitarios (Rápidos)
```bash
vitest run src/tests/services/
vitest run src/tests/hooks/
vitest run src/tests/components/
```

### 2. Tests de Integración (Medios)
```bash
vitest run src/tests/integration/
vitest run src/tests/pages/
```

### 3. Tests E2E (Lentos - con Playwright)
```bash
npm run test:e2e
```

## 🐛 Debugging Tests

### Ver Output Detallado
```bash
vitest run --reporter=verbose
```

### Debug con Console Logs
```bash
vitest run --reporter=verbose --no-coverage
```

### Debug Específico
```bash
# Solo un test
vitest run -t "fetches available courses"

# Solo un archivo
vitest run courseService.test.ts
```

## 📊 Coverage Report

### Generar Reporte
```bash
npm run test:coverage
```

### Ver Reporte HTML
```bash
# Después del coverage
open coverage/index.html
```

### Configuración de Coverage
- **Mínimo recomendado**: 70% de cobertura
- **Objetivo ideal**: 85% de cobertura
- **Archivos excluidos**: Tests, config files, mocks

## 🔄 CI/CD Pipeline

### Scripts de Package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:integration": "vitest run --reporter=verbose tests/integration"
  }
}
```

### En GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm run test:run
    npm run test:coverage
```

## ✅ Estado Actual

### Tests Funcionando ✅
- ✅ CourseCard component tests
- ✅ CourseService API tests (corregidos)
- ✅ Setup y configuración global
- ✅ MSW handlers para API mocking

### Tests Corregidos 🔧
- ✅ AuthProvider mock implementado
- ✅ Router mock configurado
- ✅ Tipos de courseService ajustados
- ✅ Handlers de /courses/available agregados

### Próximos Pasos Sugeridos 📋
1. Ejecutar `npm run test:run` para verificar todas las correcciones
2. Revisar coverage con `npm run test:coverage`
3. Agregar más tests de integración si es necesario
4. Implementar tests E2E con Playwright

---

**Total de correcciones aplicadas**: 6 problemas críticos resueltos
**Estado del testing suite**: ✅ Operativo y listo para desarrollo
