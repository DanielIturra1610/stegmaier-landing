import React from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, GraduationCap, Star } from 'lucide-react';
import { ExperienceBarProps } from './types';
import { calculateProgress, getLevelTitle, formatNumber } from './utils';
import { ANIMATION_VARIANTS } from './constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * ExperienceBar Component
 * 
 * A gamified experience bar that displays user progress in RPG style
 * with level indicator, progress bar, and related statistics.
 */
const ExperienceBar: React.FC<ExperienceBarProps> = ({
  totalXP,
  currentLevel,
  xpForNextLevel,
  currentLevelXP,
  coursesCompleted,
  lessonsCompleted,
  certificates
}) => {
  // Calculate progress percentage for the current level
  const progressPercentage = calculateProgress(currentLevelXP, xpForNextLevel);
  
  // Get dynamic title based on current level
  const levelTitle = getLevelTitle(currentLevel);

  // Check if high level for special effects
  const isHighLevel = currentLevel >= 30;

  return (
    <Card className="w-full relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Tu progreso general
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

      {/* Main Experience Bar Container */}
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start gap-6 mb-4">
        {/* Level Badge - Left side on desktop */}
        <motion.div 
          className={`shrink-0 flex flex-col items-center ${isHighLevel ? 'relative' : ''}`}
          variants={ANIMATION_VARIANTS.levelPulse}
          animate="animate"
        >
          {/* Level indicator with gradient background */}
          <div 
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              text-white font-bold text-2xl
              ${isHighLevel ? 
                'bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-200/40' : 
                'bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-200/30'
              }
            `}
          >
            {currentLevel}
          </div>
          
          {/* Sparkles for high levels */}
          {isHighLevel && (
            <>
              <motion.div 
                className="absolute w-full h-full pointer-events-none"
                animate={{
                  rotate: [0, 360],
                  opacity: [0.7, 0.9, 0.7]
                }}
                transition={{
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 3, repeat: Infinity, repeatType: "reverse" }
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-accent-300 rounded-full" />
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-accent-400 rounded-full" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-accent-300 rounded-full" />
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-accent-400 rounded-full" />
              </motion.div>
              
              <motion.div 
                className="absolute w-28 h-28 rounded-full border-2 border-dashed border-gold-300 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
            </>
          )}
          
          {/* XP label below badge */}
          <p className="mt-2 text-sm text-gray-600 font-medium">
            {formatNumber(totalXP)} XP Total
          </p>
        </motion.div>
        
        {/* Right side content: Title, Progress Bar, and Stats */}
        <div className="flex-grow w-full">
          {/* Level title */}
          <motion.h3 
            className={`
              text-lg sm:text-xl font-semibold mb-3 text-center lg:text-left
              ${isHighLevel ? 'text-gold-600' : 'text-primary-700'}
            `}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {levelTitle}
          </motion.h3>
          
          {/* Progress bar container */}
          <div className="w-full mb-3 space-y-2" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">XP hasta nivel {currentLevel + 1}</span>
              <span className="font-medium">
                {formatNumber(currentLevelXP)} / {formatNumber(xpForNextLevel)}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4">
            {/* Courses completed stat */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center bg-primary-50 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors">
                    <BookOpen className="h-6 w-6 text-primary-600 mb-1" />
                    <p className="text-lg sm:text-xl font-bold text-primary-600">{coursesCompleted}</p>
                    <p className="text-xs text-gray-600">Cursos</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cursos completados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Lessons completed stat */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center bg-green-50 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                    <Award className="h-6 w-6 text-green-600 mb-1" />
                    <p className="text-lg sm:text-xl font-bold text-green-600">{lessonsCompleted}</p>
                    <p className="text-xs text-gray-600">Lecciones</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lecciones completadas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Certificates stat */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center bg-amber-50 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                    <GraduationCap className="h-6 w-6 text-amber-600 mb-1" />
                    <p className="text-lg sm:text-xl font-bold text-amber-600">{certificates}</p>
                    <p className="text-xs text-gray-600">Certificados</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Certificados obtenidos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      </CardContent>
      
      {/* Decorative elements */}
      {isHighLevel && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Particles for high level users */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 rounded-full bg-accent-500"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.8,
              }}
            />
          ))}
          
          {/* Background glow effect */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-tr from-gold-500/10 to-accent-500/5" />
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-primary-500/10 to-transparent" />
        </div>
      )}
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(ExperienceBar);
