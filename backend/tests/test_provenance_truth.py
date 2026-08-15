"""
StockSense AI - Data Provenance, Freshness, & Truth Unit Tests
Validates provenance schemas, timezone integrity, market status logic,
cache transparency, and fallback firewall enforcement.
"""

import unittest
from datetime import datetime

from backend.services.providers.base import (
    DataProvenance,
    FreshnessState,
    MarketStatus,
    QuoteData,
    FundamentalsData
)
from backend.services.providers.yahoo import YahooMarketDataProvider
from backend.services.providers.fallback import FallbackBenchmarkProvider
from backend.services.stock_data import StockDataService
from backend.services.cache_service import cache_manager


class TestProvenanceAndDataTruth(unittest.TestCase):

    def test_provenance_contract_fields(self):
        """Verifies all mandatory provenance fields are present in DataProvenance."""
        prov = DataProvenance(
            source="Yahoo Finance v8 API",
            provider="Yahoo Finance",
            symbol="AAPL",
            exchange="NASDAQ",
            currency="USD",
            timestamp="2026-08-15 01:30:00",
            timezone="America/New_York",
            market_status=MarketStatus.CLOSED.value,
            freshness=FreshnessState.HISTORICAL.value,
            is_live=False,
            is_delayed=False,
            is_fallback=False
        )
        d = prov.to_dict()
        self.assertEqual(d["source"], "Yahoo Finance v8 API")
        self.assertEqual(d["provider"], "Yahoo Finance")
        self.assertEqual(d["exchange"], "NASDAQ")
        self.assertEqual(d["timezone"], "America/New_York")
        self.assertEqual(d["market_status"], "CLOSED")
        self.assertEqual(d["freshness"], "HISTORICAL")
        self.assertFalse(d["is_live"])
        self.assertFalse(d["is_fallback"])

    def test_fallback_provenance_firewall(self):
        """Verifies that fallback benchmark data is ALWAYS stamped with FALLBACK and is_fallback=True."""
        fallback = FallbackBenchmarkProvider()
        quote = fallback.get_quote("AAPL")
        self.assertIsNotNone(quote)
        prov = quote.provenance
        self.assertEqual(prov.freshness, FreshnessState.FALLBACK.value)
        self.assertTrue(prov.is_fallback)
        self.assertFalse(prov.is_live)
        self.assertIn("Benchmark", prov.source)

    def test_indian_equity_timezone_and_exchange(self):
        """Verifies Indian equities map to Asia/Kolkata and NSE."""
        provider = YahooMarketDataProvider()
        ticker, exc, curr, csym, tz = provider._resolve_ticker("RELIANCE")
        self.assertEqual(ticker, "RELIANCE.NS")
        self.assertEqual(exc, "NSE")
        self.assertEqual(curr, "INR")
        self.assertEqual(csym, "₹")
        self.assertEqual(tz, "Asia/Kolkata")

    def test_us_equity_timezone_and_exchange(self):
        """Verifies US equities map to America/New_York and NASDAQ/NYSE."""
        provider = YahooMarketDataProvider()
        ticker, exc, curr, csym, tz = provider._resolve_ticker("MSFT")
        self.assertEqual(ticker, "MSFT")
        self.assertEqual(exc, "NASDAQ")
        self.assertEqual(curr, "USD")
        self.assertEqual(tz, "America/New_York")

    def test_overview_provenance_propagation(self):
        """Verifies StockDataService.get_stock_overview propagates provenance accurately."""
        res = StockDataService.get_stock_overview("NVDA", force_benchmark=True)
        self.assertIn("provenance", res)
        prov = res["provenance"]
        self.assertTrue(prov["is_fallback"])
        self.assertEqual(prov["freshness"], "FALLBACK")

    def test_cache_preserves_provenance(self):
        """Verifies cached overview retains exact provenance and freshness."""
        cache_manager.overview_cache.clear()
        res1 = StockDataService.get_stock_overview("TSLA", force_benchmark=True)
        prov1 = res1["provenance"]

        res2 = StockDataService.get_stock_overview("TSLA", force_benchmark=True)
        prov2 = res2["provenance"]

        self.assertEqual(prov1["freshness"], prov2["freshness"])
        self.assertEqual(prov1["is_fallback"], prov2["is_fallback"])
        self.assertEqual(prov1["provider"], prov2["provider"])

    def test_data_quality_report_lineage(self):
        """Verifies get_data_quality_report includes complete lineage and zero-imputation status."""
        report = StockDataService.get_data_quality_report("AAPL")
        self.assertIn("symbol", report)
        self.assertIn("observation_count", report)
        self.assertIn("missing_values", report)
        self.assertEqual(report["missing_values"], 0)
        self.assertEqual(report["frequency"], "Daily (Split/Dividend Adjusted)")


if __name__ == "__main__":
    unittest.main()
