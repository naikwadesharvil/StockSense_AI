import React from 'react';

interface MarketStrengthCardProps {
  advances: number;
  declines: number;
  unchanged: number;
  total: number;
  avgChangePct: number;
  marketStatus?: string;
  isLive?: boolean;
}

export const MarketStrengthCard: React.FC<MarketStrengthCardProps> = ({
  advances,
  declines,
  unchanged,
  total,
  avgChangePct,
  marketStatus = 'CLOSED',
  isLive = false
}) => {
  const safeTotal = Math.max(total, 1);
  const bullishPct = Math.round((advances / safeTotal) * 100);
  const bearishPct = Math.round((declines / safeTotal) * 100);
  const neutralPct = 100 - bullishPct - bearishPct;

  // Gauge position: 0% (all bearish) to 100% (all bullish)
  // Weighted: bullishPct + 0.5 * neutralPct
  const score = Math.max(0, Math.min(100, bullishPct + 0.5 * neutralPct));

  // Semicircle gauge calculation
  // Angle: -180 deg (left, bearish) to 0 deg (right, bullish)
  const angle = -180 + (score / 100) * 180;
  const radius = 64;
  const cx = 90;
  const cy = 80;

  // Calculate needle tip
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + (radius - 12) * Math.cos(rad);
  const needleY = cy + (radius - 12) * Math.sin(rad);

  const getMarketBiasText = () => {
    if (bullishPct >= 65) return { text: 'Strongly Bullish', color: 'text-emerald-400' };
    if (bullishPct >= 52) return { text: 'Moderate Bullish', color: 'text-emerald-400' };
    if (bearishPct >= 65) return { text: 'Strongly Bearish', color: 'text-rose-400' };
    if (bearishPct >= 52) return { text: 'Moderate Bearish', color: 'text-rose-400' };
    return { text: 'Balanced / Neutral', color: 'text-indigo-400' };
  };

  const bias = getMarketBiasText();

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Market Strength
            </h3>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
            avgChangePct >= 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            NSE {avgChangePct >= 0 ? '+' : ''}{avgChangePct.toFixed(2)}%
          </span>
        </div>

        {/* Visual Semicircle Gauge */}
        <div className="flex flex-col items-center justify-center relative py-1">
          <svg className="w-44 h-24 overflow-visible" viewBox="0 0 180 95">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <path
              d="M 26 80 A 64 64 0 0 1 154 80"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Gradient Arc */}
            <path
              d="M 26 80 A 64 64 0 0 1 154 80"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="201"
              strokeDashoffset={201 - (201 * score) / 100}
              className="transition-all duration-700 ease-out"
            />

            {/* Needle Pivot Circle */}
            <circle cx={cx} cy={cy} r="5" fill="#38BDF8" className="dark:fill-slate-200" />

            {/* Needle Line */}
            <line
              x1={cx}
              y1={cy}
              x2={needleX}
              y2={needleY}
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="dark:stroke-white transition-all duration-700 ease-out"
            />
          </svg>

          {/* Value under gauge */}
          <div className="text-center -mt-2">
            <div className={`text-sm font-bold tracking-tight ${bias.color}`}>
              {bias.text}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Breadth Score: <strong className="text-slate-900 dark:text-white">{score.toFixed(0)}/100</strong>
            </div>
          </div>
        </div>

        {/* Bullish / Bearish Ratio Bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono font-semibold">
            <span className="text-emerald-500">Bullish {bullishPct}%</span>
            <span className="text-rose-500">Bearish {bearishPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${bullishPct}%` }}
              title={`Advances: ${bullishPct}%`}
            />
            <div
              className="bg-slate-400 dark:bg-slate-600 h-full transition-all duration-500"
              style={{ width: `${neutralPct}%` }}
              title={`Unchanged: ${neutralPct}%`}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${bearishPct}%` }}
              title={`Declines: ${bearishPct}%`}
            />
          </div>
        </div>
      </div>

      {/* Advance / Decline Stats Counters */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-center">
        <div className="p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/15">
          <div className="text-[10px] uppercase font-bold text-emerald-500">Advances</div>
          <div className="text-base font-extrabold font-mono text-emerald-500 mt-0.5">{advances}</div>
        </div>
        <div className="p-2 rounded-lg bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/15">
          <div className="text-[10px] uppercase font-bold text-rose-500">Declines</div>
          <div className="text-base font-extrabold font-mono text-rose-500 mt-0.5">{declines}</div>
        </div>
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40">
          <div className="text-[10px] uppercase font-bold text-slate-400">Unchanged</div>
          <div className="text-base font-extrabold font-mono text-slate-700 dark:text-slate-300 mt-0.5">{unchanged}</div>
        </div>
      </div>
    </div>
  );
};
