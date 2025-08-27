import { BrowserRouter as Router } from 'react-router-dom';
import Hero from './components/sections/home/Hero';
import Services from './components/sections/home/Services';
import Process from './components/sections/home/Process';
import Testimonials from './components/sections/home/Testimonials';
import Contact from './components/sections/home/Contact';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppRoutes from './routes';

// Componente para la página de inicio que contiene todas las secciones
const HomePage = () => (
  <>
    <Hero />
    <Services />
    <Process />
    <Testimonials />
    <Contact />
  </>
);

// App principal con rutas
const App = () => {
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('🚨 [App] Critical application error:', error);
      console.error('🚨 [App] Error info:', errorInfo);
      
      // Track error in production
      if (process.env.NODE_ENV === 'production') {
        try {
          // Send error to monitoring service
          fetch('/api/v1/analytics/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
              activity_type: 'critical_error',
              metadata: {
                error_message: error.message,
                error_stack: error.stack,
                component_stack: errorInfo.componentStack,
                timestamp: new Date().toISOString()
              }
            })
          }).catch(() => {
            console.error('Failed to track critical error');
          });
        } catch (trackingError) {
          console.error('Error tracking failed:', trackingError);
        }
      }
    }}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

// Exportamos HomePage para usarlo en routes/index.tsx
export { HomePage };

// Exportamos App como default para el punto de entrada principal
export default App;