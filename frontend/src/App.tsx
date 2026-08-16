import React from 'react';
import { useStock } from './context/StockContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { SearchModal } from './components/common/SearchModal';
import { ToastContainer } from './components/common/Toast';

import { LandingView } from './components/views/LandingView';
import { DashboardView } from './components/views/DashboardView';
import { ForecastView } from './components/views/ForecastView';
import { TechnicalView } from './components/views/TechnicalView';
import { ModelPerformanceView } from './components/views/ModelPerformanceView';
import { CompareView } from './components/views/CompareView';
import { WatchlistView } from './components/views/WatchlistView';
import { SentimentView } from './components/views/SentimentView';
import { PricingView } from './components/views/PricingView';
import { AboutView } from './components/views/AboutView';
import { TrendingView } from './components/views/TrendingView';

export const App: React.FC = () => {
  const { currentView } = useStock();

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingView />;
      case 'dashboard':
        return <DashboardView />;
      case 'forecast':
        return <ForecastView />;
      case 'technicals':
        return <TechnicalView />;
      case 'performance':
        return <ModelPerformanceView />;
      case 'compare':
        return <CompareView />;
      case 'watchlist':
        return <WatchlistView />;
      case 'sentiment':
        return <SentimentView />;
      case 'pricing':
        return <PricingView />;
      case 'about':
        return <AboutView />;
      case 'trending':
        return <TrendingView />;
      default:
        return <LandingView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <Header />
      
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-full">
          {renderView()}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <SearchModal />
      <ToastContainer />

      {/* Footer Bar */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>StockSense AI</strong> — Intelligent Stock Forecasting & Market Analytics Platform
          </div>
          <div className="text-[11px] opacity-80">
            Educational Time-Series Machine Learning Platform • Not Financial Advice
          </div>
        </div>
      </footer>
    </div>
  );
};
