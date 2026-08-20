import React from 'react';
import { NiftyTrendingStock } from '../../types/stock';

interface AIInsightCardProps {
  stocks: NiftyTrendingStock[];
  advances: number;
  declines: number;
  avgChangePct: number;
  onExploreForecasts?: () => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  stocks,
  advances,
  declines,
  avgChangePct,
  onExploreForecasts
}) => {
  const total = Math.max(stocks.length, 1);
  const advRatio = advances / total;

  // Identify top performing sectors
  const sectorMap = new Map<string, { total: number; count: number }>();
  stocks.forEach(s => {
    const sec = s.sector || 'Equities';
    const cur = sectorMap.get(sec) || { total: 0, count: 0 };
    cur.total += s.daily_change_percentage;
    cur.count += 1;
    sectorMap.set(sec, cur);
  });

  const sortedSectors = Array.from(sectorMap.entries())
    .map(([sec, val]) => ({ sector: sec, avgPct: val.total / val.count }))
    .sort((a, b) => b.avgPct - a.avgPct);

  const topSector = sortedSectors[0]?.sector || 'Banking & Finance';
  const topSectorPct = sortedSectors[0]?.avgPct.toFixed(2) || '0.00';

  // Identify top momentum leader
  const topLeader = [...stocks].sort((a, b) => b.trend_score - a.trend_score)[0];

  // Market bias calculation
  let biasTitle = 'Consolidation & Active Range';
  let biasBadge = 'NEUTRAL';
  let biasColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
  let explanation = `Market is in balanced equilibrium with ${advances} advancing and ${declines} declining securities.`;

  if (advRatio >= 0.65) {
    biasTitle = 'Broad-Based Bullish Expansion';
    biasBadge = 'BULLISH';
    biasColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    explanation = `Strong upward participation across ${advances} of ${total} securities. Relative volume indicates institutional accumulation in ${topSector}.`;
  } else if (advRatio >= 0.52) {
    biasTitle = 'Moderate Bullish Bias';
    biasBadge = 'MILD BULLISH';
    biasColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    explanation = `Selective buying momentum concentrated in ${topSector} (+${topSectorPct}%), with positive breadth across key blue chips.`;
  } else if (advRatio <= 0.35) {
    biasTitle = 'Systematic Bearish Pressure';
    biasBadge = 'BEARISH';
    biasColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    explanation = `Broad profit taking observed with ${declines} of ${total} securities under selling pressure. Look for mean-reversion support.`;
  } else if (advRatio <= 0.48) {
    biasTitle = 'Mild Distribution Pressure';
    biasBadge = 'MILD BEARISH';
    biasColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    explanation = `Decline ratio elevated at ${Math.round((declines / total) * 100)}%. Volatility clustering suggests cautious positioning.`;
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-[#111726] to-[#111726] border border-indigo-500/25 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              AI Market Insight
            </h3>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${biasColor}`}>
            {biasBadge}
          </span>
        </div>

        {/* Bias title & explanation */}
        <div className="mb-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {biasTitle}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Factor points */}
        <div className="space-y-2 mt-3 pt-2 border-t border-slate-100 dark:border-[#1E293B] text-xs">
          <div className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-transparent dark:border-[#1E293B]">
            <span className="text-slate-500 dark:text-slate-400">Leading Sector:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {topSector} ({topSectorPct >= '0' ? '+' : ''}{topSectorPct}%)
            </span>
          </div>

          {topLeader && (
            <div className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-transparent dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Trend Leader:</span>
              <span className="font-mono font-bold text-indigo-400">
                {topLeader.symbol} (Score: {topLeader.trend_score})
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-transparent dark:border-[#1E293B]">
            <span className="text-slate-500 dark:text-slate-400">Market Breadth:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {advances} Adv / {declines} Dec ({Math.round(advRatio * 100)}% Bullish)
            </span>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
        <button
          onClick={onExploreForecasts}
          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20"
        >
          <span>Launch AI Forecast Workbench</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
