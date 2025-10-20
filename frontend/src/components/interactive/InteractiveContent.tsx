/**
 * Componente para contenido interactivo de lecciones
 * Incluye elementos dinámicos que obligan al usuario a interactuar
 */
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, BookOpenIcon, LightBulbIcon, ChevronRightIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractiveContentProps {
  lessonId: string;
  content: InteractiveLessonContent;
  onProgressUpdate: (progress: number) => void;
  onLessonComplete: () => void;
}

interface InteractiveLessonContent {
  title: string;
  sections: InteractiveSection[];
}

interface InteractiveSection {
  id: string;
  type: 'text' | 'definition' | 'benefits' | 'examples' | 'reflection' | 'drag-drop' | 'timeline';
  title: string;
  content: string;
  interactive?: {
    type: 'click-to-reveal' | 'highlight-keywords' | 'drag-drop' | 'timeline-builder';
    data?: any;
  };
  required?: boolean;
}

const InteractiveContent: React.FC<InteractiveContentProps> = ({
  lessonId,
  content,
  onProgressUpdate,
  onLessonComplete
}) => {
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [currentSection, setCurrentSection] = useState(0);
  const [showReflection, setShowReflection] = useState(false);

  // Cálculo del progreso
  useEffect(() => {
    const progress = (completedSections.size / content.sections.length) * 100;
    onProgressUpdate(progress);
    
    if (completedSections.size === content.sections.length) {
      onLessonComplete();
    }
  }, [completedSections, content.sections.length, onProgressUpdate, onLessonComplete]);

  const markSectionComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  const ClickToRevealComponent = ({ section, isComplete }: { section: InteractiveSection, isComplete: boolean }) => {
    const [revealed, setRevealed] = useState(false);
    
    return (
      <div className="space-y-4">
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">{section.content.split('[REVEAL]')[0]}</p>
        </div>
        
        {!revealed ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRevealed(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all duration-200"
          >
            <LightBulbIcon className="h-5 w-5" />
            <span>Clic para revelar información clave</span>
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg"
          >
            <div className="prose max-w-none">
              <div className="text-blue-800">{section.content.split('[REVEAL]')[1]}</div>
            </div>
            {!isComplete && (
              <button
                onClick={() => markSectionComplete(section.id)}
                className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600 transition-colors"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>¡Entendido!</span>
              </button>
            )}
          </motion.div>
        )}
      </div>
    );
  };

  const HighlightKeywordsComponent = ({ section, isComplete }: { section: InteractiveSection, isComplete: boolean }) => {
    const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
    const keywords = section.interactive?.data?.keywords || [];
    
    const handleWordClick = (word: string) => {
      setHighlightedWords(prev => new Set([...prev, word]));
    };

    const renderTextWithClickableKeywords = (text: string) => {
      let processedText = text;
      keywords.forEach((keyword: string) => {
        const isHighlighted = highlightedWords.has(keyword);
        const className = isHighlighted 
          ? "bg-yellow-200 px-1 py-0.5 rounded cursor-pointer font-semibold text-yellow-800" 
          : "bg-gray-100 hover:bg-yellow-100 px-1 py-0.5 rounded cursor-pointer transition-colors";
        
        processedText = processedText.replace(
          new RegExp(`\\b${keyword}\\b`, 'gi'),
          `<span class="${className}" data-keyword="${keyword}">${keyword}</span>`
        );
      });
      return processedText;
    };

    useEffect(() => {
      if (highlightedWords.size === keywords.length && keywords.length > 0 && !isComplete) {
        markSectionComplete(section.id);
      }
    }, [highlightedWords, keywords, section.id, isComplete]);

    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <PuzzlePieceIcon className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-800">Encuentra los conceptos clave</h4>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            Haz clic en las palabras importantes para resaltarlas ({highlightedWords.size}/{keywords.length})
          </p>
        </div>
        
        <div 
          className="prose max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderTextWithClickableKeywords(section.content) }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.keyword) {
              handleWordClick(target.dataset.keyword);
            }
          }}
        />
      </div>
    );
  };

  const ReflectionComponent = ({ section, isComplete }: { section: InteractiveSection, isComplete: boolean }) => {
    const [reflection, setReflection] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
      if (reflection.length >= 50) {
        setSubmitted(true);
        markSectionComplete(section.id);
      }
    };

    return (
      <div className="space-y-4">
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">{section.content}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
            <BookOpenIcon className="h-5 w-5 mr-2" />
            Reflexión Personal
          </h4>
          <p className="text-purple-700 text-sm mb-4">
            Reflexiona sobre cómo aplicarías estos conceptos en tu trabajo actual. Mínimo 50 caracteres.
          </p>
          
          {!submitted ? (
            <>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Escribe tu reflexión aquí..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500">
                  {reflection.length}/50 caracteres mínimos
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={reflection.length < 50}
                  className="bg-purple-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Enviar Reflexión
                </button>
              </div>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-green-800 font-medium">✓ Reflexión completada exitosamente</p>
              <p className="text-green-700 text-sm mt-2">Tu reflexión ha sido guardada y puedes continuar con la siguiente sección.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (section: InteractiveSection, index: number) => {
    const isComplete = completedSections.has(section.id);
    const isAccessible = index === 0 || completedSections.has(content.sections[index - 1].id);

    if (!isAccessible) {
      return (
        <div key={section.id} className="opacity-50 pointer-events-none bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{index + 1}</span>
            </div>
            <h3 className="text-gray-500 font-semibold">{section.title}</h3>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Bloqueado</span>
          </div>
          <p className="text-gray-400 mt-2">Completa la sección anterior para acceder</p>
        </div>
      );
    }

    return (
      <motion.div
        key={section.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`border-2 rounded-lg p-6 ${isComplete ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}>
            {isComplete ? (
              <CheckCircleIcon className="h-5 w-5 text-white" />
            ) : (
              <span className="text-white font-bold">{index + 1}</span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
          {isComplete && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Completado</span>}
        </div>

        {section.interactive?.type === 'click-to-reveal' && (
          <ClickToRevealComponent section={section} isComplete={isComplete} />
        )}

        {section.interactive?.type === 'highlight-keywords' && (
          <HighlightKeywordsComponent section={section} isComplete={isComplete} />
        )}

        {section.type === 'reflection' && (
          <ReflectionComponent section={section} isComplete={isComplete} />
        )}

        {!section.interactive && section.type !== 'reflection' && (
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{section.content}</p>
            </div>
            {!isComplete && (
              <button
                onClick={() => markSectionComplete(section.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>Marcar como leído</span>
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header de progreso */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{content.title}</h1>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
            style={{ width: `${(completedSections.size / content.sections.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Progreso: {completedSections.size}/{content.sections.length} secciones completadas
        </p>
      </div>

      {/* Secciones interactivas */}
      <div className="space-y-6">
        {content.sections.map((section, index) => renderSection(section, index))}
      </div>

      {/* Botón de finalización */}
      {completedSections.size === content.sections.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-lg text-center"
        >
          <CheckCircleIcon className="h-12 w-12 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">¡Lección Completada!</h3>
          <p className="mb-4">Has completado exitosamente todas las secciones de esta lección.</p>
          <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Continuar al siguiente tema
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default InteractiveContent;
