"""
StockSense AI - Vercel Serverless Integration & Routing Tests
Verifies that api/index.py imports the FastAPI app cleanly, all /api/* routes are
properly exposed, vercel.json is valid, and the academic baseline remains unregressed.
"""

import unittest
import json
import os
import sys

# Ensure repository root is on sys.path
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from fastapi.testclient import TestClient
from api.index import app
from backend.models.time_series_ml import TimeSeriesForecastModel

EXPECTED_HOLDOUT_RMSE = {
    "AAPL": 3.88,
    "MSFT": 8.22,
    "NVDA": 5.65,
    "TSLA": 16.99,
    "RELIANCE": 39.09,
    "TCS": 65.35,
    "INFY": 38.39,
    "HDFCBANK": 26.36,
}

client = TestClient(app)



class TestVercelServerlessDeployment(unittest.TestCase):

    def test_01_vercel_entrypoint_app_export(self):
        """Verify that api/index.py exports a valid FastAPI application instance."""
        from fastapi import FastAPI
        self.assertIsInstance(app, FastAPI)
        self.assertEqual(app.title, "StockSense AI")
        self.assertEqual(app.version, "2.0.0")

    def test_02_health_endpoint_via_fastapi(self):
        """Verify that /api/health responds with HTTP 200 and healthy payload."""
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertEqual(data.get("service"), "stocksense-ai-backend")
        self.assertIn("timestamp_ist", data)
        self.assertIn("cache_stats", data)

    def test_03_unified_search_endpoint(self):
        """Verify that /api/search returns ranked security results."""
        response = client.get("/api/search?q=Apple")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data.get("count", 0), 0)
        self.assertEqual(data["results"][0]["symbol"], "AAPL")

    def test_04_stock_overview_endpoint(self):
        """Verify that /api/stocks/AAPL returns structured overview with provenance."""
        response = client.get("/api/stocks/AAPL")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("symbol"), "AAPL")
        self.assertIn("current_price", data)
        self.assertIn("provenance", data)

    def test_05_stock_forecast_endpoint(self):
        """Verify that /api/forecast/AAPL returns valid multi-model trajectory."""
        response = client.get("/api/forecast/AAPL?model=ridge")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("symbol"), "AAPL")
        self.assertIn("forecast_data", data)
        self.assertIn("validation_selected_model", data)
        self.assertIn("forecast_trajectory", data["forecast_data"])

    def test_06_payments_plans_endpoint(self):
        """Verify that /api/payments/plans returns all subscription tiers."""
        response = client.get("/api/payments/plans")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("count"), 3)
        plan_ids = [p["plan_id"] for p in data["plans"]]
        self.assertIn("free", plan_ids)
        self.assertIn("pro", plan_ids)
        self.assertIn("premium", plan_ids)

    def test_07_payments_unconfigured_safety(self):
        """Verify that /api/payments/checkout returns PAYMENTS_NOT_CONFIGURED when keys absent."""
        response = client.post("/api/payments/checkout", json={
            "plan_id": "pro",
            "provider": "stripe",
            "currency": "USD"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("error"), "PAYMENTS_NOT_CONFIGURED")
        self.assertFalse(data.get("is_configured"))

    def test_08_vercel_json_configuration(self):
        """Verify that vercel.json exists, is valid JSON, and contains SPA rewrites."""
        vercel_json_path = os.path.join(REPO_ROOT, "vercel.json")
        self.assertTrue(os.path.exists(vercel_json_path))
        with open(vercel_json_path, "r", encoding="utf-8") as f:
            config = json.load(f)
        self.assertIn("rewrites", config)
        self.assertEqual(config.get("outputDirectory"), "frontend/dist")
        sources = [r["source"] for r in config["rewrites"]]
        self.assertIn("/((?!api/|assets/).*)", sources)

    def test_09_academic_benchmark_invariance(self):
        """Verify that academic holdout RMSE metrics remain 100% invariant."""
        from backend.services.forecast_service import ForecastService
        symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "RELIANCE", "TCS", "INFY", "HDFCBANK"]
        for sym in symbols:
            comparison = ForecastService.get_model_comparison(sym)
            holdout_rmse = comparison["validation_selected_model"]["final_holdout_rmse"]
            expected = EXPECTED_HOLDOUT_RMSE.get(sym)
            self.assertIsNotNone(expected)
            self.assertEqual(
                round(holdout_rmse, 2),
                round(expected, 2),
                f"Academic regression detected on {sym}: expected {expected}, got {holdout_rmse}"
            )




if __name__ == "__main__":
    unittest.main()
