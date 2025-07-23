/**
 * Utility functions for the StreakTracker component
 */

import { ActivityLevel, ActivityData, WeekData, CalendarGridData } from './types';
import { MONTH_LABELS, STREAK_EMOJIS } from './constants';

/**
 * Formats a date to display in tooltip (e.g. "15 Marzo")
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

/**
 * Determines the activity level (0-3) based on minutes studied
 * @param date Date to check
 * @param studyDates Array of dates with study activity
 * @returns Activity level (0-3)
 */
export const getActivityLevel = (date: Date, studyDates: Date[]): ActivityLevel => {
  const dateString = date.toDateString();
  const matchingDates = studyDates.filter(d => d.toDateString() === dateString);
  
  if (matchingDates.length === 0) return ActivityLevel.NONE;
  
  // Simulate minutes based on number of matching dates
  // In a real app, this would come from actual study time data
  const simulatedMinutes = matchingDates.length * 15;
  
  if (simulatedMinutes > 60) return ActivityLevel.EXCEPTIONAL;
  if (simulatedMinutes > 30) return ActivityLevel.NORMAL;
  return ActivityLevel.LIGHT;
};

/**
 * Get minutes studied on a specific date
 * @param date Date to check
 * @param studyDates Array of dates with study activity
 * @returns Minutes studied or undefined
 */
export const getMinutesStudied = (date: Date, studyDates: Date[]): number | undefined => {
  const dateString = date.toDateString();
  const matchingDates = studyDates.filter(d => d.toDateString() === dateString);
  
  if (matchingDates.length === 0) return undefined;
  
  // Simulate minutes based on number of matching dates
  return matchingDates.length * 15;
};

/**
 * Determines if a date is part of the current streak
 * @param date Date to check
 * @param currentStreakDates Array of dates in current streak
 * @returns Whether date is in current streak and its position
 */
export const calculateStreakStatus = (date: Date, 
  studyDates: Date[], 
  currentStreak: number): { isStreak: boolean; day?: number } => {
  
  if (currentStreak === 0) return { isStreak: false };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  
  // Calculate the start of current streak
  const streakStartDate = new Date(today);
  streakStartDate.setDate(today.getDate() - currentStreak + 1);
  
  // Check if date is within streak range
  if (dateToCheck >= streakStartDate && dateToCheck <= today) {
    // Check if we actually studied on this date
    const wasActive = studyDates.some(d => {
      const studyDate = new Date(d);
      studyDate.setHours(0, 0, 0, 0);
      return studyDate.getTime() === dateToCheck.getTime();
    });
    
    if (wasActive) {
      const dayDiff = Math.floor((dateToCheck.getTime() - streakStartDate.getTime()) / (24 * 60 * 60 * 1000));
      return { isStreak: true, day: dayDiff + 1 };
    }
  }
  
  return { isStreak: false };
};

/**
 * Returns appropriate emoji for streak based on streak length
 * @param streakLength Length of the streak
 * @returns Emoji string
 */
export const getStreakEmoji = (streakLength: number): string => {
  if (streakLength >= 30) return STREAK_EMOJIS.high;
  if (streakLength >= 7) return STREAK_EMOJIS.medium;
  if (streakLength >= 3) return STREAK_EMOJIS.low;
  return '';
};

/**
 * Calculate weekly goal completion percentage
 * @param weekDays Array of activity data for a week
 * @param weeklyGoal Weekly goal (days)
 * @returns Percentage of completion (0-100)
 */
export const calculateWeeklyCompletion = (weekDays: ActivityData[], weeklyGoal: number): number => {
  const activeDays = weekDays.filter(day => day.level > ActivityLevel.NONE).length;
  return Math.min(Math.round((activeDays / weeklyGoal) * 100), 100);
};

/**
 * Generate an array of dates for the calendar grid (Enero - Diciembre del año actual)
 * @param studyDates Array of dates with study activity
 * @param currentStreak Current streak length
 * @param longestStreak Longest streak ever achieved
 * @param weeklyGoal Weekly goal (days per week)
 * @returns Calendar grid data
 */
export const generateCalendarGrid = (
  studyDates: Date[],
  currentStreak: number,
  longestStreak: number,
  weeklyGoal: number
): CalendarGridData => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Empezar desde enero del año actual
  const currentYear = today.getFullYear();
  const yearStart = new Date(currentYear, 0, 1); // 1 de enero del año actual
  const yearEnd = new Date(currentYear, 11, 31); // 31 de diciembre del año actual
  
  // Encontrar el domingo anterior al 1 de enero para comenzar la grilla
  const gridStartDate = new Date(yearStart);
  const dayOfWeek = gridStartDate.getDay();
  gridStartDate.setDate(gridStartDate.getDate() - dayOfWeek);
  
  // Encontrar el sábado posterior al 31 de diciembre para terminar la grilla
  const gridEndDate = new Date(yearEnd);
  const endDayOfWeek = gridEndDate.getDay();
  gridEndDate.setDate(gridEndDate.getDate() + (6 - endDayOfWeek));
  
  const weeks: WeekData[] = [];
  let monthLabels: { label: string; position: number }[] = [];
  let weekIndex = 0;
  
  let currentDate = new Date(gridStartDate);
  let lastMonth = -1;
  
  // Generar semanas desde enero hasta diciembre completos
  while (currentDate <= gridEndDate) {
    const weekDays: ActivityData[] = [];
    const weekStartDate = new Date(currentDate);
    
    // Generar 7 días para esta semana
    for (let i = 0; i < 7; i++) {
      // Agregar etiqueta de mes si es el primer domingo de cada mes O si es la primera semana del mes
      if (currentDate.getFullYear() === currentYear) { // Solo para el año actual
        if (currentDate.getDate() <= 7 && currentDate.getDay() === 0 && currentDate.getMonth() !== lastMonth) {
          monthLabels.push({
            label: MONTH_LABELS[currentDate.getMonth()],
            position: weekIndex
          });
          lastMonth = currentDate.getMonth();
        }
      }
      
      // Solo calcular actividad para fechas del año actual y hasta hoy
      let level = ActivityLevel.NONE;
      let minutes: number | undefined = undefined;
      let streakStatus: { isStreak: boolean; day?: number } = { isStreak: false };
      
      if (currentDate.getFullYear() === currentYear && currentDate <= today) {
        level = getActivityLevel(currentDate, studyDates);
        minutes = getMinutesStudied(currentDate, studyDates);
        streakStatus = calculateStreakStatus(currentDate, studyDates, currentStreak);
      }
      
      weekDays.push({
        date: new Date(currentDate),
        level,
        minutes,
        isCurrentStreak: streakStatus.isStreak,
        isLongestStreak: false,
        streakDay: streakStatus.day
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const weekCompletion = calculateWeeklyCompletion(weekDays, weeklyGoal);
    
    weeks.push({
      weekNumber: weekIndex++,
      days: weekDays,
      weekStart: new Date(weekStartDate),
      completionPercentage: weekCompletion
    });
  }
  
  return {
    weeks,
    startDate: yearStart,
    endDate: yearEnd,
    monthLabels
  };
};

/**
 * Format a date range as a string
 * @param startDate Start date
 * @param endDate End date
 * @returns Formatted date range
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};