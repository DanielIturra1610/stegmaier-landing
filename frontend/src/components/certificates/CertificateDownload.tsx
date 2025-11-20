import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import certificateService, { Certificate } from '../../services/certificateService';
import CertificateGenerator from './CertificateGenerator';
import toast from 'react-hot-toast';

export interface CertificateDownloadProps {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  onDownloadComplete?: (certificate: Certificate) => void;
  onError?: (error: Error) => void;
  className?: string;
  variant?: 'button' | 'card';
}

/**
 * Componente para descargar certificados con autenticación JWT
 * Integra con el sistema de autenticación existente
 */
const CertificateDownload: React.FC<CertificateDownloadProps> = ({
  enrollmentId,
  courseId,
  courseName,
  onDownloadComplete,
  onError,
  className = '',
  variant = 'button'
}) => {
  const { user } = useAuth();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verificar si el usuario puede generar/descargar el certificado
   */
  const canDownloadCertificate = (): boolean => {
    if (!user) return false;
    
    // Los usuarios pueden descargar sus propios certificados
    // Los admins pueden descargar cualquier certificado
    return user.role === 'admin' || user.role === 'instructor' || user.role === 'student';
  };

  /**
   * Obtener o generar el certificado
   */
  const handleDownload = async (): Promise<void> => {
    if (!canDownloadCertificate()) {
      const errorMsg = 'No tienes permisos para descargar este certificado';
      setError(errorMsg);
      toast.error(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Primero intentar obtener el certificado existente
      let cert = certificate;
      
      if (!cert) {
        try {
          // Si no existe, intentar generarlo
          cert = await certificateService.generateCertificate({
            enrollmentId,
            template: 'stegmaier-standard'
          });
          setCertificate(cert);
          toast.success('Certificado generado correctamente');
        } catch (generateError: any) {
          // Si falla la generación, mostrar error específico
          const errorMsg = generateError?.response?.data?.detail || 
                          generateError?.message || 
                          'Error al generar el certificado';
          setError(errorMsg);
          toast.error(errorMsg);
          if (onError) onError(new Error(errorMsg));
          return;
        }
      }

      if (cert) {
        if (onDownloadComplete) {
          onDownloadComplete(cert);
        }
      }

    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || 
                      error?.message || 
                      'Error al procesar la descarga';
      setError(errorMsg);
      toast.error(errorMsg);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manejar la generación del PDF
   */
  const handlePDFGeneration = (pdfBlob: Blob) => {
    setIsGenerating(false);
    toast.success('Certificado descargado correctamente');
  };

  /**
   * Manejar errores en la generación del PDF
   */
  const handlePDFError = (error: Error) => {
    setIsGenerating(false);
    toast.error('Error al generar el PDF del certificado');
    if (onError) onError(error);
  };

  /**
   * Verificar estado de completitud al montar el componente
   */
  useEffect(() => {
    const checkCertificateStatus = async () => {
      if (!enrollmentId) return;

      try {
        // Intentar obtener certificados del usuario
        const response = await certificateService.getMyCertificates();
        const existingCert = response.certificates.find(c => c.enrollmentId === enrollmentId);
        
        if (existingCert) {
          setCertificate(existingCert);
        }
      } catch (error) {
        // No es crítico si falla, el usuario puede intentar generar
        console.log('Certificate not found or not accessible:', error);
      }
    };

    checkCertificateStatus();
  }, [enrollmentId]);

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Certificado de Completitud
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {courseName}
            </p>
          </div>
          <div className="flex items-center">
            {certificate ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Disponible
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⏳ Por generar
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {certificate ? (
          <CertificateGenerator
            certificate={certificate}
            onGenerationComplete={handlePDFGeneration}
            onError={handlePDFError}
          >
            {({ generatePDF, isGenerating }) => (
              <button
                onClick={() => {
                  setIsGenerating(true);
                  generatePDF();
                }}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Descargando...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar Certificado
                  </>
                )}
              </button>
            )}
          </CertificateGenerator>
        ) : (
          <button
            onClick={handleDownload}
            disabled={isLoading || !canDownloadCertificate()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando certificado...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generar Certificado
              </>
            )}
          </button>
        )}

        {!canDownloadCertificate() && (
          <p className="mt-2 text-xs text-gray-500">
            {!user ? 'Inicia sesión para acceder a tu certificado' : 'Sin permisos para descargar certificados'}
          </p>
        )}
      </div>
    );
  }

  // Variant 'button'
  return (
    <div className={className}>
      {certificate ? (
        <CertificateGenerator
          certificate={certificate}
          onGenerationComplete={handlePDFGeneration}
          onError={handlePDFError}
        >
          {({ generatePDF, isGenerating }) => (
            <button
              onClick={() => {
                setIsGenerating(true);
                generatePDF();
              }}
              disabled={isGenerating}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Descargando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar PDF
                </>
              )}
            </button>
          )}
        </CertificateGenerator>
      ) : (
        <button
          onClick={handleDownload}
          disabled={isLoading || !canDownloadCertificate()}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Obtener Certificado
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CertificateDownload;
