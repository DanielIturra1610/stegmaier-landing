import { FC } from 'react';
import React from 'react';
import { motion, Variants } from 'framer-motion';
import SectionConnector from '../../ui/SectionConnector';

const Vision: FC = () => {
  // Animaciones para los componentes
  const titleAnimation: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" as const } 
    }
  };

  const contentAnimation: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, delay: 0.2, ease: "easeOut" as const } 
    }
  };

  return (
    <section 
      id="vision" 
      className="section-unified-bg section-vision-bg content-overlay relative py-16 md:py-20"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-grid-pattern opacity-5"></div>
      
      {/* Elementos de fondo decorativos */}
      <div className="minimal-decorations">
        <div className="absolute top-1/4 left-10 lg:left-20 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-10 lg:right-20 w-48 h-48 bg-accent-600/10 rounded-full blur-3xl"></div>
        
        {/* Líneas decorativas */}
        <div className="absolute left-0 right-0 h-px top-1/2 overflow-hidden -z-10 -rotate-1">
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
          <span className="inline-block py-2 px-4 rounded-full bg-primary-500/20 text-white text-sm font-medium mb-3 backdrop-blur-sm">
            <span className="mr-2">👁️</span>Nuestra Visión
          </span>
          
          <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Hacia dónde <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-300 to-primary-500">nos dirigimos</span>
          </h2>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-primary-500 opacity-70"></div>
        </motion.header>
        
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          {/* Imagen o ilustración representativa */}
          <motion.div 
            className="lg:w-1/2 order-2 lg:order-1"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={contentAnimation}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/40 to-accent-600/40 rounded-2xl transform -rotate-2 scale-105 blur-sm"></div>
              <div className="relative bg-primary-800/50 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-xl">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                    <span className="text-3xl">🔭</span>
                  </div>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">Visión 2030</h3>
                
                <p className="text-white/80 text-lg mb-4 leading-relaxed">
                  "Ser reconocidos como el <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-200 to-primary-300 font-semibold">referente latinoamericano</span> en consultoría y certificación ISO, ofreciendo servicios innovadores que impulsen la transformación y competitividad de nuestros clientes en un entorno global."
                </p>
                
                <ul className="space-y-3 text-white/70">
                  <li className="flex items-start">
                    <span className="mr-2 text-accent-400">✓</span>
                    <span>Expandir nuestra presencia a toda América Latina</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-accent-400">✓</span>
                    <span>Desarrollar metodologías propias para la gestión de calidad</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-accent-400">✓</span>
                    <span>Crear un centro de innovación para nuevas certificaciones</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-accent-400">✓</span>
                    <span>Liderar la transformación digital en procesos de certificación</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
          
          {/* Contenido principal */}
          <motion.div 
            className="lg:w-1/2 order-1 lg:order-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={contentAnimation}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Nuestra aspiración</h3>
            
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              En Stegmaier Consulting aspiramos a transformar la forma en que las empresas implementan y obtienen valor de las normas ISO, llevando la excelencia operativa a un nuevo nivel.
            </p>
            
            <p className="text-white/80 text-lg mb-6 leading-relaxed">
              Visualizamos un futuro donde la certificación ISO no sea solo un requisito, sino una <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500 font-semibold">herramienta estratégica</span> que impulse la innovación y el crecimiento sostenible.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
              <div className="bg-primary-800/30 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-3">
                  <span className="text-xl">🌎</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Impacto Global</h4>
                <p className="text-white/70">Llevar nuestra experiencia más allá de las fronteras, impactando positivamente organizaciones en diferentes continentes.</p>
              </div>
              
              <div className="bg-primary-800/30 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-3">
                  <span className="text-xl">🚀</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Innovación Continua</h4>
                <p className="text-white/70">Desarrollar constantemente nuevas metodologías y soluciones que revolucionen el campo de la certificación.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Transición ultra-sutil hacia la siguiente sección */}
      <SectionConnector 
        fromSection="company" 
        toSection="mission" 
        type="minimal"
        height={40}
      />
    </section>
  );
};

export default Vision;