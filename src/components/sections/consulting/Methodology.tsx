import React, { useState } from 'react';
import SectionConnector from '../../ui/SectionConnector';
import ConsultingBackground from '../../ui/ConsultingBackground';
import { motion, AnimatePresence } from 'framer-motion';

const Methodology: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'P',
      label: 'Planificar',
      title: 'Plan',
      description: 'Identificar objetivos y establecer estrategias',
      details:
        'Definimos metas claras, analizamos la situación actual y desarrollamos estrategias específicas para alcanzar los objetivos organizacionales.',
      icon: '🎯',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'H',
      label: 'Hacer',
      title: 'Do',
      description: 'Implementar planes y ejecutar procesos',
      details:
        'Ejecutamos las estrategias planificadas, implementamos los procesos diseñados y ponemos en marcha las soluciones propuestas.',
      icon: '🚀',
      color: 'from-green-500 to-teal-500',
    },
    {
      id: 'V',
      label: 'Verificar',
      title: 'Check',
      description: 'Monitorear resultados y auditar procesos',
      details:
        'Evaluamos los resultados obtenidos, medimos el desempeño y verificamos que los objetivos se estén cumpliendo según lo planificado.',
      icon: '📊',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'A',
      label: 'Actuar',
      title: 'Act',
      description: 'Tomar acciones correctivas y mejorar continuamente',
      details:
        'Implementamos mejoras basadas en los resultados, corregimos desviaciones y establecemos nuevos estándares para la mejora continua.',
      icon: '⚡',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const benefits = [
    { icon: '📈', text: 'Mejora de competitividad' },
    { icon: '💰', text: 'Reducción de costos' },
    { icon: '🎯', text: 'Mayor productividad' },
    { icon: '🏆', text: 'Calidad superior' },
    { icon: '📊', text: 'Participación en mercado' },
    { icon: '🔄', text: 'Mejora continua' },
  ];

  return (
    <section className="relative section-unified-bg section-process-bg py-20">
      <ConsultingBackground variant="process" />
      <div className="content-overlay container mx-auto px-6">
        {/* HEADER */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-white/20">
            <span className="text-2xl">🔄</span>
            <span className="text-white/90 font-medium">Metodología Probada</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿En qué nos{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              basamos?
            </span>
          </h2>

          <h3 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6">
            Ciclo de Deming (PDCA)
          </h3>

          <p className="text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
            Estrategia basada en la mejora continua de la calidad, ampliamente utilizada
            en Sistemas de Gestión ISO para lograr resultados excepcionales.
          </p>
        </motion.div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center justify-items-center max-w-7xl mx-auto">
          {/* PDCA CIRCLE */}
          <motion.div
            className="relative justify-self-center w-full max-w-[400px] origin-center mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative w-full aspect-square">
              {/* Central circle */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center z-20 border border-white/30"
                whileHover={{ scale: 1.1 }}
              >
                <span className="text-white font-bold text-2xl">PDCA</span>
              </motion.div>

              {/* Outer ring */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <circle
                  cx="200"
                  cy="200"
                  r="180"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  className="animate-spin"
                  style={{ animationDuration: '20s' }}
                />
              </svg>

              {/* Steps */}
              {steps.map((step, index) => {
                const angle = (index * 90) * (Math.PI / 180);
                const radius = 140;
                const cx = 200 + Math.cos(angle) * radius;
                const cy = 200 + Math.sin(angle) * radius;
                const isActive = activeStep === index;

                return (
                  <div
                    key={step.id}
                    className="absolute"
                    style={{ 
                      left: `${(cx / 400) * 100}%`, 
                      top: `${(cy / 400) * 100}%`,
                      width: "80px",
                      height: "80px",
                      marginLeft: "-40px",
                      marginTop: "-40px"
                    }}
                  >
                    <motion.div
                      className={`w-full h-full cursor-pointer ${
                        isActive ? 'z-30' : 'z-10'
                      }`}
                      onClick={() => setActiveStep(index)}
                      animate={{ scale: isActive ? 1.25 : 1 }}
                      whileHover={{ scale: isActive ? 1.25 : 1.1 }}
                      whileTap={{ scale: isActive ? 1.2 : 0.95 }}
                      style={{ 
                        originX: 0.5, 
                        originY: 0.5 
                      }}
                    >
                      <div
                        className={`w-full h-full rounded-full bg-gradient-to-r ${step.color} flex flex-col items-center justify-center shadow-xl border-2 ${
                          isActive ? 'border-white' : 'border-white/30'
                        }`}
                      >
                        <div className="text-2xl mb-1">{step.icon}</div>
                        <div className="text-white font-bold text-sm">{step.id}</div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}

              {/* Connecting lines */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 400 400"
              >
                {steps.map((_, i) => {
                  const next = (i + 1) % steps.length;
                  const a1 = (i * 90) * (Math.PI / 180);
                  const a2 = (next * 90) * (Math.PI / 180);
                  const r = 140;
                  const x1 = 200 + Math.cos(a1) * r;
                  const y1 = 200 + Math.sin(a1) * r;
                  const x2 = 200 + Math.cos(a2) * r;
                  const y2 = 200 + Math.sin(a2) * r;
                  return (
                    <motion.line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="2"
                      strokeDasharray="10,5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    />
                  );
                })}
              </svg>
            </div>
          </motion.div>

          {/* STEP DETAILS */}
          <div className="space-y-8 w-full max-w-lg mx-auto lg:mx-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${steps[activeStep].color} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {steps[activeStep].icon}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">
                      {steps[activeStep].title}
                    </h4>
                    <p className="text-white/70">{steps[activeStep].label}</p>
                  </div>
                </div>
                <p className="text-white/80 mb-4 text-lg">
                  {steps[activeStep].description}
                </p>
                <p className="text-white/70 leading-relaxed">
                  {steps[activeStep].details}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    activeStep === idx
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {steps[idx].id}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* BENEFITS */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h4 className="text-2xl font-bold text-white text-center mb-8">
            Resultados que Obtendrá
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:border-white/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="text-3xl mb-2">{b.icon}</div>
                <p className="text-white/80 text-sm font-medium">{b.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <SectionConnector fromSection="process" toSection="testimonials" type="minimal" />
    </section>
  );
};

export default Methodology;
