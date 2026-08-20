import React from 'react';
import { useStock } from '../../context/StockContext';
import { AppView } from '../../types/stock';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemConfig {
  id: AppView;
  label: string;
  badge?: string;
  badgeType?: 'green' | 'blue' | 'purple' | 'neutral';
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { currentView, setCurrentView, watchlist, addToast } = useStock();

  const primaryNav: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'markets',
      label: 'Markets',
      badge: 'LIVE',
      badgeType: 'green',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'trending',
      label: 'NIFTY Trending',
      badge: 'NSE',
      badgeType: 'blue',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      badge: `${watchlist.length}`,
      badgeType: 'neutral',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      id: 'forecast',
      label: 'AI Forecast',
      badge: 'ML',
      badgeType: 'purple',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'sentiment',
      label: 'News & Sentiment',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'screener',
      label: 'Screener',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      )
    },
    {
      id: 'alerts',
      label: 'Alerts',
      badge: '3',
      badgeType: 'green',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const secondaryNav: NavItemConfig[] = [
    {
      id: 'pricing',
      label: 'Pricing',
      badge: 'PRO',
      badgeType: 'green',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const handleNavClick = (viewId: AppView) => {
    // Map alias routes to existing view implementations
    if (viewId === 'markets') {
      setCurrentView('trending');
    } else if (viewId === 'portfolio') {
      setCurrentView('compare');
    } else if (viewId === 'screener') {
      setCurrentView('technicals');
    } else if (viewId === 'reports') {
      setCurrentView('performance');
    } else if (viewId === 'alerts') {
      setCurrentView('watchlist');
      addToast('Real-time price alerts active for your watchlist', 'info');
    } else {
      setCurrentView(viewId);
    }
    onClose?.();
  };

  const isViewActive = (navId: AppView) => {
    if (currentView === navId) return true;
    if (navId === 'markets' && currentView === 'trending') return true;
    if (navId === 'portfolio' && currentView === 'compare') return true;
    if (navId === 'screener' && currentView === 'technicals') return true;
    if (navId === 'reports' && currentView === 'performance') return true;
    return false;
  };

  const renderBadge = (badge: string, type: string = 'neutral', isActive: boolean) => {
    const styles = {
      green: isActive ? 'bg-emerald-500/25 text-emerald-300' : 'bg-emerald-500/15 text-emerald-400',
      blue: isActive ? 'bg-indigo-500/25 text-indigo-300' : 'bg-indigo-500/15 text-indigo-400',
      purple: isActive ? 'bg-purple-500/25 text-purple-300' : 'bg-purple-500/15 text-purple-400',
      neutral: isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-400'
    };
    return (
      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${styles[type as keyof typeof styles] || styles.neutral}`}>
        {badge}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-60 lg:w-64 bg-slate-900/95 dark:bg-[#0B0F17] border-r border-slate-200 dark:border-[#1E293B] flex flex-col justify-between p-3.5 h-screen overflow-y-auto transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-4">
          {/* Logo & Terminal Branding */}
          <div className="px-2 py-1.5 flex items-center justify-between">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-base shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                S
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  <span>StockSense</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AI
                  </span>
                </div>
                <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  Terminal V2.0
                </div>
              </div>
            </button>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Primary Nav Menu */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation
            </div>
            {primaryNav.map(item => {
              const active = isViewActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 dark:text-emerald-400 border-l-2 border-emerald-500 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 dark:hover:bg-[#151D2F]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && renderBadge(item.badge, item.badgeType, active)}
                </button>
              );
            })}
          </div>

          {/* Separator */}
          <div className="border-t border-slate-200 dark:border-[#1E293B] my-2 pt-2">
            <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Preferences & Support
            </div>
            <div className="space-y-0.5">
              {secondaryNav.map(item => {
                const active = isViewActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      active
                        ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 dark:hover:bg-[#151D2F]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && renderBadge(item.badge, item.badgeType, active)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom User Area / Status */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#1E293B] space-y-2">
          {/* User Profile Bar */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs border border-emerald-500/30">
                QT
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-100 truncate max-w-[90px]">
                  Quant Trader
                </div>
                <div className="text-[10px] font-mono text-emerald-400">
                  Pro Active
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                addToast('Session saved. Ready for live analysis.', 'info');
              }}
              title="Terminal Session Status"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
