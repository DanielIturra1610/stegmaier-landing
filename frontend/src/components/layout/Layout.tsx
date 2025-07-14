import type { ReactNode } from 'react';
import Navbar from './Navbar';
import { ScrollProgressBar } from '../../hooks/ScrollProgressBar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stegmaier-gray-light relative">
      <ScrollProgressBar />
      <Navbar />
      
      {/* Fondo global cohesivo - Movido después del navbar */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradiente base suave */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/5 via-white to-accent-50/30" />
        
        {/* Patrones geométricos sutiles */}
        <div className="absolute inset-0 bg-grid-white bg-[length:80px_80px] opacity-[0.02]" />
        
        {/* Orbes decorativos flotantes - sin transform, solo animaciones de CSS puras */}
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-40 animate-pulse visual-effect-container">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-accent-100/20 rounded-full"></div>
        </div>
        <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full opacity-30 animate-pulse visual-effect-container"
          style={{animationDelay: '2s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-accent-100/15 to-primary-100/15 rounded-full"></div>
        </div>
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 visual-effect-container"
          style={{top: '50%', left: '50%', marginLeft: '-300px', marginTop: '-300px'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/10 to-accent-50/10 rounded-full"></div>
        </div>
      </div>

      <main className="flex-grow relative">{children}</main>

      {/* Footer corporativo con transición suave */}
      <footer className="relative overflow-hidden">
        {/* Transición suave desde el contenido principal */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-primary-50/20 to-primary-100/30" />
        
        {/* Contenedor principal del footer */}
        <div className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 py-16 text-white">
          {/* Elementos decorativos mejorados */}
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-500 to-transparent opacity-70"></div>
          
          {/* Patrones geométricos en el footer */}
          <div className="absolute inset-0 bg-grid-white bg-[length:40px_40px] opacity-[0.05]" />
          
          {/* Orbes decorativos del footer - sin transform ni filter */}
          <div className="absolute top-[-96px] right-[-96px] w-64 h-64 rounded-full">
            <div className="absolute inset-0 bg-accent-500/10 rounded-full"></div>
          </div>
          <div className="absolute bottom-[-128px] left-[-128px] w-80 h-80 rounded-full">
            <div className="absolute inset-0 bg-primary-400/10 rounded-full"></div>
          </div>
          
          {/* Forma ondulada superior para transición suave - sin transform */}
          <svg 
            className="absolute top-[-30px] left-0 w-full text-primary-900/50" 
            viewBox="0 0 1440 120" 
            fill="currentColor"
            preserveAspectRatio="none"
            style={{ height: '60px' }}
          >
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,112C1248,117,1344,107,1392,101.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
          
          <div className="max-w-7xl mx-auto px-4 relative">
            {/* Logo y detalles de la empresa */}
            <div className="grid gap-12 md:grid-cols-3 mb-8">
              <section>
                <h3 className="font-display font-bold text-xl mb-6 text-white">Stegmaier Consulting</h3>
                <p className="text-base text-gray-100 mb-4 leading-relaxed">
                  Más de 15 años liderando la implementación de sistemas de gestión certificables en Chile.
                </p>
                <div className="flex space-x-4 mb-6">
                  <a href="https://twitter.com" className="text-gray-300 hover:text-accent-400 transition-colors" aria-label="Twitter">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="https://linkedin.com" className="text-gray-300 hover:text-accent-400 transition-colors" aria-label="LinkedIn">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
                <div className="text-gray-200 text-sm">
                  <p className="flex items-center mb-1">
                    <svg className="h-4 w-4 text-accent-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Av. Providencia 1234, Santiago
                  </p>
                  <p className="flex items-center">
                    <svg className="h-4 w-4 text-accent-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    +56 2 2234 5678
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
                        className="text-gray-200 hover:text-accent-300 transition-colors flex items-center group"
                      >
                        <span className="mr-2 text-accent-300 group-hover:translate-x-1 transition-transform">▸</span>
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
                    <li key={index} className="flex items-center group hover:translate-x-1 transition-transform">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-700 mr-2 text-xs text-accent-300 font-semibold group-hover:bg-accent-500 group-hover:text-white transition-colors">
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
            
            {/* Separador decorativo mejorado - sin transform */}
            <div className="relative my-8">
              <div className="h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />
              <div className="absolute left-50% w-8 h-8 bg-accent-500/20 rounded-full border border-primary-400/30" 
                   style={{ top: '-4px', left: 'calc(50% - 16px)' }}></div>
            </div>

            {/* Pie de página con derechos reservados */}
            <div className="text-center text-gray-300 text-sm pt-4 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-accent-500 rounded-full mr-2 animate-pulse" />
                &copy; {new Date().getFullYear()} Stegmaier Consulting • Todos los derechos reservados.
              </div>
              <div className="mt-3 md:mt-0 flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-accent-300 transition-colors relative group">
                  Términos
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-300 group-hover:w-full transition-all duration-300" />
                </a>
                <a href="#" className="text-gray-300 hover:text-accent-300 transition-colors relative group">
                  Privacidad
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-300 group-hover:w-full transition-all duration-300" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}