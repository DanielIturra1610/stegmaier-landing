import React from 'react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative bg-gradient-to-r from-blue-900 to-indigo-800 pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Overlay de partículas o patrón */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7 xl:col-span-6">
            <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-white sm:mt-5 sm:text-5xl lg:mt-6 xl:text-6xl">
              <span className="block">Desarrollo Fullstack</span>
              <span className="block text-indigo-300">con soluciones integrales</span>
            </h1>
            <p className="mt-3 text-base text-white sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
              Analista Programador especializado en crear sistemas centralizados de datos, dashboards interactivos y aplicaciones web de alto rendimiento.
            </p>
            
            <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
              <a 
                href="#servicios" 
                className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
              >
                Servicios
              </a>
              <a 
                href="#contacto" 
                className="flex items-center justify-center px-5 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white/10 transition duration-150 ease-in-out"
              >
                Contactar
              </a>
            </div>
            
            {/* Tags de especialidades */}
            <div className="mt-8 hidden md:block">
              <div className="flex flex-wrap gap-2">
                {['Python', 'React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Docker', 'CI/CD'].map((tag) => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-5 xl:col-span-6">
            <div className="relative h-64 sm:h-72 lg:h-96 w-full rounded-xl shadow-xl overflow-hidden bg-gray-800">
              {/* Aquí iría una imagen o alguna ilustración/animación relevante */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-blue-600 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Desarrollo Fullstack</h3>
                <p className="text-gray-300">De la idea al producto final, acompañamiento integral en todo el ciclo de vida del proyecto</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
