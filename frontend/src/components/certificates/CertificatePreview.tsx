import React, { useState } from 'react';
import { Certificate } from '../../services/certificateService';
import CertificateTemplate from './CertificateTemplate';
import CertificateGenerator from './CertificateGenerator';

export interface CertificatePreviewProps {
  certificate: Certificate;
  onClose?: () => void;
  showDownloadButton?: boolean;
  className?: string;
}

/**
 * Componente de vista previa del certificado con opción de descarga
 * Integra con CertificateTemplate y CertificateGenerator
 */
const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  certificate,
  onClose,
  showDownloadButton = true,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };

  const handleGenerationComplete = (pdfBlob: Blob) => {
    setIsGenerating(false);
    // La descarga se maneja automáticamente en CertificateGenerator
  };

  const handleGenerationError = (error: Error) => {
    setIsGenerating(false);
    console.error('Error generating certificate:', error);
    // TODO: Mostrar toast de error
  };

  return (
    <>
      {/* Vista previa en miniatura */}
      <div className={`certificate-preview ${className}`}>
        <div 
          className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={handleOpenModal}
        >
          {/* Miniatura del certificado */}
          <div className="aspect-[297/210] bg-blue-50 p-2">
            <div className="w-full h-full border-2 border-blue-200 rounded bg-white relative overflow-hidden">
              {/* Contenido simplificado de la miniatura */}
              <div className="absolute inset-0 p-4 flex flex-col justify-between text-xs">
                {/* Header */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-4 h-4 bg-blue-900 rounded-full mr-2"></div>
                    <div>
                      <div className="font-bold text-blue-900">STEGMAIER</div>
                      <div className="text-blue-700 text-[8px]">CONSULTING</div>
                    </div>
                  </div>
                  <div className="w-8 h-0.5 bg-blue-700 mx-auto mb-2"></div>
                  <div className="font-bold text-gray-800">CERTIFICADO</div>
                </div>

                {/* Contenido */}
                <div className="text-center">
                  <div className="text-[10px] text-gray-600 mb-1">Se certifica que</div>
                  <div className="font-bold text-blue-900 mb-1 text-[10px] truncate">
                    {certificate.studentName}
                  </div>
                  <div className="text-[8px] text-gray-600 mb-1">ha completado</div>
                  <div className="font-semibold text-gray-800 text-[8px] leading-tight line-clamp-2">
                    {certificate.courseName}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end text-[6px] text-gray-500">
                  <div>
                    {new Date(certificate.completionDate).toLocaleDateString('es-ES')}
                  </div>
                  <div className="w-3 h-3 bg-blue-900 rounded-full"></div>
                  <div>{certificate.instructorName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay con información */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white bg-opacity-90 rounded-full p-3">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Badge de estado */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Completado
            </span>
          </div>
        </div>

        {/* Información del certificado */}
        <div className="mt-3">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
            {certificate.courseName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Emitido: {new Date(certificate.issueDate).toLocaleDateString('es-ES')}
          </p>
          
          {showDownloadButton && (
            <div className="mt-3">
              <CertificateGenerator
                certificate={certificate}
                onGenerationComplete={handleGenerationComplete}
                onError={handleGenerationError}
              >
                {({ generatePDF, isGenerating }) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsGenerating(true);
                      generatePDF();
                    }}
                    disabled={isGenerating}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar PDF
                      </>
                    )}
                  </button>
                )}
              </CertificateGenerator>
            </div>
          )}
        </div>
      </div>

      {/* Modal de vista completa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Vista previa del certificado
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido del certificado */}
              <div className="bg-gray-50 px-4 py-6 overflow-x-auto">
                <div className="flex justify-center">
                  <div className="transform scale-50 origin-top">
                    <CertificateTemplate certificate={certificate} preview={true} />
                  </div>
                </div>
              </div>

              {/* Footer con acciones */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                <CertificateGenerator
                  certificate={certificate}
                  onGenerationComplete={handleGenerationComplete}
                  onError={handleGenerationError}
                >
                  {({ generatePDF, isGenerating }) => (
                    <>
                      <button
                        onClick={() => {
                          setIsGenerating(true);
                          generatePDF();
                        }}
                        disabled={isGenerating}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGenerating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generando PDF...
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
                      <button
                        onClick={handleCloseModal}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Cerrar
                      </button>
                    </>
                  )}
                </CertificateGenerator>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CertificatePreview;
