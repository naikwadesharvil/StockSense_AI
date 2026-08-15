import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { ComparisonPackage, Timeframe } from '../../types/stock';
import { StockAPI } from '../../services/api';
import { ComparisonChart } from '../charts/ComparisonChart';
import { POPULAR_STOCKS } from '../../services/mockData';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { SkeletonLoader } from '../common/SkeletonLoader';

export const CompareView: React.FC = () => {
  const { selectedSymbol, selectStockAndNavigate } = useStock();
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['AAPL', 'NVDA', 'MSFT']);
  const [compTimeframe, setCompTimeframe] = useState<Timeframe>('6M');
  const [compData, setCompData] = useState<ComparisonPackage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Ensure currently selected symbol is in comparison list
    if (!selectedTickers.includes(selectedSymbol) && selectedTickers.length < 4) {
      setSelectedTickers(prev => [...prev, selectedSymbol]);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    async function loadComparison() {
      setLoading(true);
      try {
        const res = await StockAPI.compareStocks(selectedTickers, compTimeframe);
        setCompData(res);
      } catch (e) {
        console.error("Failed to load comparison:", e);
      } finally {
        setLoading(false);
      }
    }
    if (selectedTickers.length >= 2) {
      loadComparison();
    }
  }, [selectedTickers, compTimeframe]);

  const addTicker = (sym: string) => {
    if (selectedTickers.length < 4 && !selectedTickers.includes(sym)) {
      setSelectedTickers(prev => [...prev, sym]);
    }
  };

  const removeTicker = (sym: string) => {
    if (selectedTickers.length > 2) {
      setSelectedTickers(prev => prev.filter(s => s !== sym));
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Multi-Stock Performance & Risk Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare 2 to 4 equities side-by-side with normalized returns, volatility profiles, and correlation coefficients.
          </p>
        </div>

        {/* Timeframe Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {(['1M', '3M', '6M', '1Y', '5Y'] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setCompTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                compTimeframe === tf
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Tickers Pills & Add Ticker Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Active Equities ({selectedTickers.length}/4):</span>
          {selectedTickers.map(sym => (
            <div
              key={sym}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold"
            >
              <span>{sym}</span>
              {selectedTickers.length > 2 && (
                <button
                  onClick={() => removeTicker(sym)}
                  className="text-slate-400 hover:text-rose-500 text-sm leading-none"
                  title="Remove from comparison"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap">Add:</span>
          {POPULAR_STOCKS.map(stk => (
            <button
              key={stk.symbol}
              onClick={() => addTicker(stk.symbol)}
              disabled={selectedTickers.includes(stk.symbol) || selectedTickers.length >= 4}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors ${
                selectedTickers.includes(stk.symbol)
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              +{stk.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Normalized Performance Chart */}
      {loading || !compData ? (
        <SkeletonLoader count={1} className="h-96" />
      ) : (
        <ComparisonChart
          symbols={compData.symbols}
          series={compData.normalized_performance_series}
          height={380}
        />
      )}

      {/* Comparative Metrics Table */}
      {compData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
            Cross-Asset Risk & Return Comparison Table ({compTimeframe})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-sans uppercase tracking-wider text-[10px]">
                  <th className="p-3">Ticker</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">{compTimeframe} Return</th>
                  <th className="p-3">Annual Volatility</th>
                  <th className="p-3">Sharpe Est.</th>
                  <th className="p-3">RSI (14)</th>
                  <th className="p-3">P/E Ratio</th>
                  <th className="p-3">Beta</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                {compData.metrics_table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-indigo-500 font-mono">{row.symbol}</td>
                    <td className="p-3 font-sans font-medium text-slate-900 dark:text-white">{row.name}</td>
                    <td className="p-3 font-bold">{row.currency_symbol}{row.current_price.toFixed(2)}</td>
                    <td className={`p-3 font-semibold ${row.total_period_return_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {row.total_period_return_pct >= 0 ? '+' : ''}{row.total_period_return_pct.toFixed(2)}%
                    </td>
                    <td className="p-3">{row.annualized_volatility_pct}%</td>
                    <td className="p-3 font-bold text-purple-400">{row.sharpe_ratio_estimate}</td>
                    <td className="p-3">{row.rsi_14}</td>
                    <td className="p-3">{row.pe_ratio}</td>
                    <td className="p-3">{row.beta}</td>
                    <td className="p-3">
                      <button
                        onClick={() => selectStockAndNavigate(row.symbol, 'dashboard')}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-[11px] font-semibold transition-colors"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correlation Matrix Heatmap */}
      {compData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Pearson Return Correlation Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Measures linear dependency between daily price returns. Values closer to +1.0 indicate synchronized movement; lower values offer diversification benefit.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono max-w-lg">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-sans text-[11px]">
                  <th className="p-3 text-left">Ticker</th>
                  {compData.symbols.map(s => (
                    <th key={s} className="p-3">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {compData.symbols.map(s1 => (
                  <tr key={s1}>
                    <td className="p-3 font-bold text-left text-slate-900 dark:text-white">{s1}</td>
                    {compData.symbols.map(s2 => {
                      const corr = compData.correlation_matrix[s1]?.[s2] ?? (s1 === s2 ? 1.0 : 0.65);
                      const isSelf = s1 === s2;
                      const bgClass = isSelf 
                        ? 'bg-indigo-500/20 text-indigo-400 font-bold' 
                        : corr > 0.7 
                        ? 'bg-emerald-500/15 text-emerald-500' 
                        : 'bg-blue-500/10 text-blue-400';
                      return (
                        <td key={s2} className={`p-3 ${bgClass}`}>
                          {corr.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
};
