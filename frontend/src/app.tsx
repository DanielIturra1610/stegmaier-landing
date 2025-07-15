import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Hero from './components/sections/home/Hero';
import Services from './components/sections/home/Services';
import Process from './components/sections/home/Process';
import Testimonials from './components/sections/home/Testimonials';
import Contact from './components/sections/home/Contact';
import CompanyPage from './pages/CompanyPage';
import ConsultingPage from './pages/ConsultingPage';
import React from 'react';
import { AuthProvider } from './context/AuthContext';
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
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

// Exportamos HomePage para usarlo en routes/index.tsx
export { HomePage };

// Exportamos App como default para el punto de entrada principal
export default App;