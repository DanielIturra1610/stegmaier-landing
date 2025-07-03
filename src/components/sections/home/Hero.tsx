import { FC, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Button from '../../ui/button'
import IsoBadge from '../../ui/IsoBadge'
import SectionConnector from '../../ui/SectionConnector'

// Stats counter component (sin cambios)
const StatsCounter = ({ number, label }: { number: string; label: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.5 }}
    className="text-center"
  >
    <div className="text-2xl md:text-3xl font-bold text-white">{number}</div>
    <div className="text-sm text-white/70 mt-1">{label}</div>
  </motion.div>
)

const Hero: FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -80]);
  const y2 = useTransform(scrollY, [0, 500], [0, -40]);

  // Referencias para acceder al contenedor real donde aplicaremos los efectos visuales
  const textEffectsContainerRef = useRef<HTMLDivElement>(null);
  const certificationsEffectsContainerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="home"
      className="section-unified-bg section-hero-bg minimal-decorations content-overlay relative text-white overflow-hidden pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-10 lg:pb-24"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-noise-pattern"></div>

      {/* Punto decorativo difuminado en la parte inferior */}
      <div className="blur-transition-element blur-transition-bottom floating-transition"></div>
      
      {/* Decoraciones específicas del Hero - Ajustado z-index para que esté por debajo del contenido */}
      <div className="hero-decorations z-0">
        <div className="circle-1"></div>
        <div className="circle-2"></div>
      </div>
      
      {/* Grid sutil de fondo - Ajustado z-index */}
      <div className="minimal-grid z-0"></div>
      
      {/* Elementos geométricos minimalistas - Ajustado z-index */}
      <div className="geometric-accent-1 z-0"></div>
      <div className="geometric-accent-2 z-0"></div>

      {/* Aumentado z-index del contenedor principal para asegurar que esté sobre los elementos decorativos */}
      <div className="relative container mx-auto px-4 lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16 z-20">
        
        {/* NUEVA ESTRUCTURA: Capa de efectos visuales separada del texto */}
        <div className="lg:col-span-7 xl:col-span-7 relative z-0">
          {/* Capa para efectos visuales y transformaciones - NO contiene texto */}
          <motion.div 
            ref={textEffectsContainerRef}
            style={{ y: y1 }} 
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {/* Esta capa solo recibe transformaciones pero no contiene texto */}
          </motion.div>
        </div>

        {/* -------- Contenido de texto en una capa estática sin transformaciones -------- */}
        <div className="lg:col-span-7 xl:col-span-7 relative z-10">
          {/* Trust badge with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center mb-6 py-2 px-4 rounded-full bg-gradient-to-r from-accent-500/20 to-primary-400/20 backdrop-blur-sm border border-accent-500/30 shadow-lg"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-accent-500 mr-3 animate-pulse"></span>
            <span className="text-sm font-semibold text-white">🏆 Líderes en Certificación ISO desde 2008</span>
          </motion.div>

          {/* Main headline with powerful messaging */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="font-display font-black leading-[1.1] text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-6"
          >
            Tu socio{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-white">estratégico</span>
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute inset-x-0 bottom-2 h-4 bg-gradient-to-r from-accent-500 to-accent-400 z-0 rounded-lg"
              />
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">
              en certificación ISO
            </span>
          </motion.h1>

          {/* Enhanced value proposition */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl mb-8"
          >
            <span className="font-semibold text-accent-300">Implementación garantizada</span> de ISO 9001, 14001 y 45001 
            con acompañamiento completo y metodología probada en más de{' '}
            <span className="font-semibold text-accent-300">500 empresas</span> chilenas.
          </motion.p>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap items-center gap-6 mb-10 text-sm text-white/80"
          >
            <div className="flex items-center">
              <span className="text-accent-400 mr-2">✓</span>
              Respuesta en 24 horas
            </div>
            <div className="flex items-center">
              <span className="text-accent-400 mr-2">✓</span>
              Cotización gratuita
            </div>
            <div className="flex items-center">
              <span className="text-accent-400 mr-2">✓</span>
              15+ años de experiencia
            </div>
          </motion.div>

          {/* Enhanced CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 mb-12 pointer-events-auto relative z-20"
          >
            <Button 
              size="lg"
              className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-xl px-8 py-4 font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-accent-500/30 hover:scale-105 group"
            >
              <span className="mr-2">🚀</span>
              Obtener Cotización Gratuita
              <motion.span
                className="inline-block ml-2"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </Button>
            <Button 
              variant="ghost-dark" 
              size="lg" 
              className="border-2 border-white/40 hover:bg-white/20 hover:border-white/60 backdrop-blur-sm rounded-xl px-8 py-4 font-semibold text-lg transition-all duration-300 group"
              asChild
            >
              <a href="#contacto" className="flex items-center">
                <span className="mr-2">📞</span>
                Hablar con un Experto
              </a>
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-3 gap-6 pt-6 border-t border-white/20"
          >
            <StatsCounter number="500+" label="Empresas certificadas" />
            <StatsCounter number="15+" label="Años de experiencia" />
            <StatsCounter number="6" label="Meses promedio" />
          </motion.div>
        </div>

        {/* -------- Certifications showcase -------- */}
        <div className="lg:col-span-5 xl:col-span-5 relative mt-12 lg:mt-0 z-10">
          {/* Capa para efectos visuales y transformaciones - NO contiene texto */}
          <motion.div 
            ref={certificationsEffectsContainerRef}
            style={{ y: y2 }} 
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            {/* Esta capa solo recibe transformaciones pero no contiene texto */}
          </motion.div>

          {/* Certifications content - sin transformaciones de scroll */}
          <div className="bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm rounded-2xl border border-white/20 p-6 lg:p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 mb-4 shadow-lg"
              >
                <span className="text-2xl">🏆</span>
              </motion.div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-2">Certificación Garantizada</h3>
              <p className="text-white/80 text-lg">Metodología probada y respaldada</p>
            </div>

            {/* ISO Badges with enhanced animation */}
            <div className="flex justify-center space-x-3 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <IsoBadge standard="9001" variant="primary" label="Calidad" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <IsoBadge standard="14001" variant="accent" label="Ambiente" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
              >
                <IsoBadge standard="45001" variant="gold" label="Seguridad" />
              </motion.div>
            </div>

            {/* Value propositions */}
            <div className="space-y-4 mb-8">
              {[
                "Acompañamiento integral de principio a fin",
                "Garantía de certificación en primera auditoría",
                "Soporte post-certificación incluido"
              ].map((text, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 + index * 0.1 }}
                  className="flex items-center text-white/90"
                >
                  <span className="text-accent-400 mr-3 text-lg">✓</span>
                  <span>{text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="text-center relative z-10 pointer-events-auto"
            >
              <Button
                size="lg"
                className="w-full text-primary-800 hover:bg-gray-100 font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <a href="/cotizar" className="w-full h-full flex items-center justify-center">
                  Comenzar mi certificación
                </a>
              </Button>
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-20 h-20 border-2 border-accent-500/30 rounded-full opacity-60" />
            <div className="absolute -bottom-3 -left-3 w-16 h-16 border-2 border-primary-400/30 rounded-full opacity-40" />
            
            {/* Corner accents */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-accent-500/50 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary-400/50 rounded-bl-3xl" />
          </div>
        </div>
      </div>
      {/* Transición ultra-sutil hacia Services */}
      <SectionConnector 
        fromSection="hero" 
        toSection="services" 
        type="minimal"
        height={40}
      />
    </section>
  )
}

export default Hero