import React from 'react';
import { useStock } from '../../context/StockContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStock();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const bg = {
          success: 'bg-emerald-600 text-white border-emerald-500',
          error: 'bg-rose-600 text-white border-rose-500',
          warning: 'bg-amber-600 text-white border-amber-500',
          info: 'bg-slate-900 text-white border-slate-700'
        }[toast.type];

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 animate-slide-up ${bg}`}
          >
            <span>{toast.message}</span>
            <button className="ml-3 opacity-80 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        );
      })}
    </div>
  );
};
