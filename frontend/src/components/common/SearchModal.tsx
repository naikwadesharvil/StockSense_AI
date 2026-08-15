import React, { useState, useEffect, useRef } from 'react';
import { useStock } from '../../context/StockContext';
import { StockAPI } from '../../services/api';
import { VERIFIED_SECURITIES, searchLocalSecurities, SecurityItem } from '../../services/stockRegistry';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, selectStockAndNavigate, selectedSymbol } = useStock();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SecurityItem[]>(VERIFIED_SECURITIES.slice(0, 10));
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(VERIFIED_SECURITIES.slice(0, 10));
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(VERIFIED_SECURITIES.slice(0, 10));
      return;
    }

    // Instant Local Autocomplete Search (< 10ms)
    const localMatches = searchLocalSecurities(query);
    setResults(localMatches);

    // Optional asynchronous background sync with backend search
    const timer = setTimeout(async () => {
      try {
        const remote = await StockAPI.searchStocks(query);
        if (remote && remote.length > 0) {
          // Merge / ensure completeness
          const formatted: SecurityItem[] = remote.map((r: any) => ({
            symbol: r.symbol,
            company_name: r.company_name || r.name || r.symbol,
            name: r.name || r.company_name || r.symbol,
            exchange: r.exchange || 'GLOBAL',
            country: r.country || 'US',
            currency: r.currency || 'USD',
            currency_symbol: r.currency_symbol || (r.currency === 'INR' ? '₹' : '$'),
            sector: r.sector || 'Equities',
            provider_symbol: r.provider_symbol || r.symbol
          }));
          if (formatted.length > 0) {
            setResults(formatted);
          }
        }
      } catch (e) {
        // Local results already displayed seamlessly
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: string) => {
    selectStockAndNavigate(symbol, 'dashboard');
    setIsSearchOpen(false);
  };

  if (!isSearchOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsSearchOpen(false)}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search US & Indian equities (e.g. AAPL, Reliance, NVDA, TCS, JPM)..."
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-base font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded"
            >
              Clear
            </button>
          )}
          <span className="text-xs text-slate-400 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Quick Picks / Popular */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap">Featured:</span>
          {['NVDA', 'AAPL', 'MSFT', 'TSLA', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'AMZN', 'JPM'].map(sym => (
            <button
              key={sym}
              onClick={() => handleSelect(sym)}
              className={`px-2.5 py-1 rounded-md font-mono font-semibold transition-colors ${
                selectedSymbol === sym 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
              Searching equity universe...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No matching securities found for "{query}". Try another company name or ticker.
            </div>
          ) : (
            results.map(sec => (
              <div
                key={sec.symbol}
                onClick={() => handleSelect(sec.symbol)}
                className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  selectedSymbol === sec.symbol
                    ? 'bg-indigo-500/10 border-l-4 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-bold flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {sec.symbol.slice(0, 4)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span>{sec.company_name || sec.name}</span>
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        {sec.symbol}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                      <span className="font-semibold">{sec.exchange}</span>
                      <span>•</span>
                      <span>{sec.country}</span>
                      <span>•</span>
                      <span>{sec.currency}</span>
                      <span>•</span>
                      <span className="font-sans text-slate-400">{sec.sector}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500">
                    Select →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
          <span>{VERIFIED_SECURITIES.length} securities across NASDAQ, NYSE, and NSE</span>
          <div className="flex items-center gap-2">
            <span>Click to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
