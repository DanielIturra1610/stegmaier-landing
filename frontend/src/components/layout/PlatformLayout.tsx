import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FirstDayExperience, User as OnboardingUser, shouldShowOnboarding, trackMissionEvent } from '../onboarding';
import { User as AuthUser } from '../../types/auth';
import { useUserExperience } from '../../hooks/useUserExperience';
import { ANALYTICS_EVENTS } from '../onboarding/constants';
import PlatformNavbar from './PlatformNavbar';
import PlatformSidebar from './PlatformSidebar';

/**
 * Layout para la plataforma de cursos (área protegida)
 * Incluye una barra de navegación superior y un sidebar lateral
 */
const PlatformLayout: React.FC = () => {
  // Estado para la interfaz principal
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Obtener datos del usuario actual del contexto de autenticación
  const { user } = useAuth();
  
  // Usar el hook de experiencia para acceder al sistema híbrido de XP
  const { 
    totalXP, 
    currentLevel, 
    isOnboardingComplete,
    completeMission,
    markOnboardingComplete,
    loading: experienceLoading,
    error: experienceError
  } = useUserExperience(user?.id ? { userId: user.id } : { userId: '' });
  
  // Estado para el sistema de onboarding basado en la experiencia del usuario
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Tipo para el usuario con propiedades de experiencia
  type ExtendedUser = AuthUser & {
    currentLevel?: number;
    totalXP?: number;
  };

  // Toggle para el sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Detectar si el usuario es nuevo y necesita onboarding
  useEffect(() => {
    // Solo proceder si hay un usuario autenticado y los datos de experiencia están cargados
    if (user && !experienceLoading) {
      try {
        // Usar la utilidad para determinar si mostrar onboarding
        const shouldShow = shouldShowOnboarding({currentLevel, totalXP}) && !isOnboardingComplete;
        
        console.log('🔍 [PlatformLayout] Evaluating showOnboarding:', {
          currentLevel,
          totalXP,
          isOnboardingComplete,
          shouldShowResult: shouldShow
        });
        
        if (shouldShow) {
          console.log('🚀 [Onboarding] Iniciando experiencia de primer día para usuario nuevo', {
            currentLevel,
            totalXP,
            isOnboardingComplete
          });
          setShowOnboarding(true);
          
          // Registrar inicio de onboarding para analytics
          trackMissionEvent(ANALYTICS_EVENTS.MISSION_STARTED, 'onboarding_init', {
            userId: user.id,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('ℹ️ [Onboarding] No se requiere onboarding', { 
            currentLevel, 
            totalXP,
            isOnboardingComplete 
          });
        }
      } catch (error) {
        console.error('[Onboarding] Error verificando estado de onboarding:', error);
      }
    }
  }, [user, currentLevel, totalXP, isOnboardingComplete, experienceLoading]);
  
  // Manejar la finalización del onboarding
  const handleOnboardingComplete = async (totalXpEarned: number) => {
    try {
      // Usar el servicio para marcar el onboarding como completado
      await markOnboardingComplete();
      
      // Ocultar el onboarding
      setShowOnboarding(false);
      
      // Registrar evento de finalización para analytics
      trackMissionEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, 'onboarding_complete', {
        userId: user?.id,
        totalXpEarned,
        currentLevel
      });
      
      // Log para análisis y debugging
      console.log(`🎉 [Onboarding] Completado - Usuario listo para explorar plataforma (${totalXpEarned} XP ganados)`);
    } catch (error) {
      console.error('[Onboarding] Error al guardar estado de onboarding:', error);
    }
  };
  
  // Manejar la finalización de una misión individual
  const handleMissionComplete = async (missionId: string, xpReward: number) => {
    try {
      // Usar el servicio para completar la misión
      await completeMission(missionId, xpReward);
      
      console.log(`✅ [Onboarding] Misión completada: ${missionId} (+${xpReward} XP)`);
    } catch (error) {
      console.error(`[Onboarding] Error al completar misión ${missionId}:`, error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sistema de onboarding para usuarios nuevos */}
      {showOnboarding && user && !experienceLoading && (
        <>
          <button
            onClick={() => {
              setShowOnboarding(false);
              console.log('Onboarding cerrado manualmente por el usuario');
            }}
            className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-red-700"
          >
            Cerrar Onboarding
          </button>
          <FirstDayExperience
            user={{
              ...user,
              currentLevel,
              totalXP,
              id: user?.id || ''
            } as unknown as OnboardingUser}
            onMissionComplete={handleMissionComplete}
            onFirstDayComplete={handleOnboardingComplete}
            isVisible={showOnboarding}
          />
        </>
      )}
      {/* Sidebar para navegación de la plataforma */}
      <PlatformSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        data-onboarding="platform-sidebar"
      />
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1">
        {/* Navbar de la plataforma */}
        <PlatformNavbar 
          onMenuClick={toggleSidebar} 
          data-onboarding="platform-navbar" 
        />
        
        {/* Contenido dinámico */}
        <main 
          className="flex-1 overflow-auto p-4 md:p-6"
          data-onboarding="dashboard-main"
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Footer simple para la plataforma */}
        <footer className="bg-white border-t border-gray-200 py-3">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Stegmaier. Todos los derechos reservados.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PlatformLayout;
