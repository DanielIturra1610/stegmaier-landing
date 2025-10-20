/**
 * Contenido interactivo para Módulo 2 - Lección I: Qué es un mapa de procesos
 * Curso: Sistema de Gestión Integrado SICMON
 */

export const modulo2Leccion1Content = {
  title: "Lección I: Qué es un mapa de procesos",
  moduleTitle: "Módulo 2: Fundamentos de Mapa de Procesos",
  sections: [
    {
      id: "definicion-inicial",
      type: "text" as const,
      title: "Definición Fundamental",
      content: `El mapa de procesos es una técnica utilizada para planificar visualmente los flujos de trabajo y procesos. 
      Involucra la creación de un mapa, también conocido como diagrama de flujo, diagrama de flujo de procesos o diagrama de flujo de trabajo.`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "conceptos-clave",
      type: "definition" as const,
      title: "Identifica los Conceptos Clave",
      content: `El mapa de procesos es una técnica utilizada para planificar visualmente los flujos de trabajo y procesos. 
      Generalmente, el mapa de procesos de una empresa se representará con un diagrama de valor. Esta herramienta permite 
      comunicar cómo funciona un proceso de manera concisa y directa, facilitando que los miembros del equipo comprendan 
      fácilmente cómo llevar a cabo un proceso específico sin demasiadas explicaciones verbales.`,
      interactive: {
        type: "highlight-keywords" as const,
        data: {
          keywords: [
            "mapa de procesos",
            "técnica",
            "planificar visualmente",
            "flujos de trabajo",
            "diagrama de valor",
            "comunicar",
            "proceso",
            "miembros del equipo"
          ]
        }
      }
    },
    {
      id: "proposito-principal",
      type: "text" as const,
      title: "Propósito del Process Mapping",
      content: `El propósito de un process mapping es comunicar cómo funciona un proceso de manera concisa y directa. 
      [REVEAL]
      ✨ **Beneficios clave:**
      • Permite que los miembros del equipo comprendan fácilmente los procesos
      • Elimina la necesidad de explicaciones verbales extensas
      • Facilita la identificación de ineficiencias
      • Proporciona una visión completa del proceso de principio a fin`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "beneficios-organizacionales",
      type: "benefits" as const,
      title: "Beneficios para la Organización",
      content: `Al elaborar un mapa de procesos de principio a fin, puedes comprender mejor cómo funciona el proceso completo 
      e identificar ineficiencias. Asimismo, es una herramienta eficaz para lograr una mejora continua de todos los procesos. 
      Se trata, por lo tanto, de una técnica fundamental en la gestión de proyectos.`,
      interactive: {
        type: "drag-drop" as const,
        data: {
          items: [
            { id: "1", text: "Identificar ineficiencias", category: "analysis" },
            { id: "2", text: "Mejora continua", category: "improvement" },
            { id: "3", text: "Gestión de proyectos", category: "management" },
            { id: "4", text: "Comprensión completa", category: "understanding" }
          ],
          categories: [
            { id: "analysis", title: "Análisis" },
            { id: "improvement", title: "Mejora" },
            { id: "management", title: "Gestión" },
            { id: "understanding", title: "Comprensión" }
          ]
        }
      }
    },
    {
      id: "casos-uso",
      type: "examples" as const,
      title: "Casos de Uso Comunes",
      content: `Puedes utilizarlos para visualizar cualquier tipo de proceso, pero lo más común es utilizarlos para:
      
      🎯 **Gestión y análisis de procesos**
      📚 **Capacitaciones de empleados**
      🔄 **Integraciones de sistemas**
      📈 **Mejoras continuas de procesos**
      
      Son especialmente útiles para comunicar un proceso complejo, abordar un problema recurrente dentro de un proceso 
      determinado o coordinar las responsabilidades de varios miembros de un equipo.`,
      interactive: {
        type: "timeline-builder" as const,
        data: {
          scenarios: [
            {
              title: "Proceso complejo",
              description: "Comunicar procesos difíciles de entender",
              icon: "🔧"
            },
            {
              title: "Problema recurrente", 
              description: "Abordar issues que se repiten constantemente",
              icon: "🔄"
            },
            {
              title: "Coordinación de equipo",
              description: "Organizar responsabilidades entre miembros",
              icon: "👥"
            }
          ]
        }
      }
    },
    {
      id: "reflexion-personal",
      type: "reflection" as const,
      title: "Reflexión: Aplicación en tu Contexto",
      content: `Ahora que comprendes qué es un mapa de procesos y sus beneficios principales, piensa en tu entorno de trabajo actual. 
      
      **Preguntas para reflexionar:**
      • ¿Qué procesos en tu organización podrían beneficiarse de un mapeo visual?
      • ¿Has experimentado situaciones donde la falta de claridad en procesos ha causado problemas?
      • ¿Cómo crees que implementar mapas de procesos podría mejorar la comunicación en tu equipo?`,
      required: true
    }
  ]
};

export default modulo2Leccion1Content;
