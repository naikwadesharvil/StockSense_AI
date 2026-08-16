import { 
  StockMetadata, 
  StockOverview, 
  CompanyFundamentals,
  OHLCVPoint, 
  IndicatorPoint, 
  IndicatorLatest, 
  ForecastPackage, 
  SentimentData, 
  ComparisonPackage, 
  WatchlistItem, 
  Timeframe,
  ModelType,
  SubscriptionPlan,
  SubscriptionRecord,
  NiftyTrendingResponse
} from '../types/stock';
import { POPULAR_STOCKS, generateHistoricalSeries } from './mockData';
import { ClientMLEngine } from './mlEngine';

const getApiBaseUrl = (): string => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    // If running in local Vite development server, point to local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      if (window.location.port === '5173' || window.location.port === '3000') {
        return 'http://localhost:8000';
      }
      return '';
    }
    // On production (e.g. Vercel deployment), use same-origin relative URLs
    return '';
  }
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Request Deduplicator & Client Cache Manager
const inFlightPromises = new Map<string, Promise<any>>();
const clientCache = new Map<string, { data: any; expiresAt: number }>();

function deduplicatedFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 30000): Promise<T> {
  const cached = clientCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return Promise.resolve(cached.data);
  }

  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key) as Promise<T>;
  }

  const promise = fetcher()
    .then(data => {
      clientCache.set(key, { data, expiresAt: Date.now() + ttlMs });
      inFlightPromises.delete(key);
      return data;
    })
    .catch(err => {
      inFlightPromises.delete(key);
      throw err;
    });

  inFlightPromises.set(key, promise);
  return promise;
}

let isBackendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (isBackendAvailable !== null) return isBackendAvailable;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(id);
    isBackendAvailable = res.ok;
  } catch (e) {
    isBackendAvailable = false;
  }
  return isBackendAvailable;
}

