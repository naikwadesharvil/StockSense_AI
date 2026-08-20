import React, { useState, useRef } from 'react';
import { BacktestItem } from '../../types/stock';

interface BacktestChartProps {
  data: BacktestItem[];
  currencySymbol?: string;
  height?: number;
}

export const BacktestChart: React.FC<BacktestChartProps> = ({
  data,
  currencySymbol = '$',
  height = 360
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-[#1E293B]">
        No out-of-sample backtest data available.
      </div>
    );
  }

  const actuals = data.map(d => d.actual);
  const preds = data.map(d => d.predicted);
  const errors = data.map(d => d.error);

  const minVal = Math.min(...actuals, ...preds);
  const maxVal = Math.max(...actuals, ...preds);
  const margin = (maxVal - minVal) * 0.08 || 2;
  const minPrice = minVal - margin;
  const maxPrice = maxVal + margin;
  const priceRange = maxPrice - minPrice;

  // Max absolute error for lower error bar panel
  const maxAbsError = Math.max(...errors.map(Math.abs), 1);

  const width = 1000;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;
  const errorPanelHeight = 60;
  const mainHeight = height - paddingTop - paddingBottom - errorPanelHeight;

  const getX = (idx: number) => {
    return paddingLeft + (idx / (data.length - 1 || 1)) * (width - paddingLeft - paddingRight);
  };

  const getMainY = (val: number) => {
    return paddingTop + mainHeight - ((val - minPrice) / priceRange) * mainHeight;
  };

  const getErrorY = (err: number) => {
    const zeroY = height - paddingBottom - errorPanelHeight / 2;
    return zeroY - (err / maxAbsError) * (errorPanelHeight / 2.2);
  };

  const actualPoints = data.map((d, i) => `${getX(i)},${getMainY(d.actual)}`).join(' ');
  const predPoints = data.map((d, i) => `${getX(i)},${getMainY(d.predicted)}`).join(' ');

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
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>Out-of-Sample Backtest Tracking</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">
              {data.length} Test Sessions
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compares true historical close prices with the model's single-step predictions generated chronologically without future leakage.
          </p>
        </div>

        {/* Hovered stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-400">Actual:</span>
            <span className="font-bold text-slate-900 dark:text-white">{currencySymbol}{hovered?.actual}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span className="text-slate-400">Model Pred:</span>
            <span className="font-bold text-pink-400">{currencySymbol}{hovered?.predicted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Error:</span>
            <span className={`font-bold ${hovered?.error >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {hovered?.error >= 0 ? '+' : ''}{hovered?.error} ({hovered?.abs_error_pct}%)
            </span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        className="relative w-full cursor-crosshair select-none"
        style={{ height }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          {/* Main Grid Lines */}
          {[0, 0.33, 0.66, 1.0].map((r, i) => {
            const val = minPrice + r * priceRange;
            const y = getMainY(val);
            return (
              <g key={`backtest-grid-${i}`}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="currentColor" className="text-slate-200 dark:text-[#1E293B]" strokeDasharray="3 3" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 font-mono text-[10px]">{currencySymbol}{val.toFixed(1)}</text>
              </g>
            );
          })}

          {/* Actual Price Path */}
          <polyline
            points={actualPoints}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Predicted Price Path */}
          <polyline
            points={predPoints}
            fill="none"
            stroke="#EC4899"
            strokeWidth="2.2"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />

          {/* Divider between Main and Error Bar Panel */}
          <line x1={paddingLeft} y1={height - paddingBottom - errorPanelHeight} x2={width - paddingRight} y2={height - paddingBottom - errorPanelHeight} stroke="currentColor" className="text-slate-200 dark:text-[#1E293B]" />
          
          {/* Error Zero Line */}
          <line x1={paddingLeft} y1={height - paddingBottom - errorPanelHeight / 2} x2={width - paddingRight} y2={height - paddingBottom - errorPanelHeight / 2} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="2 2" />
          <text x={paddingLeft - 8} y={height - paddingBottom - errorPanelHeight / 2 + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">0 Error</text>

          {/* Residual Error Bars */}
          {data.map((d, i) => {
            const bx = getX(i);
            const zeroY = height - paddingBottom - errorPanelHeight / 2;
            const errY = getErrorY(d.error);
            const top = Math.min(zeroY, errY);
            const barHeight = Math.max(1.5, Math.abs(zeroY - errY));
            const bw = Math.max(2, (width - paddingLeft - paddingRight) / data.length * 0.6);
            return (
              <rect
                key={`err-${i}`}
                x={bx - bw / 2}
                y={top}
                width={bw}
                height={barHeight}
                className={d.error >= 0 ? 'fill-emerald-500/70' : 'fill-rose-500/70'}
              />
            );
          })}

          {/* Crosshairs & Dots */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length && (
            <g>
              <line x1={getX(hoverIndex)} y1={paddingTop} x2={getX(hoverIndex)} y2={height - paddingBottom} stroke="#6366F1" strokeDasharray="3 3" strokeWidth="1.2" />
              <circle cx={getX(hoverIndex)} cy={getMainY(data[hoverIndex].actual)} r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx={getX(hoverIndex)} cy={getMainY(data[hoverIndex].predicted)} r="4.5" fill="#EC4899" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}

          {/* Date Axis */}
          <text x={paddingLeft} y={height - 15} className="fill-slate-400 font-mono text-[10px]">{data[0].date}</text>
          <text x={width - paddingRight} y={height - 15} textAnchor="end" className="fill-slate-400 font-mono text-[10px]">{data[data.length - 1].date}</text>
        </svg>
      </div>
    </div>
  );
};
