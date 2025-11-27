import type { FC } from 'react'
import { useState } from 'react'
import React from 'react';
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
import { Button } from '../../ui/button'
import { cn } from '../../../lib/utils'
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'


// ───────────────────────────────────────────────────────────
//  FORMULARIO DE CONTACTO
// ───────────────────────────────────────────────────────────
const EnhancedContactForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Schema de validación con Yup
  const contactSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .required('El nombre es obligatorio'),
    email: Yup.string()
      .email('Email inválido')
      .required('El email es obligatorio'),
    phone: Yup.string()
      .matches(/^[0-9+\s()-]{0,20}$/, 'Formato de teléfono inválido')
      .notRequired(),
    service: Yup.string()
      .required('Por favor selecciona un servicio'),
    message: Yup.string()
      .min(10, 'El mensaje es demasiado corto (mínimo 10 caracteres)')
      .required('El mensaje es obligatorio'),
    _gotcha: Yup.string() // Campo honeypot oculto
  });

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

  // Definir la interfaz para los valores del formulario
  interface ContactFormValues {
    name: string;
    email: string;
    phone: string;
    company: string;
    service: string;
    message: string;
    gotcha: string;
  }

  // URL base para API
  const API_URL = typeof window !== 'undefined' ? 
    window.location.origin : 
    'https://stegmaier-landing.vercel.app';

  const handleSubmit = async (
    values: ContactFormValues, 
    { setSubmitting, resetForm }: FormikHelpers<ContactFormValues>
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      setSubmitting(false);
      
      if (data.success) {
        // Mostrar toast de éxito
        toast.success('¡Mensaje enviado! Responderemos en menos de 24h');
        setIsSubmitted(true);
        resetForm();
        
        // Resetear después de 4 segundos
        setTimeout(() => {
          setIsSubmitted(false);
        }, 4000);
        
        // Loguear el messageId para debug si existe
        if (data.messageId) {
          console.log('Email enviado con ID:', data.messageId);
        }
      } else {
        console.error('Error en la respuesta:', data);
        toast.error(data.message || 'Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      toast.error('Error de conexión. Por favor intenta nuevamente.');
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      // Mejorando responsive para dispositivos móviles
      className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border border-gray-100 relative overflow-hidden w-full max-w-md lg:max-w-none mx-auto"
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
            className="text-center py-8 md:py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
            >
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </motion.div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              ¡Mensaje enviado!
            </h3>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
              Gracias por contactarnos. Te responderemos en menos de 24 horas.
            </p>
            <div className="inline-flex items-center text-xs sm:text-sm text-green-600 font-semibold bg-green-50 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Respuesta garantizada en 24h
            </div>
          </motion.div>
        ) : (
          <Formik
            initialValues={{
              name: '',
              email: '',
              phone: '',
              company: '',
              service: '',
              message: '',
              gotcha: '' // Campo honeypot
            }}
            validationSchema={contactSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="px-1 sm:px-2">
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


                <div className="space-y-3 sm:space-y-4">
                  {/* Campo honeypot oculto */}
                  <Field 
                    type="text" 
                    name="_gotcha" 
                    style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }} 
                  />

                  {/* Nombre */}
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                    >
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="name"
                      type="text"
                      className={cn(
                        "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white rounded-lg border focus:outline-none focus:ring-2 transition-shadow", 
                        errors.name && touched.name ? 
                          "border-red-300 focus:ring-red-200" : 
                          "border-gray-300 focus:ring-primary-200"
                      )}
                      placeholder="Ingresa tu nombre"
                    />
                    <ErrorMessage 
                      name="name" 
                      component="div" 
                      className="text-xs sm:text-sm text-red-600 mt-1" 
                    />
                  </div>

                  {/* Email y Teléfono en grid responsive */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                      >
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Field
                        name="email"
                        type="email"
                        className={cn(
                          "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white rounded-lg border focus:outline-none focus:ring-2 transition-shadow", 
                          errors.email && touched.email ? 
                            "border-red-300 focus:ring-red-200" : 
                            "border-gray-300 focus:ring-primary-200"
                        )}
                        placeholder="tu@email.com"
                      />
                      <ErrorMessage 
                        name="email" 
                        component="div" 
                        className="text-xs sm:text-sm text-red-600 mt-1" 
                      />
                    </div>

                    <div>
                      <label 
                        htmlFor="phone" 
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                      >
                        Teléfono <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <Field
                        name="phone"
                        type="text"
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-shadow"
                        placeholder="+56 9 1234 5678"
                      />
                      <ErrorMessage 
                        name="phone" 
                        component="div" 
                        className="text-xs sm:text-sm text-red-600 mt-1" 
                      />
                    </div>
                  </div>

                  {/* Empresa y Servicio en grid responsive */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label 
                        htmlFor="company" 
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                      >
                        Empresa <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <Field
                        name="company"
                        type="text"
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-shadow"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>

                    <div>
                      <label 
                        htmlFor="service" 
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                      >
                        Servicio <span className="text-red-500">*</span>
                      </label>
                      <Field
                        as="select"
                        name="service"
                        className={cn(
                          "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white rounded-lg border focus:outline-none focus:ring-2 transition-shadow appearance-none", 
                          errors.service && touched.service ? 
                            "border-red-300 focus:ring-red-200" : 
                            "border-gray-300 focus:ring-primary-200"
                        )}
                      >
                        <option value="">Selecciona un servicio</option>
                        {services.map((service, index) => (
                          <option key={index} value={service}>
                            {service}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage 
                        name="service" 
                        component="div" 
                        className="text-xs sm:text-sm text-red-600 mt-1" 
                      />
                    </div>
                  </div>

                  {/* Mensaje */}
                  <div>
                    <label 
                      htmlFor="message" 
                      className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                    >
                      Mensaje <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="textarea"
                      name="message"
                      className={cn(
                        "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-white rounded-lg border focus:outline-none focus:ring-2 transition-shadow resize-none", 
                        errors.message && touched.message ? 
                          "border-red-300 focus:ring-red-200" : 
                          "border-gray-300 focus:ring-primary-200"
                      )}
                      placeholder="¿En qué podemos ayudarte?"
                      rows={4}
                    />
                    <ErrorMessage 
                      name="message" 
                      component="div" 
                      className="text-xs sm:text-sm text-red-600 mt-1" 
                    />
                  </div>

                  {/* Botón de envío */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        "w-full flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all",
                        isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:translate-y-[-2px]"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Enviar Mensaje
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Política de privacidad */}
                  <p className="text-center text-xs sm:text-sm text-gray-500 mt-4">
                    Al enviar este formulario, aceptas nuestra{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500 hover:underline">
                      Política de Privacidad
                    </a>
                  </p>
                </div>
              </Form>
            )}
          </Formik>
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
          y descubre cómo podemos ayudarte a llegar al siguiente nivel en tiempo récords.
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
                  subtitle="Respuesta inmediata"
                  href="https://wa.me/+56987501114"
                  variant="success"
                  external
                />
              </motion.div>

              <motion.div variants={itemAnimation}>
                <EnhancedContactCard
                  icon={Phone}
                  title="+56 9 8750 1114"
                  subtitle="Disponibles 24/7, todos los días"
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
                      Casa Matriz
                    </h4>
                    <p className="text-gray-600 mb-1">
                      Peñuelas 2440, Quilpué
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      Atendemos presencial y remoto en todo Chile
                    </p>
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