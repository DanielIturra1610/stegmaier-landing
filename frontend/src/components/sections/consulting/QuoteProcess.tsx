import React, { useState } from 'react';
import ConsultingBackground from '../../ui/ConsultingBackground';
import { motion, AnimatePresence } from 'framer-motion';

const QuoteProcess: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    {
      number: "01",
      title: "Contacto Inicial",
      subtitle: "Primer acercamiento",
      description: "Nos ponemos en contacto para entender sus necesidades específicas y objetivos organizacionales.",
      details: "Durante esta fase inicial, realizamos una conversación detallada para comprender el contexto de su empresa, los desafíos actuales y las metas que desea alcanzar. Esto nos permite diseñar una propuesta personalizada.",
      icon: "📞",
      color: "from-blue-500 to-cyan-500",
      duration: "1-2 días"
    },
    {
      number: "02", 
      title: "Diagnóstico",
      subtitle: "Evaluación detallada",
      description: "Realizamos un análisis profundo de la situación actual de su organización para identificar oportunidades de mejora.",
      details: "Nuestro equipo de expertos realiza un diagnóstico integral que incluye revisión de procesos, evaluación de sistemas existentes, análisis de documentación y entrevistas con personal clave.",
      icon: "🔍",
      color: "from-purple-500 to-pink-500",
      duration: "3-5 días"
    },
    {
      number: "03",
      title: "Propuesta Técnica",
      subtitle: "Solución personalizada",
      description: "Desarrollamos una propuesta técnica detallada con metodología, cronograma y recursos necesarios.",
      details: "Elaboramos un documento completo que incluye la metodología a aplicar, cronograma detallado, recursos humanos y técnicos requeridos, entregables específicos y criterios de éxito.",
      icon: "📋",
      color: "from-green-500 to-teal-500",
      duration: "2-3 días"
    },
    {
      number: "04",
      title: "Cotización",
      subtitle: "Propuesta económica",
      description: "Presentamos una cotización transparente y competitiva basada en el alcance del proyecto.",
      details: "La cotización incluye desglose detallado de costos, modalidades de pago flexibles, garantías del servicio y condiciones comerciales claras y transparentes.",
      icon: "💰",
      color: "from-orange-500 to-red-500",
      duration: "1 día"
    },
    {
      number: "05",
      title: "Inicio del Proyecto",
      subtitle: "Implementación",
      description: "Una vez aprobada la propuesta, iniciamos la implementación según el cronograma acordado.",
      details: "Comenzamos la ejecución del proyecto con un kickoff meeting, asignación del equipo de trabajo, establecimiento de canales de comunicación y seguimiento de hitos clave.",
      icon: "🚀",
      color: "from-indigo-500 to-purple-500",
      duration: "Variable"
    }
  ];

  const benefits = [
    { icon: "⚡", text: "Respuesta rápida", detail: "Menos de 24 horas" },
    { icon: "🎯", text: "Soluciones personalizadas", detail: "Adaptadas a su realidad" },
    { icon: "💎", text: "Calidad garantizada", detail: "Estándares internacionales" },
    { icon: "🤝", text: "Acompañamiento integral", detail: "Durante todo el proceso" }
  ];

  return (
    <section className="relative section-unified-bg section-contact-bg py-20 overflow-hidden">
      <ConsultingBackground variant="contact" />
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
            <span className="text-2xl">📋</span>
            <span className="text-white/90 font-medium">Proceso Simplificado</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Cómo{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              cotizamos?
            </span>
          </h2>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Un proceso transparente y eficiente en 5 pasos para brindarle la mejor propuesta
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start max-w-7xl mx-auto">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-30" />
            
            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    activeStep === index ? 'scale-105' : ''
                  }`}
                  onClick={() => setActiveStep(index)}
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Step Circle */}
                  <div className={`absolute left-0 w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-xl border-4 ${
                    activeStep === index ? 'border-white scale-110' : 'border-white/30'
                  } transition-all duration-300`}>
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  
                  {/* Step Content */}
                  <div className={`ml-24 bg-white/10 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 ${
                    activeStep === index 
                      ? 'border-white/30 bg-white/15' 
                      : hoveredStep === index 
                        ? 'border-white/25 bg-white/12' 
                        : 'border-white/20'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-2xl font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                        {step.number}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{step.title}</h3>
                        <p className="text-white/60 text-sm">{step.subtitle}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
                          {step.duration}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-white/80 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* Expand indicator */}
                    <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                      <span>Ver detalles</span>
                      <motion.span
                        animate={{ rotate: activeStep === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ↓
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Step Details */}
          <div className="sticky top-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
              >
                {/* Step Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-20 h-20 rounded-xl bg-gradient-to-r ${steps[activeStep].color} flex items-center justify-center text-3xl shadow-lg`}>
                    {steps[activeStep].icon}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">{steps[activeStep].title}</h3>
                    <p className="text-white/70 text-lg">{steps[activeStep].subtitle}</p>
                    <p className="text-white/50 text-sm">Duración: {steps[activeStep].duration}</p>
                  </div>
                </div>
                
                {/* Step Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">¿Qué incluye este paso?</h4>
                  <p className="text-white/80 leading-relaxed">
                    {steps[activeStep].details}
                  </p>
                </div>
                
                {/* Progress Indicator */}
                <div className="mt-8">
                  <div className="flex justify-between text-sm text-white/60 mb-2">
                    <span>Progreso del proceso</span>
                    <span>{Math.round(((activeStep + 1) / steps.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${steps[activeStep].color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-6">
              <motion.button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="flex-1 py-3 px-4 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: activeStep > 0 ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Anterior
              </motion.button>
              <motion.button
                onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                disabled={activeStep === steps.length - 1}
                className="flex-1 py-3 px-4 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: activeStep < steps.length - 1 ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
              >
                Siguiente →
              </motion.button>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            ¿Por qué elegirnos?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:border-white/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <h4 className="text-white font-semibold mb-2">{benefit.text}</h4>
                <p className="text-white/70 text-sm">{benefit.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <motion.div className="space-y-6">
            <h3 className="text-2xl font-bold text-white">
              ¿Listo para comenzar?
            </h3>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Contáctenos hoy mismo y reciba una cotización personalizada sin compromiso
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Solicitar Cotización
              </motion.button>
              <motion.button
                className="border-2 border-white/30 hover:border-white/50 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Agendar Reunión
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default QuoteProcess;