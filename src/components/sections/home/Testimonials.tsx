import { FC } from 'react'
import { Quote, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../../lib/utils'

const testimonials = [
  {
    id: 1,
    name: 'María López',
    role: 'Gerente de SSMA',
    company: 'Minera Andes',
    quote:
      'Stegmaier nos llevó de cero a la certificación ISO 45001 en tiempo récord. Su acompañamiento constante marcó la diferencia.',
    rating: 5,
    variant: 'primary',
    image: '/assets/avatar-female.svg' // Placeholder image path
  },
  {
    id: 2,
    name: 'José Fernández',
    role: 'Subgerente de Calidad',
    company: 'Alimentos del Sur',
    quote:
      'Diseñaron un plan claro. Hoy operamos bajo ISO 9001 con procesos mucho más eficientes.',
    rating: 5,
    variant: 'accent',
    image: '/assets/avatar-male.svg' // Placeholder image path
  },
]

// Decorative background elements
const TestimonialsBackground = () => (
  <>
    {/* Light pattern overlay */}
    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
    
    {/* Accent blob */}
    <div className="absolute -left-40 -bottom-20 w-96 h-96 rounded-full bg-accent-200 opacity-10 blur-3xl"></div>
    
    {/* Primary blob */}
    <div className="absolute -right-40 top-20 w-96 h-96 rounded-full bg-primary-200 opacity-10 blur-3xl"></div>
  </>
)

const Testimonials: FC = () => {
  // Animation for content
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };
  
  // Generate star rating
  const renderStars = (count: number) => {
    return Array(count).fill(0).map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />
    ));
  };
  
  // Card style variants
  const cardStyles = {
    primary: "from-primary-600 to-primary-700 text-white shadow-xl shadow-primary-600/20",
    accent: "from-accent-500 to-accent-600 text-white shadow-xl shadow-accent-500/20"
  };

  return (
    <section id="testimonios" className="py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background elements */}
      <TestimonialsBackground />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-3">
            Testimonios
          </span>
          
          <h2 className="mt-2 text-4xl font-display font-bold text-gray-900 leading-tight">
            Clientes que <span className="text-primary-600">confían en nosotros</span>
          </h2>
          
          <div className="mx-auto mt-3 h-1 w-20 rounded bg-accent-500"></div>
        </motion.div>

        <motion.div 
          className="mt-12 grid gap-8 lg:grid-cols-2"
          variants={containerAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.id}
              variants={itemAnimation}
              className="flex flex-col h-full"
            >
              <blockquote
                className={cn(
                  "rounded-2xl p-8 text-left h-full flex flex-col",
                  "bg-white border border-gray-100 overflow-hidden relative", 
                  "shadow-card hover:shadow-elevated transition-all duration-500"
                )}
              >
                {/* Decorative gradient top bar */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                  t.variant === 'primary' ? "from-primary-400 to-primary-600" : "from-accent-400 to-accent-600"
                )}></div>
                
                <div className="flex items-start">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full overflow-hidden mr-4 border-2",
                    t.variant === 'primary' ? "border-primary-200" : "border-accent-200"
                  )}>
                    {/* Avatar placeholder - you can replace with actual images if available */}
                    <div className={cn(
                      "w-full h-full bg-gradient-to-br",
                      t.variant === 'primary' ? "from-primary-100 to-primary-200" : "from-accent-100 to-accent-200"
                    )}></div>
                  </div>
                  
                  <div>
                    <strong className="font-semibold text-gray-900 block">{t.name}</strong>
                    <span className="text-sm text-gray-500">
                      {t.role} · {t.company}
                    </span>
                    
                    <div className="flex mt-1">
                      {renderStars(t.rating)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex-grow">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full mb-3",
                    "bg-gradient-to-br",
                    t.variant === 'primary' ? "from-primary-100 to-primary-200" : "from-accent-100 to-accent-200"
                  )}>
                    <Quote className={cn(
                      "h-5 w-5", 
                      t.variant === 'primary' ? "text-primary-600" : "text-accent-600"
                    )} />
                  </div>
                  <p className="text-gray-600 leading-relaxed">"{t.quote}"</p>
                </div>
              </blockquote>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Call to action */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500 italic">Pasa a paso hacia la certificación</p>
        </motion.div>
      </div>
    </section>
  )
}

export default Testimonials
