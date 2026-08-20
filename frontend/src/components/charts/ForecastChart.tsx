import React, { useState, useRef } from 'react';
import { OHLCVPoint, ForecastStep, ForecastHorizon } from '../../types/stock';
import { useStock } from '../../context/StockContext';

interface ForecastChartProps {
  historicalData: OHLCVPoint[];
  forecastTrajectory: ForecastStep[];
  currencySymbol?: string;
  height?: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  historicalData,
  forecastTrajectory,
  currencySymbol = '$',
  height = 440
}) => {
  const { forecastHorizon, setForecastHorizon } = useStock();
  const [hoverIndex, setHoverIndex] = useState<{ type: 'hist' | 'fc'; index: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Take the last 60 historical days to give clean context before the forecast
  const histSlice = historicalData.slice(-60);
  if (histSlice.length === 0 || !forecastTrajectory || forecastTrajectory.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-[#1E293B]">
        Computing machine-learning forecast cone...
      </div>
    );
  }

  // Horizon step limit (1d, 5d, 10d, 30d)
  const maxStepMap: Record<ForecastHorizon, number> = {
    '1d': 1,
    '5d': 5,
    '10d': 10,
    '30d': 30
  };
  const activeSteps = maxStepMap[forecastHorizon] || 5;
  const fcSlice = forecastTrajectory.slice(0, activeSteps);

  const totalPoints = histSlice.length + fcSlice.length;

  // Calculate Price Bounds
  const histCloses = histSlice.map(d => d.close);
  const fcUpper = fcSlice.map(f => f.ci_95_upper);
  const fcLower = fcSlice.map(f => f.ci_95_lower);

  const allMin = Math.min(...histCloses, ...fcLower);
  const allMax = Math.max(...histCloses, ...fcUpper);
  const priceMargin = (allMax - allMin) * 0.08 || 5;
  const minPrice = allMin - priceMargin;
  const maxPrice = allMax + priceMargin;
  const priceRange = maxPrice - minPrice;

  // Dimensions
  const width = 1000;
  const paddingLeft = 65;
  const paddingRight = 45;
  const paddingTop = 30;
  const paddingBottom = 45;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (globalIdx: number) => {
    return paddingLeft + (globalIdx / (totalPoints - 1 || 1)) * (width - paddingLeft - paddingRight);
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
  };

  // Historical Line Path
  const histPoints = histSlice.map((d, i) => `${getX(i)},${getY(d.close)}`).join(' ');
  const histAreaPoints = `${getX(0)},${paddingTop + chartHeight} ${histPoints} ${getX(histSlice.length - 1)},${paddingTop + chartHeight}`;

  // T0 divider coordinate
  const t0Idx = histSlice.length - 1;
  const t0X = getX(t0Idx);
  const currentPrice = histSlice[t0Idx].close;

  // Forecast Trajectory Path starting seamlessly from T0
  const fcPointsArr = [`${t0X},${getY(currentPrice)}`];
  fcSlice.forEach((f, i) => {
    fcPointsArr.push(`${getX(t0Idx + 1 + i)},${getY(f.predicted_price)}`);
  });
  const fcLine = fcPointsArr.join(' ');

  // 95% Confidence Interval Shaded Polygon
  const upper95Points = [`${t0X},${getY(currentPrice)}`];
  const lower95Points = [`${t0X},${getY(currentPrice)}`];

  fcSlice.forEach((f, i) => {
    const xCoord = getX(t0Idx + 1 + i);
    upper95Points.push(`${xCoord},${getY(f.ci_95_upper)}`);
    lower95Points.unshift(`${xCoord},${getY(f.ci_95_lower)}`);
  });
  const ci95Polygon = [...upper95Points, ...lower95Points].join(' ');

  // 80% Confidence Interval Shaded Polygon
  const upper80Points = [`${t0X},${getY(currentPrice)}`];
  const lower80Points = [`${t0X},${getY(currentPrice)}`];

  fcSlice.forEach((f, i) => {
    const xCoord = getX(t0Idx + 1 + i);
    upper80Points.push(`${xCoord},${getY(f.ci_80_upper)}`);
    lower80Points.unshift(`${xCoord},${getY(f.ci_80_lower)}`);
  });
  const ci80Polygon = [...upper80Points, ...lower80Points].join(' ');

  // Mouse hover calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const chartW = rect.width;
    const ratio = Math.max(0, Math.min(1, (relX - (paddingLeft / width) * chartW) / (((width - paddingLeft - paddingRight) / width) * chartW)));
    const gIdx = Math.round(ratio * (totalPoints - 1));

    if (gIdx <= t0Idx) {
      setHoverIndex({ type: 'hist', index: gIdx });
    } else {
      setHoverIndex({ type: 'fc', index: gIdx - t0Idx - 1 });
    }
  };

  const hoveredHist = hoverIndex?.type === 'hist' ? histSlice[hoverIndex.index] : null;
  const hoveredFc = hoverIndex?.type === 'fc' ? fcSlice[hoverIndex.index] : null;
  const activeHorizonSummary = fcSlice[fcSlice.length - 1];

  // Price ticks (5 ticks)
  const priceTicks = [0, 0.25, 0.5, 0.75, 1.0].map(r => {
    const val = minPrice + r * priceRange;
    return { val, y: getY(val) };
  });

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Forecast Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {hoveredFc 
                ? `${currencySymbol}${hoveredFc.predicted_price.toFixed(2)}`
                : hoveredHist
                ? `${currencySymbol}${hoveredHist.close.toFixed(2)}`
                : `${currencySymbol}${activeHorizonSummary?.predicted_price.toFixed(2)}`}
            </span>

            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
              (hoveredFc ? hoveredFc.expected_change_pct : activeHorizonSummary?.expected_change_pct || 0) >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {(hoveredFc ? hoveredFc.expected_change_pct : activeHorizonSummary?.expected_change_pct || 0) >= 0 ? '▲ +' : '▼ '}
              {(hoveredFc ? hoveredFc.expected_change_pct : activeHorizonSummary?.expected_change_pct || 0).toFixed(2)}% Expected
            </span>

            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
              {hoveredFc ? `Step +${hoveredFc.step}d` : hoveredHist ? 'Historical' : `${forecastHorizon.toUpperCase()} Target`}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-3">
            <span>Target Date: {hoveredFc ? hoveredFc.date : hoveredHist ? hoveredHist.date : activeHorizonSummary?.date}</span>
            <span>•</span>
            <span>
              95% Confidence Range: {currencySymbol}
              {hoveredFc 
                ? `${hoveredFc.ci_95_lower} – ${currencySymbol}${hoveredFc.ci_95_upper}` 
                : `${activeHorizonSummary?.ci_95_lower} – ${currencySymbol}${activeHorizonSummary?.ci_95_upper}`}
            </span>
          </div>
        </div>

        {/* Horizon Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl border border-slate-200 dark:border-[#1E293B]">
          {(['1d', '5d', '10d', '30d'] as ForecastHorizon[]).map(h => (
            <button
              key={h}
              onClick={() => setForecastHorizon(h)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                forecastHorizon === h
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {h === '1d' ? '1 Day' : h === '5d' ? '5 Days' : h === '10d' ? '10 Days' : '30 Days'}
            </button>
          ))}
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
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="coneGradient95" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="coneGradient80" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.25" />
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

          {/* Historical Area & Line */}
          <polygon points={histAreaPoints} fill="url(#histGradient)" />
          <polyline
            points={histPoints}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Vertical Divider: Current Time (T0) */}
          <line
            x1={t0X}
            y1={paddingTop - 5}
            x2={t0X}
            y2={height - paddingBottom}
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text
            x={t0X}
            y={paddingTop - 12}
            textAnchor="middle"
            className="fill-amber-500 font-mono font-bold text-[11px]"
          >
            T₀ (Current Price: {currencySymbol}{currentPrice.toFixed(2)})
          </text>

          {/* Confidence Intervals */}
          <polygon points={ci95Polygon} fill="url(#coneGradient95)" />
          <polygon points={ci80Polygon} fill="url(#coneGradient80)" />

          {/* Forecast Trajectory Line */}
          <polyline
            points={fcLine}
            fill="none"
            stroke="#EC4899"
            strokeWidth="2.8"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />

          {/* Target Horizon Dots */}
          {fcSlice.map((f, i) => {
            const cx = getX(t0Idx + 1 + i);
            const cy = getY(f.predicted_price);
            const isLast = i === fcSlice.length - 1;
            return (
              <g key={`fc-dot-${i}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLast ? "5.5" : "3.5"}
                  fill={isLast ? "#EC4899" : "#8B5CF6"}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Interactive Hover Point */}
          {hoverIndex && (
            <g>
              {hoverIndex.type === 'hist' && (
                <circle
                  cx={getX(hoverIndex.index)}
                  cy={getY(histSlice[hoverIndex.index].close)}
                  r="5"
                  fill="#3B82F6"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
              {hoverIndex.type === 'fc' && (
                <circle
                  cx={getX(t0Idx + 1 + hoverIndex.index)}
                  cy={getY(fcSlice[hoverIndex.index].predicted_price)}
                  r="6"
                  fill="#EC4899"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={paddingLeft + 10}
            y={height - 18}
            className="fill-slate-400 font-mono text-[11px]"
          >
            Historical (Last 60 Sessions)
          </text>
          <text
            x={width - paddingRight - 10}
            y={height - 18}
            textAnchor="end"
            className="fill-purple-400 font-mono text-[11px] font-semibold"
          >
            Machine Learning Forecast Horizon (+{activeSteps}d)
          </text>
        </svg>
      </div>

      {/* Legend Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 rounded" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Historical Close</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-pink-500 border-b border-pink-500 border-dashed" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">ML Projected Price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-purple-500/40 rounded-sm" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">80% Interval</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-pink-500/20 rounded-sm" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">95% Uncertainty Cone</span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-mono">
          Model: L2 Auto-Regressive Ridge Regressor (Empirical Residual RMSE: ±{currencySymbol}{activeHorizonSummary?.ci_95_upper ? (activeHorizonSummary.ci_95_upper - activeHorizonSummary.predicted_price).toFixed(2) : '2.50'})
        </div>
      </div>
    </div>
  );
};
