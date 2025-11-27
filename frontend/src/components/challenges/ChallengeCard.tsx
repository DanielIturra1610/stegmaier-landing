import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Clock, CheckCircle, Star, Award } from 'lucide-react';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
    >
      <Card
        className="relative overflow-hidden cursor-pointer transition-all"
        style={{
          backgroundColor: cardStyle.background,
          borderColor: cardStyle.border,
          opacity: status === 'expired' || status === 'locked' ? 0.7 : 1
        }}
        onClick={onClick}
        role="listitem"
        aria-label={`Desafío: ${challenge.title}. ${getProgressDescription(challenge, progress)}`}
        tabIndex={0}
      >
      {/* Estado de bloqueo */}
      {status === 'locked' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 z-10">
          <div className="text-white text-center p-4">
            <Lock className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">Completa requisitos previos para desbloquear</p>
          </div>
        </div>
      )}

      {/* Estado expirado */}
      {status === 'expired' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
          <div className="text-white text-center p-4">
            <Clock className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium mb-2">Tiempo agotado</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Aquí iría la lógica para reintentar
              }}
            >
              Reintentar
            </Button>
          </div>
        </div>
      )}
      
      {/* Confetti para celebraciones */}
      {renderConfetti()}

      {/* Header con ícono y nivel de dificultad */}
      <CardHeader className="p-4 pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span style={{ color: cardStyle.text }}>
              {useCategoryIcon(challenge.category, "h-5 w-5")}
            </span>
            <span className="text-sm font-medium" style={{ color: cardStyle.text }}>
              {translateCategory(challenge.category)}
            </span>
          </div>
          <Badge
            variant="secondary"
            className="text-xs"
            style={{
              backgroundColor: cardStyle.badge,
              color: cardStyle.text
            }}
          >
            {DIFFICULTY_LABELS[challenge.difficulty]}
          </Badge>
        </div>
      </CardHeader>

      {/* Contenido principal */}
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Título */}
        <h3 className="text-lg font-bold mb-2" style={{ color: cardStyle.text }}>
          {challenge.title}
        </h3>
        
        {/* Descripción */}
        <p className="text-sm text-muted-foreground">{challenge.description}</p>

        {/* Progreso */}
        <div className="space-y-3">
          {isCompleted ? (
            <div className="flex items-center justify-center py-4">
              <motion.div
                variants={celebrationVariants}
                initial="initial"
                animate="animate"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-8 w-8 text-green-500" />
                <span className="text-lg font-bold text-green-600">¡Completado!</span>
              </motion.div>
            </div>
          ) : (
            <>
              {status === 'expiring' && (
                <Badge variant="destructive" className="w-full justify-center">
                  ¡Pronto expira!
                </Badge>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-bold" style={{ color: cardStyle.text }}>
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </>
          )}

          {/* Contador de tiempo restante */}
          {challenge.deadline && status !== 'completed' && status !== 'expired' && (
            <div className="flex items-center justify-center gap-1 text-sm">
              <Clock className="h-4 w-4" />
              <span className={status === 'expiring' ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                {formatTimeRemaining(challenge.deadline)}
              </span>
            </div>
          )}
        </div>
        
        {/* Sección de recompensa */}
        <div className="space-y-2 border-t pt-3" style={{ borderColor: cardStyle.border }}>
          <span className="text-xs text-muted-foreground">Recompensa:</span>
          <div className="flex flex-wrap gap-2">
            {(challenge.reward.type === 'xp' || challenge.reward.type === 'both') && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span className="font-bold">{challenge.reward.value} XP</span>
              </Badge>
            )}

            {(challenge.reward.type === 'badge' || challenge.reward.type === 'both') && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Award className="h-3 w-3 text-blue-500" />
                <span className="font-bold">{challenge.reward.badgeName}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default React.memo(ChallengeCard);
