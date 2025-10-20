import React from 'react';
import { motion } from 'framer-motion';
import { ExperienceBarProps } from './types';
import { calculateProgress, getLevelTitle, formatNumber } from './utils';
import { ANIMATION_VARIANTS } from './constants';

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

  // Stats icons mapping
  const statsIcons = {
    courses: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    lessons: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    certificates: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    )
  };

  // Check if high level for special effects
  const isHighLevel = currentLevel >= 30;

  return (
    <motion.div
      className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden"
      variants={ANIMATION_VARIANTS.containerFadeIn}
      initial="initial"
      animate="animate"
      role="region"
      aria-label="Progreso del usuario"
    >
      {/* Title */}
      <motion.h2 
        className="text-xl font-bold text-gray-800 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Tu progreso general
      </motion.h2>

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
          <div className="w-full mb-3" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
            {/* Background bar */}
            <div className="w-full h-5 bg-primary-50 rounded-full overflow-hidden relative">
              {/* Progress fill with gradient */}
              <motion.div 
                className={`
                  h-full rounded-full 
                  ${isHighLevel ? 
                    'bg-gradient-to-r from-gold-500 to-accent-500' : 
                    'bg-gradient-to-r from-primary-600 to-primary-400'
                  }
                `}
                custom={progressPercentage}
                variants={ANIMATION_VARIANTS.barAnimation}
                initial="initial"
                animate="animate"
              />
              
              {/* XP text overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-medium text-gray-800">
                  {formatNumber(currentLevelXP)} / {formatNumber(xpForNextLevel)} XP
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-4">
            {/* Courses completed stat */}
            <div className="flex flex-col sm:flex-row sm:items-center bg-primary-50 p-2 sm:p-3 rounded-lg">
              <div className="flex justify-center sm:justify-start text-primary-500 mb-1 sm:mb-0 sm:mr-3">
                {statsIcons.courses}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-xl font-bold text-primary-600">{coursesCompleted}</p>
                <p className="text-xs sm:text-sm text-gray-500">Cursos completados</p>
              </div>
            </div>
            
            {/* Lessons completed stat */}
            <div className="flex flex-col sm:flex-row sm:items-center bg-primary-50 p-2 sm:p-3 rounded-lg">
              <div className="flex justify-center sm:justify-start text-primary-500 mb-1 sm:mb-0 sm:mr-3">
                {statsIcons.lessons}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-xl font-bold text-primary-600">{lessonsCompleted}</p>
                <p className="text-xs sm:text-sm text-gray-500">Lecciones completadas</p>
              </div>
            </div>
            
            {/* Certificates stat */}
            <div className="flex flex-col sm:flex-row sm:items-center bg-primary-50 p-2 sm:p-3 rounded-lg">
              <div className="flex justify-center sm:justify-start text-primary-500 mb-1 sm:mb-0 sm:mr-3">
                {statsIcons.certificates}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-xl font-bold text-primary-600">{certificates}</p>
                <p className="text-xs sm:text-sm text-gray-500">Certificados obtenidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
    </motion.div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(ExperienceBar);
