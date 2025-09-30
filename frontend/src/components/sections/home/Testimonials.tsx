import { FC, useState, useEffect } from 'react'
import { Quote, Star, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../lib/utils'
import Button from '../../ui/button'
import React from 'react';
import SectionConnector from '../../ui/SectionConnector'

const testimonials = [
  {
    id: 1,
    name: 'María López',
    role: 'Gerente de SSMA',
    company: 'Minera Andes',
    quote: 'Stegmaier nos llevó de cero a la certificación ISO 45001 en tiempo récord. Su acompañamiento constante y metodología clara marcó la diferencia en nuestro proceso.',
    rating: 5,
    variant: 'primary' as const,
    industry: 'Minería',
    certifications: ['ISO 45001'],
    timeframe: '5 meses',
    improvement: 'Reducción del 60% en incidentes laborales',
    avatar: '👩‍💼'
  },
  {
    id: 2,
    name: 'José Fernández',
    role: 'Subgerente de Calidad',
    company: 'Alimentos del Sur',
    quote: 'Diseñaron un plan claro y detallado. Hoy operamos bajo ISO 9001 con procesos mucho más eficientes y un equipo completamente capacitado.',
    rating: 5,
    variant: 'accent' as const,
    industry: 'Alimentos',
    certifications: ['ISO 9001'],
    timeframe: '4 meses',
    improvement: 'Aumento del 30% en eficiencia operacional',
    avatar: '👨‍💼'
  },
  {
    id: 3,
    name: 'Ana Rodríguez',
    role: 'Directora de Operaciones',
    company: 'Textil Innovación',
    quote: 'El equipo de Stegmaier superó nuestras expectativas. No solo logramos la certificación ISO 14001, sino que implementamos una cultura ambiental sólida.',
    rating: 5,
    variant: 'gold' as const,
    industry: 'Textil',
    certifications: ['ISO 14001'],
    timeframe: '6 meses',
    improvement: 'Reducción del 40% en consumo de agua',
    avatar: '👩‍🏭'
  },
  {
    id: 4,
    name: 'Carlos Mendoza',
    role: 'Gerente General',
    company: 'Construcciones del Norte',
    quote: 'Gracias a su expertise conseguimos las tres certificaciones que necesitábamos. Su soporte post-certificación ha sido fundamental para mantener los estándares.',
    rating: 5,
    variant: 'primary' as const,
    industry: 'Construcción',
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 45001'],
    timeframe: '8 meses',
    improvement: 'Triple certificación exitosa',
    avatar: '👨‍🏗️'
  }
]

// Enhanced decorative background elements with unified system
const TestimonialsBackground = () => (
  <div className="minimal-decorations">
    {/* Figuras geométricas minimalistas del sistema unificado */}
    <div className="geometric-accent-1"></div>
    <div className="geometric-accent-2"></div>
    
    {/* Patrones de fondo */}
    <div className="absolute inset-0 minimal-grid"></div>
    
    {/* Elementos característicos de testimonials */}
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 blur-3xl"
    />
    
    <motion.div
      animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.2, 0.4, 0.2]
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute -right-40 top-20 w-96 h-96 rounded-full bg-white/5 blur-3xl"
    />

    {/* Partículas flotantes - mantenemos este efecto característico pero adaptado al sistema */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        animate={{
          y: [-20, -40, -20],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.3
        }}
        className="absolute w-2 h-2 bg-white/30 rounded-full"
        style={{
          left: `${15 + (i * 10)}%`,
          top: `${20 + (i % 3) * 20}%`
        }}
      />
    ))}
  </div>
)

// Stats component for testimonials
const TestimonialStats = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay: 0.2 }}
    className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg"
  >
    {[
      { number: "4.9", label: "Calificación promedio", icon: "⭐", suffix: "/5" },
      { number: "100%", label: "Clientes satisfechos", icon: "😊", suffix: "" },
      { number: "500+", label: "Testimonios positivos", icon: "💬", suffix: "" },
      { number: "15+", label: "Años de experiencia", icon: "🏆", suffix: "" }
    ].map((stat, index) => (
      <motion.div
        key={index}
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="text-center group hover:scale-105 transition-transform duration-300"
      >
        <div className="text-2xl mb-2">{stat.icon}</div>
        <div className="text-xl md:text-2xl font-bold text-primary-700 mb-1">
          {stat.number}{stat.suffix}
        </div>
        <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
      </motion.div>
    ))}
  </motion.div>
)

