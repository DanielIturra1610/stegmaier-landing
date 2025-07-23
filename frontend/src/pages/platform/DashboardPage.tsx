import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CourseCard from '../../components/courses/CourseCard';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Area } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import ReactConfetti from 'react-confetti';
import ExperienceBar from '../../components/experience/ExperienceBar';
import { StreakTracker } from '../../components/streak';

/**
 * Dashboard principal de la plataforma
 * Muestra resumen de cursos, progreso y accesos rápidos
 */
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState<string>('Bienvenido');
  const [loading, setLoading] = useState<boolean>(true);
  
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
  const [userLevel, setUserLevel] = useState<number>(3);
  const [currentStreak, setCurrentStreak] = useState<number>(4);
  const [longestStreak, setLongestStreak] = useState<number>(7);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(5);
  const [experiencePoints, setExperiencePoints] = useState<number>(325);
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

  // Determinar curso más relevante basado en el progreso
  const getMostRelevantCourse = () => {
    if (!courses.length) return null;
    // Ordenar cursos por progreso (mayor a menor)
    return [...courses].sort((a, b) => b.progress - a.progress)[0];
  };
  
  const mostRelevantCourse = getMostRelevantCourse();

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera de bienvenida */}
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
                <div className="space-y-3">
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

      {/* Accesos rápidos */}
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
                  boxShadow: "0 10px 15px -3px rgba(var(--color-primary-700), 0.2), 0 4px 6px -4px rgba(var(--color-primary-700), 0.2)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div 
                  className="rounded-full bg-primary-100 p-3 mr-4 relative"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.svg 
                    className="h-6 w-6 text-primary-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    whileHover={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    {mostRelevantCourse && mostRelevantCourse.progress > 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    )}
                  </motion.svg>
                </motion.div>
                <div className="flex-grow">
                  {mostRelevantCourse && mostRelevantCourse.progress > 0 ? (
                    <>
                      <h3 className="font-medium">Continuar aprendiendo</h3>
                      <p className="text-sm text-primary-600 font-medium">{mostRelevantCourse.title}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                        <div 
                          className="bg-primary-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${mostRelevantCourse.progress}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-medium">Comenzar tu primer curso</h3>
                      <p className="text-sm text-gray-500">Inicia tu camino de aprendizaje</p>
                    </>
                  )}
                </div>
                {/* Badge dinámico */}
                {!mostRelevantCourse || mostRelevantCourse.progress === 0 ? (
                  <motion.div 
                    className="absolute top-3 right-3 bg-accent-500 rounded-full w-3 h-3"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                ) : (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">{Math.round(mostRelevantCourse.progress)}%</span>
                  </div>
                )}
                {/* Highlight en hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </motion.div>
              
              {/* Card 2: Certificaciones con destacado adaptativo */}
              <motion.div 
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center relative overflow-hidden group ${showAchievement ? 'ring-2 ring-accent-500 ring-offset-2' : ''}`}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 15px -3px rgba(var(--color-primary-700), 0.2), 0 4px 6px -4px rgba(var(--color-primary-700), 0.2)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {/* Efecto de glow cuando hay certificados disponibles */}
                {showAchievement && (
                  <motion.div 
                    className="absolute inset-0 bg-accent-500/10 z-0"
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                )}
                <motion.div 
                  className={`rounded-full ${showAchievement ? 'bg-accent-100' : 'bg-primary-100'} p-3 mr-4 relative z-10`}
                  whileHover={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.svg 
                    className={`h-6 w-6 ${showAchievement ? 'text-accent-600' : 'text-primary-600'}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </motion.svg>
                </motion.div>
                <div className="flex-grow relative z-10">
                  <h3 className="font-medium">{showAchievement ? '¡Logro alcanzado!' : 'Certificaciones'}</h3>
                  <p className="text-sm text-gray-500">
                    {showAchievement ? 'Reclamar tu certificado' : 'Gestiona tus certificados'}
                  </p>
                </div>
                {/* Badge pendientes */}
                <div className="absolute top-3 right-3 z-10">
                  {showAchievement ? (
                    <motion.span 
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-accent-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      1
                    </motion.span>
                  ) : (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-700 bg-primary-100 rounded-full">0</span>
                  )}
                </div>
                {/* Highlight en hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </motion.div>
              
              {/* Card 3: Gamificación y nivel de usuario */}
              <motion.div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center relative overflow-hidden group"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 10px 15px -3px rgba(var(--color-primary-700), 0.2), 0 4px 6px -4px rgba(var(--color-primary-700), 0.2)" 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div 
                  className="rounded-full bg-primary-100 p-3 mr-4 flex items-center justify-center relative"
                  whileHover={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Estrella con número de nivel */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {userLevel}
                  </motion.div>
                  <motion.svg 
                    className="h-6 w-6 text-primary-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    animate={{ rotate: [0, currentStreak > 0 ? 360 : 0] }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </motion.svg>
                </motion.div>
                <div className="flex-grow">
                  <h3 className="font-medium">Nivel {userLevel}</h3>
                  <div className="flex items-center space-x-1.5">
                    <p className="text-sm text-gray-500">{experiencePoints} XP</p>
                    <div className="w-full max-w-16 bg-gray-200 h-1 rounded-full">
                      <div className="bg-primary-500 h-1 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-primary-600 font-medium">500 XP</p>
                  </div>
                </div>
                {/* Racha de días */}
                <div className="flex flex-col items-center justify-center">
                  <motion.div 
                    className="flex items-center justify-center h-9 w-9 rounded-full bg-orange-100"
                    animate={currentStreak > 0 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <svg className="h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2c.6 0 1.2.3 1.6.8l1.5 2c.1.1.2.2.4.2h2c1.9 0 3.5 1.6 3.5 3.5 0 .5-.1 1-.3 1.5-.2.6-.1 1.2.3 1.7l1.5 2c1.1 1.5.9 3.7-.5 4.9-.4.3-.9.5-1.4.5-.3 0-.5 0-.8-.1-.6-.2-1.2-.1-1.7.3l-1.5 1.5c-1.1 1.1-2.9 1.1-4 0-.3-.3-.5-.6-.6-1-.2-.6-.6-1-1.2-1.2-.6-.2-1-.6-1.2-1.2-.1-.4-.3-.7-.6-1-1.1-1.1-1.1-2.9 0-4 .3-.3.6-.5 1-.6.6-.2 1-.6 1.2-1.2.2-.6.6-1 1.2-1.2.4-.1.7-.3 1-.6 1.1-1.1 2.9-1.1 4 0 .3.3.5.6.6 1 .2.6.6 1 1.2 1.2.6.2 1 .6 1.2 1.2.1.4.3.7.6 1 .5.5.8 1.2.8 1.9 0 .2-.1.3-.2.4-.1.1-.3.2-.4.2h-13c-.3 0-.5-.1-.7-.3-.2-.2-.3-.4-.3-.7 0-.9.3-1.7.8-2.4.2-.2.3-.5.4-.8.1-.6.5-1 1-1.2.6-.2 1-.6 1.2-1.2.1-.4.3-.7.6-1 .5-.5 1.2-.8 1.9-.8zm0 2c-.3 0-.5.1-.7.3-.3.3-.5.7-.6 1.1-.3.8-1 1.4-1.8 1.6-.2 0-.3.1-.5.2-.4.4-.4 1 0 1.4l1 1c.4.4.4 1.1 0 1.5l-1 1c-.3.3-.3.7 0 .9.1.1.3.2.5.2h9.1c0-.2-.1-.4-.2-.6l-1.3-1.7c-.9-1.2-1-2.9-.3-4.2.1-.1.1-.3.1-.4 0-.3-.2-.5-.5-.5h-1.3c-.8 0-1.5-.4-1.9-1.1l-.9-1.2c-.1-.2-.3-.3-.6-.3z" />
                    </svg>
                  </motion.div>
                  <span className="text-xs font-medium mt-1 text-gray-700">{currentStreak} días</span>
                </div>
                {/* Highlight en hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Continuar aprendiendo */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Continúa aprendiendo</h2>
          <Link to="/platform/courses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todos los cursos
          </Link>
        </div>

        <AnimatePresence>
          {loading ? (
            // Skeleton loading para cursos
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(2)].map((_, i) => (
                <motion.div 
                  key={`skeleton-course-${i}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                >
                  <div className="h-48 bg-gray-100 animate-pulse"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-50 rounded w-1/2 animate-pulse"></div>
                    <div className="h-2 bg-gray-100 rounded w-full mt-2 animate-pulse"></div>
                    <div className="flex justify-between mt-2">
                      <div className="h-4 bg-gray-50 rounded w-1/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-50 rounded w-1/4 animate-pulse"></div>
                    </div>
                  </div>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {courses.length > 0 ? (
                courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 10px 15px -3px rgba(var(--color-primary-700), 0.1), 0 4px 6px -4px rgba(var(--color-primary-700), 0.1)"
                    }}
                  >
                    <CourseCard 
                      id={course.id}
                      title={course.title}
                      image={course.image}
                      progress={course.progress}
                      lessons={course.lessons}
                      completedLessons={course.completedLessons}
                      category={course.category}
                      difficulty={course.difficulty}
                      estimatedTime={course.estimatedTime}
                      lastActivity={course.lastActivity}
                      status={course.status}
                      isNew={course.isNew}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="col-span-2 bg-white rounded-lg p-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.svg 
                    className="h-12 w-12 mx-auto text-gray-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 0.6, type: "spring" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </motion.svg>
                  <motion.h3 
                    className="mt-2 text-lg font-medium text-gray-900"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    No has iniciado ningún curso
                  </motion.h3>
                  <motion.p 
                    className="mt-1 text-gray-500"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    Explora nuestro catálogo de cursos para comenzar.
                  </motion.p>
                  <motion.div 
                    className="mt-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/platform/courses"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                    >
                      Explorar cursos
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Estadísticas generales - ExperienceBar */}
      <AnimatePresence>
        {loading ? (
          <motion.section 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-6"></div>
            
            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* Level skeleton */}
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 bg-gray-100 rounded-full animate-pulse mb-2"></div>
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
              </div>
              
              {/* Progress skeleton */}
              <div className="flex-grow w-full">
                <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mb-3"></div>
                <div className="h-5 w-full bg-gray-100 rounded-full animate-pulse mb-4"></div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={`skeleton-stat-${i}`} className="flex flex-col sm:flex-row sm:items-center p-3 rounded-lg bg-gray-50">
                      <div className="h-5 w-5 bg-gray-100 rounded animate-pulse mb-2 sm:mb-0 sm:mr-3"></div>
                      <div>
                        <div className="h-6 w-10 bg-gray-100 rounded animate-pulse mb-1"></div>
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </motion.section>
        ) : (
          <motion.section 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ExperienceBar
              totalXP={1250}
              currentLevel={5}
              xpForNextLevel={500}
              currentLevelXP={250}
              coursesCompleted={3}
              lessonsCompleted={10}
              certificates={0}
            />
          </motion.section>
        )}
      </AnimatePresence>
      
      {/* Racha de estudio */}
      <AnimatePresence>
        {loading ? (
          <motion.section 
            className="bg-white rounded-lg shadow-md p-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
          </motion.section>
        ) : (
          <motion.section 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StreakTracker
              studyDates={mockStudyDates}
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              weeklyGoal={weeklyGoal}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* ... */}

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
    </div>
  );
};

export default DashboardPage;
