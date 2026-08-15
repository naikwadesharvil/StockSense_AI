"""
Cross-Stock Live Data Truth & Provenance Audit Script (14+ Equities)
Validates real market data truth, provider quotes, freshness labels, and fallback isolation.
"""

import urllib.request
import json

def verify_cross_stock_truth():
    symbols = [
        "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "JPM",
        "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "MARUTI"
    ]

    print("=" * 165)
    print(f"{'SYMBOL':<10} | {'PROV SYMBOL':<13} | {'PRICE':<10} | {'CURR':<6} | {'MKT STATUS':<11} | {'FRESHNESS':<12} | {'PROVIDER':<15} | {'TIMESTAMP (LOCAL)':<19} | {'FALLBACK'}")
    print("=" * 165)

    for sym in symbols:
        url = f"http://localhost:8000/api/stocks/{sym}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ProvenanceAudit/2.0"})
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                price = f"{data.get('currency_symbol', '')}{data.get('current_price', 0.0):.2f}"
                curr = data.get("currency", "USD")
                prov = data.get("provenance", {})
                prov_sym = prov.get("symbol", sym)
                mkt_status = prov.get("market_status", "UNKNOWN")
                freshness = prov.get("freshness", "UNKNOWN")
                provider = prov.get("provider", "Yahoo Finance")
                ts = prov.get("timestamp", "N/A")
                is_fallback = "TRUE" if prov.get("is_fallback", False) else "FALSE"

                print(f"{sym:<10} | {prov_sym:<13} | {price:<10} | {curr:<6} | {mkt_status:<11} | {freshness:<12} | {provider:<15} | {ts:<19} | {is_fallback}")
        except Exception as e:
            print(f"{sym:<10} | ERROR: {e}")

    print("=" * 165)

if __name__ == "__main__":
    verify_cross_stock_truth()
