// src/components/sections/home/Services.tsx
import { FC, useState } from 'react'
import * as L from 'lucide-react'
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import ServiceCard from '../../ui/ServiceCard'
import Button from '../../ui/button'
import type { Service } from '../../../types'
import SectionConnector from '../../ui/SectionConnector'

// Enhanced decorative elements with unified background system
const FloatingShapes = () => (
  <div className="minimal-decorations">
    {/* Figuras geométricas minimalistas del sistema unificado */}
    <div className="geometric-accent-1"></div>
    <div className="geometric-accent-2"></div>
    <div className="geometric-accent-3"></div>
    
    {/* Patrón de fondo opcional */}
    <div className="absolute inset-0 minimal-grid"></div>
    
    {/* Elementos específicos de la sección servicios */}
    <motion.div
      animate={{ 
        y: [-20, 20, -20],
        opacity: [0.4, 0.7, 0.4] 
      }}
      transition={{ 
        duration: 12, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className="absolute top-20 right-20 w-32 h-32 border border-white/10 rounded-full"
    />
    
    {/* Mantener efecto blur característico de la sección */}
    <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
  </div>
)

// Stats component
const StatsSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay: 0.2 }}
    className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg"
  >
    {[
      { number: "500+", label: "Empresas certificadas", icon: "🏢" },
      { number: "15+", label: "Años de experiencia", icon: "📅" },
      { number: "100%", label: "Tasa de éxito", icon: "✅" },
      { number: "6", label: "Meses promedio", icon: "⏱️" }
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
        <div className="text-2xl md:text-3xl font-bold text-primary-700 mb-1">{stat.number}</div>
        <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
      </motion.div>
    ))}
  </motion.div>
)

const services: Service[] = [
  {
    id: 1,
    title: 'Consultorías ISO',
    desc: 'Implementación completa de ISO 9001, 14001 y 45001 con metodología probada y garantía de certificación.',
    icon: L.BadgeCheck,
    benefits: ['Diagnóstico gratuito', 'Implementación guiada', 'Garantía de certificación'],
    timeframe: '4-6 meses'
  },
  {
    id: 2,
    title: 'Auditorías Internas',
    desc: 'Evaluaciones especializadas según ISO 19011 para identificar oportunidades de mejora y fortalezas.',
    icon: L.SearchCheck,
    benefits: ['Reporte detallado', 'Plan de mejoras', 'Seguimiento continuo'],
    timeframe: '2-3 semanas'
  },
  {
    id: 3,
    title: 'Capacitaciones',
    desc: 'Programas de formación certificados en seguridad, medio ambiente y calidad para todos los niveles.',
    icon: L.GraduationCap,
    benefits: ['Certificación SENCE', 'Material incluido', 'Modalidad presencial/online'],
    timeframe: '1-5 días'
  },
  {
    id: 4,
    title: 'Protocolos MINSAL',
    desc: 'Implementación de PREXOR, TMERT, CEAL-SM y PLANESI con acompañamiento legal especializado.',
    icon: L.ShieldCheck,
    benefits: ['Cumplimiento legal', 'Asesoría jurídica', 'Documentación completa'],
    timeframe: '2-4 meses'
  },
  {
    id: 5,
    title: 'Gestión de Riesgos',
    desc: 'Implementación de metodologías para identificar, evaluar y controlar riesgos operacionales y estratégicos',
    icon: L.AlertTriangle,
    benefits: ['Riesgos organizacional', 'Riesgo laboral de seguridad y salud', 'Riesgos de desastres y emergencias'],
    timeframe: '3-4 meses'
  },
  {
    id: 6,
    title: 'Soporte Continuo',
    desc: 'Acompañamiento post-certificación con KPIs, auditorías de seguimiento y mejora continua.',
    icon: L.LifeBuoy,
    benefits: ['Monitoreo 24/7', 'Reportes mensuales', 'Soporte remoto'],
    timeframe: 'Permanente'
  },
  {
    id: 7,
    title: 'Plataforma Automatizada de Investigación de Sucesos',
    desc: 'Solución tecnológica integral para la gestión de investigación de incidentes y proyectos personalizados.',
    icon: L.Search,
    benefits: ['Metodología de árbol de causas', 'Gestión de planes de acción', 'Análisis predictivo', 'Dashboard personalizado'],
    timeframe: 'Personalizado'
  },
]

// Calculate variant based on index
const getVariant = (index: number): 'primary' | 'accent' | 'gold' => {
  const variants: ('primary' | 'accent' | 'gold')[] = ['primary', 'accent', 'gold'];
  return variants[index % variants.length];
}

