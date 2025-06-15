// src/components/sections/home/Process.tsx
import { FC } from 'react'
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
    
    {/* Bottom left corner dots */}
    <div className="absolute bottom-10 left-10 opacity-10 -z-10">
      <div className="grid grid-cols-6 gap-6">
        {[...Array(36)].map((_, i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-accent-500"></div>
        ))}
      </div>
    </div>
  </>
)

const Process: FC = () => {
  // Animation for section elements
  const titleAnimation = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const } 
    }
  };

  // Calculate variant based on index for a more visually appealing pattern
  const getVariant = (index: number): 'primary' | 'accent' | 'gold' => {
    if (index === 0 || index === 3 || index === 6) return 'primary';
    if (index === 1 || index === 4 || index === 7) return 'accent';
    return 'gold';
  }

  return (
    <section id="proceso" className="py-24 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      <ProcessBackgroundElements />
      
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.header 
          className="mb-20 text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={titleAnimation}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-3">
            Metodología
          </span>
          
          <h2 className="mt-2 text-4xl font-display font-bold text-gray-900 leading-tight">
            Paso a paso hacia la <span className="text-primary-600">certificación</span>
          </h2>
          
          <div className="mx-auto mt-3 h-1 w-20 rounded bg-accent-500"></div>
          
          <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600 leading-relaxed">
            Nuestro enfoque metódico garantiza resultados consistentes 
            y una implementación sin sobresaltos.
          </p>
        </motion.header>

        {/* Desktop Timeline (4x2 grid) */}
        <div className="hidden lg:grid grid-cols-4 gap-6">
          {steps.slice(0, 4).map((step, index) => (
            <StepItem 
              key={step.id} 
              {...step} 
              direction="vertical" 
              isLast={index === 3} 
              variant={getVariant(index)}
            />
          ))}
          
          {/* Visual separator */}
          <div className="col-span-4 flex justify-center my-4">
            <div className="w-20 h-1 rounded-full bg-primary-200"></div>
          </div>
          
          {steps.slice(4).map((step, index) => (
            <StepItem 
              key={step.id} 
              {...step} 
              direction="vertical" 
              isLast={index === 3} 
              variant={getVariant(index + 4)}
            />
          ))}
        </div>

        {/* Tablet and Mobile Timeline (single column) */}
        <div className="lg:hidden space-y-12">
          {steps.map((step, index) => (
            <StepItem 
              key={step.id} 
              {...step} 
              direction="vertical" 
              isLast={index === steps.length - 1} 
              variant={getVariant(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Process
