import { FC, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import SectionConnector from '../../ui/SectionConnector';
import React from 'react';
// Datos de la historia de la empresa (podría moverse a un archivo separado)
const historyEvents = [
  {
    id: 1,
    year: '2008',
    title: 'Fundación',
    description: 'Stegmaier Consulting nace como una consultora especializada en sistemas de gestión de calidad.',
    icon: '🚀',
  },
  {
    id: 2,
    year: '2010',
    title: 'Expansión Regional',
    description: 'Comenzamos a expandir nuestros servicios a otros países de Latinoamérica, abriendo oficinas en Chile y Colombia.',
    icon: '🌎',
  },
  {
    id: 3,
    year: '2013',
    title: 'Certificación ISO 27001',
    description: 'Incluimos la consultoría para sistemas de gestión de seguridad de la información en nuestro catálogo de servicios.',
    icon: '🔒',
  },
  {
    id: 4,
    year: '2015',
    title: 'Premio a la Excelencia',
    description: 'Reconocidos con el premio a la excelencia en consultoría empresarial por la Cámara de Comercio.',
    icon: '🏆',
  },
  {
    id: 5,
    year: '2018',
    title: '10 Años de Trayectoria',
    description: 'Celebramos una década de éxitos con más de 300 empresas certificadas y un equipo de 50 consultores especializados.',
    icon: '🎂',
  },
  {
    id: 6,
    year: '2020',
    title: 'Transformación Digital',
    description: 'Lanzamiento de nuestra plataforma digital para gestión de proyectos de certificación remota.',
    icon: '💻',
  },
  {
    id: 7,
    year: '2023',
    title: 'Expansión de Servicios',
    description: 'Incorporamos consultoría en sostenibilidad y responsabilidad social empresarial.',
    icon: '🌱',
  },
  {
    id: 8,
    year: 'Hoy',
    title: 'Líderes del Sector',
    description: 'Más de 500 empresas certificadas y presencia en 7 países de Latinoamérica.',
    icon: '📊',
  },
];

const HistoryTimelineItem: FC<{
  year: string;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  onMouseEnter: () => void;
  isEven: boolean;
}> = ({ year, title, description, icon, isActive, onMouseEnter, isEven }) => {
  return (
    <motion.div 
      className={`relative ${isEven ? 'md:text-right' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true, margin: "-50px" }}
      onMouseEnter={onMouseEnter}
    >
      {/* Punto en la línea de tiempo */}
      <div className="md:flex items-center justify-center">
        <motion.div 
          className={`
            absolute left-0 md:static flex items-center justify-center w-12 h-12 rounded-full z-10
            ${isActive 
              ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' 
              : 'bg-primary-700/70 text-white'
            } transition-all duration-300
          `}
          whileHover={{ scale: 1.1 }}
        >
          <span className="text-xl">{icon}</span>
        </motion.div>
      </div>
      
      {/* Contenido */}
      <div className={`ml-16 md:ml-0 ${isEven ? 'md:mr-16' : 'md:ml-16'}`}>
        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500 font-bold mb-1 text-lg">{year}</span>
        <h3 className={`text-xl font-bold text-white mb-2 ${isActive ? 'text-accent-300' : ''}`}>
          {title}
        </h3>
        <p className="text-white/70">{description}</p>
      </div>
    </motion.div>
  );
};

const History: FC = () => {
  // Estado para controlar el evento activo en hover
  const [activeEvent, setActiveEvent] = useState<number | null>(null);
  
  // Animaciones para los componentes
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
      id="history" 
      className="section-unified-bg section-history-bg content-overlay relative py-16 md:py-20"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 max-w-6xl content-overlay">
        <motion.header 
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={titleAnimation}
        >
          <span className="inline-block py-2 px-4 rounded-full bg-accent-500/20 text-white text-sm font-medium mb-3 backdrop-blur-sm">
            <span className="mr-2">📜</span>Nuestra Trayectoria
          </span>
          
          <h2 className="mt-2 text-4xl md:text-5xl font-display font-bold text-white leading-tight">
            Historia de <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">Innovación</span>
          </h2>
          
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-accent-500 opacity-70"></div>
          
          <p className="mt-6 text-lg text-white/80 max-w-3xl mx-auto">
            Descubre cómo hemos evolucionado durante los años para convertirnos en líderes del sector.
          </p>
        </motion.header>
        
        {/* Timeline para pantallas grandes */}
        <div className="hidden md:block relative mb-20">
          {/* Línea central */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gradient-to-b from-primary-600/30 via-accent-500/30 to-primary-600/30"></div>
          
          {/* Eventos de la timeline */}
          <div className="grid grid-cols-2 gap-8">
            {historyEvents.map((event, index) => (
              <div key={event.id} className={index % 2 === 0 ? "col-start-1" : "col-start-2"}>
                <HistoryTimelineItem
                  {...event}
                  isActive={activeEvent === event.id}
                  onMouseEnter={() => setActiveEvent(event.id)}
                  isEven={index % 2 === 0}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Timeline para móviles */}
        <div className="md:hidden relative mb-12">
          {/* Línea vertical */}
          <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-primary-600/30 via-accent-500/30 to-primary-600/30"></div>
          
          {/* Eventos de la timeline */}
          <div className="space-y-12">
            {historyEvents.map((event) => (
              <HistoryTimelineItem
                key={event.id}
                {...event}
                isActive={activeEvent === event.id}
                onMouseEnter={() => setActiveEvent(event.id)}
                isEven={false}
              />
            ))}
          </div>
        </div>
        
        {/* CTA - Llamado a la acción */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Nuestra historia continúa escribiéndose con cada cliente que confía en nosotros para sus procesos de certificación.
          </p>
          <a 
            href="/casos" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent 
                    rounded-md shadow-sm text-base font-medium text-white bg-accent-500 
                    hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 
                    focus:ring-accent-500 transition-all duration-300"
          >
            Ver Casos de Éxito
          </a>
        </motion.div>
      </div>
      
      {/* Transición ultra-sutil hacia la siguiente sección */}
      <SectionConnector 
        fromSection="history" 
        toSection="values" 
        type="minimal"
        height={40}
      />
    </section>
  );
};

export default History;
