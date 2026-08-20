import React, { useState, useRef } from 'react';
import { OHLCVPoint, Timeframe, ChartType } from '../../types/stock';
import { useStock } from '../../context/StockContext';

interface PriceChartProps {
  data: OHLCVPoint[];
  currencySymbol?: string;
  height?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ 
  data, 
  currencySymbol = '$', 
  height = 420 
}) => {
  const { timeframe, setTimeframe, chartType, setChartType } = useStock();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-[#1E293B]">
        Loading historical price chart...
      </div>
    );
  }

  // Calculate scales
  const prices = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const volumes = data.map(d => d.volume);

  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  const priceRange = maxPrice - minPrice || 1;

  const maxVolume = Math.max(...volumes) || 1;

  // Chart dimensions inside SVG
  const width = 1000;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 65;
  const volumeHeight = 70;
  const priceChartHeight = height - paddingTop - paddingBottom - volumeHeight;

  const getX = (idx: number) => {
    return paddingLeft + (idx / (data.length - 1 || 1)) * (width - paddingLeft - paddingRight);
  };

  const getY = (val: number) => {
    return paddingTop + priceChartHeight - ((val - minPrice) / priceRange) * priceChartHeight;
  };

  const getVolY = (vol: number) => {
    const volBase = height - paddingBottom;
    return volBase - (vol / maxVolume) * volumeHeight;
  };

  // Generate SVG path for line chart
  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.close)}`).join(' ');
  const areaPoints = `${getX(0)},${paddingTop + priceChartHeight} ${linePoints} ${getX(data.length - 1)},${paddingTop + priceChartHeight}`;

  const hovered = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length ? data[hoverIndex] : data[data.length - 1];
  const prevPrice = hoverIndex !== null && hoverIndex > 0 ? data[hoverIndex - 1].close : data[0].close;
  const pointChange = hovered ? hovered.close - prevPrice : 0;
  const pointChangePct = hovered && prevPrice > 0 ? (pointChange / prevPrice) * 100 : 0;

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

  // Price axis ticks (5 ticks)
  const priceTicks = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
    const val = minPrice + ratio * priceRange;
    return { val, y: getY(val) };
  });

  // Date axis ticks (approx 6 ticks)
  const dateTickIndices = [
    0,
    Math.floor(data.length * 0.2),
    Math.floor(data.length * 0.4),
    Math.floor(data.length * 0.6),
    Math.floor(data.length * 0.8),
    data.length - 1
  ];

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Chart Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {currencySymbol}{hovered?.close.toFixed(2)}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
              pointChange >= 0 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {pointChange >= 0 ? '+' : ''}{pointChange.toFixed(2)} ({pointChangePct >= 0 ? '+' : ''}{pointChangePct.toFixed(2)}%)
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
            <span>Date: {hovered?.date}</span>
            <span>•</span>
            <span>O: {currencySymbol}{hovered?.open.toFixed(2)}</span>
            <span>H: {currencySymbol}{hovered?.high.toFixed(2)}</span>
            <span>L: {currencySymbol}{hovered?.low.toFixed(2)}</span>
            <span>Vol: {(hovered?.volume / 1e6).toFixed(2)}M</span>
          </div>
        </div>

        {/* Controls: Timeframe and Chart Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                chartType === 'line' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                chartType === 'candlestick' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Candle
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
            {(['1M', '3M', '6M', '1Y', '5Y'] as Timeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  timeframe === tf 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart Container */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full cursor-crosshair select-none"
        style={{ height }}
      >
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Price Labels */}
          {priceTicks.map((t, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={t.y} 
                x2={width - paddingRight} 
                y2={t.y} 
                stroke="currentColor" 
                className="text-slate-200 dark:text-slate-800" 
                strokeDasharray="4 4" 
                strokeWidth="1"
              />
              <text 
                x={paddingLeft - 8} 
                y={t.y + 4} 
                textAnchor="end" 
                className="fill-slate-400 font-mono text-[11px]"
              >
                {currencySymbol}{t.val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Volume Baseline Line */}
          <line 
            x1={paddingLeft} 
            y1={height - paddingBottom} 
            x2={width - paddingRight} 
            y2={height - paddingBottom} 
            stroke="currentColor" 
            className="text-slate-200 dark:text-slate-800" 
            strokeWidth="1"
          />
          <text 
            x={paddingLeft - 8} 
            y={height - paddingBottom + 12} 
            textAnchor="end" 
            className="fill-slate-400 font-mono text-[10px]"
          >
            Vol
          </text>

          {/* Volume Bars */}
          {data.map((d, i) => {
            const bx = getX(i);
            const by = getVolY(d.volume);
            const bw = Math.max(1.5, (width - paddingLeft - paddingRight) / data.length * 0.65);
            const isUp = d.close >= d.open;
            return (
              <rect
                key={`vol-${i}`}
                x={bx - bw / 2}
                y={by}
                width={bw}
                height={height - paddingBottom - by}
                className={isUp ? 'fill-emerald-500/30 dark:fill-emerald-500/25' : 'fill-rose-500/30 dark:fill-rose-500/25'}
              />
            );
          })}

          {/* Render Line Chart */}
          {chartType === 'line' && (
            <>
              <polygon points={areaPoints} fill="url(#priceGradient)" />
              <polyline 
                points={linePoints} 
                fill="none" 
                stroke="#6366F1" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </>
          )}

          {/* Render Candlestick Chart */}
          {chartType === 'candlestick' && data.map((d, i) => {
            const cx = getX(i);
            const yOpen = getY(d.open);
            const yClose = getY(d.close);
            const yHigh = getY(d.high);
            const yLow = getY(d.low);
            const isUp = d.close >= d.open;
            const candleTop = Math.min(yOpen, yClose);
            const candleHeight = Math.max(2, Math.abs(yOpen - yClose));
            const cw = Math.max(2.5, (width - paddingLeft - paddingRight) / data.length * 0.7);

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line 
                  x1={cx} 
                  y1={yHigh} 
                  x2={cx} 
                  y2={yLow} 
                  stroke={isUp ? '#10B981' : '#F43F5E'} 
                  strokeWidth="1.2" 
                />
                {/* Body */}
                <rect 
                  x={cx - cw / 2} 
                  y={candleTop} 
                  width={cw} 
                  height={candleHeight} 
                  fill={isUp ? '#10B981' : '#F43F5E'} 
                  rx="1"
                />
              </g>
            );
          })}

          {/* Crosshair when hovering */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length && (
            <g>
              {/* Vertical crosshair line */}
              <line 
                x1={getX(hoverIndex)} 
                y1={paddingTop} 
                x2={getX(hoverIndex)} 
                y2={height - paddingBottom} 
                stroke="#6366F1" 
                strokeWidth="1.5" 
                strokeDasharray="3 3"
              />
              {/* Horizontal crosshair line */}
              <line 
                x1={paddingLeft} 
                y1={getY(data[hoverIndex].close)} 
                x2={width - paddingRight} 
                y2={getY(data[hoverIndex].close)} 
                stroke="#6366F1" 
                strokeWidth="1" 
                strokeDasharray="3 3"
              />
              {/* Active point circle */}
              <circle 
                cx={getX(hoverIndex)} 
                cy={getY(data[hoverIndex].close)} 
                r="4.5" 
                fill="#6366F1" 
                stroke="#FFFFFF" 
                strokeWidth="2" 
              />
            </g>
          )}

          {/* Date Axis Ticks */}
          {dateTickIndices.map((idx, i) => {
            if (idx >= data.length) return null;
            return (
              <text 
                key={i} 
                x={getX(idx)} 
                y={height - 20} 
                textAnchor="middle" 
                className="fill-slate-400 font-mono text-[11px]"
              >
                {data[idx].date.slice(5)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
