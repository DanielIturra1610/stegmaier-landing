import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, Target } from 'lucide-react';
import {
  StreakTrackerProps,
  TooltipData,
  ActivityLevel,
  ActivityData
} from './types';
import {
  generateCalendarGrid,
  formatDate,
  formatDateRange,
  getStreakEmoji
} from './utils';
import {
  DAY_LABELS,
  ACTIVITY_COLORS,
  ANIMATION_VARIANTS
} from './constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * StreakTracker component displays a visual calendar of study activity (GitHub style)
 */
const StreakTracker: React.FC<StreakTrackerProps> = ({
  studyDates,
  currentStreak,
  longestStreak,
  weeklyGoal
}) => {
  // State for tooltip display
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  
  // Generate calendar grid data for full 12 months
  const calendarData = useMemo(() => {
    return generateCalendarGrid(studyDates, currentStreak, longestStreak, weeklyGoal);
  }, [studyDates, currentStreak, longestStreak, weeklyGoal]);
  
  // Calculate weekly goal progress
  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    
    // Adjust to get the start of week (Sunday)
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Filter study dates for current week
    const weekStudyDates = (Array.isArray(studyDates) ? studyDates : []).filter(date => {
      return date >= startOfWeek && date <= today;
    });
    
    // Calculate percentage
    return Math.min((weekStudyDates.length / weeklyGoal) * 100, 100);
  }, [studyDates, weeklyGoal]);
  
  // Handle mouse events for tooltips
  const handleShowTooltip = useCallback((day: ActivityData, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      date: day.date,
      level: day.level,
      minutes: day.minutes,
      streakDay: day.streakDay,
      isCurrentStreak: day.isCurrentStreak,
      isLongestStreak: day.isLongestStreak,
      position: { 
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 10
      }
    });
  }, []);
  
  const handleHideTooltip = useCallback(() => {
    setTooltipData(null);
  }, []);
  
  // Render streak status pill with emoji using shadcn Badge
  const renderStreakStatus = (streak: number, isLongest = false) => {
    const emoji = getStreakEmoji(streak);
    const animationVariant = streak >= 7 && !isLongest ? 'animate' : 'initial';

    return (
      <motion.div
        variants={ANIMATION_VARIANTS.pulse}
        initial="initial"
        animate={animationVariant}
        transition={ANIMATION_VARIANTS.pulseTransition}
      >
        <Badge
          variant={streak > 0 ? "default" : "secondary"}
          className={`flex items-center gap-2 px-3 py-2 ${
            streak > 0 ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''
          }`}
        >
          {streak >= 7 && <Flame className="w-4 h-4 text-orange-500" />}
          {emoji && <span className="text-lg">{emoji}</span>}
          <span className="font-semibold text-sm">
            {streak} {isLongest ? 'días (récord)' : 'días'}
          </span>
        </Badge>
      </motion.div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Racha de estudio
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {formatDateRange(calendarData.startDate, calendarData.endDate)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current streak */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Racha actual</span>
            {renderStreakStatus(currentStreak)}
          </div>

          {/* Longest streak */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Mejor racha</span>
            {renderStreakStatus(longestStreak, true)}
          </div>

          {/* Weekly goal */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Target className="w-4 h-4" />
                Meta semanal
              </span>
              <span className="text-sm font-medium">{Math.floor(weeklyProgress)}%</span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
          </div>
        </div>

        <Separator />
        
        {/* Calendar grid - GitHub style improved */}
        <div className="w-full overflow-x-auto pb-4">
          <div className="min-w-max">
            {/* Month labels - Distributed across full width */}
            <div className="flex pl-6 mb-2 h-4 relative w-full">
              {calendarData.monthLabels.map((month, index, array) => {
                // Calcular la posición como porcentaje del ancho total
                const totalMonths = array.length;
                // Añadir margen del 5% en cada extremo
                const marginPercentage = 5;
                // Distribuir los meses en el 90% del espacio disponible (100% - 2*5%)
                const availablePercentage = 100 - (marginPercentage * 2);
                // El primer mes estará en 5%, el último en 95%
                const percentage = marginPercentage + (index / (totalMonths - 1)) * availablePercentage;
                
                return (
                  <span 
                    key={`month-${index}`}
                    className="text-xs font-medium text-gray-700 absolute"
                    style={{ 
                      left: `${percentage}%`,
                      transform: "translateX(-50%)", // Centra el texto en su posición
                      backgroundColor: 'white',
                      padding: '0 2px',
                      zIndex: 10
                    }}
                  >
                    {month.label}
                  </span>
                );
              })}
            </div>
            
            <div className="flex">
              {/* Day labels - Show every other day to avoid crowding */}
              <div className="flex flex-col justify-between pr-2 h-[91px]">
                {DAY_LABELS.map((day, i) => (
                  <span key={day} className="text-xs text-gray-500 h-3 flex items-center">
                    {i % 2 === 1 ? day : ''}
                  </span>
                ))}
              </div>
              
              {/* Calendar cells - Horizontal layout */}
              <div className="flex-1">
                <motion.div 
                  className="grid grid-rows-7 grid-flow-col gap-[2px]"
                  variants={ANIMATION_VARIANTS.container}
                  initial="hidden"
                  animate="show"
                >
                  {calendarData.weeks.map((week) => (
                    week.days.map((day, dayIndex) => {
                      const isToday = day.date.toDateString() === new Date().toDateString();
                      const isStreak = day.isCurrentStreak;
                      
                      // Determine cell styling based on activity level and streak status
                      let cellBgColor = ACTIVITY_COLORS[day.level];
                      if (isStreak) {
                        cellBgColor = ACTIVITY_COLORS.STREAK;
                      }
                      
                      return (
                        <motion.div
                          key={`${week.weekNumber}-${dayIndex}`}
                          variants={ANIMATION_VARIANTS.item}
                          className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-150 hover:shadow-md hover:z-10 relative ${
                            isToday ? 'ring-1 ring-gray-400 ring-offset-1' : ''
                          }`}
                          style={{ backgroundColor: cellBgColor }}
                          onMouseEnter={(e) => handleShowTooltip(day, e)}
                          onMouseLeave={handleHideTooltip}
                          role="button"
                          aria-label={`${formatDate(day.date)}, nivel de actividad: ${day.level}`}
                          tabIndex={0}
                        />
                      );
                    })
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend - Improved GitHub style */}
        <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-gray-600">
          <span>Menos</span>
          
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{backgroundColor: ACTIVITY_COLORS[ActivityLevel.NONE]}} />
            <div className="w-3 h-3 rounded-sm" style={{backgroundColor: ACTIVITY_COLORS[ActivityLevel.LIGHT]}} />
            <div className="w-3 h-3 rounded-sm" style={{backgroundColor: ACTIVITY_COLORS[ActivityLevel.NORMAL]}} />
            <div className="w-3 h-3 rounded-sm" style={{backgroundColor: ACTIVITY_COLORS[ActivityLevel.EXCEPTIONAL]}} />
            <div className="w-3 h-3 rounded-sm" style={{backgroundColor: ACTIVITY_COLORS.STREAK}} />
          </div>
          
          <span>Más</span>
          
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{backgroundColor: ACTIVITY_COLORS.STREAK}} />
              <span>Racha actual</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Tooltip - Improved styling */}
      <AnimatePresence>
        {tooltipData && (
          <motion.div
            className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: tooltipData.position.x,
              top: tooltipData.position.y,
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={ANIMATION_VARIANTS.tooltip}
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">{formatDate(tooltipData.date)}</span>
              <span className="text-gray-300">
                {tooltipData.minutes ? `${tooltipData.minutes} minutos` : 'Sin actividad'}
              </span>
              {tooltipData.isCurrentStreak && tooltipData.streakDay && (
                <span className="text-amber-300 font-medium">
                  Día {tooltipData.streakDay} de racha {getStreakEmoji(tooltipData.streakDay)}
                </span>
              )}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default React.memo(StreakTracker);