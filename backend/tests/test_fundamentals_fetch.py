"""
Scratch script to inspect real Yahoo Finance fundamentals API endpoints
"""

import urllib.request
import json

def test_yahoo_fundamentals():
    tickers = ["AAPL", "RELIANCE.NS", "NVDA", "TCS.NS"]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) StockSenseAI/2.0"}
    
    for ticker in tickers:
        print(f"\n--- Fetching quoteSummary for {ticker} ---")
        url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules=defaultKeyStatistics,financialData,summaryDetail,assetProfile"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                result = data.get("quoteSummary", {}).get("result", [])[0]
                
                stats = result.get("defaultKeyStatistics", {})
                fin = result.get("financialData", {})
                summ = result.get("summaryDetail", {})
                profile = result.get("assetProfile", {})
                
                print(f"Sector: {profile.get('sector')}, Industry: {profile.get('industry')}")
                print(f"Market Cap: {summ.get('marketCap', {}).get('fmt') or summ.get('marketCap', {}).get('raw')}")
                print(f"Trailing PE: {summ.get('trailingPE', {}).get('raw')}, Forward PE: {summ.get('forwardPE', {}).get('raw')}")
                print(f"Trailing EPS: {stats.get('trailingEps', {}).get('raw')}, Forward EPS: {stats.get('forwardEps', {}).get('raw')}")
                print(f"Revenue: {fin.get('totalRevenue', {}).get('fmt') or fin.get('totalRevenue', {}).get('raw')}")
                print(f"Profit Margin: {fin.get('profitMargins', {}).get('fmt') or fin.get('profitMargins', {}).get('raw')}")
                print(f"ROE: {fin.get('returnOnEquity', {}).get('fmt') or fin.get('returnOnEquity', {}).get('raw')}")
                print(f"Total Debt: {fin.get('totalDebt', {}).get('fmt') or fin.get('totalDebt', {}).get('raw')}")
                print(f"Debt/Equity: {fin.get('debtToEquity', {}).get('raw')}")
                print(f"Div Yield: {summ.get('dividendYield', {}).get('fmt') or summ.get('dividendYield', {}).get('raw')}")
                print(f"52W High: {summ.get('fiftyTwoWeekHigh', {}).get('raw')}, 52W Low: {summ.get('fiftyTwoWeekLow', {}).get('raw')}")
                print(f"Beta: {stats.get('beta', {}).get('raw') or summ.get('beta', {}).get('raw')}")
                print(f"Shares Outstanding: {stats.get('sharesOutstanding', {}).get('fmt') or stats.get('sharesOutstanding', {}).get('raw')}")
                print(f"Enterprise Value: {stats.get('enterpriseValue', {}).get('fmt') or stats.get('enterpriseValue', {}).get('raw')}")
                print(f"Free Cash Flow: {fin.get('freeCashflow', {}).get('fmt') or fin.get('freeCashflow', {}).get('raw')}")
                print(f"Data as of / Date: {stats.get('lastFiscalYearEnd', {}).get('fmt') or fin.get('mostRecentQuarter', {}).get('fmt')}")
        except Exception as e:
            print(f"Error fetching {ticker}: {e}")

if __name__ == "__main__":
    test_yahoo_fundamentals()
