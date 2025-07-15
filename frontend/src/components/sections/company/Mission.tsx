import { FC } from 'react';
import { motion, Variants } from 'framer-motion';
import SectionConnector from '../../ui/SectionConnector';
import React from 'react';

const Mission: FC = () => {
  // Animaciones para los componentes
  const titleAnimation: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" as const } 
    }
  };

  const cardAnimation: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i: number) => ({ 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, delay: 0.1 * i } 
    })
  };

  // Elementos de la misión
  const missionElements = [
    {
      id: 1,
      title: "Excelencia en Consultoría",
      description: "Ofrecer servicios de consultoría ISO del más alto nivel, con profesionales expertos y metodologías probadas.",
      icon: "⭐",
      color: "from-accent-400 to-accent-600"
    },
    {
      id: 2,
      title: "Soluciones Personalizadas",
      description: "Desarrollar planes y estrategias adaptadas a las necesidades específicas de cada cliente y su sector.",
      icon: "🛠️",
      color: "from-amber-400 to-amber-600"
    },
    {
      id: 3,
      title: "Resultados Garantizados",
      description: "Acompañar a nuestros clientes hasta lograr sus objetivos de certificación y mejora continua.",
      icon: "🏆",
      color: "from-primary-400 to-primary-600"
    }
  ];

  return (
    <section 
      id="mission" 
      className="section-unified-bg section-mission-bg content-overlay relative py-16 md:py-20"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-grid-pattern opacity-5"></div>
      
      {/* Elementos de fondo decorativos */}
      <div className="minimal-decorations">
        <div className="absolute top-1/3 right-10 lg:right-20 w-56 h-56 bg-amber-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-10 lg:left-20 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl"></div>
        
        {/* Decoración geométrica sutil */}
        <div className="absolute right-0 top-1/4 w-32 h-32 opacity-20">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="49" stroke="url(#paint0_linear)" strokeWidth="2"/>
            <defs>
              <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.4"/>
                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      <div className="container mx-auto px-4 max-w-6xl content-overlay">
        <motion.header 
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={titleAnimation}
        >
          <span className="inline-block py-2 px-4 rounded-full bg-amber-500/20 text-white text-sm font-medium mb-3 backdrop-blur-sm">
            <span className="mr-2">🎯</span>Nuestra Misión
          </span>
          
          <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Lo que <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-300 to-amber-500">nos mueve</span>
          </h2>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-amber-500 opacity-70"></div>
          
          <p className="mt-6 text-lg text-white/80 max-w-3xl mx-auto">
            Guiamos a las organizaciones a alcanzar la excelencia a través de sistemas de gestión certificados internacionalmente.
          </p>
        </motion.header>
        
        {/* Contenido principal en dos columnas */}
        <div className="flex flex-col lg:flex-row gap-10 mb-16 items-center">
          {/* Columna izquierda */}
          <motion.div 
            className="lg:w-1/2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={titleAnimation}
          >
            <div className="bg-primary-800/40 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Nuestro propósito</h3>
              
              <p className="text-white/80 text-lg mb-6 leading-relaxed">
                "Potenciar el crecimiento y la competitividad de las empresas a través de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-300 font-semibold">implementación efectiva</span> de estándares internacionales de gestión y mejora continua."
              </p>
              
              <div className="mt-8 relative">
                <div className="absolute -inset-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 blur-sm"></div>
                <blockquote className="relative bg-primary-800/70 backdrop-blur-sm p-6 rounded-lg border-l-4 border-amber-500">
                  <p className="text-white/90 italic">
                    "Cada certificación que logramos representa una organización más fuerte, más eficiente y mejor preparada para los desafíos del mercado global."
                  </p>
                  <footer className="mt-4 text-white/70">
                    — Equipo Stegmaier Consulting
                  </footer>
                </blockquote>
              </div>
            </div>
          </motion.div>
          
          {/* Columna derecha - Elementos de la misión */}
          <div className="lg:w-1/2">
            <div className="space-y-6">
              {missionElements.map((element, index) => (
                <motion.div
                  key={element.id}
                  className="bg-primary-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg"
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={cardAnimation}
                  whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                >
                  <div className="flex gap-4 items-start">
                    <div className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${element.color}`}>
                      <span className="text-2xl">{element.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{element.title}</h4>
                      <p className="text-white/70">{element.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sección destacada - Nuestro compromiso */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              Nuestro <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-300 to-primary-500">compromiso</span> con cada cliente
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Profesionalismo</h4>
              <p className="text-white/70">Equipo altamente capacitado con amplia experiencia en diferentes industrias.</p>
            </div>
            
            <div className="bg-primary-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-accent-400 to-accent-600 mb-4">
                <span className="text-2xl">⏱️</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Eficiencia</h4>
              <p className="text-white/70">Procesos optimizados que maximizan resultados y minimizan tiempos.</p>
            </div>
            
            <div className="bg-primary-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Compromiso</h4>
              <p className="text-white/70">Acompañamiento completo desde el diagnóstico hasta la certificación.</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Transición ultra-sutil hacia la siguiente sección */}
      <SectionConnector 
        fromSection="vision" 
        toSection="history" 
        type="minimal"
        height={40}
      />
    </section>
  );
};

export default Mission;