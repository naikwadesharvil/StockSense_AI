import React from 'react';

interface DashboardSectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'green' | 'red' | 'blue' | 'purple' | 'neutral';
  actions?: React.ReactNode;
}

export const DashboardSectionHeader: React.FC<DashboardSectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeType = 'neutral',
  actions
}) => {
  const badgeStyles = {
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    purple: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
      <div className="flex items-center gap-2.5 flex-wrap">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {badge && (
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeStyles[badgeType]}`}>
            {badge}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
            • {subtitle}
          </span>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
