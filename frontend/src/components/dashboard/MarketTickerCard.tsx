import React from 'react';

export interface MarketTickerCardProps {
  name: string;
  symbol: string;
  value: number;
  change: number;
  change_pct: number;
  sparkline?: number[];
  currencySymbol?: string;
  isLive?: boolean;
  provenanceNote?: string;
  onClick?: () => void;
  decimals?: number;
}

export const MarketTickerCard: React.FC<MarketTickerCardProps> = ({
  name,
  symbol,
  value,
  change,
  change_pct,
  sparkline = [],
  currencySymbol = '',
  isLive = false,
  provenanceNote = 'Market Reference',
  onClick,
  decimals = 2
}) => {
  const isPositive = change >= 0;
  const formattedVal = value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  const formattedChange = (isPositive ? '+' : '') + change.toFixed(decimals);
  const formattedChangePct = (isPositive ? '+' : '') + change_pct.toFixed(2) + '%';

  // Render SVG Sparkline
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) {
      // Fallback mini decorative wave
      const dummyPoints = isPositive 
        ? [20, 22, 21, 24, 23, 26, 25, 29, 28, 32] 
        : [32, 30, 31, 28, 29, 25, 26, 22, 23, 19];
      const min = Math.min(...dummyPoints);
      const max = Math.max(...dummyPoints);
      const range = max - min || 1;
      const w = 80;
      const h = 28;
      const pts = dummyPoints.map((p, i) => {
        const x = (i / (dummyPoints.length - 1)) * w;
        const y = h - ((p - min) / range) * (h - 6) - 3;
        return `${x},${y}`;
      }).join(' ');

      return (
        <svg className="w-20 h-7 overflow-visible" viewBox="0 0 80 28">
          <polyline
            fill="none"
            stroke={isPositive ? '#10B981' : '#F43F5E'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pts}
          />
        </svg>
      );
    }

    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const w = 80;
    const h = 28;
    const pts = sparkline.map((p, i) => {
      const x = (i / (sparkline.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-20 h-7 overflow-visible" viewBox="0 0 80 28">
        <polyline
          fill="none"
          stroke={isPositive ? '#10B981' : '#F43F5E'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all duration-150 flex flex-col justify-between shrink-0 min-w-[200px] sm:min-w-0 ${
        onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-[#151d2f]' : ''
      }`}
      title={provenanceNote}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 tracking-tight">
            {name}
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            {symbol}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isLive ? (
            <span className="flex h-1.5 w-1.5 relative" title="Live Market Stream">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" title="Historical/Benchmark Quote"></span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 mt-1">
        <div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tracking-tight leading-none">
            {currencySymbol}{formattedVal}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono font-semibold">
            <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>
              {formattedChange}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${
              isPositive 
                ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' 
                : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
            }`}>
              {formattedChangePct}
            </span>
          </div>
        </div>

        <div className="shrink-0 pb-0.5">
          {renderSparkline()}
        </div>
      </div>
    </div>
  );
};