export const StockAPI = {
  async isServerConnected(): Promise<boolean> {
    return await checkBackend();
  },

  async searchStocks(query: string): Promise<StockMetadata[]> {
    const q = query.trim().toUpperCase();
    if (!q) return POPULAR_STOCKS;

    return deduplicatedFetch(`search_${q}`, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/stocks/search?q=${encodeURIComponent(query)}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend search fallback to client engine');
        }
      }

      const filtered = POPULAR_STOCKS.filter(s => 
        s.symbol.includes(q) || 
        s.name.toUpperCase().includes(q) || 
        s.sector.toUpperCase().includes(q) ||
        s.exchange.toUpperCase().includes(q)
      );

      if (filtered.length === 0 && q.length >= 1) {
        filtered.push({
          symbol: q,
          name: `${q} Corporation`,
          exchange: "GLOBAL",
          currency: "USD",
          currency_symbol: "$",
          sector: "General Equities",
          market_cap: "45.0B",
          pe_ratio: 24.0,
          beta: 1.05,
          dividend_yield: "1.20%",
          description: `${q} is an equity security available for time-series forecasting.`
        });
      }
      return filtered;
    }, 60000);
  },

  async getStockOverview(symbol: string): Promise<StockOverview> {
    const sym = symbol.toUpperCase();
    return deduplicatedFetch(`overview_${sym}`, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/stocks/${sym}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend overview fallback to client engine');
        }
      }
      return ClientMLEngine.runForecastPipeline(sym).stock_overview;
    }, 30000);
  },

  async getCompanyFundamentals(symbol: string): Promise<CompanyFundamentals | null> {
    const sym = symbol.toUpperCase();
    return deduplicatedFetch(`fundamentals_${sym}`, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/stocks/${sym}/fundamentals`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend fundamentals fetch failed');
        }
      }
      return null;
    }, 3600000);
  },

  async getHistoricalData(symbol: string, timeframe: Timeframe = '1Y'): Promise<{ data: OHLCVPoint[]; symbol: string }> {
    const sym = symbol.toUpperCase();
    return deduplicatedFetch(`history_${sym}_${timeframe}`, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/stocks/${sym}/history?timeframe=${timeframe}`);
          if (res.ok) {
            const json = await res.json();
            return { data: json.historical_data, symbol: json.symbol };
          }
        } catch (e) {
          console.warn('Backend history fallback to client engine');
        }
      }

      const mapPoints: Record<Timeframe, number> = {
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        '5Y': 1200
      };
      const count = mapPoints[timeframe] || 365;
      const series = generateHistoricalSeries(sym, Math.max(count, 400));
      return { data: series.slice(-count), symbol: sym };
    }, 60000);
  },

  async getTechnicalIndicators(symbol: string, timeframe: Timeframe = '1Y'): Promise<{ timeline: IndicatorPoint[]; latest: IndicatorLatest }> {
    const sym = symbol.toUpperCase();
    return deduplicatedFetch(`indicators_${sym}_${timeframe}`, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/stocks/${sym}/indicators?timeframe=${timeframe}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend indicators fallback to client engine');
        }
      }
      const fullSeries = generateHistoricalSeries(sym, 400);
      return ClientMLEngine.computeIndicators(fullSeries);
    }, 60000);
  },

  async getForecast(symbol: string, modelType: ModelType = 'validation_selected'): Promise<ForecastPackage> {
    const sym = symbol.toUpperCase();
    return deduplicatedFetch(`forecast_${sym}_${modelType}`, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/forecast/${sym}?model=${modelType}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend forecast fallback to client engine');
        }
      }
      return ClientMLEngine.runForecastPipeline(sym);
    }, 60000);
  },

  async getModelComparison(symbol: string): Promise<any> {
    const sym = symbol.toUpperCase();
    return deduplicatedFetch(`comparison_matrix_${sym}`, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/model/comparison/${sym}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend model comparison fallback');
        }
      }
      return null;
    }, 120000);
  },

  async getNewsSentiment(symbol: string): Promise<SentimentData> {
    const sym = symbol.toUpperCase();
    return deduplicatedFetch(`sentiment_${sym}`, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/news/${sym}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend sentiment fallback to client engine');
        }
      }

      return {
        symbol: sym,
        provider: 'Offline / Standalone Mode',
        freshness: 'UNAVAILABLE',
        overall_sentiment: 'Neutral',
        average_score: 0.0,
        distribution: {
          positive_pct: 0.0,
          neutral_pct: 100.0,
          negative_pct: 0.0,
          sample_size: 0
        },
        sentiment_trend: [],
        recent_articles: [],
        articles: [],
        disclaimer: "Sentiment is algorithmically estimated from retrieved news and should not be interpreted as investment advice."
      };
    }, 60000);
  },

  async compareStocks(symbols: string[], timeframe: Timeframe = '6M'): Promise<ComparisonPackage> {
    const cleanSymbols = symbols.slice(0, 4);
    const key = `compare_${cleanSymbols.sort().join('_')}_${timeframe}`;

    return deduplicatedFetch(key, async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/compare?symbols=${cleanSymbols.join(',')}&timeframe=${timeframe}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend compare fallback to client engine');
        }
      }

      const seriesMap: Record<string, OHLCVPoint[]> = {};
      const overviewMap: Record<string, StockOverview> = {};

      for (const s of cleanSymbols) {
        const hist = generateHistoricalSeries(s, 180);
        seriesMap[s] = hist;
        overviewMap[s] = ClientMLEngine.runForecastPipeline(s).stock_overview;
      }

      const len = seriesMap[cleanSymbols[0]].length;
      const normSeries: Array<Record<string, any>> = [];

      for (let i = 0; i < len; i++) {
        const row: Record<string, any> = { date: seriesMap[cleanSymbols[0]][i].date };
        for (const s of cleanSymbols) {
          const basePrice = seriesMap[s][0].close;
          const currentPrice = seriesMap[s][i].close;
          const retPct = ((currentPrice - basePrice) / basePrice) * 100;
          row[`${s}_price`] = currentPrice;
          row[`${s}_return_pct`] = Number(retPct.toFixed(2));
        }
        normSeries.push(row);
      }

      const metricsTable = cleanSymbols.map(s => {
        const ov = overviewMap[s];
        const sData = seriesMap[s];
        const basePrice = sData[0].close;
        const endPrice = sData[sData.length - 1].close;
        const totalRet = ((endPrice - basePrice) / basePrice) * 100;

        const rets = sData.slice(1).map((p, idx) => (p.close - sData[idx].close) / sData[idx].close);
        const meanRet = rets.reduce((a, b) => a + b, 0) / rets.length;
        const stdRet = Math.sqrt(rets.reduce((a, b) => a + (b - meanRet) ** 2, 0) / rets.length);
        const annVol = stdRet * Math.sqrt(252) * 100;
        const sharpe = ((meanRet - (0.045 / 252)) / (stdRet + 1e-9)) * Math.sqrt(252);

        return {
          symbol: s,
          name: ov.name,
          current_price: ov.current_price,
          currency_symbol: ov.currency_symbol,
          daily_change_pct: ov.daily_change_pct,
          total_period_return_pct: Number(totalRet.toFixed(2)),
          annualized_volatility_pct: Number(annVol.toFixed(2)),
          sharpe_ratio_estimate: Number(sharpe.toFixed(2)),
          rsi_14: 55.4,
          pe_ratio: ov.pe_ratio || 25,
          beta: ov.beta || 1.0,
          market_cap: ov.market_cap
        };
      });

      const corrMatrix: Record<string, Record<string, number>> = {};
      for (const s1 of cleanSymbols) {
        corrMatrix[s1] = {};
        for (const s2 of cleanSymbols) {
          corrMatrix[s1][s2] = s1 === s2 ? 1.0 : Number((0.65 + (Math.abs(s1.charCodeAt(0) - s2.charCodeAt(0)) % 30) / 100).toFixed(2));
        }
      }

      return {
        symbols: cleanSymbols,
        timeframe,
        normalized_performance_series: normSeries,
        metrics_table: metricsTable,
        correlation_matrix: corrMatrix,
        disclaimer: "Comparative metrics and Sharpe ratios are statistical calculations for educational analysis."
      };
    }, 60000);
  },

  async getPlans(): Promise<SubscriptionPlan[]> {
    return deduplicatedFetch('subscription_plans', async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/plans`);
        if (res.ok) {
          const json = await res.json();
          return json.plans || [];
        }
      } catch (e) {
        console.warn('Backend payment plans unreachable');
      }
      return [
        {
          plan_id: 'free',
          display_name: 'Free Explorer',
          description: 'Fundamental market exploration and educational baseline forecasting.',
          price_usd: 0,
          price_inr: 0,
          billing_interval: 'month',
          features: ['Core 8 benchmark equities', '1-Day & 5-Day ML forecast horizons', 'Quantitative indicators (SMA, RSI, MACD, BB)', '5 watchlist securities'],
          max_watchlist_items: 5,
          allowed_forecast_horizons: ['1d', '5d'],
          access_advanced_models: false,
          access_full_universe: false
        },
        {
          plan_id: 'pro',
          display_name: 'Pro Trader',
          description: 'Expanded global equity universe, full multi-horizon forecasting, and real-time news analytics.',
          price_usd: 29,
          price_inr: 2400,
          billing_interval: 'month',
          features: ['Full 36+ US & Indian equity universe', 'All forecast horizons (1d, 5d, 10d, 30d)', 'Multi-model engine (Ridge, GBDT, LSTM)', 'Real-time external news feeds & sentiment', '25 watchlist securities', 'Out-of-sample backtesting & error metrics'],
          max_watchlist_items: 25,
          allowed_forecast_horizons: ['1d', '5d', '10d', '30d'],
          access_advanced_models: true,
          access_full_universe: true
        },
        {
          plan_id: 'premium',
          display_name: 'Institutional Elite',
          description: 'Complete quantitative suite with unlimited watchlist tracking and portfolio correlation matrices.',
          price_usd: 79,
          price_inr: 6500,
          billing_interval: 'month',
          features: ['Everything in Pro', 'Unlimited watchlist securities', 'Multi-stock correlation heatmap & normalization', 'Full company valuation & fundamentals', 'Custom risk interval parameter tuning'],
          max_watchlist_items: 100,
          allowed_forecast_horizons: ['1d', '5d', '10d', '30d'],
          access_advanced_models: true,
          access_full_universe: true
        }
      ];
    }, 120000);
  },

  async getSubscriptionStatus(): Promise<SubscriptionRecord> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend subscription status fetch failed');
    }
    return {
      subscription_id: 'sub_free_default',
      user_id: 'default_user',
      plan_id: 'free',
      provider: 'internal',
      status: 'ACTIVE',
      currency: 'USD',
      amount: 0,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 3650 * 86400000).toISOString()
    };
  },

  async createCheckoutSession(planId: string, provider: string = 'stripe', currency: string = 'USD'): Promise<{ status: string; session?: any; error?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, provider, currency })
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'error', error: 'NETWORK_ERROR', message: e?.message || 'Failed to connect to checkout service.' };
    }
  },

  async getNiftyTrending(forceRefresh: boolean = false): Promise<NiftyTrendingResponse | null> {
    return deduplicatedFetch(forceRefresh ? `nifty_trending_${Date.now()}` : 'nifty_trending', async () => {
      const useBackend = await checkBackend();
      if (useBackend) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/stocks/trending/nifty50${forceRefresh ? '?refresh=true' : ''}`);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn('Backend NIFTY trending fetch failed', e);
        }
      }
      return null;
    }, 45000);
  }
};

