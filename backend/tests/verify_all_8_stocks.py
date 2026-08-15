"""
Real Market Data Provider Query Verification Script
Queries all 8 symbols via YahooMarketDataProvider and prints the structured report table.
"""

import os
import json
from backend.services.providers.yahoo import YahooMarketDataProvider

def run_live_audit():
    provider = YahooMarketDataProvider()
    symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "RELIANCE", "TCS", "INFY", "HDFCBANK"]
    
    print("=" * 140)
    print(f"{'SYMBOL':<10} | {'TICKER':<12} | {'PRICE':<10} | {'PREV CLOSE':<10} | {'CHG %':<8} | {'CURR':<5} | {'EXCH':<8} | {'TIMESTAMP':<20} | {'FRESHNESS':<12} | {'STATUS':<10} | {'FALLBACK?':<10} | {'SOURCE'}")
    print("=" * 140)
    
    for sym in symbols:
        quote = provider.get_quote(sym)
        if quote:
            ticker, exch, curr, curr_sym = provider._resolve_ticker(sym)
            prov = quote.provenance
            print(f"{quote.symbol:<10} | {ticker:<12} | {quote.currency_symbol}{quote.current_price:<9.2f} | {quote.currency_symbol}{quote.previous_close:<9.2f} | {quote.daily_change_pct:>+6.2f}% | {quote.currency:<5} | {quote.exchange:<8} | {prov.timestamp:<20} | {prov.freshness:<12} | {prov.market_status:<10} | {str(prov.is_fallback):<10} | {prov.source}")
        else:
            print(f"{sym:<10} | FAILED TO FETCH QUOTE")
    print("=" * 140)

if __name__ == "__main__":
    run_live_audit()
