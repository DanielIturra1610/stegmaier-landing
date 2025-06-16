import { FC } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Button from '../../ui/button'
import IsoBadge from '../../ui/IsoBadge'
import { cn } from '../../../lib/utils'

// Enhanced Abstract shape SVG with more dynamic curves
const AbstractShape = () => (
  <svg 
    className="absolute -bottom-1 left-0 w-full text-primary-800/40 opacity-60"
    viewBox="0 0 1440 320"
    fill="currentColor"
    preserveAspectRatio="none"
  >
    <path d="M0,160L48,154.7C96,149,192,139,288,149.3C384,160,480,192,576,197.3C672,203,768,181,864,170.7C960,160,1056,160,1152,176C1248,192,1344,224,1392,240L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
  </svg>
)

// Enhanced floating elements
const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Floating circles */}
    <motion.div
      animate={{ y: [-10, 10, -10] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/4 right-1/4 w-20 h-20 rounded-full bg-accent-500/10 backdrop-blur-sm"
    />
    <motion.div
      animate={{ y: [15, -15, 15] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-3/4 left-1/3 w-32 h-32 rounded-full bg-primary-400/10 backdrop-blur-sm"
    />
    
    {/* Geometric shapes */}
    <motion.div
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/3 right-1/6 w-6 h-6 border-2 border-white/20 rotate-45"
    />
    
    {/* Dots pattern */}
    <div className="absolute right-10 top-1/4 w-40 h-40 opacity-20">
      <div className="absolute w-full h-full inset-0 grid grid-cols-8 gap-2">
        {Array.from({ length: 64 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
            className="w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>
    </div>
  </div>
)

// Stats counter component
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
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  return (
    <section
      id="home"
      className="relative bg-hero-pattern text-white overflow-hidden pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-28 lg:pb-24"
    >
      {/* Enhanced grid pattern background */}
      <div className="absolute inset-0 bg-grid-white bg-[length:40px_40px] opacity-[0.08]" />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/80 to-primary-700/90" />
      
      {/* Floating decorative elements */}
      <FloatingElements />
      
      {/* Wave shape at the bottom */}
      <AbstractShape />

      <div className="relative container mx-auto px-4 lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16">
        {/* -------- Enhanced Text content -------- */}
        <motion.div
          style={{ y: y1 }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="lg:col-span-7 xl:col-span-7"
        >
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
            className="flex flex-col sm:flex-row gap-4 mb-12"
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
        </motion.div>

        {/* -------- Enhanced certification showcase -------- */}
        <motion.div
          style={{ y: y2 }}
          initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-16 lg:mt-0 lg:col-span-5 xl:col-span-5 flex items-center justify-center"
        >
          <div className={cn(
            "relative w-full max-w-lg mx-auto",
            "bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg", 
            "border border-white/30 shadow-2xl rounded-3xl p-8 lg:p-10",
            "transform hover:scale-105 transition-all duration-500"
          )}>
            {/* Glowing effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-accent-500/20 to-primary-400/20 blur-xl opacity-50 -z-10" />
            
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
              className="text-center"
            >
              <Button
                size="lg"
                className="w-full text-primary-800 hover:bg-gray-100 font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Comenzar mi certificación
              </Button>
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-20 h-20 border-2 border-accent-500/30 rounded-full opacity-60" />
            <div className="absolute -bottom-3 -left-3 w-16 h-16 border-2 border-primary-400/30 rounded-full opacity-40" />
            
            {/* Corner accents */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-accent-500/50 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary-400/50 rounded-bl-3xl" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero