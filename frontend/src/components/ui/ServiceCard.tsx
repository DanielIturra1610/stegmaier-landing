// src/components/ui/ServiceCard.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import * as L from 'lucide-react'
import type { Service } from '../../types'
import { cn } from '../../lib/utils'
import Button from './button'
import React from 'react';

const MotionArticle = motion.article

interface ServiceCardProps extends Omit<Service, 'benefits' | 'timeframe'> {
  variant?: 'primary' | 'accent' | 'gold'
  index?: number
  viewMode?: 'grid' | 'list'
  benefits?: string[]
  timeframe?: string
}

const ServiceCard = ({ 
  title, 
  desc, 
  icon: Icon, 
  variant = 'primary',
  index = 0,
  viewMode = 'grid',
  benefits = [],
  timeframe = ''
}: ServiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Enhanced color schemes
  const colorSchemes = {
    primary: {
      accent: 'before:bg-gradient-to-r before:from-primary-500 before:to-primary-600',
      gradient: 'from-primary-50 to-primary-100/30 hover:from-primary-100 hover:to-primary-50',
      border: 'hover:border-primary-300 hover:shadow-primary-100/50',
      icon: 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700',
      iconHover: 'group-hover:from-primary-200 group-hover:to-primary-300',
      badge: 'bg-primary-100 text-primary-700'
    },
    accent: {
      accent: 'before:bg-gradient-to-r before:from-accent-500 before:to-accent-600',
      gradient: 'from-accent-50 to-accent-100/30 hover:from-accent-100 hover:to-accent-50',
      border: 'hover:border-accent-300 hover:shadow-accent-100/50',
      icon: 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-700',
      iconHover: 'group-hover:from-accent-200 group-hover:to-accent-300',
      badge: 'bg-accent-100 text-accent-700'
    },
    gold: {
      accent: 'before:bg-gradient-to-r before:from-gold-500 before:to-gold-600',
      gradient: 'from-gold-50 to-gold-100/30 hover:from-gold-100 hover:to-gold-50',
      border: 'hover:border-gold-300 hover:shadow-gold-100/50',
      icon: 'bg-gradient-to-br from-gold-100 to-gold-200 text-gold-700',
      iconHover: 'group-hover:from-gold-200 group-hover:to-gold-300',
      badge: 'bg-gold-100 text-gold-700'
    }
  }

  const colors = colorSchemes[variant]

  // Different layouts for grid vs list view
  if (viewMode === 'list') {
    return (
      <MotionArticle
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ 
          opacity: 1, 
          x: 0,
          transition: { 
            duration: 0.6, 
            delay: index * 0.1 
          } 
        }}
        viewport={{ once: true }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          "group relative overflow-hidden rounded-2xl bg-white border border-gray-100",
          "focus-within:ring-2 focus-within:ring-primary-400 shadow-card",
          "before:absolute before:top-0 before:left-0 before:h-full before:w-1",
          "bg-gradient-to-r transition-all duration-500 hover:shadow-xl",
          colors.accent,
          colors.gradient,
          colors.border
        )}
      >
        <div className="flex items-start p-6 lg:p-8">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 inline-flex items-center justify-center rounded-xl p-4 transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            colors.icon,
            colors.iconHover
          )}>
            <Icon className="h-8 w-8" />
          </div>

          {/* Content */}
          <div className="ml-6 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                  {title}
                </h3>
                {timeframe && (
                  <span className={cn("inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium", colors.badge)}>
                    ⏱️ {timeframe}
                  </span>
                )}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <L.ChevronDown className="w-5 h-5 text-gray-600" />
                </motion.div>
              </motion.button>
            </div>

            <p className="mt-3 text-gray-600 leading-relaxed lg:text-lg">{desc}</p>

            {/* Expandable benefits */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  {benefits.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 text-sm">Incluye:</h4>
                      {benefits.map((benefit, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className="flex items-center text-sm text-gray-600"
                        >
                          <span className="text-accent-500 mr-2">✓</span>
                          {benefit}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      size="sm" 
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      Más información
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </MotionArticle>
    )
  }

  // Grid view (default)
  return (
    <MotionArticle
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.6, 
          delay: Math.min(index * 0.15, 0.8),
          type: "spring",
          stiffness: 100
        } 
      }}
      viewport={{ once: true }}
      whileHover={{ 
        y: -8, 
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-6 lg:p-8 border border-gray-100", 
        "focus-within:ring-2 focus-within:ring-primary-400 shadow-card",
        "before:absolute before:top-0 before:left-0 before:h-2 before:w-full",
        "bg-gradient-to-br transition-all duration-500 hover:shadow-2xl",
        colors.accent,
        colors.gradient,
        colors.border
      )}
    >
      {/* Floating background elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-100/20 to-accent-100/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
      
      {/* Header with icon and timeframe */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "inline-flex items-center justify-center rounded-xl p-3 transition-all duration-300", 
          "group-hover:scale-110 group-hover:rotate-3 shadow-lg",
          colors.icon,
          colors.iconHover
        )}>
          <Icon className="h-6 w-6" />
        </div>
        
        {timeframe && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("px-3 py-1 rounded-full text-xs font-semibold", colors.badge)}
          >
            ⏱️ {timeframe}
          </motion.span>
        )}
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors duration-300 mb-3">
        {title}
      </h3>
      
      <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">{desc}</p>
      
      {/* Benefits preview */}
      {benefits.length > 0 && (
        <div className="space-y-2 mb-6">
          {benefits.slice(0, 2).map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
              className="flex items-center text-sm text-gray-600"
            >
              <span className="text-accent-500 mr-2 text-xs">✓</span>
              {benefit}
            </motion.div>
          ))}
          {benefits.length > 2 && (
            <p className="text-xs text-gray-500">
              +{benefits.length - 2} beneficios más...
            </p>
          )}
        </div>
      )}

      {/* Action area */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Button
          size="sm"
          variant="ghost"
          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-0 font-semibold"
        >
          Ver detalles
          <motion.span
            className="inline-block ml-1"
            animate={{ x: isHovered ? 3 : 0 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.span>
        </Button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <L.Plus className="w-4 h-4 text-gray-600" />
          </motion.div>
        </motion.button>
      </div>

      {/* Expandable section for grid view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            {benefits.length > 2 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-semibold text-gray-900 text-sm">Beneficios adicionales:</h4>
                {benefits.slice(2).map((benefit, idx) => (
                  <motion.div
                    key={idx + 2}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <span className="text-accent-500 mr-2 text-xs">✓</span>
                    {benefit}
                  </motion.div>
                ))}
              </div>
            )}
            
            <Button 
              size="sm" 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            >
              <span className="mr-2">📞</span>
              Solicitar Información
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-20">
        <div className={cn("absolute top-2 right-2 w-8 h-8 rounded-full", colors.icon)} />
        <div className={cn("absolute top-4 right-4 w-4 h-4 rounded-full", colors.icon)} />
      </div>
    </MotionArticle>
  )
}

export default ServiceCard