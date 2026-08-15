"""
StockSense AI - CORS Security and Origin Validation Unit Tests
Verifies origin-based allowlisting, development defaults, and production origin isolation.
"""

import unittest
import os
from backend.server import get_allowed_cors_origins, DEFAULT_DEV_ORIGINS

class TestCORSSecurity(unittest.TestCase):

    def setUp(self):
        self.orig_cors = os.environ.get("CORS_ALLOWED_ORIGINS")
        self.orig_env = os.environ.get("ENVIRONMENT")

    def tearDown(self):
        if self.orig_cors is not None:
            os.environ["CORS_ALLOWED_ORIGINS"] = self.orig_cors
        elif "CORS_ALLOWED_ORIGINS" in os.environ:
            del os.environ["CORS_ALLOWED_ORIGINS"]

        if self.orig_env is not None:
            os.environ["ENVIRONMENT"] = self.orig_env
        elif "ENVIRONMENT" in os.environ:
            del os.environ["ENVIRONMENT"]

    def test_default_dev_origins(self):
        """In development without explicit config, localhost dev origins are permitted."""
        os.environ["ENVIRONMENT"] = "development"
        if "CORS_ALLOWED_ORIGINS" in os.environ:
            del os.environ["CORS_ALLOWED_ORIGINS"]
        
        origins = get_allowed_cors_origins()
        self.assertIn("http://localhost:5173", origins)
        self.assertIn("http://localhost:8000", origins)
        self.assertIn("http://127.0.0.1:8000", origins)

    def test_custom_production_origins(self):
        """In production with CORS_ALLOWED_ORIGINS, only explicit domains are allowed."""
        os.environ["ENVIRONMENT"] = "production"
        os.environ["CORS_ALLOWED_ORIGINS"] = "https://app.stocksense.ai, https://dashboard.stocksense.ai"
        
        origins = get_allowed_cors_origins()
        self.assertEqual(origins, {"https://app.stocksense.ai", "https://dashboard.stocksense.ai"})
        self.assertNotIn("http://localhost:5173", origins)
        self.assertNotIn("https://malicious-site.com", origins)

    def test_unconfigured_production_is_strict(self):
        """In production without CORS_ALLOWED_ORIGINS, default set is empty (strict)."""
        os.environ["ENVIRONMENT"] = "production"
        if "CORS_ALLOWED_ORIGINS" in os.environ:
            del os.environ["CORS_ALLOWED_ORIGINS"]
        
        origins = get_allowed_cors_origins()
        self.assertEqual(origins, set())


if __name__ == "__main__":
    unittest.main()
