import React, { useEffect } from 'react';
import { CelebrationModalProps } from './types';
import Confetti from 'react-confetti';

/**
 * CelebrationModal Component
 * 
 * Displays a celebration modal with confetti when missions are completed
 * Uses only Tailwind CSS classes for styling
 */
const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isVisible,
  config,
  onClose
}) => {
  const { title, message, xpEarned, isFinal } = config;

  // Auto-hide for micro celebrations
  useEffect(() => {
    if (isVisible && !isFinal) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, isFinal, onClose]);
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div 
      className={`fixed inset-0 ${isFinal ? 'z-60' : 'z-50'} flex items-center justify-center ${isFinal ? 'bg-gray-900/75 backdrop-blur-md' : ''}`}
      role="dialog"
      aria-labelledby="celebration-title"
      aria-describedby="celebration-message"
    >
      {/* Confetti effect */}
      {isFinal ? (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
        />
      ) : (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={50}
          gravity={0.2}
          tweenDuration={3000}
        />
      )}
      
      {isFinal ? (
        // Final celebration modal
        <div className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-xl p-8 max-w-md mx-4 text-white shadow-2xl transform transition-transform duration-500 scale-110 animate-fade-in">
          {/* Header with trophy icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-primary-600 p-4 rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-300 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <h2 
            id="celebration-title"
            className="text-2xl font-bold text-center mb-4"
          >
            {title}
          </h2>
          
          {/* Message */}
          <p 
            id="celebration-message"
            className="text-white/90 text-center mb-6"
          >
            {message}
          </p>
          
          {/* Rewards */}
          <div className="bg-primary-600/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-2 text-center">
              Recompensas desbloqueadas
            </h3>
            
            <div className="flex flex-col gap-3">
              {/* XP earned */}
              <div className="flex items-center justify-between">
                <span>Experiencia ganada:</span>
                <span className="font-bold text-yellow-300">+{xpEarned} XP</span>
              </div>
              
              {/* Level unlocked */}
              <div className="flex items-center justify-between">
                <span>Nivel desbloqueado:</span>
                <span className="font-bold text-yellow-300">Nivel 1</span>
              </div>
              
              {/* Special badge */}
              <div className="flex items-center justify-between">
                <span>Insignia especial:</span>
                <span className="inline-flex items-center px-4 py-2 bg-accent-500 text-white rounded-full text-sm font-medium">
                  Pionero Empresarial
                </span>
              </div>
            </div>
          </div>
          
          {/* Close button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="inline-flex items-center px-6 py-3 bg-white text-primary-700 rounded-lg text-base font-medium shadow hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500"
            >
              Comenzar mi camino
            </button>
          </div>
        </div>
      ) : (
        // Micro celebration toast
        <div className="fixed top-4 right-4 bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 scale-100">
          <div className="flex items-center gap-3">
            {/* Check icon */}
            <div className="bg-green-500 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Content */}
            <div>
              <p className="font-medium text-sm">{title}</p>
              <div className="flex items-center text-xs">
                <span className="font-bold mr-1">+{xpEarned} XP</span>
                <span>{message}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CelebrationModal;
