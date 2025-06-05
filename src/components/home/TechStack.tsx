import React from 'react';

interface TechItem {
  id: number;
  name: string;
  icon: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'tools';
  level: number; // 1-5 para representar nivel de experiencia
}

const techStack: TechItem[] = [
  // Frontend
  { id: 1, name: 'React', icon: '⚛️', category: 'frontend', level: 5 },
  { id: 2, name: 'TypeScript', icon: '🔷', category: 'frontend', level: 5 },
  { id: 3, name: 'JavaScript', icon: '🟨', category: 'frontend', level: 5 },
  { id: 4, name: 'HTML5', icon: '🌐', category: 'frontend', level: 5 },
  { id: 5, name: 'CSS3/SASS', icon: '🎨', category: 'frontend', level: 4 },
  { id: 6, name: 'Tailwind CSS', icon: '🌊', category: 'frontend', level: 4 },
  
  // Backend
  { id: 7, name: 'Python', icon: '🐍', category: 'backend', level: 5 },
  { id: 8, name: 'FastAPI', icon: '⚡', category: 'backend', level: 5 },
  { id: 9, name: 'Django', icon: '🧩', category: 'backend', level: 3 },
  { id: 10, name: 'Node.js', icon: '🟢', category: 'backend', level: 3 },
  
  // Database
  { id: 11, name: 'PostgreSQL', icon: '🐘', category: 'database', level: 5 },
  { id: 12, name: 'MongoDB', icon: '🍃', category: 'database', level: 3 },
  { id: 13, name: 'SQLite', icon: '📊', category: 'database', level: 4 },
  
  // DevOps
  { id: 14, name: 'Docker', icon: '🐳', category: 'devops', level: 4 },
  { id: 15, name: 'CI/CD', icon: '🔄', category: 'devops', level: 4 },
  { id: 16, name: 'Git', icon: '📝', category: 'devops', level: 5 },
  
  // Tools
  { id: 17, name: 'VS Code', icon: '💻', category: 'tools', level: 5 },
  { id: 18, name: 'Jira', icon: '📋', category: 'tools', level: 4 },
  { id: 19, name: 'Slack', icon: '💬', category: 'tools', level: 5 },
];

const TechStack: React.FC = () => {
  // Agrupar tecnologías por categoría
  const categories = {
    frontend: techStack.filter(tech => tech.category === 'frontend'),
    backend: techStack.filter(tech => tech.category === 'backend'),
    database: techStack.filter(tech => tech.category === 'database'),
    devops: techStack.filter(tech => tech.category === 'devops'),
    tools: techStack.filter(tech => tech.category === 'tools'),
  };
  
  const categoryLabels = {
    frontend: 'Frontend',
    backend: 'Backend',
    database: 'Bases de Datos',
    devops: 'DevOps',
    tools: 'Herramientas',
  };
  
  return (
    <section id="stack" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Stack Tecnológico</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Tecnologías Modernas
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Mi toolkit incluye tecnologías actualizadas para cada aspecto del desarrollo, desde el frontend hasta DevOps.
          </p>
        </div>
        
        <div className="mt-16 space-y-12">
          {(Object.keys(categories) as Array<keyof typeof categories>).map((category) => (
            <div key={category} className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                {categoryLabels[category]}
                <div className="ml-2 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                  {categories[category].length}
                </div>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {categories[category].map((tech) => (
                  <div key={tech.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col items-center text-center">
                    <div className="text-4xl mb-2">{tech.icon}</div>
                    <h4 className="text-lg font-medium text-gray-900">{tech.name}</h4>
                    <div className="mt-2 flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-2 w-6 rounded-full ${
                            i < tech.level ? 'bg-blue-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-blue-700 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">¿Necesitas una tecnología específica?</h3>
          <p className="text-lg mb-6">
            Me adapto rápidamente a nuevas tecnologías según las necesidades de cada proyecto.
          </p>
          <a 
            href="#contacto" 
            className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors"
          >
            Hablemos de tu proyecto
          </a>
        </div>
      </div>
    </section>
  );
};

export default TechStack;
