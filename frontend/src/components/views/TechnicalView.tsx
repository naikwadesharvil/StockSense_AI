import React, { useState } from 'react';
import { useStock } from '../../context/StockContext';
import { TechnicalChart } from '../charts/TechnicalChart';
import { MetricCard } from '../common/MetricCard';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

export const TechnicalView: React.FC = () => {
  const { overview, indicators, isLoading } = useStock();
  const [selectedGlossary, setSelectedGlossary] = useState<string | null>(null);

  if (isLoading || !indicators || !indicators.latest || !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <SkeletonLoader count={4} className="h-28" />
        <SkeletonLoader count={1} className="h-96" />
      </div>
    );
  }

  const latest = indicators.latest;
  const currSym = overview.currency_symbol || '$';

  const glossaryItems = [
    {
      id: 'sma',
      name: 'Simple Moving Average (SMA)',
      formula: 'SMA_n = (P_1 + P_2 + ... + P_n) / n',
      reading: `SMA 20: ${currSym}${latest.sma_20 || '—'} | SMA 50: ${currSym}${latest.sma_50 || '—'} | SMA 200: ${currSym}${latest.sma_200 || '—'}`,
      description: 'Calculates the arithmetic average of closing prices over a specified lookback period. Used to identify macro trends and dynamic support/resistance levels.',
      signal: overview.current_price > (latest.sma_50 || 0) ? 'Price is above 50-day baseline (Bullish trend structure)' : 'Price is below 50-day baseline (Bearish pressure)'
    },
    {
      id: 'rsi',
      name: 'Relative Strength Index (RSI 14)',
      formula: 'RSI = 100 - (100 / (1 + (Avg Gain / Avg Loss)))',
      reading: `RSI (14): ${latest.rsi_14} (${latest.rsi_status})`,
      description: 'Momentum oscillator bounded between 0 and 100. Measures the velocity of recent price changes using Wilder smoothing.',
      signal: latest.rsi_14 >= 70 ? 'Overbought (>70) — Potential pullback / consolidation risk' : latest.rsi_14 <= 30 ? 'Oversold (<30) — Potential mean-reversion bounce opportunity' : 'Neutral Momentum (30–70 channel)'
    },
    {
      id: 'macd',
      name: 'Moving Average Convergence Divergence (MACD)',
      formula: 'MACD Line = EMA(12) - EMA(26); Signal = EMA_9(MACD Line)',
      reading: `MACD Line: ${latest.macd_line} | Signal: ${latest.macd_signal} | Histogram: ${latest.macd_hist} (${latest.macd_status})`,
      description: 'Trend-following momentum indicator displaying the divergence between short-term and medium-term exponential moving averages.',
      signal: latest.macd_hist > 0 ? 'Positive Histogram divergence indicating expanding upward momentum' : 'Negative Histogram divergence indicating decelerating momentum'
    },
    {
      id: 'bb',
      name: 'Bollinger Bands (20, 2σ)',
      formula: 'Upper = SMA_20 + 2*σ; Lower = SMA_20 - 2*σ',
      reading: `Upper: ${currSym}${latest.bb_upper} | Mid: ${currSym}${latest.bb_middle} | Lower: ${currSym}${latest.bb_lower}`,
      description: 'Dynamic volatility bands plotted 2 standard deviations away from a 20-period simple moving average.',
      signal: overview.current_price > latest.bb_upper * 0.98 ? 'Price near Upper Band (High relative variance)' : overview.current_price < latest.bb_lower * 1.02 ? 'Price near Lower Band (Support boundary)' : 'Trading inside normalized 2σ volatility envelope'
    },
    {
      id: 'vol',
      name: 'Annualized Historical Volatility (20d)',
      formula: 'σ_annual = std(ln(P_t / P_{t-1})) * sqrt(252)',
      reading: `${latest.volatility_20d}% Annualized Volatility`,
      description: 'Statistical measurement of the dispersion of 20-day daily logarithmic returns scaled to an annual 252-session trading calendar.',
      signal: latest.volatility_20d > 35 ? 'High Volatility regime (Wider forecast intervals)' : 'Moderate / Stable Volatility regime'
    },
    {
      id: 'atr',
      name: 'Average True Range (ATR 14)',
      formula: 'TR = max(H-L, |H-C_{prev}|, |L-C_{prev}|)',
      reading: `ATR (14): ${currSym}${latest.atr_14}`,
      description: 'Measures market volatility by decomposing the entire range of an asset price for that period.',
      signal: `Expected typical daily price fluctuation of approx ${currSym}${latest.atr_14}`
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Quantitative Technical Indicators & Oscillators
            </h1>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {overview.symbol}
            </span>
            <ProvenanceBadge provenance={overview.provenance} lastUpdated={overview.last_updated} />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Indicators calculated from {overview.provenance?.provider || 'Market Data Feed'} OHLCV dataset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Data Timeline Through: {indicators.timeline[indicators.timeline.length - 1]?.date}
          </span>
        </div>
      </div>

      {/* Indicator Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="RSI (14)"
          value={latest.rsi_14}
          badge={latest.rsi_status}
          badgeType={latest.rsi_14 > 70 ? 'red' : latest.rsi_14 < 30 ? 'green' : 'blue'}
        />

        <MetricCard
          label="MACD Hist"
          value={latest.macd_hist > 0 ? `+${latest.macd_hist}` : `${latest.macd_hist}`}
          badge={latest.macd_status}
          badgeType={latest.macd_hist > 0 ? 'green' : 'red'}
        />

        <MetricCard
          label="SMA 20 / 50"
          value={`${currSym}${latest.sma_20 || '—'}`}
          subValue={`SMA 50: ${currSym}${latest.sma_50 || '—'}`}
          badge="Trend"
          badgeType="neutral"
        />

        <MetricCard
          label="BB Upper"
          value={`${currSym}${latest.bb_upper}`}
          subValue={`Lower: ${currSym}${latest.bb_lower}`}
          badge="2σ Band"
          badgeType="blue"
        />

        <MetricCard
          label="20d Volatility"
          value={`${latest.volatility_20d}%`}
          badge={latest.volatility_20d > 35 ? 'High Vol' : 'Normal'}
          badgeType="yellow"
        />

        <MetricCard
          label="ATR (14)"
          value={`${currSym}${latest.atr_14}`}
          badge="True Range"
          badgeType="neutral"
        />
      </div>

      {/* Interactive Technical Chart with Overlays & Oscillators */}
      <TechnicalChart
        timeline={indicators.timeline}
        latest={latest}
        currencySymbol={currSym}
      />

      {/* Educational Indicator Glossary & Mathematical Documentation */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Educational Indicator Interpretations & Mathematical Formulas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any indicator card to inspect its underlying mathematical formulation and live readings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {glossaryItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedGlossary(selectedGlossary === item.id ? null : item.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedGlossary === item.id
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md'
                  : 'bg-slate-50/70 dark:bg-[#151D2F] border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {item.id.toUpperCase()}
                </span>
              </div>

              <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {item.reading}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                {item.description}
              </p>

              <div className="p-2 rounded-lg bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-[#1E293B] text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Formula:</div>
                <div className="text-slate-700 dark:text-slate-300">{item.formula}</div>
              </div>

              <div className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {item.signal}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
