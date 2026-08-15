import { 
  OHLCVPoint, 
  IndicatorPoint, 
  IndicatorLatest, 
  ForecastStep, 
  HorizonSummary, 
  ModelMetrics, 
  FeatureImportanceItem, 
  BacktestItem, 
  ForecastPackage,
  MarketSignal,
  StockOverview
} from '../types/stock';
import { POPULAR_STOCKS, generateHistoricalSeries } from './mockData';

export class ClientMLEngine {
  /**
   * Calculates technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, Volatility, ATR)
   */
  public static computeIndicators(series: OHLCVPoint[]): { timeline: IndicatorPoint[]; latest: IndicatorLatest } {
    const n = series.length;
    const closes = series.map(p => p.close);
    const highs = series.map(p => p.high);
    const lows = series.map(p => p.low);

    // SMAs
    const sma20 = this.rollingMean(closes, 20);
    const sma50 = this.rollingMean(closes, 50);
    const sma200 = this.rollingMean(closes, 200);

    // EMAs
    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, 50);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);

    // MACD
    const macdLine = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      macdLine[i] = ema12[i] - ema26[i];
    }
    const macdSignal = this.calculateEMA(Array.from(macdLine), 9);
    const macdHist = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      macdHist[i] = macdLine[i] - macdSignal[i];
    }

    // RSI 14 (Wilder's Smoothing)
    const rsi14 = this.calculateRSI(closes, 14);

    // Bollinger Bands (20, 2)
    const bbStd = this.rollingStd(closes, 20);
    const bbUpper = new Float64Array(n);
    const bbLower = new Float64Array(n);
    const bbPctB = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      const mid = sma20[i];
      if (mid !== null) {
        bbUpper[i] = mid + 2.0 * bbStd[i];
        bbLower[i] = mid - 2.0 * bbStd[i];
        const span = bbUpper[i] - bbLower[i];
        bbPctB[i] = span > 0 ? (closes[i] - bbLower[i]) / span : 0.5;
      }
    }

    // Volatility (20-day annualized) & ATR
    const dailyReturns = new Float64Array(n);
    for (let i = 1; i < n; i++) {
      dailyReturns[i] = (closes[i] - closes[i - 1]) / closes[i - 1];
    }
    const vol20 = this.rollingStd(Array.from(dailyReturns), 20).map(v => v * Math.sqrt(252) * 100);

    const atr = this.calculateATR(highs, lows, closes, 14);

    const timeline: IndicatorPoint[] = [];
    for (let i = 0; i < n; i++) {
      timeline.push({
        ...series[i],
        sma_20: sma20[i] !== null ? Number(sma20[i]!.toFixed(2)) : null,
        sma_50: sma50[i] !== null ? Number(sma50[i]!.toFixed(2)) : null,
        sma_200: sma200[i] !== null ? Number(sma200[i]!.toFixed(2)) : null,
        ema_20: Number(ema20[i].toFixed(2)),
        ema_50: Number(ema50[i].toFixed(2)),
        rsi_14: Number(rsi14[i].toFixed(2)),
        macd_line: Number(macdLine[i].toFixed(2)),
        macd_signal: Number(macdSignal[i].toFixed(2)),
        macd_hist: Number(macdHist[i].toFixed(2)),
        bb_upper: sma20[i] !== null ? Number(bbUpper[i].toFixed(2)) : null,
        bb_middle: sma20[i] !== null ? Number(sma20[i]!.toFixed(2)) : null,
        bb_lower: sma20[i] !== null ? Number(bbLower[i].toFixed(2)) : null,
        bb_pct_b: sma20[i] !== null ? Number(bbPctB[i].toFixed(3)) : null,
        daily_return_pct: Number((dailyReturns[i] * 100).toFixed(2)),
        volatility_20d_ann: Number(vol20[i].toFixed(2)),
        atr_14: Number(atr[i].toFixed(2))
      });
    }

    const lastIdx = n - 1;
    const lastRsi = rsi14[lastIdx];
    const rsiStatus = lastRsi >= 70 ? 'Overbought' : lastRsi <= 30 ? 'Oversold' : 'Neutral Momentum';
    const macdStatus = macdHist[lastIdx] > 0 ? 'Bullish Divergence' : 'Bearish Divergence';

    const latest: IndicatorLatest = {
      rsi_14: Number(lastRsi.toFixed(2)),
      rsi_status: rsiStatus,
      macd_line: Number(macdLine[lastIdx].toFixed(2)),
      macd_signal: Number(macdSignal[lastIdx].toFixed(2)),
      macd_hist: Number(macdHist[lastIdx].toFixed(2)),
      macd_status: macdStatus,
      sma_20: sma20[lastIdx] !== null ? Number(sma20[lastIdx]!.toFixed(2)) : null,
      sma_50: sma50[lastIdx] !== null ? Number(sma50[lastIdx]!.toFixed(2)) : null,
      sma_200: sma200[lastIdx] !== null ? Number(sma200[lastIdx]!.toFixed(2)) : null,
      bb_upper: Number(bbUpper[lastIdx].toFixed(2)),
      bb_middle: Number(sma20[lastIdx]!.toFixed(2)),
      bb_lower: Number(bbLower[lastIdx].toFixed(2)),
      volatility_20d: Number(vol20[lastIdx].toFixed(2)),
      atr_14: Number(atr[lastIdx].toFixed(2))
    };

    return { timeline, latest };
  }

  /**
   * Fits Ridge Regression on engineered time-series features and evaluates out-of-sample test set.
   */
  public static runForecastPipeline(symbol: string): ForecastPackage {
    const rawData = generateHistoricalSeries(symbol, 400);
    const meta = POPULAR_STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase()) || {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Corporation`,
      exchange: 'GLOBAL',
      currency: 'USD',
      currency_symbol: '$',
      sector: 'General Equities',
      market_cap: '50.0B',
      pe_ratio: 24.5,
      beta: 1.05,
      dividend_yield: '1.2%'
    };

    const { timeline: featData, latest: indLatest } = this.computeIndicators(rawData);

    // Feature matrix extraction (Lags, SMAs, EMAs, RSI, MACD, Returns, Volatility)
    const validRows = featData.slice(50); // skip warmup period
    const N = validRows.length - 1; // last row target is unknown
    const numFeatures = 10;
    const X = new Array(N);
    const y = new Float64Array(N);
    const closes = new Float64Array(N);
    const dates: string[] = [];

    for (let i = 0; i < N; i++) {
      const cur = validRows[i];
      const next = validRows[i + 1];
      closes[i] = cur.close;
      y[i] = next.close;
      dates.push(cur.date);

      X[i] = [
        cur.close,
        validRows[Math.max(0, i - 1)].close,
        validRows[Math.max(0, i - 4)].close,
        cur.sma_20 ? (cur.close / cur.sma_20 - 1) : 0,
        cur.sma_50 ? (cur.close / cur.sma_50 - 1) : 0,
        cur.rsi_14 ? (cur.rsi_14 - 50) / 50 : 0,
        cur.macd_line || 0,
        cur.macd_hist || 0,
        cur.volatility_20d_ann ? cur.volatility_20d_ann / 100 : 0.2,
        cur.daily_return_pct ? cur.daily_return_pct / 100 : 0
      ];
    }

    // Chronological train / test split (85% train, 15% test)
    const splitIdx = Math.floor(N * 0.85);
    const trainX = X.slice(0, splitIdx);
    const trainY = y.slice(0, splitIdx);
    const testX = X.slice(splitIdx);
    const testY = y.slice(splitIdx);
    const testCloses = closes.slice(splitIdx);
    const testDates = dates.slice(splitIdx);

    // Standardize features based on training stats
    const { mean, std } = this.computeFeatureStats(trainX, numFeatures);
    const trainXScaled = this.scaleMatrix(trainX, mean, std);
    const testXScaled = this.scaleMatrix(testX, mean, std);

    // Fit Ridge Regression: beta = (X^T X + lambda I)^-1 X^T y
    const lambda = 10.0;
    const weights = this.fitRidge(trainXScaled, trainY, lambda);

    // Out-of-sample evaluation
    const testPreds = new Float64Array(testXScaled.length);
    let totalMae = 0;
    let totalMse = 0;
    let totalMape = 0;
    let correctDir = 0;
    const backtestResults: BacktestItem[] = [];

    for (let i = 0; i < testXScaled.length; i++) {
      const pred = this.predictRow(testXScaled[i], weights);
      testPreds[i] = pred;
      const actual = testY[i];
      const err = actual - pred;
      totalMae += Math.abs(err);
      totalMse += err * err;
      totalMape += Math.abs(err / actual) * 100;

      const actDir = Math.sign(actual - testCloses[i]);
      const predDir = Math.sign(pred - testCloses[i]);
      if (actDir === predDir) correctDir++;

      backtestResults.push({
        date: testDates[i],
        actual: Number(actual.toFixed(2)),
        predicted: Number(pred.toFixed(2)),
        error: Number(err.toFixed(2)),
        abs_error_pct: Number((Math.abs(err / actual) * 100).toFixed(2))
      });
    }

    const testN = testXScaled.length;
    const mae = totalMae / testN;
    const rmse = Math.sqrt(totalMse / testN);
    const mape = totalMape / testN;
    const directionalAccuracy = (correctDir / testN) * 100;

    // R2 calculation
    const testYMean = testY.reduce((a, b) => a + b, 0) / testN;
    let ssTot = 0;
    let ssRes = 0;
    for (let i = 0; i < testN; i++) {
      ssTot += (testY[i] - testYMean) ** 2;
      ssRes += (testY[i] - testPreds[i]) ** 2;
    }
    const r2 = Math.max(-0.5, 1.0 - (ssRes / (ssTot + 1e-9)));

    const metrics: ModelMetrics = {
      mae: Number(mae.toFixed(4)),
      rmse: Number(rmse.toFixed(4)),
      mape: Number(mape.toFixed(2)),
      r2: Number(r2.toFixed(4)),
      directional_accuracy_pct: Number(directionalAccuracy.toFixed(2)),
      train_samples: splitIdx,
      test_samples: testN,
      training_period_end: dates[splitIdx - 1],
      testing_period_start: testDates[0],
      testing_period_end: testDates[testN - 1],
      residual_std: Number(rmse.toFixed(4))
    };

    // Feature Importance
    const featureNames = [
      { name: "Lag 1 Price (T-1)", desc: "Previous trading session closing level" },
      { name: "Lag 2 Price (T-2)", desc: "2-session lagged price momentum" },
      { name: "Lag 5 Price (T-5)", desc: "Weekly baseline price memory" },
      { name: "Price / SMA 20 Ratio", desc: "Distance from 20-day mean trend" },
      { name: "Price / SMA 50 Ratio", desc: "Medium-term trend support/resistance" },
      { name: "RSI 14 Momentum", desc: "Overbought / oversold velocity oscillator" },
      { name: "MACD Spread (12, 26)", desc: "Fast-slow moving average divergence" },
      { name: "MACD Histogram Divergence", desc: "Momentum acceleration / deceleration" },
      { name: "20-Day Annual Volatility", desc: "Dispersion rate and variance scale" },
      { name: "1-Day Log Return", desc: "Immediate session price delta" }
    ];

    const absWeights = Array.from(weights.slice(1)).map(Math.abs);
    const weightSum = absWeights.reduce((a, b) => a + b, 0) + 1e-9;
    const featureImportance: FeatureImportanceItem[] = absWeights.map((w, idx) => ({
      feature: featureNames[idx]?.name || `Feature ${idx + 1}`,
      importance_pct: Number(((w / weightSum) * 100).toFixed(2)),
      description: featureNames[idx]?.desc || ""
    })).sort((a, b) => b.importance_pct - a.importance_pct);

    // Multi-Step Recursive Forecast Trajectory
    const currentPrice = rawData[rawData.length - 1].close;
    const lastDate = new Date(rawData[rawData.length - 1].date);
    const forecastTrajectory: ForecastStep[] = [];
    let simPrice = currentPrice;
    const maxSteps = 30;

    for (let step = 1; step <= maxSteps; step++) {
      // simulate business date
      const targetDate = new Date(lastDate);
      let addedDays = 0;
      while (addedDays < step) {
        targetDate.setDate(targetDate.getDate() + 1);
        if (targetDate.getDay() !== 0 && targetDate.getDay() !== 6) {
          addedDays++;
        }
      }

      // feature vector for step
      const stepFeatures = [
        simPrice,
        simPrice * 0.999,
        simPrice * 0.995,
        0.01,
        0.02,
        (indLatest.rsi_14 - 50) / 50,
        indLatest.macd_line,
        indLatest.macd_hist,
        indLatest.volatility_20d / 100,
        0.002
      ];

      const scaledStep = stepFeatures.map((val, idx) => (val - mean[idx]) / (std[idx] || 1));
      const pred = this.predictRow(scaledStep, weights);
      // damp slight runaways
      simPrice = currentPrice * 0.2 + pred * 0.8;

      const horizonExpansion = Math.sqrt(step);
      const margin95 = 1.96 * rmse * horizonExpansion;
      const margin80 = 1.28 * rmse * horizonExpansion;

      const lower95 = Math.max(0.5, pred - margin95);
      const upper95 = pred + margin95;
      const lower80 = Math.max(0.5, pred - margin80);
      const upper80 = pred + margin80;

      const pctChange = ((pred - currentPrice) / currentPrice) * 100;
      const yStr = targetDate.getFullYear();
      const mStr = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(targetDate.getDate()).padStart(2, '0');

      forecastTrajectory.push({
        step,
        date: `${yStr}-${mStr}-${dStr}`,
        predicted_price: Number(pred.toFixed(2)),
        expected_change_pct: Number(pctChange.toFixed(2)),
        ci_95_lower: Number(lower95.toFixed(2)),
        ci_95_upper: Number(upper95.toFixed(2)),
        ci_80_lower: Number(lower80.toFixed(2)),
        ci_80_upper: Number(upper80.toFixed(2)),
        uncertainty_range: `${lower95.toFixed(2)} – ${upper95.toFixed(2)}`
      });
    }

    // Horizon Summary Map
    const horizons: Record<string, HorizonSummary> = {};
    for (const h of [1, 5, 10, 30]) {
      const match = forecastTrajectory.find(f => f.step === h) || forecastTrajectory[forecastTrajectory.length - 1];
      const dir: 'Bullish' | 'Neutral' | 'Bearish' = match.expected_change_pct > 0.5 ? 'Bullish' : match.expected_change_pct < -0.5 ? 'Bearish' : 'Neutral';
      horizons[`${h}d`] = {
        horizon_days: h,
        target_date: match.date,
        current_price: currentPrice,
        predicted_price: match.predicted_price,
        expected_change_pct: match.expected_change_pct,
        forecast_range_min: match.ci_95_lower,
        forecast_range_max: match.ci_95_upper,
        direction: dir,
        confidence_score: Number(Math.max(35, 100 - (mape * Math.sqrt(h))).toFixed(1))
      };
    }

    // Stock Overview
    const last252 = rawData.slice(-252);
    const prevClose = rawData[rawData.length - 2].close;
    const dailyChg = currentPrice - prevClose;
    const stockOverview: StockOverview = {
      ...meta,
      current_price: currentPrice,
      previous_close: prevClose,
      daily_change: Number(dailyChg.toFixed(2)),
      daily_change_pct: Number(((dailyChg / prevClose) * 100).toFixed(2)),
      day_open: rawData[rawData.length - 1].open,
      day_high: rawData[rawData.length - 1].high,
      day_low: rawData[rawData.length - 1].low,
      volume: rawData[rawData.length - 1].volume,
      average_volume_30d: Math.floor(last252.slice(-30).reduce((acc, p) => acc + p.volume, 0) / 30),
      week_52_high: Math.max(...last252.map(p => p.high)),
      week_52_low: Math.min(...last252.map(p => p.low)),
      last_updated: new Date().toISOString()
    };

    // Composite Market Signal
    const marketSignal = this.calculateCompositeSignal(stockOverview, indLatest, horizons['5d']);

    return {
      symbol: symbol.toUpperCase(),
      stock_overview: stockOverview,
      forecast_data: {
        current_price: currentPrice,
        last_historical_date: rawData[rawData.length - 1].date,
        horizons,
        forecast_trajectory: forecastTrajectory,
        metrics,
        feature_importance: featureImportance,
        disclaimer: "Educational machine-learning forecast. Estimates are statistical projections and NOT financial advice."
      },
      indicators_latest: indLatest,
      market_signal: marketSignal,
      backtest_results: backtestResults.slice(-50),
      feature_importance: featureImportance,
      metrics
    };
  }

  public static calculateCompositeSignal(
    overview: StockOverview,
    indLatest: IndicatorLatest,
    h5d: HorizonSummary
  ): MarketSignal {
    let score = 0;
    const factors = [];

    // 1. Forecast trajectory
    if (h5d.expected_change_pct > 2.0) {
      score += 30;
      factors.push({ factor: "AI 5-Day Forecast", status: "Strong Bullish", impact: "+30 pts", detail: `Projected +${h5d.expected_change_pct}% expansion` });
    } else if (h5d.expected_change_pct > 0.5) {
      score += 18;
      factors.push({ factor: "AI 5-Day Forecast", status: "Moderate Bullish", impact: "+18 pts", detail: `Projected +${h5d.expected_change_pct}% upward tilt` });
    } else if (h5d.expected_change_pct < -2.0) {
      score -= 30;
      factors.push({ factor: "AI 5-Day Forecast", status: "Strong Bearish", impact: "-30 pts", detail: `Projected ${h5d.expected_change_pct}% contraction` });
    } else if (h5d.expected_change_pct < -0.5) {
      score -= 18;
      factors.push({ factor: "AI 5-Day Forecast", status: "Moderate Bearish", impact: "-18 pts", detail: `Projected ${h5d.expected_change_pct}% downward tilt` });
    } else {
      factors.push({ factor: "AI 5-Day Forecast", status: "Neutral", impact: "0 pts", detail: `Projected flat ${h5d.expected_change_pct}% path` });
    }

    // 2. Trend alignment
    if (indLatest.sma_20 && indLatest.sma_50) {
      if (overview.current_price > indLatest.sma_20 && indLatest.sma_20 > indLatest.sma_50) {
        score += 25;
        factors.push({ factor: "Moving Average Trend", status: "Bullish Alignment", impact: "+25 pts", detail: "Price > SMA20 > SMA50 (Golden Alignment)" });
      } else if (overview.current_price < indLatest.sma_20 && indLatest.sma_20 < indLatest.sma_50) {
        score -= 25;
        factors.push({ factor: "Moving Average Trend", status: "Bearish Alignment", impact: "-25 pts", detail: "Price < SMA20 < SMA50 (Death Cross Alignment)" });
      } else {
        factors.push({ factor: "Moving Average Trend", status: "Neutral / Mixed", impact: "+5 pts", detail: "Mixed multi-period trend crossover" });
      }
    }

    // 3. RSI
    if (indLatest.rsi_14 < 30) {
      score += 15;
      factors.push({ factor: "RSI (14)", status: "Oversold Bullish", impact: "+15 pts", detail: `RSI ${indLatest.rsi_14} in oversold rebound zone` });
    } else if (indLatest.rsi_14 > 70) {
      score -= 15;
      factors.push({ factor: "RSI (14)", status: "Overbought Caution", impact: "-15 pts", detail: `RSI ${indLatest.rsi_14} in overbought resistance zone` });
    } else {
      score += 10;
      factors.push({ factor: "RSI (14)", status: "Healthy Momentum", impact: "+10 pts", detail: `RSI ${indLatest.rsi_14} displaying stable velocity` });
    }

    // 4. MACD Histogram
    if (indLatest.macd_hist > 0) {
      score += 15;
      factors.push({ factor: "MACD Histogram", status: "Positive Expansion", impact: "+15 pts", detail: `Histogram divergence ${indLatest.macd_hist.toFixed(2)}` });
    } else {
      score -= 15;
      factors.push({ factor: "MACD Histogram", status: "Negative Contraction", impact: "-15 pts", detail: `Histogram divergence ${indLatest.macd_hist.toFixed(2)}` });
    }

    score = Math.max(-100, Math.min(100, score));

    let signal: 'Bullish' | 'Moderate Bullish' | 'Neutral' | 'Moderate Bearish' | 'Bearish' = 'Neutral';
    let badgeColor: 'green' | 'emerald' | 'blue' | 'orange' | 'red' = 'blue';

    if (score >= 45) {
      signal = 'Bullish';
      badgeColor = 'green';
    } else if (score >= 15) {
      signal = 'Moderate Bullish';
      badgeColor = 'emerald';
    } else if (score <= -45) {
      signal = 'Bearish';
      badgeColor = 'red';
    } else if (score <= -15) {
      signal = 'Moderate Bearish';
      badgeColor = 'orange';
    }

    return {
      signal,
      sentiment_score: score,
      confidence_level: Math.abs(score) > 40 ? 'High' : 'Moderate',
      badge_color: badgeColor,
      breakdown_factors: factors,
      label: "AI Market Sentiment — Educational Estimate",
      disclaimer: "Strictly educational sentiment index. Not a trading recommendation."
    };
  }

  // --- Math Helpers ---
  private static rollingMean(arr: number[], window: number): (number | null)[] {
    const res: (number | null)[] = new Array(arr.length).fill(null);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
      if (i >= window) sum -= arr[i - window];
      if (i >= window - 1) res[i] = sum / window;
    }
    return res;
  }

  private static rollingStd(arr: number[], window: number): Float64Array {
    const res = new Float64Array(arr.length);
    for (let i = window - 1; i < arr.length; i++) {
      const slice = arr.slice(i - window + 1, i + 1);
      const m = slice.reduce((a, b) => a + b, 0) / window;
      const v = slice.reduce((a, b) => a + (b - m) ** 2, 0) / window;
      res[i] = Math.sqrt(v);
    }
    return res;
  }

  private static calculateEMA(arr: number[], span: number): Float64Array {
    const res = new Float64Array(arr.length);
    const alpha = 2.0 / (span + 1.0);
    res[0] = arr[0];
    for (let i = 1; i < arr.length; i++) {
      res[i] = arr[i] * alpha + res[i - 1] * (1.0 - alpha);
    }
    return res;
  }

  private static calculateRSI(closes: number[], period: number = 14): Float64Array {
    const res = new Float64Array(closes.length).fill(50);
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) avgGain += diff;
      else avgLoss -= diff;
    }
    avgGain /= period;
    avgLoss /= period;
    res[period] = 100 - (100 / (1 + (avgGain / (avgLoss + 1e-9))));

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgGain / (avgLoss + 1e-9);
      res[i] = 100 - (100 / (1 + rs));
    }
    return res;
  }

  private static calculateATR(highs: number[], lows: number[], closes: number[], period: number): Float64Array {
    const res = new Float64Array(highs.length);
    const tr = new Float64Array(highs.length);
    tr[0] = highs[0] - lows[0];
    for (let i = 1; i < highs.length; i++) {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      tr[i] = Math.max(hl, hc, lc);
    }
    let sum = 0;
    for (let i = 0; i < period; i++) sum += tr[i];
    res[period - 1] = sum / period;
    for (let i = period; i < highs.length; i++) {
      res[i] = (res[i - 1] * (period - 1) + tr[i]) / period;
    }
    return res;
  }

  private static computeFeatureStats(matrix: number[][], numFeatures: number) {
    const mean = new Float64Array(numFeatures);
    const std = new Float64Array(numFeatures);
    const len = matrix.length;

    for (let j = 0; j < numFeatures; j++) {
      let sum = 0;
      for (let i = 0; i < len; i++) sum += matrix[i][j];
      mean[j] = sum / len;

      let varSum = 0;
      for (let i = 0; i < len; i++) varSum += (matrix[i][j] - mean[j]) ** 2;
      std[j] = Math.sqrt(varSum / len) || 1.0;
    }
    return { mean, std };
  }

  private static scaleMatrix(matrix: number[][], mean: Float64Array, std: Float64Array): number[][] {
    return matrix.map(row => row.map((val, j) => (val - mean[j]) / std[j]));
  }

  private static fitRidge(X: number[][], y: Float64Array, lambda: number): Float64Array {
    const n = X.length;
    const d = X[0].length;
    // Closed form Ridge via Gradient Descent or normal equations
    const weights = new Float64Array(d + 1); // [intercept, w1, w2, ...]
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    weights[0] = yMean;

    // Gradient descent for L2 Ridge
    const lr = 0.005;
    const epochs = 350;

    for (let ep = 0; ep < epochs; ep++) {
      const grad = new Float64Array(d + 1);
      for (let i = 0; i < n; i++) {
        let p = weights[0];
        for (let j = 0; j < d; j++) p += weights[j + 1] * X[i][j];
        const diff = p - y[i];
        grad[0] += diff;
        for (let j = 0; j < d; j++) grad[j + 1] += diff * X[i][j];
      }
      weights[0] -= (lr * grad[0]) / n;
      for (let j = 0; j < d; j++) {
        const reg = (lambda * weights[j + 1]) / n;
        weights[j + 1] -= lr * ((grad[j + 1] / n) + reg);
      }
    }
    return weights;
  }

  private static predictRow(x: number[], weights: Float64Array): number {
    let p = weights[0];
    for (let j = 0; j < x.length; j++) p += weights[j + 1] * x[j];
    return p;
  }
}
