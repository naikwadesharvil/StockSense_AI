"""
StockSense AI - Runtime Endpoints & Provenance Verification
"""

import urllib.request
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    endpoints = [
        ("/api/health", "Health Status"),
        ("/api/search?q=apple", "Security Search"),
        ("/api/stocks/AAPL", "AAPL Quote"),
        ("/api/stocks/NVDA", "NVDA Quote"),
        ("/api/stocks/RELIANCE", "RELIANCE Quote"),
        ("/api/stocks/TCS", "TCS Quote"),
        ("/api/forecast/AAPL", "AAPL ML Forecast"),
        ("/api/news/AAPL", "AAPL News & Sentiment"),
        ("/api/payments/status", "User Subscription Status")
    ]

    print("=" * 100)
    print("RUNTIME API ENDPOINT & PROVENANCE AUDIT")
    print("=" * 100)

    for ep, desc in endpoints:
        url = f"{BASE_URL}{ep}"
        try:
            timeout_sec = 35.0 if "forecast" in ep else 10.0
            req = urllib.request.Request(url, headers={"User-Agent": "AuditAgent/2.0", "Origin": "http://localhost:5173"})
            with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                prov = data.get("provenance", {})
                prov_str = f"Prov: {prov.get('provider', 'N/A')} [{prov.get('freshness', 'N/A')}]" if prov else ""
                cors_origin = resp.headers.get("Access-Control-Allow-Origin", "None")
                print(f"[OK 200] {desc:<25} | Path: {ep:<25} | CORS: {cors_origin:<22} | {prov_str}")
        except Exception as e:
            print(f"[ERR]   {desc:<25} | Path: {ep:<25} | {e}")

    print("=" * 100)

if __name__ == "__main__":
    test_endpoints()
