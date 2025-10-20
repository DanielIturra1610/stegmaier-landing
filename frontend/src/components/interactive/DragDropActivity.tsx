/**
 * Componente de actividad Drag & Drop para lecciones interactivas
 */
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface DragDropItem {
  id: string;
  text: string;
  category: string;
}

interface DragDropCategory {
  id: string;
  title: string;
}

interface DragDropActivityProps {
  items: DragDropItem[];
  categories: DragDropCategory[];
  title: string;
  description: string;
  onComplete: () => void;
}

const DragDropActivity: React.FC<DragDropActivityProps> = ({
  items,
  categories,
  title,
  description,
  onComplete
}) => {
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);
  const [droppedItems, setDroppedItems] = useState<{[categoryId: string]: DragDropItem[]}>({});
  const [availableItems, setAvailableItems] = useState<DragDropItem[]>(items);
  const [showResult, setShowResult] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleDragStart = (item: DragDropItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (categoryId: string) => {
    if (!draggedItem) return;

    // Verificar si es la categoría correcta
    const isCorrect = draggedItem.category === categoryId;
    
    if (isCorrect) {
      setDroppedItems(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), draggedItem]
      }));
      
      setAvailableItems(prev => prev.filter(item => item.id !== draggedItem.id));
    }
    
    setDraggedItem(null);
    
    // Verificar si se completó la actividad
    if (availableItems.length === 1 && isCorrect) {
      setTimeout(() => {
        setIsCompleted(true);
        onComplete();
      }, 500);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const resetActivity = () => {
    setDroppedItems({});
    setAvailableItems(items);
    setShowResult(false);
    setIsCompleted(false);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
      <div className="flex items-center space-x-3 mb-4">
        <SparklesIcon className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-blue-800">{title}</h3>
      </div>
      
      <p className="text-blue-700 mb-6">{description}</p>

      {isCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-green-50 border border-green-200 p-8 rounded-lg"
        >
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-green-800 mb-2">¡Excelente trabajo!</h4>
          <p className="text-green-700 mb-4">Has clasificado correctamente todos los conceptos.</p>
          <button
            onClick={resetActivity}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar Actividad
          </button>
        </motion.div>
      ) : (
        <>
          {/* Items disponibles para arrastrar */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Arrastra los conceptos a su categoría correcta:</h4>
            <div className="flex flex-wrap gap-3">
              {availableItems.map((item) => (
                <motion.div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragEnd={handleDragEnd}
                  whileHover={{ scale: 1.05 }}
                  whileDrag={{ scale: 1.1 }}
                  className={`bg-white border-2 border-gray-300 px-4 py-2 rounded-lg cursor-move shadow-sm hover:shadow-md transition-all duration-200 ${
                    draggedItem?.id === item.id ? 'opacity-50 border-blue-400' : ''
                  }`}
                >
                  {item.text}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Categorías de destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onDrop={() => handleDrop(category.id)}
                onDragOver={handleDragOver}
                className={`min-h-24 p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
                  draggedItem ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <h5 className="font-semibold text-gray-800 mb-2">{category.title}</h5>
                <div className="space-y-2">
                  {(droppedItems[category.id] || []).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-100 border border-green-300 px-3 py-1 rounded text-sm text-green-800"
                    >
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                      {item.text}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Indicador de progreso */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{items.length - availableItems.length}/{items.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                style={{ width: `${((items.length - availableItems.length) / items.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DragDropActivity;
