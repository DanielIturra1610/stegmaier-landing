import { FC } from 'react';
import { motion, Variants } from 'framer-motion';
import SectionConnector from '../../ui/SectionConnector';

const CompanyHeroBackground: FC = () => (
  <div className="minimal-decorations">
    {/* Elementos decorativos siguiendo el sistema unificado */}
    <div className="absolute top-1/3 right-10 lg:right-20 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-1/4 left-10 lg:left-20 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl"></div>
    
    {/* Patrón de fondo sutil */}
    <div className="absolute inset-0 minimal-grid opacity-10"></div>
    
    {/* Elementos flotantes ligeros */}
    <motion.div
      className="absolute right-10 top-1/4 w-12 h-12 border border-white/10 rounded-full"
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    
    {/* Línea animada horizontal */}
    <div className="absolute left-0 right-0 h-px top-2/3 overflow-hidden -z-10">
      <motion.div 
        className="h-full bg-gradient-to-r from-transparent via-white/10 to-transparent" 
        style={{ width: '30%' }}
        animate={{
          x: ['-100%', '400%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  </div>
);

// Animaciones
const titleAnimation: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const } 
  }
};

const subtitleAnimation: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.7, delay: 0.3, ease: "easeOut" as const } 
  }
};

const decorationAnimation: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" as const } 
  }
};

const CompanyHero: FC = () => {
  return (
    <section className="section-unified-bg section-company-bg content-overlay relative py-20 lg:py-32">
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-grid-pattern opacity-5"></div>
      
      {/* Elementos de fondo decorativos */}
      <CompanyHeroBackground />
      
      <div className="container mx-auto px-4 max-w-6xl content-overlay">
        <div className="flex flex-col items-center justify-center text-center">
          <motion.span 
            className="inline-block py-2 px-4 rounded-full bg-accent-500/20 text-white text-sm font-medium mb-3 backdrop-blur-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mr-2">🏢</span>Conócenos
          </motion.span>
          
          <motion.h1 
            className="mt-2 text-4xl md:text-5xl xl:text-6xl font-display font-bold text-white leading-tight"
            initial="hidden"
            animate="visible"
            variants={titleAnimation}
          >
            Sobre <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">Stegmaier</span> Consulting
          </motion.h1>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-accent-500 opacity-70"></div>
          
          <motion.p 
            className="mt-6 text-lg text-white/80 max-w-3xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={subtitleAnimation}
          >
            Más de 15 años de experiencia en consultoría y certificación de sistemas de gestión.
            Somos líderes en implementación de normativas ISO para empresas en toda Latinoamérica.
          </motion.p>

          <motion.div 
            className="mt-8 flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <a 
              href="#history" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                        rounded-md shadow-sm text-base font-medium text-white bg-primary-600 
                        hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                        focus:ring-primary-500 transition-all duration-300"
            >
              Nuestra Historia
            </a>
            <a 
              href="#team" 
              className="inline-flex items-center justify-center px-6 py-3 border border-primary-300 
                        rounded-md shadow-sm text-base font-medium text-white bg-transparent 
                        hover:bg-primary-700/30 focus:outline-none focus:ring-2 focus:ring-offset-2 
                        focus:ring-primary-500 transition-all duration-300"
            >
              Conoce al Equipo
            </a>
          </motion.div>
        </div>
      </div>
      
      {/* Transición ultra-sutil hacia la siguiente sección */}
      <SectionConnector 
        fromSection="company" 
        toSection="history" 
        type="minimal"
        height={40}
      />
    </section>
  );
};

export default CompanyHero;
