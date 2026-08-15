"""
StockSense AI - Phase 2H Final End-to-End Forensic Verification Script
Audits Quotes, Fundamentals, News, Provenance, and Payments across 16 Global Equities.
"""

import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000"

def audit_quotes():
    us_stocks = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META", "JPM"]
    in_stocks = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "MARUTI", "BHARTIARTL"]
    all_stocks = us_stocks + in_stocks

    print("=" * 165)
    print("1. CROSS-STOCK MARKET DATA & PROVENANCE AUDIT (16 GLOBAL EQUITIES)")
    print("=" * 165)
    print(f"{'SYMBOL':<11} | {'PROV SYMBOL':<14} | {'PRICE':<10} | {'CURR':<6} | {'MKT STATUS':<11} | {'FRESHNESS':<12} | {'PROVIDER':<15} | {'TIMESTAMP (LOCAL)':<19} | {'FALLBACK'}")
    print("-" * 165)

    for sym in all_stocks:
        url = f"{BASE_URL}/api/stocks/{sym}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AuditAgent/2.0"})
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

                print(f"{sym:<11} | {prov_sym:<14} | {price:<10} | {curr:<6} | {mkt_status:<11} | {freshness:<12} | {provider:<15} | {ts:<19} | {is_fallback}")
        except Exception as e:
            print(f"{sym:<11} | ERROR: {e}")

    print("=" * 165)


def audit_fundamentals():
    stocks = ["AAPL", "NVDA", "RELIANCE", "TCS"]
    print("\n" + "=" * 165)
    print("2. COMPANY FUNDAMENTALS & VALUATION METRICS AUDIT")
    print("=" * 165)
    print(f"{'SYMBOL':<10} | {'MKT CAP':<10} | {'PE':<7} | {'EPS':<8} | {'REVENUE':<10} | {'DIV YIELD':<10} | {'BETA':<6} | {'52W HIGH':<10} | {'52W LOW':<10} | {'DATA AS OF':<12} | {'PROVIDER'}")
    print("-" * 165)

    for sym in stocks:
        url = f"{BASE_URL}/api/stocks/{sym}/fundamentals"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AuditAgent/2.0"})
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                mkt_cap = str(data.get("market_cap") or "N/A")
                pe = f"{data.get('pe_ratio'):.1f}" if data.get("pe_ratio") is not None else "N/A"
                eps = f"{data.get('eps'):.2f}" if data.get("eps") is not None else "N/A"
                rev = str(data.get("revenue") or "N/A")
                div = str(data.get("dividend_yield") or "N/A")
                beta = f"{data.get('beta'):.2f}" if data.get("beta") is not None else "N/A"
                w52_h = f"{data.get('week_52_high'):.2f}" if data.get("week_52_high") is not None else "N/A"
                w52_l = f"{data.get('week_52_low'):.2f}" if data.get("week_52_low") is not None else "N/A"
                data_as_of = str(data.get("data_as_of") or "N/A")
                prov = data.get("provenance", {}).get("provider", "Yahoo Finance")

                print(f"{sym:<10} | {mkt_cap:<10} | {pe:<7} | {eps:<8} | {rev:<10} | {div:<10} | {beta:<6} | {w52_h:<10} | {w52_l:<10} | {data_as_of:<12} | {prov}")
        except Exception as e:
            print(f"{sym:<10} | ERROR: {e}")

    print("=" * 165)


def audit_news():
    stocks = ["AAPL", "NVDA", "RELIANCE", "TCS"]
    print("\n" + "=" * 165)
    print("3. REAL FINANCIAL NEWS & NLP SENTIMENT AUDIT")
    print("=" * 165)

    for sym in stocks:
        url = f"{BASE_URL}/api/news/{sym}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AuditAgent/2.0"})
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                score = data.get("sentiment_score", 0.0)
                label = data.get("market_bias", "Neutral")
                articles = data.get("articles") or data.get("recent_articles", [])

                print(f"\n[{sym}] Overall Sentiment: {label} (Score: {score:+.2f}) | Articles Count: {len(articles)}")
                for i, art in enumerate(articles[:2]):
                    print(f"  ({i+1}) Headline: {art.get('title')}")
                    print(f"      Publisher: {art.get('source')} | Published: {art.get('published_at')} | Polarity: {art.get('sentiment_label')}")
                    print(f"      URL: {art.get('url')[:70]}...")
        except Exception as e:
            print(f"[{sym}] ERROR: {e}")

    print("=" * 165)


def audit_payments():
    print("\n" + "=" * 165)
    print("4. SECURE PAYMENT INFRASTRUCTURE & ZERO-FAKE AUDIT")
    print("=" * 165)

    # 1. Plans
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/payments/plans")
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            plans = data.get("plans", [])
            print(f"-> Available Subscription Plans ({len(plans)}):")
            for p in plans:
                print(f"   * {p.get('display_name')} ({p.get('plan_id').upper()}): USD ${p.get('price_usd')}/mo | INR ₹{p.get('price_inr')}/mo")
    except Exception as e:
        print(f"-> Plans error: {e}")

    # 2. Status
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/payments/status")
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"-> Default User Entitlement Status: Plan='{data.get('plan_id')}', Status='{data.get('status')}', Provider='{data.get('provider')}'")
    except Exception as e:
        print(f"-> Status error: {e}")

    # 3. Checkout Unconfigured Guard
    try:
        body = json.dumps({"plan_id": "pro", "provider": "stripe"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/payments/checkout", data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"-> Checkout Response: {data}")
    except urllib.error.HTTPError as e:
        err_data = json.loads(e.read().decode('utf-8'))
        print(f"-> Unconfigured Payment Guard [HTTP {e.code}]: {err_data.get('error')} — {err_data.get('message')}")
    except Exception as e:
        print(f"-> Checkout error: {e}")

    print("=" * 165)


if __name__ == "__main__":
    audit_quotes()
    audit_fundamentals()
    audit_news()
    audit_payments()
