import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Trophy, Target, X } from 'lucide-react';

import ChallengeCard from './ChallengeCard';
import {
  WeeklyChallengesProps,
  Challenge,
  ChallengeStatus,
  CelebrationLevel
} from './types';
import {
  calculateProgress,
  getChallengeStatus,
  getCelebrationLevel,
  getNewlyReachedMilestones
} from './utils';
import { ANIMATION_TIMING } from './constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * Componente principal WeeklyChallenges
 */
const WeeklyChallenges: React.FC<WeeklyChallengesProps> = ({ 
  challenges, 
  completedChallenges, 
  userProgress,
  onChallengeCompleted,
  onChallengeClick
}) => {
  // Referencia para detección de intersección y animación
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  // Estado para modal de detalle
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  
  // Estado para animación de celebración
  const [celebrationStates, setCelebrationStates] = useState<Record<string, CelebrationLevel>>({});
  
  // Procesar y ordenar los desafíos
  const processedChallenges = useMemo(() => {
    const processed = challenges.map(challenge => {
      const status = getChallengeStatus(challenge, completedChallenges);
      const progress = status === 'completed' ? 100 : calculateProgress(challenge);
      const isCompleted = status === 'completed';
      
      // Determinar nivel de celebración
      const previousProgress = userProgress[challenge.id]?.currentValue || 0;
      const celebrationLevel = celebrationStates[challenge.id] || 
        getCelebrationLevel(
          challenge,
          previousProgress > 0 ? (previousProgress / challenge.targetValue) * 100 : 0,
          progress
        );
      
      return {
        challenge,
        status,
        progress,
        isCompleted,
        celebrationLevel
      };
    });
    
    // Ordenar: completados al final, luego por fecha de expiración, luego por dificultad
    return processed.sort((a, b) => {
      // Colocar completados al final
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      
      // Si ambos tienen deadline, ordenar por fecha más cercana
      if (a.challenge.deadline && b.challenge.deadline) {
        return a.challenge.deadline.getTime() - b.challenge.deadline.getTime();
      }
      
      // Si solo uno tiene deadline, ese va primero
      if (a.challenge.deadline) return -1;
      if (b.challenge.deadline) return 1;
      
      // Ordenar por dificultad (hard primero)
      const difficultyOrder = { hard: 0, medium: 1, easy: 2 };
      return difficultyOrder[a.challenge.difficulty] - difficultyOrder[b.challenge.difficulty];
    });
  }, [challenges, completedChallenges, userProgress, celebrationStates]);
  
  // Manejar clic en tarjeta
  const handleCardClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    
    if (onChallengeClick) {
      onChallengeClick(challenge);
    }
  };
  
  // Actualizar celebraciones cuando cambia el progreso
  React.useEffect(() => {
    const newCelebrations: Record<string, CelebrationLevel> = {};
    const challengesCompleted: string[] = [];
    
    challenges.forEach(challenge => {
      // Verificar si hay nuevos hitos alcanzados
      const newMilestones = getNewlyReachedMilestones(challenge, userProgress);
      
      if (newMilestones.length > 0) {
        // Si se alcanzó el target completo
        if (newMilestones.includes(challenge.targetValue)) {
          newCelebrations[challenge.id] = CelebrationLevel.MEDIUM;
          
          // Agregar a la lista para notificar después
          if (onChallengeCompleted) {
            challengesCompleted.push(challenge.id);
          }
        } else {
          // Si se alcanzó un milestone intermedio
          newCelebrations[challenge.id] = CelebrationLevel.SMALL;
        }
      }
    });
    
    // Actualizar estados de celebración
    if (Object.keys(newCelebrations).length > 0) {
      setCelebrationStates(prev => ({
        ...prev,
        ...newCelebrations
      }));
      
      // Limpiar las celebraciones después de un tiempo
      const timeout = setTimeout(() => {
        setCelebrationStates(prev => {
          const updated = { ...prev };
          Object.keys(newCelebrations).forEach(id => {
            delete updated[id];
          });
          return updated;
        });
      }, 3000);
      
      // Notificar los desafíos completados una sola vez al final
      if (challengesCompleted.length > 0 && onChallengeCompleted) {
        // Usamos setTimeout para evitar el bucle de actualización
        const notifyTimeout = setTimeout(() => {
          challengesCompleted.forEach(id => {
            onChallengeCompleted(id);
          });
        }, 0);
        
        return () => {
          clearTimeout(timeout);
          clearTimeout(notifyTimeout);
        };
      }
      
      return () => clearTimeout(timeout);
    }
  // Eliminamos onChallengeCompleted de las dependencias para evitar el ciclo
  }, [challenges, userProgress]);
  
  // Variantes de animación para el contenedor
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: ANIMATION_TIMING.stagger,
        delayChildren: ANIMATION_TIMING.delay
      }
    }
  };

  const completionPercentage = challenges.length > 0
    ? (completedChallenges.length / challenges.length) * 100
    : 0;

  return (
    <div className="weekly-challenges w-full space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Desafíos Semanales
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              {completedChallenges.length}/{challenges.length} Completados
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso semanal</span>
              <span className="font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      <motion.div
        ref={ref}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        {processedChallenges.map(({ challenge, status, progress, isCompleted, celebrationLevel }) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            isCompleted={isCompleted}
            progress={progress}
            status={status as ChallengeStatus}
            celebrationLevel={celebrationLevel}
            onClick={() => handleCardClick(challenge)}
          />
        ))}
        
        {/* Mensaje si no hay desafíos */}
        {processedChallenges.length === 0 && (
          <motion.div 
            className="col-span-full p-6 bg-gray-100 rounded-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">¡No hay desafíos activos!</h3>
            <p className="text-gray-600">Nuevos desafíos estarán disponibles pronto.</p>
          </motion.div>
        )}
      </motion.div>
      
      {/* Modal de detalle */}
      <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center mb-4">
              <span className="text-4xl mb-2">{selectedChallenge?.icon}</span>
              <DialogTitle className="text-xl">{selectedChallenge?.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {selectedChallenge?.description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {selectedChallenge && (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso:</span>
                      <span className="font-medium">
                        {selectedChallenge.currentValue || 0}/{selectedChallenge.targetValue}
                      </span>
                    </div>
                    <Progress value={calculateProgress(selectedChallenge)} className="h-2" />
                  </CardContent>
                </Card>

                {selectedChallenge.deadline && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Fecha límite:</span>
                    <span className="font-medium text-sm">
                      {selectedChallenge.deadline.toLocaleDateString()}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Recompensa:</span>
                  <div className="flex flex-wrap gap-2">
                    {(selectedChallenge.reward.type === 'xp' || selectedChallenge.reward.type === 'both') && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <span>⭐</span>
                        {selectedChallenge.reward.value} XP
                      </Badge>
                    )}
                    {(selectedChallenge.reward.type === 'badge' || selectedChallenge.reward.type === 'both') && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {selectedChallenge.reward.badgeName}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setSelectedChallenge(null)}
                >
                  {completedChallenges.includes(selectedChallenge.id)
                    ? 'Ver detalles completos'
                    : 'Continuar desafío'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklyChallenges;
