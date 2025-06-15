import { FC } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Button from '../../ui/button'
import IsoBadge from '../../ui/IsoBadge'
import { cn } from '../../../lib/utils'

// Abstract shape SVG - geometric pattern for background
const AbstractShape = () => (
  <svg 
    className="absolute -bottom-1 left-0 w-full text-primary-800 opacity-30"
    viewBox="0 0 1440 320"
    fill="currentColor"
    preserveAspectRatio="none"
  >
    <path d="M0,96L48,128C96,160,192,224,288,229.3C384,235,480,181,576,170.7C672,160,768,192,864,192C960,192,1056,160,1152,138.7C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
  </svg>
)

// Dots pattern element
const DotsPattern = () => (
  <div className="absolute right-0 top-1/4 w-64 h-64 -z-10 opacity-20">
    <div className="absolute w-full h-full inset-0 grid grid-cols-6 gap-3">
      {Array.from({ length: 36 }).map((_, i) => (
        <div key={i} className="w-2 h-2 bg-white rounded-full"></div>
      ))}
    </div>
  </div>
)

const Hero: FC = () => {
  // Parallax effect settings
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -100]); // slower scrolling for text
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);  // medium scroll for decorative element
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  return (
    <section
      id="home"
      className="relative bg-hero-pattern text-white overflow-hidden pt-36 pb-28 md:pt-48 md:pb-40"
    >
      {/* Grid pattern background with improved styling */}
      <div className="absolute inset-0 bg-grid-white bg-[length:20px_20px] opacity-15" />
      
      {/* Decorative elements */}
      <DotsPattern />
      
      {/* Wave shape at the bottom */}
      <AbstractShape />

      <div className="relative container mx-auto px-4 lg:grid lg:grid-cols-12 lg:gap-10">
        {/* -------- Text content with parallax -------- */}
        <motion.div
          style={{ y: y1, opacity }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="lg:col-span-7 xl:col-span-6"
        >
          <div className="inline-flex items-center mb-4 py-1 px-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="inline-block w-2 h-2 rounded-full bg-accent-500 mr-2"></span>
            <span className="text-sm font-medium text-white">Expertos en Certificación ISO</span>
          </div>

          <h1 className="font-display font-extrabold leading-tight text-4xl md:text-5xl xl:text-6xl">
            Soluciones{' '}
            <span className="relative">
              <span className="relative z-10 text-white">integrales</span>
              <span className="absolute inset-x-0 bottom-2 h-3 bg-accent-500/40 z-0 "></span>
            </span>{' '}
            en seguridad, salud y medio&nbsp;ambiente
          </h1>

          <p className="mt-6 max-w-2xl text-lg md:text-xl text-white/80 leading-relaxed">
            Más de 15 años apoyando a empresas chilenas para cumplir y
            certificarse en ISO 9001, 14001 y 45001, además de protocolos MINSAL.
          </p>

          <div className="mt-10 flex flex-wrap gap-5">
            <Button 
              size="lg"
              className="bg-accent-500 hover:bg-accent-600 text-white rounded-lg px-7 py-3 font-medium transition-all shadow-lg hover:shadow-accent-500/25"
            >
              Nuestros servicios
            </Button>
            <Button 
              variant="ghost-dark" 
              size="lg" 
              className="border border-white/30 hover:bg-white/20 backdrop-blur-sm rounded-lg"
              asChild
            >
              <a href="#contacto">Agenda una reunión</a>
            </Button>
          </div>
        </motion.div>

        {/* -------- Decorative block with parallax -------- */}
        <motion.div
          style={{ y: y2 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 flex items-center justify-center lg:col-span-5 xl:col-span-6 lg:mt-0"
        >
          <div className={cn(
            "h-80 w-full max-w-md rounded-2xl p-8",
            "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm", 
            "border border-white/20 shadow-elevated relative flex flex-col items-center justify-center"
          )}>
            {/* ISO Badges */}
            <div className="flex justify-center space-x-4 mb-4">
              <IsoBadge standard="9001" variant="primary" label="Calidad" />
              <IsoBadge standard="14001" variant="accent" label="Ambiente" />
              <IsoBadge standard="45001" variant="gold" label="Seguridad" />
            </div>

            <h3 className="text-2xl font-semibold mt-4">Certificación Garantizada</h3>
            <span className="mt-4 inline-block h-1 w-20 rounded-full bg-gradient-to-r from-accent-500 to-primary-500" />
            <p className="mt-4 text-center text-white/80">
              Acompañamiento integral de principio a fin para asegurar una certificación exitosa
            </p>
            
            {/* Decorative corner accents */}
            <div className="absolute top-0 right-0 w-14 h-14 border-t-2 border-r-2 border-white/30 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-14 h-14 border-b-2 border-l-2 border-white/30 rounded-bl-2xl"></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
