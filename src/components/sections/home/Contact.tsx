import type { FC } from 'react'
import { useState } from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../../ui/button'
import { cn } from '../../../lib/utils'

// ───────────────────────────────────────────────────────────
//  FORMULARIO DE CONTACTO
// ───────────────────────────────────────────────────────────
const EnhancedContactForm = () => {
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
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsSubmitted(true)

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
    }, 4000)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
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
      // ⭐ centrado y ancho máximo en dispositivos pequeños
      className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden w-full max-w-md lg:max-w-none mx-auto"
    >
      {/* Decoración superior */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />
      {/* Esquinas decorativas */}
      <div className="absolute top-4 right-4 w-20 h-20 border border-primary-200/30 rounded-full opacity-20" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border border-accent-200/30 rounded-full opacity-15" />

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
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              ¡Mensaje enviado!
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Gracias por contactarnos. Te responderemos en menos de 24 horas.
            </p>
            <div className="inline-flex items-center text-sm text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-full">
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
            {/* Título */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  Solicita tu cotización gratuita
                </h3>
                <p className="text-gray-600 text-lg">
                  Completa el formulario y te contactaremos en menos de 24
                  horas
                </p>
              </motion.div>
            </div>

            {/* Nombre + Email */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none hover:border-gray-300"
                  placeholder="Tu nombre completo"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email corporativo *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none hover:border-gray-300"
                  placeholder="nombre@empresa.com"
                />
              </motion.div>
            </div>

            {/* Empresa + Teléfono */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Empresa *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none hover:border-gray-300"
                  placeholder="Nombre de tu empresa"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none hover:border-gray-300"
                  placeholder="+56 9 1234 5678"
                />
              </motion.div>
            </div>

            {/* Servicio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Servicio de interés
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none hover:border-gray-300"
              >
                <option value="">Selecciona un servicio</option>
                {services.map(service => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Mensaje */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 outline-none resize-none hover:border-gray-300"
                placeholder="Cuéntanos sobre tu proyecto y cómo podemos ayudarte..."
              />
            </motion.div>

            {/* Botón */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
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
            </motion.div>

            <p className="text-xs text-gray-500 text-center">
              Al enviar este formulario, aceptas que nos pongamos en contacto
              contigo para brindarte información sobre nuestros servicios.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ───────────────────────────────────────────────────────────
//  TARJETA DE CONTACTO
// ───────────────────────────────────────────────────────────
const EnhancedContactCard = ({
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
      hover: 'hover:from-primary-100 hover:to-primary-50',
      border: 'border-primary-200/50'
    },
    accent: {
      bg: 'from-accent-50 to-accent-100/50',
      icon: 'bg-accent-100 text-accent-700',
      hover: 'hover:from-accent-100 hover:to-accent-50',
      border: 'border-accent-200/50'
    },
    success: {
      bg: 'from-green-50 to-green-100/50',
      icon: 'bg-green-100 text-green-700',
      hover: 'hover:from-green-100 hover:to-green-50',
      border: 'border-green-200/50'
    }
  }

  const style = variants[variant]

  return (
    <motion.a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-4 rounded-2xl p-6 bg-gradient-to-br border shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden',
        style.bg,
        style.hover,
        style.border
      )}
    >
      {/* Línea decorativa */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60',
          variant === 'primary'
            ? 'from-primary-500 to-primary-600'
            : variant === 'accent'
            ? 'from-accent-500 to-accent-600'
            : 'from-green-500 to-green-600'
        )}
      />

      <motion.div
        className={cn(
          'rounded-xl p-3 transition-all duration-300 shadow-md',
          style.icon
        )}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <Icon className="h-6 w-6" />
      </motion.div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
          {subtitle}
        </p>
      </div>
      <motion.div
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        whileHover={{ scale: 1.1 }}
      >
        <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
          <Send className="w-4 h-4 text-gray-600" />
        </div>
      </motion.div>
    </motion.a>
  )
}

// ───────────────────────────────────────────────────────────
//  SECCIÓN CONTACTO
// ───────────────────────────────────────────────────────────
const Contact: FC = () => {
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, duration: 0.6 }
    }
  }

  const itemAnimation = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' as const }
    }
  }

  return (
    <section
      id="contact"
      className="section-unified-bg section-contact-bg content-overlay relative py-16 md:py-20 lg:py-24"
    >
      {/* Patrón de fondo */}
      <div className="section-overlay-pattern bg-noise-pattern opacity-30" />
      {/* Transición borrosa desde Testimonials */}
      <div className="blur-transition-element blur-transition-top floating-transition" />

      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 px-4"
      >
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-block py-2 px-4 rounded-full bg-accent-500/30 text-white text-sm font-medium mb-3 backdrop-blur-sm shadow-sm"
        >
          <span className="mr-2">📞</span>
          Contáctanos
        </motion.span>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white leading-tight">
          ¿Listo para{' '}
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent-300 to-accent-500">
              comenzar
            </span>
            <motion.span
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute inset-x-0 bottom-1 h-3 bg-gradient-to-r from-primary-200 to-accent-200 rounded-lg"
            />
          </span>
          <br />tu transformación?
        </h2>

        <p className="mt-6 mx-auto max-w-3xl text-lg md:text-xl text-white/80 leading-relaxed">
          Agenda una{' '}
          <span className="font-semibold text-accent-300">
            consulta gratuita
          </span>{' '}
          y descubre cómo podemos ayudarte a certificar tu empresa en tiempo
          récord.
        </p>
      </motion.div>

      {/* ───────────── CONTENIDO PRINCIPAL ───────────── */}
      <div className="max-w-7xl mx-auto px-4 w-full"> {/* ⭐ w-full */}
        <div
          // ⭐ una columna en mobile, 12 columnas en desktop
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full"
        >
          {/* Formulario */}
          <div className="col-span-1 lg:col-span-7 w-full"> {/* ⭐ */}
            <EnhancedContactForm />
          </div>

          {/* Tarjetas de contacto */}
          <div className="col-span-1 lg:col-span-5 w-full"> {/* ⭐ */}
            <motion.div
              variants={containerAnimation}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-6"
            >
              <motion.div variants={itemAnimation}>
                <h3 className="text-2xl font-bold text-white mb-6">
                  Otras formas de contacto
                </h3>
              </motion.div>

              <motion.div variants={itemAnimation}>
                <EnhancedContactCard
                  icon={MessageSquare}
                  title="WhatsApp Business"
                  subtitle="Respuesta inmediata en horario laboral"
                  href="https://wa.me/+56987501114"
                  variant="success"
                  external
                />
              </motion.div>

              <motion.div variants={itemAnimation}>
                <EnhancedContactCard
                  icon={Phone}
                  title="+56 9 8750 1114"
                  subtitle="Llámanos de Lun-Vie 9:00-18:00"
                  href="tel:+56987501114"
                  variant="primary"
                />
              </motion.div>

              <motion.div variants={itemAnimation}>
                <EnhancedContactCard
                  icon={Mail}
                  title="contacto@stegmaierconsulting.cl"
                  subtitle="Envíanos un email detallado"
                  href="mailto:contacto@stegmaierconsulting.cl"
                  variant="accent"
                />
              </motion.div>

              <motion.div variants={itemAnimation}>
                <EnhancedContactCard
                  icon={Calendar}
                  title="Agendar reunión"
                  subtitle="Reserva una cita de 30 min sin costo"
                  href="#"
                  variant="primary"
                />
              </motion.div>

              {/* Oficina */}
              <motion.div
                variants={itemAnimation}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg mt-8 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500" />
                <div className="flex items-start gap-4">
                  <motion.div
                    className="bg-primary-100 p-3 rounded-xl shadow-md"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <MapPin className="w-6 h-6 text-primary-700" />
                  </motion.div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      Nuestras oficinas
                    </h4>
                    <p className="text-gray-600 mb-1">
                      Peñuelas 2440, Quilpué
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      Atendemos presencial y remoto en todo Chile
                    </p>

                    <div className="flex items-center text-sm text-primary-600 font-semibold bg-primary-50 px-3 py-2 rounded-full">
                      <Clock className="w-4 h-4 mr-2" />
                      Lun-Vie 9:00-18:00
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Indicadores de confianza */}
              <motion.div
                variants={itemAnimation}
                className="grid grid-cols-3 gap-4 pt-6"
              >
                {[
                  {
                    icon: '⚡',
                    label: 'Respuesta < 24h',
                    color: 'text-yellow-600'
                  },
                  {
                    icon: '🔒',
                    label: 'Información segura',
                    color: 'text-green-600'
                  },
                  {
                    icon: '✅',
                    label: 'Sin compromiso',
                    color: 'text-blue-600'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="text-center p-4 bg-white/70 rounded-xl border border-gray-100 shadow-sm"
                  >
                    <motion.div
                      className="text-3xl mb-2"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    >
                      {item.icon}
                    </motion.div>
                    <div className="text-xs text-gray-600 font-medium">
                      {item.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA final */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-center mt-16 p-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl text-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-grid-white bg-[length:20px_20px] opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-400 via-white/30 to-accent-400" />
        <div className="absolute -top-10 -right-10 w-40 h-40 border border-white/10 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 border border-white/10 rounded-full" />

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              ¿Prefieres que te llamemos nosotros?
            </h3>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Déjanos tu número y un consultor senior te contactará en el
              horario que prefieras.
            </p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className="text-primary-700 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="mr-2">📞</span>
              Solicitar llamada
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export default Contact
