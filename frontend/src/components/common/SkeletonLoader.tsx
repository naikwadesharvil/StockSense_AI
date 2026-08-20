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
          className={`animate-pulse bg-slate-200 dark:bg-[#111726] border border-transparent dark:border-[#1E293B] rounded-xl ${className}`} 
        />
      ))}
    </div>
  );
};
