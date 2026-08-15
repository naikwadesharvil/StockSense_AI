import React from 'react';
import { DataProvenance } from '../../types/stock';

interface ProvenanceBadgeProps {
  provenance?: DataProvenance;
  lastUpdated?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, lastUpdated }) => {
  if (!provenance) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        <span>MARKET DATA</span>
      </div>
    );
  }

  const { freshness, market_status, is_live, is_fallback, timestamp, source } = provenance;

  // Determine badge styling and label
  let dotColor = 'bg-amber-400 animate-pulse';
  let badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  let label = '15-MIN DELAYED';

  if (is_fallback || freshness === 'FALLBACK') {
    dotColor = 'bg-rose-400';
    badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    label = 'HISTORICAL FALLBACK';
  } else if (market_status === 'CLOSED' || freshness === 'HISTORICAL') {
    dotColor = 'bg-slate-400';
    badgeClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    label = 'LAST CLOSE';
  } else if (is_live || freshness === 'LIVE') {
    dotColor = 'bg-emerald-400 animate-pulse';
    badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    label = 'LIVE MARKET DATA';
  } else if (freshness === 'UNAVAILABLE') {
    dotColor = 'bg-rose-500';
    badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    label = 'DATA UNAVAILABLE';
  }

  return (
    <div 
      title={`Source: ${source} | Time: ${timestamp || lastUpdated || ''} | Market: ${market_status}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{label}</span>
      {timestamp && (
        <span className="hidden lg:inline text-[10px] opacity-75 font-normal ml-0.5">
          ({timestamp.split(' ')[0]})
        </span>
      )}
    </div>
  );
};
