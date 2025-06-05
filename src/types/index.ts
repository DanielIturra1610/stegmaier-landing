// Tipos para proyectos
export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  category: 'dashboard' | 'database' | 'web' | 'app';
  url?: string;
}

// Tipos para servicios
export interface Service {
  id: number;
  title: string;
  description: string;
  icon: JSX.Element;
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
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'tools';
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
