import React from 'react';
import { useStock } from '../../context/StockContext';
import { MetricCard } from '../common/MetricCard';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { PriceChart } from '../charts/PriceChart';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { FundamentalsSection } from './FundamentalsSection';

export const DashboardView: React.FC = () => {
  const { overview, historicalData, forecastPkg, isLoading, setCurrentView } = useStock();

  if (isLoading || !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <SkeletonLoader count={4} className="h-28" />
        <SkeletonLoader count={1} className="h-96" />
      </div>
    );
  }

  const currSym = overview.currency_symbol || '$';
  const signal = forecastPkg?.market_signal;
  const h5d = forecastPkg?.forecast_data.horizons['5d'];

  // 52-week position calculation (0% to 100%)
  const w52Span = overview.week_52_high - overview.week_52_low || 1;
  const w52Pos = Math.max(0, Math.min(100, ((overview.current_price - overview.week_52_low) / w52Span) * 100));

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Title & Metadata Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {overview.name}
            </h1>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {overview.symbol}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
              {overview.exchange}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
              {overview.sector}
            </span>
            <ProvenanceBadge provenance={overview.provenance} lastUpdated={overview.last_updated} />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl line-clamp-2">
            {overview.description || `${overview.name} is a publicly traded corporation listed on ${overview.exchange}.`}
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentView('forecast')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>View Forecasts</span>
          </button>

          <button
            onClick={() => setCurrentView('technicals')}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Technical Indicators
          </button>
        </div>
      </div>

      {/* Key Financial Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Current Price"
          value={`${currSym}${overview.current_price.toFixed(2)}`}
          change={overview.daily_change_pct}
          changeSuffix="%"
          subValue={`Prev Close: ${currSym}${overview.previous_close.toFixed(2)}`}
          highlight={true}
        />

        <MetricCard
          label="24h Price Change"
          value={`${overview.daily_change >= 0 ? '+' : ''}${currSym}${overview.daily_change.toFixed(2)}`}
          change={overview.daily_change_pct}
          subValue={`Day Range: ${currSym}${overview.day_low} – ${currSym}${overview.day_high}`}
          badge={overview.daily_change >= 0 ? 'Gain' : 'Loss'}
          badgeType={overview.daily_change >= 0 ? 'green' : 'red'}
        />

        <MetricCard
          label="Trading Volume"
          value={`${(overview.volume / 1e6).toFixed(2)}M`}
          subValue={`30d Avg: ${(overview.average_volume_30d / 1e6).toFixed(2)}M`}
          badge={overview.volume > overview.average_volume_30d ? 'Above Avg' : 'Normal'}
          badgeType="blue"
        />

        <MetricCard
          label="Market Capitalization"
          value={overview.market_cap.startsWith('₹') || overview.market_cap.startsWith('$') ? overview.market_cap : `${currSym}${overview.market_cap}`}
          subValue={`P/E: ${overview.pe_ratio || '24.5'} • Beta: ${overview.beta || '1.0'}`}
          badge="Valuation"
          badgeType="neutral"
        />
      </div>

      {/* 52-Week Range Bar Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>52-Week Low: <strong className="font-mono text-slate-900 dark:text-white">{currSym}{overview.week_52_low.toFixed(2)}</strong></span>
          <span className="text-slate-400">Current Position: {w52Pos.toFixed(1)}%</span>
          <span>52-Week High: <strong className="font-mono text-slate-900 dark:text-white">{currSym}{overview.week_52_high.toFixed(2)}</strong></span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
          <div 
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${w52Pos}%` }}
          />
        </div>
      </div>

      {/* Interactive Price Chart Component */}
      <PriceChart 
        data={historicalData} 
        currencySymbol={currSym} 
        height={420} 
      />

      {/* Real Company Fundamentals & Valuation Metrics */}
      <FundamentalsSection overview={overview} />

      {/* Side-by-Side: AI Market Sentiment Signal + 5-Day Forecast Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* AI Market Signal Card */}
        {signal && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {signal.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                  signal.badge_color === 'green' || signal.badge_color === 'emerald'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : signal.badge_color === 'red' || signal.badge_color === 'orange'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                }`}>
                  {signal.signal.toUpperCase()} ({signal.sentiment_score > 0 ? `+${signal.sentiment_score}` : signal.sentiment_score})
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span>Multi-Factor Algorithmic Bias:</span>
                <span className={signal.sentiment_score >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {signal.signal}
                </span>
              </h3>
              
              <div className="space-y-2 mt-4 text-xs">
                {signal.breakdown_factors.slice(0, 4).map((fac, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{fac.factor}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">{fac.status} ({fac.impact})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              {signal.disclaimer}
            </div>
          </div>
        )}

        {/* 5-Day ML Forecast Snapshot Card */}
        {h5d && (
          <div className="bg-gradient-to-br from-indigo-900/30 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-sm text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  AI 5-Day Forward Outlook
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Confidence: {h5d.confidence_score}%
                </span>
              </div>

              <div className="text-3xl font-extrabold font-mono text-white mt-1">
                {currSym}{h5d.predicted_price.toFixed(2)}
              </div>

              <div className="text-sm font-semibold mt-1 flex items-center gap-2">
                <span className={h5d.expected_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {h5d.expected_change_pct >= 0 ? '▲ +' : '▼ '}{h5d.expected_change_pct.toFixed(2)}% Expected
                </span>
                <span className="text-xs text-slate-400 font-normal">by {h5d.target_date}</span>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Current Baseline:</span>
                  <span className="text-white">{currSym}{overview.current_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>95% Confidence Cone:</span>
                  <span className="text-indigo-300">{currSym}{h5d.forecast_range_min} – {currSym}{h5d.forecast_range_max}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setCurrentView('forecast')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Launch Interactive Forecast Horizons (1d, 5d, 10d, 30d)</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};
