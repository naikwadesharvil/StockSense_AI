import React from 'react';
import { useStock } from '../../context/StockContext';
import { useTheme } from '../../context/ThemeContext';

export const Header: React.FC = () => {
  const { 
    selectedSymbol, 
    overview, 
    setIsSearchOpen, 
    serverConnected, 
    refreshStockData,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    setCurrentView,
    currentView
  } = useStock();
  const { theme, toggleTheme } = useTheme();

  const isFavorited = isInWatchlist(selectedSymbol);

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand / Mobile Nav trigger */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              S
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                StockSense <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-mono font-semibold">AI</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">
                Market Analytics & Forecasting
              </div>
            </div>
          </button>

          {/* Active Stock Badge */}
          {currentView !== 'landing' && overview && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700/60 transition-colors"
              >
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{overview.symbol}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{overview.name}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-900 px-1 rounded">
                  {overview.exchange}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Watchlist toggle */}
              <button
                onClick={() => isFavorited ? removeFromWatchlist(selectedSymbol) : addToWatchlist({
                  symbol: overview.symbol,
                  name: overview.name,
                  current_price: overview.current_price,
                  currency_symbol: overview.currency_symbol,
                  daily_change_pct: overview.daily_change_pct,
                  forecast_5d_dir: 'Neutral',
                  forecast_5d_pct: 0,
                  added_at: new Date().toISOString().split('T')[0]
                })}
                title={isFavorited ? "Remove from watchlist" : "Add to watchlist"}
                className={`p-2 rounded-lg border transition-colors ${
                  isFavorited 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Center: Search Button */}
        <div className="flex-1 max-w-md mx-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="truncate">Search AAPL, NVDA, RELIANCE, TCS...</span>
            </div>
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions (Refresh, Backend Status, Theme, Navigation) */}
        <div className="flex items-center gap-2">
          {/* Refresh Data */}
          {currentView !== 'landing' && (
            <button
              onClick={refreshStockData}
              title="Refresh time-series models & market data"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Backend Status indicator */}
          <div 
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
              serverConnected 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
            }`}
            title={serverConnected ? "Connected to Python FastAPI Backend" : "Running Client-Side TypeScript ML Engine"}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${serverConnected ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
            <span>{serverConnected ? 'FastAPI Backend' : 'In-Browser ML'}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
