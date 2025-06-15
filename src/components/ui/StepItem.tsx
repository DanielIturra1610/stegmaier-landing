// src/components/ui/StepItem.tsx
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '../../lib/utils'
import type { Step } from '../../types'

interface StepItemProps extends Step {
  isLast?: boolean;
  direction?: 'horizontal' | 'vertical';
  variant?: 'primary' | 'accent' | 'gold';
}

const StepItem = ({ 
  id, 
  title, 
  desc, 
  icon: Icon, 
  isLast = false,
  direction = 'vertical',
  variant = 'primary' 
}: StepItemProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  
  // Determine colors based on variant
  const variantStyles = {
    primary: {
      circle: 'bg-primary-600 text-white shadow-lg shadow-primary-500/20',
      iconBg: 'bg-primary-100 text-primary-700',
      connector: 'bg-gradient-to-b from-primary-500 to-primary-300',
      horizontalConnector: 'bg-gradient-to-r from-primary-300 to-primary-500',
      hover: 'group-hover:border-primary-200 group-hover:bg-primary-50/50'
    },
    accent: {
      circle: 'bg-accent-500 text-white shadow-lg shadow-accent-500/20',
      iconBg: 'bg-accent-50 text-accent-700',
      connector: 'bg-gradient-to-b from-accent-500 to-accent-300',
      horizontalConnector: 'bg-gradient-to-r from-accent-300 to-accent-500',
      hover: 'group-hover:border-accent-200 group-hover:bg-accent-50/50'
    },
    gold: {
      circle: 'bg-gold-500 text-white shadow-lg shadow-gold-500/20',
      iconBg: 'bg-gold-50 text-gold-700',
      connector: 'bg-gradient-to-b from-gold-500 to-gold-300',
      horizontalConnector: 'bg-gradient-to-r from-gold-300 to-gold-500',
      hover: 'group-hover:border-gold-200 group-hover:bg-gold-50/50'
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: id * 0.1 }}
      className={cn(
        "relative",
        direction === 'vertical' ? "md:flex" : "flex flex-col items-center"
      )}
    >
      {/* Numbered circle + connector line */}
      <div className={cn(
        "flex",
        direction === 'vertical' ? "md:flex-col items-center mr-8" : "flex-row items-center mb-4"
      )}>
        {/* Numbered Circle */}
        <div className={cn(
          "z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          "text-xl font-bold transform transition-all duration-300",
          variantStyles[variant].circle
        )}>
          {id}
        </div>
        
        {/* Connector Line */}
        {!isLast && (
          direction === 'vertical' ? (
            <div className="mt-3 h-full w-1 rounded-full opacity-80" style={{ background: `linear-gradient(to bottom, ${variant === 'primary' ? '#0369a1' : variant === 'accent' ? '#04b486' : '#eab308'} 0%, transparent 100%)`, height: '100px' }}></div>
          ) : (
            <div className="mx-3 h-1 w-16 rounded-full opacity-80" style={{ background: `linear-gradient(to right, transparent 0%, ${variant === 'primary' ? '#0369a1' : variant === 'accent' ? '#04b486' : '#eab308'} 50%, transparent 100%)` }}></div>
          )
        )}
      </div>

      {/* Card Content */}
      <article className={cn(
        "group w-full rounded-xl bg-white p-6 border border-gray-100 transition-all duration-300", 
        "shadow-card hover:shadow-elevated",
        variantStyles[variant].hover
      )}>
        {/* Icon */}
        <span className={cn(
          "inline-flex items-center justify-center rounded-lg p-3",
          "transition-transform group-hover:scale-110 group-hover:rotate-3",
          variantStyles[variant].iconBg
        )}>
          <Icon className="h-6 w-6" />
        </span>
        
        {/* Content */}
        <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-700">
          {title}
        </h3>
        <p className="mt-2 text-gray-600">{desc}</p>
      </article>
    </motion.div>
  )
}

export default StepItem
