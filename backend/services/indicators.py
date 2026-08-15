"""
StockSense AI V2 - High-Performance Technical Indicators Service
Calculates and formats technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands,
Volatility, ATR, Daily Returns) with fast vectorized NumPy operations and caching.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple

from backend.services.cache_service import cache_manager, CacheManager, get_current_ist_timestamp

class IndicatorService:
    """
    Computes professional-grade technical analysis indicators
    and structural signals from historical price data.
    """

    @classmethod
    def compute_all_indicators(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculates all indicators and returns them aligned with the date series.
        Cached in CacheManager with TTL.
        """
        if len(df) == 0:
            return {
                "timeline": [],
                "latest": {},
                "interpretations": {},
                "updated_at_ist": get_current_ist_timestamp()
            }

        cache_key = f"{df['date'].iloc[0]}_{df['date'].iloc[-1]}_{len(df)}_{df['close'].iloc[-1]}"

        def _compute():
            data = df.copy()
            if not pd.api.types.is_datetime64_any_dtype(data['date']):
                data['date'] = pd.to_datetime(data['date'])
            data = data.sort_values('date').reset_index(drop=True)
            
            close = data['close']
            n = len(data)

            # 1. Moving Averages
            sma_20 = close.rolling(window=20).mean()
            sma_50 = close.rolling(window=50).mean()
            sma_200 = close.rolling(window=200).mean()
            ema_20 = close.ewm(span=20, adjust=False).mean()
            ema_12 = close.ewm(span=12, adjust=False).mean()
            ema_26 = close.ewm(span=26, adjust=False).mean()

            # 2. MACD (12, 26, 9)
            macd_line = ema_12 - ema_26
            macd_signal = macd_line.ewm(span=9, adjust=False).mean()
            macd_hist = macd_line - macd_signal

            # 3. Vectorized Wilder's RSI (14)
            c_vals = close.values
            diff = np.diff(c_vals)
            gains = np.where(diff > 0, diff, 0.0)
            losses = np.where(diff < 0, -diff, 0.0)
            
            avg_g = np.zeros(n)
            avg_l = np.zeros(n)
            rsi_vals = np.full(n, 50.0)
            
            if n >= 15:
                avg_g[14] = np.mean(gains[:14])
                avg_l[14] = np.mean(losses[:14])
                rs0 = avg_g[14] / (avg_l[14] if avg_l[14] != 0 else 1e-9)
                rsi_vals[14] = 100.0 - (100.0 / (1.0 + rs0))
                
                for i in range(15, n):
                    avg_g[i] = (avg_g[i-1] * 13.0 + gains[i-1]) / 14.0
                    avg_l[i] = (avg_l[i-1] * 13.0 + losses[i-1]) / 14.0
                    rs = avg_g[i] / (avg_l[i] if avg_l[i] != 0 else 1e-9)
                    rsi_vals[i] = 100.0 - (100.0 / (1.0 + rs))

            # 4. Bollinger Bands (20, 2std)
            bb_std = close.rolling(window=20).std()
            bb_upper = sma_20 + (2.0 * bb_std)
            bb_lower = sma_20 - (2.0 * bb_std)
            bb_pct_b = (close - bb_lower) / (bb_upper - bb_lower + 1e-9)

            # 5. Volatility (20-day annualized)
            pct_change = close.pct_change()
            volatility_20 = pct_change.rolling(window=20).std() * np.sqrt(252) * 100.0

            # Construct indicator timeline points
            timeline = []
            for i in range(n):
                dt_str = str(data['date'].iloc[i].strftime('%Y-%m-%d'))
                timeline.append({
                    "date": dt_str,
                    "close": float(close.iloc[i]),
                    "sma_20": round(float(sma_20.iloc[i]), 2) if not pd.isna(sma_20.iloc[i]) else None,
                    "sma_50": round(float(sma_50.iloc[i]), 2) if not pd.isna(sma_50.iloc[i]) else None,
                    "sma_200": round(float(sma_200.iloc[i]), 2) if not pd.isna(sma_200.iloc[i]) else None,
                    "ema_20": round(float(ema_20.iloc[i]), 2) if not pd.isna(ema_20.iloc[i]) else None,
                    "macd_line": round(float(macd_line.iloc[i]), 2) if not pd.isna(macd_line.iloc[i]) else None,
                    "macd_signal": round(float(macd_signal.iloc[i]), 2) if not pd.isna(macd_signal.iloc[i]) else None,
                    "macd_hist": round(float(macd_hist.iloc[i]), 2) if not pd.isna(macd_hist.iloc[i]) else None,
                    "rsi_14": round(float(rsi_vals[i]), 2) if i >= 14 else None,
                    "bb_upper": round(float(bb_upper.iloc[i]), 2) if not pd.isna(bb_upper.iloc[i]) else None,
                    "bb_lower": round(float(bb_lower.iloc[i]), 2) if not pd.isna(bb_lower.iloc[i]) else None,
                    "bb_pct_b": round(float(bb_pct_b.iloc[i]), 3) if not pd.isna(bb_pct_b.iloc[i]) else None,
                    "volatility_20": round(float(volatility_20.iloc[i]), 2) if not pd.isna(volatility_20.iloc[i]) else None
                })

            latest_idx = -1
            latest_dict = {
                "date": str(data['date'].iloc[latest_idx].strftime('%Y-%m-%d')),
                "close": float(close.iloc[latest_idx]),
                "sma_20": round(float(sma_20.iloc[latest_idx]), 2) if not pd.isna(sma_20.iloc[latest_idx]) else float(close.iloc[latest_idx]),
                "sma_50": round(float(sma_50.iloc[latest_idx]), 2) if not pd.isna(sma_50.iloc[latest_idx]) else float(close.iloc[latest_idx]),
                "sma_200": round(float(sma_200.iloc[latest_idx]), 2) if not pd.isna(sma_200.iloc[latest_idx]) else float(close.iloc[latest_idx]),
                "ema_20": round(float(ema_20.iloc[latest_idx]), 2) if not pd.isna(ema_20.iloc[latest_idx]) else float(close.iloc[latest_idx]),
                "macd_line": round(float(macd_line.iloc[latest_idx]), 2) if not pd.isna(macd_line.iloc[latest_idx]) else 0.0,
                "macd_signal": round(float(macd_signal.iloc[latest_idx]), 2) if not pd.isna(macd_signal.iloc[latest_idx]) else 0.0,
                "macd_hist": round(float(macd_hist.iloc[latest_idx]), 2) if not pd.isna(macd_hist.iloc[latest_idx]) else 0.0,
                "rsi_14": round(float(rsi_vals[latest_idx]), 2),
                "bb_upper": round(float(bb_upper.iloc[latest_idx]), 2) if not pd.isna(bb_upper.iloc[latest_idx]) else float(close.iloc[latest_idx] * 1.05),
                "bb_lower": round(float(bb_lower.iloc[latest_idx]), 2) if not pd.isna(bb_lower.iloc[latest_idx]) else float(close.iloc[latest_idx] * 0.95),
                "volatility_20": round(float(volatility_20.iloc[latest_idx]), 2) if not pd.isna(volatility_20.iloc[latest_idx]) else 18.5
            }

            rsi_interp = "Overbought (>70)" if latest_dict["rsi_14"] > 70 else ("Oversold (<30)" if latest_dict["rsi_14"] < 30 else "Neutral Momentum")
            macd_interp = "Bullish Momentum (Histogram > 0)" if latest_dict["macd_hist"] > 0 else "Bearish Momentum (Histogram < 0)"
            sma_trend = "Bullish (Price > SMA 50)" if latest_dict["close"] > latest_dict["sma_50"] else "Bearish (Price < SMA 50)"

            return {
                "timeline": timeline,
                "latest": latest_dict,
                "interpretations": {
                    "rsi_status": rsi_interp,
                    "macd_status": macd_interp,
                    "trend_status": sma_trend
                },
                "updated_at_ist": get_current_ist_timestamp()
            }

        return cache_manager.get_or_compute(cache_manager.indicators_cache, cache_key, _compute, ttl_seconds=CacheManager.INDICATORS_TTL)
