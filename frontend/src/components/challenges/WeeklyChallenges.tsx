import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

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

  return (
    <div className="weekly-challenges w-full">
      <motion.div 
        className="mb-4 flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold">Desafíos Semanales</h2>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">
            {completedChallenges.length}/{challenges.length} Completados
          </span>
          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary-500"
              initial={{ width: 0 }}
              animate={{ 
                width: `${challenges.length > 0 ? (completedChallenges.length / challenges.length) * 100 : 0}%` 
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
      
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
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedChallenge(null)}
          >
            <motion.div
              className="bg-white rounded-xl max-w-md w-full p-6 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar */}
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedChallenge(null)}
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Contenido del detalle */}
              <div className="text-center mb-4">
                <span className="text-4xl mb-2 block">{selectedChallenge.icon}</span>
                <h3 className="text-xl font-bold">{selectedChallenge.title}</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700">{selectedChallenge.description}</p>
                
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Progreso:</span>
                    <span className="font-medium">
                      {selectedChallenge.currentValue || 0}/{selectedChallenge.targetValue}
                    </span>
                  </div>
                  
                  <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500" 
                      style={{ 
                        width: `${calculateProgress(selectedChallenge)}%` 
                      }} 
                    />
                  </div>
                </div>
                
                {selectedChallenge.deadline && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Fecha límite:</span>
                    <span className="font-medium">
                      {selectedChallenge.deadline.toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Recompensa:</span>
                    <div className="flex items-center">
                      {selectedChallenge.reward.type === 'xp' || selectedChallenge.reward.type === 'both' ? (
                        <div className="flex items-center mr-3">
                          <span className="text-yellow-500 mr-1">⭐</span>
                          <span className="font-bold">{selectedChallenge.reward.value}XP</span>
                        </div>
                      ) : null}
                      
                      {selectedChallenge.reward.type === 'badge' || selectedChallenge.reward.type === 'both' ? (
                        <div className="flex items-center">
                          <span className="text-blue-500 mr-1">🏆</span>
                          <span className="font-bold">{selectedChallenge.reward.badgeName}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                
                {/* Botón de acción */}
                <button
                  className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  onClick={() => {
                    // Aquí iría la lógica para iniciar o continuar el desafío
                    setSelectedChallenge(null);
                  }}
                >
                  {completedChallenges.includes(selectedChallenge.id) 
                    ? 'Ver detalles completos'
                    : 'Continuar desafío'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyChallenges;
