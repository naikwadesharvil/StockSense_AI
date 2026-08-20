import React, { useState, useRef } from 'react';

interface ComparisonChartProps {
  symbols: string[];
  series: Array<Record<string, any>>;
  height?: number;
}

const COLOR_PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  symbols,
  series,
  height = 380
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!series || series.length === 0 || symbols.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-[#1E293B]">
        Loading normalized comparison series...
      </div>
    );
  }

  // Calculate min & max % return
  const allReturns: number[] = [];
  series.forEach(row => {
    symbols.forEach(sym => {
      const val = row[`${sym}_return_pct`];
      if (typeof val === 'number') allReturns.push(val);
    });
  });

  const minRet = Math.min(...allReturns, -5);
  const maxRet = Math.max(...allReturns, 5);
  const margin = (maxRet - minRet) * 0.1 || 2;
  const minY = minRet - margin;
  const maxY = maxRet + margin;
  const rangeY = maxY - minY;

  const width = 1000;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    return paddingLeft + (idx / (series.length - 1 || 1)) * (width - paddingLeft - paddingRight);
  };

  const getY = (retPct: number) => {
    return paddingTop + chartHeight - ((retPct - minY) / rangeY) * chartHeight;
  };

  const zeroY = getY(0);

  const hovered = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < series.length ? series[hoverIndex] : series[series.length - 1];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const chartW = rect.width;
    const ratio = Math.max(0, Math.min(1, (relX - (paddingLeft / width) * chartW) / (((width - paddingLeft - paddingRight) / width) * chartW)));
    const idx = Math.round(ratio * (series.length - 1));
    setHoverIndex(idx);
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Header Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Normalized Performance (% Return from Common Base)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All equities normalized to 0.0% at baseline date to enable fair side-by-side comparison across different price scales.
          </p>
        </div>

        {/* Hovered readout */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {symbols.map((sym, i) => {
            const ret = hovered ? hovered[`${sym}_return_pct`] : 0;
            return (
              <div key={sym} className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-[#0B0F17] border border-transparent dark:border-[#1E293B]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_PALETTE[i % COLOR_PALETTE.length] }} />
                <span className="font-semibold">{sym}:</span>
                <span className={ret >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {ret >= 0 ? '+' : ''}{ret?.toFixed(2)}%
                </span>
              </div>
            );
          })}
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
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((r, i) => {
            const val = minY + r * rangeY;
            const y = getY(val);
            return (
              <g key={`comp-grid-${i}`}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="currentColor" className="text-slate-200 dark:text-[#1E293B]" strokeDasharray="3 3" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-400 font-mono text-[10px]">
                  {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Zero baseline */}
          <line x1={paddingLeft} y1={zeroY} x2={width - paddingRight} y2={zeroY} stroke="#94A3B8" strokeWidth="1.5" />
          <text x={paddingLeft - 8} y={zeroY + 3} textAnchor="end" className="fill-slate-400 font-mono font-bold text-[10px]">0%</text>

          {/* Symbol Paths */}
          {symbols.map((sym, sIdx) => {
            const color = COLOR_PALETTE[sIdx % COLOR_PALETTE.length];
            const pts = series.map((row, i) => `${getX(i)},${getY(row[`${sym}_return_pct`])}`).join(' ');
            return (
              <polyline
                key={sym}
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Crosshair on hover */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < series.length && (
            <g>
              <line x1={getX(hoverIndex)} y1={paddingTop} x2={getX(hoverIndex)} y2={height - paddingBottom} stroke="#6366F1" strokeDasharray="3 3" strokeWidth="1.2" />
              {symbols.map((sym, sIdx) => {
                const color = COLOR_PALETTE[sIdx % COLOR_PALETTE.length];
                const yVal = getY(series[hoverIndex][`${sym}_return_pct`]);
                return (
                  <circle
                    key={`dot-${sym}`}
                    cx={getX(hoverIndex)}
                    cy={yVal}
                    r="4.5"
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          )}

          {/* Date Axis */}
          <text x={paddingLeft} y={height - 15} className="fill-slate-400 font-mono text-[10px]">{series[0].date}</text>
          <text x={width - paddingRight} y={height - 15} textAnchor="end" className="fill-slate-400 font-mono text-[10px]">{series[series.length - 1].date}</text>
        </svg>
      </div>
    </div>
  );
};
