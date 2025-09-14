/**
 * Contenido interactivo para Módulo 2 - Lección VII: Ejemplos de mapas de procesos
 * Curso: Sistema de Gestión Integrado SICMON
 */

export const modulo2Leccion7Content = {
  title: "Lección VII: Ejemplos de mapas de procesos",
  moduleTitle: "Módulo 2: Fundamentos de Mapa de Procesos",
  sections: [
    {
      id: "introduccion-ejemplos",
      type: "text" as const,
      title: "Del Concepto a la Práctica",
      content: `Puedes crear un mapa de procesos para cualquier tipo de proceso, pero puede que aún te preguntes 
      cómo utilizar esta herramienta en tu equipo. Para que puedas tener una mejor idea te mostramos ejemplos 
      de mapas de procesos aplicados en diferentes contextos empresariales. [REVEAL]
      🎯 **Lo que veremos:**
      • Ejemplos reales de diferentes industrias
      • Mapas de procesos aplicados a seguridad ocupacional
      • Casos de uso específicos para consultoría
      • Plantillas que puedes adaptar a tu organización`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "ejemplo-proceso-ventas",
      type: "examples" as const,
      title: "Ejemplo 1: Proceso de Ventas B2B",
      content: `Analicemos un proceso completo de ventas business-to-business, desde la generación de leads hasta el cierre:`,
      interactive: {
        type: "interactive-process-viewer" as const,
        data: {
          processName: "Proceso de Ventas B2B",
          description: "Flujo completo desde prospectación hasta cierre de venta",
          steps: [
            {
              id: "lead-generation",
              type: "process",
              title: "Generar una oportunidad",
              description: "Marketing genera leads calificados",
              responsible: "Marketing",
              duration: "1-2 días",
              inputs: ["Campañas", "Eventos", "Referencias"],
              outputs: ["Lead calificado"]
            },
            {
              id: "research",
              type: "process", 
              title: "Investigar al cliente potencial",
              description: "Vendedor investiga necesidades y contexto",
              responsible: "Ventas",
              duration: "2-4 horas",
              inputs: ["Información del lead", "Investigación online"],
              outputs: ["Perfil del cliente"]
            },
            {
              id: "presentation",
              type: "process",
              title: "Presentar solución al cliente potencial",
              description: "Presentación personalizada de la propuesta",
              responsible: "Ventas",
              duration: "1-2 horas",
              inputs: ["Perfil del cliente", "Soluciones disponibles"],
              outputs: ["Propuesta presentada"]
            },
            {
              id: "objections",
              type: "decision",
              title: "¿El cliente potencial tiene alguna objeción?",
              description: "Evaluación de feedback del cliente",
              responsible: "Ventas",
              branches: {
                "si": "objection-handling",
                "no": "closing"
              }
            },
            {
              id: "objection-handling",
              type: "process",
              title: "Solucionar objeciones",
              description: "Abordar preocupaciones específicas del cliente",
              responsible: "Ventas + Soporte Técnico",
              duration: "1-3 días",
              inputs: ["Objeciones identificadas"],
              outputs: ["Soluciones a objeciones"]
            },
            {
              id: "closing",
              type: "process",
              title: "Cerrar la venta",
              description: "Finalizar negociación y generar contrato",
              responsible: "Ventas",
              duration: "1-2 días",
              inputs: ["Acuerdo verbal"],
              outputs: ["Contrato firmado"]
            }
          ]
        }
      }
    },
    {
      id: "ejemplo-auditoria-seguridad",
      type: "examples" as const,
      title: "Ejemplo 2: Proceso de Auditoría de Seguridad",
      content: `Específico para empresas como SICMON - proceso completo de auditoría en seguridad ocupacional:`,
      interactive: {
        type: "swimlane-process-viewer" as const,
        data: {
          processName: "Auditoría de Seguridad Ocupacional",
          description: "Proceso estándar para evaluación de seguridad en empresas cliente",
          lanes: [
            {
              id: "client",
              name: "Cliente",
              color: "#EF4444"
            },
            {
              id: "consultant",
              name: "Consultor SICMON", 
              color: "#3B82F6"
            },
            {
              id: "technical",
              name: "Equipo Técnico",
              color: "#10B981"
            },
            {
              id: "management",
              name: "Dirección",
              color: "#F59E0B"
            }
          ],
          steps: [
            { lane: "client", type: "start", text: "Solicita auditoría", position: 1 },
            { lane: "consultant", type: "process", text: "Revisión inicial de documentos", position: 2 },
            { lane: "consultant", type: "decision", text: "¿Documentación completa?", position: 3 },
            { lane: "client", type: "process", text: "Completa documentación faltante", position: 4 },
            { lane: "technical", type: "process", text: "Planificación de auditoría", position: 5 },
            { lane: "technical", type: "process", text: "Ejecución de auditoría en sitio", position: 6 },
            { lane: "technical", type: "process", text: "Análisis de hallazgos", position: 7 },
            { lane: "consultant", type: "process", text: "Elaboración de informe", position: 8 },
            { lane: "management", type: "process", text: "Revisión y aprobación", position: 9 },
            { lane: "client", type: "process", text: "Recibe informe final", position: 10 },
            { lane: "consultant", type: "process", text: "Seguimiento de implementación", position: 11 },
            { lane: "client", type: "end", text: "Certificación obtenida", position: 12 }
          ]
        }
      }
    },
    {
      id: "ejemplo-capacitacion",
      type: "examples" as const,
      title: "Ejemplo 3: Proceso de Capacitación Corporativa",
      content: `Proceso detallado para implementar programas de capacitación en seguridad:`,
      interactive: {
        type: "detailed-process-explorer" as const,
        data: {
          processName: "Capacitación en Seguridad Ocupacional",
          phases: [
            {
              name: "Análisis de Necesidades",
              steps: [
                "Evaluación de riesgos actuales",
                "Identificación de gaps de conocimiento", 
                "Definición de objetivos de aprendizaje",
                "Selección de audiencia objetivo"
              ],
              deliverables: ["Informe de necesidades", "Plan de capacitación"],
              duration: "1-2 semanas"
            },
            {
              name: "Diseño del Programa",
              steps: [
                "Desarrollo de contenido específico",
                "Selección de metodologías",
                "Preparación de materiales",
                "Definición de evaluaciones"
              ],
              deliverables: ["Contenido didáctico", "Evaluaciones", "Cronograma"],
              duration: "2-3 semanas"
            },
            {
              name: "Implementación",
              steps: [
                "Convocatoria a participantes",
                "Ejecución de sesiones",
                "Aplicación de evaluaciones",
                "Registro de asistencia"
              ],
              deliverables: ["Registros de capacitación", "Resultados de evaluación"],
              duration: "1-4 semanas"
            },
            {
              name: "Seguimiento",
              steps: [
                "Evaluación de efectividad",
                "Monitoreo de aplicación práctica",
                "Refuerzo de conocimientos",
                "Actualización de registros"
              ],
              deliverables: ["Informe de efectividad", "Plan de refuerzo"],
              duration: "Continuo"
            }
          ]
        }
      }
    },
    {
      id: "plantillas-personalizables",
      type: "examples" as const,
      title: "Plantillas Personalizables por Industria",
      content: `Explora plantillas específicas que puedes adaptar según tu industria o tipo de proceso:`,
      interactive: {
        type: "template-selector" as const,
        data: {
          industries: [
            {
              id: "manufacturing",
              name: "Manufactura",
              icon: "🏭",
              processes: [
                {
                  name: "Control de Calidad",
                  complexity: "Media",
                  duration: "2-4 horas",
                  keySteps: ["Inspección", "Testing", "Aprobación", "Documentación"]
                },
                {
                  name: "Mantenimiento Preventivo",
                  complexity: "Alta", 
                  duration: "4-8 horas",
                  keySteps: ["Planificación", "Inspección", "Mantenimiento", "Verificación"]
                }
              ]
            },
            {
              id: "healthcare",
              name: "Salud",
              icon: "🏥",
              processes: [
                {
                  name: "Admisión de Pacientes",
                  complexity: "Media",
                  duration: "30-60 min",
                  keySteps: ["Registro", "Verificación", "Asignación", "Notificación"]
                },
                {
                  name: "Protocolo de Emergencia",
                  complexity: "Alta",
                  duration: "Variable",
                  keySteps: ["Triage", "Evaluación", "Tratamiento", "Seguimiento"]
                }
              ]
            },
            {
              id: "consulting",
              name: "Consultoría",
              icon: "💼",
              processes: [
                {
                  name: "Desarrollo de Propuesta",
                  complexity: "Media",
                  duration: "3-5 días",
                  keySteps: ["Análisis", "Diseño", "Cotización", "Presentación"]
                },
                {
                  name: "Gestión de Proyecto",
                  complexity: "Alta",
                  duration: "Proyecto completo",
                  keySteps: ["Planeación", "Ejecución", "Monitoreo", "Cierre"]
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: "casos-reales-sicmon",
      type: "examples" as const,
      title: "Casos Reales: Contexto SICMON",
      content: `Analicemos casos específicos relevantes para empresas de consultoría en seguridad como SICMON:`,
      interactive: {
        type: "case-study-analyzer" as const,
        data: {
          cases: [
            {
              id: "iso45001-implementation",
              title: "Implementación ISO 45001",
              client: "Empresa Minera (500+ empleados)",
              challenge: "Necesitaban certificación ISO 45001 en 6 meses",
              solution: {
                phases: [
                  "Diagnóstico inicial (2 semanas)",
                  "Gap analysis (1 semana)", 
                  "Diseño del sistema (3 semanas)",
                  "Implementación (12 semanas)",
                  "Auditoría interna (2 semanas)",
                  "Certificación (2 semanas)"
                ],
                keyProcesses: [
                  "Identificación de peligros",
                  "Evaluación de riesgos",
                  "Controles operacionales",
                  "Respuesta a emergencias"
                ]
              },
              results: {
                certificationAchieved: true,
                timeToComplete: "22 semanas",
                incidentReduction: "40%",
                employeeSatisfaction: "85%"
              }
            },
            {
              id: "emergency-response",
              title: "Plan de Respuesta a Emergencias",
              client: "Planta Química (200 empleados)",
              challenge: "Actualizar protocolos después de incidente menor",
              solution: {
                phases: [
                  "Análisis del incidente (1 semana)",
                  "Revisión de protocolos existentes (1 semana)",
                  "Rediseño de procesos (2 semanas)",
                  "Capacitación del personal (3 semanas)",
                  "Simulacros y ajustes (2 semanas)"
                ],
                keyProcesses: [
                  "Detección de emergencia",
                  "Activación de alarmas",
                  "Evacuación de personal",
                  "Comunicación con autoridades",
                  "Post-emergencia"
                ]
              },
              results: {
                certificationAchieved: true,
                timeToComplete: "9 semanas",
                responseTimeImprovement: "60%",
                complianceScore: "95%"
              }
            }
          ]
        }
      }
    },
    {
      id: "herramientas-creacion",
      type: "examples" as const,
      title: "Herramientas para Crear Mapas",
      content: `Conoce las herramientas disponibles para crear mapas de procesos profesionales:`,
      interactive: {
        type: "tool-comparison" as const,
        data: {
          categories: [
            {
              name: "Herramientas Gratuitas",
              tools: [
                {
                  name: "Draw.io / Diagrams.net",
                  price: "Gratis",
                  pros: ["Fácil de usar", "Muchas plantillas", "Colaboración online"],
                  cons: ["Funciones limitadas", "No tiene análisis avanzado"],
                  bestFor: "Mapas básicos y medianos"
                },
                {
                  name: "Lucidchart (versión gratuita)",
                  price: "Gratis (limitado)",
                  pros: ["Interfaz intuitiva", "Integración con Google", "Plantillas profesionales"],
                  cons: ["Límite de documentos", "Funciones premium bloqueadas"],
                  bestFor: "Equipos pequeños"
                }
              ]
            },
            {
              name: "Herramientas Profesionales",
              tools: [
                {
                  name: "Microsoft Visio",
                  price: "$5-15/mes",
                  pros: ["Integración Office", "Símbolos estándar", "Análisis de datos"],
                  cons: ["Solo Windows", "Curva de aprendizaje"],
                  bestFor: "Empresas con Office 365"
                },
                {
                  name: "Bizagi Process Modeler",
                  price: "Gratis para modelado",
                  pros: ["Específico para BPM", "Documentación automática", "Validación de procesos"],
                  cons: ["Complejo para principiantes", "Enfoque muy técnico"],
                  bestFor: "Organizaciones grandes con BPM"
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: "actividad-creacion-propia",
      type: "examples" as const,
      title: "Actividad: Crea tu Propio Ejemplo",
      content: `Ahora es tu turno. Selecciona un proceso de tu área de trabajo y créalo usando los ejemplos como guía:`,
      interactive: {
        type: "guided-process-creator" as const,
        data: {
          steps: [
            {
              title: "Selecciona tu Proceso",
              description: "Elige un proceso que conozcas bien",
              options: [
                "Proceso administrativo (solicitudes, aprobaciones)",
                "Proceso técnico (inspecciones, evaluaciones)",
                "Proceso comercial (ventas, atención al cliente)",
                "Proceso de capacitación (diseño, implementación)",
                "Otro proceso específico de tu área"
              ]
            },
            {
              title: "Define los Participantes",
              description: "¿Quiénes están involucrados?",
              inputs: ["Iniciador", "Ejecutor", "Aprobador", "Cliente/Beneficiario"]
            },
            {
              title: "Lista las Actividades Principales",
              description: "Enumera los pasos principales (5-10 pasos)",
              template: "Actividad → Responsable → Tiempo estimado"
            },
            {
              title: "Identifica Puntos de Decisión",
              description: "¿Dónde se toman decisiones sí/no?",
              examples: ["¿Está aprobado?", "¿Cumple requisitos?", "¿Continuar?"]
            },
            {
              title: "Define Entradas y Salidas",
              description: "¿Qué se necesita y qué se produce?",
              template: "Entrada → Proceso → Salida"
            }
          ]
        }
      }
    },
    {
      id: "reflexion-ejemplos",
      type: "reflection" as const,
      title: "Reflexión: Aplicación de Ejemplos",
      content: `Después de revisar múltiples ejemplos de mapas de procesos, reflexiona sobre su aplicación práctica.
      
      **Preguntas para reflexionar:**
      • ¿Cuál de los ejemplos mostrados se parece más a los procesos de tu organización?
      • ¿Qué elementos de los casos SICMON podrías adaptar a tu contexto?
      • ¿Qué herramienta sería más apropiada para crear mapas en tu organización?
      • ¿Cómo podrías usar estos ejemplos para capacitar a tu equipo en mapeo de procesos?`,
      required: true
    }
  ]
};

export default modulo2Leccion7Content;
