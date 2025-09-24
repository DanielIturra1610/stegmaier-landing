import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon } from '@heroicons/react/24/outline';

interface PreviewModeToggleProps {
  courseId: string;
  isInstructorView: boolean;
}

const PreviewModeToggle: React.FC<PreviewModeToggleProps> = ({ courseId, isInstructorView }) => {
  const navigate = useNavigate();

  const handleToggle = (mode: 'enrolled' | 'non_enrolled') => {
    localStorage.setItem('previewMode', JSON.stringify({ courseId, mode }));
    navigate(`/platform/admin/courses/${courseId}/preview?mode=${mode}`);
  };

  if (isInstructorView) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Vista Previa:</span>
        <button
          onClick={() => handleToggle('non_enrolled')}
          className="flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Como Visitante
        </button>
        <button
          onClick={() => handleToggle('enrolled')}
          className="flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Como Estudiante
        </button>
      </div>
    );
  }

  return null;
};

export default PreviewModeToggle;
