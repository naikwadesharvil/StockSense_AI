"""
StockSense AI V2 - High-Performance Integrated Standalone HTTP & Static Server
Provides sub-millisecond REST API responses via TTL caching and serves the
production V2 web dashboard without external web server dependencies.
"""

import os
import sys
import json
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from typing import Dict, Any, Optional

from backend.services.stock_data import StockDataService
from backend.services.stock_registry import StockRegistry
from backend.services.indicators import IndicatorService
from backend.services.forecast_service import ForecastService
from backend.services.sentiment_service import SentimentService
from backend.services.comparison_service import ComparisonService
from backend.services.cache_service import cache_manager, get_current_ist_timestamp
from backend.services.payments import (
    SUBSCRIPTION_PLANS,
    EntitlementManager,
    get_payment_provider,
    StripePaymentProvider,
    RazorpayPaymentProvider,
    SubscriptionStatus
)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")

# Configurable CORS Policy
DEFAULT_DEV_ORIGINS = {
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000"
}

def get_allowed_cors_origins() -> set:
    custom = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if custom.strip():
        return {o.strip() for o in custom.split(",") if o.strip()}
    env = os.getenv("ENVIRONMENT", "development").lower()
    if env == "production":
        return set()
    return DEFAULT_DEV_ORIGINS

class StockSenseHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        # Serve static assets from frontend/dist if present, else PROJECT_ROOT
        directory = FRONTEND_DIST if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")) else PROJECT_ROOT
        super().__init__(*args, directory=directory, **kwargs)

    def _apply_cors_headers(self):
        origin = self.headers.get("Origin", "")
        allowed_origins = get_allowed_cors_origins()

        if origin and (origin in allowed_origins or "*" in allowed_origins):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Vary", "Origin")
        elif not origin and os.getenv("ENVIRONMENT", "development").lower() != "production":
            self.send_header("Access-Control-Allow-Origin", "*")

        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Stripe-Signature, X-Razorpay-Signature")

    def _send_json(self, data: Any, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._apply_cors_headers()
        self.send_header("X-StockSense-Version", "2.0.0")
        self.send_header("X-Data-Timestamp-IST", get_current_ist_timestamp())
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self._apply_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. API Endpoints
        if path.startswith("/api/"):
            try:
                # Health Check
                if path == "/api/health":
                    return self._send_json({
                        "status": "healthy",
                        "service": "stocksense-ai-backend",
                        "version": "2.0.0",
                        "timestamp_ist": get_current_ist_timestamp(),
                        "cache_stats": cache_manager.get_all_stats()
                    })

                # Unified Security Search Endpoint
                elif path == "/api/search":
                    q = query.get("q", [""])[0]
                    results = StockRegistry.search(q)
                    return self._send_json({
                        "query": q,
                        "count": len(results),
                        "results": [s.to_dict() for s in results]
                    })

                # Stock Search (Legacy / Direct List format)
                elif path == "/api/stocks/search":
                    q = query.get("q", [""])[0]
                    results = StockRegistry.search(q)
                    return self._send_json([s.to_dict() for s in results])

                # All Supported Securities Listing
                elif path == "/api/stocks" or path == "/api/stocks/":
                    all_secs = StockRegistry.get_all()
                    return self._send_json({
                        "count": len(all_secs),
                        "securities": [s.to_dict() for s in all_secs]
                    })

                # Data Quality Lineage
                elif path.startswith("/api/data/quality/"):
                    sym = path.split("/")[-1].upper()
                    return self._send_json(StockDataService.get_data_quality_report(sym))

                # Model Benchmarking Matrix
                elif path.startswith("/api/model/comparison/"):
                    sym = path.split("/")[-1].upper()
                    return self._send_json(ForecastService.get_model_comparison(sym))

                # Stock History
                elif "/history" in path:
                    sym = path.split("/")[3].upper()
                    tf = query.get("timeframe", ["1Y"])[0]
                    df = StockDataService.get_historical_data(sym, timeframe=tf)
                    overview = StockDataService.get_stock_overview(sym)
                    return self._send_json({
                        "symbol": sym,
                        "timeframe": tf,
                        "data_points": len(df),
                        "historical_data": df.to_dict(orient="records"),
                        "corporate_actions_adjusted": True,
                        "provenance": overview.get("provenance", {}),
                        "updated_at_ist": get_current_ist_timestamp()
                    })

                # Technical Indicators
                elif "/indicators" in path:
                    sym = path.split("/")[3].upper()
                    tf = query.get("timeframe", ["1Y"])[0]
                    df = StockDataService.get_historical_data(sym, timeframe=tf)
                    return self._send_json(IndicatorService.compute_all_indicators(df))

                # Company Fundamentals
                elif "/fundamentals" in path:
                    sym = path.split("/")[3].upper()
                    return self._send_json(StockDataService.get_company_fundamentals(sym))

                # Stock Overview
                elif path.startswith("/api/stocks/"):
                    sym = path.split("/")[-1].upper()
                    return self._send_json(StockDataService.get_stock_overview(sym))

                # AI Forecast
                elif path.startswith("/api/forecast/"):
                    sym = path.split("/")[-1].upper()
                    m_type = query.get("model", ["validation_selected"])[0]
                    return self._send_json(ForecastService.get_forecast(sym, model_type=m_type))

                # Out-of-Sample Model Performance
                elif path.startswith("/api/model/performance/"):
                    sym = path.split("/")[-1].upper()
                    m_type = query.get("model", ["validation_selected"])[0]
                    return self._send_json(ForecastService.get_model_performance(sym, model_type=m_type))

                # News Sentiment
                elif path.startswith("/api/news/"):
                    sym = path.split("/")[-1].upper()
                    return self._send_json(SentimentService.get_stock_sentiment(sym))

                # Cross-Stock Comparison
                elif path == "/api/compare":
                    symbols_param = query.get("symbols", ["AAPL,NVDA"])[0]
                    tf = query.get("timeframe", ["6M"])[0]
                    sym_list = [s.strip() for s in symbols_param.split(",") if s.strip()]
                    return self._send_json(ComparisonService.compare_stocks(sym_list, timeframe=tf))

                # Subscription Plans Endpoint
                elif path == "/api/payments/plans":
                    plans = EntitlementManager.get_all_plans()
                    return self._send_json({
                        "count": len(plans),
                        "plans": [p.to_dict() for p in plans]
                    })

                # Subscription Status Endpoint
                elif path == "/api/payments/status":
                    user_id = query.get("user_id", ["default_user"])[0]
                    sub = EntitlementManager.get_user_subscription(user_id)
                    return self._send_json(sub.to_dict())

                else:
                    return self._send_json({"error": "API route not found"}, status=404)

            except Exception as e:
                return self._send_json({"error": str(e)}, status=500)

        # 2. Static Dashboard & SPA Routing
        if path == "/" or not os.path.exists(os.path.join(self.directory, path.lstrip("/"))):
            self.path = "/index.html"
            return super().do_GET()

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len) if content_len > 0 else b'{}'
        
        try:
            payload = json.loads(post_body.decode('utf-8'))
        except Exception:
            payload = {}

        if path == "/api/forecast":
            sym = payload.get("symbol", "AAPL")
            m_type = payload.get("model_type", "validation_selected")
            return self._send_json(ForecastService.get_forecast(sym, model_type=m_type))

        elif path == "/api/compare":
            symbols = payload.get("symbols", ["AAPL", "MSFT"])
            timeframe = payload.get("timeframe", "6M")
            return self._send_json(ComparisonService.compare_stocks(symbols, timeframe=timeframe))

        # Secure Payment Checkout Endpoint
        elif path == "/api/payments/checkout":
            plan_id = payload.get("plan_id", "pro").lower()
            provider_name = payload.get("provider", "stripe").lower()
            currency = payload.get("currency", "USD").upper()
            user_id = payload.get("user_id", "default_user")

            plan = EntitlementManager.get_plan(plan_id)
            if not plan:
                return self._send_json({"error": f"Invalid plan_id '{plan_id}'"}, status=400)

            provider = get_payment_provider(provider_name)
            if not provider.is_configured():
                return self._send_json({
                    "error": "PAYMENTS_NOT_CONFIGURED",
                    "message": f"Payment provider '{provider.get_provider_name()}' credentials are not configured in this environment.",
                    "is_configured": False,
                    "provider": provider.get_provider_name()
                }, status=400)

            try:
                success_url = payload.get("success_url", "http://localhost:8000/pricing?status=success")
                cancel_url = payload.get("cancel_url", "http://localhost:8000/pricing?status=canceled")
                session = provider.create_checkout_session(
                    plan=plan,
                    user_id=user_id,
                    currency=currency,
                    success_url=success_url,
                    cancel_url=cancel_url
                )
                return self._send_json({
                    "status": "success",
                    "session": session.to_dict()
                })
            except Exception as e:
                return self._send_json({"error": f"Checkout creation failed: {e}"}, status=500)

        # Stripe Webhook Endpoint (HMAC SHA256 Signature Verification)
        elif path == "/api/payments/webhooks/stripe":
            provider = StripePaymentProvider()
            headers_dict = {k: v for k, v in self.headers.items()}
            result = provider.verify_webhook(post_body, headers_dict)
            if not result.success:
                return self._send_json({"error": result.message}, status=400)

            # Idempotently update entitlement if active subscription event
            if result.status and result.subscription_id:
                EntitlementManager.update_subscription(
                    user_id="default_user",
                    plan_id="pro",
                    provider="stripe",
                    subscription_id=result.subscription_id,
                    status=result.status,
                    currency="USD",
                    amount=29.0,
                    event_id=result.event_id
                )

            return self._send_json({"received": True, "event_id": result.event_id})

        # Razorpay Webhook Endpoint (HMAC SHA256 Signature Verification)
        elif path == "/api/payments/webhooks/razorpay":
            provider = RazorpayPaymentProvider()
            headers_dict = {k: v for k, v in self.headers.items()}
            result = provider.verify_webhook(post_body, headers_dict)
            if not result.success:
                return self._send_json({"error": result.message}, status=400)

            if result.status and result.subscription_id:
                EntitlementManager.update_subscription(
                    user_id="default_user",
                    plan_id="pro",
                    provider="razorpay",
                    subscription_id=result.subscription_id,
                    status=result.status,
                    currency="INR",
                    amount=2400.0,
                    event_id=result.event_id
                )

            return self._send_json({"received": True, "event_id": result.event_id})

        return self._send_json({"error": "Endpoint not found"}, status=404)


def run_server(port: int = 8000, host: str = "0.0.0.0"):
    server_address = (host, port)
    httpd = HTTPServer(server_address, StockSenseHandler)
    print("==================================================", flush=True)
    print(f" StockSense AI V2 Running at http://{host}:{port}", flush=True)
    print(" Multi-Model Engine: Ridge, XGBoost, LSTM, Walk-Forward Validation", flush=True)
    print(" High-Performance TTL Caching Layer & IST Freshness Active", flush=True)
    print("==================================================", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Server shutting down gracefully...", flush=True)
        httpd.server_close()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    run_server(port=port, host=host)
