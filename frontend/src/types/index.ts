import type { LucideIcon } from "lucide-react";
// Tipos para proyectos
export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  category: "dashboard" | "database" | "web" | "app";
  url?: string;
}

// Tipos para servicios
export interface Service {
  id: number;
  title: string;
  desc: string;
  benefits?: string[]; // Made optional with ?
  timeframe: string;
  icon: LucideIcon;
}

// Tipos para procesos
export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: JSX.Element;
}

// Tipos para tecnologías
export interface TechItem {
  id: number;
  name: string;
  icon: string;
  category: "frontend" | "backend" | "database" | "devops" | "tools";
  level: number; // 1-5 para representar nivel de experiencia
}

// Tipos para testimonios
export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  image?: string;
}

// Tipos para formulario de contacto
export interface ContactForm {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

// Tipos para items de navegación
export interface NavItem {
  name: string;
  href: string;
}

export interface Step {
  id: number;
  title: string;
  desc: string;
  icon: LucideIcon;
}

// ============================================
// Re-export domain types (explicit to avoid conflicts)
// ============================================
export * from './tenant';
export type { CreateUserDTO, UpdateUserDTO, PasswordStrength, validatePasswordRequirements } from './user';
export type { AuthResponse, LoginCredentials, RegisterCredentials, VerifyEmailPayload, ResetPasswordPayload } from './auth';
export type { Course, CourseCreate, CourseDetail, CourseListItem, CourseFilters, Category, CourseStats } from './course';
export type { Lesson, LessonCreate, LessonUpdate, LessonAttachment, ContentType as LessonContentType } from './lesson';
export type { Module, ModuleCreate, ModuleUpdate } from './module';
export type { Quiz, QuizCreate, QuizQuestion, QuizSubmission, QuizResult } from './quiz';
export * from './assignment';
export type {
  CourseProgress,
  LessonProgressRecord,
  ProgressSummaryResponse,
  UserProgressSummaryResponse,
  CourseProgressResponse,
  CourseProgressDetailResponse
} from './progress';
export * from './enrollment';
export * from './notification';
export * from './email';
export * from './review';
