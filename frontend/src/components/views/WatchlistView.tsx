import React from 'react';
import { useStock } from '../../context/StockContext';
import { DisclaimerBanner } from '../common/DisclaimerBanner';

export const WatchlistView: React.FC = () => {
  const { watchlist, removeFromWatchlist, selectStockAndNavigate, setIsSearchOpen } = useStock();

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Portfolio Watchlist</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {watchlist.length} Tracked
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Persisted locally in your browser session with real-time model forecast snapshots.
          </p>
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+ Add Equity</span>
        </button>
      </div>

      {/* Watchlist Items */}
      {watchlist.length === 0 ? (
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl mx-auto">
            ⭐
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Watchlist is Empty</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Search and star any stock symbol (like AAPL, NVDA, RELIANCE, TCS) to monitor live price performance and multi-horizon forecasts here.
          </p>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
          >
            Browse Equities
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B0F17] text-slate-400 font-sans uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-[#1E293B]">
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Company Name</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4">24h Change</th>
                  <th className="p-4">5-Day AI Forecast</th>
                  <th className="p-4">Added Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] font-mono text-slate-700 dark:text-slate-300">
                {watchlist.map(item => (
                  <tr key={item.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-indigo-400 text-sm">
                      {item.symbol}
                    </td>
                    <td className="p-4 font-sans font-medium text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="p-4 font-bold text-sm text-slate-900 dark:text-white">
                      {item.currency_symbol}{item.current_price.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold px-2 py-0.5 rounded ${
                        item.daily_change_pct >= 0 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {item.daily_change_pct >= 0 ? '+' : ''}{item.daily_change_pct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                        item.forecast_5d_dir === 'Bullish' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : item.forecast_5d_dir === 'Bearish' 
                          ? 'bg-rose-500/10 text-rose-400' 
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {item.forecast_5d_dir} ({item.forecast_5d_pct >= 0 ? '+' : ''}{item.forecast_5d_pct.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-sans text-xs">
                      {item.added_at}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => selectStockAndNavigate(item.symbol, 'forecast')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold rounded-lg transition-colors"
                      >
                        Forecast
                      </button>
                      <button
                        onClick={() => removeFromWatchlist(item.symbol)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
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
