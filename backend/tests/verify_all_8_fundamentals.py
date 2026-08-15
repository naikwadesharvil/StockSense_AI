"""
All 8-Stock Live Fundamentals Audit & Verification Script
Queries live YahooMarketDataProvider and formats the complete verification table.
"""

import os
from backend.services.providers.yahoo import YahooMarketDataProvider

def run_fundamentals_audit():
    provider = YahooMarketDataProvider()
    symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "RELIANCE", "TCS", "INFY", "HDFCBANK"]
    
    print("=" * 165)
    print(f"{'SYMBOL':<9} | {'MCAP':<9} | {'P/E':<6} | {'FWD P/E':<7} | {'EPS':<7} | {'REVENUE':<10} | {'MARGIN':<7} | {'ROE':<7} | {'D/E':<6} | {'YIELD':<7} | {'52W H':<8} | {'52W L':<8} | {'AS OF':<10} | {'MISSING FIELDS'}")
    print("=" * 165)
    
    for sym in symbols:
        fund = provider.get_fundamentals(sym)
        if fund:
            d = fund.to_dict()
            missing = []
            if d.get("forward_pe") is None: missing.append("fwd_pe")
            if d.get("return_on_equity") is None: missing.append("roe")
            if d.get("debt_to_equity") is None: missing.append("d/e")
            if d.get("dividend_yield") is None: missing.append("div_yield")
            if d.get("revenue_growth") is None: missing.append("rev_growth")
            missing_str = ", ".join(missing) if missing else "None (Complete)"
            
            mcap = d.get("market_cap") or "N/A"
            pe = f"{d.get('pe_ratio'):.1f}" if d.get("pe_ratio") is not None else "N/A"
            fwd_pe = f"{d.get('forward_pe'):.1f}" if d.get("forward_pe") is not None else "N/A"
            eps = f"{d.get('eps'):.2f}" if d.get("eps") is not None else "N/A"
            rev = d.get("revenue") or "N/A"
            margin = d.get("profit_margin") or "N/A"
            roe = d.get("return_on_equity") or "N/A"
            de = f"{d.get('debt_to_equity'):.1f}" if d.get("debt_to_equity") is not None else "N/A"
            dy = d.get("dividend_yield") or "N/A"
            h52 = f"{d.get('week_52_high'):.1f}" if d.get("week_52_high") is not None else "N/A"
            l52 = f"{d.get('week_52_low'):.1f}" if d.get("week_52_low") is not None else "N/A"
            as_of = d.get("data_as_of") or "N/A"
            
            print(f"{sym:<9} | {mcap:<9} | {pe:<6} | {fwd_pe:<7} | {eps:<7} | {rev:<10} | {margin:<7} | {roe:<7} | {de:<6} | {dy:<7} | {h52:<8} | {l52:<8} | {as_of:<10} | {missing_str}")
        else:
            print(f"{sym:<9} | FAILED TO RETRIEVE FUNDAMENTALS")
    print("=" * 165)

if __name__ == "__main__":
    run_fundamentals_audit()
