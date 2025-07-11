import { FC } from 'react'
import Button from '../../ui/button'
import IsoBadge from '../../ui/IsoBadge'
import SectionConnector from '../../ui/SectionConnector'

// Stats counter component (sin cambios)
const StatsCounter = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center">
    <div className="text-2xl md:text-3xl font-bold text-white">{number}</div>
    <div className="text-sm text-white/70 mt-1">{label}</div>
  </div>
)

const Hero: FC = () => {
  return (
    <section
      id="home"
      className="section-unified-bg section-hero-bg minimal-decorations content-overlay relative text-white overflow-hidden pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-10 lg:pb-24"
    >
      {/* Patrón de fondo sutil */}
      <div className="section-overlay-pattern bg-noise-pattern"></div>

      {/* Punto decorativo difuminado en la parte inferior */}
      <div className="blur-transition-element blur-transition-bottom"></div>
      
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
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {/* Esta capa solo recibe transformaciones pero no contiene texto */}
          </div>
        </div>

        {/* -------- Contenido de texto en una capa estática sin transformaciones -------- */}
        <div className="lg:col-span-7 xl:col-span-7 relative z-10">
          {/* Trust badge with enhanced styling */}
          <div className="inline-flex items-center mb-6 py-2 px-4 rounded-full bg-gradient-to-r from-accent-500/20 to-primary-400/20 backdrop-blur-sm border border-accent-500/30 shadow-lg">
            <span className="inline-block w-2 h-2 rounded-full bg-accent-500 mr-3"></span>
            <span className="text-sm font-semibold text-white">🏆 Líderes en Implementación de Certificación ISO desde 2008</span>
          </div>

          {/* Main headline with powerful messaging */}
          <h1 className="font-display font-black leading-[1.1] text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-6">
            Tu socio{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-white">estratégico</span>
              <span className="absolute inset-x-0 bottom-2 h-4 bg-gradient-to-r from-accent-500 to-accent-400 z-0 rounded-lg" />
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">
              para certificación ISO
            </span>
          </h1>

          {/* Enhanced value proposition */}
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl mb-8">
            <span className="font-semibold text-accent-300">Implementación garantizada</span> de{' '}
            <span className="font-semibold text-accent-300">Normas ISO</span> y{' '}
            <span className="font-semibold text-accent-300">Metodologías de mejora continua</span>{' '}
            con acompañamiento completo.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center gap-6 mb-10 text-sm text-white/80">
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
          </div>

          {/* Enhanced CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 pointer-events-auto relative z-20">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-xl px-8 py-4 font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-accent-500/30 hover:scale-105 group"
            >
              <span className="mr-2">🚀</span>
              Obtener Cotización Gratuita
              <span className="inline-block ml-2">→</span>
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
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/20">
            <StatsCounter number="500+" label="Empresas certificadas" />
            <StatsCounter number="15+" label="Años de experiencia" />
            <StatsCounter number="6" label="Meses promedio" />
          </div>
        </div>

        {/* -------- Certifications showcase -------- */}
        <div className="lg:col-span-5 xl:col-span-5 relative mt-12 lg:mt-0 z-10">
          {/* Capa para efectos visuales y transformaciones - NO contiene texto */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {/* Esta capa solo recibe transformaciones pero no contiene texto */}
          </div>

          {/* Certifications content - sin transformaciones de scroll */}
          <div className="bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm rounded-2xl border border-white/20 p-6 lg:p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 mb-4 shadow-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-2">Certificación Garantizada</h3>
              <p className="text-white/80 text-lg">Metodología comprobada y respaldada</p>
            </div>

            {/* ISO Badges with enhanced animation */}
            <div className="flex flex-col items-center space-y-4 mb-8">
              {/* Primera fila - 3 badges originales */}
              <div className="flex justify-center space-x-10">
                <div>
                  <IsoBadge standard="9001" variant="primary" label="Calidad" />
                </div>
                <div>
                  <IsoBadge standard="14001" variant="accent" label="Ambiente" />
                </div>
                <div>
                  <IsoBadge standard="45001" variant="gold" label="Seguridad y Salud" />
                </div>
              </div>
              
              {/* Segunda fila - 2 nuevos badges */}
              <div className="flex justify-center space-x-10">
                <div>
                  <IsoBadge standard="27001" variant="info" label="Inf. y Ciberseguridad" />
                </div>
                <div>
                  <IsoBadge standard="50001" variant="success" label="Gestión Energética" />
                </div>
              </div>
            </div>

            {/* Value propositions */}
            <div className="space-y-4 mb-8">
              {[
                "Acompañamiento integral de durante todo el proceso",
                "Garantía de certificación en primera auditoría externa",
                "Soporte post-implementación"
              ].map((text, index) => (
                <div
                  key={index}
                  className="flex items-center text-white/90"
                >
                  <span className="text-accent-400 mr-3 text-lg">✓</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <div className="text-center relative z-10 pointer-events-auto">
              <Button
                size="lg"
                className="w-full text-primary-800 hover:bg-gray-100 font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <a href="/cotizar" className="w-full h-full flex items-center justify-center">
                  Comenzar mi certificación
                </a>
              </Button>
            </div>
            
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