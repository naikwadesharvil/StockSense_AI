import React from 'react';
import { useStock } from '../../context/StockContext';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { POPULAR_STOCKS } from '../../services/mockData';

export const LandingView: React.FC = () => {
  const { setCurrentView, selectStockAndNavigate, setIsSearchOpen } = useStock();

  const featuredTickers = [
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: '$128.80', change: '+3.45%', forecast: '+4.8% (5d)', color: 'text-emerald-500' },
    { symbol: 'AAPL', name: 'Apple Inc', price: '$224.50', change: '+0.85%', forecast: '+2.1% (5d)', color: 'text-emerald-500' },
    { symbol: 'RELIANCE', name: 'Reliance Ind', price: '₹2,985.00', change: '-0.42%', forecast: '+1.6% (5d)', color: 'text-rose-500' },
    { symbol: 'MSFT', name: 'Microsoft', price: '$448.20', change: '+1.15%', forecast: '+2.9% (5d)', color: 'text-emerald-500' },
    { symbol: 'TCS', name: 'Tata Consultancy', price: '₹4,210.00', change: '+0.60%', forecast: '+1.8% (5d)', color: 'text-emerald-500' }
  ];

  const features = [
    {
      icon: '🤖',
      title: 'Time-Series Machine Learning',
      description: 'L2 Regularized Ridge and Auto-Regressive regressors with multi-lag feature engineering and walk-forward chronological splitting.'
    },
    {
      icon: '🎯',
      title: 'Uncertainty Estimation & Cones',
      description: 'Dynamic 95% and 80% confidence interval cones expanding across 1, 5, 10, and 30-day forecasting horizons.'
    },
    {
      icon: '📊',
      title: 'Quantitative Technical Indicators',
      description: 'Real-time computation of SMA (20/50/200), EMA, Wilder RSI 14, MACD divergence, and Bollinger Bands with educational tooltips.'
    },
    {
      icon: '📰',
      title: 'NLP Sentiment Analytics',
      description: 'Automated headline classification, sentiment distribution gauges, and 7-day sentiment trend analysis.'
    },
    {
      icon: '⚖️',
      title: 'Multi-Stock Normalization',
      description: 'Cross-equity performance comparison, Pearson correlation matrices, and Sharpe ratio approximations.'
    },
    {
      icon: '🧪',
      title: 'Out-of-Sample Backtesting',
      description: 'Full transparency into model accuracy metrics including MAE, RMSE, MAPE, R², and Directional Hit Rates.'
    }
  ];

  return (
    <div className="space-y-12 pb-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 sm:p-12 text-center text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Academic AIML Capstone Project</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Predict trends. Understand markets.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Make informed decisions.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            StockSense AI is an intelligent time-series forecasting and market analytics platform that transforms raw historical price dynamics into actionable quantitative indicators, statistical confidence intervals, and multi-horizon predictions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => selectStockAndNavigate('NVDA', 'forecast')}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>Start Forecasting</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <button
              onClick={() => selectStockAndNavigate('AAPL', 'dashboard')}
              className="px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 font-semibold text-sm sm:text-base transition-all transform hover:-translate-y-0.5"
            >
              Explore Analytics
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-4 py-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 text-sm font-medium transition-all"
            >
              Search Equities (⌘K)
            </button>
          </div>
        </div>

        {/* Live Ticker Bar */}
        <div className="relative z-10 mt-10 pt-8 border-t border-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-left sm:text-center">
            Active Market Watch & Forecast Trajectory
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {featuredTickers.map(tkr => (
              <div
                key={tkr.symbol}
                onClick={() => selectStockAndNavigate(tkr.symbol, 'dashboard')}
                className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left cursor-pointer transition-all hover:scale-[1.02] shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-white">{tkr.symbol}</span>
                  <span className={`text-[11px] font-semibold ${tkr.color}`}>{tkr.change}</span>
                </div>
                <div className="text-xs text-slate-400 truncate">{tkr.name}</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono font-bold text-sm text-slate-200">{tkr.price}</span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                    {tkr.forecast}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Architecture & Pipeline Showcase */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            End-to-End Time-Series Machine Learning Pipeline
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Built with strict chronological data hygiene, avoiding lookahead bias and data leakage at every stage.
          </p>
        </div>

        {/* Pipeline Step Flowchart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          {[
            { step: '01', title: 'Raw OHLCV Data', desc: 'Market feeds' },
            { step: '02', title: 'Data Cleaning', desc: 'Outlier rejection' },
            { step: '03', title: 'Feature Eng.', desc: 'Lags & returns' },
            { step: '04', title: 'Tech Indicators', desc: 'RSI, MACD, BB' },
            { step: '05', title: 'Train/Test Split', desc: 'Chronological' },
            { step: '06', title: 'ML Regression', desc: 'L2 Ridge / Boost' },
            { step: '07', title: 'Uncertainty', desc: 'Residual RMSE' },
            { step: '08', title: 'Forecast Cone', desc: '1d to 30d visual' }
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="font-mono font-bold text-indigo-500 text-[10px] block mb-1">STEP {item.step}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.title}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Core Platform Capabilities Grid */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Platform Capabilities & Core Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Launch Equities Picker */}
      <section className="bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Select an Equity to Launch Forecast Workbench
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          Pre-loaded with major US Tech giants and top Indian NIFTY 50 blue chips.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {POPULAR_STOCKS.map(stk => (
            <button
              key={stk.symbol}
              onClick={() => selectStockAndNavigate(stk.symbol, 'dashboard')}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-indigo-500/10 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-left transition-all group"
            >
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-500">
                {stk.symbol}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {stk.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                {stk.exchange} • {stk.market_cap}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
