import React from 'react';
import PlatformLayout from '../components/layout/PlatformLayout';
import Layout from '../components/layout/Layout';
import { Routes, Route, Navigate } from 'react-router-dom';

// Páginas públicas
import { HomePage } from '../app';
import RegisterPage from '../pages/auth/RegisterPage';
import ResendVerificationPage from '../pages/auth/ResendVerificationPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import TenantSelectionPage from '../pages/auth/TenantSelectionPage';
import RoleSelectionPage from '../pages/auth/RoleSelectionPage';
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

// Demo pages (solo en desarrollo)
import InteractiveLessonDemo from '../pages/demo/InteractiveLessonDemo';

// Helper simple para detectar producción
const isProduction = () => {
  return (import.meta as any).env.PROD || 
         (import.meta as any).env.VITE_ENVIRONMENT === 'production';
};

// Protección de rutas
import ProtectedRoute from './ProtectedRoute';

// Componentes administrativos
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminCourseForm from '../pages/admin/AdminCourseForm';
import AdminLessons from '../pages/admin/AdminLessons';
import AdminModules from '../pages/admin/AdminModules';
import AdminModuleLessons from '../pages/admin/AdminModuleLessons';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminQuizzes from '../pages/admin/AdminQuizzes';
import AdminQuizForm from '../pages/admin/AdminQuizForm';
import AdminAssignments from '../pages/admin/AdminAssignments';
import AdminAssignmentGrading from '../pages/admin/AdminAssignmentGrading';
import CoursePreviewPage from '../pages/admin/CoursePreviewPage';
import VideoPreviewPage from '../pages/admin/VideoPreviewPage';
import QuizAnalyticsPage from '../pages/admin/QuizAnalyticsPage';
import SystemMonitoringDashboard from '../components/admin/SystemMonitoringDashboard';
import TenantManagement from '../pages/admin/TenantManagement';
import TenantDetails from '../pages/admin/TenantDetails';
import UserCreation from '../pages/admin/UserCreation';
import UserEdit from '../pages/admin/UserEdit';
import { useAuth } from '../contexts/AuthContext';

