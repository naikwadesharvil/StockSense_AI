import React, { useState, useRef } from 'react';
import { OHLCVPoint, Timeframe } from '../../types/stock';

interface MarketTrendCardProps {
  data: OHLCVPoint[];
  symbol: string;
  currencySymbol?: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  height?: number;
}

export const MarketTrendCard: React.FC<MarketTrendCardProps> = ({
  data,
  symbol,
  currencySymbol = '$',
  timeframe,
  onTimeframeChange,
  height = 240
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] shadow-sm flex items-center justify-center text-slate-400 text-xs h-full">
        Loading market trend series...
      </div>
    );
  }

  const prices = data.map(d => d.close);
  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = Math.max(...data.map(d => d.volume)) || 1;

  const width = 600;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 40;
  const volumeHeight = 35;
  const chartHeight = height - paddingTop - paddingBottom - volumeHeight;

  const getX = (idx: number) => {
    return paddingLeft + (idx / (data.length - 1 || 1)) * (width - paddingLeft - paddingRight);
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
  };

  const getVolY = (vol: number) => {
    const volBase = height - paddingBottom;
    return volBase - (vol / maxVolume) * volumeHeight;
  };

  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.close)}`).join(' ');
  const areaPoints = `${getX(0)},${paddingTop + chartHeight} ${linePoints} ${getX(data.length - 1)},${paddingTop + chartHeight}`;

  const hovered = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length ? data[hoverIndex] : data[data.length - 1];
  const startPrice = data[0].close;
  const currentPrice = hovered ? hovered.close : data[data.length - 1].close;
  const periodChange = currentPrice - startPrice;
  const periodChangePct = startPrice > 0 ? (periodChange / startPrice) * 100 : 0;
  const isPositive = periodChange >= 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const chartW = rect.width;
    const ratio = Math.max(0, Math.min(1, (relX - (paddingLeft / width) * chartW) / (((width - paddingLeft - paddingRight) / width) * chartW)));
    const idx = Math.round(ratio * (data.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const priceTicks = [0, 0.5, 1.0].map(r => {
    const val = minPrice + r * priceRange;
    return { val, y: getY(val) };
  });

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1e293b] shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header & Controls */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Market Trend
            </h3>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {symbol}
            </span>
          </div>

          {/* Timeframe selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-[10px] font-mono font-bold">
            {(['1M', '3M', '6M', '1Y'] as Timeframe[]).map(tf => {
              const label = tf === '1M' ? '1M' : tf === '3M' ? '1W' : tf === '6M' ? '6M' : '1Y';
              return (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    timeframe === tf
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price & Hover Meta */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {currencySymbol}{hovered?.close.toFixed(2)}
            </span>
            <span className={`text-xs font-mono font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}{periodChange.toFixed(2)} ({isPositive ? '+' : ''}{periodChangePct.toFixed(2)}%)
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            {hovered?.date} • Vol: {(hovered?.volume / 1e6).toFixed(2)}M
          </div>
        </div>

        {/* Responsive Interactive SVG Chart */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full cursor-crosshair select-none mt-2"
          style={{ height }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10B981' : '#F43F5E'} stopOpacity="0.30" />
                <stop offset="100%" stopColor={isPositive ? '#10B981' : '#F43F5E'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {priceTicks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={t.y}
                  x2={width - paddingRight}
                  y2={t.y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 6}
                  y={t.y + 3}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[9px]"
                >
                  {currencySymbol}{t.val.toFixed(0)}
                </text>
              </g>
            ))}

            {/* Volume bars */}
            {data.map((d, i) => {
              const bx = getX(i);
              const by = getVolY(d.volume);
              const bw = Math.max(1, (width - paddingLeft - paddingRight) / data.length * 0.6);
              const isUp = d.close >= d.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={bx - bw / 2}
                  y={by}
                  width={bw}
                  height={height - paddingBottom - by}
                  className={isUp ? 'fill-emerald-500/20' : 'fill-rose-500/20'}
                />
              );
            })}

            {/* Area & Line */}
            <polygon points={areaPoints} fill="url(#trendGradient)" />
            <polyline
              points={linePoints}
              fill="none"
              stroke={isPositive ? '#10B981' : '#F43F5E'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover crosshair */}
            {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={paddingTop}
                  x2={getX(hoverIndex)}
                  y2={height - paddingBottom}
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex].close)}
                  r="4"
                  fill="#38BDF8"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
        <span>Range: {currencySymbol}{minPrice.toFixed(1)} – {currencySymbol}{maxPrice.toFixed(1)}</span>
        <span>Avg Vol: {(data.reduce((a, b) => a + b.volume, 0) / data.length / 1e6).toFixed(2)}M</span>
      </div>
    </div>
  );
};
