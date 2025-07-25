/**
 * Servicio híbrido para gestionar la experiencia del usuario
 * Implementación actual: localStorage
 * Preparado para migración a backend API
 */

// Interfaces para tipado consistente
export interface UserProgress {
  userId: string;
  totalXP: number;
  currentLevel: number;
  completedMissions: string[];
  lastUpdated: string;
}

export interface IExperienceService {
  getUserProgress(userId: string): Promise<UserProgress>;
  updateUserXP(userId: string, earnedXP: number): Promise<UserProgress>;
  markOnboardingComplete(userId: string): Promise<boolean>;
  isOnboardingCompleted(userId: string): Promise<boolean>;
  getMissionProgress(userId: string): Promise<string[]>;
  saveMissionProgress(userId: string, missionId: string): Promise<string[]>;
}

class ExperienceService implements IExperienceService {
  private readonly MAX_RETRIES = 3;
  private readonly STORAGE_PREFIX = 'stegmaier_';
  
  /**
   * Obtiene el progreso del usuario desde localStorage
   * @param userId ID único del usuario
   * @returns Objeto con el progreso del usuario
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    console.log(`🔍 Loading progress for user: ${userId}`);
    
    try {
      // Intentar obtener datos con hasta MAX_RETRIES intentos
      for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
        try {
          const storageKey = `${this.STORAGE_PREFIX}progress_${userId}`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const parsedData = JSON.parse(storedData) as UserProgress;
            console.log(`📊 Current progress: XP=${parsedData.totalXP}, Level=${parsedData.currentLevel}`);
            return this.validateProgressData(parsedData);
          }
          
          // Si no hay datos, devolver valores por defecto
          break;
        } catch (error) {
          if (attempt === this.MAX_RETRIES - 1) throw error;
          console.error(`🚫 Operation failed: ${error} - Retrying...`);
        }
      }
      
      // Valores por defecto si no hay datos o error
      const defaultProgress: UserProgress = {
        userId,
        totalXP: 0,
        currentLevel: 0,
        completedMissions: [],
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`⚠️ Fallback activated: No stored progress found, using defaults`);
      return defaultProgress;
      
    } catch (error) {
      console.error(`Error retrieving user progress: ${error}`);
      // Retornar valores por defecto en caso de error
      return {
        userId,
        totalXP: 0,
        currentLevel: 0,
        completedMissions: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }
  
  /**
   * Actualiza la experiencia del usuario
   * @param userId ID único del usuario
   * @param earnedXP XP ganados
   * @returns Objeto con el progreso actualizado
   */
  async updateUserXP(userId: string, earnedXP: number): Promise<UserProgress> {
    try {
      // Obtener progreso actual
      const currentProgress = await this.getUserProgress(userId);
      
      // Actualizar XP y nivel
      const updatedProgress: UserProgress = {
        ...currentProgress,
        totalXP: currentProgress.totalXP + earnedXP,
        currentLevel: this.calculateLevel(currentProgress.totalXP + earnedXP),
        lastUpdated: new Date().toISOString()
      };
      
      // Guardar en localStorage
      const storageKey = `${this.STORAGE_PREFIX}progress_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedProgress));
      console.log(`💾 Saving progress: XP=${updatedProgress.totalXP}, Level=${updatedProgress.currentLevel}`);
      
      // Disparar evento customizado para notificar cambios
      this.dispatchXPUpdateEvent(updatedProgress);
      
      return updatedProgress;
      
      // TODO: replace with await api.post('/users/{userId}/experience', { earnedXP });
    } catch (error) {
      console.error(`Error updating user XP: ${error}`);
      throw error;
    }
  }
  
  /**
   * Marca el onboarding como completado
   * @param userId ID único del usuario
   * @returns true si se completó correctamente
   */
  async markOnboardingComplete(userId: string): Promise<boolean> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}onboarding_${userId}`;
      localStorage.setItem(storageKey, 'true');
      console.log(`🎉 Onboarding marked as completed for user: ${userId}`);
      return true;
      
      // TODO: await api.put('/users/{userId}/onboarding', { completed: true });
    } catch (error) {
      console.error(`Error marking onboarding complete: ${error}`);
      return false;
    }
  }
  
