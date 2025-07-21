import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CourseCard from '../../components/courses/CourseCard';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Area } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import ReactConfetti from 'react-confetti';

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
  const [streakDays, setStreakDays] = useState<number>(4);
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
                    animate={{ rotate: [0, streakDays > 0 ? 360 : 0] }}
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
                    animate={streakDays > 0 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <svg className="h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2c.6 0 1.2.3 1.6.8l1.5 2c.1.1.2.2.4.2h2c1.9 0 3.5 1.6 3.5 3.5 0 .5-.1 1-.3 1.5-.2.6-.1 1.2.3 1.7l1.5 2c1.1 1.5.9 3.7-.5 4.9-.4.3-.9.5-1.4.5-.3 0-.5 0-.8-.1-.6-.2-1.2-.1-1.7.3l-1.5 1.5c-1.1 1.1-2.9 1.1-4 0-.3-.3-.5-.6-.6-1-.2-.6-.6-1-1.2-1.2-.6-.2-1-.6-1.2-1.2-.1-.4-.3-.7-.6-1-1.1-1.1-1.1-2.9 0-4 .3-.3.6-.5 1-.6.6-.2 1-.6 1.2-1.2.2-.6.6-1 1.2-1.2.4-.1.7-.3 1-.6 1.1-1.1 2.9-1.1 4 0 .3.3.5.6.6 1 .2.6.6 1 1.2 1.2.6.2 1 .6 1.2 1.2.1.4.3.7.6 1 .5.5.8 1.2.8 1.9 0 .2-.1.3-.2.4-.1.1-.3.2-.4.2h-13c-.3 0-.5-.1-.7-.3-.2-.2-.3-.4-.3-.7 0-.9.3-1.7.8-2.4.2-.2.3-.5.4-.8.1-.6.5-1 1-1.2.6-.2 1-.6 1.2-1.2.1-.4.3-.7.6-1 .5-.5 1.2-.8 1.9-.8zm0 2c-.3 0-.5.1-.7.3-.3.3-.5.7-.6 1.1-.3.8-1 1.4-1.8 1.6-.2 0-.3.1-.5.2-.4.4-.4 1 0 1.4l1 1c.4.4.4 1.1 0 1.5l-1 1c-.3.3-.3.7 0 .9.1.1.3.2.5.2h9.1c0-.2-.1-.4-.2-.6l-1.3-1.7c-.9-1.2-1-2.9-.3-4.2.1-.1.1-.3.1-.4 0-.3-.2-.5-.5-.5h-1.3c-.8 0-1.5-.4-1.9-1.1l-.9-1.2c-.1-.2-.3-.3-.6-.3z" />
                    </svg>
                  </motion.div>
                  <span className="text-xs font-medium mt-1 text-gray-700">{streakDays} días</span>
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

      {/* Estadísticas generales */}
      <AnimatePresence>
        {loading ? (
          <motion.section 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-6"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={`skeleton-stat-${i}`} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-gray-100 rounded animate-pulse mb-1"></div>
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </motion.section>
        ) : (
          <motion.section 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2 
              className="text-xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Tu progreso general
            </motion.h2>
            
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div 
                className="flex flex-col items-center p-4 bg-primary-50 rounded-lg group hover:bg-primary-100 transition-colors duration-300 relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="text-3xl font-bold text-primary-600 mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  3
                </motion.div>
                <div className="text-sm text-gray-500">Cursos inscritos</div>
                {/* Decoración */}
                <motion.div 
                  className="absolute right-2 bottom-2 w-12 h-12 text-primary-200 opacity-30"
                  initial={{ opacity: 0, rotate: -20 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-4 bg-primary-50 rounded-lg group hover:bg-primary-100 transition-colors duration-300 relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="text-3xl font-bold text-primary-600 mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  10
                </motion.div>
                <div className="text-sm text-gray-500">Lecciones completadas</div>
                {/* Decoración */}
                <motion.div 
                  className="absolute right-2 bottom-2 w-12 h-12 text-primary-200 opacity-30"
                  initial={{ opacity: 0, rotate: -20 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-4 bg-primary-50 rounded-lg group hover:bg-primary-100 transition-colors duration-300 relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="text-3xl font-bold text-primary-600 mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  0
                </motion.div>
                <div className="text-sm text-gray-500">Certificados obtenidos</div>
                {/* Decoración */}
                <motion.div 
                  className="absolute right-2 bottom-2 w-12 h-12 text-primary-200 opacity-30"
                  initial={{ opacity: 0, rotate: -20 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </motion.div>
              </motion.div>
            </div>

            {/* Gráficos avanzados */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8">Estadísticas de Aprendizaje</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Gráfico circular de distribución de tiempo por categoría con efectos mejorados */}
              <motion.div 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ boxShadow: '0 0 15px 0 rgba(59, 130, 246, 0.2)' }}
              >
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                  <span>Distribución por categoría</span>
                  <span className="text-xs text-primary-600 font-normal bg-primary-50 px-2 py-1 rounded-full">
                    {chartData.length} categorías
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mb-3">Tiempo invertido por área de conocimiento</p>
                <div className="h-72 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {/* Gradientes radiales para cada categoría */}
                        <radialGradient id="colorPrimary" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="var(--color-primary-400)" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="var(--color-primary-600)" stopOpacity={1}/>
                        </radialGradient>
                        <radialGradient id="colorAccent" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="var(--color-accent-400)" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="var(--color-accent-600)" stopOpacity={1}/>
                        </radialGradient>
                        <radialGradient id="colorGold" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#D97706" stopOpacity={1}/>
                        </radialGradient>
                        <radialGradient id="colorIndigo" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="#818CF8" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={1}/>
                        </radialGradient>
                        <radialGradient id="colorPurple" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="#C084FC" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={1}/>
                        </radialGradient>
                      </defs>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={75}
                        dataKey="value"
                        label={({ name, percent }) => {
                          return (
                            <text 
                              x={name.length > 10 ? -40 : -30} 
                              y={0} 
                              fill="#555" 
                              fontSize={11}
                              textAnchor="start"
                              dominantBaseline="middle"
                            >
                              {`${name}: ${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        animationBegin={200}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {chartData.map((entry, index) => {
                          // Asignar un gradiente según el nombre de la categoría
                          let fillUrl;
                          if (entry.name === 'Estrategia') fillUrl = "url(#colorPrimary)";
                          else if (entry.name === 'Operaciones') fillUrl = "url(#colorAccent)";
                          else if (entry.name === 'Liderazgo') fillUrl = "url(#colorGold)";
                          else if (entry.name === 'Análisis') fillUrl = "url(#colorIndigo)";
                          else if (entry.name === 'Innovación') fillUrl = "url(#colorPurple)";
                          else fillUrl = entry.color;
                          
                          // Determinar si esta categoría merece un badge de especialista
                          const isSpecialist = entry.value >= 30;
                          
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={fillUrl}
                              stroke="#ffffff"
                              strokeWidth={1}
                              className="hover:filter hover:drop-shadow-md transition-all duration-300"
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, name]}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0', 
                          padding: '8px', 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Badges de especialista */}
                  <motion.div 
                    className="absolute top-0 right-0 flex flex-col gap-2"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.6, type: 'spring' }}
                  >
                    {chartData
                      .filter(category => category.value >= 30)
                      .map((category, index) => (
                        <motion.div 
                          key={`badge-${category.name}`}
                          className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full border border-amber-200"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.2 + (index * 0.2) }}
                          whileHover={{ scale: 1.05, boxShadow: '0 0 5px rgba(245, 158, 11, 0.5)' }}
                        >
                          <span className="text-base">🏆</span>
                          <span>Especialista en {category.name}</span>
                        </motion.div>
                      ))
                    }
                  </motion.div>
                </div>
              </motion.div>

              {/* Gráfico de progreso semanal */}
              <motion.div 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ boxShadow: '0 0 15px 0 rgba(59, 130, 246, 0.2)' }}
              >
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex justify-between items-center">
                  <span>Progreso semanal (min)</span>
                  <span className="text-xs font-semibold bg-primary-50 text-primary-600 px-2 py-1 rounded-full">
                    Racha: 
                    <span className="inline-flex items-center ml-1">
                      {streakDays} días
                      <span className={`ml-1 ${streakDays < 7 ? 'text-primary-500' : 
                                           streakDays < 21 ? 'text-accent-500' : 'text-amber-500'}`}>
                        🔥
                      </span>
                    </span>
                  </span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyProgress}>
                      <defs>
                        {/* Gradiente para el área debajo de la línea */}
                        <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0.1}/>
                        </linearGradient>
                        {/* Gradiente para la línea */}
                        <linearGradient id="lineProgress" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--color-primary-600)" />
                          <stop offset="100%" stopColor="var(--color-primary-400)" />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="day" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tick={props => {
                          const { x, y, payload } = props;
                          // Destacar el día actual (jueves en este ejemplo)
                          const isToday = payload.value === 'Jue';
                          return (
                            <g transform={`translate(${x},${y})`}>
                              <text 
                                x={0} 
                                y={0} 
                                dy={16} 
                                textAnchor="middle" 
                                fill={isToday ? "var(--color-primary-600)" : "#94a3b8"}
                                fontWeight={isToday ? "600" : "400"}
                              >
                                {payload.value}
                              </text>
                              {isToday && (
                                <circle cx="0" cy="5" r="2" fill="var(--color-primary-600)" />
                              )}
                            </g>
                          );
                        }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `${value}m`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value} min`, 'Tiempo estudiado']}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0', 
                          padding: '8px', 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        cursor={{ strokeDasharray: '3 3' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="progress"
                        stroke="none"
                        fill="url(#colorProgress)"
                        fillOpacity={1}
                        animationBegin={300}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="progress" 
                        stroke="url(#lineProgress)" 
                        strokeWidth={3}
                        dot={(props) => {
                          // Destacar los días con logros
                          const { cx, cy, payload } = props;
                          const isHighProgress = payload.progress > 40;
                          return (
                            <g>
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={4} 
                                stroke={isHighProgress ? "#F59E0B" : "var(--color-primary-500)"}
                                strokeWidth={2}
                                fill="#fff" 
                              />
                              {isHighProgress && (
                                <motion.g
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ 
                                    delay: 1.5 + (props.index * 0.1),
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 15
                                  }}
                                >
                                  <text 
                                    x={cx} 
                                    y={cy-12} 
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#F59E0B"
                                  >
                                    ⭐
                                  </text>
                                </motion.g>
                              )}
                            </g>
                          );
                        }}
                        activeDot={{ 
                          r: 6, 
                          fill: "var(--color-primary-500)",
                          stroke: "#fff",
                          strokeWidth: 2,
                          className: "filter drop-shadow-md"
                        }}
                        // Animación de dibujo progresivo
                        strokeDasharray="5000"
                        strokeDashoffset="5000"
                        animationBegin={600}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Mensaje motivacional basado en la racha */}
                <motion.div 
                  className="absolute bottom-2 right-2 text-xs text-primary-600 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 1.8 }}
                >
                  {streakDays >= 21 ? '¡Increible constancia!' :
                   streakDays >= 7 ? '¡Buena racha!' :
                   '¡Mantén tu progreso!'}
                </motion.div>
              </motion.div>

              {/* Gráfico de habilidades interactivo con efectos mejorados */}
              <motion.div 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                whileHover={{ boxShadow: '0 0 15px 0 rgba(59, 130, 246, 0.2)' }}
              >
                <h3 className="text-sm font-medium text-gray-700 mb-3">Competencias desarrolladas</h3>
                <p className="text-xs text-gray-500 mb-3">Distribución de tus habilidades adquiridas por área</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {/* Gradientes para cada habilidad */}
                        <linearGradient id="skillColor0" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="skillColor1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="skillColor2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#4F46E5" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="skillColor3" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#D97706" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="skillColor4" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#7C3AED" stopOpacity={1}/>
                        </linearGradient>
                        
                        {/* Filtro de glow para hover */}
                        <filter id="skillGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        strokeWidth={1}
                        stroke="rgba(255,255,255,0.5)"
                        animationBegin={100}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {chartData.map((entry, index) => {
                          const isHighSkill = entry.value > 25;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`url(#skillColor${index % 5})`} 
                              className="transition-all duration-300 hover:filter hover:brightness-110"
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`Nivel: ${value}/100`, name]}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0', 
                          padding: '8px', 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Badges de maestría */}
                <div className="absolute top-12 right-4 flex flex-col gap-2">
                  {chartData
                    .filter(skill => skill.value >= 30)
                    .map((skill, index) => (
                      <motion.div 
                        key={`badge-${index}`}
                        className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r"
                        style={{
                          background: 
                            index === 0 ? 'linear-gradient(90deg, #3B82F6, #2563EB)' : 
                            index === 1 ? 'linear-gradient(90deg, #10B981, #059669)' :
                            'linear-gradient(90deg, #6366F1, #4F46E5)',
                          color: 'white',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                        initial={{ opacity: 0, scale: 0, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{
                          delay: 1.5 + (index * 0.2),
                          type: 'spring',
                          stiffness: 500,
                          damping: 15
                        }}
                      >
                        {skill.name} Master
                      </motion.div>
                    ))
                  }
                </div>
                
                {/* Patrones decorativos */}
                <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full border border-primary-200" />
                  <div className="absolute -left-8 -top-8 w-24 h-24 rounded-full border border-primary-200" />
                </div>
              </motion.div>
              
              {/* Siguiente objetivo (reutilizando el componente anterior pero con mejor estilo) */}
              <motion.div 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                whileHover={{ boxShadow: '0 0 15px 0 rgba(59, 130, 246, 0.2)' }}
              >
                <h3 className="text-sm font-medium text-gray-700 mb-3">Siguiente objetivo</h3>
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="w-24 h-24 relative">
                    <CircularProgressbar
                      value={nextAchievement.progress}
                      text={`${nextAchievement.progress}%`}
                      styles={buildStyles({
                        textSize: '20px',
                        pathColor: `rgba(var(--color-primary-500), ${nextAchievement.progress / 100 + 0.2})`,
                        textColor: 'var(--color-primary-600)',
                        trailColor: '#e2e8f0',
                        backgroundColor: '#3e98c7',
                        pathTransition: 'stroke-dashoffset 0.7s ease-in-out',
                      })}
                    />
                    
                    {/* Efectos decorativos alrededor del progreso circular */}
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-dashed border-primary-200"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center">
                      {nextAchievement.name}
                      <motion.span 
                        className="ml-2 text-xl"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                      >
                        {nextAchievement.icon}
                      </motion.span>
                    </h4>
                    <p className="text-sm text-gray-500">{nextAchievement.description}</p>
                    
                    {/* Barra de progreso con animación */}
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${nextAchievement.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Partículas decorativas */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-primary-200 h-1 w-1"
                      style={{
                        top: `${30 + Math.random() * 40}%`,
                        left: `${60 + Math.random() * 30}%`,
                      }}
                      animate={{ 
                        y: [0, -10, 0],
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Tiempos de estudio por día de semana */}
              <motion.div 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                whileHover={{ boxShadow: '0 0 15px 0 rgba(59, 130, 246, 0.2)' }}
              >
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex justify-between items-center">
                  <span>Tiempo de estudio por día</span>
                  <span className="text-xs text-accent-600 font-semibold bg-accent-50 px-2 py-1 rounded-full">
                    Promedio: {Math.round(weeklyProgress.reduce((acc, cur) => acc + cur.progress, 0) / weeklyProgress.length)} min
                  </span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyProgress} barGap={8}>
                      <defs>
                        {/* Gradiente vertical para las barras */}
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary-400)" />
                          <stop offset="100%" stopColor="var(--color-primary-600)" />
                        </linearGradient>
                        {/* Gradiente para días destacados */}
                        <linearGradient id="barHighlight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent-400)" />
                          <stop offset="100%" stopColor="var(--color-accent-600)" />
                        </linearGradient>
                        {/* Gradiente para días de racha */}
                        <linearGradient id="streakGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="day" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `${value}m`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value} min`, 'Tiempo estudiado']}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0', 
                          padding: '8px', 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                      />
                      <Bar 
                        dataKey="progress" 
                        radius={[6, 6, 0, 0]}
                        animationBegin={100}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {weeklyProgress.map((entry, index) => {
                          // Determinar estilo basado en el valor y la racha
                          let fillUrl = 'url(#barGradient)';
                          let strokeWidth = 0;
                          let borderColor = '';
                          let borderStyle = {};
                          let className = '';
                          
                          // Días con alto rendimiento
                          if (entry.progress > 40) {
                            fillUrl = 'url(#barHighlight)';
                            className = 'filter drop-shadow-sm';
                          }
                          
                          // Días que contribuyen a racha (los últimos días consecutivos)
                          if (['Lun', 'Mar', 'Mie', 'Jue'].includes(entry.day)) {
                            strokeWidth = 1;
                            borderColor = '#F59E0B';
                            borderStyle = { stroke: borderColor, strokeWidth };
                            
                            // Si es el día actual, destacarlo aún más
                            if (entry.day === 'Jue') {
                              fillUrl = 'url(#streakGradient)';
                              className = 'filter drop-shadow-md';
                            }
                          }
                          
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={fillUrl} 
                              {...borderStyle}
                              className={className}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Nota informativa sobre racha en vez de los fueguitos */}
                <motion.div
                  className="absolute bottom-2 left-2 text-xs text-gray-500 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 1.8 }}
                >
                  Los días con borde dorado indican tu racha actual
                </motion.div>
              </motion.div>
            </div>
            
            {/* Borde decorativo animado */}
            <motion.div 
              className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary-600/0 via-primary-600/50 to-primary-600/0"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            
            {/* Botón para simular celebración de logros */}
            <motion.button
              onClick={() => setShowAchievement(true)}
              className="absolute bottom-4 right-4 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Simular celebración de logro"
            >
              Simular logro 🏆
            </motion.button>
          </motion.section>
        )}
      </AnimatePresence>
      
      {/* Próximas actualizaciones */}
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
