import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Hero from './components/sections/home/Hero';
import Services from './components/sections/home/Services';
import Process from './components/sections/home/Process';
import Testimonials from './components/sections/home/Testimonials';
import Contact from './components/sections/home/Contact';
import CompanyPage from './pages/CompanyPage';
import ConsultingPage from './pages/ConsultingPage';

// Página de inicio que contiene todas las secciones actuales
const HomePage = () => (
  <>
    <Hero />
    <Services />
    <Process />
    <Testimonials />
    <Contact />
  </>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/empresa" element={<Layout><CompanyPage /></Layout>} />
        <Route path="/consultorias" element={<Layout><ConsultingPage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;