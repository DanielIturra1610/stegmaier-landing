/**
 * Contenido interactivo para Módulo 2 - Lección V: Tipos de mapas de procesos
 * Curso: Sistema de Gestión Integrado SICMON
 */

export const modulo2Leccion5Content = {
  title: "Lección V: Tipos de mapas de procesos",
  moduleTitle: "Módulo 2: Fundamentos de Mapa de Procesos",
  sections: [
    {
      id: "introduccion-tipos-mapas",
      type: "text" as const,
      title: "Diversas Formas, Mismo Propósito",
      content: `Existen diversas formas y tamaños de los mapas de procesos. Todos sirven al mismo propósito, 
      pero ciertos tipos de mapas de procesos pueden utilizarse mejor en algunos proyectos. [REVEAL]
      🎯 **Lo que aprenderás:**
      • 6 tipos principales de mapas de procesos
      • Cuándo usar cada tipo específico
      • Ventajas y desventajas de cada formato
      • Cómo elegir el tipo correcto para tu proyecto`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "diagrama-flujo-basico",
      type: "definition" as const,
      title: "Diagrama de Flujo - El Más Simple",
      content: `La forma más simple de un mapa de procesos es un diagrama de flujo. El diagrama de flujo básico 
      utiliza símbolos del mapa de procesos para ilustrar las entradas y salidas de un proceso y los pasos 
      necesarios para llevar a cabo el proceso. Los diagramas de flujo básicos pueden usarse para planificar 
      proyectos nuevos, mejorar la comunicación entre los miembros de un equipo, resolver problemas de procesos 
      en curso y analizar y gestionar flujos de trabajo.`,
      interactive: {
        type: "highlight-keywords" as const,
        data: {
          keywords: [
            "diagrama de flujo",
            "forma más simple",
            "símbolos",
            "entradas y salidas",
            "planificar proyectos",
            "comunicación",
            "resolver problemas",
            "flujos de trabajo"
          ]
        }
      }
    },
    {
      id: "mapa-alto-nivel",
      type: "definition" as const,
      title: "Process Mapping de Alto Nivel - Vista Panorámica",
      content: `Un mapa de procesos de alto nivel —también conocido como mapa descendente o mapa de la cadena de valor— 
      otorga una vista de alto nivel de un proceso. Los pasos se limitan a lo esencial del proceso y el mapa incluye 
      detalles mínimos. [REVEAL]
      💡 **Características clave:**
      • Solo muestra los pasos esenciales (5-10 pasos máximo)
      • Ideal para presentaciones ejecutivas
      • Perfecto para discusiones con superiores
      • Se enfoca en el flujo general, no en detalles`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "mapas-detallados",
      type: "definition" as const,
      title: "Mapas de Procesos Detallados - Máximo Detalle",
      content: `A diferencia del mapa de procesos de alto nivel, un mapa de procesos detallado brinda todos los detalles 
      para cada paso y también incluye los subprocesos. Documenta los puntos de decisión y las entradas y salidas de 
      cada paso. Este mapa de procesos permite un mayor entendimiento del proceso creado y es el más eficaz para 
      detectar áreas de ineficiencia debido a su alto nivel de detalle.`,
      interactive: {
        type: "comparison-table" as const,
        data: {
          comparison: {
            title: "Alto Nivel vs Detallado",
            categories: ["Complejidad", "Audiencia", "Tiempo creación", "Uso principal"],
            items: [
              {
                name: "Alto Nivel",
                values: ["Baja", "Ejecutivos", "1-2 horas", "Comunicación estratégica"]
              },
              {
                name: "Detallado", 
                values: ["Alta", "Operadores", "1-2 días", "Análisis y mejora"]
              }
            ]
          }
        }
      }
    },
    {
      id: "diagrama-carriles",
      type: "definition" as const,
      title: "Diagrama de Flujo de Carriles (Swimlane)",
      content: `El diagrama de flujo de carriles —también conocido como diagrama de flujo interfuncional o de implementación— 
      determina las actividades de un proceso en "carriles" para designar quién es responsable de cada tarea. 
      El mapa se divide en canales para cada participante del proceso y enumera cada actividad en el canal del 
      participante correspondiente.`,
      interactive: {
        type: "swimlane-builder" as const,
        data: {
          roles: ["Cliente", "Vendedor", "Supervisor", "Contabilidad"],
          activities: [
            { text: "Solicita cotización", responsible: "Cliente" },
            { text: "Prepara propuesta", responsible: "Vendedor" },
            { text: "Revisa propuesta", responsible: "Supervisor" },
            { text: "Envía cotización", responsible: "Vendedor" },
            { text: "Acepta propuesta", responsible: "Cliente" },
            { text: "Procesa pago", responsible: "Contabilidad" }
          ]
        }
      }
    },
    {
      id: "mapa-flujo-valor",
      type: "definition" as const,
      title: "Mapa de Flujo de Valor - Metodología Lean",
      content: `Un mapa de flujo de valor es una herramienta de gestión Lean en la que se visualiza el proceso de 
      entregar un producto o servicio al cliente. Los mapas de flujo de valor suelen ser complejos y utilizan un 
      sistema único de símbolos para ilustrar el flujo de información y los materiales necesarios para el proceso.`,
      interactive: {
        type: "value-stream-analyzer" as const,
        data: {
          metrics: [
            { name: "Tiempo de ciclo", description: "Tiempo para completar una unidad", unit: "minutos" },
            { name: "Tiempo de espera", description: "Tiempo sin agregar valor", unit: "horas" },
            { name: "Personal involucrado", description: "Número de personas por paso", unit: "personas" },
            { name: "Inventario", description: "Stock entre procesos", unit: "unidades" }
          ],
          benefits: [
            "Identifica desperdicios (waste)",
            "Optimiza flujo de materiales",
            "Reduce tiempos de entrega",
            "Mejora calidad del producto"
          ]
        }
      }
    },
    {
      id: "diagrama-sipoc",
      type: "definition" as const,
      title: "Diagrama SIPOC - Análisis Integral",
      content: `Un diagrama SIPOC, más que un mapa de procesos, es un diagrama que identifica los elementos clave 
      del proceso, que puede ser creado como paso previo a la elaboración de un mapa de procesos detallado. 
      Como sugiere el acrónimo, el diagrama SIPOC debería contener cinco columnas.`,
      interactive: {
        type: "sipoc-builder" as const,
        data: {
          example: {
            suppliers: ["Proveedor de materiales", "Proveedor de servicios"],
            inputs: ["Materias primas", "Especificaciones", "Presupuesto"],
            process: ["Planificar", "Ejecutar", "Controlar", "Entregar"],
            outputs: ["Producto terminado", "Documentación", "Facturas"],
            customers: ["Cliente final", "Departamento interno"]
          },
          template: {
            title: "Proceso de Capacitación",
            description: "Completa cada columna del diagrama SIPOC"
          }
        }
      }
    },
    {
      id: "selector-tipo-mapa",
      type: "examples" as const,
      title: "Actividad: Selector de Tipo de Mapa",
      content: `Ahora que conoces todos los tipos, vamos a practicar eligiendo el tipo correcto para diferentes situaciones. 
      Conecta cada escenario con el tipo de mapa más apropiado:`,
      interactive: {
        type: "scenario-matcher" as const,
        data: {
          scenarios: [
            {
              id: "exec-presentation",
              title: "Presentación a Directorio",
              description: "Necesitas mostrar un proceso complejo en 5 minutos a ejecutivos",
              icon: "👔"
            },
            {
              id: "training-new",
              title: "Capacitación Empleados Nuevos",
              description: "Entrenar paso a paso un procedimiento detallado",
              icon: "👨‍🎓"
            },
            {
              id: "cross-department",
              title: "Proceso Multi-departamental",
              description: "Clarificar responsabilidades entre 4 áreas diferentes",
              icon: "🏢"
            },
            {
              id: "lean-improvement",
              title: "Proyecto de Mejora Lean",
              description: "Eliminar desperdicios y optimizar tiempos de entrega",
              icon: "⚡"
            },
            {
              id: "initial-analysis",
              title: "Análisis Inicial de Proceso",
              description: "Identificar elementos clave antes del mapeo detallado",
              icon: "🔍"
            }
          ],
          mapTypes: [
            { id: "high-level", name: "Alto Nivel", icon: "📊" },
            { id: "detailed", name: "Detallado", icon: "🔬" },
            { id: "swimlane", name: "Carriles (Swimlane)", icon: "🏊" },
            { id: "value-stream", name: "Flujo de Valor", icon: "💎" },
            { id: "sipoc", name: "SIPOC", icon: "📋" }
          ],
          correctMatches: [
            { scenario: "exec-presentation", mapType: "high-level" },
            { scenario: "training-new", mapType: "detailed" },
            { scenario: "cross-department", mapType: "swimlane" },
            { scenario: "lean-improvement", mapType: "value-stream" },
            { scenario: "initial-analysis", mapType: "sipoc" }
          ]
        }
      }
    },
    {
      id: "comparativa-tipos",
      type: "examples" as const,
      title: "Comparativa Interactiva de Tipos",
      content: `Explora las características de cada tipo de mapa en esta tabla comparativa interactiva:`,
      interactive: {
        type: "interactive-comparison" as const,
        data: {
          types: [
            {
              name: "Diagrama de Flujo",
              complexity: 2,
              timeToCreate: 1,
              detailLevel: 2,
              bestFor: "Procesos simples y comunicación básica",
              pros: ["Fácil de entender", "Rápido de crear", "Universal"],
              cons: ["Limitado en detalle", "No muestra responsables"]
            },
            {
              name: "Alto Nivel",
              complexity: 1,
              timeToCreate: 1,
              detailLevel: 1,
              bestFor: "Presentaciones ejecutivas y vista panorámica", 
              pros: ["Muy claro", "Enfoque estratégico", "Rápido"],
              cons: ["Muy general", "Falta detalle operativo"]
            },
            {
              name: "Detallado",
              complexity: 4,
              timeToCreate: 4,
              detailLevel: 5,
              bestFor: "Análisis profundo y capacitación",
              pros: ["Máximo detalle", "Identifica problemas", "Completo"],
              cons: ["Complejo", "Toma mucho tiempo", "Puede ser abrumador"]
            },
            {
              name: "Swimlane",
              complexity: 3,
              timeToCreate: 3,
              detailLevel: 3,
              bestFor: "Procesos multi-departamentales",
              pros: ["Clarifica responsabilidades", "Reduce confusión", "Enfoque en roles"],
              cons: ["Puede ser complejo", "Requiere coordinación"]
            },
            {
              name: "Flujo de Valor",
              complexity: 5,
              timeToCreate: 5,
              detailLevel: 4,
              bestFor: "Mejoras Lean y optimización",
              pros: ["Identifica desperdicios", "Datos cuantitativos", "Enfoque en valor"],
              cons: ["Muy complejo", "Requiere expertise", "Toma mucho tiempo"]
            },
            {
              name: "SIPOC",
              complexity: 2,
              timeToCreate: 2,
              detailLevel: 2,
              bestFor: "Análisis inicial y definición de alcance",
              pros: ["Vista integral", "Identifica stakeholders", "Buen punto de partida"],
              cons: ["No es un mapa real", "Limitado en flujo"]
            }
          ]
        }
      }
    },
    {
      id: "reflexion-seleccion",
      type: "reflection" as const,
      title: "Reflexión: Selección de Tipos en tu Contexto",
      content: `Ahora que conoces los 6 tipos principales de mapas de procesos, reflexiona sobre su aplicación.
      
      **Preguntas para reflexionar:**
      • ¿Qué tipo de mapa sería más útil para los procesos actuales de tu área de trabajo?
      • ¿En qué situaciones específicas usarías un mapa de alto nivel vs uno detallado?
      • ¿Cómo podrías combinar diferentes tipos para un proyecto complejo?
      • ¿Qué resistencia podrías encontrar al introducir mapas más complejos como SIPOC o Flujo de Valor?`,
      required: true
    }
  ]
};

export default modulo2Leccion5Content;
