"""
Test Yahoo Crumb/Cookie mechanism for quoteSummary fundamentals
"""

import urllib.request
import urllib.parse
import http.cookiejar
import json

def test_crumb_flow():
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print("Step 1: Getting cookie from fc.yahoo.com or finance.yahoo.com...")
    try:
        req1 = urllib.request.Request("https://fc.yahoo.com", headers=headers)
        opener.open(req1, timeout=5.0)
    except urllib.error.HTTPError as e:
        # fc.yahoo.com redirects with 302/404 or sets cookie
        print(f"  Cookie set on error: {e}")
    except Exception as e:
        print(f"  Req 1 error: {e}")
        
    print("Step 2: Fetching crumb token...")
    crumb = None
    try:
        req2 = urllib.request.Request("https://query2.finance.yahoo.com/v1/test/getcrumb", headers=headers)
        with opener.open(req2, timeout=5.0) as resp:
            crumb = resp.read().decode('utf-8')
            print(f"  Crumb obtained: {crumb}")
    except Exception as e:
        print(f"  Crumb error: {e}")

    if not crumb:
        # Alternative crumb source
        try:
            req1b = urllib.request.Request("https://finance.yahoo.com/quote/AAPL", headers=headers)
            opener.open(req1b, timeout=5.0)
            req2b = urllib.request.Request("https://query1.finance.yahoo.com/v1/test/getcrumb", headers=headers)
            with opener.open(req2b, timeout=5.0) as resp:
                crumb = resp.read().decode('utf-8')
                print(f"  Alternative crumb obtained: {crumb}")
        except Exception as e:
            print(f"  Alternative crumb error: {e}")

    if crumb:
        for ticker in ["AAPL", "RELIANCE.NS", "NVDA", "TCS.NS"]:
            url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?crumb={crumb}&modules=defaultKeyStatistics,financialData,summaryDetail,assetProfile"
            try:
                req3 = urllib.request.Request(url, headers=headers)
                with opener.open(req3, timeout=5.0) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    res = data.get("quoteSummary", {}).get("result", [])[0]
                    stats = res.get("defaultKeyStatistics", {})
                    fin = res.get("financialData", {})
                    summ = res.get("summaryDetail", {})
                    profile = res.get("assetProfile", {})
                    
                    print(f"\n[{ticker}] Success!")
                    print(f"  Sector: {profile.get('sector')}, Industry: {profile.get('industry')}")
                    print(f"  Market Cap: {summ.get('marketCap', {}).get('fmt')}")
                    print(f"  Trailing PE: {summ.get('trailingPE', {}).get('raw')}, Forward PE: {summ.get('forwardPE', {}).get('raw')}")
                    print(f"  EPS (trailing): {stats.get('trailingEps', {}).get('raw')}")
                    print(f"  Revenue: {fin.get('totalRevenue', {}).get('fmt')}")
                    print(f"  Profit Margin: {fin.get('profitMargins', {}).get('fmt')}")
                    print(f"  ROE: {fin.get('returnOnEquity', {}).get('fmt')}")
                    print(f"  Debt/Equity: {fin.get('debtToEquity', {}).get('raw')}")
                    print(f"  Dividend Yield: {summ.get('dividendYield', {}).get('fmt')}")
                    print(f"  52W High: {summ.get('fiftyTwoWeekHigh', {}).get('raw')}, 52W Low: {summ.get('fiftyTwoWeekLow', {}).get('raw')}")
            except Exception as e:
                print(f"[{ticker}] QuoteSummary error: {e}")

if __name__ == "__main__":
    test_crumb_flow()
