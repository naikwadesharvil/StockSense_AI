import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { 
  StockOverview, 
  OHLCVPoint, 
  IndicatorPoint, 
  IndicatorLatest, 
  ForecastPackage, 
  Timeframe,
  ForecastHorizon,
  ChartType,
  ModelType,
  AppView,
  WatchlistItem,
  ToastItem,
  ToastType
} from '../types/stock';
import { StockAPI, WatchlistStorage } from '../services/api';

export interface StockContextType {
  // Navigation & View
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectStockAndNavigate: (symbol: string, view?: AppView) => void;

  // Active Symbol & Timeframe (with aliases)
  symbol: string;
  setSymbol: (symbol: string) => void;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;

  // Forecast Horizons & Models (with aliases)
  selectedHorizon: ForecastHorizon;
  setSelectedHorizon: (horizon: ForecastHorizon) => void;
  forecastHorizon: ForecastHorizon;
  setForecastHorizon: (horizon: ForecastHorizon) => void;
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;

  // Stock Data, Indicators & Forecasts (with aliases)
  stockOverview: StockOverview | null;
  overview: StockOverview | null;
  historicalData: OHLCVPoint[];
  indicators: { timeline: IndicatorPoint[]; latest: IndicatorLatest | null };
  forecast: ForecastPackage | null;
  forecastPkg: ForecastPackage | null;

  // Loading States
  isLoading: boolean;
  isLoadingOverview: boolean;
  isLoadingHistory: boolean;
  isLoadingForecast: boolean;
  forecastStage: string;
  error: string | null;

  // Actions & Refresh
  refreshData: () => void;
  refreshStockData: () => void;

  // Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Watchlist Management
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;

  // Toast Notification System
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;

  // Server Status
  serverConnected: boolean;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & UI State
  const getViewFromPath = (): AppView => {
    if (typeof window === 'undefined') return 'dashboard';
    const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const route = path || hash;
    if (route === 'dashboard') return 'dashboard';
    if (route === 'trending' || route === 'markets') return 'trending';
    if (route === 'forecast') return 'forecast';
    if (route === 'technical' || route === 'technicals' || route === 'screener') return 'technicals';
    if (route === 'performance' || route === 'reports') return 'performance';
    if (route === 'compare' || route === 'portfolio') return 'compare';
    if (route === 'watchlist' || route === 'alerts') return 'watchlist';
    if (route === 'sentiment') return 'sentiment';
    if (route === 'pricing') return 'pricing';
    if (route === 'settings') return 'settings';
    if (route === 'help' || route === 'support') return 'help';
    if (route === 'about') return 'about';
    if (route === 'landing' || route === 'home') return 'landing';
    return 'dashboard';
  };

