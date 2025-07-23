/**
 * Types for the StreakTracker component
 */

export interface StreakTrackerProps {
    /** Array of dates when the user studied */
    studyDates: Date[];
    /** Current consecutive days streak */
    currentStreak: number;
    /** Longest streak ever achieved */
    longestStreak: number;
    /** Weekly goal (days per week) */
    weeklyGoal: number;
  }
  
  export interface ActivityData {
    /** Date of the activity */
    date: Date;
    /** Activity level (0-3) */
    level: number;
    /** Minutes studied on that date */
    minutes?: number;
    /** Whether this date is part of current streak */
    isCurrentStreak: boolean;
    /** Whether this date is part of longest streak */
    isLongestStreak: boolean;
    /** Day number in current streak (if applicable) */
    streakDay?: number;
  }
  
  export interface WeekData {
    /** ISO week number */
    weekNumber: number;
    /** Days in this week */
    days: ActivityData[];
    /** Week start date */
    weekStart: Date;
    /** Weekly goal completion percentage */
    completionPercentage: number;
  }
  
  export interface CalendarGridData {
    /** Weeks to display */
    weeks: WeekData[];
    /** First date in the calendar */
    startDate: Date;
    /** Last date in the calendar */
    endDate: Date;
    /** Array of month labels with their positions */
    monthLabels: { label: string; position: number }[];
  }
  
  export enum ActivityLevel {
    NONE = 0,
    LIGHT = 1,
    NORMAL = 2,
    EXCEPTIONAL = 3
  }
  
  export interface TooltipData {
    /** Date to display */
    date: Date;
    /** Activity level */
    level: ActivityLevel;
    /** Minutes studied */
    minutes?: number;
    /** Streak day number (if in streak) */
    streakDay?: number;
    /** Whether this is part of current streak */
    isCurrentStreak: boolean;
    /** Whether this is part of longest streak */
    isLongestStreak: boolean;
    /** Position of tooltip */
    position: { x: number; y: number };
  }
  