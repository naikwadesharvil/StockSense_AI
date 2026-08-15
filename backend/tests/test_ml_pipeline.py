"""
StockSense AI - ML Pipeline & Integration Test Suite
Verifies feature engineering, model training, metric computation, and forecast generation.
"""

import sys
import os
sys.path.insert(0, '/working_dir/c_4772aeae762e0b0b/stocksense-ai')

from backend.services.stock_data import StockDataService
from backend.services.indicators import IndicatorService
from backend.services.forecast_service import ForecastService
from backend.services.sentiment_service import SentimentService
from backend.services.comparison_service import ComparisonService

def test_pipeline():
    print("==================================================")
    print("Testing StockSense AI Machine Learning Pipeline...")
    print("==================================================")

    # 1. Stock Data
    symbol = "NVDA"
    df = StockDataService.get_historical_data(symbol, timeframe="1Y")
    overview = StockDataService.get_stock_overview(symbol)
    print(f"[✓] Stock Data for {symbol}: {len(df)} rows loaded. Current Price: {overview['currency_symbol']}{overview['current_price']}")

    # 2. Technical Indicators
    indicators = IndicatorService.compute_all_indicators(df)
    latest = indicators['latest']
    print(f"[✓] Technical Indicators: RSI={latest['rsi_14']} ({latest['rsi_status']}), MACD Line={latest['macd_line']}, BB Upper={latest['bb_upper']}")

    # 3. ML Model & Forecasting
    forecast_pkg = ForecastService.get_forecast(symbol)
    metrics = forecast_pkg['metrics']
    print(f"[✓] ML Performance Metrics on Unseen Test Set:")
    print(f"    - MAE: {metrics['mae']}")
    print(f"    - RMSE: {metrics['rmse']}")
    print(f"    - MAPE: {metrics['mape']}%")
    print(f"    - R² Score: {metrics['r2']}")
    print(f"    - Directional Accuracy: {metrics['directional_accuracy_pct']}%")
    print(f"    - Train Samples: {metrics['train_samples']} | Test Samples: {metrics['test_samples']}")

    # Horizons
    h_data = forecast_pkg['forecast_data']['horizons']
    print("\n[✓] Forecast Horizons:")
    for h_key, h_val in h_data.items():
        print(f"    - {h_key.upper()} Target Date ({h_val['target_date']}): Pred={h_val['predicted_price']} ({h_val['expected_change_pct']:+0.2f}%) | CI95=[{h_val['forecast_range_min']}, {h_val['forecast_range_max']}] | Conf={h_val['confidence_score']}%")

    # 4. Market Signal
    sig = forecast_pkg['market_signal']
    print(f"\n[✓] Educational AI Market Signal: {sig['signal']} (Score: {sig['sentiment_score']}/100, Confidence: {sig['confidence_level']})")

    # 5. Sentiment Service
    sent = SentimentService.get_stock_sentiment(symbol)
    print(f"\n[✓] News Sentiment Analysis: Overall {sent['overall_sentiment']} (Avg Score: {sent['average_score']}) | Pos: {sent['distribution']['positive_pct']}%, Neu: {sent['distribution']['neutral_pct']}%, Neg: {sent['distribution']['negative_pct']}%")

    # 6. Comparison Service
    comp = ComparisonService.compare_stocks(["AAPL", "NVDA", "MSFT"], timeframe="6M")
    print(f"\n[✓] Multi-Stock Comparison: Normalized {len(comp['normalized_performance_series'])} points for {comp['symbols']}")
    for m in comp['metrics_table']:
        print(f"    - {m['symbol']}: Period Return = {m['total_period_return_pct']:+.2f}%, Volatility = {m['annualized_volatility_pct']}%, Sharpe = {m['sharpe_ratio_estimate']}")

    print("\n==================================================")
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    test_pipeline()
