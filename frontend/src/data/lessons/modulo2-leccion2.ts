/**
 * Contenido interactivo para Módulo 2 - Lección II: Tipos de procesos
 * Curso: Sistema de Gestión Integrado SICMON
 */

export const modulo2Leccion2Content = {
  title: "Lección II: Tipos de procesos",
  moduleTitle: "Módulo 2: Fundamentos de Mapa de Procesos",
  sections: [
    {
      id: "introduccion-tipos",
      type: "text" as const,
      title: "Antes de Mapear: Conoce los Tipos",
      content: `Antes de comenzar con el mapeo de procesos, especialmente si vas a elaborar un mapa de procesos de la empresa, 
      es importante que conozcas los tipos de procesos de una organización. [REVEAL]
      🎯 **¿Por qué es importante?**
      • Cada tipo requiere un enfoque diferente de mapeo
      • Ayuda a priorizar qué procesos mapear primero
      • Facilita la comprensión del flujo organizacional completo`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "procesos-estrategicos",
      type: "definition" as const,
      title: "Procesos Estratégicos: La Dirección",
      content: `Los procesos estratégicos se refieren al conjunto de actividades y tareas que atañen, principalmente, 
      a la alta dirección y que forman parte del plan estratégico de la compañía. Suelen incluirse procesos aquí de 
      Marketing o lanzamiento de nuevos productos. Estos procesos definen el rumbo de la organización y establecen 
      las directrices para todos los demás procesos.`,
      interactive: {
        type: "highlight-keywords" as const,
        data: {
          keywords: [
            "procesos estratégicos",
            "alta dirección",
            "plan estratégico",
            "Marketing",
            "lanzamiento de nuevos productos",
            "rumbo de la organización",
            "directrices"
          ]
        }
      }
    },
    {
      id: "procesos-clave",
      type: "definition" as const,
      title: "Procesos Clave: El Corazón del Negocio",
      content: `Son los procesos implicados directamente en el producto que desarrollas o el servicio que presta la compañía. 
      Estos procesos son fundamentales porque agregan valor directo al cliente final y son la razón de ser de la organización. 
      [REVEAL]
      💡 **Características principales:**
      • Impactan directamente en la satisfacción del cliente
      • Generan valor agregado tangible
      • Son críticos para el éxito del negocio
      • Su falla afecta inmediatamente los resultados`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "procesos-apoyo",
      type: "definition" as const,
      title: "Procesos de Apoyo: El Soporte Esencial",
      content: `Se trata de los procesos que servirán de soporte a los procesos estratégicos y clave. 
      Un ejemplo de este tipo de procesos sería el de un proyecto de formación para empleados. 
      Aunque no agregan valor directo al cliente, son esenciales para que los otros procesos funcionen correctamente.`,
      interactive: {
        type: "highlight-keywords" as const,
        data: {
          keywords: [
            "procesos de apoyo",
            "soporte",
            "procesos estratégicos",
            "procesos clave",
            "formación para empleados",
            "esenciales"
          ]
        }
      }
    },
    {
      id: "clasificacion-interactiva",
      type: "examples" as const,
      title: "Actividad: Clasifica los Procesos",
      content: `Ahora que conoces los tres tipos de procesos, vamos a practicar clasificándolos. 
      Arrastra cada proceso a su categoría correspondiente:`,
      interactive: {
        type: "drag-drop" as const,
        data: {
          items: [
            { id: "1", text: "Definición de visión y misión", category: "estrategicos" },
            { id: "2", text: "Producción de widgets", category: "clave" },
            { id: "3", text: "Capacitación de personal", category: "apoyo" },
            { id: "4", text: "Planificación estratégica anual", category: "estrategicos" },
            { id: "5", text: "Atención al cliente", category: "clave" },
            { id: "6", text: "Mantenimiento de equipos", category: "apoyo" },
            { id: "7", text: "Desarrollo de nuevos productos", category: "estrategicos" },
            { id: "8", text: "Entrega del servicio", category: "clave" },
            { id: "9", text: "Recursos humanos", category: "apoyo" },
            { id: "10", text: "Gestión financiera", category: "apoyo" }
          ],
          categories: [
            { id: "estrategicos", title: "Procesos Estratégicos" },
            { id: "clave", title: "Procesos Clave" },
            { id: "apoyo", title: "Procesos de Apoyo" }
          ]
        }
      }
    },
    {
      id: "jerarquia-procesos",
      type: "examples" as const,
      title: "Comprende la Jerarquía Organizacional",
      content: `Los tres tipos de procesos forman una jerarquía interconectada en la organización. 
      Construye la pirámide organizacional colocando cada tipo en su nivel correcto:`,
      interactive: {
        type: "hierarchy-builder" as const,
        data: {
          levels: [
            {
              id: "top",
              title: "Nivel Superior",
              description: "Definen dirección y estrategia",
              correctType: "estrategicos",
              placeholder: "¿Qué procesos van aquí?"
            },
            {
              id: "middle", 
              title: "Nivel Operacional",
              description: "Crean valor para el cliente",
              correctType: "clave",
              placeholder: "¿Cuál es el corazón del negocio?"
            },
            {
              id: "bottom",
              title: "Nivel de Soporte",
              description: "Facilitan y apoyan la operación",
              correctType: "apoyo",
              placeholder: "¿Qué procesos dan soporte?"
            }
          ],
          options: [
            { id: "estrategicos", text: "Procesos Estratégicos" },
            { id: "clave", text: "Procesos Clave" },
            { id: "apoyo", text: "Procesos de Apoyo" }
          ]
        }
      }
    },
    {
      id: "ejemplo-empresa",
      type: "examples" as const,
      title: "Caso Práctico: Empresa de Seguridad",
      content: `Imagina una empresa de consultoría en seguridad ocupacional como SICMON. 
      Veamos cómo se aplican los tipos de procesos en este contexto real:`,
      interactive: {
        type: "timeline-builder" as const,
        data: {
          scenarios: [
            {
              title: "ESTRATÉGICOS",
              description: "Definición de servicios, expansión a nuevos mercados, alianzas",
              icon: "🎯",
              examples: ["Planificación estratégica", "Desarrollo de nuevos servicios", "Marketing corporativo"]
            },
            {
              title: "CLAVE", 
              description: "Consultoría, auditorías, capacitaciones directas al cliente",
              icon: "⚙️",
              examples: ["Auditorías de seguridad", "Capacitaciones especializadas", "Consultoría normativa"]
            },
            {
              title: "APOYO",
              description: "Administración, RRHH, sistemas, infraestructura",
              icon: "🛠️",
              examples: ["Gestión administrativa", "Capacitación interna", "Mantenimiento TI"]
            }
          ]
        }
      }
    },
    {
      id: "reflexion-organizacion",
      type: "reflection" as const,
      title: "Reflexión: Tu Organización",
      content: `Ahora que comprendes los tres tipos de procesos, analiza tu propia organización o una que conozcas bien.
      
      **Preguntas para reflexionar:**
      • ¿Puedes identificar claramente los procesos estratégicos de tu organización?
      • ¿Cuáles son los procesos clave que generan valor directo al cliente?
      • ¿Qué procesos de apoyo son más críticos para el funcionamiento?
      • ¿Existe buena comunicación entre estos tres niveles de procesos?`,
      required: true
    }
  ]
};

export default modulo2Leccion2Content;
