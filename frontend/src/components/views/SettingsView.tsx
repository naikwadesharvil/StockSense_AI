import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { ForecastHorizon, ModelType, ChartType } from '../../types/stock';
import { StockAPI, WatchlistStorage } from '../../services/api';

interface TerminalSettings {
  theme: 'dark' | 'light' | 'system';
  defaultChartType: ChartType;
  compactRows: boolean;
  reduceMotion: boolean;
  soundAlerts: boolean;
  defaultHorizon: ForecastHorizon;
  defaultModel: ModelType;
  confidenceLevel: '80' | '95' | '99';
  rsiPeriod: number;
  smaFastPeriod: number;
  smaSlowPeriod: number;
  defaultExchange: 'NSE' | 'NASDAQ' | 'NYSE';
  autoRefreshInterval: number; // in seconds, 0 = manual
  currencyPreference: 'AUTO' | 'USD' | 'INR';
  showProvenanceBadges: boolean;
  priceAlertsEnabled: boolean;
  volatilitySurgeAlerts: boolean;
}

const DEFAULT_SETTINGS: TerminalSettings = {
  theme: 'dark',
  defaultChartType: 'candlestick',
  compactRows: false,
  reduceMotion: false,
  soundAlerts: false,
  defaultHorizon: '5d',
  defaultModel: 'validation_selected',
  confidenceLevel: '95',
  rsiPeriod: 14,
  smaFastPeriod: 20,
  smaSlowPeriod: 50,
  defaultExchange: 'NSE',
  autoRefreshInterval: 30,
  currencyPreference: 'AUTO',
  showProvenanceBadges: true,
  priceAlertsEnabled: true,
  volatilitySurgeAlerts: true
};

const SETTINGS_STORAGE_KEY = 'stocksense_terminal_settings';