// LocalStorage Watchlist Manager
const WATCHLIST_KEY = 'stocksense_ai_watchlist';

export const WatchlistStorage = {
  getItems(): WatchlistItem[] {
    try {
      const data = localStorage.getItem(WATCHLIST_KEY);
      if (!data) {
        const initial: WatchlistItem[] = [
          { symbol: "NVDA", name: "NVIDIA Corporation", current_price: 128.80, currency_symbol: "$", daily_change_pct: 3.45, forecast_5d_dir: 'Bullish', forecast_5d_pct: 4.8, added_at: "2026-08-14" },
          { symbol: "AAPL", name: "Apple Inc.", current_price: 224.50, currency_symbol: "$", daily_change_pct: 0.85, forecast_5d_dir: 'Bullish', forecast_5d_pct: 2.1, added_at: "2026-08-14" },
          { symbol: "RELIANCE", name: "Reliance Industries", current_price: 2985.00, currency_symbol: "₹", daily_change_pct: -0.42, forecast_5d_dir: 'Neutral', forecast_5d_pct: 0.6, added_at: "2026-08-14" },
          { symbol: "MSFT", name: "Microsoft Corporation", current_price: 448.20, currency_symbol: "$", daily_change_pct: 1.15, forecast_5d_dir: 'Bullish', forecast_5d_pct: 2.9, added_at: "2026-08-14" }
        ];
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  addItem(item: WatchlistItem) {
    const list = this.getItems().filter(i => i.symbol !== item.symbol);
    list.unshift(item);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  },

  removeItem(symbol: string) {
    const list = this.getItems().filter(i => i.symbol.toUpperCase() !== symbol.toUpperCase());
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  },

  hasItem(symbol: string): boolean {
    return this.getItems().some(i => i.symbol.toUpperCase() === symbol.toUpperCase());
  }
};