const Testimonials: FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPlaying])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  // Animation variants
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.6
      }
    }
  }

  // Generate star rating with animation
  const renderStars = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
      >
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      </motion.div>
    ))
  }

  // Card style variants
  const cardStyles = {
    primary: {
      gradient: "from-primary-50 to-primary-100/30",
      border: "border-primary-200",
      accent: "from-primary-500 to-primary-600",
      icon: "text-primary-600 bg-primary-100"
    },
    accent: {
      gradient: "from-accent-50 to-accent-100/30",
      border: "border-accent-200", 
      accent: "from-accent-500 to-accent-600",
      icon: "text-accent-600 bg-accent-100"
    },
    gold: {
      gradient: "from-gold-50 to-gold-100/30",
      border: "border-gold-200",
      accent: "from-gold-500 to-gold-600", 
      icon: "text-gold-600 bg-gold-100"
    }
  }

  const currentTestimonial = testimonials[currentIndex]
  const styles = cardStyles[currentTestimonial.variant]

  return (
    <section
      id="testimonials"
      className="section-unified-bg section-testimonials-bg content-overlay relative py-16 md:py-20 lg:py-24"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-dots-pattern"></div>
      
      {/* Elementos difuminados para suavizar la transición desde Process */}
      <div className="blur-transition-element blur-transition-top floating-transition"></div>

      {/* Animación de ondas sutiles */}
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute left-0 w-full" style={{ top: '15%' }} viewBox="0 0 1440 30" preserveAspectRatio="none">
          <path d="M0,20L48,18.7C96,17,192,13,288,13.3C384,13,480,17,576,20C672,23,768,27,864,23.3C960,20,1056,10,1152,6.7C1248,3,1344,7,1392,8.7L1440,10L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" 
                fill="rgba(255,255,255,0.1)" />
        </svg>
      </div>

      {/* Enhanced background elements */}
      <TestimonialsBackground />
      
      <div className="container mx-auto px-4 max-w-6xl content-overlay">
        {/* Enhanced header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.span 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block py-2 px-4 rounded-full bg-accent-500/30 text-white text-sm font-medium mb-3 backdrop-blur-sm shadow-sm"
          >
            <span className="mr-2">💬</span>
            Testimonios de Clientes
          </motion.span>
          
          <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-display font-black text-white leading-tight">
            Historias de{' '}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">
                éxito
              </span>
              <motion.span
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute inset-x-0 bottom-1 h-3 bg-gradient-to-r from-primary-200 to-accent-200 rounded-lg"
              />
            </span>
            <br />que nos inspiran
          </h2>
          
          <p className="mt-6 mx-auto max-w-3xl text-lg md:text-xl text-white/80 leading-relaxed">
            Descubre como hemos ayudado a nuestros clientes en diferentes industrias a través de nuestra gestión, acompañándolos hacia la 
            <span className="font-semibold text-accent-300">excelencia operacional.</span>
          </p>
        </motion.div>

        {/* Stats section */}
        <TestimonialStats />

        {/* Main testimonial carousel */}
        <motion.div
          variants={containerAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Carousel controls */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <button
              onClick={prevTestimonial}
              className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group border border-gray-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
            </button>

            <div className="flex items-center gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300 border",
                    index === currentIndex 
                      ? "bg-white border-white w-8 shadow-md" 
                      : "bg-white/40 border-white/60 hover:bg-white hover:border-white"
                  )}
                />
              ))}
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group border border-gray-100"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
              ) : (
                <Play className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
              )}
            </button>

            <button
              onClick={nextTestimonial}
              className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group border border-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
            </button>
          </div>

          {/* Featured testimonial */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="max-w-4xl mx-auto"
            >
              <div className={cn(
                "rounded-3xl p-8 lg:p-12 relative overflow-hidden",
                "bg-gradient-to-br border shadow-2xl",
                "hover:scale-[1.02] transition-all duration-500",
                styles.gradient,
                styles.border
              )}>
                {/* Decorative elements */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r",
                  styles.accent
                )} />
                
                <div className="absolute top-6 right-6 opacity-10">
                  <Quote className="w-24 h-24 text-gray-900" />
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-center">
                  {/* Content */}
                  <div className="lg:col-span-8">
                    {/* Quote */}
                    <div className="mb-6">
                      <div className={cn(
                        "inline-flex items-center justify-center w-12 h-12 rounded-full mb-4",
                        styles.icon
                      )}>
                        <Quote className="w-6 h-6" />
                      </div>
                      <blockquote className="text-xl lg:text-2xl text-gray-700 leading-relaxed font-medium">
                        "{currentTestimonial.quote}"
                      </blockquote>
                    </div>

                    {/* Author info */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl border-2 border-white shadow-lg">
                        {currentTestimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-gray-900">
                          {currentTestimonial.name}
                        </div>
                        <div className="text-gray-600">
                          {currentTestimonial.role} · {currentTestimonial.company}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {renderStars(currentTestimonial.rating)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results sidebar */}
                  <div className="lg:col-span-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-lg">
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">Resultados del Proyecto</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Industria</div>
                          <div className="font-semibold text-gray-900">{currentTestimonial.industry}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Certificaciones</div>
                          <div className="flex flex-wrap gap-2">
                            {currentTestimonial.certifications.map((cert, idx) => (
                              <span key={idx} className={cn(
                                "px-3 py-1 rounded-full text-xs font-semibold border border-white/70 shadow-sm",
                                "bg-accent-500/60 text-white backdrop-blur-sm"
                              )}>
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Tiempo de implementación</div>
                          <div className="font-semibold text-gray-900">{currentTestimonial.timeframe}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Mejora principal</div>
                          <div className="font-semibold text-primary-700">{currentTestimonial.improvement}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Testimonial grid preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {testimonials.map((testimonial, index) => (
              <motion.button
                key={testimonial.id}
                onClick={() => setCurrentIndex(index)}
                whileHover={{ y: -5 }}
                className={cn(
                  "p-6 rounded-xl text-left transition-all duration-300 border",
                  index === currentIndex 
                    ? "bg-primary-50 border-primary-200 shadow-lg" 
                    : "bg-white border-gray-100 hover:border-primary-200 hover:shadow-md"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{testimonial.name}</div>
                    <div className="text-xs text-gray-600">{testimonial.company}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">"{testimonial.quote}"</p>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Enhanced call to action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-white bg-[length:20px_20px] opacity-10" />
          
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              ¿Quieres ser nuestro próximo caso de éxito?
            </h3>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Únete a más de 500 empresas que han transformado sus operaciones con nuestro acompañamiento.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-primary-700 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="mr-2">🚀</span>
                Comenzar mi transformación
              </Button>
              <Button
                variant="ghost-dark"
                size="lg"
                className="border-2 border-white/40 hover:bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 font-semibold"
              >
                <span className="mr-2">📞</span>
                Hablar con un consultor
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Transición ultra-sutil hacia Contact */}
      <SectionConnector 
        fromSection="testimonials" 
        toSection="contact" 
        type="minimal"
        height={40}
      />
    </section>
  )
}

export default Testimonials