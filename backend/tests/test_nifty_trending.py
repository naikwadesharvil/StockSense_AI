"""
StockSense AI - NIFTY 50 Trending Stocks & Ranking Engine Unit Tests
Validates the official NIFTY 50 constituent universe, deterministic multi-factor trend ranking,
market open/closed status logic, provenance integrity, caching behavior, and FastAPI endpoint schemas.
"""

import unittest
import json
from datetime import datetime
from fastapi.testclient import TestClient

from backend.services.nifty_service import NiftyService, NIFTY50_CONSTITUENTS
from backend.services.stock_registry import StockRegistry
from backend.services.cache_service import cache_manager
from backend.main import app


class TestNiftyTrendingInfrastructure(unittest.TestCase):

    def setUp(self):
        # Clear cache before each test run
        cache_manager.clear_all()

    def test_01_nifty50_universe_completeness_and_validity(self):
        """Verifies exactly 50 distinct NIFTY constituents are registered with NSE mapping and INR currency."""
        constituents = NiftyService.get_all_constituents()
        self.assertEqual(len(constituents), 50, "NIFTY universe must contain exactly 50 securities")

        symbols = [c["symbol"] for c in constituents]
        self.assertEqual(len(symbols), len(set(symbols)), "All NIFTY constituent symbols must be unique")

        # Verify key blue-chips exist
        key_stocks = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "LT", "MARUTI", "SUNPHARMA", "BAJFINANCE"]
        for sym in key_stocks:
            self.assertIn(sym, symbols, f"Expected {sym} to be present in NIFTY 50 universe")
            stock_meta = NiftyService.get_constituent(sym)
            self.assertIsNotNone(stock_meta)
            self.assertEqual(stock_meta["exchange"], "NSE")
            self.assertTrue(stock_meta["provider_symbol"].endswith(".NS"))

        # Verify registry lookup
        for c in constituents:
            reg_sec = StockRegistry.get_by_symbol(c["symbol"])
            self.assertIsNotNone(reg_sec, f"Symbol {c['symbol']} must be resolvable via StockRegistry")
            self.assertEqual(reg_sec.currency, "INR")
            self.assertEqual(reg_sec.exchange, "NSE")

    def test_02_deterministic_trend_score_calculation(self):
        """Verifies deterministic trend scoring formula, bounds (0 to 100), and weightings."""
        # Test 1: Baseline neutral stock (0% move, 1.0 RVOL, 1% spread)
        score1, cat1 = NiftyService.compute_trend_score(
            daily_change_pct=0.0,
            volume=1000000,
            avg_volume_30d=1000000,
            day_high=101.0,
            day_low=100.0,
            previous_close=100.0
        )
        # ReturnScore = 0.0 (0.40 * 0 = 0.0)
        # VolumeScore = 1.0 * 40 = 40.0 (0.35 * 40 = 14.0)
        # VolatilityScore = 1.0 * 25 = 25.0 (0.25 * 25 = 6.25)
        # Total = 0.0 + 14.0 + 6.25 = 20.25 -> 20.3
        self.assertGreaterEqual(score1, 0.0)
        self.assertLessEqual(score1, 100.0)
        self.assertAlmostEqual(score1, 20.3, delta=0.5)
        self.assertEqual(cat1, "Active Trading")

        # Test 2: Huge breakout stock (+4.5% move, 3.0 RVOL, 5% spread)
        score2, cat2 = NiftyService.compute_trend_score(
            daily_change_pct=4.5,
            volume=3000000,
            avg_volume_30d=1000000,
            day_high=105.0,
            day_low=100.0,
            previous_close=100.0
        )
        self.assertGreater(score2, score1)
        self.assertLessEqual(score2, 100.0)
        self.assertEqual(cat2, "Bullish Breakout")

        # Test 3: Heavy selloff (-3.0% move, 2.5 RVOL, 4% spread)
        score3, cat3 = NiftyService.compute_trend_score(
            daily_change_pct=-3.0,
            volume=2500000,
            avg_volume_30d=1000000,
            day_high=101.0,
            day_low=97.0,
            previous_close=100.0
        )
        self.assertGreater(score3, 50.0)
        self.assertEqual(cat3, "High Volume Selloff")

        # Test 4: Extreme values stay clamped to 100.0
        score_max, _ = NiftyService.compute_trend_score(
            daily_change_pct=25.0,
            volume=50000000,
            avg_volume_30d=1000000,
            day_high=150.0,
            day_low=100.0,
            previous_close=100.0
        )
        self.assertEqual(score_max, 100.0)

    def test_03_ranking_determinism_and_sorting(self):
        """Verifies ranking sorting is strictly deterministic with ordinal rank assignments."""
        summary1 = NiftyService.get_trending_nifty50(force_refresh=True)
        ranked1 = summary1["ranked_stocks"]

        summary2 = NiftyService.get_trending_nifty50(force_refresh=True)
        ranked2 = summary2["ranked_stocks"]

        self.assertEqual(len(ranked1), 50)
        self.assertEqual(len(ranked2), 50)

        # Confirm identical ordering on independent runs
        for idx in range(len(ranked1)):
            self.assertEqual(ranked1[idx]["symbol"], ranked2[idx]["symbol"])
            self.assertEqual(ranked1[idx]["rank"], idx + 1)
            self.assertEqual(ranked1[idx]["trend_score"], ranked2[idx]["trend_score"])

        # Confirm scores are strictly in descending order
        for idx in range(len(ranked1) - 1):
            curr_score = ranked1[idx]["trend_score"]
            next_score = ranked1[idx + 1]["trend_score"]
            self.assertGreaterEqual(curr_score, next_score, f"Rank {idx+1} score {curr_score} must be >= Rank {idx+2} score {next_score}")

    def test_04_nse_market_status_and_provenance_truth(self):
        """Verifies market status calculation and honest data provenance fields."""
        is_open, status = NiftyService.is_nse_market_open()
        self.assertIn(status, ["OPEN", "CLOSED", "PRE_MARKET"])

        summary = NiftyService.get_trending_nifty50(force_refresh=True)
        self.assertEqual(summary["index"], "NIFTY 50")
        self.assertEqual(summary["market_status"], status)
        self.assertEqual(summary["is_market_open"], is_open)

        prov = summary["provenance_summary"]
        self.assertIn("provider", prov)
        self.assertIn("freshness", prov)
        if not is_open:
            self.assertFalse(prov["is_live"], "Closed market session must not be labeled as is_live=True")

        for stock in summary["ranked_stocks"]:
            self.assertIn("provenance", stock)
            p = stock["provenance"]
            self.assertEqual(p["exchange"], "NSE")
            self.assertEqual(p["currency"], "INR")
            self.assertIn("freshness", p)

    def test_05_fastapi_trending_endpoint_schema(self):
        """Verifies GET /api/stocks/trending/nifty50 returns HTTP 200 with full methodology and ranked stocks."""
        client = TestClient(app)

        # Test both prefixed and router paths
        for path in ["/api/stocks/trending/nifty50", "/stocks/trending/nifty50"]:
            res = client.get(path)
            self.assertEqual(res.status_code, 200, f"Endpoint {path} failed with {res.status_code}")
            data = res.json()

            self.assertEqual(data["index"], "NIFTY 50")
            self.assertIn("ranking_methodology", data)
            methodology = data["ranking_methodology"]
            self.assertEqual(methodology["name"], "StockSense Multi-Factor Volumetric Trend Score")
            self.assertIn("formula", methodology)
            self.assertIn("weights", methodology)

            self.assertEqual(data["total_stocks_evaluated"], 50)
            self.assertEqual(data["total_stocks_ranked"], 50)
            self.assertEqual(len(data["ranked_stocks"]), 50)

            # Check individual ranked stock structure
            first = data["ranked_stocks"][0]
            self.assertEqual(first["rank"], 1)
            self.assertIn("symbol", first)
            self.assertIn("company_name", first)
            self.assertIn("current_price", first)
            self.assertIn("daily_change_percentage", first)
            self.assertIn("relative_volume", first)
            self.assertIn("trend_score", first)
            self.assertIn("trend_category", first)

    def test_06_trending_ttl_caching_behavior(self):
        """Verifies responses are stored in cache_manager under nifty50_trending namespace."""
        partition = cache_manager.get_partition("nifty50_trending")
        self.assertIsNone(partition.get("nifty50_summary"))

        # Fetch populates cache
        res1 = NiftyService.get_trending_nifty50(force_refresh=False)
        cached = partition.get("nifty50_summary")
        self.assertIsNotNone(cached)
        self.assertEqual(cached["total_stocks_ranked"], 50)

        # Second fetch retrieves cached object directly
        res2 = NiftyService.get_trending_nifty50(force_refresh=False)
        self.assertEqual(res1["timestamp"], res2["timestamp"])

    def test_07_individual_quote_failure_resilience(self):
        """
        Verifies that when individual stock quote fetches throw exceptions or fail,
        the service isolates the failure, utilizes fallback baseline series,
        and safely returns all 50 constituents without breaking the entire response.
        """
        from unittest.mock import patch, MagicMock

        # Create a mock provider that throws on select stocks
        mock_prov = MagicMock()
        mock_prov.get_provider_name.return_value = "Flaky Mock Provider"

        def mock_get_quote(sym):
            if sym in ["RELIANCE", "TCS", "INFY"]:
                raise ConnectionError(f"Simulated network timeout for {sym}")
            # Return None or valid mock for others
            mock_quote = MagicMock()
            mock_quote.current_price = 1500.0
            mock_quote.previous_close = 1480.0
            mock_quote.daily_change = 20.0
            mock_quote.daily_change_pct = 1.35
            mock_quote.volume = 2000000
            mock_quote.day_high = 1520.0
            mock_quote.day_low = 1475.0
            mock_prov_dict = MagicMock()
            mock_prov_dict.to_dict.return_value = {
                "source": "Mock API",
                "provider": "Flaky Mock Provider",
                "symbol": sym,
                "exchange": "NSE",
                "currency": "INR",
                "timestamp": "2026-08-16T12:00:00+05:30",
                "timezone": "Asia/Kolkata",
                "market_status": "OPEN",
                "freshness": "LIVE",
                "is_live": True,
                "is_delayed": False,
                "is_fallback": False
            }
            mock_quote.provenance = mock_prov_dict
            return mock_quote

        mock_prov.get_quote.side_effect = mock_get_quote

        with patch("backend.services.nifty_service.get_market_data_provider", return_value=mock_prov):
            summary = NiftyService.get_trending_nifty50(force_refresh=True)

            self.assertEqual(summary["total_stocks_ranked"], 50)
            self.assertEqual(len(summary["ranked_stocks"]), 50)

            # Find the simulated failed stocks
            failed_stocks = [s for s in summary["ranked_stocks"] if s["symbol"] in ["RELIANCE", "TCS", "INFY"]]
            self.assertEqual(len(failed_stocks), 3)
            for s in failed_stocks:
                self.assertTrue(s["provenance"]["is_fallback"])
                self.assertIn(s["provenance"]["freshness"], ["FALLBACK", "HISTORICAL"])

            # Non-failed stocks should have processed normally
            ok_stocks = [s for s in summary["ranked_stocks"] if s["symbol"] not in ["RELIANCE", "TCS", "INFY"]]
            self.assertEqual(len(ok_stocks), 47)


if __name__ == "__main__":
    unittest.main()
