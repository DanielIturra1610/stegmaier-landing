# Optimización de Imports de Iconos

Para obtener el mejor tree-shaking de @heroicons/react, sigue estas prácticas:

## ✅ Forma Correcta (Tree-shaking óptimo)

```typescript
// Import específico desde el subdirectorio
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
```

## ❌ Forma Incorrecta (Bundle más grande)

```typescript
// Import desde el barrel export principal
import { CheckCircleIcon } from '@heroicons/react/outline';
```

## Guía de Importación

Vite automáticamente hace tree-shaking cuando importas desde los subdirectorios específicos:
- `/24/outline` - Iconos outline 24x24
- `/24/solid` - Iconos solid 24x24
- `/20/solid` - Iconos solid 20x20

## Iconos Más Usados en el Proyecto

**Outline 24:**
- CheckCircleIcon
- XCircleIcon
- ClockIcon
- ArrowLeftIcon
- ArrowRightIcon
- CloudArrowUpIcon
- VideoCameraIcon
- BookOpenIcon
- AcademicCapIcon
- ChartBarIcon
- DocumentTextIcon
- ExclamationTriangleIcon
- PlusIcon
- TrashIcon
- PencilIcon

**Solid 20:**
- ChevronRightIcon
- ChevronDownIcon
- ChevronUpIcon

## Verificar Tree-shaking

Después del build, verifica el tamaño del chunk `ui` en `dist/stats.html` para asegurar que solo se incluyen los iconos usados.
