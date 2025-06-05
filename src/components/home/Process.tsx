import React from 'react';

interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: JSX.Element;
}

const processSteps: ProcessStep[] = [
  {
    id: 1,
    title: 'Análisis Inicial',
    description: 'Comprensión detallada de tus necesidades, objetivos de negocio y visión del proyecto. Identificación de usuarios y sus necesidades.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Evaluación de Riesgos',
    description: 'Identificación proactiva de posibles obstáculos y elaboración de estrategias de mitigación para garantizar el éxito del proyecto.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Planificación y Presupuesto',
    description: 'Elaboración de un plan detallado con estimaciones realistas, presupuesto transparente y cronograma de entregables.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 4,
    title: 'Diseño y Arquitectura',
    description: 'Diseño de interfaces, experiencia de usuario y arquitectura técnica optimizada para cumplir con los requerimientos y futuro crecimiento.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  },
  {
    id: 5,
    title: 'Desarrollo Iterativo',
    description: 'Implementación por sprints con metodologías ágiles (SCRUM), entregables incrementales y feedback continuo para ajustar el rumbo.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
      </svg>
    ),
  },
  {
    id: 6,
    title: 'Testing Riguroso',
    description: 'Pruebas exhaustivas (unitarias, integración, e2e) para asegurar la calidad, seguridad y robustez de la aplicación en todo momento.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 7,
    title: 'Implementación',
    description: 'Despliegue seguro en producción utilizando CI/CD, garantizando una transición suave con mínimo impacto en tus operaciones.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
  },
  {
    id: 8,
    title: 'Soporte y Evolución',
    description: 'Acompañamiento continuo post-implementación, capacitación, monitoreo y mejora constante para adaptarse a nuevas necesidades.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const Process: React.FC = () => {
  return (
    <section id="proceso" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Metodología</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Un proceso claro y transparente
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Sigo un enfoque estructurado con comunicación constante, minimizando riesgos y asegurando la calidad en cada fase.
          </p>
        </div>

        <div className="mt-16 relative">
          {/* Línea temporal vertical (visible en desktop) */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-blue-200"></div>
          
          <div className="space-y-16">
            {processSteps.map((step, index) => (
              <div key={step.id} className={`relative ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} md:flex`}>
                {/* Punto en la línea temporal (visible en desktop) */}
                <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 -mt-2">
                  <div className="h-8 w-8 rounded-full border-4 border-blue-200 bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{step.id}</span>
                  </div>
                </div>
                
                {/* Contenido del paso (adaptable a móvil y desktop) */}
                <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className={`flex items-center ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                      <div className="mr-4 md:order-last md:ml-4 md:mr-0 text-blue-600">
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Espacio vacío para el layout alternado en desktop */}
                <div className="hidden md:block md:w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center">
            <a 
              href="#proyectos" 
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Ver proyectos destacados
            </a>
            <a 
              href="#contacto" 
              className="inline-flex items-center justify-center px-5 py-3 border border-blue-700 text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors"
            >
              Consulta sobre tu proyecto
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