const Services: FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'iso' | 'legal' | 'training' | 'technology'>('all')

  // Filter services based on category
  const filteredServices = (Array.isArray(services) ? services : []).filter(service => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'iso') return [1, 2, 5].includes(service.id)
    if (selectedCategory === 'legal') return [4].includes(service.id)
    if (selectedCategory === 'training') return [3, 6].includes(service.id)
    if (selectedCategory === 'technology') return [7].includes(service.id)
    return true
  })

  const categories = [
    { id: 'all', label: 'Todos los servicios', count: services.length },
    { id: 'iso', label: 'Certificaciones ISO', count: 3 },
    { id: 'legal', label: 'Cumplimiento Legal', count: 1 },
    { id: 'training', label: 'Capacitación', count: 2 },
    { id: 'technology', label: 'Tecnología', count: 1 }
  ]

  // Enhanced animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const titleAnimation = {
    hidden: { opacity: 0, y: -30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const } 
    }
  }

  return (
    <section
      id="services"
      className="section-unified-bg section-services-bg content-overlay relative py-16 md:py-20 lg:py-24"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-diagonal-lines"></div>
      
      {/* Elementos difuminados para suavizar la transición desde Hero */}
      <div className="blur-transition-element blur-transition-top floating-transition"></div>

      {/* Contenido de la sección */}
      <FloatingShapes />

      <div className="container mx-auto px-4 max-w-7xl content-overlay">
        {/* Enhanced header section */}
        <div className="text-center mb-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={titleAnimation}
          >
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block py-2 px-4 rounded-full bg-accent-500/30 text-white text-sm font-medium mb-3 backdrop-blur-sm shadow-sm"
            >
              <span className="mr-2">🚀</span>
              Nuestros Servicios
            </motion.span>
            
            <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-display font-black text-white leading-tight">
              Soluciones que{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">
                  transforman
                </span>
                <motion.span
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="absolute inset-x-0 bottom-1 h-3 bg-gradient-to-r from-primary-200 to-accent-200 rounded-lg"
                />
              </span>
              <br />tu empresa
            </h2>
            
            <p className="mt-6 mx-auto max-w-3xl text-lg md:text-xl text-white/80 leading-relaxed">
              Desde el diagnóstico inicial hasta la mejora continua, te acompañamos en cada etapa 
              de tu <span className="font-semibold text-accent-300">transformación organizacional</span>.
            </p>
          </motion.div>
        </div>

        {/* Stats section */}
        <StatsSection />

        {/* Category filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-accent-500 text-white shadow-lg scale-105'
                  : 'bg-primary-800/70 text-white/80 hover:bg-primary-700 hover:text-white border border-primary-600/30'
              }`}
            >
              {category.label}
              <span className="ml-2 text-xs opacity-75">({category.count})</span>
            </button>
          ))}
        </motion.div>

        {/* View mode toggle */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <div className="bg-primary-800/70 rounded-lg p-1 shadow-md border border-primary-600/30">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-accent-500 text-white shadow-sm' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <L.Grid3X3 className="w-4 h-4 inline mr-2" />
              Vista Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-accent-500 text-white shadow-sm' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <L.List className="w-4 h-4 inline mr-2" />
              Vista Lista
            </button>
          </div>
        </motion.div>

        {/* Services grid/list */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${selectedCategory}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className={
                viewMode === 'grid' 
                  ? "grid gap-8 sm:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-6"
              }
            >
              {filteredServices.map((service, index) => (
                <ServiceCard 
                  key={`${service.id}-${viewMode}`}
                  {...service} 
                  variant={getVariant(index)}
                  index={index}
                  viewMode={viewMode}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl text-white relative overflow-hidden"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 bg-grid-white bg-[length:20px_20px] opacity-10" />
          
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Impulsa tu negocio con Stegmaier Partner Consulting
            </h3>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Obtén una cotización personalizada y comienza tu proceso de certificación hoy mismo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-primary-700 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="mr-2">📞</span>
                Solicitar Cotización Gratuita
              </Button>
              <Button
                variant="ghost-dark"
                size="lg"
                className="border-2 border-white/40 hover:bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4 font-semibold"
              >
                <span className="mr-2">📄</span>
                Descargar Brochure
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Conector a la siguiente sección con patrón de puntos */}
      <SectionConnector fromSection="services" toSection="process" type="dots" height={250} />
    </section>
  )
}

export default Services