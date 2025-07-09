// src/components/ui/IsoBadge.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface IsoBadgeProps {
  standard: string;  // e.g., '9001', '14001', '45001'
  label?: string;    // Optional label for the badge
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'accent' | 'gold' | 'info' | 'success';
  className?: string;
}

const IsoBadge: React.FC<IsoBadgeProps> = ({
  standard,
  label,
  size = 'md',
  variant = 'primary',
  className,
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-14 w-14 text-xs',
    md: 'h-20 w-20 text-sm',
    lg: 'h-24 w-24 text-base'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white border-primary-300',
    accent: 'bg-accent-500 text-white border-accent-300',
    gold: 'bg-gold-500 text-white border-gold-300',
    info: 'bg-blue-500 text-white border-blue-300',
    success: 'bg-green-500 text-white border-green-300'
  };

  // Animation variants
  const badgeAnimation = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05, 
      transition: { duration: 0.3, type: "spring" as const, stiffness: 300 } 
    }
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={badgeAnimation}
      className={cn(
        'relative rounded-full flex flex-col items-center justify-center border-2 shadow-card',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <div className="absolute inset-0.5 rounded-full bg-white/10" />
      <span className="text-white font-heading font-bold">ISO</span>
      <span className="font-heading font-semibold">{standard}</span>
      {label && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-2 py-0.5 rounded text-2xs font-medium whitespace-nowrap">
          {label}
        </div>
      )}
    </motion.div>
  );
};

export default IsoBadge;
