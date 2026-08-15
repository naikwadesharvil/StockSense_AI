import React from 'react';
import { useStock } from '../../context/StockContext';
import { ForecastHorizon } from '../../types/stock';
import { ForecastChart } from '../charts/ForecastChart';
import { MetricCard } from '../common/MetricCard';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { SkeletonLoader } from '../common/SkeletonLoader';

export const ForecastView: React.FC = () => {
  const { overview, historicalData, forecastPkg, forecastHorizon, setForecastHorizon, isLoading } = useStock();

  if (isLoading || !forecastPkg || !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <SkeletonLoader count={4} className="h-28" />
        <SkeletonLoader count={1} className="h-96" />
      </div>
    );
  }

  const currSym = overview.currency_symbol || '$';
  const hKey = forecastHorizon;
  const currentHorizonData = forecastPkg.forecast_data.horizons[hKey] || forecastPkg.forecast_data.horizons['5d'];
  const metrics = forecastPkg.metrics;
  const trajectory = forecastPkg.forecast_data.forecast_trajectory;

  const horizonLabels: Record<ForecastHorizon, string> = {
    '1d': 'Next 1 Trading Day',
    '5d': 'Next 5 Trading Days',
    '10d': 'Next 10 Trading Days',
    '30d': 'Next 30 Trading Days'
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header & Horizon Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              AI Time-Series Stock Forecasting
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
              {overview.symbol}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
              Model: Ridge L2 Baseline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multi-horizon recursive autoregressive forecasting with residual variance uncertainty cones. Input Data: {overview.provenance?.provider || 'Market Data Feed'} ({overview.provenance?.freshness || 'HISTORICAL'}).
          </p>
        </div>

        {/* Horizon Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start md:self-auto">
          {(['1d', '5d', '10d', '30d'] as ForecastHorizon[]).map(h => (
            <button
              key={h}
              onClick={() => setForecastHorizon(h)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                forecastHorizon === h
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {h === '1d' ? '1 Day' : h === '5d' ? '5 Days' : h === '10d' ? '10 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards for Active Horizon */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={`${horizonLabels[forecastHorizon]} Forecast`}
          value={`${currSym}${currentHorizonData.predicted_price.toFixed(2)}`}
          change={currentHorizonData.expected_change_pct}
          changeSuffix="%"
          subValue={`Target Date: ${currentHorizonData.target_date}`}
          badge={currentHorizonData.direction}
          badgeType={currentHorizonData.direction === 'Bullish' ? 'green' : currentHorizonData.direction === 'Bearish' ? 'red' : 'blue'}
          highlight={true}
        />

        <MetricCard
          label="Current Baseline Price"
          value={`${currSym}${overview.current_price.toFixed(2)}`}
          subValue={`Previous Close: ${currSym}${overview.previous_close.toFixed(2)}`}
          badge="Live Market Base"
          badgeType="neutral"
        />

        <MetricCard
          label="95% Confidence Interval"
          value={`${currSym}${currentHorizonData.forecast_range_min}`}
          subValue={`Upper Bound: ${currSym}${currentHorizonData.forecast_range_max}`}
          badge="2σ Uncertainty"
          badgeType="blue"
        />

        <MetricCard
          label="Model Confidence Score"
          value={`${currentHorizonData.confidence_score}%`}
          subValue={`Out-of-Sample MAPE: ${metrics.mape}%`}
          badge={currentHorizonData.confidence_score > 80 ? 'High Fidelity' : 'Moderate'}
          badgeType="green"
        />
      </div>

      {/* Main Forecast Cone Chart */}
      <ForecastChart
        historicalData={historicalData}
        forecastTrajectory={trajectory}
        currencySymbol={currSym}
        height={440}
      />

      {/* Trajectory Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Daily Projected Trajectory & Uncertainty Table
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed step-by-step forward projection showing 80% and 95% confidence boundaries.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Model: L2 Ridge Auto-Regressive Pipeline
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-sans uppercase tracking-wider text-[10px]">
                <th className="p-3">Step</th>
                <th className="p-3">Target Date</th>
                <th className="p-3">Predicted Price</th>
                <th className="p-3">Expected Change</th>
                <th className="p-3">80% Confidence Interval</th>
                <th className="p-3">95% Confidence Interval</th>
                <th className="p-3">Uncertainty Spread</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {trajectory.slice(0, forecastHorizon === '1d' ? 1 : forecastHorizon === '5d' ? 5 : forecastHorizon === '10d' ? 10 : 30).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-indigo-500">+{row.step}d</td>
                  <td className="p-3">{row.date}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{currSym}{row.predicted_price.toFixed(2)}</td>
                  <td className={`p-3 font-semibold ${row.expected_change_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {row.expected_change_pct >= 0 ? '+' : ''}{row.expected_change_pct.toFixed(2)}%
                  </td>
                  <td className="p-3 text-purple-400">{currSym}{row.ci_80_lower} – {currSym}{row.ci_80_upper}</td>
                  <td className="p-3 text-pink-400">{currSym}{row.ci_95_lower} – {currSym}{row.ci_95_upper}</td>
                  <td className="p-3 text-slate-500">±{currSym}{((row.ci_95_upper - row.predicted_price)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};
