import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer para el layout principal del sitio
 * Mantiene la coherencia con la identidad de marca de Stegmaier
 */
const Footer: React.FC = () => {
  return (
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
              <div className="flex items-center mb-6">
                <img 
                  src="../../assets/images/Stegmaierlogoblanco.png" 
                  alt="Stegmaier Logo" 
                  className="h-10"
                />
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Soluciones integrales de consultoría para sistemas de gestión y cumplimiento normativo.
                Expertos en ISO 9001, ISO 14001, ISO 45001 y más.
              </p>
              <div className="flex space-x-4 mb-6">
                <a href="https://www.facebook.com/people/Stegmaier-Partner-Consulting/100063922996824/" className="text-gray-300 hover:text-accent-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/stegmaier-partner-consulting-0b8792263/" className="text-gray-300 hover:text-accent-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/stegmaierpartnerconsulting?igsh=a3BjODZyd3pyMnA5" className="text-gray-300 hover:text-accent-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
              <div className="text-gray-300">
                <p className="flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contacto@stegmaierconsulting.cl 
                </p>
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +56 9 8750 1114
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
                    <Link 
                      to={item.href} 
                      className="text-gray-200 hover:text-accent-300 transition-colors flex items-center group"
                    >
                      <span className="mr-2 text-accent-300 group-hover:translate-x-1 transition-transform">▸</span>
                      {item.name}
                    </Link>
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
              <Link to="/terminos" className="text-gray-300 hover:text-accent-300 transition-colors relative group">
                Términos
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-300 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link to="/privacidad" className="text-gray-300 hover:text-accent-300 transition-colors relative group">
                Privacidad
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-300 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
