"""
Local API Endpoint Runtime Verification Script
"""

import urllib.request
import json

def test_api():
    base_url = "http://localhost:8000"
    endpoints = [
        "/api/health",
        "/api/stocks/AAPL",
        "/api/stocks/RELIANCE",
        "/api/stocks/NVDA"
    ]
    
    for ep in endpoints:
        url = f"{base_url}{ep}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "VerificationScript/1.0"})
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                print(f"[HTTP {resp.status}] {ep}")
                if "provenance" in data:
                    print(f"  -> Symbol: {data.get('symbol')}, Price: {data.get('currency_symbol', '')}{data.get('current_price')}")
                    print(f"  -> Provenance: {data.get('provenance')}")
                elif "status" in data:
                    print(f"  -> Status: {data.get('status')}")
        except Exception as e:
            print(f"[ERROR] {ep}: {e}")

if __name__ == "__main__":
    test_api()
