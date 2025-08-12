import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de certificados de la plataforma
 * Muestra los certificados obtenidos por el usuario y permite descargarlos
 */
const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  
  // Estado para filtros
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress'>('all');
  
  // Datos de ejemplo para certificados
  const certificates = [
    {
      id: 1,
      title: 'Introducción a la consultoría estratégica',
      date: '2025-05-15',
      status: 'completed',
      image: '/assets/images/certificates/certificate-1.jpg',
      progress: 100,
    },
    {
      id: 2,
      title: 'Análisis de procesos empresariales',
      date: null,
      status: 'in-progress',
      image: null,
      progress: 25,
    },
    {
      id: 3,
      title: 'Optimización de operaciones',
      date: null,
      status: 'in-progress',
      image: null,
      progress: 0,
    },
  ];
  
  // Filtrar certificados según el estado seleccionado
  const filteredCertificates = certificates.filter(certificate => {
    if (filterStatus === 'all') return true;
    return certificate.status === filterStatus;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera */}
      <header className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-gray-600">
              Accede y descarga los certificados de tus cursos completados
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <select
              id="filter-status"
              name="filter-status"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'in-progress')}
            >
              <option value="all">Todos los cursos</option>
              <option value="completed">Certificados obtenidos</option>
              <option value="in-progress">En progreso</option>
            </select>
          </div>
        </div>
      </header>
      
      {/* Contenido principal - Certificados */}
      {filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate) => (
            <div 
              key={certificate.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Imágen del certificado o placeholder */}
              <div className="relative aspect-[4/3] bg-primary-50">
                {certificate.status === 'completed' ? (
                  <img 
                    src={certificate.image || '/assets/images/certificate-placeholder.jpg'}
                    alt={`Certificado de ${certificate.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 p-3 bg-primary-100 rounded-full">
                      <svg className="h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Certificado pendiente</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Completa este curso para obtener tu certificado
                    </p>
                  </div>
                )}
                {/* Badge de estado */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    certificate.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {certificate.status === 'completed' ? 'Completado' : 'En progreso'}
                  </span>
                </div>
              </div>
              
              {/* Contenido del certificado */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                  {certificate.title}
                </h3>
                
                {certificate.status === 'completed' ? (
                  <>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <svg className="h-4 w-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Emitido: {new Date(certificate.date!).toLocaleDateString()}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar PDF
                      </button>
                      <button 
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <svg className="h-4 w-4 mr-1 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Compartir
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Progreso: {certificate.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${certificate.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <a 
                      href={`/platform/courses/${certificate.id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Continuar curso
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No hay certificados disponibles</h3>
          <p className="mt-1 text-gray-500">
            Completa cursos para obtener tus certificados
          </p>
          <div className="mt-6">
            <a
              href="/platform/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Explorar cursos
            </a>
          </div>
        </div>
      )}
      
      {/* Información sobre certificados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sobre nuestros certificados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="bg-primary-100 rounded-full p-4 mb-4">
              <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Reconocimiento de la industria</h3>
            <p className="text-sm text-gray-500 mt-2">
              Nuestros certificados son reconocidos por empresas líderes en el sector
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="bg-primary-100 rounded-full p-4 mb-4">
              <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Verificación digital</h3>
            <p className="text-sm text-gray-500 mt-2">
              Incluyen código QR para verificación instantánea de autenticidad
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="bg-primary-100 rounded-full p-4 mb-4">
              <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900">Potencia tu carrera</h3>
            <p className="text-sm text-gray-500 mt-2">
              Compártelos en LinkedIn y otras plataformas profesionales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatesPage;
