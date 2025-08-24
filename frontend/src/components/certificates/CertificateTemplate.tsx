import React from 'react';
import { Certificate } from '../../services/certificateService';

export interface CertificateTemplateProps {
  certificate: Certificate;
  className?: string;
  preview?: boolean;
}

/**
 * Template profesional de certificado con diseño Stegmaier
 * Optimizado para generación PDF y preview HTML
 */
const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ 
  certificate, 
  className = '',
  preview = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCategoryDisplayName = (category?: string) => {
    const categories = {
      'iso_9001': 'ISO 9001 - Sistema de Gestión de Calidad',
      'iso_14001': 'ISO 14001 - Sistema de Gestión Ambiental', 
      'iso_45001': 'ISO 45001 - Sistema de Gestión de Seguridad y Salud',
      'consulting': 'Consultoría Empresarial',
      'management': 'Gestión Empresarial',
      'operations': 'Operaciones y Procesos'
    };
    return categories[category as keyof typeof categories] || category || 'Curso Especializado';
  };

  return (
    <div 
      className={`certificate-template bg-white ${className}`}
      style={{
        width: '297mm',
        height: '210mm',
        padding: '20mm',
        fontFamily: 'serif',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Bordes decorativos */}
      <div className="absolute inset-4 border-4 border-blue-900 rounded-lg">
        <div className="absolute inset-2 border-2 border-blue-700 rounded-md"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Header con logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-blue-900 rounded-full flex items-center justify-center mr-6">
              <span className="text-white font-bold text-2xl">SC</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-blue-900 mb-1">STEGMAIER</h1>
              <p className="text-xl text-blue-700 tracking-wider">CONSULTING</p>
            </div>
          </div>
          
          <div className="w-48 h-1 bg-gradient-to-r from-blue-900 to-blue-700 mx-auto mb-8"></div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">CERTIFICADO DE COMPLETITUD</h2>
          <p className="text-lg text-gray-600">Certificate of Completion</p>
        </div>

        {/* Contenido del certificado */}
        <div className="flex-grow flex flex-col justify-center text-center">
          <p className="text-xl text-gray-700 mb-8">
            Se certifica que
          </p>
          
          <h3 className="text-5xl font-bold text-blue-900 mb-8 border-b-2 border-blue-200 pb-4">
            {certificate.studentName}
          </h3>
          
          <p className="text-xl text-gray-700 mb-4">
            ha completado satisfactoriamente el curso
          </p>
          
          <h4 className="text-3xl font-semibold text-gray-800 mb-6 leading-tight">
            "{certificate.courseName}"
          </h4>
          
          <div className="bg-blue-50 rounded-lg p-6 mx-auto max-w-2xl mb-8">
            <p className="text-lg text-blue-800 mb-2">
              <strong>Categoría:</strong> {getCategoryDisplayName(certificate.courseCategory)}
            </p>
            {certificate.courseDuration && (
              <p className="text-lg text-blue-800 mb-2">
                <strong>Duración:</strong> {certificate.courseDuration} horas académicas
              </p>
            )}
            {certificate.grade && (
              <p className="text-lg text-blue-800">
                <strong>Calificación:</strong> {certificate.grade}%
              </p>
            )}
          </div>
        </div>

        {/* Footer con firmas y datos */}
        <div className="mt-auto">
          <div className="grid grid-cols-3 gap-8 items-end mb-8">
            {/* Fecha */}
            <div className="text-center">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-lg font-semibold text-gray-800">
                  {formatDate(certificate.completionDate)}
                </p>
                <p className="text-sm text-gray-600">Fecha de Completitud</p>
              </div>
            </div>

            {/* Sello/Logo central */}
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">SC</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Sello Oficial</p>
            </div>

            {/* Instructor */}
            <div className="text-center">
              <div className="border-t-2 border-gray-400 pt-2">
                <p className="text-lg font-semibold text-gray-800">
                  {certificate.instructorName}
                </p>
                <p className="text-sm text-gray-600">Instructor Certificado</p>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="flex justify-between items-center text-sm text-gray-500 border-t-2 border-gray-200 pt-4">
            <div>
              <p><strong>Código de Verificación:</strong> {certificate.verificationCode}</p>
              <p><strong>ID del Certificado:</strong> {certificate.id}</p>
            </div>
            <div className="text-right">
              <p><strong>Emitido:</strong> {formatDate(certificate.issueDate)}</p>
              <p><strong>Válido desde:</strong> {formatDate(certificate.issueDate)}</p>
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="absolute bottom-6 right-6">
            <div className="w-16 h-16 bg-gray-200 border border-gray-400 flex items-center justify-center">
              <span className="text-xs text-gray-600">QR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Marca de agua */}
      {!preview && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            background: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50' y='50' font-family='serif' font-size='12' fill='%23f0f9ff' text-anchor='middle' opacity='0.1' transform='rotate(-45 50 50)'%3ESTEGMAIER%3C/text%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px'
          }}
        />
      )}
    </div>
  );
};

export default CertificateTemplate;
