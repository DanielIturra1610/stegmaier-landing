import React from 'react';
import PlatformLayout from '../components/layout/PlatformLayout';
import Layout from '../components/layout/Layout';
import { Routes, Route, Navigate } from 'react-router-dom';

// Páginas públicas
import { HomePage } from '../app';
import RegisterPage from '../pages/auth/RegisterPage';
import ResendVerificationPage from '../pages/auth/ResendVerificationPage';
import NotFoundPage from '../pages/NotFoundPage';
import CompanyPage from '../pages/CompanyPage';
import ConsultingPage from '../pages/ConsultingPage';

// Páginas de la plataforma (protegidas)
import CoursesPage from '../pages/platform/CoursesPage';
import CoursesListPage from '../pages/platform/CoursesListPage';
import CourseDetailPage from '../pages/platform/CourseDetailPage';
import CourseViewPage from '../pages/platform/CourseViewPage';
import MyCourses from '../pages/platform/MyCourses';
import ProfilePage from '../pages/platform/ProfilePage';
import SettingsPage from '../pages/platform/SettingsPage';
import CertificatesPage from '../pages/platform/CertificatesPage';
import ProgressPage from '../pages/platform/ProgressPage';
import MyProgressPage from '../pages/platform/MyProgressPage';
import SupportPage from '../pages/platform/SupportPage';
import QuizTakePage from '../pages/platform/QuizTakePage';

// Protección de rutas
import ProtectedRoute from './ProtectedRoute';

// Componentes administrativos
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminCourseForm from '../pages/admin/AdminCourseForm';
import AdminLessons from '../pages/admin/AdminLessons';
import AdminModules from '../pages/admin/AdminModules';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminQuizzes from '../pages/admin/AdminQuizzes';
import AdminQuizForm from '../pages/admin/AdminQuizForm';
import AdminAssignmentGrading from '../pages/admin/AdminAssignmentGrading';
import SystemMonitoringDashboard from '../components/admin/SystemMonitoringDashboard';
import { useAuth } from '../contexts/AuthContext';

// Componente para redirección condicional
const AdminRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <Navigate to="/platform/courses" replace />;
  }
  
  return <MyProgressPage />;
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
        <Route path="courses/:courseId" element={<CourseDetailPage />} />
        <Route path="courses/:courseId/view" element={<CourseViewPage />} />
        <Route path="my-courses" element={<MyCourses />} />
        
        {/* Rutas administrativas (usando mismo layout) */}
        <Route path="users" element={<AdminUsers />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/courses/new" element={<AdminCourseForm />} />
        <Route path="admin/courses/:courseId/edit" element={<AdminCourseForm />} />
        <Route path="admin/courses/:courseId/lessons" element={<AdminLessons />} />
        <Route path="admin/courses/:courseId/modules" element={<AdminModules />} />
        <Route path="admin/assignments/:assignmentId/grading" element={<AdminAssignmentGrading />} />
        <Route path="admin/quizzes" element={<AdminQuizzes />} />
        <Route path="admin/quizzes/new" element={<AdminQuizForm />} />
        <Route path="admin/quizzes/:quizId/edit" element={<AdminQuizForm />} />
        
        {/* Perfil de usuario */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Configuración */}
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Certificados */}
        <Route path="certificates" element={<CertificatesPage />} />
        
        {/* Progreso */}
        <Route path="progress" element={<ProgressPage />} />
        <Route path="my-progress" element={<MyProgressPage />} />
        
        {/* Soporte */}
        <Route path="support" element={<SupportPage />} />
        
        {/* Analytics y Estadísticas */}
        <Route path="admin/analytics" element={<AdminAnalytics />} />
        
        {/* Monitoreo del Sistema */}
        <Route path="admin/monitoring" element={<SystemMonitoringDashboard />} />
        
        {/* Ruta para tomar un quiz */}
        <Route path="quiz/take/:quizId" element={<QuizTakePage />} />
      </Route>
      
      {/* Las rutas administrativas ahora están integradas en /platform */}
      
      {/* Redireccionar rutas desconocidas al 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
