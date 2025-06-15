// src/components/sections/home/Services.tsx
import { FC } from 'react'
import * as L from 'lucide-react'
import { motion } from 'framer-motion'
import ServiceCard from '../../ui/ServiceCard'
import type { Service } from '../../../types'

// Custom decorative elements
const DiagonalPattern = () => (
  <div className="absolute -right-48 -top-32 w-96 h-96 opacity-5 -z-10 rotate-12">
    <div className="w-full h-full border-8 border-primary-200 rounded-3xl"></div>
    <div className="absolute -bottom-8 -left-8 w-full h-full border-8 border-accent-500 rounded-3xl"></div>
  </div>
)

const services: Service[] = [
  {
    id: 1,
    title: 'Consultorías ISO',
    desc: 'Implementamos ISO 9001, 14001 y 45001 desde el diagnóstico hasta la auditoría de certificación.',
    icon: L.BadgeCheck,
  },
  {
    id: 2,
    title: 'Auditorías internas',
    desc: 'Detectamos brechas y oportunidades de mejora con auditorías según ISO 19011.',
    icon: L.SearchCheck,
  },
  {
    id: 3,
    title: 'Capacitaciones',
    desc: 'Programas de formación en seguridad laboral y medio ambiente a distintos niveles de la organización.',
    icon: L.Users,
  },
  {
    id: 4,
    title: 'Protocolos MINSAL',
    desc: 'Acompañamos en PREXOR, TMERT, CEAL-SM y PLANESI para cumplir la normativa local.',
    icon: L.ShieldCheck,
  },
  {
    id: 5,
    title: 'Gestión de riesgos',
    desc: 'Metodología ISO 31000 para reducir incidentes y pérdidas operacionales.',
    icon: L.AlertTriangle,
  },
  {
    id: 6,
    title: 'Soporte continuo',
    desc: 'Monitoreo, KPIs y mejora continua post-certificación.',
    icon: L.LifeBuoy,
  },
]

// Calculate variant based on index
const getVariant = (index: number): 'primary' | 'accent' | 'gold' => {
  const variants: ('primary' | 'accent' | 'gold')[] = ['primary', 'accent', 'gold'];
  return variants[index % variants.length];
}

const Services: FC = () => {
  // Animation for section elements
  const titleAnimation = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const } 
    }
  };

  return (
    <section id="servicios" className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <DiagonalPattern />

      <div className="container mx-auto px-4">
        <div className="text-center mb-20 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={titleAnimation}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-3">
              Servicios
            </span>
            
            <h2 className="mt-2 text-4xl font-display font-bold text-gray-900 leading-tight">
              Expertise que <span className="text-primary-600">genera valor</span>
            </h2>
            
            <div className="mx-auto mt-3 h-1 w-20 rounded bg-accent-500"></div>
            
            <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-600 leading-relaxed">
              Desde la evaluación de brechas hasta la mejora continua,
              cubrimos todo el ciclo de tu Sistema de Gestión.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard 
              key={service.id} 
              {...service} 
              variant={getVariant(index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
