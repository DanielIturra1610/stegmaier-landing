// src/components/sections/home/Process.tsx
import { FC, useState } from 'react'
import { motion } from 'framer-motion'
import StepItem from '../../ui/StepItem'
import { steps } from './steps-data'

// Background decorative elements
const ProcessBackgroundElements = () => (
  <>
    {/* Top right corner decorative element */}
    <div className="absolute top-0 right-0 w-1/3 h-1/3 opacity-5 -z-10">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="#0369a1" d="M42.8,-62.9C56.9,-54.8,70.8,-43.8,75.4,-29.7C80,-15.6,75.2,1.6,69.7,18.1C64.1,34.6,57.9,50.3,46,60.1C34.2,69.9,17.1,73.8,0.7,72.8C-15.7,71.7,-31.5,65.6,-44.4,55.8C-57.3,45.9,-67.3,32.2,-71.3,16.8C-75.2,1.3,-73.1,-15.8,-65.6,-29.2C-58.1,-42.5,-45.1,-52.2,-31.9,-60.5C-18.7,-68.7,-4.4,-75.6,7.9,-86.6C20.2,-97.6,28.8,-71,42.8,-62.9Z" transform="translate(100 100)" />
      </svg>
    </div>
    
    {/* Animated flowing line */}
    <div className="absolute left-0 right-0 h-1 top-1/3 opacity-10 overflow-hidden -z-10">
      <motion.div 
        className="h-full bg-gradient-to-r from-transparent via-primary-500 to-transparent" 
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
    
    {/* Bottom left corner dots pattern */}
    <div className="absolute bottom-10 left-10 opacity-10 -z-10">
      <div className="grid grid-cols-6 gap-6">
        {[...Array(36)].map((_, i) => (
          <motion.div 
            key={i} 
            className="h-2 w-2 rounded-full bg-accent-500"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: i * 0.05, 
              ease: "easeInOut" 
            }}
          />
        ))}
      </div>
    </div>
  </>
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
    <section id="proceso" className="py-24 bg-gradient-to-br from-primary-800/95 via-primary-700/90 to-primary-600/95 text-white relative overflow-hidden">
      <ProcessBackgroundElements />
      
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Enhanced Header */}
        <motion.header 
          className="mb-16 text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={titleAnimation}
        >
          <span className="inline-block py-2 px-4 rounded-full bg-accent-500/20 text-accent-300 text-sm font-medium mb-3 backdrop-blur-sm">
            <span className="mr-2">🔄</span>Metodología Certificada
          </span>
          
          <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Paso a paso hacia la <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">excelencia</span>
          </h2>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-accent-500 opacity-70"></div>
          
          <p className="mt-8 mx-auto max-w-2xl text-lg text-white/80 leading-relaxed">
            Nuestro enfoque metódico garantiza resultados consistentes 
            y una implementación sin sobresaltos. <span className="font-medium text-accent-300">Certificación garantizada en primera auditoría.</span>
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
              <h3 className="text-xl font-bold mb-2">Proceso Optimizado</h3>
              <p className="text-white/70">12 semanas desde diagnóstico hasta certificación</p>
            </div>
            <div className="text-center p-4">
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-500/30 mb-4"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(4, 180, 134, 0.3)' }}
              >
                <span className="text-2xl">🔍</span>
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Enfoque Probado</h3>
              <p className="text-white/70">Más de 500 empresas certificadas con éxito</p>
            </div>
            <div className="text-center p-4">
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-700/70 mb-4"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(3, 105, 161, 0.9)' }}
              >
                <span className="text-2xl">🛡️</span>
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Garantía de Certificación</h3>
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
          <h3 className="text-2xl font-bold mb-8 text-center">Nuestro proceso de <span className="text-accent-300">8 pasos</span></h3>
          
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
    </section>
  )
}

export default Process