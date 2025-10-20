import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de soporte de la plataforma
 * Proporciona ayuda, FAQs y opciones de contacto para los usuarios
 */
const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Lista de preguntas frecuentes
  const faqs = [
    {
      question: '¿Cómo puedo restablecer mi contraseña?',
      answer: 'Para restablecer tu contraseña, ve a la página de inicio de sesión y haz clic en "Olvidé mi contraseña". Recibirás un correo electrónico con instrucciones para crear una nueva contraseña.'
    },
    {
      question: '¿Cómo descargar mis certificados?',
      answer: 'Puedes descargar tus certificados desde la sección "Mis Certificados" en tu panel de control. Allí encontrarás todos los cursos completados con la opción de descargar el certificado en formato PDF.'
    },
    {
      question: '¿Los cursos tienen fecha de vencimiento?',
      answer: 'No, una vez que compras un curso, tienes acceso a él de forma permanente. Puedes acceder al contenido cuando quieras y cuantas veces lo necesites.'
    },
    {
      question: '¿Cómo puedo solicitar una factura por mi compra?',
      answer: 'Para solicitar una factura, envía un correo electrónico a facturacion@example.com con tu nombre completo, número de orden y datos fiscales. Procesaremos tu solicitud en un plazo de 48 horas hábiles.'
    },
    {
      question: '¿Puedo acceder a los cursos desde mi dispositivo móvil?',
      answer: 'Sí, nuestra plataforma es completamente responsive y puedes acceder a los cursos desde cualquier dispositivo con conexión a internet: computadoras, tablets y smartphones.'
    },
    {
      question: '¿Cuál es la política de reembolso?',
      answer: 'Ofrecemos un período de garantía de 7 días desde la fecha de compra. Si no estás satisfecho con el curso, puedes solicitar un reembolso completo durante este período contactando a nuestro equipo de soporte.'
    },
    {
      question: '¿Cómo reporto un problema técnico?',
      answer: 'Si experimentas algún problema técnico, puedes reportarlo a través del formulario de contacto en esta página. Nuestro equipo técnico lo revisará y te responderá lo antes posible.'
    },
  ];

  // Filtrar FAQs según la búsqueda
  const filteredFaqs = (faqs || []).filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manejar envío del formulario de contacto
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('loading');
    
    // Simulación de envío del formulario
    setTimeout(() => {
      setSubmitStatus('success');
      setContactForm({
        subject: '',
        message: '',
        priority: 'normal',
      });
    }, 1000);
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContactForm(prevForm => ({
      ...prevForm,
      [name]: value,
    }));
  };

  // Togglear un elemento del acordeón
  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <div className="space-y-6 pb-10">


      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Buscar ayuda</label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                name="search"
                id="search"
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Buscar preguntas frecuentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal en columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Preguntas Frecuentes</h2>
            </div>
            
            {filteredFaqs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0">
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full px-6 py-4 flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                    >
                      <span className="text-sm md:text-base font-medium text-gray-900">{faq.question}</span>
                      <svg
                        className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${activeAccordion === index ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeAccordion === index && (
                      <div className="px-6 pb-4 pt-0">
                        <p className="text-sm text-gray-600">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No se encontraron resultados para "{searchQuery}"</p>
              </div>
            )}
          </div>

          {/* Recursos de ayuda */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recursos de ayuda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="#"
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary-100 rounded-md">
                    <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Guía del usuario</h3>
                  <p className="mt-1 text-xs text-gray-500">Manual completo de la plataforma de cursos</p>
                </div>
              </a>
              
              <a 
                href="#"
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary-100 rounded-md">
                    <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Tutoriales en video</h3>
                  <p className="mt-1 text-xs text-gray-500">Aprende a utilizar todas las funciones</p>
                </div>
              </a>
              
              <a 
                href="#"
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary-100 rounded-md">
                    <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Base de conocimientos</h3>
                  <p className="mt-1 text-xs text-gray-500">Artículos detallados sobre cada función</p>
                </div>
              </a>
              
              <a 
                href="#"
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary-100 rounded-md">
                    <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Comunidad de estudiantes</h3>
                  <p className="mt-1 text-xs text-gray-500">Resuelve dudas con otros alumnos</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Columna derecha - Formulario de contacto */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Contacto directo</h2>
              <p className="text-sm text-gray-600 mt-1">Envíanos tu consulta y te responderemos lo antes posible</p>
            </div>
            
            {submitStatus === 'success' ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">¡Mensaje enviado!</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Gracias por contactarnos. Te responderemos lo antes posible a tu correo electrónico.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setSubmitStatus('idle')}
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Asunto</label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Escribe el asunto de tu consulta"
                    value={contactForm.subject}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensaje</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Describe tu problema o consulta con detalle"
                    value={contactForm.message}
                    onChange={handleFormChange as any}
                    required
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Prioridad</label>
                  <select
                    id="priority"
                    name="priority"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={contactForm.priority}
                    onChange={handleFormChange}
                  >
                    <option value="low">Baja - Consulta general</option>
                    <option value="normal">Normal - Necesito ayuda</option>
                    <option value="high">Alta - Problema técnico</option>
                    <option value="urgent">Urgente - No puedo acceder</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitStatus === 'loading'}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitStatus === 'loading' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : 'Enviar mensaje'}
                  </button>
                </div>
              </form>
            )}

            {/* Otros canales de contacto */}
            <div className="bg-gray-50 p-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">También puedes contactarnos por:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="ml-3 text-sm text-gray-500">soporte@example.com</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="ml-3 text-sm text-gray-500">+56 9 5555 5555</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="ml-3 text-sm text-gray-500">Chat en vivo (L-V 9:00 - 18:00)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;