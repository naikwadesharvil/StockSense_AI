"""
StockSense AI - Real Fundamentals & Valuation Metrics Unit Tests
Validates fundamentals schema, honest N/A handling, freshness separation,
timezone localization, cache behavior, and fallback isolation.
"""

import unittest
import os
import time

from backend.services.stock_data import StockDataService
from backend.services.providers import (
    BaseMarketDataProvider,
    FundamentalsData,
    DataProvenance,
    YahooMarketDataProvider,
    FallbackBenchmarkProvider,
    get_market_data_provider
)
from backend.services.cache_service import cache_manager


class TestRealFundamentals(unittest.TestCase):

    def setUp(self):
        self.symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "RELIANCE", "TCS", "INFY", "HDFCBANK"]

    def test_fundamentals_data_schema(self):
        """Verifies that FundamentalsData dataclass properly serializes all required fields."""
        prov = DataProvenance(
            source="Yahoo Finance v10 API",
            provider="Yahoo Finance",
            symbol="AAPL",
            exchange="NASDAQ",
            currency="USD",
            timestamp="2026-08-15 01:30:01",
            timezone="America/New_York",
            market_status="CLOSED",
            freshness="HISTORICAL",
            is_live=False,
            is_delayed=False,
            is_fallback=False
        )
        fund = FundamentalsData(
            symbol="AAPL",
            company_name="Apple Inc.",
            sector="Technology",
            industry="Consumer Electronics",
            description="Apple Inc. designs, manufactures, and markets smartphones...",
            market_cap="3.42T",
            enterprise_value="3.38T",
            pe_ratio=33.4,
            forward_pe=28.5,
            peg_ratio=2.1,
            price_to_book=45.2,
            price_to_sales=8.5,
            ev_to_revenue=8.2,
            ev_to_ebitda=24.1,
            eps=6.55,
            forward_eps=7.20,
            revenue="385.6B",
            revenue_growth="4.9%",
            gross_margin="46.2%",
            operating_margin="30.7%",
            profit_margin="25.3%",
            return_on_equity="148.5%",
            return_on_assets="22.1%",
            total_debt="104.5B",
            total_cash="65.2B",
            debt_to_equity=1.45,
            current_ratio=1.05,
            free_cash_flow="108.8B",
            operating_cash_flow="118.2B",
            capital_expenditures="9.4B",
            dividend_rate=1.00,
            dividend_yield="0.52%",
            payout_ratio="15.2%",
            shares_outstanding="15.3B",
            beta=1.08,
            week_52_high=237.23,
            week_52_low=164.08,
            data_as_of="2026-06-30",
            provenance=prov
        )
        d = fund.to_dict()
        self.assertEqual(d["symbol"], "AAPL")
        self.assertEqual(d["pe_ratio"], 33.4)
        self.assertEqual(d["data_as_of"], "2026-06-30")
        self.assertEqual(d["provenance"]["timezone"], "America/New_York")
        self.assertFalse(d["provenance"]["is_fallback"])

    def test_honest_na_handling(self):
        """Verifies that missing metrics return None / N/A rather than fabricated values."""
        prov = DataProvenance(
            source="Yahoo Finance v10 API",
            provider="Yahoo Finance",
            symbol="RELIANCE",
            exchange="NSE",
            currency="INR",
            timestamp="2026-08-14 15:15:00",
            timezone="Asia/Kolkata"
        )
        fund = FundamentalsData(
            symbol="RELIANCE",
            company_name="Reliance Industries Limited",
            sector="Energy",
            industry="Oil & Gas",
            description="Reliance Industries Limited...",
            market_cap="₹17.7T",
            enterprise_value=None,
            pe_ratio=23.7,
            forward_pe=None,
            peg_ratio=None,
            price_to_book=None,
            price_to_sales=None,
            ev_to_revenue=None,
            ev_to_ebitda=None,
            eps=55.28,
            forward_eps=None,
            revenue="₹11.3T",
            revenue_growth=None,
            gross_margin=None,
            operating_margin=None,
            profit_margin="6.61%",
            return_on_equity=None,  # Honest N/A
            return_on_assets=None,
            total_debt=None,
            total_cash=None,
            debt_to_equity=36.65,
            current_ratio=None,
            free_cash_flow=None,
            operating_cash_flow=None,
            capital_expenditures=None,
            dividend_rate=None,
            dividend_yield="0.46%",
            payout_ratio=None,
            shares_outstanding=None,
            beta=0.85,
            week_52_high=1611.8,
            week_52_low=1249.8,
            data_as_of="2026-03-31",
            provenance=prov
        )
        d = fund.to_dict()
        self.assertIsNone(d["return_on_equity"])
        self.assertIsNone(d["forward_pe"])
        self.assertEqual(d["symbol"], "RELIANCE")
        self.assertEqual(d["provenance"]["timezone"], "Asia/Kolkata")

    def test_fundamentals_cache_isolation(self):
        """Verifies that fundamentals are stored and retrieved from the fundamentals_cache partition."""
        cache_manager.fundamentals_cache.clear()
        res = StockDataService.get_company_fundamentals("AAPL", force_benchmark=True)
        self.assertIsNotNone(res)
        self.assertEqual(res.get("symbol"), "AAPL")
        self.assertIn("data_as_of", res)

        # Confirm cached entry exists
        stats = cache_manager.fundamentals_cache.get_stats()
        self.assertGreater(stats["entries"], 0)

    def test_quote_and_fundamental_freshness_separation(self):
        """Verifies that quote timestamp and fundamental reporting period (data_as_of) are distinct."""
        overview = StockDataService.get_stock_overview("MSFT", force_benchmark=True)
        self.assertIn("last_updated", overview)
        self.assertIn("data_as_of", overview)
        self.assertIn("fundamentals", overview)
        funds = overview["fundamentals"]
        self.assertEqual(funds.get("symbol"), "MSFT")

    def test_timezone_resolution_us_and_india(self):
        """Verifies that US stocks resolve to America/New_York and Indian stocks resolve to Asia/Kolkata."""
        yahoo = YahooMarketDataProvider()
        _, _, _, _, tz_us = yahoo._resolve_ticker("NVDA")
        self.assertEqual(tz_us, "America/New_York")

        _, _, _, _, tz_in = yahoo._resolve_ticker("TCS")
        self.assertEqual(tz_in, "Asia/Kolkata")


if __name__ == "__main__":
    unittest.main()
