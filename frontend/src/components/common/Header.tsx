import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
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
    addToast
  } = useStock();
  const { theme, toggleTheme } = useTheme();

  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setIstTime(istStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isFavorited = isInWatchlist(selectedSymbol);

  // Check market hours: 09:15 to 15:30 IST Mon-Fri
  const checkIsMarketOpen = (): boolean => {
    const now = new Date();
    // Convert to IST
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    const day = istDate.getDay();
    if (day === 0 || day === 6) return false;
    const hours = istDate.getHours();
    const mins = istDate.getMinutes();
    const curMinutes = hours * 60 + mins;
    return curMinutes >= (9 * 60 + 15) && curMinutes <= (15 * 60 + 30);
  };

  const isNseOpen = checkIsMarketOpen();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#1E293B] px-3 sm:px-6 py-2.5 transition-colors duration-150">
      <div className="w-full mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Market Status / Clock */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden"
            title="Open Navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* NSE Market Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${
              isNseOpen
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isNseOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
              <span className="hidden sm:inline font-bold">NSE</span>
              <span>{isNseOpen ? 'Market Open' : 'Market Closed'}</span>
            </div>

            {/* IST Clock */}
            {istTime && (
              <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-[#111726] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#1E293B]">
                <span className="text-slate-500 dark:text-slate-400">IST:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{istTime}</span>
              </div>
            )}
          </div>

          {/* Active Stock Quick Chip */}
          {overview && (
            <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-[#1E293B]">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-[#111726] hover:bg-slate-200 dark:hover:bg-[#151d2f] rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors text-xs"
              >
                <span className="font-mono font-bold text-slate-900 dark:text-white">{overview.symbol}</span>
                <span className="font-mono text-slate-500">{overview.currency_symbol}{overview.current_price.toFixed(2)}</span>
                <span className={`font-mono font-bold ${overview.daily_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {overview.daily_change_pct >= 0 ? '+' : ''}{overview.daily_change_pct.toFixed(2)}%
                </span>
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
                className={`p-1.5 rounded-lg border transition-colors ${
                  isFavorited 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Center: Global Stock/Index Search */}
        <div className="flex-1 max-w-md mx-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-[#111726] hover:bg-slate-200 dark:hover:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] rounded-xl text-xs text-slate-500 dark:text-slate-400 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="truncate">Search NIFTY 50, US Stocks, Indices...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Notifications, Theme, Status */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Refresh Action */}
          <button
            onClick={() => {
              refreshStockData();
              addToast('Market models & quantitative series updated', 'success');
            }}
            title="Refresh quantitative models and data feeds"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Notifications Icon with Indicator */}
          <button
            onClick={() => addToast('3 Active Signals: NIFTY Breakout, Volume Surge in Reliance, IT Sector Rebound', 'info')}
            title="Real-Time Market Alerts"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B0F17]" />
          </button>

          {/* Backend Status indicator */}
          <div 
            className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
              serverConnected 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
            }`}
            title={serverConnected ? "Connected to Python FastAPI Backend" : "Running Client-Side TypeScript ML Engine"}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${serverConnected ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
            <span>{serverConnected ? 'FastAPI' : 'Browser ML'}</span>
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
