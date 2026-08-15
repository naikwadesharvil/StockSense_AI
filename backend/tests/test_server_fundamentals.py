"""
Test local server endpoints for fundamentals
"""

import urllib.request
import json

def test_api_fundamentals():
    endpoints = [
        "/api/health",
        "/api/stocks/AAPL/fundamentals",
        "/api/stocks/RELIANCE/fundamentals",
        "/api/stocks/AAPL"
    ]
    
    for ep in endpoints:
        url = f"http://localhost:8000{ep}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "VerificationScript/2.0"})
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print(f"[HTTP {resp.status}] {ep}")
                if "pe_ratio" in data:
                    print(f"  -> Symbol: {data.get('symbol')}, P/E: {data.get('pe_ratio')}, Market Cap: {data.get('market_cap')}, As Of: {data.get('data_as_of')}")
                elif "status" in data:
                    print(f"  -> Status: {data.get('status')}")
                elif "fundamentals" in data:
                    f = data.get("fundamentals", {})
                    print(f"  -> Overview enriched with fundamentals: P/E={data.get('pe_ratio')}, MCAP={data.get('market_cap')}, Rev={f.get('revenue')}")
        except Exception as e:
            print(f"[ERROR] {ep}: {e}")

if __name__ == "__main__":
    test_api_fundamentals()
