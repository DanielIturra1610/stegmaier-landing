// src/components/sections/home/Process.tsx
import { FC, useState } from 'react'
import { motion } from 'framer-motion'
import StepItem from '../../ui/StepItem'
import { steps } from './steps-data'
import SectionConnector from '../../ui/SectionConnector'

// Background decorative elements
const ProcessBackgroundElements = () => (
  <div className="minimal-decorations">
    {/* Figuras geométricas minimalistas del sistema unificado */}
    <div className="geometric-accent-1"></div>
    <div className="geometric-accent-2"></div>
    
    {/* Patrón de fondo opcional */}
    <div className="absolute inset-0 minimal-grid"></div>
    
    {/* Elementos específicos de la sección process */}
    <motion.div
      className="absolute right-10 top-1/4 w-16 h-16 border border-white/10 rounded-full"
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    
    {/* Mantenemos las líneas animadas que son características de esta sección */}
    <div className="absolute left-0 right-0 h-1 top-1/3 overflow-hidden -z-10">
      <motion.div 
        className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" 
        style={{ width: '30%' }}
        animate={{
          x: ['-100%', '400%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  </div>
)

const Process: FC = () => {
  // State for tracking active step to enhance interactivity
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Enhanced animations for section elements
  const titleAnimation = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const } 
    }
  };

  // Staggered entrance animation for steps
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  // Calculate variant based on index for a more visually appealing pattern
  const getVariant = (index: number): 'primary' | 'accent' | 'gold' => {
    if (index === 0 || index === 3 || index === 6) return 'primary';
    if (index === 1 || index === 4 || index === 7) return 'accent';
    return 'gold';
  }

  return (
    <section
      id="process"
      className="section-unified-bg section-process-bg content-overlay relative py-16 md:py-20 lg:py-24"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-grid-pattern"></div>
      
      {/* Elementos difuminados para suavizar la transición desde Services */}
      <div className="blur-transition-element blur-transition-top floating-transition"></div>

      {/* Elementos de fondo existentes */}
      <ProcessBackgroundElements />
      
      <div className="container mx-auto px-4 max-w-6xl content-overlay">
        {/* Enhanced Header */}
        <motion.header 
          className="mb-16 text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={titleAnimation}
        >
          <span className="inline-block py-2 px-4 rounded-full bg-accent-500/30 text-white text-sm font-medium mb-3 backdrop-blur-sm shadow-sm">
            <span className="mr-2">🔄</span>Metodología Certificada
          </span>
          
          <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Paso a paso hacia la <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">excelencia</span>
          </h2>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-accent-500 opacity-70"></div>
          
          <p className="mt-8 mx-auto max-w-2xl text-lg text-white/80 leading-relaxed">
            Nuestro enfoque metódico garantiza resultados consistentes 
            y una implementación sin sobresaltos. <span className="font-medium text-accent-300">Llevamos tu organización al siguiente nivel.</span>
          </p>
        </motion.header>

        {/* Interactive information panel before the steps */}
        <div className="mb-16 bg-primary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-600/30 shadow-xl">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-700/70 mb-4"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(3, 105, 161, 0.9)' }}
              >
                <span className="text-2xl">⏱️</span>
              </motion.div>
              <h3 className="text-white text-xl font-bold mb-2">Proceso Optimizado</h3>
              <p className="text-white/70">12 semanas desde diagnóstico hasta implementación</p>
            </div>
            <div className="text-center p-4">
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-500/30 mb-4"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(4, 180, 134, 0.3)' }}
              >
                <span className="text-2xl">🔍</span>
              </motion.div>
              <h3 className="text-white text-xl font-bold mb-2">Enfoque Estrategico</h3>
              <p className="text-white/70">Más de 500 empresas certificadas con éxito</p>
            </div>
            <div className="text-center p-4">
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-700/70 mb-4"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(3, 105, 161, 0.9)' }}
              >
                <span className="text-2xl">🛡️</span>
              </motion.div>
              <h3 className="text-white text-xl font-bold mb-2">Garantía de Certificación</h3>
              <p className="text-white/70">100% de tasa de éxito en primera auditoría</p>
            </div>
          </div>
        </div>

        {/* Desktop Timeline - Enhanced Interactive Version */}
        <motion.div 
          className="hidden lg:block"
          initial="hidden"
          whileInView="visible"
          variants={containerAnimation}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h3 className="text-2xl font-bold mb-8 text-center text-white">Nuestro proceso de <span className="text-accent-300 font-extrabold">8 pasos</span></h3>
          
          <div className="grid grid-cols-4 gap-8">
            {steps.slice(0, 4).map((step, index) => (
              <StepItem 
                key={step.id} 
                {...step} 
                direction="vertical" 
                isLast={index === 3} 
                variant={getVariant(index)}
                onMouseEnter={() => setActiveStep(step.id)}
                onMouseLeave={() => setActiveStep(null)}
                isActive={activeStep === step.id}
              />
            ))}
            
            {/* Visual separator - Enhanced */}
            <div className="col-span-4 flex justify-center my-8 relative">
              <motion.div 
                className="w-32 h-1 rounded-full bg-gradient-to-r from-primary-300 via-accent-400 to-primary-300"
                animate={{ 
                  opacity: [0.4, 0.8, 0.4],
                  width: ["20%", "50%", "20%"] 
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              ></motion.div>
            </div>
            
            {steps.slice(4).map((step, index) => (
              <StepItem 
                key={step.id} 
                {...step} 
                direction="vertical" 
                isLast={index === 3} 
                variant={getVariant(index + 4)}
                onMouseEnter={() => setActiveStep(step.id)}
                onMouseLeave={() => setActiveStep(null)}
                isActive={activeStep === step.id}
              />
            ))}
          </div>
        </motion.div>

        {/* Tablet and Mobile Timeline - Enhanced */}
        <motion.div 
          className="lg:hidden space-y-12"
          initial="hidden"
          whileInView="visible"
          variants={containerAnimation}
          viewport={{ once: true, margin: "-50px" }}
        >
          <h3 className="text-xl font-bold mb-8 text-center">Nuestro proceso de <span className="text-accent-300">8 pasos</span></h3>
          
          {steps.map((step, index) => (
            <StepItem 
              key={step.id} 
              {...step} 
              direction="vertical" 
              isLast={index === steps.length - 1} 
              variant={getVariant(index)}
              onMouseEnter={() => setActiveStep(step.id)}
              onMouseLeave={() => setActiveStep(null)}
              isActive={activeStep === step.id}
            />
          ))}
        </motion.div>
      </div>
      {/* Transición ultra-sutil hacia Testimonials */}
      <SectionConnector 
        fromSection="process" 
        toSection="testimonials" 
        type="minimal"
        height={40}
      />
    </section>
  )
}

export default Process