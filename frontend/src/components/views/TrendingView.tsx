import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { StockAPI } from '../../services/api';
import { NiftyTrendingResponse, NiftyTrendingStock } from '../../types/stock';
import { SkeletonLoader } from '../common/SkeletonLoader';

export const TrendingView: React.FC = () => {
  const { selectStockAndNavigate } = useStock();
  const [data, setData] = useState<NiftyTrendingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'gainers' | 'losers' | 'volume' | 'hightrend'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);

  const fetchTrendingData = async (forceRefresh: boolean = false) => {
    if (forceRefresh) setIsRefreshing(true);
    try {
      const res = await StockAPI.getNiftyTrending(forceRefresh);
      if (res) {
        setData(res);
      }
    } catch (e) {
      console.error('Failed to load NIFTY trending data', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendingData(false);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <SkeletonLoader count={4} className="h-24" />
        <SkeletonLoader count={1} className="h-96" />
      </div>
    );
  }

  const stocks = data?.ranked_stocks || [];

  // Filter logic
  const filteredStocks = stocks.filter((stock) => {
    // Search query filter
    const matchesSearch =
      searchQuery.trim() === '' ||
      stock.symbol.toUpperCase().includes(searchQuery.trim().toUpperCase()) ||
      stock.company_name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      stock.sector.toLowerCase().includes(searchQuery.trim().toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (filterTab === 'gainers') return stock.daily_change_percentage > 0;
    if (filterTab === 'losers') return stock.daily_change_percentage < 0;
    if (filterTab === 'volume') return stock.relative_volume >= 1.2;
    if (filterTab === 'hightrend') return stock.trend_score >= 60;
    return true;
  });

  const top3 = stocks.slice(0, 3);
  const isMarketOpen = data?.is_market_open ?? false;
  const marketStatus = data?.market_status ?? 'CLOSED';

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              NSE Real-Time Intelligence
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isMarketOpen
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              NSE Market {marketStatus}
            </span>

            <span className="text-[11px] text-slate-400 font-mono">
              As of {data?.data_as_of || 'Today'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            NIFTY 50 Trending Equities
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Deterministic multi-factor algorithmic trend ranking of India's premier benchmark equities. Evaluates return magnitude, volume relative to 30-day baseline, and intraday spread volatility.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowMethodologyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Methodology</span>
          </button>

          <button
            onClick={() => fetchTrendingData(true)}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Trends'}</span>
          </button>
        </div>
      </div>

      {/* Market Breadth & Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Evaluated
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {data?.total_stocks_evaluated || 50}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Full NIFTY 50 Index Universe
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
            Advancing (Gainers)
          </div>
          <div className="text-2xl font-extrabold text-emerald-500 mt-1 flex items-baseline gap-1">
            <span>{data?.top_gainers_count || 0}</span>
            <span className="text-xs text-slate-400 font-normal">
              ({(((data?.top_gainers_count || 0) / (data?.total_stocks_evaluated || 50)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Positive Daily Return
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
            Declining (Losers)
          </div>
          <div className="text-2xl font-extrabold text-rose-500 mt-1 flex items-baseline gap-1">
            <span>{data?.top_losers_count || 0}</span>
            <span className="text-xs text-slate-400 font-normal">
              ({(((data?.top_losers_count || 0) / (data?.total_stocks_evaluated || 50)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Negative Daily Return
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
            Avg Relative Vol (RVOL)
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {(stocks.reduce((acc, s) => acc + s.relative_volume, 0) / Math.max(stocks.length, 1)).toFixed(2)}x
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Benchmark Volume Ratio
          </div>
        </div>
      </div>

      {/* Top 3 Spotlight Podium */}
      {top3.length >= 3 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            🔥 Market Leaders Spotlight (Top 3 Trend Scores)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((stk, idx) => {
              const badgeLabels = ['🥇 Rank #1 Leader', '🥈 Rank #2 Runner Up', '🥉 Rank #3 Contender'];
              const borderColors = [
                'border-amber-400/60 dark:border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent',
                'border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-500/5 to-transparent',
                'border-amber-700/40 dark:border-amber-800/40 bg-gradient-to-b from-amber-900/5 to-transparent'
              ];

              return (
                <div
                  key={stk.symbol}
                  onClick={() => selectStockAndNavigate(stk.symbol, 'dashboard')}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 ${borderColors[idx]} shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {badgeLabels[idx]}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
                        Score: {stk.trend_score}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                          {stk.symbol}
                        </h3>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">
                          {stk.company_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-base text-slate-900 dark:text-white">
                          ₹{stk.current_price.toFixed(2)}
                        </div>
                        <div
                          className={`text-xs font-semibold font-mono ${
                            stk.daily_change_percentage >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {stk.daily_change_percentage >= 0 ? '+' : ''}
                          {stk.daily_change_percentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate">{stk.sector}</span>
                    <span className="font-mono font-medium">RVOL: {stk.relative_volume}x</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Trending ({stocks.length})
          </button>

          <button
            onClick={() => setFilterTab('gainers')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'gainers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🚀 Gainers ({data?.top_gainers_count || 0})
          </button>

          <button
            onClick={() => setFilterTab('losers')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'losers'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🔻 Losers ({data?.top_losers_count || 0})
          </button>

          <button
            onClick={() => setFilterTab('volume')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'volume'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⚡ Volume Surges
          </button>

          <button
            onClick={() => setFilterTab('hightrend')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'hightrend'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🔥 High Score (&gt;60)
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search NIFTY 50..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Ranked Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4">Security</th>
                <th className="py-3.5 px-4">Sector</th>
                <th className="py-3.5 px-4 text-right">Price (₹)</th>
                <th className="py-3.5 px-4 text-right">24h Change</th>
                <th className="py-3.5 px-4 text-right">Volume</th>
                <th className="py-3.5 px-4 text-right">RVOL</th>
                <th className="py-3.5 px-4">Trend Score</th>
                <th className="py-3.5 px-4 text-center">Category</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No securities match the selected filters or search query.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stk) => {
                  const isPositive = stk.daily_change_percentage >= 0;
                  const isTopRank = stk.rank <= 3;

                  return (
                    <tr
                      key={stk.symbol}
                      onClick={() => selectStockAndNavigate(stk.symbol, 'dashboard')}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            stk.rank === 1
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30'
                              : stk.rank === 2
                              ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                              : stk.rank === 3
                              ? 'bg-amber-900/20 text-amber-700 dark:text-amber-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {stk.rank}
                        </span>
                      </td>

                      {/* Security */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                          {stk.symbol}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {stk.company_name}
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="py-3.5 px-4 text-slate-500 truncate max-w-[150px]">
                        {stk.sector}
                      </td>

                      {/* Current Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{stk.current_price.toFixed(2)}
                      </td>

                      {/* Daily Change */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold font-mono ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {stk.daily_change_percentage.toFixed(2)}%
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {(stk.volume / 1e6).toFixed(2)}M
                      </td>

                      {/* Relative Volume */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span
                          className={`font-semibold ${
                            stk.relative_volume >= 1.5
                              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                              : stk.relative_volume >= 1.0
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {stk.relative_volume.toFixed(2)}x
                        </span>
                      </td>

                      {/* Trend Score Bar */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                stk.trend_score >= 70
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                  : stk.trend_score >= 40
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${stk.trend_score}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs w-8 text-right text-slate-800 dark:text-slate-200">
                            {stk.trend_score}
                          </span>
                        </div>
                      </td>

                      {/* Trend Category */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                            stk.trend_category.includes('Bullish')
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : stk.trend_category.includes('Bearish') || stk.trend_category.includes('Selloff')
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : stk.trend_category.includes('Volume')
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {stk.trend_category}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectStockAndNavigate(stk.symbol, 'forecast');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white text-[11px] font-semibold border border-indigo-500/20 transition-colors"
                        >
                          Forecast →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology Modal */}
      {showMethodologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Deterministic Trend Ranking Methodology
                </h3>
              </div>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                The StockSense AI NIFTY 50 trend score is a mathematically bounded (0 to 100) deterministic multi-factor model designed to highlight securities exhibiting statistically elevated activity:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                TrendScore = min(100, 0.40 × ReturnScore + 0.35 × VolumeScore + 0.25 × VolatilityScore)
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2">
                  <strong className="text-indigo-500 w-28 shrink-0">1. Return Score:</strong>
                  <span>Scaled magnitude of absolute percentage price movement relative to previous close. Weight: <strong>40%</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <strong className="text-indigo-500 w-28 shrink-0">2. Volume Score:</strong>
                  <span>Current trading volume normalized against the 30-day baseline average (Relative Volume RVOL). Weight: <strong>35%</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <strong className="text-indigo-500 w-28 shrink-0">3. Volatility Score:</strong>
                  <span>Intraday high-low range normalized to anchor price. Weight: <strong>25%</strong>.</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <strong>Data Provenance Notice:</strong> Quotes are sourced from verified market data channels with caching buffers. Historical closes are clearly distinguished from live open sessions.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