  const [currentView, setCurrentViewState] = useState<AppView>(getViewFromPath);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [serverConnected, setServerConnected] = useState<boolean>(true);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => WatchlistStorage.getItems());
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      const path = view === 'dashboard' ? '/' : `/${view}`;
      window.history.pushState({ view }, '', path);
    }
  };

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentViewState(getViewFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Active Stock & Query State
  const [symbol, setSymbol] = useState<string>('NVDA');
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>('5d');
  const [selectedModel, setSelectedModel] = useState<ModelType>('validation_selected');
  
  // Data Payloads
  const [stockOverview, setStockOverview] = useState<StockOverview | null>(null);
  const [historicalData, setHistoricalData] = useState<OHLCVPoint[]>([]);
  const [indicators, setIndicators] = useState<{ timeline: IndicatorPoint[]; latest: IndicatorLatest | null }>({ timeline: [], latest: null });
  const [forecast, setForecast] = useState<ForecastPackage | null>(null);
  
  // Staged Loading Flags
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);
  const [forecastStage, setForecastStage] = useState<string>('Ready');
  const [error, setError] = useState<string | null>(null);

  const activeLoadRef = useRef<string>('');

  // Check server connection status on mount
  useEffect(() => {
    StockAPI.isServerConnected()
      .then(connected => setServerConnected(connected))
      .catch(() => setServerConnected(false));
  }, []);

  const loadStockData = async (sym: string, tf: Timeframe, mType: ModelType) => {
    const loadId = `${sym}_${tf}_${mType}_${Date.now()}`;
    activeLoadRef.current = loadId;
    setError(null);

    // STAGE 1: Immediate Market Info & Historical Candlesticks (<30ms)
    setIsLoadingOverview(true);
    setIsLoadingHistory(true);

    try {
      const [overviewRes, historyRes] = await Promise.all([
        StockAPI.getStockOverview(sym),
        StockAPI.getHistoricalData(sym, tf)
      ]);

      if (activeLoadRef.current !== loadId) return;

      setStockOverview(overviewRes);
      setHistoricalData(historyRes.data);
      setIsLoadingOverview(false);
      setIsLoadingHistory(false);
    } catch (e: any) {
      if (activeLoadRef.current !== loadId) return;
      setError("Market data temporarily unavailable. Displaying cached reference.");
      setIsLoadingOverview(false);
      setIsLoadingHistory(false);
    }

    // STAGE 2: Technical Indicators (<20ms)
    try {
      const indRes = await StockAPI.getTechnicalIndicators(sym, tf);
      if (activeLoadRef.current === loadId) {
        setIndicators(indRes);
      }
    } catch (e) {
      console.warn("Indicators fetch fallback");
    }

    // STAGE 3: Progressive AI Forecast Pipeline
    setIsLoadingForecast(true);
    setForecastStage('Market Data Ingested ✓');

    try {
      setForecastStage('Evaluating Features & Selection ✓');
      const fcRes = await StockAPI.getForecast(sym, mType);

      if (activeLoadRef.current !== loadId) return;

      setForecast(fcRes);
      setForecastStage('Validated Forecast Ready ✓');
      setIsLoadingForecast(false);
    } catch (e: any) {
      if (activeLoadRef.current !== loadId) return;
      setIsLoadingForecast(false);
      setForecastStage('Completed with fallback');
    }
  };

  useEffect(() => {
    loadStockData(symbol, timeframe, selectedModel);
  }, [symbol, timeframe, selectedModel]);

  const refreshData = useCallback(() => {
    loadStockData(symbol, timeframe, selectedModel);
  }, [symbol, timeframe, selectedModel]);

  const selectStockAndNavigate = useCallback((newSymbol: string, view: AppView = 'dashboard') => {
    const cleanSym = newSymbol.trim().toUpperCase();
    if (cleanSym) {
      setSymbol(cleanSym);
      setCurrentView(view);
      setIsSearchOpen(false);
    }
  }, []);

  // Toast Management
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  // Watchlist Actions
  const addToWatchlist = useCallback((item: WatchlistItem) => {
    WatchlistStorage.addItem(item);
    setWatchlist(WatchlistStorage.getItems());
    addToast(`Added ${item.symbol} to watchlist`, 'success');
  }, [addToast]);

  const removeFromWatchlist = useCallback((sym: string) => {
    WatchlistStorage.removeItem(sym);
    setWatchlist(WatchlistStorage.getItems());
    addToast(`Removed ${sym.toUpperCase()} from watchlist`, 'info');
  }, [addToast]);

  const isInWatchlist = useCallback((sym: string): boolean => {
    if (!sym) return false;
    return watchlist.some(i => i.symbol.toUpperCase() === sym.toUpperCase());
  }, [watchlist]);

  return (
    <StockContext.Provider
      value={{
        // View & Navigation
        currentView,
        setCurrentView,
        selectStockAndNavigate,

        // Symbols & Timeframes
        symbol,
        setSymbol,
        selectedSymbol: symbol,
        setSelectedSymbol: setSymbol,
        timeframe,
        setTimeframe,
        chartType,
        setChartType,

        // Horizons & Models
        selectedHorizon,
        setSelectedHorizon,
        forecastHorizon: selectedHorizon,
        setForecastHorizon: setSelectedHorizon,
        selectedModel,
        setSelectedModel,

        // Data Payloads
        stockOverview,
        overview: stockOverview,
        historicalData,
        indicators,
        forecast,
        forecastPkg: forecast,

        // Loading States
        isLoading: isLoadingOverview || isLoadingHistory,
        isLoadingOverview,
        isLoadingHistory,
        isLoadingForecast,
        forecastStage,
        error,

        // Refresh Actions
        refreshData,
        refreshStockData: refreshData,

        // Search Modal
        isSearchOpen,
        setIsSearchOpen,

        // Watchlist
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,

        // Toasts
        toasts,
        addToast,
        removeToast,

        // Server Status
        serverConnected
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = (): StockContextType => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
