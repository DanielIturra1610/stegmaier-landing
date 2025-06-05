import React, { useState } from 'react';

interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  category: 'dashboard' | 'database' | 'web' | 'app';
  url?: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: 'Sistema Centralizado de Métricas',
    description: 'Sistema centralizado para la recolección y visualización de métricas de calidad en tiempo real, implementado para Quality Metrics.',
    image: '/placeholder-dashboard.jpg',
    technologies: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker'],
    category: 'dashboard',
  },
  {
    id: 2,
    title: 'Dashboard de Indicadores Empresariales',
    description: 'Dashboard interactivo con métricas clave para toma de decisiones empresariales, con integración a múltiples fuentes de datos.',
    image: '/placeholder-dashboard.jpg',
    technologies: ['TypeScript', 'React', 'D3.js', 'Node.js', 'MongoDB'],
    category: 'dashboard',
  },
  {
    id: 3,
    title: 'Sistema Integrado de Gestión',
    description: 'Plataforma web para gestión integral de recursos, procesos y proyectos, con módulos personalizados según las necesidades del cliente.',
    image: '/placeholder-web.jpg',
    technologies: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Redis'],
    category: 'web',
  },
  {
    id: 4,
    title: 'Arquitectura de Base de Datos Distribuida',
    description: 'Diseño e implementación de arquitectura de datos distribuida con alta disponibilidad y escalabilidad para empresa del sector financiero.',
    image: '/placeholder-database.jpg',
    technologies: ['PostgreSQL', 'TimescaleDB', 'Docker', 'Python'],
    category: 'database',
  }
];

const Projects: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const filteredProjects = activeFilter === 'all' 
    ? projects 
    : projects.filter(project => project.category === activeFilter);
    
  return (
    <section id="proyectos" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Proyectos</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Trabajos destacados
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Conozca algunos de los proyectos en los que he trabajado, especializándome en la creación de sistemas de datos y dashboards.
          </p>
        </div>
        
        {/* Filtros de categoría */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('dashboard')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Dashboards
          </button>
          <button
            onClick={() => setActiveFilter('database')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'database' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Bases de Datos
          </button>
          <button
            onClick={() => setActiveFilter('web')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'web' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Aplicaciones Web
          </button>
        </div>
        
        {/* Tarjetas de proyectos */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-48 bg-gray-300 relative">
                {/* Aquí irá la imagen real del proyecto */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                  <div className="text-center p-4">
                    <p className="text-lg font-bold">{project.category === 'dashboard' ? 'Dashboard' : 
                      project.category === 'database' ? 'Base de Datos' : 
                      project.category === 'web' ? 'Aplicación Web' : 'Aplicación'}</p>
                    <p className="text-sm opacity-80">Imagen representativa</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                
                {project.url ? (
                  <a 
                    href={project.url} 
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver proyecto
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span className="text-gray-500 text-sm italic">Proyecto privado - No disponible públicamente</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* CTA para más proyectos */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Estos son solo algunos ejemplos de los proyectos en los que he trabajado. ¿Tienes una idea similar o necesitas una solución personalizada?
          </p>
          <a 
            href="#contacto" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Hablemos sobre tu proyecto
          </a>
        </div>
      </div>
    </section>
  );
};

export default Projects;
