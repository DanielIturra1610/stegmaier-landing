import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Certificate } from '../../services/certificateService';
import CertificateTemplate from './CertificateTemplate';
import { useAuth } from '../../contexts/AuthContext';

export interface CertificateGeneratorProps {
  certificate: Certificate;
  onGenerationComplete?: (pdfBlob: Blob) => void;
  onError?: (error: Error) => void;
  children?: (props: { generatePDF: () => Promise<void>; isGenerating: boolean }) => React.ReactNode;
}

/**
 * Generador de certificados PDF usando html2canvas y jsPDF
 * Mantiene consistencia con el design system existente
 */
const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  certificate,
  onGenerationComplete,
  onError,
  children
}) => {
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Genera el PDF del certificado usando html2canvas y jsPDF
   */
  const generatePDF = async (): Promise<void> => {
    if (!certificateRef.current || isGenerating) return;

    setIsGenerating(true);

    try {
      // Configurar opciones de alta calidad para html2canvas
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // Alta resolución
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 1122, // A4 landscape width at 96 DPI * 2
        height: 794,  // A4 landscape height at 96 DPI * 2
        scrollX: 0,
        scrollY: 0,
        windowWidth: certificateRef.current.scrollWidth,
        windowHeight: certificateRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Asegurar que todos los estilos se apliquen correctamente
          const clonedElement = clonedDoc.querySelector('.certificate-template');
          if (clonedElement) {
            (clonedElement as HTMLElement).style.transform = 'none';
            (clonedElement as HTMLElement).style.display = 'block';
            (clonedElement as HTMLElement).style.visibility = 'visible';
          }
        }
      });

      // Crear PDF en formato A4 landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Calcular dimensiones para ajustar el canvas al PDF
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = 210; // A4 landscape height in mm
      
      // Convertir canvas a imagen
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Añadir imagen al PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      // Añadir metadatos al PDF
      pdf.setProperties({
        title: `Certificado - ${certificate.courseName}`,
        subject: `Certificado de completitud del curso "${certificate.courseName}"`,
        author: 'Stegmaier Consulting',
        creator: 'Stegmaier LMS Platform',
        keywords: `certificado,curso,${certificate.courseName},${certificate.studentName}`
      });

      // Generar blob del PDF
      const pdfBlob = pdf.output('blob');

      // Callback de éxito
      if (onGenerationComplete) {
        onGenerationComplete(pdfBlob);
      }

    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      const errorObj = error instanceof Error ? error : new Error('Error desconocido al generar PDF');
      
      if (onError) {
        onError(errorObj);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Descarga directa del PDF
   */
  const downloadPDF = async (): Promise<void> => {
    await generatePDF();
    
    if (certificateRef.current) {
      try {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff'
        });

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);

        // Generar nombre del archivo
        const fileName = `certificado-${certificate.courseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${certificate.studentName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
        
        // Descargar
        pdf.save(fileName);

      } catch (error) {
        console.error('Error downloading certificate:', error);
        if (onError) {
          onError(error instanceof Error ? error : new Error('Error al descargar certificado'));
        }
      }
    }
  };

  return (
    <div className="certificate-generator">
      {/* Template del certificado (oculto para captura) */}
      <div 
        ref={certificateRef}
        className="certificate-capture"
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          visibility: 'hidden',
          width: '297mm',
          height: '210mm'
        }}
      >
        <CertificateTemplate certificate={certificate} />
      </div>

      {/* Render props para UI personalizada */}
      {children ? (
        children({ generatePDF: downloadPDF, isGenerating })
      ) : (
        <DefaultGeneratorUI 
          onGenerate={downloadPDF} 
          isGenerating={isGenerating}
          certificate={certificate}
        />
      )}
    </div>
  );
};

/**
 * UI por defecto del generador
 */
interface DefaultGeneratorUIProps {
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  certificate: Certificate;
}

const DefaultGeneratorUI: React.FC<DefaultGeneratorUIProps> = ({ 
  onGenerate, 
  isGenerating, 
  certificate 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Certificado de Completitud
          </h3>
          <p className="text-sm text-gray-600">
            {certificate.courseName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Curso Completado
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Estudiante:</span>
            <p className="text-gray-900">{certificate.studentName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Instructor:</span>
            <p className="text-gray-900">{certificate.instructorName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Fecha de completitud:</span>
            <p className="text-gray-900">
              {new Date(certificate.completionDate).toLocaleDateString('es-ES')}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Código de verificación:</span>
            <p className="font-mono text-gray-900">{certificate.verificationCode}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Descargar Certificado PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;
