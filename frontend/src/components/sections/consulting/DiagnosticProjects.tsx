import React from 'react';
import SectionConnector from '../../ui/SectionConnector';
import ConsultingBackground from '../../ui/ConsultingBackground';
import { motion, cubicBezier } from 'framer-motion';

const DiagnosticProjects: React.FC = () => {
  const services = [
    {
      icon: "🔍",
      title: "Diagnóstico",
      description: "Realizamos un levantamiento de la situación actual identificando fortalezas, debilidades y su potencial impacto con el fin de proponer la estrategia más adecuada para la mejora continua de la organización.",
      features: ["Análisis FODA, PESTEL u otro", "Evaluación de procesos", "Identificación de oportunidades"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: "🚀",
      title: "Proyectos",
      description: "Implementación y/o mantención de sistemas de gestión que ayudarán a visualizar y administrar mejor la organización, área o procesos.",
      features: ["Sistemas de gestión", "Certificaciones ISO", "Toma de decisiones basada en datos"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: "📊",
      title: "Seguimiento",
      description: "Mediante la realización de auditorías detectamos desviaciones a lo implementado, generando planes de acción para corregir lo necesario.",
      features: ["Auditorías internas", "Planes de acción", "Monitoreo continuo"],
      color: "from-green-500 to-teal-500"
    },
    {
      icon: "🎯",
      title: "Asesorías Integrales",
      description: "Servicios completos de consultoría para transformar su organización de manera integral.",
      features: ["Control de gestión", "Simplificación de procesos", "Buenas prácticas", "Enfoque basado en riesgos", "Atención personalizada"],
      color: "from-orange-500 to-red-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  // Custom easing function using cubicBezier
  const customEase = cubicBezier(0.43, 0.13, 0.23, 0.96);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: customEase
      }
    }
  };

  return (
    <section className="relative section-unified-bg section-services-bg py-20">
      <ConsultingBackground />
      <div className="content-overlay container mx-auto px-6">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-white/20">
            <span className="text-2xl">⚡</span>
            <span className="text-white/90 font-medium">Metodología Probada</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Cómo lo{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              hacemos?
            </span>
          </h2>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Nuestro enfoque integral combina diagnóstico preciso, implementación efectiva y seguimiento continuo
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.02,
                y: -5,
                transition: { duration: 0.2 }
              }}
              className="group relative"
            >
              {/* Card Background with Gradient Border */}
              <div className={`absolute inset-0 bg-gradient-to-r ${service.color} rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 group-hover:border-white/30 transition-all duration-300 h-full">
                
                {/* Icon and Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                    {service.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-white/80 mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Features List */}
                <div className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * featureIndex }}
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${service.color}`} />
                      <span className="text-white/70 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Conocer Más Detalles
          </motion.button>
        </motion.div>
      </div>
      
      <SectionConnector fromSection="services" toSection="process" type="minimal" />
    </section>
  );
};

export default DiagnosticProjects;