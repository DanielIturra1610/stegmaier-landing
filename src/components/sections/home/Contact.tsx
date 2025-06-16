import type { FC } from 'react'
import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Calendar, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../../ui/button'
import { cn } from '../../../lib/utils'

// Enhanced decorative background
const ContactBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Animated gradient orbs */}
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-r from-primary-200/40 to-accent-200/40 blur-3xl"
    />
    
    <motion.div
      animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.2, 0.5, 0.2]
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-r from-accent-200/40 to-primary-200/40 blur-3xl"
    />

    {/* Grid pattern */}
    <div className="absolute inset-0 bg-grid-white bg-[length:40px_40px] opacity-[0.03]" />
    
    {/* Floating particles */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        animate={{
          y: [-30, -80, -30],
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 6 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.8
        }}
        className="absolute w-3 h-3 bg-primary-300/50 rounded-full"
        style={{
          left: `${15 + (i * 10)}%`,
          top: `${20 + (i % 3) * 25}%`
        }}
      />
    ))}
  </div>
)

// Contact form component
const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    service: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const services = [
    'Consultoría ISO 9001',
    'Consultoría ISO 14001', 
    'Consultoría ISO 45001',
    'Auditoría Interna',
    'Capacitaciones',
    'Protocolos MINSAL',
    'Gestión de Riesgos',
    'Otro'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    // Reset form after success message
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        service: '',
        message: ''
      })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden"
    >
      {/* Form decoration */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500" />
      
      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h3>
            <p className="text-gray-600 mb-4">
              Gracias por contactarnos. Te responderemos en menos de 24 horas.
            </p>
            <div className="inline-flex items-center text-sm text-green-600 font-semibold">
              <Clock className="w-4 h-4 mr-2" />
              Respuesta garantizada en 24h
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Solicita tu cotización gratuita
              </h3>
              <p className="text-gray-600">
                Completa el formulario y te contactaremos en menos de 24 horas
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none"
                  placeholder="Tu nombre completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email corporativo *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none"
                  placeholder="nombre@empresa.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Empresa *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none"
                  placeholder="Nombre de tu empresa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Servicio de interés
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none"
              >
                <option value="">Selecciona un servicio</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none resize-none"
                placeholder="Cuéntanos sobre tu proyecto y cómo podemos ayudarte..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Send className="w-5 h-5 mr-2" />
                  Enviar solicitud
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Al enviar este formulario, aceptas que nos pongamos en contacto contigo para brindarte información sobre nuestros servicios.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Contact info card component
const ContactCard = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  href, 
  variant = 'primary',
  external = false 
}: {
  icon: any
  title: string
  subtitle: string
  href: string
  variant?: 'primary' | 'accent' | 'success'
  external?: boolean
}) => {
  const variants = {
    primary: {
      bg: 'from-primary-50 to-primary-100/50',
      icon: 'bg-primary-100 text-primary-700',
      hover: 'hover:from-primary-100 hover:to-primary-50'
    },
    accent: {
      bg: 'from-accent-50 to-accent-100/50',
      icon: 'bg-accent-100 text-accent-700',
      hover: 'hover:from-accent-100 hover:to-accent-50'
    },
    success: {
      bg: 'from-green-50 to-green-100/50',
      icon: 'bg-green-100 text-green-700',
      hover: 'hover:from-green-100 hover:to-green-50'
    }
  }

  const style = variants[variant]

  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-4 rounded-2xl p-6 bg-gradient-to-br border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 group",
        style.bg,
        style.hover
      )}
    >
      <div className={cn(
        "rounded-xl p-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
        style.icon
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
          <Send className="w-4 h-4 text-gray-600" />
        </div>
      </div>
    </motion.a>
  )
}

const Contact: FC = () => {
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

  const itemAnimation = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  }

  return (
    <section
      id="contacto"
      className="py-24 bg-gradient-to-br from-primary-50/50 via-white to-accent-50/30 relative overflow-hidden"
    >
      {/* Enhanced background */}
      <ContactBackground />

      <div className="container mx-auto px-4 relative z-10">
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
            className="inline-flex items-center py-2 px-4 rounded-full bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 text-sm font-semibold mb-4 shadow-sm"
          >
            <span className="mr-2">📞</span>
            Contáctanos
          </motion.span>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-gray-900 leading-tight">
            ¿Listo para{' '}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                comenzar
              </span>
              <motion.span
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute inset-x-0 bottom-1 h-3 bg-gradient-to-r from-primary-200 to-accent-200 rounded-lg"
              />
            </span>
            <br />tu transformación?
          </h2>

          <p className="mt-6 mx-auto max-w-3xl text-lg md:text-xl text-gray-600 leading-relaxed">
            Agenda una <span className="font-semibold text-primary-700">consulta gratuita</span> y 
            descubre cómo podemos ayudarte a certificar tu empresa en tiempo récord.
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Contact form */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>

            {/* Contact information */}
            <div className="lg:col-span-5">
              <motion.div
                variants={containerAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6"
              >
                <motion.div variants={itemAnimation}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Otras formas de contacto
                  </h3>
                </motion.div>

                <motion.div variants={itemAnimation}>
                  <ContactCard
                    icon={MessageSquare}
                    title="WhatsApp Business"
                    subtitle="Respuesta inmediata en horario laboral"
                    href="https://wa.me/56223456789"
                    variant="success"
                    external
                  />
                </motion.div>

                <motion.div variants={itemAnimation}>
                  <ContactCard
                    icon={Phone}
                    title="+56 2 2345 6789"
                    subtitle="Llámanos de Lun-Vie 9:00-18:00"
                    href="tel:+56223456789"
                    variant="primary"
                  />
                </motion.div>

                <motion.div variants={itemAnimation}>
                  <ContactCard
                    icon={Mail}
                    title="contacto@stegmaierconsulting.cl"
                    subtitle="Envíanos un email detallado"
                    href="mailto:contacto@stegmaierconsulting.cl"
                    variant="accent"
                  />
                </motion.div>

                <motion.div variants={itemAnimation}>
                  <ContactCard
                    icon={Calendar}
                    title="Agendar reunión"
                    subtitle="Reserva una cita de 30 min sin costo"
                    href="#"
                    variant="primary"
                  />
                </motion.div>

                {/* Office info */}
                <motion.div 
                  variants={itemAnimation}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg mt-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-primary-100 p-3 rounded-xl">
                      <MapPin className="w-6 h-6 text-primary-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Nuestras oficinas</h4>
                      <p className="text-gray-600 mb-1">Santiago, Chile</p>
                      <p className="text-sm text-gray-500 mb-3">
                        Atendemos presencial y remoto en todo Chile
                      </p>
                      
                      <div className="flex items-center text-sm text-primary-600 font-semibold">
                        <Clock className="w-4 h-4 mr-2" />
                        Lun-Vie 9:00-18:00
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Trust indicators */}
                <motion.div 
                  variants={itemAnimation}
                  className="grid grid-cols-3 gap-4 pt-6"
                >
                  {[
                    { icon: "⚡", label: "Respuesta < 24h" },
                    { icon: "🔒", label: "Información segura" },
                    { icon: "✅", label: "Sin compromiso" }
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <div className="text-xs text-gray-600 font-medium">{item.label}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-white bg-[length:20px_20px] opacity-10" />
          
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              ¿Prefieres que te llamemos nosotros?
            </h3>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Déjanos tu número y un consultor senior te contactará en el horario que prefieras.
            </p>
            <Button
              size="lg"
              className="bg-white text-primary-700 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="mr-2">📞</span>
              Solicitar llamada
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Contact