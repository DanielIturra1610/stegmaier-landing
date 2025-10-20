/**
 * Contenido interactivo para Módulo 2 - Lección IV: Por qué utilizar un mapa de procesos
 * Curso: Sistema de Gestión Integrado SICMON
 */

export const modulo2Leccion4Content = {
  title: "Lección IV: Por qué utilizar un mapa de procesos",
  moduleTitle: "Módulo 2: Fundamentos de Mapa de Procesos",
  sections: [
    {
      id: "introduccion-beneficios",
      type: "text" as const,
      title: "El Poder de la Visualización",
      content: `Los mapas de procesos permiten consolidar las ideas y simplificar los procesos al comunicar visualmente 
      los pasos que se necesitan para ejecutar una idea. [REVEAL]
      🎯 **¿Por qué es tan efectivo?**
      • El cerebro procesa información visual 60,000 veces más rápido que texto
      • Reduce malentendidos y errores de comunicación
      • Facilita la identificación rápida de problemas
      • Permite ver el panorama completo de un vistazo`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "beneficios-principales",
      type: "benefits" as const,
      title: "Los 10 Beneficios Clave",
      content: `Estas son algunas de las formas en que los mapas de procesos pueden ser útiles para ti y tu equipo. 
      Vamos a explorar cada beneficio con ejemplos prácticos:`,
      interactive: {
        type: "benefits-explorer" as const,
        data: {
          benefits: [
            {
              id: "inefficiencies",
              title: "Identifican ineficiencias",
              description: "Ayudan a identificar cuellos de botella, omisiones y otros problemas en el flujo de trabajo",
              icon: "🔍",
              example: "Detectar que 3 personas aprueban el mismo documento innecesariamente"
            },
            {
              id: "simplify",
              title: "Simplifican ideas",
              description: "Dividen ideas complejas en pasos más pequeños",
              icon: "🧩",
              example: "Convertir un proceso de 50 páginas en un diagrama de 1 página"
            },
            {
              id: "understanding",
              title: "Aumentan la comprensión",
              description: "Fomentan la comprensión exhaustiva de un proceso",
              icon: "💡",
              example: "Nuevos empleados entienden procedimientos en minutos vs horas"
            },
            {
              id: "contingencies",
              title: "Detectan las contingencias",
              description: "Permiten visualizar las contingencias y proporcionan una guía para resolver los problemas",
              icon: "⚠️",
              example: "Plan B cuando el aprobador principal no está disponible"
            },
            {
              id: "responsibilities",
              title: "Delegan responsabilidades",
              description: "Coordinan las responsabilidades entre varias personas o entidades",
              icon: "👥",
              example: "Clarificar quién hace qué en proyectos multi-departamentales"
            }
          ]
        }
      }
    },
    {
      id: "beneficios-adicionales",
      type: "benefits" as const,
      title: "Beneficios Organizacionales Adicionales",
      content: `Los mapas de procesos también proporcionan beneficios adicionales a nivel organizacional:`,
      interactive: {
        type: "drag-drop" as const,
        data: {
          items: [
            { id: "1", text: "Proporcionan documentación del proceso", category: "documentacion" },
            { id: "2", text: "Simplifican la comunicación mediante formato visual", category: "comunicacion" },
            { id: "3", text: "Garantizan toma de decisiones más rápida", category: "decision" },
            { id: "4", text: "Mejoran el desempeño de los empleados", category: "performance" },
            { id: "5", text: "Ayudan a cumplir con normas ISO 9000 e ISO 9001", category: "cumplimiento" }
          ],
          categories: [
            { id: "documentacion", title: "📋 Documentación" },
            { id: "comunicacion", title: "💬 Comunicación" },
            { id: "decision", title: "⚡ Agilidad" },
            { id: "performance", title: "📈 Performance" },
            { id: "cumplimiento", title: "✅ Cumplimiento" }
          ]
        }
      }
    },
    {
      id: "caso-practico-ineficiencias",
      type: "examples" as const,
      title: "Caso Práctico: Identificando Ineficiencias",
      content: `Veamos un ejemplo real de cómo un mapa de procesos puede identificar problemas. 
      Analiza este proceso de "Aprobación de Gastos" y encuentra las ineficiencias:`,
      interactive: {
        type: "inefficiency-detector" as const,
        data: {
          process: [
            { id: "1", step: "Empleado solicita gasto", time: 5, issues: [] },
            { id: "2", step: "Supervisor inmediato revisa", time: 48, issues: ["delay"] },
            { id: "3", step: "Gerente de área aprueba", time: 72, issues: ["delay"] },
            { id: "4", step: "Contabilidad revisa", time: 24, issues: [] },
            { id: "5", step: "Gerente de área aprueba nuevamente", time: 48, issues: ["redundant"] },
            { id: "6", step: "Director final aprueba", time: 96, issues: ["delay"] },
            { id: "7", step: "Contabilidad procesa pago", time: 24, issues: [] }
          ],
          problems: [
            { type: "delay", description: "Demoras excesivas", color: "red" },
            { type: "redundant", description: "Pasos redundantes", color: "orange" },
            { type: "bottleneck", description: "Cuellos de botella", color: "yellow" }
          ]
        }
      }
    },
    {
      id: "impacto-empleados",
      type: "examples" as const,
      title: "Impacto en los Empleados",
      content: `Los mapas de procesos mejoran significativamente la experiencia laboral. 
      Conecta cada problema común con la solución que proporcionan los mapas:`,
      interactive: {
        type: "problem-solution-matcher" as const,
        data: {
          problems: [
            { id: "confusion", text: "Empleados confundidos sobre procedimientos", icon: "😕" },
            { id: "errors", text: "Errores frecuentes por falta de claridad", icon: "❌" },
            { id: "delays", text: "Retrasos por no saber el próximo paso", icon: "⏰" },
            { id: "frustration", text: "Frustración por procesos complicados", icon: "😤" }
          ],
          solutions: [
            { id: "clear-guidance", text: "Guía visual clara y paso a paso", icon: "📋" },
            { id: "error-reduction", text: "Reducción significativa de errores", icon: "✅" },
            { id: "faster-execution", text: "Ejecución más rápida y eficiente", icon: "🚀" },
            { id: "job-satisfaction", text: "Mayor satisfacción laboral", icon: "😊" }
          ],
          matches: [
            { problem: "confusion", solution: "clear-guidance" },
            { problem: "errors", solution: "error-reduction" },
            { problem: "delays", solution: "faster-execution" },
            { problem: "frustration", solution: "job-satisfaction" }
          ]
        }
      }
    },
    {
      id: "cumplimiento-iso",
      type: "examples" as const,
      title: "Cumplimiento con Normas ISO",
      content: `Los mapas de procesos son fundamentales para cumplir con estándares internacionales. 
      Descubre cómo contribuyen a diferentes normas ISO:`,
      interactive: {
        type: "iso-compliance-explorer" as const,
        data: {
          standards: [
            {
              id: "iso9001",
              name: "ISO 9001 - Gestión de Calidad",
              requirements: [
                "Documentación de procesos",
                "Mejora continua",
                "Enfoque basado en procesos"
              ],
              mapContribution: "Los mapas visualizan y documentan procesos para auditorías"
            },
            {
              id: "iso14001",
              name: "ISO 14001 - Gestión Ambiental", 
              requirements: [
                "Identificación de aspectos ambientales",
                "Procedimientos documentados",
                "Monitoreo de procesos"
              ],
              mapContribution: "Identifican impactos ambientales en cada paso del proceso"
            },
            {
              id: "iso45001",
              name: "ISO 45001 - Seguridad Ocupacional",
              requirements: [
                "Identificación de peligros",
                "Procedimientos de seguridad",
                "Gestión de riesgos"
              ],
              mapContribution: "Mapean riesgos de seguridad en cada actividad"
            }
          ]
        }
      }
    },
    {
      id: "roi-mapas",
      type: "examples" as const,
      title: "Retorno de Inversión (ROI)",
      content: `Calcular el valor real de implementar mapas de procesos en tu organización:`,
      interactive: {
        type: "roi-calculator" as const,
        data: {
          metrics: [
            { 
              name: "Tiempo ahorrado por empleado/día", 
              baseline: 30,
              unit: "minutos",
              impact: "Reducción de consultas y confusiones"
            },
            { 
              name: "Reducción de errores", 
              baseline: 25,
              unit: "porcentaje",
              impact: "Menos reprocesos y correcciones"
            },
            { 
              name: "Tiempo de capacitación nueva gente", 
              baseline: 40,
              unit: "porcentaje de reducción",
              impact: "Onboarding más rápido y efectivo"
            },
            { 
              name: "Mejoras de proceso identificadas", 
              baseline: 3,
              unit: "por mes",
              impact: "Optimizaciones continuas"
            }
          ]
        }
      }
    },
    {
      id: "reflexion-beneficios",
      type: "reflection" as const,
      title: "Reflexión: Beneficios en tu Contexto",
      content: `Después de conocer todos estos beneficios, reflexiona sobre su aplicación en tu entorno laboral.
      
      **Preguntas para reflexionar:**
      • ¿Cuáles de estos beneficios serían más impactantes en tu organización?
      • ¿Qué problemas actuales podrían resolverse con mapas de procesos?
      • ¿Cómo podrías medir el éxito de implementar mapas en tu área?
      • ¿Qué resistencia podrías encontrar y cómo la superarías?`,
      required: true
    }
  ]
};

export default modulo2Leccion4Content;
