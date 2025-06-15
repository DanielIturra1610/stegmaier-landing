// src/components/ui/ServiceCard.tsx
import { motion } from 'framer-motion'
import type { Service } from '../../types'
import { cn } from '../../lib/utils'

const MotionArticle = motion.article

interface ServiceCardProps extends Service {
  variant?: 'primary' | 'accent' | 'gold'
  index?: number
}

const ServiceCard = ({ 
  title, 
  desc, 
  icon: Icon, 
  variant = 'primary',
  index = 0 
}: ServiceCardProps) => {
  // Determine the accent color for the card
  const accentColors = {
    primary: 'before:bg-primary-500 from-primary-50 to-primary-50/20 hover:border-primary-200',
    accent: 'before:bg-accent-500 from-accent-50 to-accent-50/20 hover:border-accent-200',
    gold: 'before:bg-gold-500 from-gold-50 to-gold-50/20 hover:border-gold-200',
  }
  
  // Icon background colors
  const iconBgColors = {
    primary: 'bg-primary-100 text-primary-700',
    accent: 'bg-accent-50 text-accent-700',
    gold: 'bg-gold-50 text-gold-700',
  }

  return (
    <MotionArticle
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.5, 
          delay: Math.min(index * 0.1, 0.5) 
        } 
      }}
      viewport={{ once: true }}
      whileHover={{ y: -6, boxShadow: 'var(--shadow-elevated)' }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white p-6 border border-gray-100", 
        "focus-within:ring-2 focus-within:ring-primary-400 shadow-card",
        "before:absolute before:top-0 before:left-0 before:h-1 before:w-full",
        "bg-gradient-to-br hover:bg-gradient-to-r",
        accentColors[variant]
      )}
    >
      {/* Icon container with subtle gradient */}
      <div 
        className={cn(
          "inline-flex items-center justify-center rounded-lg p-3 transition-transform", 
          "group-hover:scale-110 group-hover:rotate-3",
          iconBgColors[variant]
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      {/* Card content */}
      <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-700">
        {title}
      </h3>
      <p className="mt-2 text-gray-600">{desc}</p>
      
      {/* Subtle arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 transform translate-x-4 transition-all duration-300 group-hover:opacity-70 group-hover:translate-x-0">
        <svg className="w-5 h-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </MotionArticle>
  )
}

export default ServiceCard
