import React from 'react';
import { useStock } from '../../context/StockContext';
import { BacktestChart } from '../charts/BacktestChart';
import { MetricCard } from '../common/MetricCard';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { SkeletonLoader } from '../common/SkeletonLoader';

export const ModelPerformanceView: React.FC = () => {
  const { overview, forecastPkg, isLoading } = useStock();

  if (isLoading || !forecastPkg || !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <SkeletonLoader count={4} className="h-28" />
        <SkeletonLoader count={1} className="h-96" />
      </div>
    );
  }

  const metrics = forecastPkg.metrics;
  const backtest = forecastPkg.backtest_results;
  const featImp = forecastPkg.feature_importance;
  const currSym = overview.currency_symbol || '$';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Model Performance & Out-of-Sample Backtesting
            </h1>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {overview.symbol}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-semibold">
              85/15 Holdout Validation (Zero Lookahead)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rigorous chronological validation metrics computed on unseen test sessions without lookahead leakage.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-[#0B0F17] px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1E293B]">
          <div>Train Partition: {metrics.train_samples} days (thru {metrics.training_period_end})</div>
          <div>Holdout Test: {metrics.test_samples} days ({metrics.testing_period_start} to {metrics.testing_period_end})</div>
        </div>
      </div>

      {/* Model Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          label="Mean Absolute Error (MAE)"
          value={`${currSym}${metrics.mae}`}
          subValue="Avg price variance in currency"
          badge="MAE"
          badgeType="neutral"
        />

        <MetricCard
          label="Root Mean Squared Error (RMSE)"
          value={`${currSym}${metrics.rmse}`}
          subValue="Penalizes large error outliers"
          badge="RMSE"
          badgeType="neutral"
        />

        <MetricCard
          label="Mean Absolute % Error (MAPE)"
          value={`${metrics.mape}%`}
          subValue="Relative percentage precision"
          badge={metrics.mape < 5 ? 'High Accuracy' : 'Acceptable'}
          badgeType={metrics.mape < 5 ? 'green' : 'yellow'}
          highlight={true}
        />

        <MetricCard
          label="Coefficient of Determination (R²)"
          value={metrics.r2.toFixed(4)}
          subValue="Variance explained by features"
          badge="R² Score"
          badgeType={metrics.r2 > 0.5 ? 'green' : 'blue'}
        />

        <MetricCard
          label="Directional Accuracy (Hit Rate)"
          value={`${metrics.directional_accuracy_pct}%`}
          subValue="Correct next-day direction move"
          badge={metrics.directional_accuracy_pct > 50 ? 'Edge > Random' : 'Random'}
          badgeType={metrics.directional_accuracy_pct > 52 ? 'green' : 'neutral'}
        />
      </div>

      {/* Backtest Chart */}
      <BacktestChart
        data={backtest}
        currencySymbol={currSym}
        height={380}
      />

      {/* Feature Importance & Model Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Engineered Feature Importance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Normalized relative feature weights in the L2 regularized regression model.
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              L2 Ridge α=10.0
            </span>
          </div>

          <div className="space-y-3">
            {featImp.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={item.description}>
                    {item.feature}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {item.importance_pct}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#0B0F17] h-2 rounded-full overflow-hidden border border-transparent dark:border-[#1E293B]">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, item.importance_pct * 3)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistical Formulations & Methodology Card */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Time-Series Evaluation Methodology
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Financial asset prices contain non-stationary drift and temporal autocorrelation. Traditional random k-fold cross-validation is strictly invalid for stock data due to future lookahead contamination.
            </p>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B]">
                <div className="font-bold text-emerald-400 mb-0.5">Mean Absolute Error (MAE):</div>
                <div className="text-slate-600 dark:text-slate-300">MAE = (1/n) * Σ |y_i - ŷ_i| = {currSym}{metrics.mae}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B]">
                <div className="font-bold text-emerald-400 mb-0.5">Root Mean Squared Error (RMSE):</div>
                <div className="text-slate-600 dark:text-slate-300">RMSE = √[(1/n) * Σ (y_i - ŷ_i)²] = {currSym}{metrics.rmse}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B]">
                <div className="font-bold text-emerald-400 mb-0.5">Directional Accuracy (Hit Rate):</div>
                <div className="text-slate-600 dark:text-slate-300">Hit% = (1/n) * Σ I(sign(Δy) == sign(Δŷ)) = {metrics.directional_accuracy_pct}%</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-400">
            <strong>Key takeaway:</strong> Backtesting measures how well the mathematical parameters fit historical out-of-sample data. Unforeseen macroeconomic shocks, earnings surprises, and geopolitical events cannot be fully captured by historical price statistics alone.
          </div>
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
