/**
 * Skeleton de carga para CourseDetailPage
 */
import React from 'react';

const CourseDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Imagen del curso */}
          <div className="lg:w-2/5">
            <div className="w-full h-64 bg-gray-300 rounded-lg"></div>
          </div>
          
          {/* Info del curso */}
          <div className="lg:w-3/5 space-y-4">
            {/* Título */}
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            
            {/* Metadatos */}
            <div className="flex flex-wrap gap-4">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            
            {/* Descripción */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="text-center">
                <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="text-center">
                <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-14"></div>
              </div>
            </div>
            
            {/* Botón de acción */}
            <div className="h-12 bg-gray-300 rounded-lg w-48"></div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <div className="h-12 w-20 bg-gray-200 rounded-t my-2"></div>
            <div className="h-12 w-24 bg-gray-200 rounded-t my-2"></div>
            <div className="h-12 w-28 bg-gray-200 rounded-t my-2"></div>
          </nav>
        </div>
        
        {/* Content Skeleton */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Sección de descripción */}
            <div>
              <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
            
            {/* Sección de objetivos */}
            <div>
              <div className="h-6 bg-gray-300 rounded w-56 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-start space-x-3">
                    <div className="h-5 w-5 bg-gray-200 rounded-full mt-0.5"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sección de requisitos */}
            <div>
              <div className="h-6 bg-gray-300 rounded w-44 mb-4"></div>
              <div className="space-y-3">
                {[1, 2].map((item) => (
                  <div key={item} className="flex items-start space-x-3">
                    <div className="h-5 w-5 bg-gray-200 rounded-full mt-0.5"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons List Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="h-7 bg-gray-300 rounded w-40"></div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Número de lección */}
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  
                  {/* Info de lección */}
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                
                {/* Duración */}
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailSkeleton;
