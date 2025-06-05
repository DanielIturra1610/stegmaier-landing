import React from 'react';
import { Testimonial } from '../../types';

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Amilcar Arriagada',
    role: 'CEO',
    company: 'Quality Metrics',
    content: 'Daniel transformó completamente nuestra infraestructura de datos. Su capacidad para entender nuestras necesidades de negocio y traducirlas en soluciones técnicas robustas fue impresionante. El sistema que desarrolló no solo mejoró nuestra eficiencia operacional en un 40%, sino que también nos dio la capacidad de tomar decisiones estratégicas basadas en datos en tiempo real.',
    image: '/testimonial1.jpg',
  },
  {
    id: 2,
    name: 'Rodrigo Vilches',
    role: 'Jefe de Proyecto',
    company: 'Quality Metrics',
    content: 'Trabajar con Daniel fue una experiencia excepcional desde el día uno. Su metodología de trabajo es impecable: entregas puntuales, comunicación transparente y una atención al detalle que garantiza resultados de calidad. La plataforma web que desarrolló para nosotros integró perfectamente con nuestros sistemas existentes y superó todas nuestras expectativas técnicas y funcionales.',
    image: '/testimonial2.jpg',
  },
];

const Testimonials: React.FC = () => {
  return (
    <section id="testimonios" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Testimonios</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Lo que dicen mis clientes
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Resultados comprobados y clientes satisfechos con soluciones que impulsan sus negocios.
          </p>
        </div>

        <div className="mt-16 space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="bg-gray-50 rounded-xl p-8 shadow hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <svg 
                  className="h-12 w-12 text-blue-200 absolute top-0 left-0 transform -translate-x-6 -translate-y-8" 
                  fill="currentColor" 
                  viewBox="0 0 32 32"
                >
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                
                <div className="relative">
                  <p className="text-gray-600 mb-4">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-blue-600 font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-gray-600">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center">
            <a 
              href="#contacto" 
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Solicitar una consulta
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;