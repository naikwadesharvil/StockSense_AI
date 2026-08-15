export type Timeframe = '1M' | '3M' | '6M' | '1Y' | '5Y';
export type ForecastHorizon = '1d' | '5d' | '10d' | '30d';
export type ChartType = 'line' | 'candlestick';
export type ModelType = 'ridge' | 'xgboost' | 'lstm' | 'validation_selected';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export type AppView = 
  | 'landing'
  | 'dashboard'
  | 'forecast'
  | 'technicals'
  | 'performance'
  | 'compare'
  | 'watchlist'
  | 'sentiment'
  | 'pricing'
  | 'about';

export interface DataProvenance {
  source: string;
  provider: string;
  symbol: string;
  exchange: string;
  currency: string;
  timestamp: string;
  timezone: string;
  market_status: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS' | 'UNKNOWN';
  freshness: 'LIVE' | 'DELAYED' | 'HISTORICAL' | 'FALLBACK' | 'UNAVAILABLE';
  is_live: boolean;
  is_delayed: boolean;
  is_fallback: boolean;
}

export interface StockMetadata {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  currency_symbol: string;
  sector: string;
  market_cap: string;
  pe_ratio?: number;
  beta?: number;
  dividend_yield?: string;
  description?: string;
  data_mode?: string;
}

export interface CompanyFundamentals {
  symbol: string;
  company_name: string;
  sector?: string;
  industry?: string;
  description?: string;
  
  // Valuation Metrics
  market_cap?: string | null;
  enterprise_value?: string | null;
  pe_ratio?: number | null;
  forward_pe?: number | null;
  peg_ratio?: number | null;
  price_to_book?: number | null;
  price_to_sales?: number | null;
  ev_to_revenue?: number | null;
  ev_to_ebitda?: number | null;
  
  // Profitability & Margins
  eps?: number | null;
  forward_eps?: number | null;
  revenue?: string | null;
  revenue_growth?: string | null;
  gross_margin?: string | null;
  operating_margin?: string | null;
  profit_margin?: string | null;
  return_on_equity?: string | null;
  return_on_assets?: string | null;
  
  // Balance Sheet & Cash Flow
  total_debt?: string | null;
  total_cash?: string | null;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  free_cash_flow?: string | null;
  operating_cash_flow?: string | null;
  capital_expenditures?: string | null;
  
  // Dividends
  dividend_rate?: number | null;
  dividend_yield?: string | null;
  payout_ratio?: string | null;
  
  // Market Trading Stats
  shares_outstanding?: string | null;
  beta?: number | null;
  week_52_high?: number | null;
  week_52_low?: number | null;
  
  // Provenance & As-Of Date
  data_as_of?: string | null;
  provenance?: DataProvenance;
}

export interface StockOverview extends StockMetadata {
  current_price: number;
  previous_close: number;
  daily_change: number;
  daily_change_pct: number;
  day_open: number;
  day_high: number;
  day_low: number;
  volume: number;
  average_volume_30d: number;
  week_52_high: number;
  week_52_low: number;
  last_updated: string;
  data_as_of?: string;
  data_mode?: string;
  data_provider?: string;
  is_real_data?: boolean;
  corporate_actions_adjusted?: boolean;
  provenance?: DataProvenance;
  fundamentals?: CompanyFundamentals;
}

export interface OHLCVPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorPoint extends OHLCVPoint {
  sma_20?: number | null;
  sma_50?: number | null;
  sma_200?: number | null;
  ema_20?: number | null;
  ema_50?: number | null;
  rsi_14?: number | null;
  macd_line?: number | null;
  macd_signal?: number | null;
  macd_hist?: number | null;
  bb_upper?: number | null;
  bb_middle?: number | null;
  bb_lower?: number | null;
  bb_pct_b?: number | null;
  daily_return_pct?: number | null;
  volatility_20d_ann?: number | null;
  atr_14?: number | null;
}

export interface IndicatorLatest {
  rsi_14: number;
  rsi_status: string;
  macd_line: number;
  macd_signal: number;
  macd_hist: number;
  macd_status: string;
  sma_20: number | null;
  sma_50: number | null;
  sma_200: number | null;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  volatility_20d: number;
  atr_14: number;
}

