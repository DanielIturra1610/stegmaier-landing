import React, { useState } from 'react';
import SectionConnector from '../../ui/SectionConnector';
import ConsultingBackground from '../../ui/ConsultingBackground';
import { motion, AnimatePresence } from 'framer-motion';

const Services: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  
  const categories = [
    {
      id: "iso",
      name: "Sistemas ISO",
      icon: "🏆",
      color: "from-blue-500 to-cyan-500",
      description: "Implementación y certificación de estándares internacionales"
    },
    {
      id: "management",
      name: "Gestión Empresarial",
      icon: "📊",
      color: "from-purple-500 to-pink-500",
      description: "Optimización de procesos y estructura organizacional"
    },
    {
      id: "training",
      name: "Capacitación",
      icon: "🎓",
      color: "from-green-500 to-teal-500",
      description: "Desarrollo de competencias y habilidades"
    },
    {
      id: "consulting",
      name: "Consultoría Especializada",
      icon: "💡",
      color: "from-orange-500 to-red-500",
      description: "Soluciones personalizadas para desafíos específicos"
    }
  ];

  const services = {
    iso: [
      { name: "ISO 9001 - Gestión de Calidad", description: "Sistema de gestión de calidad para mejorar la satisfacción del cliente" },
      { name: "ISO 14001 - Gestión Ambiental", description: "Gestión ambiental para reducir el impacto ecológico" },
      { name: "ISO 45001 - Seguridad y Salud", description: "Prevención de riesgos laborales y bienestar de trabajadores" },
      { name: "ISO 27001 - Seguridad de la Información", description: "Protección de activos de información críticos" },
      { name: "ISO 22000 - Seguridad Alimentaria", description: "Gestión de la seguridad alimentaria en toda la cadena" },
      { name: "ISO 50001 - Gestión de Energía", description: "Optimización del consumo energético y sostenibilidad" }
    ],
    management: [
      { name: "Gestión por Procesos", description: "Optimización y documentación de procesos organizacionales" },
      { name: "Balanced Scorecard", description: "Sistema de medición y gestión estratégica integral" },
      { name: "Gestión de Riesgos", description: "Identificación, evaluación y mitigación de riesgos empresariales" },
      { name: "Mejora Continua", description: "Implementación de metodologías de mejora sistemática" },
      { name: "Planificación Estratégica", description: "Desarrollo de planes estratégicos a largo plazo" },
      { name: "Control de Gestión", description: "Sistemas de monitoreo y control de desempeño" }
    ],
    training: [
      { name: "Formación de Auditores Internos", description: "Capacitación en técnicas de auditoría y evaluación" },
      { name: "Liderazgo y Gestión de Equipos", description: "Desarrollo de habilidades directivas y liderazgo" },
      { name: "Gestión del Cambio", description: "Herramientas para liderar transformaciones organizacionales" },
      { name: "Análisis de Datos", description: "Capacitación en análisis estadístico y toma de decisiones" },
      { name: "Comunicación Efectiva", description: "Mejora de habilidades de comunicación empresarial" },
      { name: "Trabajo en Equipo", description: "Fortalecimiento de la colaboración y sinergia grupal" }
    ],
    consulting: [
      { name: "Diagnóstico Organizacional", description: "Evaluación integral de la situación actual de la empresa" },
      { name: "Reestructuración Empresarial", description: "Rediseño de estructura organizacional y procesos" },
      { name: "Transformación Digital", description: "Implementación de tecnologías y procesos digitales" },
      { name: "Cultura Organizacional", description: "Desarrollo y fortalecimiento de la cultura empresarial" },
      { name: "Innovación y Creatividad", description: "Fomento de la innovación y pensamiento creativo" },
      { name: "Sostenibilidad Empresarial", description: "Estrategias de responsabilidad social y ambiental" }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="relative section-unified-bg section-testimonials-bg py-20 overflow-hidden">
      <ConsultingBackground variant="testimonials" />
      <div className="content-overlay container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-white/20">
            <span className="text-2xl">🚀</span>
            <span className="text-white/90 font-medium">Servicios Especializados</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Nuestros{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Servicios
            </span>
          </h2>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Soluciones integrales diseñadas para transformar su organización y alcanzar la excelencia operacional
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(index)}
              className={`flex items-center gap-3 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === index
                  ? 'bg-white/20 text-white border border-white/30 shadow-lg'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl">{category.icon}</span>
              <span className="hidden sm:inline">{category.name}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Category Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-12"
          >
            <div className={`inline-flex items-center gap-4 bg-gradient-to-r ${categories[activeCategory].color} bg-opacity-20 rounded-2xl px-8 py-4 backdrop-blur-sm border border-white/20`}>
              <span className="text-3xl">{categories[activeCategory].icon}</span>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white">{categories[activeCategory].name}</h3>
                <p className="text-white/80">{categories[activeCategory].description}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Services Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {services[categories[activeCategory].id as keyof typeof services].map((service, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.03,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="group relative"
              >
                {/* Card Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${categories[activeCategory].color} rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
                
                <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 group-hover:border-white/30 transition-all duration-300 h-full">
                  {/* Service Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${categories[activeCategory].color} flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {categories[activeCategory].icon}
                  </div>
                  
                  {/* Service Name */}
                  <h4 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                    {service.name}
                  </h4>
                  
                  {/* Service Description */}
                  <p className="text-white/70 text-sm leading-relaxed">
                    {service.description}
                  </p>
                  
                  {/* Hover Arrow */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${categories[activeCategory].color} flex items-center justify-center`}>
                      <span className="text-white text-sm">→</span>
                    </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <motion.div className="space-y-4">
            <p className="text-white/80 text-lg">
              ¿Necesita un servicio específico que no aparece en la lista?
            </p>
            <motion.button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Consultar Servicios Personalizados
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      
      <SectionConnector fromSection="testimonials" toSection="contact" type="minimal" />
    </section>
  );
};

export default Services;