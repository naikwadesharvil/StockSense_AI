import React, { useState } from 'react';
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
import { SettingsView } from './components/views/SettingsView';
import { HelpView } from './components/views/HelpView';

export const App: React.FC = () => {
  const { currentView } = useStock();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingView />;
      case 'dashboard':
        return <DashboardView />;
      case 'forecast':
        return <ForecastView />;
      case 'technicals':
      case 'screener':
        return <TechnicalView />;
      case 'performance':
      case 'reports':
        return <ModelPerformanceView />;
      case 'compare':
      case 'portfolio':
        return <CompareView />;
      case 'watchlist':
      case 'alerts':
        return <WatchlistView />;
      case 'sentiment':
        return <SentimentView />;
      case 'pricing':
        return <PricingView />;
      case 'settings':
        return <SettingsView />;
      case 'help':
        return <HelpView />;
      case 'about':
        return <AboutView />;
      case 'trending':
      case 'markets':
        return <TrendingView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-150">
      {/* Fixed Left Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        {/* Dynamic View Container */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {renderView()}
        </main>

        {/* Terminal Footer Bar */}
        <footer className="border-t border-slate-200 dark:border-[#1E293B] py-3 px-4 sm:px-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-[#0B0F17]/80 backdrop-blur">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <strong>StockSense AI Terminal V2.0</strong>
              <span className="opacity-60">• Quantitative Time-Series Analytics</span>
            </div>
            <div className="opacity-70">
              Educational ML Research Platform • Verified Data Lineage • Not Financial Advice
            </div>
          </div>
        </footer>
      </div>

      {/* Global Search & Toast Modals */}
      <SearchModal />
      <ToastContainer />
    </div>
  );
};
