import { useEffect } from 'react';
import CompanyHero from '../components/sections/company/CompanyHero';
import History from '../components/sections/company/History';
import Values from '../components/sections/company/Values';
import Team from '../components/sections/company/Team';
import Certifications from '../components/sections/company/Certifications';
import Mission from '../components/sections/company/Mission';
import Vision from '../components/sections/company/Vision';
import React from 'react';

function CompanyPage() {
  useEffect(() => {
    // Scroll al inicio cuando se cargue la página
    window.scrollTo(0, 0);
    // Actualizar título de la página
    document.title = 'Empresa | Stegmaier Consulting';
  }, []);

  return (
    <>
      <CompanyHero />
      <Vision />
      <Mission />
      <History />
      <Values />
      <Team />
      <Certifications />
    </>
  );
}

export default CompanyPage;