  /**
   * Verifica si el onboarding ha sido completado
   * @param userId ID único del usuario
   * @returns true si el onboarding está completado
   */
  async isOnboardingCompleted(userId: string): Promise<boolean> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}onboarding_${userId}`;
      return localStorage.getItem(storageKey) === 'true';
      
      // TODO: const response = await api.get('/users/{userId}/onboarding');
      // return response.data.completed;
    } catch (error) {
      console.error(`Error checking onboarding status: ${error}`);
      return false;
    }
  }
  
  /**
   * Obtiene las misiones completadas por el usuario
   * @param userId ID único del usuario
   * @returns Array con los IDs de las misiones completadas
   */
  async getMissionProgress(userId: string): Promise<string[]> {
    try {
      const progress = await this.getUserProgress(userId);
      return progress.completedMissions || [];
    } catch (error) {
      console.error(`Error getting mission progress: ${error}`);
      return [];
    }
  }
  
  /**
   * Guarda el progreso de una misión completada
   * @param userId ID único del usuario
   * @param missionId ID de la misión completada
   * @returns Array actualizado con todas las misiones completadas
   */
  async saveMissionProgress(userId: string, missionId: string): Promise<string[]> {
    try {
      const progress = await this.getUserProgress(userId);
      
      // Verificar si la misión ya está completada
      if (progress.completedMissions.includes(missionId)) {
        return progress.completedMissions;
      }
      
      // Actualizar lista de misiones completadas
      const updatedMissions = [...progress.completedMissions, missionId];
      const updatedProgress: UserProgress = {
        ...progress,
        completedMissions: updatedMissions,
        lastUpdated: new Date().toISOString()
      };
      
      // Guardar en localStorage
      const storageKey = `${this.STORAGE_PREFIX}progress_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedProgress));
      console.log(`🎯 Mission completed: ${missionId}`);
      
      return updatedMissions;
      
      // TODO: await api.post('/users/{userId}/missions', { missionId });
    } catch (error) {
      console.error(`Error saving mission progress: ${error}`);
      return [];
    }
  }
  
  /**
   * Calcula el nivel basado en XP total con fórmula exponencial
   * @param xp Experiencia total
   * @returns Nivel calculado
   */
  private calculateLevel(xp: number): number {
    // Fórmula exponencial: nivel = floor(sqrt(xp / 50))
    return Math.floor(Math.sqrt(xp / 50));
  }
  
  /**
   * Valida y corrige datos de progreso potencialmente corruptos
   * @param data Datos de progreso a validar
   * @returns Datos validados y corregidos
   */
  private validateProgressData(data: UserProgress): UserProgress {
    // Asegurar que todas las propiedades existen y son del tipo correcto
    return {
      userId: data.userId || '',
      totalXP: typeof data.totalXP === 'number' ? data.totalXP : 0,
      currentLevel: typeof data.currentLevel === 'number' ? data.currentLevel : 0,
      completedMissions: Array.isArray(data.completedMissions) ? data.completedMissions : [],
      lastUpdated: data.lastUpdated || new Date().toISOString()
    };
  }
  
  /**
   * Dispara evento personalizado para notificar actualizaciones de XP
   * @param progress Datos de progreso actualizados
   */
  private dispatchXPUpdateEvent(progress: UserProgress): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('userXPUpdated', { 
        detail: progress 
      });
      window.dispatchEvent(event);
      console.log('🔔 XP update event dispatched');
    }
  }
  
  /**
   * Exporta los datos de progreso para debugging
   * @param userId ID único del usuario
   * @returns Datos de progreso en formato string para debugging
   */
  async exportProgressData(userId: string): Promise<string> {
    try {
      const progress = await this.getUserProgress(userId);
      return JSON.stringify(progress, null, 2);
    } catch (error) {
      console.error(`Error exporting progress data: ${error}`);
      return '{}';
    }
  }
  
  /**
   * Importa datos de progreso (solo para debugging)
   * @param userId ID único del usuario 
   * @param jsonData Datos de progreso en formato JSON
   * @returns true si se importó correctamente
   */
  async importProgressData(userId: string, jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData) as UserProgress;
      const storageKey = `${this.STORAGE_PREFIX}progress_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify({
        ...data,
        userId, // Asegurar que el userId es correcto
        lastUpdated: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error(`Error importing progress data: ${error}`);
      return false;
    }
  }
}

// Singleton instance
export const experienceService = new ExperienceService();
export default experienceService;
