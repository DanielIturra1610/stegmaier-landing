/**
 * Tipos estrictos para el sistema de headers contextuales
 * Siguiendo principios de desarrollo responsivo, mantenible y escalable
 */
import { ReactNode } from 'react';

export type HeaderVariant = 'minimal' | 'standard' | 'analytics' | 'courseDetail' | 'courseViewer' | 'admin';

export interface HeaderStat { 
  label: string; 
  value: string | number; 
  hint?: string; 
  icon?: ReactNode;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
}

export interface HeaderTab { 
  label: string; 
  to: string; 
  active?: boolean;
  ariaControls?: string;
}

export interface Crumb { 
  label: string | ((data: any) => string); 
  to?: string; 
}

export type HeaderTheme = 'brand' | 'dark' | 'neutral' | 'light';
export type HeaderRequirement = 'auth' | 'admin' | 'enrolled';

export interface HeaderConfig {
  variant: HeaderVariant;
  title?: string | ((data: any) => string);
  breadcrumbs?: Crumb[];
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showSearch?: boolean;
  actions?: ReactNode[];
  tabs?: HeaderTab[];
  stats?: HeaderStat[];
  theme?: HeaderTheme;
  requires?: HeaderRequirement[];
}

export interface HeaderData {
  completionRate?: number;
  totalWatchTimeFormatted?: string;
  streakDays?: number;
  loading?: boolean;
  error?: string | null;
}

export interface HeaderContextValue {
  config: HeaderConfig | null;
  data: HeaderData;
  period: string;
  setPeriod: (period: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
}
