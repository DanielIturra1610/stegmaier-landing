import Layout from './components/layout/Layout';
import Hero from './components/sections/home/Hero';
import Services from './components/sections/home/Services';
import Process from './components/sections/home/Process';
import Testimonials from './components/sections/home/Testimonials';
import Contact from './components/sections/home/Contact';

function App() {
  return (
    <Layout>
      <Hero />
      <Services />
      <Process />
      <Testimonials />
      <Contact />
    </Layout>
  );
}
export default App;