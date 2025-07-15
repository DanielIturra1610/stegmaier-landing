import { FC } from 'react';
import React from 'react';
import { motion, Variants } from 'framer-motion';
import SectionConnector from '../../ui/SectionConnector';

// Datos de los valores corporativos
const values = [
  {
    id: 1,
    title: 'Excelencia',
    description: 'Buscamos la excelencia en cada proyecto, superando las expectativas de nuestros clientes con resultados excepcionales.',
    icon: '✨',
    color: 'from-primary-400 to-primary-600',
  },
  {
    id: 2,
    title: 'Integridad',
    description: 'Actuamos con honestidad y transparencia en todas nuestras operaciones, construyendo relaciones basadas en la confianza.',
    icon: '🤝',
    color: 'from-accent-400 to-accent-600',
  },
  {
    id: 3,
    title: 'Innovación',
    description: 'Nos adaptamos constantemente a los cambios del mercado, desarrollando soluciones creativas para los desafíos actuales.',
    icon: '💡',
    color: 'from-amber-400 to-amber-600',
  },
  {
    id: 4,
    title: 'Compromiso',
    description: 'Nos comprometemos con el éxito de nuestros clientes, acompañándolos en cada etapa del proceso de certificación.',
    icon: '📊',
    color: 'from-emerald-400 to-emerald-600',
  },
  {
    id: 5,
    title: 'Colaboración',
    description: 'Trabajamos en estrecha colaboración con nuestros clientes, creando equipos sinérgicos y orientados a resultados.',
    icon: '👥',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 6,
    title: 'Sostenibilidad',
    description: 'Promovemos prácticas empresariales sostenibles que beneficien tanto a las organizaciones como al entorno global.',
    icon: '🌱',
    color: 'from-green-400 to-green-600',
  },
];

const ValueCard: FC<{
  title: string;
  description: string;
  icon: string;
  color: string;
  index: number;
}> = ({ title, description, icon, color, index }) => {
  return (
    <motion.div 
      className="bg-primary-800/30 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br ${color}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/70">{description}</p>
    </motion.div>
  );
};

const Values: FC = () => {
  // Animaciones para los componentes
  const titleAnimation: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" as const } 
    }
  };

  return (
    <section 
      id="values" 
      className="section-unified-bg section-values-bg content-overlay relative py-16 md:py-20"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-grid-pattern opacity-5"></div>
      
      {/* Elementos de fondo decorativos */}
      <div className="minimal-decorations">
        <div className="absolute top-1/3 right-10 lg:right-20 w-64 h-64 bg-accent-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-10 lg:left-20 w-48 h-48 bg-primary-600/10 rounded-full blur-3xl"></div>
        
        {/* Línea animada diagonal */}
        <div className="absolute left-0 right-0 h-px top-1/3 overflow-hidden -z-10 rotate-2">
          <motion.div 
            className="h-full bg-gradient-to-r from-transparent via-white/5 to-transparent" 
            style={{ width: '30%' }}
            animate={{
              x: ['-100%', '400%'],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
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
          <span className="inline-block py-2 px-4 rounded-full bg-accent-500/20 text-white text-sm font-medium mb-3 backdrop-blur-sm  ">
            <span className="mr-2">⭐</span>Nuestros Valores
          </span>
          
          <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Principios que <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">nos definen</span>
          </h2>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-accent-500 opacity-70"></div>
          
          <p className="mt-6 text-lg text-white/80 max-w-3xl mx-auto">
            Los valores que guían nuestro trabajo diario y definen nuestra relación con los clientes.
          </p>
        </motion.header>
        
        {/* Grid de valores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <ValueCard 
              key={value.id} 
              {...value} 
              index={index}
            />
          ))}
        </div>
        
        {/* Cita destacada */}
        <motion.blockquote 
          className="mt-16 p-6 md:p-8 border-l-4 border-accent-500 bg-primary-800/30 rounded-r-lg backdrop-blur-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="text-lg md:text-xl text-white/90 italic">
            "Nuestros valores no son solo palabras en una página, son los principios que aplicamos en cada consultoría, 
            en cada interacción con un cliente y en cada certificación que logramos."
          </p>
          <footer className="mt-4 text-white/70">
            — Cecilia Stegmaier, <cite>Fundadora y CEO</cite>
          </footer>
        </motion.blockquote>
      </div>
      
      {/* Transición ultra-sutil hacia la siguiente sección */}
      <SectionConnector 
        fromSection="values" 
        toSection="team" 
        type="minimal"
        height={40}
      />
    </section>
  );
};

export default Values;
