/**
 * Contenido interactivo para Módulo 2 - Lección VIII: Técnicas de mapas de procesos
 * Curso: Sistema de Gestión Integrado SICMON
 */

export const modulo2Leccion8Content = {
  title: "Lección VIII: Técnicas de mapas de procesos",
  moduleTitle: "Módulo 2: Fundamentos de Mapa de Procesos",
  sections: [
    {
      id: "introduccion-tecnicas",
      type: "text" as const,
      title: "Técnicas para Maximizar la Efectividad",
      content: `Puedes personalizar los mapas de procesos para que se ajusten a tus necesidades y preferencias, 
      pero también puedes tener en cuenta algunos consejos generales para maximizar su efectividad. 
      A continuación presentamos las mejores prácticas sobre mapas de procesos para aplicarlas cuando estés comenzando. [REVEAL]
      🎯 **Lo que dominarás:**
      • Técnicas de planificación efectiva
      • Métodos de diseño profesional
      • Estrategias de revisión y validación
      • Herramientas de mejora continua`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "tecnicas-planificacion",
      type: "process" as const,
      title: "Al Planificar tu Mapa de Procesos",
      content: `La fase de planificación es crucial para el éxito de tu mapa. Estas técnicas te ayudarán a establecer 
      bases sólidas desde el inicio:`,
      interactive: {
        type: "planning-techniques" as const,
        data: {
          techniques: [
            {
              id: "boundaries",
              title: "Establece los límites del proceso",
              description: "Define claramente dónde inicia y termina el proceso",
              why: "Solo incluye la información necesaria para el objetivo",
              example: "Proceso de contratación: desde publicación de vacante hasta firma de contrato",
              tips: [
                "Usa verbos de acción para definir inicio y fin",
                "Evita incluir procesos relacionados pero separados",
                "Define el alcance geográfico si aplica"
              ]
            },
            {
              id: "clear-objectives",
              title: "Establece objetivos claros",
              description: "Define para qué vas a usar este mapa específicamente",
              why: "Objetivos claros guían las decisiones de diseño",
              example: "Objetivo: Identificar cuellos de botella en aprobaciones",
              tips: [
                "Usa objetivos SMART (Específicos, Medibles, Alcanzables)",
                "Considera múltiples audiencias si es necesario",
                "Documenta el propósito principal"
              ]
            },
            {
              id: "outcome-focused",
              title: "Solo mapea procesos con resultado objetivo",
              description: "Enfócate en procesos que tienen un deliverable específico",
              why: "Procesos sin resultado claro son difíciles de mapear y mejorar",
              example: "❌ 'Trabajo en equipo' ✅ 'Proceso de toma de decisiones en equipo'",
              tips: [
                "Identifica el producto o servicio final",
                "Asegúrate que el resultado sea medible",
                "Valida que el proceso agregue valor"
              ]
            }
          ]
        }
      }
    },
    {
      id: "tecnicas-diseno",
      type: "process" as const,
      title: "Al Diseñar tu Mapa de Procesos",
      content: `Durante el diseño, estas técnicas profesionales harán que tu mapa sea más efectivo y fácil de entender:`,
      interactive: {
        type: "design-techniques" as const,
        data: {
          techniques: [
            {
              id: "backward-design",
              title: "Trabaja hacia atrás, desde la salida hacia la entrada",
              description: "Comienza por el resultado final y trabaja hacia el inicio",
              benefits: [
                "Identifica pasos realmente necesarios",
                "Elimina actividades que no contribuyen al resultado",
                "Clarifica la lógica del proceso"
              ],
              steps: [
                "Define el resultado final deseado",
                "Identifica la actividad que lo produce directamente",
                "Continúa hacia atrás hasta llegar al inicio",
                "Valida que cada paso agregue valor"
              ]
            },
            {
              id: "simple-subprocesses",
              title: "Mantén los subprocesos simples",
              description: "Divide procesos complejos en subprocesos manejables",
              guidelines: [
                "Máximo 7±2 elementos por nivel",
                "Un subproceso por función principal",
                "Usa referencias cruzadas cuando sea necesario"
              ],
              example: "Proceso principal: 'Contratación' → Subprocesos: 'Reclutamiento', 'Evaluación', 'Selección'"
            },
            {
              id: "right-detail-level",
              title: "Incluye los detalles necesarios, nada más y nada menos",
              description: "Balancear detalle vs claridad según la audiencia",
              levels: [
                {
                  audience: "Ejecutivos",
                  detail: "Alto nivel (5-10 pasos)",
                  focus: "Resultados y decisiones principales"
                },
                {
                  audience: "Gerentes",
                  detail: "Nivel medio (10-20 pasos)",
                  focus: "Responsabilidades y puntos de control"
                },
                {
                  audience: "Operadores",
                  detail: "Nivel detallado (20+ pasos)",
                  focus: "Instrucciones específicas y procedimientos"
                }
              ]
            },
            {
              id: "standard-notation",
              title: "Utiliza anotaciones estandarizadas",
              description: "Mantén consistencia en símbolos y convenciones",
              standards: [
                "BPMN (Business Process Model and Notation)",
                "UML (Unified Modeling Language)",
                "Símbolos básicos de diagramas de flujo"
              ],
              benefits: ["Comprensión universal", "Herramientas compatibles", "Facilita el mantenimiento"]
            }
          ]
        }
      }
    },
    {
      id: "tecnicas-revision",
      type: "process" as const,
      title: "Al Revisar tu Mapa de Procesos",
      content: `La revisión es donde se asegura la calidad y efectividad del mapa. Estas técnicas te ayudarán a perfeccionarlo:`,
      interactive: {
        type: "review-checklist" as const,
        data: {
          checklistCategories: [
            {
              name: "Validación con Stakeholders",
              items: [
                {
                  check: "Pide comentarios a todos los involucrados en el proceso",
                  why: "Las personas que ejecutan el proceso conocen los detalles reales",
                  method: "Sesiones de validación grupales o individuales"
                },
                {
                  check: "Verifica comprensión con usuarios finales",
                  why: "El mapa debe ser entendible por quienes lo usarán",
                  method: "Pruebas de usabilidad con lectura en voz alta"
                }
              ]
            },
            {
              name: "Completitud del Proceso",
              items: [
                {
                  check: "Detalla las rutas alternativas para condiciones especiales",
                  why: "Los procesos reales tienen excepciones y variaciones",
                  method: "Mapeo de escenarios 'what-if'"
                },
                {
                  check: "Verifica que no falten pasos críticos",
                  why: "Pasos faltantes pueden causar fallas en la ejecución",
                  method: "Walkthrough completo del proceso"
                }
              ]
            },
            {
              name: "Realismo del Mapa",
              items: [
                {
                  check: "Mapea el proceso actual, no el idealizado",
                  why: "Debes entender la realidad antes de mejorar",
                  method: "Observación directa y entrevistas"
                },
                {
                  check: "Incluye tiempos y recursos reales",
                  why: "Datos reales permiten análisis de eficiencia",
                  method: "Medición y registro de métricas actuales"
                }
              ]
            }
          ]
        }
      }
    },
    {
      id: "tecnicas-mejora-continua",
      type: "process" as const,
      title: "Técnicas de Mejora Continua",
      content: `Una vez creado tu mapa, estas técnicas te ayudarán a usarlo como herramienta de mejora continua:`,
      interactive: {
        type: "improvement-methodology" as const,
        data: {
          methodologies: [
            {
              name: "Análisis de Valor Agregado",
              description: "Clasificar actividades según el valor que aportan",
              steps: [
                "Clasifica cada actividad como: Valor Agregado (VA), Necesaria pero sin Valor (NAVA), o Sin Valor (NVA)",
                "Calcula porcentajes de cada categoría",
                "Elimina actividades NVA",
                "Minimiza actividades NAVA",
                "Optimiza actividades VA"
              ],
              benefits: ["Reducción de desperdicios", "Mejor eficiencia", "Menor costo"]
            },
            {
              name: "Análisis de Cuellos de Botella",
              description: "Identificar y resolver restricciones del proceso",
              steps: [
                "Mapea tiempos de ciclo para cada actividad",
                "Identifica la actividad más lenta (cuello de botella)",
                "Analiza causas del cuello de botella",
                "Implementa mejoras en esa actividad específica",
                "Reitera hasta equilibrar el flujo"
              ],
              tools: ["Gráficos de capacidad", "Análisis de cola", "Simulación de procesos"]
            },
            {
              name: "Mapeo de Riesgos",
              description: "Identificar puntos de falla potenciales",
              steps: [
                "Identifica puntos de riesgo en cada actividad",
                "Evalúa probabilidad e impacto de fallas",
                "Desarrolla controles preventivos",
                "Crea planes de contingencia",
                "Monitorea indicadores de riesgo"
              ],
              deliverables: ["Matriz de riesgos", "Controles preventivos", "Planes de contingencia"]
            }
          ]
        }
      }
    },
    {
      id: "herramientas-analisis",
      type: "examples" as const,
      title: "Herramientas de Análisis Avanzado",
      content: `Para análisis más profundos, puedes usar estas herramientas especializadas:`,
      interactive: {
        type: "analysis-tools" as const,
        data: {
          tools: [
            {
              name: "Análisis de Pareto (80/20)",
              use: "Identificar las causas más importantes de problemas",
              application: "80% de los problemas vienen del 20% de las causas",
              example: "80% de las quejas provienen del 20% de los procesos",
              howTo: [
                "Lista todos los problemas identificados",
                "Cuantifica su frecuencia o impacto",
                "Ordena de mayor a menor",
                "Calcula porcentajes acumulados",
                "Enfócate en el 20% que causa el 80% de problemas"
              ]
            },
            {
              name: "Diagrama de Ishikawa (Espina de Pescado)",
              use: "Analizar causas raíz de problemas en procesos",
              application: "Identificar todas las posibles causas de un problema",
              categories: ["Personas", "Procesos", "Materiales", "Máquinas", "Métodos", "Medio ambiente"],
              howTo: [
                "Define el problema principal (cabeza del pescado)",
                "Dibuja las categorías principales (espinas)",
                "Brainstorm causas para cada categoría",
                "Profundiza con 'Por qué?' en cada causa",
                "Prioriza las causas más probables"
              ]
            },
            {
              name: "Matriz RACI",
              use: "Clarificar roles y responsabilidades en cada paso",
              application: "Eliminar confusión sobre quién hace qué",
              roles: {
                "R": "Responsible (Responsable de ejecutar)",
                "A": "Accountable (Rendirá cuentas del resultado)",
                "C": "Consulted (Debe ser consultado)",
                "I": "Informed (Debe ser informado)"
              },
              benefits: ["Claridad de roles", "Menos duplicación", "Mejor accountability"]
            }
          ]
        }
      }
    },
    {
      id: "errores-comunes-tecnicas",
      type: "examples" as const,
      title: "Errores Comunes y Cómo Evitarlos",
      content: `Aprende de los errores más frecuentes para crear mapas más efectivos:`,
      interactive: {
        type: "common-mistakes" as const,
        data: {
          mistakes: [
            {
              error: "Incluir demasiado detalle desde el inicio",
              impact: "Mapa abrumador y difícil de entender",
              solution: "Usar enfoque iterativo: empezar simple y agregar detalle gradualmente",
              prevention: "Definir nivel de detalle según audiencia objetivo"
            },
            {
              error: "No validar con los ejecutores reales del proceso",
              impact: "Mapa que no refleja la realidad operativa",
              solution: "Involucrar a operadores desde el diseño inicial",
              prevention: "Establecer sesiones regulares de validación con usuarios"
            },
            {
              error: "Mapear el proceso 'ideal' en lugar del actual",
              impact: "No se identifican problemas reales ni mejoras necesarias",
              solution: "Hacer observación directa y entrevistas con ejecutores",
              prevention: "Documentar primero 'como es' antes de diseñar 'como debería ser'"
            },
            {
              error: "No actualizar el mapa cuando cambia el proceso",
              impact: "Mapa obsoleto que confunde en lugar de ayudar",
              solution: "Establecer proceso de mantenimiento y actualización regular",
              prevention: "Asignar owner del mapa y fechas de revisión periódica"
            },
            {
              error: "Usar símbolos inconsistentes o no estándar",
              impact: "Confusión y malinterpretación del flujo",
              solution: "Definir y documentar estándares de simbolización",
              prevention: "Usar plantillas estandarizadas y capacitar al equipo"
            }
          ]
        }
      }
    },
    {
      id: "casos-exito-tecnicas",
      type: "examples" as const,
      title: "Casos de Éxito: Técnicas Aplicadas",
      content: `Veamos ejemplos reales de cómo estas técnicas generaron resultados significativos:`,
      interactive: {
        type: "success-stories" as const,
        data: {
          cases: [
            {
              company: "Empresa Manufacturera - Línea de Producción",
              challenge: "Proceso de inspección de calidad tomaba 45 minutos por lote",
              techniqueUsed: "Análisis de Valor Agregado + Análisis de Cuellos de Botella",
              implementation: [
                "Mapearon cada paso del proceso de inspección",
                "Clasificaron actividades VA vs NAVA vs NVA",
                "Identificaron que 60% del tiempo era NVA (esperas y movimientos)",
                "Reorganizaron layout y eliminaron pasos redundantes"
              ],
              results: {
                timeReduction: "67% (de 45 min a 15 min)",
                qualityImprovement: "15% menos defectos",
                costSavings: "$50,000 anuales",
                employeeSatisfaction: "Reducción de frustración por proceso más fluido"
              }
            },
            {
              company: "Hospital - Proceso de Admisión",
              challenge: "Pacientes esperaban promedio 90 minutos para admisión",
              techniqueUsed: "Mapeo hacia atrás + Matriz RACI + Análisis de Pareto",
              implementation: [
                "Mapearon desde 'paciente admitido' hacia atrás",
                "Clarificaron roles con matriz RACI",
                "Identificaron que 80% de demoras venían de 3 pasos específicos",
                "Rediseñaron flujo eliminando pasos redundantes"
              ],
              results: {
                timeReduction: "55% (de 90 min a 40 min)",
                patientSatisfaction: "Aumento del 40%",
                staffProductivity: "25% más pacientes procesados por día",
                errorReduction: "30% menos errores administrativos"
              }
            },
            {
              company: "SICMON - Proceso de Auditoría ISO 45001",
              challenge: "Auditorías tomaban 3 semanas, clientes necesitaban más velocidad",
              techniqueUsed: "Técnicas de planificación + Rutas alternativas + Mejora continua",
              implementation: [
                "Establecieron límites claros (solo actividades de auditoría)",
                "Mapearon rutas para empresas pequeñas vs grandes",
                "Crearon plantillas estandarizadas por industria",
                "Implementaron revisión continua post-auditoría"
              ],
              results: {
                timeReduction: "40% (de 3 semanas a 1.8 semanas)",
                clientSatisfaction: "Aumento del 35%",
                revenueIncrease: "20% más auditorías por trimestre",
                qualityImprovement: "Estandarización del 95% de procedimientos"
              }
            }
          ]
        }
      }
    },
    {
      id: "plan-implementacion",
      type: "examples" as const,
      title: "Tu Plan de Implementación",
      content: `Crea tu plan personalizado para implementar estas técnicas en tu organización:`,
      interactive: {
        type: "implementation-planner" as const,
        data: {
          phases: [
            {
              name: "Fase 1: Preparación (Semana 1-2)",
              activities: [
                "Seleccionar proceso piloto (criterio: impacto medio, complejidad baja)",
                "Formar equipo de mapeo (incluir ejecutores del proceso)",
                "Definir objetivos específicos y métricas de éxito",
                "Preparar herramientas y plantillas"
              ],
              deliverables: ["Proceso seleccionado", "Equipo formado", "Objetivos definidos"],
              successCriteria: "Equipo alineado en objetivos y metodología"
            },
            {
              name: "Fase 2: Mapeo Inicial (Semana 3-4)",
              activities: [
                "Aplicar técnicas de planificación (límites, objetivos)",
                "Crear primer borrador usando diseño hacia atrás",
                "Validar con ejecutores del proceso",
                "Refinar y estandarizar símbolos"
              ],
              deliverables: ["Mapa inicial validado", "Documentación de proceso"],
              successCriteria: "95% de stakeholders aprueban el mapa como representativo"
            },
            {
              name: "Fase 3: Análisis y Mejora (Semana 5-6)",
              activities: [
                "Aplicar análisis de valor agregado",
                "Identificar cuellos de botella y desperdicios",
                "Proponer mejoras específicas",
                "Validar propuestas con equipo"
              ],
              deliverables: ["Análisis de mejoras", "Plan de implementación"],
              successCriteria: "Identificar al menos 3 mejoras concretas"
            },
            {
              name: "Fase 4: Implementación y Medición (Semana 7-10)",
              activities: [
                "Implementar mejoras priorizadas",
                "Actualizar mapa con nuevo proceso",
                "Medir resultados vs métricas iniciales",
                "Documentar lecciones aprendidas"
              ],
              deliverables: ["Proceso mejorado", "Métricas de resultado", "Lecciones aprendidas"],
              successCriteria: "Mejora medible en al menos 2 métricas clave"
            }
          ]
        }
      }
    },
    {
      id: "reflexion-tecnicas",
      type: "reflection" as const,
      title: "Reflexión: Aplicación de Técnicas",
      content: `Has completado el módulo completo de Fundamentos de Mapa de Procesos. Reflexiona sobre todo lo aprendido.
      
      **Preguntas para reflexionar:**
      • ¿Cuáles de estas técnicas serían más valiosas para implementar inmediatamente en tu trabajo?
      • ¿Qué obstáculos anticipas al aplicar estas técnicas en tu organización?
      • ¿Cómo podrías adaptar el plan de implementación a tu contexto específico?
      • ¿Qué proceso de tu área sería el mejor candidato para aplicar como piloto?
      • ¿Cómo medirías el éxito de implementar mapas de procesos en tu organización?`,
      required: true
    }
  ]
};

export default modulo2Leccion8Content;
