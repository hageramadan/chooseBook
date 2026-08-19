// components/ui/LoadingSpinner.tsx (مكون منفصل)
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', text = 'جاري التحميل', fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Spinner دائري متحرك - أحمر وأسود */}
        <div className={`${sizeClasses[size]} border-4 border-gray-300 border-t-primary rounded-full animate-spin`}></div>
        
        {/* Spinner داخلي - أسود */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-b-black rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
      </div>
      
      {text && (
        <div className="text-center">
          <p className="text-gray-700 font-medium">{text}</p>
          <div className="flex justify-center gap-1 mt-2">
            <div className="w-1.5 h-1.5 bg-main rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-main rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      {spinnerContent}
    </div>
  );
}