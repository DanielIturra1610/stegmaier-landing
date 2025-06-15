import type { ReactNode, FC } from 'react';
import Navbar from './Navbar';
import { ScrollProgressBar } from '../../hooks/ScrollProgressBar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stegmaier-gray-light">
      <ScrollProgressBar />
      <Navbar />
      <main className="flex-grow">{children}</main>

    {/* Footer corporativo */}
    <footer className="relative overflow-hidden">
      {/* Gradiente superior con mayor contraste */}
      <div className="bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 py-16 text-white relative z-10">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-70"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent-500/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary-400/10 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4">
          {/* Logo y detalles de la empresa */}
          <div className="grid gap-12 md:grid-cols-3 mb-8">
            <section>
              <h3 className="font-display font-bold text-xl mb-6 text-white">Stegmaier Consulting</h3>
              <p className="text-base text-gray-100 mb-4 leading-relaxed">
                Más de 15 años liderando la implementación de sistemas de gestión certificables en Chile.
              </p>
              <div className="space-y-2 text-gray-100">
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-accent-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <a href="tel:+56223456789" className="hover:text-accent-300 transition-colors">+56 2 2345 6789</a>
                </p>
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-accent-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <a href="mailto:contacto@stegmaierconsulting.cl" className="hover:text-accent-300 transition-colors">contacto@stegmaierconsulting.cl</a>
                </p>
              </div>
            </section>

            <section>
              <h4 className="font-semibold text-lg mb-6 text-white">Servicios</h4>
              <ul className="space-y-3">
                {[
                  { name: 'Consultorías ISO', href: '/consultorias' },
                  { name: 'Auditorías internas', href: '/auditorias' },
                  { name: 'Capacitaciones', href: '/capacitaciones' },
                  { name: 'Protocolos MINSAL', href: '/protocolos' },
                ].map((item) => (
                  <li key={item.href}>
                    <a 
                      href={item.href} 
                      className="text-gray-200 hover:text-accent-300 transition-colors flex items-center"
                    >
                      <span className="mr-2 text-accent-300">▸</span>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-lg mb-6 text-white">Normas</h4>
              <ul className="space-y-3 text-gray-200">
                {[
                  { name: 'ISO 9001', desc: 'Calidad' },
                  { name: 'ISO 14001', desc: 'Medio Ambiente' },
                  { name: 'ISO 45001', desc: 'SST' },
                  { name: 'ISO 31000', desc: 'Riesgos' },
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-700 mr-2 text-xs text-accent-300 font-semibold">
                      ISO
                    </span>
                    <span>{item.name}</span>
                    <span className="mx-2 text-accent-300">•</span>
                    <span className="text-gray-300">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          
          {/* Separador decorativo */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent my-8"></div>

          {/* Pie de página con derechos reservados */}
          <div className="text-center text-gray-300 text-sm pt-4 flex flex-col md:flex-row justify-between items-center">
            <div>
              © {new Date().getFullYear()} Stegmaier Consulting • Todos los derechos reservados.
            </div>
            <div className="mt-3 md:mt-0 flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-accent-300 transition-colors">Términos</a>
              <a href="#" className="text-gray-300 hover:text-accent-300 transition-colors">Privacidad</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
  );
}
