/**
 * Contenido interactivo para Módulo 2 - Lección III: Cómo crear un mapa de procesos
 * Curso: Sistema de Gestión Integrado SICMON
 */

export const modulo2Leccion3Content = {
  title: "Lección III: Cómo crear un mapa de procesos",
  moduleTitle: "Módulo 2: Fundamentos de Mapa de Procesos",
  sections: [
    {
      id: "introduccion-creacion",
      type: "text" as const,
      title: "Proceso Simple pero Poderoso",
      content: `Crear un mapa de procesos es simple y se puede hacer en papel o en un software de gestión de flujos de trabajo 
      y con plantillas. Los pasos a continuación explican cómo crear un mapa de procesos desde cero. [REVEAL]
      🎯 **Lo que aprenderás:**
      • 7 pasos estructurados para crear mapas efectivos
      • Técnicas para identificar procesos problemáticos
      • Herramientas digitales y análogas disponibles
      • Metodología probada en la industria`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "paso-1-identificar",
      type: "process" as const,
      title: "Paso 1: Identifica un proceso para diagramar",
      content: `Primero, determina el proceso que quieres representar. ¿Hay algún proceso ineficiente que deba mejorarse? 
      ¿Un proceso nuevo que quisieras comunicar de manera concisa a tu equipo? ¿Un proceso complejo que siempre genera 
      preguntas por parte de los empleados? Identifica lo que quieres diagramar y asígnale un nombre.`,
      interactive: {
        type: "process-selector" as const,
        data: {
          criteria: [
            {
              id: "inefficient",
              title: "🔴 Proceso Ineficiente",
              description: "Tiene cuellos de botella o demoras recurrentes",
              examples: ["Aprobación de documentos que toma semanas", "Proceso de compras muy lento"]
            },
            {
              id: "new",
              title: "🆕 Proceso Nuevo",
              description: "Necesita ser comunicado claramente al equipo",
              examples: ["Nueva metodología de trabajo", "Procedimiento recién implementado"]
            },
            {
              id: "complex",
              title: "🔧 Proceso Complejo",
              description: "Genera confusión o preguntas frecuentes",
              examples: ["Proceso con múltiples aprobaciones", "Workflow con muchas excepciones"]
            },
            {
              id: "training",
              title: "📚 Para Capacitación",
              description: "Necesario para entrenar nuevos empleados",
              examples: ["Procedimientos de inducción", "Protocolos de seguridad"]
            }
          ]
        }
      }
    },
    {
      id: "paso-2-actores",
      type: "process" as const,
      title: "Paso 2: Determina qué actores intervienen",
      content: `Es importante que puedas identificar a las personas, responsables o departamentos que serán claves 
      para la elaboración de las tareas que conformen el proceso que quieres mapear.`,
      interactive: {
        type: "stakeholder-mapper" as const,
        data: {
          roles: [
            { id: "initiator", title: "Iniciador", description: "Quien comienza el proceso", icon: "🚀" },
            { id: "approver", title: "Aprobador", description: "Quien autoriza o valida", icon: "✅" },
            { id: "executor", title: "Ejecutor", description: "Quien realiza las tareas", icon: "⚙️" },
            { id: "reviewer", title: "Revisor", description: "Quien controla calidad", icon: "🔍" },
            { id: "customer", title: "Cliente/Usuario", description: "Quien recibe el resultado", icon: "👤" }
          ],
          departments: [
            "Administración", "Recursos Humanos", "Operaciones", "Calidad", 
            "Seguridad", "Sistemas", "Comercial", "Dirección"
          ]
        }
      }
    },
    {
      id: "paso-3-actividades",
      type: "process" as const,
      title: "Paso 3: Enumera todas las actividades",
      content: `Documenta todas las tareas necesarias para llevar a cabo el proceso. En esta etapa el orden no es importante. 
      Haz una lista de todas las actividades relacionadas y quién será el responsable de cada una. [REVEAL]
      💡 **Consejos importantes:**
      • Colabora con compañeros involucrados en el proceso
      • Identifica con precisión todos los pasos necesarios
      • Determina el nivel de detalle que se necesita
      • Establece dónde comienza y termina el proceso`,
      interactive: {
        type: "click-to-reveal" as const,
      }
    },
    {
      id: "actividad-brainstorming",
      type: "examples" as const,
      title: "Actividad: Brainstorming de Actividades",
      content: `Vamos a practicar identificando actividades para un proceso de "Solicitud de Capacitación". 
      Arrastra las actividades correctas a la lista del proceso:`,
      interactive: {
        type: "drag-drop" as const,
        data: {
          items: [
            { id: "1", text: "Empleado identifica necesidad de capacitación", category: "proceso" },
            { id: "2", text: "Preparar el café", category: "irrelevante" },
            { id: "3", text: "Completar formulario de solicitud", category: "proceso" },
            { id: "4", text: "Revisar redes sociales", category: "irrelevante" },
            { id: "5", text: "Supervisor revisa y aprueba solicitud", category: "proceso" },
            { id: "6", text: "RRHH verifica presupuesto disponible", category: "proceso" },
            { id: "7", text: "Buscar proveedores de capacitación", category: "proceso" },
            { id: "8", text: "Organizar fiesta de oficina", category: "irrelevante" },
            { id: "9", text: "Coordinar fechas y horarios", category: "proceso" },
            { id: "10", text: "Evaluar resultados de la capacitación", category: "proceso" }
          ],
          categories: [
            { id: "proceso", title: "Actividades del Proceso" },
            { id: "irrelevante", title: "Actividades Irrelevantes" }
          ]
        }
      }
    },
    {
      id: "paso-4-secuencia",
      type: "process" as const,
      title: "Paso 4: Establece la secuencia de los pasos",
      content: `Ahora que ya cuentas con una lista de todas las actividades y miembros necesarios, el próximo paso es 
      ordenar estas actividades en la secuencia correcta, hasta que el proceso completo esté representado de principio a fin. 
      Este es un buen momento para revisar si se omitió algo en el paso anterior.`,
      interactive: {
        type: "sequence-builder" as const,
        data: {
          activities: [
            "Empleado identifica necesidad",
            "Completa formulario de solicitud", 
            "Supervisor revisa solicitud",
            "RRHH verifica presupuesto",
            "Buscar proveedores",
            "Coordinar fechas",
            "Ejecutar capacitación",
            "Evaluar resultados"
          ]
        }
      }
    },
    {
      id: "paso-5-diagrama",
      type: "process" as const,
      title: "Paso 5: Crea el diagrama de flujo",
      content: `Selecciona el formato de mapa de procesos adecuado y crea el proceso con la simbología correspondiente. 
      Hay aproximadamente 30 símbolos estándar que puedes utilizar para representar diferentes elementos del proceso, 
      pero cubriremos los más comunes con mayor detalle más adelante en este artículo.`,
      interactive: {
        type: "diagram-builder" as const,
        data: {
          symbols: [
            { id: "start", name: "Inicio/Fin", shape: "oval", color: "green" },
            { id: "process", name: "Proceso", shape: "rectangle", color: "blue" },
            { id: "decision", name: "Decisión", shape: "diamond", color: "yellow" },
            { id: "document", name: "Documento", shape: "document", color: "purple" }
          ]
        }
      }
    },
    {
      id: "paso-6-revision",
      type: "process" as const,
      title: "Paso 6: Agrega detalles y compártelos",
      content: `Una vez que hayas terminado de crear tu mapa de procesos, revísalo junto con los otros participantes 
      involucrados en el proceso para asegurarte de que todos lo entiendan y estén de acuerdo con la forma en que el 
      proceso fue creado. Asegúrate de que no se haya omitido ningún paso y de que no existan redundancias o ambigüedades.`,
      interactive: {
        type: "checklist-validator" as const,
        data: {
          checkpoints: [
            "¿Todos los participantes entienden el diagrama?",
            "¿Se incluyeron todos los pasos necesarios?",
            "¿No hay redundancias en el proceso?",
            "¿Se eliminaron las ambigüedades?",
            "¿Los símbolos son consistentes y correctos?",
            "¿Las conexiones entre pasos están claras?"
          ]
        }
      }
    },
    {
      id: "paso-7-mejora",
      type: "process" as const,
      title: "Paso 7: Analiza oportunidades de mejora",
      content: `Después de haber confirmado que el mapa de procesos describe con claridad el flujo de trabajo del proceso, 
      el mapa completo servirá como una herramienta de mejora continua de dicho proceso. Con la ayuda de los comentarios 
      de tu equipo, identifica dónde se encuentran los cuellos de botella y las ineficiencias del proceso.`,
      interactive: {
        type: "improvement-analyzer" as const,
        data: {
          questions: [
            "¿Qué pasos se podrían eliminar?",
            "¿Qué tareas podrían hacerse con más eficiencia?",
            "¿Dónde están los cuellos de botella?",
            "¿Qué actividades no agregan valor?",
            "¿Cómo podríamos automatizar parte del proceso?"
          ]
        }
      }
    },
    {
      id: "reflexion-practica",
      type: "reflection" as const,
      title: "Reflexión: Tu Primer Mapa de Procesos",
      content: `Ahora que conoces los 7 pasos para crear un mapa de procesos, piensa en un proceso específico 
      de tu trabajo actual que podrías mapear.
      
      **Preguntas para reflexionar:**
      • ¿Qué proceso específico de tu trabajo elegirías para mapear y por qué?
      • ¿Quiénes serían los actores clave que necesitarías involucrar?
      • ¿Cuáles crees que serían los principales desafíos al crear este mapa?
      • ¿Qué mejoras esperas identificar con este ejercicio?`,
      required: true
    }
  ]
};

export default modulo2Leccion3Content;
