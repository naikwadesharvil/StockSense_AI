"""
Live Verification Script for Security Search & Expanded Universe
"""

import urllib.request
import json
import urllib.parse

def verify_live_search():
    queries = [
        "apple",
        "microsoft",
        "nvidia",
        "tesla",
        "reliance",
        "tcs",
        "infosys",
        "hdfc bank",
        "jpmorgan",
        "amazon",
        "maruti",
        "tata motors",
        "icici",
        "google",
        "state bank"
    ]

    print("=" * 140)
    print(f"{'QUERY':<14} | {'SYMBOL':<10} | {'COMPANY NAME':<38} | {'EXCHANGE':<9} | {'COUNTRY':<8} | {'CURRENCY':<9} | {'PROVIDER SYMBOL'}")
    print("=" * 140)

    for q in queries:
        url = f"http://localhost:8000/api/search?q={urllib.parse.quote(q)}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "SearchVerification/2.0"})
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = data.get("results", [])
                if results:
                    top = results[0]
                    sym = top.get("symbol", "N/A")
                    comp = top.get("company_name", "N/A")
                    exc = top.get("exchange", "N/A")
                    cntry = top.get("country", "N/A")
                    curr = f"{top.get('currency', 'N/A')} ({top.get('currency_symbol', '')})"
                    prov = top.get("provider_symbol", "N/A")
                    print(f"{q:<14} | {sym:<10} | {comp:<38} | {exc:<9} | {cntry:<8} | {curr:<9} | {prov}")
                else:
                    print(f"{q:<14} | NO RESULTS")
        except Exception as e:
            print(f"{q:<14} | ERROR: {e}")

    print("=" * 140)

if __name__ == "__main__":
    verify_live_search()