export const SettingsView: React.FC = () => {
  const { 
    chartType, 
    setChartType, 
    selectedHorizon, 
    setSelectedHorizon, 
    selectedModel, 
    setSelectedModel, 
    watchlist,
    addToast 
  } = useStock();

  const [activeTab, setActiveTab] = useState<'display' | 'quant' | 'data' | 'storage' | 'system'>('display');
  const [settings, setSettings] = useState<TerminalSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isSaved, setIsSaved] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [backendHealth, setBackendHealth] = useState<{ status: string; timestamp: string } | null>(null);

  // Sync settings changes
  const updateSetting = <K extends keyof TerminalSettings>(key: K, value: TerminalSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist settings', e);
      }
      return updated;
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Run live diagnostics ping
  const runDiagnostics = async () => {
    setDiagnosticsLoading(true);
    const start = performance.now();
    try {
      const isConnected = await StockAPI.isServerConnected();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setBackendHealth({
        status: isConnected ? 'ONLINE' : 'STANDALONE_FALLBACK',
        timestamp: new Date().toISOString()
      });
      addToast(`API Telemetry verified: ${Math.round(end - start)}ms round-trip latency`, isConnected ? 'success' : 'info');
    } catch (e) {
      setLatencyMs(null);
      setBackendHealth({
        status: 'DEGRADED / FALLBACK_MODE',
        timestamp: new Date().toISOString()
      });
      addToast('Backend ping reached standalone educational fallback mode', 'warning');
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  // Export Watchlist JSON
  const handleExportWatchlist = () => {
    try {
      const items = WatchlistStorage.getItems();
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stocksense_watchlist_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`Exported ${items.length} securities to JSON`, 'info');
    } catch (e) {
      addToast('Failed to export watchlist data', 'error');
    }
  };

  // Reset to Factory Defaults
  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setChartType('candlestick');
    setSelectedHorizon('5d');
    setSelectedModel('validation_selected');
    addToast('Terminal settings restored to institutional defaults', 'info');
  };

  // Purge Cached Historical Feeds
  const handlePurgeCache = () => {
    try {
      sessionStorage.clear();
      addToast('In-memory cache and session deduplication store purged', 'success');
    } catch (e) {
      addToast('Failed to purge session cache', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Terminal Configuration & Settings</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.0
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize quantitative algorithms, model hyperparameters, market telemetry, and visual terminal preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSaved && (
            <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1 animate-fade-in">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Auto-saved
            </span>
          )}
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#151D2F] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B] text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Tabs Sidebar + Settings Body */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1.5">
          {[
            {
              id: 'display',
              label: 'Display & UI',
              desc: 'Themes, charts & styling',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              id: 'quant',
              label: 'ML & Quant Engine',
              desc: 'Models, horizons & bounds',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )
            },
            {
              id: 'data',
              label: 'Market Telemetry',
              desc: 'Feeds, refresh & currency',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )
            },
            {
              id: 'storage',
              label: 'Data & Watchlist',
              desc: 'Backups, export & cache',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              )
            },
            {
              id: 'system',
              label: 'System Diagnostics',
              desc: 'Health, latency & sandbox',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )
            }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm'
                  : 'bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl mt-0.5 ${
                activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-100 dark:bg-[#151D2F] text-slate-400'
              }`}>
                {tab.icon}
              </div>
              <div>
                <div className="text-xs font-bold font-sans">
                  {tab.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {tab.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Settings Body */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB 1: Display & UI */}
          {activeTab === 'display' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="pb-3 border-b border-slate-100 dark:border-[#1E293B]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Terminal Appearance & Theme
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure institutional color themes and dark-mode terminal defaults.
                  </p>
                </div>

                {/* Theme Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'dark', title: 'Institutional Dark', subtitle: 'Default Bloomberg/Refinitiv OLED (#0B0F17)', active: settings.theme === 'dark' },
                    { id: 'light', title: 'Daylight Light', subtitle: 'High-contrast white background', active: settings.theme === 'light' },
                    { id: 'system', title: 'OS System Sync', subtitle: 'Match operating system appearance', active: settings.theme === 'system' }
                  ].map(themeOpt => (
                    <button
                      key={themeOpt.id}
                      onClick={() => updateSetting('theme', themeOpt.id as any)}
                      className={`p-3.5 rounded-xl text-left transition-all border ${
                        themeOpt.active
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-[#151D2F] border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{themeOpt.title}</span>
                        {themeOpt.active && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {themeOpt.subtitle}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Default Chart Style */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Default Chart Presentation
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Initial chart visualization when opening securities
                      </div>
                    </div>
                    <div className="inline-flex p-1 bg-slate-100 dark:bg-[#0B0F17] rounded-xl border border-slate-200 dark:border-[#1E293B]">
                      <button
                        onClick={() => {
                          updateSetting('defaultChartType', 'candlestick');
                          setChartType('candlestick');
                        }}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                          chartType === 'candlestick'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-white'
                        }`}
                      >
                        Candlestick
                      </button>
                      <button
                        onClick={() => {
                          updateSetting('defaultChartType', 'line');
                          setChartType('line');
                        }}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                          chartType === 'line'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-white'
                        }`}
                      >
                        Spline Area
                      </button>
                    </div>
                  </div>
                </div>

                {/* UI Toggles */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Compact Quantitative Row Density
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Reduces table padding for high-density constituent screening
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.compactRows}
                      onChange={e => updateSetting('compactRows', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-[#151D2F]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Reduced Motion & Low Latency Mode
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Disables canvas transitions for instantaneous updates
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reduceMotion}
                      onChange={e => updateSetting('reduceMotion', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-[#151D2F]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ML & Quant Engine */}
          {activeTab === 'quant' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="pb-3 border-b border-slate-100 dark:border-[#1E293B]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Machine Learning Architecture & Forecast Parameters
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure walk-forward validation engines, prediction horizons, and statistical confidence intervals.
                  </p>
                </div>

                {/* Default Forecast Horizon */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    Default Prediction Horizon
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['1d', '5d', '10d', '30d'] as ForecastHorizon[]).map(h => (
                      <button
                        key={h}
                        onClick={() => {
                          updateSetting('defaultHorizon', h);
                          setSelectedHorizon(h);
                        }}
                        className={`p-2.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                          selectedHorizon === h
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-50 dark:bg-[#151D2F] border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 hover:text-white'
                        }`}
                      >
                        +{h.toUpperCase()} Horizon
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Model Engine */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    Default Forecasting Algorithm
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'validation_selected', name: 'Validation Ensemble (Auto-Selected)', desc: 'Selects optimal model via out-of-sample RMSE validation' },
                      { id: 'ridge', name: 'Ridge Regression (L2 Regularized)', desc: 'Linear regularized autoregressive model with lag features' },
                      { id: 'xgboost', name: 'Gradient Boosted Trees (GBDT)', desc: 'Non-linear tree ensemble capturing non-linear interactions' },
                      { id: 'lstm', name: 'LSTM Neural Network (Recurrent)', desc: 'Deep recurrent architecture for long-term dependency modeling' }
                    ].map(mod => (
                      <button
                        key={mod.id}
                        onClick={() => {
                          updateSetting('defaultModel', mod.id as ModelType);
                          setSelectedModel(mod.id as ModelType);
                        }}
                        className={`p-3 rounded-xl text-left transition-all border ${
                          selectedModel === mod.id
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 ring-1 ring-indigo-500/30'
                            : 'bg-slate-50 dark:bg-[#151D2F] border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{mod.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{mod.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confidence Interval */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    Forecast Uncertainty Confidence Band (σ)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: '80', label: '80% Band (1.28σ)', desc: 'Narrow interval' },
                      { val: '95', label: '95% Band (1.96σ)', desc: 'Institutional standard' },
                      { val: '99', label: '99% Band (2.58σ)', desc: 'Conservative tail bound' }
                    ].map(ci => (
                      <button
                        key={ci.val}
                        onClick={() => updateSetting('confidenceLevel', ci.val as any)}
                        className={`p-2.5 rounded-xl text-center border font-mono text-xs ${
                          settings.confidenceLevel === ci.val
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                            : 'bg-slate-50 dark:bg-[#151D2F] border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div>{ci.label}</div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">{ci.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Technical Indicator Parameters */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    Technical Indicator Lookback Periods
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B]">
                      <label className="text-[11px] text-slate-400 block mb-1">RSI Lookback</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={settings.rsiPeriod}
                        onChange={e => updateSetting('rsiPeriod', parseInt(e.target.value) || 14)}
                        className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-[#1E293B] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B]">
                      <label className="text-[11px] text-slate-400 block mb-1">Fast SMA Period</label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={settings.smaFastPeriod}
                        onChange={e => updateSetting('smaFastPeriod', parseInt(e.target.value) || 20)}
                        className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-[#1E293B] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B]">
                      <label className="text-[11px] text-slate-400 block mb-1">Slow SMA Period</label>
                      <input
                        type="number"
                        min="20"
                        max="200"
                        value={settings.smaSlowPeriod}
                        onChange={e => updateSetting('smaSlowPeriod', parseInt(e.target.value) || 50)}
                        className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-[#1E293B] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Market Telemetry */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="pb-3 border-b border-slate-100 dark:border-[#1E293B]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Market Feeds & Data Telemetry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure polling frequency, exchange priorities, and provenance verification displays.
                  </p>
                </div>

                {/* Exchange Priority */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    Primary Exchange Universe
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'NSE', label: 'NSE India (NIFTY 50)', note: '₹ INR Denominated' },
                      { id: 'NASDAQ', label: 'NASDAQ US (Tech)', note: '$ USD Denominated' },
                      { id: 'NYSE', label: 'NYSE Composite', note: '$ USD Denominated' }
                    ].map(exc => (
                      <button
                        key={exc.id}
                        onClick={() => updateSetting('defaultExchange', exc.id as any)}
                        className={`p-3 rounded-xl text-left border ${
                          settings.defaultExchange === exc.id
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-slate-50 dark:bg-[#151D2F] border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold font-mono">{exc.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{exc.note}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Polling Interval */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    Live Telemetry Polling Rate
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { sec: 15, label: '15 Seconds' },
                      { sec: 30, label: '30 Seconds (Default)' },
                      { sec: 60, label: '60 Seconds' },
                      { sec: 0, label: 'Manual Only' }
                    ].map(rate => (
                      <button
                        key={rate.sec}
                        onClick={() => updateSetting('autoRefreshInterval', rate.sec)}
                        className={`p-2.5 rounded-xl font-mono text-xs text-center border ${
                          settings.autoRefreshInterval === rate.sec
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                            : 'bg-slate-50 dark:bg-[#151D2F] border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {rate.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provenance Badge Toggle */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Display Real-Time Provenance & Data Lineage Badges
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Shows source provider timestamps and verification statuses across all cards
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showProvenanceBadges}
                      onChange={e => updateSetting('showProvenanceBadges', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-[#151D2F]"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Relative Volume (RVOL) Spike Notifications
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Alerts when securities exceed 2.0x 20-day historical average volume
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.volatilitySurgeAlerts}
                      onChange={e => updateSetting('volatilitySurgeAlerts', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-[#151D2F]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Data & Watchlist */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="pb-3 border-b border-slate-100 dark:border-[#1E293B]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Watchlist Storage & Local Data Management
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Export watchlist portfolios, manage local persistence, and purge deduplication caches.
                  </p>
                </div>

                {/* Watchlist Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Tracked Watchlist Securities
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {watchlist.length} active securities stored in localStorage
                    </div>
                  </div>

                  <button
                    onClick={handleExportWatchlist}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export JSON</span>
                  </button>
                </div>

                {/* Cache Clear Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1E293B] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Session & In-Memory Deduplication Cache
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Purge temporary request deduplication locks and historical price caches
                      </div>
                    </div>
                    <button
                      onClick={handlePurgeCache}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
                    >
                      Purge Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: System Diagnostics */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Infrastructure Health & Diagnostic Telemetry
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Live status of backend APIs, ML inference pipelines, and payment sandbox gateways.
                    </p>
                  </div>

                  <button
                    onClick={runDiagnostics}
                    disabled={diagnosticsLoading}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {diagnosticsLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    <span>Run Ping Test</span>
                  </button>
                </div>

                {/* Diagnostics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">FastAPI ML Engine</div>
                    <div className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{backendHealth?.status || 'CONNECTED'}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Latency: {latencyMs !== null ? `${latencyMs}ms` : 'Standby'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Payment Gateway</div>
                    <div className="text-sm font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>SANDBOX / MOCK</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Stripe & Razorpay Mock Active
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Database & State</div>
                    <div className="text-sm font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                      <span>PERSISTENCE READY</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Supabase + LocalStore
                    </div>
                  </div>
                </div>

                {/* Environment Info */}
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-[#1E293B] text-xs font-mono space-y-1.5 text-slate-400">
                  <div className="text-slate-300 font-bold">Platform Environment Information:</div>
                  <div>Client: StockSense AI Terminal v2.0 (React 18 + Vite + Tailwind)</div>
                  <div>Backend: FastAPI Quantitative Engine (Walk-forward ML validation)</div>
                  <div>Payment Mode: Zero-Leakage Sandbox Gateway (Test Credentials Only)</div>
                  <div>Last Telemetry Timestamp: {backendHealth?.timestamp || 'Ready'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
