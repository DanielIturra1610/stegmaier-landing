import { FC } from 'react';
import React from 'react';
import { motion, Variants } from 'framer-motion';
import SectionConnector from '../../ui/SectionConnector';

// Datos de las certificaciones
const certifications = [
  {
    id: 1,
    name: 'ISO 9001',
    logo: '/assets/cert-iso9001.svg', // Imagen de placeholder (debe existir en public/assets)
    description: 'Certificación en Sistema de Gestión de Calidad que demuestra nuestro compromiso con la excelencia en la prestación de servicios de consultoría.',
    issuedBy: 'TÜV Rheinland',
    year: 2018,
    category: 'calidad',
  },
  {
    id: 2,
    name: 'ISO 14001',
    logo: '/assets/cert-iso14001.svg',
    description: 'Sistema de Gestión Ambiental que demuestra nuestra responsabilidad con el medio ambiente y el desarrollo sostenible.',
    issuedBy: 'Bureau Veritas',
    year: 2019,
    category: 'ambiental',
  },
  {
    id: 3,
    name: 'ISO 27001',
    logo: '/assets/cert-iso27001.svg',
    description: 'Sistema de Gestión de Seguridad de la Información que garantiza la confidencialidad, integridad y disponibilidad de los datos.',
    issuedBy: 'AENOR',
    year: 2020,
    category: 'seguridad',
  },
  {
    id: 4,
    name: 'ISO 45001',
    logo: '/assets/cert-iso45001.svg',
    description: 'Sistema de Gestión de Salud y Seguridad en el Trabajo que demuestra nuestro compromiso con el bienestar de nuestros colaboradores.',
    issuedBy: 'SGS',
    year: 2021,
    category: 'seguridad',
  },
  {
    id: 5,
    name: 'Acreditación ENAC',
    logo: '/assets/cert-enac.svg',
    description: 'Acreditación de la Entidad Nacional de Acreditación que reconoce nuestra competencia técnica como consultores en sistemas de gestión.',
    issuedBy: 'ENAC',
    year: 2017,
    category: 'acreditación',
  },
  {
    id: 6,
    name: 'EFQM',
    logo: '/assets/cert-efqm.svg',
    description: 'Reconocimiento European Foundation for Quality Management por la excelencia en la gestión y prácticas empresariales.',
    issuedBy: 'EFQM',
    year: 2019,
    category: 'excelencia',
  },
];

// Componente para cada tarjeta de certificación
const CertificationCard: FC<{
  name: string;
  logo: string;
  description: string;
  issuedBy: string;
  year: number;
  index: number;
}> = ({ name, logo, description, issuedBy, year, index }) => {
  return (
    <motion.div 
      className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        y: -5,
      }}
    >
      {/* Borde gradiente consistente para todas las tarjetas */}
      <div className="p-[2px] bg-gradient-to-r from-accent-500/80 via-accent-400/60 to-accent-300/80 rounded-xl">
        <div className="p-5 bg-primary-800/95 rounded-xl flex flex-col h-full">
          <div className="flex items-center mb-4">
            <div className="mr-4 flex-shrink-0 p-3 bg-white/10 rounded-lg">
              <img 
                src={logo} 
                alt={name} 
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  // Fallback para imágenes que no se cargan
                  (e.target as HTMLImageElement).src = "https://placehold.co/48x48/accent500/FFFFFF/?text=ISO";
                }}
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{name}</h3>
              <p className="text-white/60 text-sm">
                Emitido por {issuedBy}, {year}
              </p>
            </div>
          </div>
          
          <p className="text-white/80 text-sm mb-5 flex-grow">
            {description}
          </p>
          
          <div className="mt-auto">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-700/50 text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500 text-xs font-bold border border-accent-500/30">
              Verificado
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Certifications: FC = () => {
  // Animaciones corregidas
  const titleAnimation: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: "easeOut" as const } 
    }
  };

  return (
    <section 
      id="certifications" 
      className="section-unified-bg section-certifications-bg content-overlay relative py-16 md:py-20">
      
      {/* Decoración sutil */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="section-overlay-pattern opacity-3"></div>
      
      <div className="container mx-auto px-4 max-w-6xl content-overlay">
        <motion.header 
          className="mb-12 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={titleAnimation}
        >
          <span className="inline-block py-2 px-4 rounded-full bg-accent-500/20 text-white text-sm font-medium mb-3 backdrop-blur-sm">
            <span className="mr-2">🏆</span>Reconocimientos
          </span>
          
          <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Nuestras <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">certificaciones</span>
          </h2>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-accent-500 opacity-70"></div>
          
          <p className="mt-6 text-lg text-white/80 max-w-3xl mx-auto">
            Avalados por los principales organismos certificadores internacionales,
            demostramos nuestro compromiso con la excelencia.
          </p>
        </motion.header>
        
        {/* Grid de certificaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert, index) => (
            <CertificationCard 
              key={cert.id}
              name={cert.name}
              logo={cert.logo}
              description={cert.description}
              issuedBy={cert.issuedBy}
              year={cert.year}
              index={index}
            />
          ))}
        </div>
        
        {/* CTA */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <a 
            href="/contacto" 
            className="inline-flex items-center justify-center px-6 py-3 border border-white/20 
                    rounded-md shadow-sm text-base font-medium text-white bg-primary-700/50
                    hover:bg-primary-600/70 focus:outline-none focus:ring-2 focus:ring-offset-2 
                    focus:ring-primary-500 transition-all duration-300 backdrop-blur-sm"
          >
            Solicita más información
          </a>
        </motion.div>
      </div>
      
      {/* Transición ultra-sutil hacia la siguiente sección o footer */}
      <SectionConnector 
        fromSection="certifications" 
        toSection="footer" 
        type="minimal"
        height={40}
      />
    </section>
  );
};

export default Certifications;
