import { BrowserRouter as Router } from 'react-router-dom';
import Hero from './components/sections/home/Hero';
import Services from './components/sections/home/Services';
import Process from './components/sections/home/Process';
import Testimonials from './components/sections/home/Testimonials';
import Contact from './components/sections/home/Contact';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
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
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

// Exportamos HomePage para usarlo en routes/index.tsx
export { HomePage };

// Exportamos App como default para el punto de entrada principal
export default App;