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
import CoursesPage from '../pages/platform/CoursesPage';
import CoursesListPage from '../pages/platform/CoursesListPage';
import CourseDetailPage from '../pages/platform/CourseDetailPage';
import CourseViewPage from '../pages/platform/CourseViewPage';
import MyCourses from '../pages/platform/MyCourses';
import ProfilePage from '../pages/platform/ProfilePage';
import SettingsPage from '../pages/platform/SettingsPage';
import CertificatesPage from '../pages/platform/CertificatesPage';
import ProgressPage from '../pages/platform/ProgressPage';
import SupportPage from '../pages/platform/SupportPage';

// Protección de rutas
import ProtectedRoute from './ProtectedRoute';

// Componentes administrativos
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminCourses from '../pages/admin/AdminCourses';
import AdminCourseForm from '../pages/admin/AdminCourseForm';
import AdminLessons from '../pages/admin/AdminLessons';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import MyStats from '../pages/platform/MyStats';
import { useAuth } from '../contexts/AuthContext';

// Componente para redirección condicional
const AdminRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <Navigate to="/platform/courses" replace />;
  }
  
  return <DashboardPage />;
};

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
        {/* Redirección condicional para admins */}
        <Route index element={<AdminRedirect />} />
        
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/list" element={<CoursesListPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="courses/:id/view" element={<CourseViewPage />} />
        <Route path="my-courses" element={<MyCourses />} />
        
        {/* Rutas administrativas (usando mismo layout) */}
        <Route path="users" element={<AdminUsers />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/courses/new" element={<AdminCourseForm />} />
        <Route path="admin/courses/:courseId/edit" element={<AdminCourseForm />} />
        <Route path="admin/courses/:courseId/lessons" element={<AdminLessons />} />
        
        {/* Perfil de usuario */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Configuración */}
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Certificados */}
        <Route path="certificates" element={<CertificatesPage />} />
        
        {/* Progreso */}
        <Route path="progress" element={<ProgressPage />} />
        
        {/* Soporte */}
        <Route path="support" element={<SupportPage />} />
        
        {/* Analytics y Estadísticas */}
        <Route path="admin/analytics" element={<AdminAnalytics />} />
        <Route path="my-stats" element={<MyStats />} />
      </Route>
      
      {/* Las rutas administrativas ahora están integradas en /platform */}
      
      {/* Redireccionar rutas desconocidas al 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
