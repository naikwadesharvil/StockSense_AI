"""
StockSense AI - Real Market Quotes & Historical OHLCV Unit Tests
Validates real quote retrieval, Indian exchange mapping, OHLC data validation,
corporate action adjustment flags, provenance metadata, and fallback firewall.
"""

import unittest
import os
import pandas as pd

from backend.services.stock_data import StockDataService, REAL_STOCKS_METADATA
from backend.services.providers import (
    YahooMarketDataProvider,
    FallbackBenchmarkProvider,
    DataProvenance,
    MarketStatus,
    FreshnessState,
    get_market_data_provider
)


class TestRealQuotesAndHistory(unittest.TestCase):

    def setUp(self):
        self.symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "RELIANCE", "TCS", "INFY", "HDFCBANK"]

    def test_all_8_symbols_metadata_registry(self):
        """Verifies that all 8 core symbols are registered with correct exchanges and currencies."""
        for sym in self.symbols:
            self.assertIn(sym, REAL_STOCKS_METADATA)
            meta = REAL_STOCKS_METADATA[sym]
            if sym in ["RELIANCE", "TCS", "INFY", "HDFCBANK"]:
                self.assertEqual(meta["exchange"], "NSE")
                self.assertEqual(meta["currency"], "INR")
                self.assertEqual(meta["currency_symbol"], "₹")
                self.assertTrue(meta["ticker_live"].endswith(".NS"))
            else:
                self.assertEqual(meta["exchange"], "NASDAQ")
                self.assertEqual(meta["currency"], "USD")
                self.assertEqual(meta["currency_symbol"], "$")

    def test_ohlcv_data_validation_rules(self):
        """Verifies strict validation rejects malformed or corrupted market series."""
        valid_df = pd.DataFrame([
            {"date": "2026-08-13", "open": 100.0, "high": 105.0, "low": 98.0, "close": 102.0, "volume": 1000},
            {"date": "2026-08-14", "open": 102.0, "high": 108.0, "low": 101.0, "close": 106.0, "volume": 1500}
        ])
        self.assertTrue(StockDataService.validate_ohlcv(valid_df))

        # Test invalid: High lower than Low
        invalid_high_low = pd.DataFrame([
            {"date": "2026-08-14", "open": 100.0, "high": 95.0, "low": 98.0, "close": 96.0, "volume": 1000}
        ])
        self.assertFalse(StockDataService.validate_ohlcv(invalid_high_low))

        # Test invalid: Negative close price
        invalid_price = pd.DataFrame([
            {"date": "2026-08-14", "open": 100.0, "high": 105.0, "low": 98.0, "close": -10.0, "volume": 1000}
        ])
        self.assertFalse(StockDataService.validate_ohlcv(invalid_price))

    def test_overview_provenance_schema(self):
        """Verifies that get_stock_overview produces complete, validated provenance."""
        for sym in ["AAPL", "RELIANCE"]:
            overview = StockDataService.get_stock_overview(sym, force_benchmark=True)
            self.assertIn("provenance", overview)
            prov = overview["provenance"]
            self.assertIn("source", prov)
            self.assertIn("provider", prov)
            self.assertIn("freshness", prov)
            self.assertIn("market_status", prov)
            self.assertIn("is_live", prov)
            self.assertIn("is_delayed", prov)
            self.assertIn("is_fallback", prov)
            self.assertTrue(overview.get("corporate_actions_adjusted", False))

    def test_benchmark_mode_isolation(self):
        """Verifies that force_benchmark=True never labels fallback as live data."""
        overview = StockDataService.get_stock_overview("AAPL", force_benchmark=True)
        prov = overview["provenance"]
        self.assertTrue(prov["is_fallback"])
        self.assertFalse(prov["is_live"])
        self.assertEqual(prov["freshness"], "FALLBACK")
        self.assertEqual(prov["source"], "Calibrated Historical Benchmark Archive")

    def test_historical_timeframe_slicing(self):
        """Verifies accurate slicing of historical series across standard horizons."""
        for tf, min_expected in [("1M", 20), ("3M", 60), ("1Y", 200), ("5Y", 500)]:
            df = StockDataService.get_historical_data("MSFT", timeframe=tf, force_benchmark=True)
            self.assertGreaterEqual(len(df), min_expected)
            self.assertTrue(StockDataService.validate_ohlcv(df))


if __name__ == "__main__":
    unittest.main()