// Componente para redirección condicional con validación robusta
const AdminRedirect: React.FC = () => {
  const { user } = useAuth();

  // Logging para debugging (TEMPORAL - remover después de resolver)
  console.log('🔍 [AdminRedirect] Evaluando redirección:', {
    userId: user?.id,
    userRole: user?.role,
    userEmail: user?.email,
    isAuthenticated: !!user
  });

  // Validación explícita: solo admin e instructor van a courses
  if (user && (user.role === 'admin' || user.role === 'instructor')) {
    console.log('➡️ [AdminRedirect] Admin/Instructor detectado → Redirigiendo a /platform/courses');
    return <Navigate to="/platform/courses" replace />;
  }

  // Todos los demás usuarios (incluidos estudiantes) van a Mi Progreso
  console.log('➡️ [AdminRedirect] Usuario regular detectado → Mostrando MyProgressPage');
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
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Ruta 404 */}
        <Route path="/404" element={<NotFoundPage />} />
      </Route>

      {/* Ruta de selección de rol (protegida, sin layout/navbar) */}
      <Route
        path="/auth/role-selection"
        element={
          <ProtectedRoute>
            <RoleSelectionPage />
          </ProtectedRoute>
        }
      />

      {/* Ruta de selección de tenant (protegida, sin layout) */}
      <Route
        path="/select-tenant"
        element={
          <ProtectedRoute>
            <TenantSelectionPage />
          </ProtectedRoute>
        }
      />

      {/* Rutas de la plataforma (protegidas) */}
      <Route
        path="/platform"
        element={
          <ProtectedRoute>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard principal - redirige según rol */}
        <Route index element={<AdminRedirect />} />
        
        {/* Ruta directa y explícita para Mi Progreso (estudiantes) */}
        <Route 
          path="my-progress" 
          element={
            <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
              <MyProgressPage />
            </ProtectedRoute>
          } 
        />
        
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/list" element={<CoursesListPage />} />
        <Route path="courses/:courseId" element={<CourseDetailPage />} />
        <Route path="courses/:courseId/view" element={<CourseViewPage />} />
        <Route path="my-courses" element={<MyCourses />} />
        
        {/* Rutas administrativas (usando mismo layout) */}
        <Route path="users" element={<AdminUsers />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />

        {/* Gestión de Tenants (solo superadmin) */}
        <Route
          path="admin/tenants"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <TenantManagement />
            </ProtectedRoute>
          }
        />

        {/* Detalles de Tenant (solo superadmin) */}
        <Route
          path="admin/tenants/:tenantId"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <TenantDetails />
            </ProtectedRoute>
          }
        />

        {/* Creación de Usuarios (admin e instructor) */}
        <Route
          path="admin/users/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'instructor', 'superadmin']}>
              <UserCreation />
            </ProtectedRoute>
          }
        />

        {/* Edición de Usuarios (admin y superadmin) */}
        <Route
          path="admin/users/:userId/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <UserEdit />
            </ProtectedRoute>
          }
        />
        <Route path="admin/courses/new" element={<AdminCourseForm />} />
        <Route path="admin/courses/:courseId/edit" element={<AdminCourseForm />} />
        <Route path="admin/courses/:courseId/lessons" element={<AdminLessons />} />
        <Route path="admin/courses/:courseId/modules" element={<AdminModules />} />
        <Route path="admin/courses/:courseId/modules/:moduleId/lessons" element={<AdminModuleLessons />} />
        <Route path="admin/courses/:courseId/preview" element={<CoursePreviewPage />} />
        <Route path="admin/videos/:videoId/preview" element={<VideoPreviewPage />} />
        <Route path="admin/courses/:courseId/assignments" element={<AdminAssignments />} />
        <Route path="admin/assignments/:assignmentId/grading" element={<AdminAssignmentGrading />} />
        <Route path="admin/quizzes" element={<AdminQuizzes />} />
        <Route path="admin/quizzes/new" element={<AdminQuizForm />} />
        <Route path="admin/quizzes/:quizId/edit" element={<AdminQuizForm />} />
        <Route path="admin/quizzes/:quizId/analytics" element={<QuizAnalyticsPage />} />

        {/* Rutas de instructor (apuntan a los mismos componentes que admin) */}
        <Route path="instructor/dashboard" element={<AdminDashboard />} />
        <Route path="instructor/courses/new" element={<AdminCourseForm />} />
        <Route path="instructor/courses/:courseId/edit" element={<AdminCourseForm />} />
        <Route path="instructor/courses/:courseId/lessons" element={<AdminLessons />} />
        <Route path="instructor/courses/:courseId/modules" element={<AdminModules />} />
        <Route path="instructor/courses/:courseId/modules/:moduleId/lessons" element={<AdminModuleLessons />} />
        <Route path="instructor/courses/:courseId/preview" element={<CoursePreviewPage />} />
        <Route path="instructor/videos/:videoId/preview" element={<VideoPreviewPage />} />
        <Route path="instructor/courses/:courseId/assignments" element={<AdminAssignments />} />
        <Route path="instructor/assignments/:assignmentId/grading" element={<AdminAssignmentGrading />} />
        <Route path="instructor/quizzes" element={<AdminQuizzes />} />
        <Route path="instructor/quizzes/new" element={<AdminQuizForm />} />
        <Route path="instructor/quizzes/:quizId/edit" element={<AdminQuizForm />} />
        <Route path="instructor/quizzes/:quizId/analytics" element={<QuizAnalyticsPage />} />
        
        {/* Perfil de usuario */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Configuración */}
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Certificados */}
        <Route path="certificates" element={<CertificatesPage />} />
        
        {/* Progreso - mantener solo ProgressPage para compatibilidad */}
        <Route path="progress" element={<ProgressPage />} />
        
        {/* Soporte */}
        <Route path="support" element={<SupportPage />} />
        
        {/* Analytics y Estadísticas */}
        <Route path="admin/analytics" element={<AdminAnalytics />} />
        
        {/* Monitoreo del Sistema */}
        <Route path="admin/monitoring" element={<SystemMonitoringDashboard />} />
        
        {/* Ruta para tomar un quiz */}
        <Route path="quiz/take/:quizId" element={<QuizTakePage />} />
        
        {/* Demo de lecciones interactivas - Solo en desarrollo */}
        {!isProduction() && (
          <Route path="demo/interactive-lessons" element={<InteractiveLessonDemo />} />
        )}
      </Route>
      
      {/* Las rutas administrativas ahora están integradas en /platform */}
      
      {/* Redireccionar rutas desconocidas al 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
