// React import no es necesario en este archivo gracias a la configuración JSX
import Layout from './components/layout/Layout';
import Hero from './components/home/Hero';
import Services from './components/home/Services';
import Process from './components/home/Process';
import Projects from './components/home/Projects';
import TechStack from './components/home/TechStack';
import Testimonials from './components/home/Testimonials';
import Contact from './components/home/Contact';

function App() {
  return (
    <Layout>
      <Hero />
      <Services />
      <Process />
      <Projects />
      <TechStack />
      <Testimonials />
      <Contact />
    </Layout>
  );
}

export default App;