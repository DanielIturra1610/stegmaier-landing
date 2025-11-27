import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, ClockIcon, CalendarIcon, ChartBarIcon, DocumentTextIcon, LightBulbIcon, AcademicCapIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import EnrollmentButton from '../enrollment/EnrollmentButton';

type CourseProps = {
  id: number;
  title: string;
  description?: string;
  image?: string;
  progress?: number;
  lessons?: number;
  completedLessons?: number;
  isNew?: boolean;
  category?: string;
  difficulty?: string;
  estimatedTime?: string;
  lastActivity?: string | null;
  status?: string;
  icon?: React.ReactNode;
};

const CourseCard: React.FC<CourseProps> = ({
  id,
  title,
  description = 'Este curso te ayudará a mejorar tus habilidades en consultoría y estrategia empresarial.',
  image,
  progress = 0,
  lessons = 0,
  completedLessons = 0,
  icon,
  isNew = false,
  category = '',
  difficulty = '',
  estimatedTime = '',
  lastActivity = null,
  status = 'No comenzado'
}) => {
  const navigate = useNavigate();
  // Colores para los gradientes si no hay imagen - basados en categoría
  const categoryGradients: Record<string, { gradient: string, icon: React.ReactElement }> = {
    'Estrategia': { 
      gradient: 'from-blue-500 to-blue-800', 
      icon: <PresentationChartLineIcon className="h-20 w-20 text-white/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    },
    'Análisis': { 
      gradient: 'from-indigo-500 to-indigo-800', 
      icon: <ChartBarIcon className="h-20 w-20 text-white/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    },
    'Operaciones': { 
      gradient: 'from-emerald-500 to-emerald-800', 
      icon: <DocumentTextIcon className="h-20 w-20 text-white/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    },
    'Liderazgo': { 
      gradient: 'from-amber-500 to-amber-800', 
      icon: <AcademicCapIcon className="h-20 w-20 text-white/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    },
    'Innovación': { 
      gradient: 'from-purple-500 to-purple-800', 
      icon: <LightBulbIcon className="h-20 w-20 text-white/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    },
  };
  
  // Seleccionar un gradiente y un icono basado en la categoría, o uno predeterminado si no existe
  const defaultGradient = { gradient: 'from-gray-600 to-gray-900', icon: <DocumentTextIcon className="h-20 w-20 text-white/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" /> };
  const categoryStyle = category ? (categoryGradients[category] || defaultGradient) : defaultGradient;
  
  // Status colors
  const statusColors: Record<string, { bg: string, text: string, border?: string }> = {
    'Nuevo': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'En Progreso': { bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-primary-300' },
    'Casi Terminado': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    'Completado': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    'No comenzado': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
  };

  // Calculate if it's "Casi Terminado" (80%+ progress)
  const currentStatus = progress >= 80 && progress < 100 ? 'Casi Terminado' : 
                       progress >= 100 ? 'Completado' : 
                       progress > 0 ? 'En Progreso' : 
                       isNew ? 'Nuevo' : status;
  
  const statusStyle = statusColors[currentStatus] || statusColors['No comenzado'];

  // Format last activity date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Calculate if the course is active (touched in the last 7 days)
  const isActive = lastActivity ? (new Date().getTime() - new Date(lastActivity).getTime()) / (1000 * 3600 * 24) < 7 : false;
  
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
    <Card className="overflow-hidden flex flex-col relative group h-full border-none shadow-lg">
      {/* Status indicator */}
      <div className="absolute top-0 left-0 bottom-0 w-1.5 z-10"
        style={{ backgroundColor: statusStyle.text.replace('text-', 'var(--color-') + ')' }}
      ></div>

      <div className="relative h-44 overflow-hidden group">
        {/* Image or gradient background with category icon */}
        {image && !image.includes('placeholder.com') ? (
          <img 
            src={image} 
            alt={title} 
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500" 
            onError={(e) => {
              // Si la imagen falla, elimina la fuente para que se muestre el respaldo
              e.currentTarget.src = '';
              e.currentTarget.onerror = null;
            }}
          />
        ) : (
          <div className={`bg-gradient-to-br ${categoryStyle.gradient} w-full h-full relative overflow-hidden`}>
            {/* Pattern overlay for more visual interest */}
            <div className="absolute inset-0 opacity-10" style={{ 
              backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
              backgroundSize: '100px 100px' 
            }}></div>
            
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5"></div>
            <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-white/5"></div>
            
            {/* Category icon */}
            {categoryStyle.icon}
          </div>
        )}
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity"></div>
        
        {/* Badges container */}
        <div className="absolute top-3 left-3 flex space-x-2 z-10">
          {category && (
            <Badge variant="secondary" className="bg-white/70 backdrop-blur-sm text-gray-800 group-hover:bg-white transition-colors duration-300">
              {category}
            </Badge>
          )}
          {difficulty && (
            <Badge variant="secondary" className="bg-white/70 backdrop-blur-sm text-gray-800 group-hover:bg-white transition-colors duration-300">
              {difficulty}
            </Badge>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border ? `border ${statusStyle.border}` : ''}`}>
            {currentStatus}
          </Badge>
        </div>

        {/* Circular progress in bottom-right corner */}
        {progress > 0 && (
          <div className="absolute bottom-3 right-3 h-12 w-12 z-10">
            <CircularProgressbar 
              value={progress} 
              text={`${progress}%`}
              styles={buildStyles({
                textSize: '28px',
                textColor: '#fff',
                pathColor: '#fff',
                trailColor: 'rgba(255,255,255,0.3)',
              })} 
            />
          </div>
        )}

        {/* Title on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      </div>

      <CardContent className="p-5 flex-grow">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

        {/* Course info section */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {/* Estimated time */}
          {estimatedTime && (
            <div className="flex items-center">
              <ClockIcon className="h-3.5 w-3.5 mr-1" />
              <span>{estimatedTime}</span>
            </div>
          )}

          {/* Last activity date */}
          {lastActivity && (
            <div className="flex items-center">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span className={isActive ? 'text-primary font-medium' : ''}>Última actividad: {formatDate(lastActivity)}</span>
            </div>
          )}

          {/* Lessons counter */}
          {lessons > 0 && (
            <div className="flex items-center">
              <span>{completedLessons} de {lessons} lecciones</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Progress bar */}
      {lessons > 0 && progress > 0 && (
        <div className="px-5">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-1.5 rounded-full`}
              style={{ 
                backgroundColor: statusStyle.text.replace('text-', 'var(--color-') + ')', 
                filter: 'brightness(1.1)' 
              }}
            ></motion.div>
          </div>
        </div>
      )}

      <CardFooter className="p-5 pt-4">
        <EnrollmentButton
          courseId={id.toString()}
          courseName={title}
          onNavigateToCourse={(courseId) => {
            navigate(`/platform/courses/${courseId}`);
          }}
          className="w-full"
        />
      </CardFooter>
    </Card>
    </motion.div>
  );
};

export default CourseCard;
