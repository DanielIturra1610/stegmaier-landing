import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ChallengeCardProps, 
  CelebrationLevel 
} from './types';
import { 
  formatTimeRemaining, 
  getCardStyle, 
  getProgressDescription 
} from './utils';
import { DIFFICULTY_LABELS, PROGRESS_RING } from './constants';
import { IconRenderer, useCategoryIcon } from './IconRenderer';
import { translateCategory } from '../../utils/categoryTranslations';

/**
 * Componente ChallengeCard - Representa una tarjeta individual de desafío
 */
const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  isCompleted,
  progress = 0,
  status,
  celebrationLevel,
  onClick
}) => {
  // Calcular estilos basados en la dificultad
  const cardStyle = useMemo(() => getCardStyle(challenge.difficulty), [challenge.difficulty]);
  
  // Calcular ángulo de progreso para el anillo SVG
  const strokeDashoffset = useMemo(() => {
    const percent = progress / 100;
    return PROGRESS_RING.circumference * (1 - percent);
  }, [progress]);
  
  // Variantes de animación para diferentes estados
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5,
        type: 'spring',
        stiffness: 100
      }
    },
    hover: { 
      scale: 1.02,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };
  
  // Variantes para el anillo de progreso
  const progressRingVariants = {
    hidden: { strokeDashoffset: PROGRESS_RING.circumference },
    visible: { 
      strokeDashoffset,
      transition: { 
        duration: 1.5,
        ease: 'easeInOut'
      }
    }
  };
  
  // Variantes para celebraciones
  const celebrationVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0, 1, 1],
      transition: { 
        duration: 0.7,
        times: [0, 0.5, 1]
      }
    }
  };
  
  // Generar las partículas para la celebración
  const renderConfetti = () => {
    if (celebrationLevel < CelebrationLevel.MEDIUM) return null;
    
    const particles: JSX.Element[] = [];
    const colors = ['#f97316', '#f59e0b', '#3b82f6'];
    
    for (let i = 0; i < 15; i++) {
      const size = Math.random() * 8 + 4;
      particles.push(
        <motion.div
          key={`particle-${i}`}
          className="absolute"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: colors[i % colors.length],
            top: '50%',
            left: '50%',
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            opacity: 0,
            scale: [1, Math.random() * 0.5 + 0.5]
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      );
    }
    
    return particles;
  };
  
  return (
    <motion.div
      className="relative rounded-lg overflow-hidden shadow-md"
      style={{
        backgroundColor: cardStyle.background,
        border: `2px solid ${cardStyle.border}`,
        opacity: status === 'expired' || status === 'locked' ? 0.7 : 1
      }}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      role="listitem"
      aria-label={`Desafío: ${challenge.title}. ${getProgressDescription(challenge, progress)}`}
      tabIndex={0}
    >
      {/* Estado de bloqueo */}
      {status === 'locked' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 z-10">
          <div className="text-white text-center p-4">
            <div className="mb-2 flex justify-center">
              <IconRenderer iconName="lock" className="h-12 w-12 text-white" />
            </div>
            <p className="font-medium">Completa requisitos previos para desbloquear</p>
          </div>
        </div>
      )}
      
      {/* Estado expirado */}
      {status === 'expired' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
          <div className="text-white text-center p-4">
            <div className="mb-2 flex justify-center">
              <IconRenderer iconName="clock" className="h-12 w-12 text-white" />
            </div>
            <p className="font-medium">Tiempo agotado</p>
            <button 
              className="mt-2 px-4 py-2 bg-white text-gray-900 rounded-md font-medium"
              onClick={(e) => {
                e.stopPropagation();
                // Aquí iría la lógica para reintentar
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
      
      {/* Confetti para celebraciones */}
      {renderConfetti()}
      
      {/* Header con ícono y nivel de dificultad */}
      <div className="p-4 flex justify-between items-center border-b border-opacity-20" style={{ borderColor: cardStyle.border }}>
        <div className="flex items-center">
          <span className="mr-2 text-gray-700" style={{ color: cardStyle.text }}>
            {useCategoryIcon(challenge.category, "h-6 w-6")}
          </span>
          <span className="text-sm font-medium" style={{ color: cardStyle.text }}>{translateCategory(challenge.category)}</span>
        </div>
        <span 
          className="text-xs font-medium px-2 py-1 rounded-full" 
          style={{ 
            backgroundColor: cardStyle.badge,
            color: cardStyle.text
          }}
        >
          {DIFFICULTY_LABELS[challenge.difficulty]}
        </span>
      </div>
      
      {/* Contenido principal */}
      <div className="p-4">
        {/* Título */}
        <h3 className="text-lg font-bold mb-2" style={{ color: cardStyle.text }}>
          {challenge.title}
        </h3>
        
        {/* Descripción */}
        <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
        
        {/* Anillo de progreso */}
        <div className="flex flex-col items-center justify-center mb-4 relative">
          <div className="relative">
            <svg width={PROGRESS_RING.radius * 2} height={PROGRESS_RING.radius * 2}>
              {/* Fondo del anillo */}
              <circle
                stroke="#e6e6e6"
                fill="transparent"
                strokeWidth={PROGRESS_RING.stroke}
                r={PROGRESS_RING.radius - PROGRESS_RING.stroke / 2}
                cx={PROGRESS_RING.radius}
                cy={PROGRESS_RING.radius}
              />
              
              {/* Anillo de progreso animado */}
              <motion.circle
                stroke={cardStyle.progress}
                fill="transparent"
                strokeWidth={PROGRESS_RING.stroke}
                strokeLinecap="round"
                r={PROGRESS_RING.radius - PROGRESS_RING.stroke / 2}
                cx={PROGRESS_RING.radius}
                cy={PROGRESS_RING.radius}
                strokeDasharray={PROGRESS_RING.circumference}
                variants={progressRingVariants}
                initial="hidden"
                animate="visible"
                style={{
                  transformOrigin: 'center',
                  transform: 'rotate(-90deg)'
                }}
              />
            </svg>
            
            {/* Porcentaje de progreso */}
            <div 
              className="absolute inset-0 flex items-center justify-center flex-col"
              aria-hidden="true"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-2xl font-bold relative"
                style={{ color: cardStyle.text }}
              >
                {isCompleted ? (
                  <motion.div
                    variants={celebrationVariants}
                    initial="initial"
                    animate="animate"
                    className="flex items-center justify-center"
                  >
                    <IconRenderer iconName="check-circle" className="h-8 w-8 text-green-500" />
                  </motion.div>
                ) : (
                  <>
                    {`${progress}%`}
                    {status === 'expiring' && (
                      <motion.div 
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium text-center whitespace-nowrap"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        ¡Pronto expira!
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
          
          {/* Contador de tiempo restante */}
          {challenge.deadline && status !== 'completed' && status !== 'expired' && (
            <div className="mt-2 text-sm font-medium flex items-center">
              <span className="mr-1">
                <IconRenderer iconName="clock" className="h-4 w-4 inline-block" />
              </span>
              <span className={status === 'expiring' ? 'text-red-500' : 'text-gray-600'}>
                {formatTimeRemaining(challenge.deadline)}
              </span>
            </div>
          )}
        </div>
        
        {/* Sección de recompensa */}
        <div className="flex items-center justify-between border-t border-opacity-20 pt-3" style={{ borderColor: cardStyle.border }}>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 mr-2">Recompensa:</span>
            {challenge.reward.type === 'xp' || challenge.reward.type === 'both' ? (
              <div className="flex items-center mr-2" title={`${challenge.reward.value} puntos de experiencia`}>
                <span className="text-yellow-500 mr-1">
                  <IconRenderer iconName="star" className="h-4 w-4 inline-block" />
                </span>
                <span className="text-sm font-bold">{challenge.reward.value}XP</span>
              </div>
            ) : null}
            
            {challenge.reward.type === 'badge' || challenge.reward.type === 'both' ? (
              <div className="flex items-center" title={`Insignia: ${challenge.reward.badgeName}`}>
                <span className="text-blue-500 mr-1">
                  <IconRenderer iconName="badge" className="h-4 w-4 inline-block" />
                </span>
                <span className="text-sm font-bold">{challenge.reward.badgeName}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(ChallengeCard);
