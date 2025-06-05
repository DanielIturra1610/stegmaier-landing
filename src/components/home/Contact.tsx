import React from 'react';

const Contact: React.FC = () => {
  return (
    <section id="contacto" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Contacto</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            ¿Listo para transformar tu idea en realidad?
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Trabajemos juntos para crear soluciones digitales excepcionales que impulsen tu negocio
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Información de contacto y CTA */}
          <div className="space-y-8">
            {/* Propuesta de valor */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">¿Por qué trabajar conmigo?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Desarrollo personalizado</h4>
                    <p className="text-gray-600">Soluciones únicas adaptadas a tus necesidades específicas</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Comunicación transparente</h4>
                    <p className="text-gray-600">Actualizaciones constantes y feedback durante todo el proceso</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">Tecnologías modernas</h4>
                    <p className="text-gray-600">Stack actualizado para rendimiento y escalabilidad óptimos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Llamadas a la acción principales */}
            <div className="space-y-4">
              <a
                href="mailto:Daniel.eduardo1610@gmail.com?subject=Consulta sobre proyecto&body=Hola Daniel,%0D%0A%0D%0AMe gustaría discutir un proyecto contigo. Mi idea es:%0D%0A%0D%0A[Describe tu proyecto aquí]%0D%0A%0D%0ASaludos,"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center group"
              >
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Enviar Email Ahora
              </a>
              
              <a
                href="https://wa.me/56984164550?text=Hola%20Daniel,%20me%20interesa%20trabajar%20contigo%20en%20un%20proyecto%20web."
                target="_blank"
                rel="noopener noreferrer" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center group"
              >
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Escribir por WhatsApp
              </a>
            </div>

            {/* Estadísticas o información adicional */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h4 className="font-semibold text-lg mb-4">Respuesta rápida garantizada</h4>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Respuesta en &lt; 24h</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Consulta gratuita</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de información de contacto */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Información de Contacto</h3>
              <p className="text-blue-100">Múltiples formas de conectar</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center group hover:bg-gray-50 p-3 rounded-lg transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <a href="mailto:Daniel.eduardo1610@gmail.com" className="text-blue-600 hover:text-blue-800 transition-colors">
                    Daniel.eduardo1610@gmail.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center group hover:bg-gray-50 p-3 rounded-lg transition-colors">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 4a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4zm2.5 9a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">WhatsApp</p>
                  <a href="https://wa.me/56984164550" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 transition-colors">
                    +56 9 8416 4550
                  </a>
                </div>
              </div>
              
              <div className="flex items-center group hover:bg-gray-50 p-3 rounded-lg transition-colors">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ubicación</p>
                  <p className="text-gray-600">Puerto Montt, Chile</p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Sígueme en:</h4>
                <div className="flex space-x-4">
                  <a href="https://www.linkedin.com/in/daniel-iturra-10b54a252" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a href="https://github.com/DanielIturra1610" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de FAQ o información adicional */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Preguntas Frecuentes</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">¿Cuánto tiempo toma un proyecto?</h4>
              <p className="text-gray-600">Los tiempos varían según la complejidad, pero típicamente entre 2-8 semanas para proyectos web completos.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">¿Trabajas con empresas internacionales?</h4>
              <p className="text-gray-600">Sí, trabajo con clientes de todo el mundo. La comunicación se realiza principalmente en español e inglés.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">¿Qué incluye el desarrollo?</h4>
              <p className="text-gray-600">Desarrollo completo, responsive design, optimización SEO básica, documentación y soporte post-lanzamiento.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">¿Ofreces mantenimiento?</h4>
              <p className="text-gray-600">Sí, ofrezco planes de mantenimiento para actualizaciones, seguridad y nuevas funcionalidades.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;