import React from 'react';
import SectionConnector from '../../ui/SectionConnector';
import { motion, cubicBezier } from 'framer-motion';

const ConsultingHero: React.FC = () => {
  // Elementos geométricos flotantes
  const geometricShapes = [
    { type: "circle", size: 120, x: "5%", y: "10%", delay: 0 },
    { type: "square", size: 80, x: "90%", y: "20%", delay: 0.5 },
    { type: "triangle", size: 100, x: "8%", y: "80%", delay: 1 },
    { type: "hexagon", size: 60, x: "85%", y: "85%", delay: 1.5 },
    { type: "circle", size: 40, x: "50%", y: "5%", delay: 2 },
    { type: "square", size: 50, x: "95%", y: "50%", delay: 2.5 }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: cubicBezier(0.43, 0.13, 0.23, 0.96) }
    }
  };

  return (
    <section className="relative section-unified-bg section-hero-bg min-h-[90vh] flex items-center py-20 overflow-hidden">
      {/* Patrón de fondo geométrico mejorado */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 2px, transparent 2px),
              radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.15) 1px, transparent 1px),
              radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.1) 1.5px, transparent 1.5px),
              linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.03) 50%, transparent 51%),
              linear-gradient(-45deg, transparent 49%, rgba(255,255,255,0.03) 50%, transparent 51%)
            `,
            backgroundSize: '80px 80px, 60px 60px, 100px 100px, 40px 40px, 40px 40px'
          }} 
        />
      </div>

      {/* Gradiente dinámico adicional */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-green-500/15 to-blue-500/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Formas geométricas flotantes */}
      {geometricShapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute pointer-events-none"
          style={{ 
            left: shape.x, 
            top: shape.y,
            width: shape.size,
            height: shape.size
          }}
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1, 0.8, 1],
            rotate: [0, 180, 360],
            opacity: [0, 0.1, 0.05, 0.1]
          }}
          transition={{
            duration: 8,
            delay: shape.delay,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        >
          {shape.type === 'circle' && (
            <div className="w-full h-full border-2 border-white/10 rounded-full bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
          )}
          {shape.type === 'square' && (
            <div className="w-full h-full border-2 border-white/10 bg-gradient-to-br from-green-500/5 to-blue-500/5 transform rotate-45"></div>
          )}
          {shape.type === 'triangle' && (
            <div className="w-full h-full">
              <div className="w-0 h-0 border-l-[50px] border-r-[50px] border-b-[87px] border-l-transparent border-r-transparent border-b-white/10 mx-auto"></div>
            </div>
          )}
          {shape.type === 'hexagon' && (
            <div className="w-full h-full relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 transform rotate-0" style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
              }}></div>
            </div>
          )}
        </motion.div>
      ))}

      {/* Efecto de partículas sutiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Líneas conectoras sutiles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5" viewBox="0 0 1200 800">
        <motion.path
          d="M100,200 Q300,100 500,200 T900,200"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.path
          d="M200,600 Q400,500 600,600 T1000,600"
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", delay: 2 }}
        />
        <motion.path
          d="M50,400 Q250,300 450,400 T850,400"
          stroke="rgba(147, 51, 234, 0.3)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", delay: 4 }}
        />
      </svg>

      <div className="content-overlay container mx-auto px-6 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge superior */}
          <motion.div 
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-white/20"
            variants={itemVariants}
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-white/90 font-medium">Servicios Especializados</span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight"
            variants={itemVariants}
          >
            Consultorías{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
              Especializadas
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-8 text-white/80 max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Transformamos su organización con{' '}
            <span className="text-blue-300 font-semibold">soluciones integrales</span>{' '}
            para optimizar procesos, obtener certificaciones y alcanzar la excelencia operacional
          </motion.p>

          {/* CTAs */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <motion.button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Solicitar Consultoría
            </motion.button>
            
            <motion.button 
              className="border-2 border-white/30 hover:border-white/50 text-white px-8 py-4 rounded-full font-semibold text-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ver Servicios
            </motion.button>
          </motion.div>

          {/* Estadísticas rápidas */}
          <motion.div 
            className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
            variants={containerVariants}
          >
            {[
              { number: "500+", label: "Proyectos" },
              { number: "15+", label: "Años Experiencia" },
              { number: "98%", label: "Éxito" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                variants={itemVariants}
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-white/70 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      
      <SectionConnector fromSection="hero" toSection="services" type="minimal" />
    </section>
  );
};

export default ConsultingHero;