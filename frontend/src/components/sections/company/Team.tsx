import { FC } from 'react';
import React from 'react';
import { motion, Variants } from 'framer-motion';
import SectionConnector from '../../ui/SectionConnector';

// Importar imágenes correctamente
import imageFernando from '../../../assets/images/fotos-steg-equipo2.jpg';
import imageCecilia from '../../../assets/images/fotos-steg-equipo1.jpg';
import imageRocio from '../../../assets/images/fotos-steg-equipo3.jpg';
import imageLucas from '../../../assets/images/fotos-steg-equipo4.jpg';

// Datos del equipo
const teamMembers = [
  {
    id: 1,
    name: 'FERNANDO ALBERTO STEGMAIER BRAVO',
    role: 'Gerente General',
    bio: 'Ingeniero Ejecución Mecánico Automotriz. Auditor Líder/Interno ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 Certificado por IQNET Academy. Certificado en Interpretación de Sistemas de gestión integrados ISO 9001:2015, ISO 14001:2015, ISO 45001:2018. Certificado en Gestión de No Conformidades por IRAM Chile. Certificado en Metodología de Calidad 5S por IRAM Chile. Certificado en Interpretación y Aplicación de Sistemas de gestión de riesgos ISO 31000:2018 por IRAM Chile.',
    image: imageFernando,
    linkedin: 'https://linkedin.com',
    department: 'dirección',
  },
  {
    id: 2,
    name: 'CECILIA BEATRIZ STEGMAIER ÁLVAREZ',
    role: 'Gerente de Operaciones',
    bio: 'Ingeniero en Prevención de Riesgos Laborales y Ambientales con licenciatura. Técnico en Prevención de Riesgos Laborales. Auditor Líder/Interno ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 Certificado por IQNET Academy, IRAM Chile. Certificado en Interpretación de Sistemas de gestión integrados ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 por IRAM Chile. Certificado en Gestión de NoConformidades por IRAM Chile. Certificado en Metodología de Calidad 5S por IRAM Chile. Certificado en Interpretación y Aplicación de Sistemas de gestión de riesgos ISO 31000:2018 por IRAM Chile.',
    image: imageCecilia,
    linkedin: 'https://linkedin.com',
    department: 'dirección',
  },
  {
    id: 3,
    name: 'ROCIO CARRASCO',
    role: 'Técnico nivel medio en construcción',
    bio: 'Técnico nivel medio en construcción. Técnico en prevención de riesgos. Ingeniero en prevención de riesgos.',
    image: imageRocio,
    linkedin: 'https://linkedin.com',
    department: 'equipo',
  },
  {
    id: 4,
    name: 'LUCAS FABIAN FIGUEROA SOTO',
    role: 'Ingeniero en Sonido',
    bio: 'Ingeniero en Sonido especializado en sistemas audiovisuales y producción técnica.',
    image: imageLucas,
    linkedin: 'https://linkedin.com',
    department: 'equipo',
  },
];

const TeamMemberCard: FC<{
  name: string;
  role: string;
  bio: string;
  image: string | any;
  linkedin: string;
  index: number;
}> = ({ name, role, bio, image, linkedin, index }) => {
  return (
    <motion.div 
      className="bg-gradient-to-br from-primary-800/40 to-primary-900/60 rounded-2xl overflow-hidden border border-white/10 flex flex-col h-full shadow-xl shadow-primary-900/20 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ 
        y: -5, 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
    >
      {/* Header con imagen y overlay de gradiente */}
      <div className="relative overflow-hidden h-80 group">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900 via-primary-900/70 to-transparent opacity-80"></div>
        
        {/* Nombre y rol sobre la imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
          <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{name}</h3>
          <div className="inline-block bg-gradient-to-r from-accent-400 to-accent-600 px-3 py-1 rounded-full">
            <p className="text-white font-medium text-sm">{role}</p>
          </div>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="p-8 flex-grow bg-opacity-10 backdrop-blur-sm">
        <div className="text-white/90 text-sm leading-relaxed space-y-3">
          {bio.split('. ').map((sentence, i) => (
            sentence.trim() && (
              <p key={i} className="flex items-start">
                <span className="text-accent-400 mr-2 mt-1">•</span>
                <span>{sentence.trim() + (sentence.trim().endsWith('.') ? '' : '.')}</span>
              </p>
            )
          ))}
        </div>
      </div>
      
      {/* Footer con enlace de LinkedIn */}
      <div className="px-8 py-6 border-t border-white/10 bg-primary-800/30">
        <a 
          href={linkedin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          <span className="font-medium">LinkedIn</span>
        </a>
      </div>
    </motion.div>
  );
};

const Team: FC = () => {
  // Animaciones para los elementos del título
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
      id="team" 
      className="section-unified-bg section-team-bg content-overlay relative py-16 md:py-20"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 max-w-6xl content-overlay">
        <motion.header 
          className="mb-12 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={titleAnimation}
        >
          <span className="inline-block py-2 px-4 rounded-full bg-accent-500/20 text-white text-sm font-medium mb-3 backdrop-blur-sm">
            <span className="mr-2">👥</span>Nuestro Equipo
          </span>
          
          <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Conoce a los <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">expertos</span>
          </h2>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-accent-500 opacity-70"></div>
          
          <p className="mt-6 text-lg text-white/80 max-w-3xl mx-auto">
            Nuestro equipo directivo garantiza la máxima calidad en todos nuestros servicios de consultoría y certificación.
          </p>
        </motion.header>
        
        {/* Grid de miembros del equipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <TeamMemberCard 
              key={member.id}
              name={member.name}
              role={member.role}
              bio={member.bio}
              image={member.image}
              linkedin={member.linkedin}
              index={index}
            />
          ))}
        </div>
        
        {/* CTA */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <a 
            href="/contacto" 
            className="inline-flex items-center justify-center px-6 py-3 border border-white/20 
                     rounded-md shadow-sm text-base font-medium text-white bg-primary-700/50
                     hover:bg-primary-600/70 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-primary-500 transition-all duration-300 backdrop-blur-sm"
          >
            Contáctanos
          </a>
        </motion.div>
      </div>
      
      {/* Transición ultra-sutil hacia la siguiente sección */}
      <SectionConnector 
        fromSection="team" 
        toSection="certifications" 
        type="minimal"
        height={40}
      />
    </section>
  );
};

export default Team;
