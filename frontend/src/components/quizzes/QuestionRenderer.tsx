/**
 * QuestionRenderer - Renderiza diferentes tipos de preguntas para quizzes
 * Soporta: multiple choice, true/false, fill-in-blank, ordering, matching
 */
import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { QuestionRendererProps, QuestionType, Question } from '../../types/quiz';
import quizService from '../../services/quizService';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowsUpDownIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

// Detectar si es dispositivo táctil
const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onAnswerChange,
  disabled = false,
  showCorrectAnswer = false,
  timeRemaining
}) => {
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });

  // Validar respuesta cuando cambia
  useEffect(() => {
    if (answer !== undefined) {
      const isValid = quizService.validateAnswer(question, answer);
      setValidation({ isValid, message: isValid ? undefined : 'Respuesta inválida' });
    }
  }, [question, answer]);

  const renderMultipleChoice = () => {
    return (
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = answer === option.id;
          const isCorrect = showCorrectAnswer && option.is_correct;
          const isWrong = showCorrectAnswer && isSelected && !option.is_correct;
          
          return (
            <label
              key={option.id}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
              } ${
                isSelected 
                  ? isCorrect 
                    ? 'border-green-500 bg-green-50' 
                    : isWrong 
                      ? 'border-red-500 bg-red-50'
                      : 'border-primary-500 bg-primary-50'
                  : isCorrect && showCorrectAnswer
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={isSelected}
                onChange={(e) => onAnswerChange(e.target.value)}
                disabled={disabled}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <div className="ml-3 flex-1">
                <span className="text-gray-900">{option.text}</span>
                
                {showCorrectAnswer && (
                  <div className="mt-2 flex items-center">
                    {option.is_correct ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">Respuesta correcta</span>
                      </div>
                    ) : isSelected ? (
                      <div className="flex items-center text-red-600">
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm">Respuesta incorrecta</span>
                      </div>
                    ) : null}
                    
                    {option.explanation && (option.is_correct || isSelected) && (
                      <div className="mt-1 text-sm text-gray-600">
                        {option.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = () => {
    const trueOption = question.options.find(opt => opt.text.toLowerCase().includes('verdadero') || opt.text.toLowerCase().includes('true'));
    const falseOption = question.options.find(opt => opt.text.toLowerCase().includes('falso') || opt.text.toLowerCase().includes('false'));
    
    return (
      <div className="space-y-3">
        {[trueOption, falseOption].filter(Boolean).map((option) => {
          if (!option) return null;
          
          const isSelected = answer === option.id;
          const isCorrect = showCorrectAnswer && option.is_correct;
          const isWrong = showCorrectAnswer && isSelected && !option.is_correct;
          
          return (
            <label
              key={option.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
              } ${
                isSelected 
                  ? isCorrect 
                    ? 'border-green-500 bg-green-50' 
                    : isWrong 
                      ? 'border-red-500 bg-red-50'
                      : 'border-primary-500 bg-primary-50'
                  : isCorrect && showCorrectAnswer
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={isSelected}
                onChange={(e) => onAnswerChange(e.target.value)}
                disabled={disabled}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-3 text-lg font-medium">{option.text}</span>
              
              {showCorrectAnswer && isCorrect && (
                <CheckCircleIcon className="ml-auto h-5 w-5 text-green-600" />
              )}
            </label>
          );
        })}
        
        {showCorrectAnswer && question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderFillInBlank = () => {
    const currentAnswer = answer || '';
    const isCorrect = showCorrectAnswer && question.correct_answers.some(correct => 
      question.case_sensitive 
        ? correct === currentAnswer 
        : correct.toLowerCase() === currentAnswer.toLowerCase()
    );
    
    return (
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={currentAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="Escribe tu respuesta aquí..."
            className={`w-full p-3 border-2 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${
              showCorrectAnswer 
                ? isCorrect 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300'
            }`}
            rows={3}
          />
          
          {showCorrectAnswer && (
            <div className="absolute top-2 right-2">
              {isCorrect ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-600" />
              )}
            </div>
          )}
        </div>
        
        {showCorrectAnswer && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Respuestas correctas:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              {question.correct_answers.map((correct, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                  {correct}
                </li>
              ))}
            </ul>
            {question.explanation && (
              <p className="mt-3 text-sm text-blue-800">{question.explanation}</p>
            )}
          </div>
        )}
        
        <div className="text-sm text-gray-500">
          {question.case_sensitive ? 'Sensible a mayúsculas y minúsculas' : 'No sensible a mayúsculas y minúsculas'}
        </div>
      </div>
    );
  };

  // Componente para elementos arrastrables en ordering
  const DraggableItem: React.FC<{ item: string; index: number; moveItem: (from: number, to: number) => void }> = ({ 
    item, 
    index, 
    moveItem 
  }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'item',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'item',
      hover: (draggedItem: { index: number }) => {
        if (draggedItem.index !== index) {
          moveItem(draggedItem.index, index);
          draggedItem.index = index;
        }
      },
    });

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`p-3 bg-white border-2 border-gray-300 rounded-lg cursor-move transition-all ${
          isDragging ? 'opacity-50' : 'hover:border-primary-400'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex items-center">
          <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-600 mr-2">#{index + 1}</span>
          <span>{item}</span>
        </div>
      </div>
    );
  };

  const renderOrdering = () => {
    const currentOrder = Array.isArray(answer) ? answer : question.correct_answers.slice().sort(() => Math.random() - 0.5);
    
    const moveItem = (fromIndex: number, toIndex: number) => {
      if (disabled) return;
      
      const newOrder = [...currentOrder];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedItem);
      onAnswerChange(newOrder);
    };

    const Backend = isTouchDevice() ? TouchBackend : HTML5Backend;

    return (
      <DndProvider backend={Backend}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Arrastra los elementos para ordenarlos correctamente:
          </p>
          
          <div className="space-y-2">
            {currentOrder.map((item, index) => (
              <DraggableItem
                key={`${item}-${index}`}
                item={item}
                index={index}
                moveItem={moveItem}
              />
            ))}
          </div>
          
          {showCorrectAnswer && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Orden correcto:</p>
              <ol className="text-sm text-blue-800 space-y-1">
                {question.correct_answers.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <span className="font-medium mr-2">{index + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
              {question.explanation && (
                <p className="mt-3 text-sm text-blue-800">{question.explanation}</p>
              )}
            </div>
          )}
        </div>
      </DndProvider>
    );
  };

  const renderMatching = () => {
    const pairs = question.pairs || [];
    const leftItems = pairs.map(pair => Object.keys(pair)[0]);
    const rightItems = pairs.map(pair => Object.values(pair)[0]).sort(() => Math.random() - 0.5);
    const currentMatches = typeof answer === 'object' ? answer : {};

    const handleMatch = (leftItem: string, rightItem: string) => {
      if (disabled) return;
      
      const newMatches = { ...currentMatches };
      
      // Remover matching previo de rightItem
      Object.keys(newMatches).forEach(key => {
        if (newMatches[key] === rightItem) {
          delete newMatches[key];
        }
      });
      
      // Agregar nuevo matching
      newMatches[leftItem] = rightItem;
      onAnswerChange(newMatches);
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Conecta cada elemento de la izquierda con su pareja correcta de la derecha:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Elementos</h4>
            {leftItems.map((leftItem, index) => (
              <div key={index} className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <span>{leftItem}</span>
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </div>
                {currentMatches[leftItem] && (
                  <div className="mt-2 text-sm text-primary-600 font-medium">
                    → {currentMatches[leftItem]}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Columna derecha */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Opciones</h4>
            {rightItems.map((rightItem, index) => {
              const isUsed = Object.values(currentMatches).includes(rightItem);
              const isCorrect = showCorrectAnswer && pairs.some(pair => 
                Object.values(pair)[0] === rightItem
              );
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    // Encontrar leftItem que debería ir con este rightItem
                    const matchingLeft = Object.keys(currentMatches).find(key => currentMatches[key] === rightItem);
                    if (matchingLeft) {
                      // Si ya está emparejado, desemparejarlo
                      const newMatches = { ...currentMatches };
                      delete newMatches[matchingLeft];
                      onAnswerChange(newMatches);
                    }
                  }}
                  disabled={disabled}
                  className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                    disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary-400'
                  } ${
                    isUsed 
                      ? showCorrectAnswer && isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {rightItem}
                  {isUsed && (
                    <div className="mt-1 text-xs text-primary-600">
                      Emparejado
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {showCorrectAnswer && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Emparejamientos correctos:</p>
            <div className="text-sm text-blue-800 space-y-1">
              {pairs.map((pair, index) => {
                const [key, value] = Object.entries(pair)[0];
                return (
                  <div key={index} className="flex items-center">
                    <span className="font-medium">{key}</span>
                    <span className="mx-2">↔</span>
                    <span>{value}</span>
                  </div>
                );
              })}
            </div>
            {question.explanation && (
              <p className="mt-3 text-sm text-blue-800">{question.explanation}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderQuestion = () => {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return renderMultipleChoice();
      case QuestionType.TRUE_FALSE:
        return renderTrueFalse();
      case QuestionType.FILL_IN_BLANK:
        return renderFillInBlank();
      case QuestionType.ORDERING:
        return renderOrdering();
      case QuestionType.MATCHING:
        return renderMatching();
      case QuestionType.ESSAY:
        return renderFillInBlank(); // Usar el mismo renderer para essays
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              Tipo de pregunta no soportado: {question.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderQuestion()}
      
      {/* Validación de respuesta */}
      {!validation.isValid && validation.message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{validation.message}</p>
        </div>
      )}
      
      {/* Timer individual de pregunta */}
      {timeRemaining && question.time_limit && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            Tiempo restante para esta pregunta: {quizService.formatTimeRemaining(timeRemaining || 0)}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
