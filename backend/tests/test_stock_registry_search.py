"""
StockSense AI - Stock Registry & Security Search Unit Tests
Validates static identity registry, multi-tier ranking, US/India market mapping,
currency/exchange accuracy, and API search response structures.
"""

import unittest
from backend.services.stock_registry import StockRegistry, StockSecurity


class TestStockRegistryAndSearch(unittest.TestCase):

    def test_registry_size_and_diversity(self):
        """Verifies substantial security universe spanning US and Indian markets."""
        all_secs = StockRegistry.get_all()
        self.assertGreaterEqual(len(all_secs), 35)

        exchanges = {s.exchange for s in all_secs}
        self.assertIn("NASDAQ", exchanges)
        self.assertIn("NYSE", exchanges)
        self.assertIn("NSE", exchanges)

        countries = {s.country for s in all_secs}
        self.assertIn("US", countries)
        self.assertIn("India", countries)

    def test_original_8_stocks_registered(self):
        """Verifies all original 8 core stocks exist with valid mapping."""
        core_symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "RELIANCE", "TCS", "INFY", "HDFCBANK"]
        for sym in core_symbols:
            sec = StockRegistry.get_by_symbol(sym)
            self.assertIsNotNone(sec, f"Symbol {sym} missing from registry")
            self.assertEqual(sec.symbol, sym)

    def test_us_and_india_mapping_integrity(self):
        """Verifies US stocks have USD/America/New_York and Indian stocks have INR/Asia/Kolkata/NSE."""
        aapl = StockRegistry.get_by_symbol("AAPL")
        self.assertEqual(aapl.currency, "USD")
        self.assertEqual(aapl.exchange, "NASDAQ")
        self.assertEqual(aapl.timezone, "America/New_York")
        self.assertEqual(aapl.provider_symbol, "AAPL")

        jpm = StockRegistry.get_by_symbol("JPM")
        self.assertEqual(jpm.currency, "USD")
        self.assertEqual(jpm.exchange, "NYSE")

        reliance = StockRegistry.get_by_symbol("RELIANCE")
        self.assertEqual(reliance.currency, "INR")
        self.assertEqual(reliance.exchange, "NSE")
        self.assertEqual(reliance.timezone, "Asia/Kolkata")
        self.assertEqual(reliance.provider_symbol, "RELIANCE.NS")

    def test_exact_ticker_search_ranking(self):
        """Verifies exact ticker query ranks #1 above partial substring matches."""
        results = StockRegistry.search("AAPL")
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].symbol, "AAPL")

    def test_company_name_search(self):
        """Verifies search by full or partial company name."""
        results = StockRegistry.search("Microsoft")
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].symbol, "MSFT")

        results_ind = StockRegistry.search("Reliance")
        self.assertGreater(len(results_ind), 0)
        self.assertEqual(results_ind[0].symbol, "RELIANCE")

        results_tcs = StockRegistry.search("Tata Consultancy")
        self.assertGreater(len(results_tcs), 0)
        self.assertEqual(results_tcs[0].symbol, "TCS")

    def test_prefix_search(self):
        """Verifies prefix search resolves correctly."""
        results = StockRegistry.search("NV")
        symbols = [s.symbol for s in results]
        self.assertIn("NVDA", symbols)

        results_tes = StockRegistry.search("tes")
        self.assertEqual(results_tes[0].symbol, "TSLA")

    def test_search_ranking_hierarchy(self):
        """Verifies exact matches outrank prefix and partial matches."""
        results = StockRegistry.search("MA")
        self.assertEqual(results[0].symbol, "MA")  # Exact ticker 'MA' (Mastercard) ranked above MARUTI

    def test_invalid_symbol_handling(self):
        """Verifies invalid symbols are correctly detected."""
        self.assertFalse(StockRegistry.is_valid_symbol("NONEXISTENT_XYZ"))
        results = StockRegistry.search("NONEXISTENT_XYZ")
        self.assertEqual(len(results), 0)

    def test_expanded_universe_coverage(self):
        """Verifies additional blue-chip equities in the universe."""
        additional = ["AMZN", "GOOGL", "META", "JPM", "BAC", "V", "WMT", "JNJ", "XOM", "ICICIBANK", "SBIN", "BHARTIARTL", "LT", "MARUTI"]
        for sym in additional:
            sec = StockRegistry.get_by_symbol(sym)
            self.assertIsNotNone(sec, f"Expanded security {sym} should exist in registry")


if __name__ == "__main__":
    unittest.main()
