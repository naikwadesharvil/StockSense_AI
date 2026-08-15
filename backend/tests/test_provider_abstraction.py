"""
StockSense AI - Market Data Provider Abstraction & Provenance Unit Tests
Validates interface compliance, provenance tagging, freshness classification,
fallback isolation, and factory routing.
"""

import unittest
import os
import pandas as pd

from backend.services.providers import (
    BaseMarketDataProvider,
    MarketStatus,
    FreshnessState,
    DataProvenance,
    QuoteData,
    FundamentalsData,
    YahooMarketDataProvider,
    FallbackBenchmarkProvider,
    ResilientMarketDataProvider,
    get_market_data_provider
)


class TestProviderAbstraction(unittest.TestCase):

    def test_data_provenance_schema(self):
        prov = DataProvenance(
            source="Yahoo Finance v8 API",
            provider="Yahoo Finance",
            symbol="AAPL",
            exchange="NASDAQ",
            currency="USD",
            timestamp="2026-08-14 16:00:00",
            timezone="EST",
            market_status=MarketStatus.CLOSED.value,
            freshness=FreshnessState.HISTORICAL.value,
            is_live=False,
            is_delayed=False,
            is_fallback=False
        )
        d = prov.to_dict()
        self.assertEqual(d["source"], "Yahoo Finance v8 API")
        self.assertEqual(d["provider"], "Yahoo Finance")
        self.assertEqual(d["symbol"], "AAPL")
        self.assertEqual(d["freshness"], "HISTORICAL")
        self.assertFalse(d["is_live"])
        self.assertFalse(d["is_fallback"])

    def test_fallback_provider_provenance_honesty(self):
        """Validates that fallback provider NEVER labels synthetic baseline as live."""
        fallback = FallbackBenchmarkProvider()
        quote = fallback.get_quote("AAPL")
        self.assertIsNotNone(quote)
        self.assertEqual(quote.symbol, "AAPL")
        self.assertGreater(quote.current_price, 0)
        
        # Verify strict fallback stamping
        prov = quote.provenance
        self.assertTrue(prov.is_fallback)
        self.assertFalse(prov.is_live)
        self.assertEqual(prov.freshness, FreshnessState.FALLBACK.value)
        self.assertEqual(prov.source, "Calibrated Historical Benchmark Archive")

    def test_fallback_provider_historical_series(self):
        fallback = FallbackBenchmarkProvider()
        df = fallback.get_historical_ohlcv("NVDA", timeframe="1Y")
        self.assertIsInstance(df, pd.DataFrame)
        self.assertGreater(len(df), 200)
        self.assertIn("close", df.columns)
        self.assertIn("open", df.columns)
        self.assertIn("high", df.columns)
        self.assertIn("low", df.columns)
        self.assertIn("volume", df.columns)

    def test_yahoo_provider_ticker_resolution(self):
        yahoo = YahooMarketDataProvider()
        ticker, exch, curr, curr_sym, tz = yahoo._resolve_ticker("RELIANCE")
        self.assertEqual(ticker, "RELIANCE.NS")
        self.assertEqual(exch, "NSE")
        self.assertEqual(curr, "INR")
        self.assertEqual(curr_sym, "₹")
        self.assertEqual(tz, "Asia/Kolkata")

        ticker_us, exch_us, curr_us, curr_sym_us, tz_us = yahoo._resolve_ticker("MSFT")
        self.assertEqual(ticker_us, "MSFT")
        self.assertEqual(exch_us, "NASDAQ")
        self.assertEqual(curr_us, "USD")
        self.assertEqual(curr_sym_us, "$")
        self.assertEqual(tz_us, "America/New_York")

    def test_market_status_evaluation(self):
        yahoo = YahooMarketDataProvider()
        status_nse = yahoo.get_market_status("NSE")
        self.assertIn(status_nse, [MarketStatus.OPEN, MarketStatus.CLOSED, MarketStatus.PRE_MARKET, MarketStatus.AFTER_HOURS])

        status_nasdaq = yahoo.get_market_status("NASDAQ")
        self.assertIn(status_nasdaq, [MarketStatus.OPEN, MarketStatus.CLOSED, MarketStatus.PRE_MARKET, MarketStatus.AFTER_HOURS])

    def test_factory_benchmark_isolation(self):
        """Verifies that force_benchmark=True unconditionally returns FallbackBenchmarkProvider."""
        provider = get_market_data_provider(force_benchmark=True)
        self.assertIsInstance(provider, FallbackBenchmarkProvider)

    def test_resilient_failover_wrapper(self):
        """Verifies resilient failover when primary provider encounters an error."""
        class FailingProvider(BaseMarketDataProvider):
            def get_provider_name(self) -> str:
                return "Mock Failing Provider"
            def get_quote(self, symbol: str):
                raise ConnectionError("Simulated Network Timeout")
            def get_historical_ohlcv(self, symbol: str, timeframe: str = "1Y"):
                raise ConnectionError("Simulated Network Timeout")
            def get_fundamentals(self, symbol: str):
                raise ConnectionError("Simulated Network Timeout")
            def get_market_status(self, exchange: str):
                return MarketStatus.UNKNOWN
            def search_symbols(self, query: str):
                return []

        fallback = FallbackBenchmarkProvider()
        resilient = ResilientMarketDataProvider(primary=FailingProvider(), fallback=fallback)

        # Quote should cleanly fail over to fallback without raising an exception
        quote = resilient.get_quote("AAPL")
        self.assertIsNotNone(quote)
        self.assertEqual(quote.symbol, "AAPL")
        self.assertTrue(quote.provenance.is_fallback)

        # Historical series should also cleanly fail over
        df = resilient.get_historical_ohlcv("AAPL", "1M")
        self.assertIsNotNone(df)
        self.assertGreater(len(df), 10)


if __name__ == "__main__":
    unittest.main()
