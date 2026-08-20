import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: number;
  changeSuffix?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  badge?: string;
  badgeType?: 'green' | 'red' | 'blue' | 'yellow' | 'neutral';
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  change,
  changeSuffix = '%',
  icon,
  tooltip,
  badge,
  badgeType = 'neutral',
  highlight = false
}) => {
  const isPositive = change !== undefined ? change > 0 : null;
  const isZero = change !== undefined ? change === 0 : null;

  const badgeStyles = {
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    yellow: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${
      highlight 
        ? 'bg-gradient-to-br from-indigo-500/10 via-[#111726] to-[#111726] border-indigo-500/40 shadow-lg shadow-indigo-500/5' 
        : 'bg-white dark:bg-[#111726] border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5" title={tooltip}>
          {icon && <span className="opacity-75">{icon}</span>}
          {label}
        </span>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyles[badgeType]}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          {value}
        </div>
        {change !== undefined && (
          <div className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
            isPositive
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : isZero
              ? 'text-slate-500 dark:text-slate-400 bg-slate-500/10'
              : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
          }`}>
            <span>{isPositive ? '▲ +' : isZero ? '• ' : '▼ '}</span>
            <span>{change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)}{changeSuffix}</span>
          </div>
        )}
      </div>

      {subValue && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
          {subValue}
        </div>
      )}
    </div>
  );
};
