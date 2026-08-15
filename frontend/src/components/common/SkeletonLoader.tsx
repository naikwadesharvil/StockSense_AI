import React from 'react';

export const SkeletonLoader: React.FC<{ count?: number; className?: string }> = ({ 
  count = 1, 
  className = "h-24 w-full" 
}) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={`animate-pulse bg-slate-200 dark:bg-slate-800/80 rounded-xl ${className}`} 
        />
      ))}
    </div>
  );
};
