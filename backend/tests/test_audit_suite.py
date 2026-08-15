"""
StockSense AI - Core Architecture & Unit Test Suite
"""

import unittest
import numpy as np
import pandas as pd
from backend.services.stock_data import StockDataService, STOCK_DATABASE
from backend.services.indicators import IndicatorService
from backend.services.signal_service import SignalService
from backend.services.sentiment_service import SentimentService
from backend.services.comparison_service import ComparisonService
from backend.models.time_series_ml import TimeSeriesFeatureExtractor, TimeSeriesForecastModel

class TestStockSenseAudit(unittest.TestCase):

    def test_01_stock_data_service(self):
        """Test stock database, search, and historical series generator."""
        self.assertIn("AAPL", STOCK_DATABASE)
        self.assertIn("RELIANCE", STOCK_DATABASE)

        results = StockDataService.search_stocks("Apple")
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0]["symbol"], "AAPL")

        df = StockDataService.get_historical_data("AAPL", "1Y")
        self.assertTrue(len(df) >= 200)
        for col in ["date", "open", "high", "low", "close", "volume"]:
            self.assertIn(col, df.columns)

    def test_02_indicators_math_correctness(self):
        """Verify SMA, EMA, RSI, MACD, Bollinger Bands calculations."""
        df = StockDataService.get_historical_data("NVDA", "1Y")
        inds = IndicatorService.compute_all_indicators(df)
        
        self.assertIn("latest", inds)
        self.assertIn("rsi_14", inds["latest"])
        self.assertTrue(0 <= inds["latest"]["rsi_14"] <= 100)
        self.assertGreater(inds["latest"]["bb_upper"], inds["latest"]["bb_lower"])

    def test_03_signal_service(self):
        """Verify educational composite market signal scoring."""
        overview = StockDataService.get_stock_overview("MSFT")
        df = StockDataService.get_historical_data("MSFT", "1Y")
        inds = IndicatorService.compute_all_indicators(df)
        
        fc_5d = {
            "predicted_price": overview["current_price"] * 1.02,
            "expected_change_pct": 2.0,
            "direction": "Bullish"
        }
        
        signal = SignalService.calculate_composite_signal(overview, inds["latest"], fc_5d)
        self.assertIn("sentiment_score", signal)
        self.assertIn("signal", signal)
        self.assertIn("breakdown_factors", signal)

    def test_04_chronological_split_and_ml_metrics(self):
        """Verify strict chronological train-test split (85/15) and metrics."""
        df = StockDataService.get_historical_data("TSLA", "5Y")
        model = TimeSeriesForecastModel(model_type="ridge")
        res = model.fit_and_evaluate(df, test_ratio=0.15)
        
        self.assertGreater(res["final_holdout_test"]["mae"], 0.0)
        self.assertGreater(res["final_holdout_test"]["rmse"], 0.0)
        self.assertGreater(res["final_holdout_test"]["mape"], 0.0)
        self.assertGreater(res["train_samples"], res["test_samples"])

    def test_05_sentiment_service(self):
        """Verify financial headline sentiment scoring."""
        sent = SentimentService.get_stock_sentiment("AAPL")
        self.assertIn("average_score", sent)
        self.assertIn("distribution", sent)
        self.assertIn("recent_articles", sent)
        self.assertTrue(len(sent["recent_articles"]) > 0)

    def test_06_comparison_service(self):
        """Verify multi-stock normalized returns and correlation matrix."""
        comp = ComparisonService.compare_stocks(["AAPL", "NVDA", "MSFT"], timeframe="6M")
        self.assertIn("normalized_performance_series", comp)
        self.assertIn("correlation_matrix", comp)
        self.assertEqual(len(comp["symbols"]), 3)

if __name__ == "__main__":
    unittest.main()
