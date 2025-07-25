import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserExperience } from '../../hooks/useUserExperience';
import CourseCard from '../../components/courses/CourseCard';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Area } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import ReactConfetti from 'react-confetti';
import ExperienceBar from '../../components/experience/ExperienceBar';
import { StreakTracker } from '../../components/streak';
import { WeeklyChallenges, MOCK_CHALLENGES } from '../../components/challenges';

/**
 * Dashboard principal de la plataforma
 * Muestra resumen de cursos, progreso y accesos rápidos
 */
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState<string>('Bienvenido');
  const [loading, setLoading] = useState<boolean>(true);

  // Usar el hook de experiencia para acceder al sistema híbrido de XP
  const { 
    totalXP, 
    currentLevel, 
    isOnboardingComplete,
    loading: experienceLoading,
    error: experienceError
  } = useUserExperience(user?.id ? { userId: user.id } : { userId: '' });

  // Debug log for experience system
  useEffect(() => {
    if (!experienceLoading) {
      console.log('🔍 [DashboardPage] User experience data loaded:', {
        totalXP,
        currentLevel,
        isOnboardingComplete
      });
    }
  }, [totalXP, currentLevel, isOnboardingComplete, experienceLoading]);

  // Determinar saludo según la hora del día
  useEffect(() => {
    const getCurrentGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) {
        return 'Buenos días';
      } else if (currentHour >= 12 && currentHour < 19) {
        return 'Buenas tardes';
      } else {
        return 'Buenas noches';
      }
    };

    setGreeting(getCurrentGreeting());

    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Estados para la gamificación y el dashboard avanzado
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);
  const [showAchievement, setShowAchievement] = useState<boolean>(false);
  const [currentStreak, setCurrentStreak] = useState<number>(4);
  const [longestStreak, setLongestStreak] = useState<number>(7);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(5);
  // Nota: Ya no usamos estos estados locales, ahora usamos los valores del hook useUserExperience
  // const [userLevel, setUserLevel] = useState<number>(3);
  // const [experiencePoints, setExperiencePoints] = useState<number>(325);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(['challenge-3']);
  const [userChallengeProgress, setUserChallengeProgress] = useState<any>({
    'challenge-1': { currentValue: 3, lastUpdated: new Date(), milestoneReached: [1, 3] },
    'challenge-2': { currentValue: 450, lastUpdated: new Date(), milestoneReached: [100, 250, 400] },
    'challenge-3': { currentValue: 3, lastUpdated: new Date(), milestoneReached: [1, 3] },
    'challenge-4': { currentValue: 0, lastUpdated: new Date(), milestoneReached: [] },
    'challenge-5': { currentValue: 1, lastUpdated: new Date(), milestoneReached: [1] },
    'challenge-6': { currentValue: 7, lastUpdated: new Date(), milestoneReached: [3, 7] },
  });
  const [nextAchievement, setNextAchievement] = useState<{name: string, description: string, icon: string, progress: number}>(
    {name: 'Explorador Dedicado', description: 'Completa 5 cursos diferentes', icon: '🏆', progress: 60}
  );

  // Función para mostrar celebración de logros
  useEffect(() => {
    if (showAchievement) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setShowAchievement(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showAchievement]);

  // Generar fechas de estudio para mostrar múltiples meses (estilo GitHub)
  const mockStudyDates = useMemo(() => {
    // Generate mock study data
    const dates: Date[] = [];
    const today = new Date();

    // Generar datos para los últimos 200 días (aproximadamente 7 meses)
    for (let i = 0; i <= 200; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      // Patrón de actividad diferente según el mes para simular GitHub
      const month = date.getMonth();
      const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

      // Más actividad en días laborales
      const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;

      // Probabilidad base según el mes (más actividad en meses recientes)
      const monthFactor = 1 - (i / 250); // Factor que disminuye con el tiempo

      // Patrón visual distintivo para cada mes
      let probability;
      if (i < 30) { // Último mes: alta actividad
        probability = isWeekday ? 0.7 : 0.4;
      } else if (i < 60) { // Penúltimo mes: actividad media-alta
        probability = isWeekday ? 0.6 : 0.3;
      } else if (i < 90) { // Antepenúltimo mes: patrón discontinuo
        probability = (i % 7 === 0) ? 0.8 : (isWeekday ? 0.4 : 0.2);
      } else { // Meses anteriores: actividad espaciada
        probability = isWeekday ? 0.3 : 0.15;
      }

      // Ajustar por factor de tiempo
      probability *= monthFactor;

      // Determinar si hay actividad este día
      if (Math.random() < probability) {
        dates.push(date);
      }
    }

    // Asegurar streak actual de 4 días
    for (let i = 0; i < 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      // Quitar duplicados
      if (!dates.some(d => d.toDateString() === date.toDateString())) {
        dates.push(date);
      }
    }

    return dates;
  }, []);

  // Datos de ejemplo para el dashboard
  const courses = [
    {
      id: 1,
      title: 'Introducción a la consultoría estratégica',
      progress: 65,
      image: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Estrategia',
      lessons: 12,
      completedLessons: 8,
      category: 'Estrategia',
      difficulty: 'Intermedio',
      estimatedTime: '4h 30min',
      lastActivity: '2025-07-20T14:30:00',
      status: 'En Progreso',
    },
    {
      id: 2,
      title: 'Análisis de procesos empresariales',
      progress: 25,
      image: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Análisis',
      lessons: 8,
      completedLessons: 2,
      category: 'Análisis',
      difficulty: 'Avanzado',
      estimatedTime: '6h 15min',
      lastActivity: '2025-07-19T10:15:00',
      status: 'En Progreso',
    },
    {
      id: 3,
      title: 'Optimización de operaciones',
      progress: 0,
      image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Operaciones',
      lessons: 10,
      completedLessons: 0,
      category: 'Operaciones',
      difficulty: 'Principiante',
      estimatedTime: '3h 45min',
      lastActivity: null,
      status: 'Nuevo',
      isNew: true,
    },
  ];

  // Simulación de datos para los gráficos
  useEffect(() => {
    // Datos para el gráfico circular de distribución de tiempo
    const pieData = [
      { name: 'Estrategia', value: 35, color: '#3B82F6' },
      { name: 'Operaciones', value: 25, color: '#10B981' },
      { name: 'Análisis', value: 20, color: '#6366F1' },
      { name: 'Liderazgo', value: 15, color: '#F59E0B' },
      { name: 'Innovación', value: 5, color: '#8B5CF6' },
    ];

    // Datos para el gráfico de línea de progreso semanal
    const weekData = [
      { day: 'Lun', progress: 30 },
      { day: 'Mar', progress: 45 },
      { day: 'Mie', progress: 25 },
      { day: 'Jue', progress: 60 },
      { day: 'Vie', progress: 20 },
      { day: 'Sab', progress: 15 },
      { day: 'Dom', progress: 0 },
    ];

    setChartData(pieData);
    setWeeklyProgress(weekData);
  }, []);

  // Función para manejar la finalización de un desafío
  const onChallengeCompleted = (challengeId: string) => {
    // Buscar el desafío para obtener el valor objetivo
    const challenge = MOCK_CHALLENGES.find(c => c.id === challengeId);
    const targetValue = challenge ? challenge.targetValue : 0;
    
    // Actualizar progreso local
    setUserChallengeProgress(prev => ({
      ...prev,
      [challengeId]: {
        ...prev[challengeId],
        currentValue: targetValue,
        lastUpdated: new Date()
      }
    }));
    
    // Otorgar XP si es un desafío que no estaba completado antes
    if (!completedChallenges.includes(challengeId)) {
      setCompletedChallenges(prev => [...prev, challengeId]);
      // Ya no usamos setExperiencePoints ya que ahora usamos el hook useUserExperience
      setShowConfetti(true);
      
      // Ocultar confeti después de un tiempo
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }
  };
  
  // Determinar curso más relevante basado en el progreso
  const getMostRelevantCourse = () => {
    if (!courses.length) return null;
    // Ordenar cursos por progreso (mayor a menor)
    return [...courses].sort((a, b) => b.progress - a.progress)[0];
  };

  const mostRelevantCourse = getMostRelevantCourse();

  return (
    <div className="space-y-6 pb-10 dashboard-page-container" data-onboarding="dashboard-main">
      {/* 1. Cabecera de bienvenida */}
      <header>
        <AnimatePresence>
          {loading ? (
            <motion.div 
              className="bg-primary-700 rounded-lg shadow-md p-6 bg-gradient-to-r from-primary-700 to-primary-800 relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Skeleton loading para cabecera */}
              <div className="content-overlay flex items-center justify-between relative">
                <div className="flex flex-col space-y-4 mb-6" data-onboarding="learning-goals">
                  <div className="h-8 w-64 bg-primary-600/40 rounded-md animate-pulse"></div>
                  <div className="h-5 w-48 bg-primary-600/30 rounded-md animate-pulse"></div>
                </div>
                <div className="hidden md:block">
                  <div className="bg-primary-600/30 rounded-full h-20 w-20 animate-pulse"></div>
                </div>
              </div>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary-600/10 to-transparent"></div>
            </motion.div>
          ) : (
            <motion.div 
              className="bg-primary-700 rounded-lg shadow-md p-6 bg-gradient-to-r from-primary-700 to-primary-800 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Elementos decorativos flotantes */}
              <motion.div 
                className="absolute top-4 right-16 h-3 w-3 rounded-full bg-primary-400/30"
                animate={{ y: [-5, 5, -5], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute bottom-6 right-32 h-5 w-5 rounded-full bg-primary-300/20"
                animate={{ y: [5, -5, 5], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute top-12 left-40 h-4 w-4 rounded-sm bg-primary-400/20 rotate-45"
                animate={{ rotate: [45, 90, 45] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              />

              <div className="content-overlay flex items-center justify-between relative z-10">
                <div>
                  <motion.h1 
                    className="text-2xl md:text-3xl font-bold text-white mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    {greeting}, {user ? (
                      // Aseguramos extraer el nombre completo
                      user.full_name ? 
                        user.full_name.split(' ')[0] : // Solo tomar el primer nombre para el saludo
                        (user.firstName ? 
                          user.firstName : // Usar firstName si existe
                          (user.lastName ? 
                            user.lastName : // Usar lastName como alternativa
                            'Estudiante'))
                    ) : 'Estudiante'}
                  </motion.h1>
                  <motion.p 
                    className="text-primary-100 text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Continúa tu aprendizaje donde lo dejaste
                  </motion.p>
                </div>
                <motion.div 
                  className="hidden md:block"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                >
                  <div className="bg-white bg-opacity-10 p-3 rounded-full h-20 w-20 flex items-center justify-center shadow-glow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Accesos rápidos */}
      <section>
        <AnimatePresence>
          {loading ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Skeletons para accesos rápidos */}
              {[...Array(3)].map((_, i) => (
                <motion.div 
                  key={`skeleton-card-${i}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="rounded-full bg-gray-100 p-3 mr-4 w-12 h-12 animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-24 bg-gray-100 rounded-md animate-pulse"></div>
                    <div className="h-4 w-36 bg-gray-50 rounded-md animate-pulse"></div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Card 1: Acceso adaptativo - Mostrar curso relevante o invitación para empezar */}
              <motion.div 
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center relative overflow-hidden group ${mostRelevantCourse && mostRelevantCourse.progress > 0 ? 'border-l-4 border-l-primary-500' : ''}`}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 15px -3px rgba(var(--color-primary-700), 0.1), 0 4px 6px -4px rgba(var(--color-primary-700), 0.1)"
                }}
              >
                <motion.div 
                  className="rounded-full bg-primary-100 p-3 mr-4 flex items-center justify-center relative"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.svg 
                    className="h-6 w-6 text-primary-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </motion.svg>
                </motion.div>
                <div className="flex-grow relative z-10">
                  <h3 className="font-medium">Nivel de usuario</h3>
                  <p className="text-sm text-gray-500">
                    Nivel {currentLevel || 1} · {totalXP || 0} XP total
                  </p>
                </div>

                {/* Highlight en hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </motion.div>

              {/* Card 2: Experiencia y progreso */}
              <motion.div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center relative overflow-hidden group"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 15px -3px rgba(var(--color-primary-700), 0.1), 0 4px 6px -4px rgba(var(--color-primary-700), 0.1)"
                }}
              >
                <motion.div 
                  className="rounded-full bg-primary-100 p-3 mr-4 flex items-center justify-center relative"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.svg 
                    className="h-6 w-6 text-primary-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </motion.svg>
                </motion.div>
                <div className="flex-grow">
                  <h3 className="font-medium">Tu progreso semanal</h3>
                  <p className="text-sm text-gray-500">
                    {currentStreak} días consecutivos · Racha máxima: {longestStreak} días
                  </p>
                </div>
                {/* Highlight en hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </motion.div>

              {/* Card 3: Desafíos */}
              <motion.div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center relative overflow-hidden group"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 15px -3px rgba(var(--color-primary-700), 0.1), 0 4px 6px -4px rgba(var(--color-primary-700), 0.1)"
                }}
              >
                <motion.div 
                  className="rounded-full bg-primary-100 p-3 mr-4 flex items-center justify-center relative"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.svg 
                    className="h-6 w-6 text-primary-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </motion.svg>
                </motion.div>
                <div className="flex-grow">
                  <h3 className="font-medium">Desafíos semanales</h3>
                  <p className="text-sm text-gray-500">
                    {completedChallenges.length} completados · {MOCK_CHALLENGES.length} disponibles
                  </p>
                </div>
                {/* Badge para mostrar nuevo desafío */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-accent-500 rounded-full">{MOCK_CHALLENGES.length - completedChallenges.length}</span>
                </div>
                {/* Highlight en hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3. Continúa aprendiendo */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Continúa aprendiendo</h2>
          <Link to="/platform/courses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todos los cursos
          </Link>
        </div>
        
        {/* Mostrar tarjetas de cursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.slice(0, 3).map((course, index) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              progress={course.progress}
              image={course.image}
              category={course.category}
              difficulty={course.difficulty}
              estimatedTime={course.estimatedTime}
              data-onboarding={index === 0 ? "suggested-course" : undefined}
            />
          ))}
        </div>
      </section>

      {/* 4. ExperienceBar y StreakTracker */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Tu progreso</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ExperienceBar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" data-onboarding="experience-progress">
            <h3 className="font-medium mb-3">Nivel de experiencia</h3>
            <ExperienceBar 
              totalXP={totalXP || 0}
              currentLevel={currentLevel || 1}
              xpForNextLevel={1000}
              currentLevelXP={totalXP ? totalXP % 1000 : 0}
              coursesCompleted={completedChallenges.length}
              lessonsCompleted={currentStreak}
              certificates={longestStreak > 7 ? Math.floor(longestStreak / 7) : 0}
            />
            <p className="text-sm text-gray-500 mt-2">
              {totalXP ? totalXP % 1000 : 0} de 1000 XP para alcanzar el nivel {(currentLevel || 1) + 1}
            </p>
          </div>
          
          {/* StreakTracker */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" data-onboarding="learning-streak">
            <h3 className="font-medium mb-3">Racha de aprendizaje</h3>
            <StreakTracker 
              studyDates={mockStudyDates} 
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              weeklyGoal={weeklyGoal}
            />
          </div>
        </div>
      </section>

      {/* 5. Desafíos semanales */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Desafíos semanales</h2>
          <span className="text-primary-600 text-sm">{completedChallenges.length}/{MOCK_CHALLENGES.length} completados</span>
        </div>
        <WeeklyChallenges 
          challenges={MOCK_CHALLENGES}
          userProgress={userChallengeProgress}
          completedChallenges={completedChallenges}
          onChallengeCompleted={onChallengeCompleted}
          data-onboarding="weekly-challenges"
        />
      </section>

      {/* 6. Próximamente */}
      <AnimatePresence>
        {loading ? (
          <motion.section 
            className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-lg shadow-md p-6 text-white relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="content-overlay">
              <div className="h-6 w-40 bg-primary-600/40 rounded animate-pulse mb-3"></div>
              <div className="h-4 w-full max-w-md bg-primary-600/30 rounded animate-pulse mb-4"></div>
              <div className="h-10 w-48 bg-primary-600/20 rounded animate-pulse"></div>
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary-600/10 to-transparent"></div>
          </motion.section>
        ) : (
          <motion.section 
            className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-lg shadow-md p-6 text-white relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="content-overlay relative z-10">
              <motion.h2 
                className="text-xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Próximamente
              </motion.h2>
              <motion.p 
                className="text-primary-100 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Estamos trabajando en nuevos cursos y características que mejorarán tu experiencia de aprendizaje.
              </motion.p>
              <motion.div 
                className="inline-block px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg text-sm border border-white/10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                Lanzamiento de nuevos cursos: Agosto 2025
              </motion.div>
            </div>
            
            {/* Elementos decorativos flotantes */}
            <motion.div 
              className="absolute top-4 right-8 h-3 w-3 rounded-full bg-white/10"
              animate={{ y: [-5, 5, -5], opacity: [0.5, 0.8, 0.5] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute bottom-8 right-12 h-5 w-5 rounded-full bg-white/10"
              animate={{ y: [5, -5, 5], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute top-12 left-[30%] h-4 w-4 rounded-sm bg-white/10 rotate-45"
              animate={{ rotate: [45, 90, 45] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            />
            
            {/* Gradiente pulsante */}
            <motion.div 
              className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary-500/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Confeti para celebraciones */}
      {showConfetti && (
        <ReactConfetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}
    </div>
  );
};

export default DashboardPage;
