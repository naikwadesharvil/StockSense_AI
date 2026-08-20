import React from 'react';
import { StockOverview } from '../../types/stock';

interface MarketOverviewCardProps {
  overview: StockOverview | null;
  totalMarketTurnover?: string;
  totalMarketCap?: string;
  rsiValue?: number;
  marketSentimentScore?: number;
}

export const MarketOverviewCard: React.FC<MarketOverviewCardProps> = ({
  overview,
  totalMarketTurnover = '₹1.24T',
  totalMarketCap = '₹420.5T',
  rsiValue = 54.2,
  marketSentimentScore = 58
}) => {
  if (!overview) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] shadow-sm animate-pulse h-full">
        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
        <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  const currSym = overview.currency_symbol || '$';
  const isPositive = overview.daily_change >= 0;

  // 52-Week Range
  const w52Span = overview.week_52_high - overview.week_52_low || 1;
  const w52Pos = Math.max(0, Math.min(100, ((overview.current_price - overview.week_52_low) / w52Span) * 100));

  // Day Range
  const daySpan = overview.day_high - overview.day_low || 1;
  const dayPos = Math.max(0, Math.min(100, ((overview.current_price - overview.day_low) / daySpan) * 100));

  // Quantitative Sentiment Category
  const getSentimentLabel = (score: number) => {
    if (score >= 75) return { label: 'Extreme Greed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 55) return { label: 'Greed / Bullish', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 45) return { label: 'Neutral Zone', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    if (score >= 25) return { label: 'Fear / Caution', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    return { label: 'Extreme Fear', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const sentiment = getSentimentLabel(marketSentimentScore);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Market Overview
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60">
            {overview.exchange}
          </span>
        </div>

        {/* Selected Benchmark Value */}
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              {currSym}{overview.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">
              {overview.name} ({overview.symbol})
            </div>
          </div>
          <div className={`text-right text-xs font-mono font-bold px-2 py-1 rounded-lg ${
            isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
          }`}>
            <div>{isPositive ? '+' : ''}{overview.daily_change.toFixed(2)}</div>
            <div>({isPositive ? '+' : ''}{overview.daily_change_pct.toFixed(2)}%)</div>
          </div>
        </div>

        {/* 52-Week Range Bar */}
        <div className="space-y-1.5 py-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>52W Low: <strong className="text-slate-700 dark:text-slate-300">{currSym}{overview.week_52_low.toFixed(1)}</strong></span>
            <span className="text-slate-400 text-[10px]">52W Pos: {w52Pos.toFixed(0)}%</span>
            <span>52W High: <strong className="text-slate-700 dark:text-slate-300">{currSym}{overview.week_52_high.toFixed(1)}</strong></span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden relative">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${w52Pos}%` }}
            />
          </div>
        </div>

        {/* Day Range Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>Day Low: <strong className="text-slate-700 dark:text-slate-300">{currSym}{overview.day_low.toFixed(1)}</strong></span>
            <span className="text-slate-400 text-[10px]">Session Pos: {dayPos.toFixed(0)}%</span>
            <span>Day High: <strong className="text-slate-700 dark:text-slate-300">{currSym}{overview.day_high.toFixed(1)}</strong></span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden relative">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${dayPos}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quantitative Sentiment / Valuation Summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Quantitative Market Bias
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              RSI (14): <span className="font-bold text-slate-900 dark:text-white">{rsiValue}</span>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${sentiment.color}`}>
            {sentiment.label} ({marketSentimentScore})
          </div>
        </div>
      </div>
    </div>
  );
};
