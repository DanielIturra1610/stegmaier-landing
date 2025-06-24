import { useEffect } from 'react';
import ConsultingHero from '../components/sections/consulting/ConsultingHero';
import Methodology from '../components/sections/consulting/Methodology';
import DiagnosticProjects from '../components/sections/consulting/DiagnosticProjects';
import Services from '../components/sections/consulting/Services';
import QuoteProcess from '../components/sections/consulting/QuoteProcess';

function ConsultingPage() {
  useEffect(() => {
    // Scroll al inicio cuando se cargue la página
    window.scrollTo(0, 0);
    // Actualizar título de la página
    document.title = 'Consultorías | Stegmaier Consulting';
  }, []);

  return (
    <>
      <ConsultingHero />
      <DiagnosticProjects />
      <Methodology />
      <Services />
      <QuoteProcess />
    </>
  );
}

export default ConsultingPage;