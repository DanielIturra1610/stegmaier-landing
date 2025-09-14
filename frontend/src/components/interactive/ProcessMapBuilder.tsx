/**
 * Componente interactivo para construir mapas de procesos
 * Permite a los estudiantes crear diagramas de flujo paso a paso
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  StopIcon, 
  DocumentIcon, 
  PuzzlePieceIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface ProcessStep {
  id: string;
  type: 'start' | 'process' | 'decision' | 'document' | 'end';
  text: string;
  x: number;
  y: number;
  connections: string[];
}

interface ProcessMapBuilderProps {
  title: string;
  description: string;
  targetSteps: ProcessStep[];
  onComplete: () => void;
}

const ProcessMapBuilder: React.FC<ProcessMapBuilderProps> = ({
  title,
  description,
  targetSteps,
  onComplete
}) => {
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [selectedTool, setSelectedTool] = useState<ProcessStep['type']>('start');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const tools = [
    { type: 'start' as const, icon: PlayIcon, label: 'Inicio', color: 'bg-green-500' },
    { type: 'process' as const, icon: PuzzlePieceIcon, label: 'Proceso', color: 'bg-blue-500' },
    { type: 'decision' as const, icon: ArrowRightIcon, label: 'Decisión', color: 'bg-yellow-500' },
    { type: 'document' as const, icon: DocumentIcon, label: 'Documento', color: 'bg-purple-500' },
    { type: 'end' as const, icon: StopIcon, label: 'Fin', color: 'bg-red-500' }
  ];

  const addStep = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStep: ProcessStep = {
      id: `step-${Date.now()}`,
      type: selectedTool,
      text: getDefaultText(selectedTool),
      x,
      y,
      connections: []
    };

    setSteps(prev => [...prev, newStep]);
  }, [selectedTool]);

  const getDefaultText = (type: ProcessStep['type']) => {
    switch (type) {
      case 'start': return 'Inicio';
      case 'process': return 'Proceso';
      case 'decision': return '¿Decisión?';
      case 'document': return 'Documento';
      case 'end': return 'Fin';
      default: return 'Elemento';
    }
  };

  const getStepShape = (type: ProcessStep['type']) => {
    switch (type) {
      case 'start':
      case 'end':
        return 'rounded-full';
      case 'decision':
        return 'transform rotate-45 rounded-sm';
      case 'document':
        return 'rounded-t-lg rounded-b-none';
      default:
        return 'rounded-lg';
    }
  };

  const getStepColor = (type: ProcessStep['type']) => {
    switch (type) {
      case 'start': return 'bg-green-500 text-white';
      case 'process': return 'bg-blue-500 text-white';
      case 'decision': return 'bg-yellow-500 text-black';
      case 'document': return 'bg-purple-500 text-white';
      case 'end': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleStepClick = (stepId: string) => {
    if (connectionMode) {
      if (!connectingFrom) {
        setConnectingFrom(stepId);
      } else if (connectingFrom !== stepId) {
        // Crear conexión
        setSteps(prev => prev.map(step => 
          step.id === connectingFrom 
            ? { ...step, connections: [...step.connections, stepId] }
            : step
        ));
        setConnectingFrom(null);
        setConnectionMode(false);
      }
    } else {
      setSelectedStep(stepId);
    }
  };

  const updateStepText = (stepId: string, newText: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, text: newText } : step
    ));
  };

  const deleteStep = (stepId: string) => {
    setSteps(prev => prev.filter(step => step.id !== stepId));
    setSelectedStep(null);
  };

  const validateMap = () => {
    const hasStart = steps.some(step => step.type === 'start');
    const hasEnd = steps.some(step => step.type === 'end');
    const hasProcess = steps.some(step => step.type === 'process');
    const minSteps = steps.length >= 3;

    if (hasStart && hasEnd && hasProcess && minSteps) {
      setIsCompleted(true);
      onComplete();
    }
  };

  const resetCanvas = () => {
    setSteps([]);
    setSelectedStep(null);
    setConnectionMode(false);
    setConnectingFrom(null);
    setIsCompleted(false);
  };

  // Renderizar conexiones entre pasos
  const renderConnections = () => {
    return steps.map(step => 
      step.connections.map(targetId => {
        const targetStep = steps.find(s => s.id === targetId);
        if (!targetStep) return null;

        return (
          <line
            key={`${step.id}-${targetId}`}
            x1={step.x + 50}
            y1={step.y + 25}
            x2={targetStep.x + 50}
            y2={targetStep.y + 25}
            stroke="#3B82F6"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        );
      })
    );
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
      <div className="flex items-center space-x-3 mb-4">
        <SparklesIcon className="h-6 w-6 text-indigo-600" />
        <h3 className="text-xl font-semibold text-indigo-800">{title}</h3>
      </div>
      
      <p className="text-indigo-700 mb-6">{description}</p>

      {isCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-green-50 border border-green-200 p-8 rounded-lg"
        >
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-green-800 mb-2">¡Mapa de Procesos Creado!</h4>
          <p className="text-green-700 mb-4">Has construido exitosamente un diagrama de flujo básico.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetCanvas}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Crear Otro Mapa
            </button>
            <button
              onClick={() => setIsCompleted(false)}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Continuar Lección
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Herramientas */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Herramientas de Diagramación:</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {tools.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => setSelectedTool(tool.type)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedTool === tool.type 
                      ? `${tool.color} text-white border-transparent` 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <tool.icon className="h-4 w-4" />
                  <span className="text-sm">{tool.label}</span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConnectionMode(!connectionMode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  connectionMode 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {connectionMode ? 'Cancelar Conexión' : 'Conectar Elementos'}
              </button>
              
              <button
                onClick={validateMap}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Validar Mapa
              </button>
              
              <button
                onClick={resetCanvas}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Limpiar Canvas
              </button>
            </div>
          </div>

          {/* Canvas de dibujo */}
          <div className="relative">
            <div
              ref={canvasRef}
              onClick={addStep}
              className="relative w-full h-96 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair overflow-hidden"
            >
              {/* SVG para las conexiones */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#3B82F6"
                    />
                  </marker>
                </defs>
                {renderConnections()}
              </svg>

              {/* Elementos del proceso */}
              {steps.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ left: step.x, top: step.y }}
                  className="absolute pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepClick(step.id);
                  }}
                >
                  <div className={`
                    w-24 h-12 flex items-center justify-center cursor-pointer border-2 border-white
                    ${getStepShape(step.type)} ${getStepColor(step.type)}
                    ${selectedStep === step.id ? 'ring-2 ring-blue-400' : ''}
                    ${connectingFrom === step.id ? 'ring-2 ring-orange-400' : ''}
                    hover:shadow-lg transition-all duration-200
                  `}>
                    <span className="text-xs font-medium text-center px-1">
                      {step.text}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Instrucciones en canvas vacío */}
              {steps.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                  <div className="text-center">
                    <PuzzlePieceIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Haz clic para agregar elementos al mapa</p>
                    <p className="text-sm">Selecciona una herramienta y haz clic en el canvas</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel de edición */}
          {selectedStep && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-white border border-gray-200 p-4 rounded-lg"
            >
              <h5 className="font-semibold text-gray-800 mb-3">Editar Elemento</h5>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={steps.find(s => s.id === selectedStep)?.text || ''}
                  onChange={(e) => updateStepText(selectedStep, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Texto del elemento"
                />
                <button
                  onClick={() => deleteStep(selectedStep)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          )}

          {/* Instrucciones */}
          <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h5 className="font-semibold text-blue-800 mb-2">Instrucciones:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Selecciona una herramienta y haz clic en el canvas para agregar elementos</li>
              <li>• Haz clic en "Conectar Elementos" y luego en dos elementos para unirlos</li>
              <li>• Haz clic en un elemento para editarlo o eliminarlo</li>
              <li>• Tu mapa debe tener al menos: Inicio, Proceso y Fin para ser válido</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ProcessMapBuilder;
