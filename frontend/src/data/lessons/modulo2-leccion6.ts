/**
 * Contenido interactivo para Módulo 2 - Lección VI: Simbología de los mapas de procesos
 * Curso: Sistema de Gestión Integrado SICMON
 */

export const modulo2Leccion6Content = {
  title: "Lección VI: Simbología de los mapas de procesos",
  moduleTitle: "Módulo 2: Fundamentos de Mapa de Procesos",
  sections: [
    {
      id: "introduccion-simbolos",
      type: "text" as const,
      title: "El Lenguaje Universal de los Procesos",
      content: `Los mapas de procesos utilizan símbolos del lenguaje unificado de modelado (UML, por sus siglas en inglés) 
      para representar elementos clave de un mapa de procesos, tales como pasos a seguir, puntos de decisión, entradas y salidas, 
      y los participantes del equipo. [REVEAL]
      🎯 **¿Por qué usar símbolos estándar?**
      • Comunicación universal - cualquier persona puede entender
      • Reducen malentendidos y ambigüedades
      • Facilitan la colaboración entre equipos internacionales
      • Permiten análisis automatizados`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "simbolos-basicos",
      type: "definition" as const,
      title: "Los 9 Símbolos Fundamentales",
      content: `Estos son algunos de los símbolos más comunes en los mapas de procesos y su uso específico. 
      Dominar estos símbolos básicos te permitirá crear mapas efectivos y comprensibles:`,
      interactive: {
        type: "symbol-matcher" as const,
        data: {
          symbols: [
            {
              id: "terminal",
              name: "Terminal",
              shape: "oval",
              color: "#10B981",
              description: "Los óvalos denotan el inicio y el final de un proceso",
              usage: "Marcar puntos de entrada y salida",
              examples: ["Inicio del proceso", "Fin del proceso", "Resultado final"]
            },
            {
              id: "process",
              name: "Proceso",
              shape: "rectangle", 
              color: "#3B82F6",
              description: "Un rectángulo representa una actividad o tarea del proceso",
              usage: "Acciones específicas que se ejecutan",
              examples: ["Revisar documento", "Enviar email", "Crear reporte"]
            },
            {
              id: "decision",
              name: "Decisión",
              shape: "diamond",
              color: "#F59E0B",
              description: "Un diamante ilustra un punto donde se necesita tomar una decisión",
              usage: "Preguntas con respuestas Sí/No",
              examples: ["¿Está aprobado?", "¿Es correcto?", "¿Continuar?"]
            },
            {
              id: "flow",
              name: "Flujo",
              shape: "arrow",
              color: "#6B7280",
              description: "Las flechas conectan los pasos del proceso y muestran el flujo direccional",
              usage: "Indicar secuencia y dirección",
              examples: ["Siguiente paso", "Flujo de trabajo", "Conexión entre elementos"]
            }
          ]
        }
      }
    },
    {
      id: "simbolos-especializados",
      type: "definition" as const,
      title: "Símbolos Especializados",
      content: `Además de los símbolos básicos, existen símbolos especializados para situaciones específicas:`,
      interactive: {
        type: "symbol-gallery" as const,
        data: {
          categories: [
            {
              name: "Documentos y Datos",
              symbols: [
                {
                  id: "document",
                  name: "Documento",
                  description: "Un rectángulo con una línea inferior ondulada representa un documento",
                  icon: "📄"
                },
                {
                  id: "multiple-docs",
                  name: "Múltiples Documentos", 
                  description: "Varios rectángulos ondulados apilados",
                  icon: "📚"
                },
                {
                  id: "data",
                  name: "Datos",
                  description: "Un paralelogramo representa los datos de entrada o salida",
                  icon: "💾"
                }
              ]
            },
            {
              name: "Entrada y Control",
              symbols: [
                {
                  id: "manual-input",
                  name: "Entrada Manual",
                  description: "Un rectángulo con una línea superior inclinada indica entrada manual",
                  icon: "⌨️"
                },
                {
                  id: "subprocess",
                  name: "Subproceso",
                  description: "Un rectángulo con líneas verticales dobles indica un subproceso predefinido",
                  icon: "🔄"
                },
                {
                  id: "delay",
                  name: "Retraso",
                  description: "Un símbolo en forma de D indica una demora en el proceso",
                  icon: "⏱️"
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: "construccion-simbolos",
      type: "examples" as const,
      title: "Actividad: Construye tu Primer Diagrama",
      content: `Vamos a practicar usando los símbolos. Arrastra los símbolos correctos para representar 
      este proceso: "Solicitud de Vacaciones"`,
      interactive: {
        type: "symbol-diagram-builder" as const,
        data: {
          process: "Solicitud de Vacaciones",
          steps: [
            { id: "start", text: "Empleado quiere vacaciones", type: "terminal" },
            { id: "fill-form", text: "Completar formulario", type: "process" },
            { id: "supervisor-available", text: "¿Supervisor disponible?", type: "decision" },
            { id: "wait", text: "Esperar supervisor", type: "delay" },
            { id: "review", text: "Supervisor revisa", type: "process" },
            { id: "approved", text: "¿Aprobado?", type: "decision" },
            { id: "form-doc", text: "Formulario aprobado", type: "document" },
            { id: "end-approved", text: "Vacaciones aprobadas", type: "terminal" },
            { id: "end-rejected", text: "Solicitud rechazada", type: "terminal" }
          ]
        }
      }
    },
    {
      id: "buenas-practicas-simbolos",
      type: "examples" as const,
      title: "Buenas Prácticas con Símbolos",
      content: `Para crear mapas efectivos, es importante seguir buenas prácticas en el uso de símbolos:`,
      interactive: {
        type: "best-practices-quiz" as const,
        data: {
          practices: [
            {
              id: "consistency",
              title: "Consistencia",
              description: "Usar los mismos símbolos para elementos similares",
              correct: "Usar siempre rectángulos para procesos",
              incorrect: "Mezclar rectángulos y círculos para procesos",
              explanation: "La consistencia elimina confusión y facilita la lectura"
            },
            {
              id: "clarity",
              title: "Claridad",
              description: "Texto claro y conciso dentro de los símbolos",
              correct: "Revisar documento",
              incorrect: "El supervisor debe revisar el documento para ver si cumple con todos los requisitos",
              explanation: "Textos cortos y específicos son más efectivos"
            },
            {
              id: "flow-direction",
              title: "Dirección del Flujo",
              description: "Flujo de izquierda a derecha y de arriba hacia abajo",
              correct: "Inicio → Proceso → Decisión → Fin",
              incorrect: "Fin ← Decisión ← Proceso ← Inicio",
              explanation: "Seguir patrones de lectura naturales facilita la comprensión"
            },
            {
              id: "decision-branches",
              title: "Ramificaciones de Decisiones", 
              description: "Etiquetar claramente las salidas de decisiones",
              correct: "¿Aprobado? → SÍ/NO",
              incorrect: "¿Aprobado? → sin etiquetas",
              explanation: "Las decisiones siempre deben tener salidas claramente etiquetadas"
            }
          ]
        }
      }
    },
    {
      id: "errores-comunes",
      type: "examples" as const,
      title: "Errores Comunes a Evitar",
      content: `Identifica y corrige estos errores típicos en el uso de símbolos:`,
      interactive: {
        type: "error-identifier" as const,
        data: {
          scenarios: [
            {
              id: "wrong-symbol",
              title: "Símbolo Incorrecto",
              description: "Usar diamante para proceso en lugar de rectángulo",
              image: "process-in-diamond",
              error: "El diamante solo debe usarse para decisiones",
              correction: "Usar rectángulo para procesos/actividades"
            },
            {
              id: "missing-arrows",
              title: "Flechas Faltantes",
              description: "Conectar símbolos sin flechas direccionales",
              image: "no-arrows",
              error: "Sin flechas no se entiende el flujo",
              correction: "Siempre usar flechas para mostrar dirección"
            },
            {
              id: "complex-text",
              title: "Texto Excesivo",
              description: "Párrafos completos dentro de símbolos",
              image: "too-much-text",
              error: "Hace el diagrama ilegible",
              correction: "Usar frases cortas y específicas"
            },
            {
              id: "no-start-end",
              title: "Sin Inicio/Fin",
              description: "Diagrama sin puntos de inicio y fin claros",
              image: "no-terminals",
              error: "No se sabe dónde empieza ni termina",
              correction: "Siempre incluir símbolos de inicio y fin"
            }
          ]
        }
      }
    },
    {
      id: "simbolos-avanzados",
      type: "examples" as const,
      title: "Símbolos Avanzados",
      content: `Para mapas más complejos, existen símbolos adicionales que puedes usar:`,
      interactive: {
        type: "advanced-symbols-explorer" as const,
        data: {
          categories: [
            {
              name: "Conectores",
              symbols: [
                { name: "Conector de página", usage: "Continuar en otra página", icon: "🔗" },
                { name: "Conector circular", usage: "Referencias internas", icon: "⭕" },
                { name: "Línea de flujo", usage: "Flujo alternativo", icon: "📏" }
              ]
            },
            {
              name: "Almacenamiento",
              symbols: [
                { name: "Base de datos", usage: "Almacenamiento persistente", icon: "🗄️" },
                { name: "Almacenamiento interno", usage: "Memoria temporal", icon: "💿" },
                { name: "Almacenamiento externo", usage: "Archivo externo", icon: "📁" }
              ]
            },
            {
              name: "Comunicación",
              symbols: [
                { name: "Display", usage: "Mostrar información", icon: "🖥️" },
                { name: "Entrada de teclado", usage: "Input del usuario", icon: "⌨️" },
                { name: "Preparación", usage: "Configuración inicial", icon: "🛠️" }
              ]
            }
          ]
        }
      }
    },
    {
      id: "practica-completa",
      type: "examples" as const,
      title: "Práctica Final: Mapa Completo",
      content: `Crea un mapa de procesos completo para "Proceso de Contratación" usando todos los símbolos aprendidos:`,
      interactive: {
        type: "complete-process-builder" as const,
        data: {
          processName: "Proceso de Contratación",
          requirements: [
            "Debe tener inicio y fin claros",
            "Incluir al menos 2 decisiones",
            "Usar símbolo de documento para CV",
            "Incluir retraso para evaluación",
            "Mostrar subproceso de verificación de referencias",
            "Usar entrada manual para datos del candidato"
          ],
          availableSymbols: [
            "terminal", "process", "decision", "document", 
            "delay", "subprocess", "manual-input", "flow"
          ]
        }
      }
    },
    {
      id: "reflexion-simbolos",
      type: "reflection" as const,
      title: "Reflexión: Aplicación en tu Contexto",
      content: `Ahora que dominas la simbología de mapas de procesos, reflexiona sobre su aplicación práctica.
      
      **Preguntas para reflexionar:**
      • ¿Qué símbolos serían más relevantes para los procesos de tu área de trabajo?
      • ¿Cómo podrías capacitar a tu equipo en el uso consistente de estos símbolos?
      • ¿Qué desafíos anticipas al implementar mapas estandarizados en tu organización?
      • ¿Cómo medirías la efectividad de usar símbolos estándar vs mapas sin estandarizar?`,
      required: true
    }
  ]
};

export default modulo2Leccion6Content;
