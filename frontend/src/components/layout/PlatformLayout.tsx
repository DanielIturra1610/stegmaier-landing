import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// import { FirstDayExperience, User as OnboardingUser, shouldShowOnboarding, trackMissionEvent } from '../onboarding';
import { User as AuthUser } from '../../types/auth';
// import { useUserExperience } from '../../hooks/useUserExperience';
// import { ANALYTICS_EVENTS } from '../onboarding/constants';
import PageHeader from '../header/PageHeader';
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
  
  // TEMPORALMENTE DESHABILITADO: Usar el hook de experiencia para acceder al sistema híbrido de XP
  /*
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
  */
  
  // TEMPORALMENTE DESHABILITADO: Tipo para el usuario con propiedades de experiencia
  /*
  type ExtendedUser = AuthUser & {
    currentLevel?: number;
    totalXP?: number;
  };
  */

  // Toggle para el sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // TEMPORALMENTE DESHABILITADO: Detectar si el usuario es nuevo y necesita onboarding
  /*
  useEffect(() => {
    // Solo proceder si hay un usuario autenticado y los datos de experiencia están cargados
    if (user && !experienceLoading) {
      try {
        // Usar la utilidad para determinar si mostrar onboarding
        const shouldShow = shouldShowOnboarding({
          currentLevel, 
          totalXP,
          role: user.role  // Pasar el rol del usuario
        }) && !isOnboardingComplete;
        
        console.log('🔍 [PlatformLayout] Evaluating showOnboarding:', {
          currentLevel,
          totalXP,
          role: user.role,
          isOnboardingComplete,
          shouldShowResult: shouldShow
        });
        
        // Solo mostrar onboarding si realmente debe mostrarse según las reglas de negocio
        if (shouldShow) {
          console.log('🚀 [Onboarding] Iniciando experiencia de primer día para usuario nuevo', {
            currentLevel,
            totalXP,
            isOnboardingComplete
          });
          
          // Iniciar onboarding sin celebración automática
          setShowOnboarding(true);
          
          // Registrar inicio de onboarding para analytics
          trackMissionEvent(ANALYTICS_EVENTS.MISSION_STARTED, 'onboarding_init', {
            userId: user.id,
            timestamp: new Date().toISOString()
          });
        } else {
          // Si no debe mostrarse, asegurarnos de que esté desactivado
          setShowOnboarding(false);
          console.log('ℹ️ [Onboarding] No se requiere onboarding', { 
            currentLevel, 
            totalXP,
            isOnboardingComplete 
          });
        }
      } catch (error) {
        console.error('[Onboarding] Error verificando estado de onboarding:', error);
        setShowOnboarding(false); // Por seguridad, desactivar en caso de error
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
  */

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* TEMPORALMENTE DESHABILITADO: Sistema de onboarding para usuarios nuevos */}
      {/*
      {showOnboarding && user && !experienceLoading && (
        <>
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
      */}
      {/* Sidebar para navegación de la plataforma */}
      <PlatformSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        data-onboarding="platform-sidebar"
      />
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1">
        {/* Header contextual */}
        <PageHeader 
          onMenuClick={toggleSidebar}
        />
        
        {/* Contenido dinámico */}
        <main 
          className="flex-1 overflow-auto p-4 md:p-6"
          data-onboarding="dashboard-main"
        >
          <div className="max-w-7xl mx-auto min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