export interface ForecastStep {
  step: number;
  date: string;
  predicted_price: number;
  expected_change_pct: number;
  ci_95_lower: number;
  ci_95_upper: number;
  ci_80_lower: number;
  ci_80_upper: number;
  uncertainty_range: string;
}

export interface HorizonSummary {
  horizon_days: number;
  target_date: string;
  current_price: number;
  predicted_price: number;
  expected_change_pct: number;
  forecast_range_min: number;
  forecast_range_max: number;
  direction: 'Bullish' | 'Neutral' | 'Bearish';
  confidence_score: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  directional_accuracy_pct: number;
  train_samples: number;
  test_samples: number;
  training_period_end: string;
  testing_period_start: string;
  testing_period_end: string;
  residual_std?: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance_pct: number;
  description: string;
}

export interface BacktestItem {
  date: string;
  actual: number;
  predicted: number;
  error: number;
  abs_error_pct: number;
}

export interface ForecastPackage {
  symbol: string;
  stock_overview: StockOverview;
  forecast_data: {
    current_price: number;
    last_historical_date: string;
    horizons: Record<string, HorizonSummary>;
    forecast_trajectory: ForecastStep[];
    metrics: ModelMetrics;
    feature_importance: FeatureImportanceItem[];
    disclaimer: string;
  };
  indicators_latest: IndicatorLatest;
  market_signal: MarketSignal;
  backtest_results: BacktestItem[];
  feature_importance: FeatureImportanceItem[];
  metrics: ModelMetrics;
}

export interface SignalFactor {
  factor: string;
  status: string;
  impact: string;
  detail: string;
}

export interface MarketSignal {
  signal: 'Bullish' | 'Moderate Bullish' | 'Neutral' | 'Moderate Bearish' | 'Bearish';
  sentiment_score: number;
  confidence_level: 'High' | 'Moderate' | 'Low';
  badge_color: 'green' | 'emerald' | 'blue' | 'orange' | 'red';
  breakdown_factors: SignalFactor[];
  label: string;
  disclaimer: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  headline?: string;
  summary?: string;
  source: string;
  published_at: string;
  sentiment_score: number;
  sentiment_class: 'Positive' | 'Neutral' | 'Negative';
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
  provider?: string;
  url: string;
}

export interface SentimentData {
  symbol: string;
  provider?: string;
  retrieved_at?: string;
  freshness?: string;
  overall_sentiment: string;
  average_score: number;
  confidence?: number;
  distribution: {
    positive_pct: number;
    neutral_pct: number;
    negative_pct: number;
    sample_size: number;
  };
  sentiment_summary?: {
    positive: number;
    neutral: number;
    negative: number;
    overall: string;
    score: number;
    confidence: number;
  };
  sentiment_trend: Array<{ date: string; sentiment_score: number }>;
  recent_articles: NewsArticle[];
  articles?: NewsArticle[];
  disclaimer: string;
}

export interface ComparativeMetricRow {
  symbol: string;
  name: string;
  current_price: number;
  currency_symbol: string;
  daily_change_pct: number;
  total_period_return_pct: number;
  annualized_volatility_pct: number;
  sharpe_ratio_estimate: number;
  rsi_14: number;
  pe_ratio: number;
  beta: number;
  market_cap: string;
}

export interface ComparisonPackage {
  symbols: string[];
  timeframe: string;
  normalized_performance_series: Array<Record<string, any>>;
  metrics_table: ComparativeMetricRow[];
  correlation_matrix: Record<string, Record<string, number>>;
  disclaimer: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  current_price: number;
  currency_symbol: string;
  daily_change_pct: number;
  forecast_5d_dir: 'Bullish' | 'Neutral' | 'Bearish';
  forecast_5d_pct: number;
  added_at: string;
}

export interface SubscriptionPlan {
  plan_id: string;
  display_name: string;
  description: string;
  price_usd: number;
  price_inr: number;
  billing_interval: string;
  features: string[];
  max_watchlist_items: number;
  allowed_forecast_horizons: string[];
  access_advanced_models: boolean;
  access_full_universe: boolean;
}

export interface SubscriptionRecord {
  subscription_id: string;
  user_id: string;
  plan_id: string;
  provider: string;
  status: 'INCOMPLETE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'UNPAID';
  currency: string;
  amount: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
}

