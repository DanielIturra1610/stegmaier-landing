import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import Layout from '../components/layout/Layout';
import PlatformLayout from '../components/layout/PlatformLayout';

// Páginas públicas
import { HomePage } from '../app';
import RegisterPage from '../pages/auth/RegisterPage';
import ResendVerificationPage from '../pages/auth/ResendVerificationPage';
import NotFoundPage from '../pages/NotFoundPage';
import CompanyPage from '../pages/CompanyPage';
import ConsultingPage from '../pages/ConsultingPage';

// Páginas de la plataforma (protegidas)
import DashboardPage from '../pages/platform/DashboardPage';
import CoursesListPage from '../pages/platform/CoursesListPage';
import CourseDetailPage from '../pages/platform/CourseDetailPage';
import ProfilePage from '../pages/platform/ProfilePage';

// Protección de rutas
import ProtectedRoute from './ProtectedRoute';

/**
 * Componente principal de rutas de la aplicación
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rutas públicas con Layout (incluye la landing page) */}
      <Route element={<Layout />}>
        {/* Landing page como ruta principal */}
        <Route path="/" element={<HomePage />} />
        
        {/* Páginas públicas principales */}
        <Route path="/consultorias" element={<ConsultingPage />} />
        <Route path="/empresa" element={<CompanyPage />} />
        
        {/* Rutas de autenticación */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />
        
        {/* Ruta 404 */}
        <Route path="/404" element={<NotFoundPage />} />
      </Route>
      
      {/* Rutas de la plataforma (protegidas) */}
      <Route
        path="/platform"
        element={
          <ProtectedRoute>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard como ruta principal de la plataforma */}
        <Route index element={<DashboardPage />} />
        
        {/* Gestión de cursos */}
        <Route path="courses" element={<CoursesListPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        
        {/* Perfil de usuario */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      
      {/* Redireccionar rutas desconocidas al 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
