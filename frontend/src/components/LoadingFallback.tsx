import React from 'react';

interface LoadingFallbackProps {
  type?: 'default' | 'form' | 'grid' | 'modal';
  className?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  type = 'default',
  className = ''
}) => {
  const baseClasses = "animate-pulse";

  switch (type) {
    case 'form':
      return (
        <div className={`p-4 border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
          <div className={baseClasses}>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      );

    case 'grid':
      return (
        <div className={`p-4 border border-gray-200 rounded-lg bg-gray-50 ${className}`}>
          <div className={baseClasses}>
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'modal':
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className={baseClasses}>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className={`p-4 ${className}`}>
          <div className={baseClasses}>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      );
  }
};

export default LoadingFallback;