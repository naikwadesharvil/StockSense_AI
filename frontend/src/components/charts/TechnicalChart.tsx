import React, { useState, useRef } from 'react';
import { IndicatorPoint, IndicatorLatest } from '../../types/stock';

interface TechnicalChartProps {
  timeline: IndicatorPoint[];
  latest: IndicatorLatest;
  currencySymbol?: string;
}

export const TechnicalChart: React.FC<TechnicalChartProps> = ({
  timeline,
  latest,
  currencySymbol = '$'
}) => {
  // Indicator Visibility Toggles
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showBB, setShowBB] = useState(true);
  const [activeSubChart, setActiveSubChart] = useState<'rsi' | 'macd'>('rsi');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Take last 120 points for clean visualization
  const data = timeline.slice(-120);
  if (data.length === 0) return null;

  // Primary chart bounds
  const prices = data.map(d => d.close);
  const bbUppers = showBB ? data.map(d => d.bb_upper || d.close) : prices;
  const bbLowers = showBB ? data.map(d => d.bb_lower || d.close) : prices;

  const minPrice = Math.min(...prices, ...bbLowers);
  const maxPrice = Math.max(...prices, ...bbUppers);
  const priceRange = maxPrice - minPrice || 1;

  // Chart dimensions
  const width = 1000;
  const mainHeight = 300;
  const subHeight = 140;
  const totalSvgHeight = mainHeight + subHeight + 40;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;

  const getX = (idx: number) => {
    return paddingLeft + (idx / (data.length - 1 || 1)) * (width - paddingLeft - paddingRight);
  };

  const getMainY = (val: number) => {
    return paddingTop + mainHeight - ((val - minPrice) / priceRange) * mainHeight;
  };

  // Sub-chart RSI Y scale (0 to 100)
  const getRsiY = (rsiVal: number) => {
    const subTop = paddingTop + mainHeight + 30;
    return subTop + subHeight - (rsiVal / 100) * subHeight;
  };

  // Sub-chart MACD scale
  const macdValues = data.flatMap(d => [d.macd_line || 0, d.macd_signal || 0, d.macd_hist || 0]);
  const minMacd = Math.min(...macdValues, -2);
  const maxMacd = Math.max(...macdValues, 2);
  const macdRange = maxMacd - minMacd || 1;

  const getMacdY = (macdVal: number) => {
    const subTop = paddingTop + mainHeight + 30;
    return subTop + subHeight - ((macdVal - minMacd) / macdRange) * subHeight;
  };

  const hovered = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length ? data[hoverIndex] : data[data.length - 1];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const chartW = rect.width;
    const ratio = Math.max(0, Math.min(1, (relX - (paddingLeft / width) * chartW) / (((width - paddingLeft - paddingRight) / width) * chartW)));
    const idx = Math.round(ratio * (data.length - 1));
    setHoverIndex(idx);
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Top Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-[#1E293B]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Overlays:</span>
          
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={showSMA20} onChange={e => setShowSMA20(e.target.checked)} className="rounded text-amber-500" />
            <span>SMA 20 ({currencySymbol}{latest.sma_20 || '—'})</span>
          </label>

          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={showSMA50} onChange={e => setShowSMA50(e.target.checked)} className="rounded text-blue-500" />
            <span>SMA 50 ({currencySymbol}{latest.sma_50 || '—'})</span>
          </label>

          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={showSMA200} onChange={e => setShowSMA200(e.target.checked)} className="rounded text-purple-500" />
            <span>SMA 200 ({currencySymbol}{latest.sma_200 || '—'})</span>
          </label>

          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={showEMA20} onChange={e => setShowEMA20(e.target.checked)} className="rounded text-cyan-500" />
            <span>EMA 20</span>
          </label>

          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={showBB} onChange={e => setShowBB(e.target.checked)} className="rounded text-emerald-500" />
            <span>Bollinger Bands (20, 2σ)</span>
          </label>
        </div>

        {/* Sub-chart toggle */}
        <div className="flex bg-slate-100 dark:bg-[#0B0F17] p-0.5 rounded-lg border border-slate-200 dark:border-[#1E293B]">
          <button
            onClick={() => setActiveSubChart('rsi')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeSubChart === 'rsi'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            RSI (14) ({latest.rsi_14})
          </button>
          <button
            onClick={() => setActiveSubChart('macd')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeSubChart === 'macd'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            MACD (12, 26, 9)
          </button>
        </div>
      </div>

      {/* Interactive Canvas/SVG */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        className="relative w-full cursor-crosshair select-none"
        style={{ height: totalSvgHeight }}
      >
        <svg viewBox={`0 0 ${width} ${totalSvgHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          {/* Main Chart Price Ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((r, i) => {
            const val = minPrice + r * priceRange;
            const y = getMainY(val);
            return (
              <g key={`main-grid-${i}`}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 font-mono text-[10px]">{currencySymbol}{val.toFixed(1)}</text>
              </g>
            );
          })}

          {/* Bollinger Bands Shaded Area */}
          {showBB && (
            (() => {
              const upperPts = data.filter(d => d.bb_upper).map((d, i) => `${getX(i)},${getMainY(d.bb_upper!)}`);
              const lowerPts = data.filter(d => d.bb_lower).map((d, i) => `${getX(i)},${getMainY(d.bb_lower!)}`).reverse();
              return (
                <polygon 
                  points={`${upperPts.join(' ')} ${lowerPts.join(' ')}`} 
                  fill="#6366F1" 
                  fillOpacity="0.10" 
                />
              );
            })()
          )}

          {/* Bollinger Bands Lines */}
          {showBB && (
            <>
              <polyline 
                points={data.filter(d => d.bb_upper).map((d, i) => `${getX(i)},${getMainY(d.bb_upper!)}`).join(' ')} 
                fill="none" 
                stroke="#6366F1" 
                strokeWidth="1.2" 
                strokeDasharray="2 2" 
              />
              <polyline 
                points={data.filter(d => d.bb_lower).map((d, i) => `${getX(i)},${getMainY(d.bb_lower!)}`).join(' ')} 
                fill="none" 
                stroke="#6366F1" 
                strokeWidth="1.2" 
                strokeDasharray="2 2" 
              />
            </>
          )}

          {/* SMA 200 */}
          {showSMA200 && (
            <polyline 
              points={data.filter(d => d.sma_200).map((d, i) => `${getX(i)},${getMainY(d.sma_200!)}`).join(' ')} 
              fill="none" 
              stroke="#A855F7" 
              strokeWidth="1.8" 
            />
          )}

          {/* SMA 50 */}
          {showSMA50 && (
            <polyline 
              points={data.filter(d => d.sma_50).map((d, i) => `${getX(i)},${getMainY(d.sma_50!)}`).join(' ')} 
              fill="none" 
              stroke="#3B82F6" 
              strokeWidth="2.0" 
            />
          )}

          {/* SMA 20 */}
          {showSMA20 && (
            <polyline 
              points={data.filter(d => d.sma_20).map((d, i) => `${getX(i)},${getMainY(d.sma_20!)}`).join(' ')} 
              fill="none" 
              stroke="#F59E0B" 
              strokeWidth="2.0" 
            />
          )}

          {/* EMA 20 */}
          {showEMA20 && (
            <polyline 
              points={data.map((d, i) => `${getX(i)},${getMainY(d.ema_20!)}`).join(' ')} 
              fill="none" 
              stroke="#06B6D4" 
              strokeWidth="1.8" 
              strokeDasharray="4 2" 
            />
          )}

          {/* Candlesticks */}
          {data.map((d, i) => {
            const cx = getX(i);
            const yOpen = getMainY(d.open);
            const yClose = getMainY(d.close);
            const yHigh = getMainY(d.high);
            const yLow = getMainY(d.low);
            const isUp = d.close >= d.open;
            const top = Math.min(yOpen, yClose);
            const h = Math.max(2, Math.abs(yOpen - yClose));
            const cw = Math.max(2, (width - paddingLeft - paddingRight) / data.length * 0.7);

            return (
              <g key={`tech-c-${i}`}>
                <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={isUp ? '#10B981' : '#F43F5E'} strokeWidth="1" />
                <rect x={cx - cw / 2} y={top} width={cw} height={h} fill={isUp ? '#10B981' : '#F43F5E'} rx="0.5" />
              </g>
            );
          })}

          {/* Divider between Main and Sub chart */}
          <line x1={paddingLeft} y1={paddingTop + mainHeight + 15} x2={width - paddingRight} y2={paddingTop + mainHeight + 15} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />

          {/* ==================== SUB CHART ==================== */}
          {activeSubChart === 'rsi' ? (
            <g>
              {/* RSI Overbought / Oversold Background Zones */}
              <rect x={paddingLeft} y={getRsiY(70)} width={width - paddingLeft - paddingRight} height={getRsiY(30) - getRsiY(70)} fill="#6366F1" fillOpacity="0.05" />
              
              {/* 70 Threshold Line */}
              <line x1={paddingLeft} y1={getRsiY(70)} x2={width - paddingRight} y2={getRsiY(70)} stroke="#F43F5E" strokeDasharray="3 3" strokeWidth="1" />
              <text x={paddingLeft - 8} y={getRsiY(70) + 3} textAnchor="end" className="fill-rose-500 font-mono text-[9px]">70 OB</text>

              {/* 50 Neutral Line */}
              <line x1={paddingLeft} y1={getRsiY(50)} x2={width - paddingRight} y2={getRsiY(50)} stroke="currentColor" className="text-slate-300 dark:text-slate-800" strokeDasharray="2 2" strokeWidth="1" />
              <text x={paddingLeft - 8} y={getRsiY(50) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">50</text>

              {/* 30 Threshold Line */}
              <line x1={paddingLeft} y1={getRsiY(30)} x2={width - paddingRight} y2={getRsiY(30)} stroke="#10B981" strokeDasharray="3 3" strokeWidth="1" />
              <text x={paddingLeft - 8} y={getRsiY(30) + 3} textAnchor="end" className="fill-emerald-500 font-mono text-[9px]">30 OS</text>

              {/* RSI Line */}
              <polyline 
                points={data.map((d, i) => `${getX(i)},${getRsiY(d.rsi_14 || 50)}`).join(' ')} 
                fill="none" 
                stroke="#8B5CF6" 
                strokeWidth="2" 
              />
            </g>
          ) : (
            <g>
              {/* MACD Zero Line */}
              <line x1={paddingLeft} y1={getMacdY(0)} x2={width - paddingRight} y2={getMacdY(0)} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />
              <text x={paddingLeft - 8} y={getMacdY(0) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">0.0</text>

              {/* Histogram Bars */}
              {data.map((d, i) => {
                const bx = getX(i);
                const hist = d.macd_hist || 0;
                const zeroY = getMacdY(0);
                const barY = getMacdY(hist);
                const top = Math.min(zeroY, barY);
                const h = Math.max(1, Math.abs(zeroY - barY));
                const bw = Math.max(1.5, (width - paddingLeft - paddingRight) / data.length * 0.6);
                return (
                  <rect 
                    key={`hist-${i}`} 
                    x={bx - bw / 2} 
                    y={top} 
                    width={bw} 
                    height={h} 
                    className={hist >= 0 ? 'fill-emerald-500/80' : 'fill-rose-500/80'} 
                  />
                );
              })}

              {/* MACD Line */}
              <polyline 
                points={data.map((d, i) => `${getX(i)},${getMacdY(d.macd_line || 0)}`).join(' ')} 
                fill="none" 
                stroke="#3B82F6" 
                strokeWidth="1.8" 
              />

              {/* Signal Line */}
              <polyline 
                points={data.map((d, i) => `${getX(i)},${getMacdY(d.macd_signal || 0)}`).join(' ')} 
                fill="none" 
                stroke="#F59E0B" 
                strokeWidth="1.5" 
                strokeDasharray="3 2" 
              />
            </g>
          )}

          {/* Hover Crosshairs */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length && (
            <line x1={getX(hoverIndex)} y1={paddingTop} x2={getX(hoverIndex)} y2={totalSvgHeight - 15} stroke="#6366F1" strokeDasharray="3 3" strokeWidth="1.2" />
          )}
        </svg>
      </div>

      {/* Educational Footer Legend */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-xs flex flex-wrap items-center justify-between gap-3 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-700 dark:text-slate-300">Active Reading:</span>
          <span>Close: <strong className="font-mono text-slate-900 dark:text-white">{currencySymbol}{hovered?.close}</strong></span>
          <span>RSI (14): <strong className="font-mono text-indigo-500">{hovered?.rsi_14}</strong></span>
          <span>MACD Hist: <strong className="font-mono text-slate-900 dark:text-white">{hovered?.macd_hist}</strong></span>
          <span>Vol 20d: <strong className="font-mono text-slate-900 dark:text-white">{hovered?.volatility_20d_ann}%</strong></span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Crosses above 70 RSI indicate overbought conditions; crosses below 30 indicate oversold conditions.
        </div>
      </div>
    </div>
  );
};
