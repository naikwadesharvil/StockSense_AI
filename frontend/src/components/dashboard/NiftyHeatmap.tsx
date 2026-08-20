import React, { useState } from 'react';
import { NiftyTrendingStock } from '../../types/stock';

interface NiftyHeatmapProps {
  stocks: NiftyTrendingStock[];
  onSelectStock: (symbol: string) => void;
  isMarketOpen?: boolean;
  marketStatus?: string;
}

export const NiftyHeatmap: React.FC<NiftyHeatmapProps> = ({
  stocks,
  onSelectStock,
  isMarketOpen = false,
  marketStatus = 'CLOSED'
}) => {
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers' | 'hightrend'>('all');
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  const filteredStocks = stocks.filter(s => {
    if (filter === 'gainers') return s.daily_change_percentage > 0;
    if (filter === 'losers') return s.daily_change_percentage < 0;
    if (filter === 'hightrend') return s.trend_score >= 60;
    return true;
  });

  const getHeatmapColor = (pct: number) => {
    if (pct >= 3.0) return 'bg-emerald-600/70 hover:bg-emerald-600 text-white border-emerald-400/60 shadow-sm shadow-emerald-600/20';
    if (pct >= 1.5) return 'bg-emerald-500/40 hover:bg-emerald-500/60 text-emerald-100 border-emerald-500/40';
    if (pct >= 0.5) return 'bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border-emerald-500/25';
    if (pct >= 0.0) return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
    if (pct >= -0.5) return 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20';
    if (pct >= -1.5) return 'bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border-rose-500/25';
    if (pct >= -3.0) return 'bg-rose-500/40 hover:bg-rose-500/60 text-rose-100 border-rose-500/40';
    return 'bg-rose-600/70 hover:bg-rose-600 text-white border-rose-400/60 shadow-sm shadow-rose-600/20';
  };

  const hoveredStock = stocks.find(s => s.symbol === hoveredSymbol);

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>NIFTY 50 Market Heatmap</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {stocks.length} Constituents
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Color intensity indicates percentage return magnitude. Click any security to launch deep-dive forecasts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#0B0F17] rounded-xl border border-slate-200 dark:border-[#1E293B] text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All 50
          </button>
          <button
            onClick={() => setFilter('gainers')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'gainers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Gainers ({stocks.filter(s => s.daily_change_percentage > 0).length})
          </button>
          <button
            onClick={() => setFilter('losers')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'losers'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Losers ({stocks.filter(s => s.daily_change_percentage < 0).length})
          </button>
          <button
            onClick={() => setFilter('hightrend')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filter === 'hightrend'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            High Trend (&gt;60)
          </button>
        </div>
      </div>

      {/* Heatmap 50-Tile Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {filteredStocks.map((stk) => {
          const isPositive = stk.daily_change_percentage >= 0;
          const colorClass = getHeatmapColor(stk.daily_change_percentage);

          return (
            <button
              key={stk.symbol}
              onClick={() => onSelectStock(stk.symbol)}
              onMouseEnter={() => setHoveredSymbol(stk.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
              className={`p-2.5 rounded-xl border transition-all duration-150 transform hover:scale-[1.04] text-left flex flex-col justify-between h-20 ${colorClass}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono font-extrabold text-xs tracking-tight">
                  {stk.symbol}
                </span>
                <span className="text-[9px] font-mono opacity-80 bg-black/20 px-1 py-0.2 rounded">
                  #{stk.rank}
                </span>
              </div>

              <div>
                <div className="font-mono font-bold text-[11px] opacity-95">
                  ₹{stk.current_price.toFixed(0)}
                </div>
                <div className="font-mono font-extrabold text-[11px] flex items-center justify-between">
                  <span>{isPositive ? '+' : ''}{stk.daily_change_percentage.toFixed(2)}%</span>
                  <span className="text-[9px] opacity-75">T:{stk.trend_score}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Hover Inspection Bar / Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        {hoveredStock ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {hoveredStock.symbol} — {hoveredStock.company_name}
            </span>
            <span className="text-slate-400">
              Sector: <strong className="text-slate-300">{hoveredStock.sector}</strong>
            </span>
            <span className="text-slate-400 font-mono">
              Vol: {(hoveredStock.volume / 1e6).toFixed(2)}M (RVOL: {hoveredStock.relative_volume}x)
            </span>
            <span className="text-slate-400 font-mono">
              Trend: <strong className="text-indigo-400">{hoveredStock.trend_category}</strong>
            </span>
          </div>
        ) : (
          <div className="text-slate-400 text-[11px]">
            Hover over any tile for constituent metadata or click to open workbench.
          </div>
        )}

        {/* Color Scale Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 shrink-0">
          <span>&lt; -3%</span>
          <div className="flex h-2.5 w-24 rounded overflow-hidden">
            <div className="bg-rose-600 flex-1" />
            <div className="bg-rose-500/50 flex-1" />
            <div className="bg-rose-500/20 flex-1" />
            <div className="bg-emerald-500/20 flex-1" />
            <div className="bg-emerald-500/50 flex-1" />
            <div className="bg-emerald-600 flex-1" />
          </div>
          <span>&gt; +3%</span>
        </div>
      </div>
    </div>
  );
};
