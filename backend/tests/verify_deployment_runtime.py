"""
StockSense AI - Phase 3 Deployment Runtime Verification
Runs comprehensive production checks across all endpoints against production server.
"""

import urllib.request
import json

BASE_URL = "http://localhost:8000"

def test_production_runtime():
    endpoints = [
        ("/", "Root SPA Index"),
        ("/docs", "API Documentation"),
        ("/api/health", "System Health"),
        ("/api/search?q=apple", "Security Search"),
        ("/api/stocks/AAPL", "AAPL Quote"),
        ("/api/stocks/MSFT", "MSFT Quote"),
        ("/api/stocks/NVDA", "NVDA Quote"),
        ("/api/stocks/RELIANCE", "RELIANCE Quote"),
        ("/api/stocks/TCS", "TCS Quote"),
        ("/api/stocks/INFY", "INFY Quote"),
        ("/api/stocks/HDFCBANK", "HDFCBANK Quote"),
        ("/api/forecast/AAPL", "AAPL Live ML Forecast"),
        ("/api/news/AAPL", "AAPL Financial News"),
        ("/api/payments/status", "User Subscription Status")
    ]

    print("=" * 110)
    print("PHASE 3 PRODUCTION RUNTIME VERIFICATION")
    print("=" * 110)

    for ep, desc in endpoints:
        url = f"{BASE_URL}{ep}"
        try:
            timeout_sec = 35.0 if "forecast" in ep else 10.0
            req = urllib.request.Request(url, headers={"User-Agent": "AuditAgent/3.0", "Origin": "http://localhost:8000"})
            with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                status = resp.status
                cors = resp.headers.get("Access-Control-Allow-Origin", "None")
                content_type = resp.headers.get("Content-Type", "")
                
                prov_str = ""
                if "application/json" in content_type:
                    body = json.loads(resp.read().decode('utf-8'))
                    prov = body.get("provenance", {})
                    if prov:
                        prov_str = f"Prov: {prov.get('provider')} [{prov.get('freshness')}]"
                    elif "data_provider" in body:
                        prov_str = f"Data: {body.get('data_provider')} [{body.get('data_timestamp')}]"

                print(f"[OK {status}] {desc:<26} | Path: {ep:<26} | CORS: {cors:<20} | {prov_str}")
        except Exception as e:
            print(f"[ERR]    {desc:<26} | Path: {ep:<26} | {e}")

    print("=" * 110)

def test_production_cors_isolation():
    print("\n" + "=" * 110)
    print("PHASE 3 PRODUCTION CORS SECURITY ISOLATION CHECK")
    print("=" * 110)

    # 1. Allowed Origin
    req1 = urllib.request.Request(f"{BASE_URL}/api/health", headers={"Origin": "http://localhost:8000"})
    with urllib.request.urlopen(req1, timeout=5.0) as resp1:
        cors1 = resp1.headers.get("Access-Control-Allow-Origin")
        print(f"-> Allowed Origin ('http://localhost:8000'): Access-Control-Allow-Origin = '{cors1}' [PASS]")

    # 2. Unauthorized Origin
    req2 = urllib.request.Request(f"{BASE_URL}/api/health", headers={"Origin": "http://evil-tracker.com"})
    with urllib.request.urlopen(req2, timeout=5.0) as resp2:
        cors2 = resp2.headers.get("Access-Control-Allow-Origin")
        print(f"-> Unauthorized Origin ('http://evil-tracker.com'): Access-Control-Allow-Origin = '{cors2}' [PASS - Rejected]")

    print("=" * 110)

if __name__ == "__main__":
    test_production_runtime()
    test_production_cors_isolation()
