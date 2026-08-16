"""
StockSense AI - Verified Security Identity Registry & Search Engine
Provides static identity metadata, exchange mapping, country/currency definitions,
and multi-tier ranked search for US and Indian equity markets.
"""

import re
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any


@dataclass(frozen=True)
class StockSecurity:
    symbol: str
    company_name: str
    exchange: str
    country: str
    currency: str
    currency_symbol: str
    provider_symbol: str
    sector: str
    asset_type: str = "EQUITY"
    timezone: str = "America/New_York"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# Comprehensive Static Security Registry (Identity Metadata Only - Zero Stale Financials)
SECURITIES_REGISTRY: List[StockSecurity] = [
    # --- US EQUITIES (NASDAQ) ---
    StockSecurity("AAPL", "Apple Inc.", "NASDAQ", "US", "USD", "$", "AAPL", "Technology", timezone="America/New_York"),
    StockSecurity("MSFT", "Microsoft Corporation", "NASDAQ", "US", "USD", "$", "MSFT", "Technology", timezone="America/New_York"),
    StockSecurity("NVDA", "NVIDIA Corporation", "NASDAQ", "US", "USD", "$", "NVDA", "Technology", timezone="America/New_York"),
    StockSecurity("TSLA", "Tesla, Inc.", "NASDAQ", "US", "USD", "$", "TSLA", "Automobile", timezone="America/New_York"),
    StockSecurity("AMZN", "Amazon.com, Inc.", "NASDAQ", "US", "USD", "$", "AMZN", "Consumer Discretionary", timezone="America/New_York"),
    StockSecurity("GOOGL", "Alphabet Inc. (Google)", "NASDAQ", "US", "USD", "$", "GOOGL", "Technology", timezone="America/New_York"),
    StockSecurity("META", "Meta Platforms, Inc.", "NASDAQ", "US", "USD", "$", "META", "Technology", timezone="America/New_York"),
    StockSecurity("NFLX", "Netflix, Inc.", "NASDAQ", "US", "USD", "$", "NFLX", "Communication Services", timezone="America/New_York"),
    StockSecurity("AMD", "Advanced Micro Devices, Inc.", "NASDAQ", "US", "USD", "$", "AMD", "Technology", timezone="America/New_York"),
    StockSecurity("AVGO", "Broadcom Inc.", "NASDAQ", "US", "USD", "$", "AVGO", "Technology", timezone="America/New_York"),
    StockSecurity("COST", "Costco Wholesale Corporation", "NASDAQ", "US", "USD", "$", "COST", "Consumer Staples", timezone="America/New_York"),
    StockSecurity("INTC", "Intel Corporation", "NASDAQ", "US", "USD", "$", "INTC", "Technology", timezone="America/New_York"),
    StockSecurity("QCOM", "Qualcomm Incorporated", "NASDAQ", "US", "USD", "$", "QCOM", "Technology", timezone="America/New_York"),
    StockSecurity("ADBE", "Adobe Inc.", "NASDAQ", "US", "USD", "$", "ADBE", "Technology", timezone="America/New_York"),
    StockSecurity("CSCO", "Cisco Systems, Inc.", "NASDAQ", "US", "USD", "$", "CSCO", "Technology", timezone="America/New_York"),

    # --- US EQUITIES (NYSE) ---
    StockSecurity("JPM", "JPMorgan Chase & Co.", "NYSE", "US", "USD", "$", "JPM", "Banking & Finance", timezone="America/New_York"),
    StockSecurity("BAC", "Bank of America Corporation", "NYSE", "US", "USD", "$", "BAC", "Banking & Finance", timezone="America/New_York"),
    StockSecurity("V", "Visa Inc.", "NYSE", "US", "USD", "$", "V", "Finance", timezone="America/New_York"),
    StockSecurity("MA", "Mastercard Incorporated", "NYSE", "US", "USD", "$", "MA", "Finance", timezone="America/New_York"),
    StockSecurity("WMT", "Walmart Inc.", "NYSE", "US", "USD", "$", "WMT", "Consumer Staples", timezone="America/New_York"),
    StockSecurity("DIS", "The Walt Disney Company", "NYSE", "US", "USD", "$", "DIS", "Communication Services", timezone="America/New_York"),
    StockSecurity("KO", "The Coca-Cola Company", "NYSE", "US", "USD", "$", "KO", "Consumer Staples", timezone="America/New_York"),
    StockSecurity("PEP", "PepsiCo, Inc.", "NASDAQ", "US", "USD", "$", "PEP", "Consumer Staples", timezone="America/New_York"),
    StockSecurity("JNJ", "Johnson & Johnson", "NYSE", "US", "USD", "$", "JNJ", "Healthcare", timezone="America/New_York"),
    StockSecurity("PFE", "Pfizer Inc.", "NYSE", "US", "USD", "$", "PFE", "Healthcare", timezone="America/New_York"),
    StockSecurity("LLY", "Eli Lilly and Company", "NYSE", "US", "USD", "$", "LLY", "Healthcare", timezone="America/New_York"),
    StockSecurity("UNH", "UnitedHealth Group Incorporated", "NYSE", "US", "USD", "$", "UNH", "Healthcare", timezone="America/New_York"),
    StockSecurity("XOM", "Exxon Mobil Corporation", "NYSE", "US", "USD", "$", "XOM", "Energy", timezone="America/New_York"),
    StockSecurity("CVX", "Chevron Corporation", "NYSE", "US", "USD", "$", "CVX", "Energy", timezone="America/New_York"),
    StockSecurity("CAT", "Caterpillar Inc.", "NYSE", "US", "USD", "$", "CAT", "Industrials", timezone="America/New_York"),
    StockSecurity("BA", "The Boeing Company", "NYSE", "US", "USD", "$", "BA", "Industrials", timezone="America/New_York"),
    StockSecurity("IBM", "International Business Machines Corp.", "NYSE", "US", "USD", "$", "IBM", "Technology", timezone="America/New_York"),
    StockSecurity("GS", "The Goldman Sachs Group, Inc.", "NYSE", "US", "USD", "$", "GS", "Banking & Finance", timezone="America/New_York"),
    StockSecurity("HD", "The Home Depot, Inc.", "NYSE", "US", "USD", "$", "HD", "Consumer Discretionary", timezone="America/New_York"),

    # --- INDIAN EQUITIES (NSE NIFTY 50) ---
    StockSecurity("RELIANCE", "Reliance Industries Limited", "NSE", "India", "INR", "₹", "RELIANCE.NS", "Energy & Telecom", timezone="Asia/Kolkata"),
    StockSecurity("TCS", "Tata Consultancy Services Limited", "NSE", "India", "INR", "₹", "TCS.NS", "IT Services", timezone="Asia/Kolkata"),
    StockSecurity("INFY", "Infosys Limited", "NSE", "India", "INR", "₹", "INFY.NS", "IT Services", timezone="Asia/Kolkata"),
    StockSecurity("HDFCBANK", "HDFC Bank Limited", "NSE", "India", "INR", "₹", "HDFCBANK.NS", "Banking & Finance", timezone="Asia/Kolkata"),
    StockSecurity("ICICIBANK", "ICICI Bank Limited", "NSE", "India", "INR", "₹", "ICICIBANK.NS", "Banking & Finance", timezone="Asia/Kolkata"),
    StockSecurity("SBIN", "State Bank of India", "NSE", "India", "INR", "₹", "SBIN.NS", "Banking & Finance", timezone="Asia/Kolkata"),
    StockSecurity("KOTAKBANK", "Kotak Mahindra Bank Limited", "NSE", "India", "INR", "₹", "KOTAKBANK.NS", "Banking & Finance", timezone="Asia/Kolkata"),
    StockSecurity("AXISBANK", "Axis Bank Limited", "NSE", "India", "INR", "₹", "AXISBANK.NS", "Banking & Finance", timezone="Asia/Kolkata"),
    StockSecurity("BHARTIARTL", "Bharti Airtel Limited", "NSE", "India", "INR", "₹", "BHARTIARTL.NS", "Telecommunications", timezone="Asia/Kolkata"),
    StockSecurity("ITC", "ITC Limited", "NSE", "India", "INR", "₹", "ITC.NS", "Consumer Goods", timezone="Asia/Kolkata"),
    StockSecurity("HINDUNILVR", "Hindustan Unilever Limited", "NSE", "India", "INR", "₹", "HINDUNILVR.NS", "Consumer Goods", timezone="Asia/Kolkata"),
    StockSecurity("LT", "Larsen & Toubro Limited", "NSE", "India", "INR", "₹", "LT.NS", "Industrials & Infra", timezone="Asia/Kolkata"),
    StockSecurity("MARUTI", "Maruti Suzuki India Limited", "NSE", "India", "INR", "₹", "MARUTI.NS", "Automobile", timezone="Asia/Kolkata"),
    StockSecurity("TATAMOTORS", "Tata Motors Limited", "NSE", "India", "INR", "₹", "TATAMOTORS.NS", "Automobile", timezone="Asia/Kolkata"),
    StockSecurity("SUNPHARMA", "Sun Pharmaceutical Industries Ltd.", "NSE", "India", "INR", "₹", "SUNPHARMA.NS", "Healthcare", timezone="Asia/Kolkata"),
    StockSecurity("BAJFINANCE", "Bajaj Finance Limited", "NSE", "India", "INR", "₹", "BAJFINANCE.NS", "Finance", timezone="Asia/Kolkata"),
    StockSecurity("WIPRO", "Wipro Limited", "NSE", "India", "INR", "₹", "WIPRO.NS", "IT Services", timezone="Asia/Kolkata"),
    StockSecurity("TITAN", "Titan Company Limited", "NSE", "India", "INR", "₹", "TITAN.NS", "Consumer Goods", timezone="Asia/Kolkata"),
    StockSecurity("ASIANPAINT", "Asian Paints Limited", "NSE", "India", "INR", "₹", "ASIANPAINT.NS", "Consumer Goods", timezone="Asia/Kolkata"),
    StockSecurity("HCLTECH", "HCL Technologies Limited", "NSE", "India", "INR", "₹", "HCLTECH.NS", "IT Services", timezone="Asia/Kolkata"),
    StockSecurity("NTPC", "NTPC Limited", "NSE", "India", "INR", "₹", "NTPC.NS", "Power & Utilities", timezone="Asia/Kolkata"),
    StockSecurity("POWERGRID", "Power Grid Corporation of India Limited", "NSE", "India", "INR", "₹", "POWERGRID.NS", "Power & Utilities", timezone="Asia/Kolkata"),
    StockSecurity("ONGC", "Oil and Natural Gas Corporation Limited", "NSE", "India", "INR", "₹", "ONGC.NS", "Energy & Oil", timezone="Asia/Kolkata"),
    StockSecurity("COALINDIA", "Coal India Limited", "NSE", "India", "INR", "₹", "COALINDIA.NS", "Mining & Energy", timezone="Asia/Kolkata"),
    StockSecurity("M&M", "Mahindra & Mahindra Limited", "NSE", "India", "INR", "₹", "M&M.NS", "Automobile", timezone="Asia/Kolkata"),
    StockSecurity("TATASTEEL", "Tata Steel Limited", "NSE", "India", "INR", "₹", "TATASTEEL.NS", "Metals & Mining", timezone="Asia/Kolkata"),
    StockSecurity("JSWSTEEL", "JSW Steel Limited", "NSE", "India", "INR", "₹", "JSWSTEEL.NS", "Metals & Mining", timezone="Asia/Kolkata"),
    StockSecurity("ADANIENT", "Adani Enterprises Limited", "NSE", "India", "INR", "₹", "ADANIENT.NS", "Conglomerate", timezone="Asia/Kolkata"),
    StockSecurity("ADANIPORTS", "Adani Ports and Special Economic Zone Ltd.", "NSE", "India", "INR", "₹", "ADANIPORTS.NS", "Infrastructure & Ports", timezone="Asia/Kolkata"),
    StockSecurity("BAJAJFINSV", "Bajaj Finserv Limited", "NSE", "India", "INR", "₹", "BAJAJFINSV.NS", "Finance", timezone="Asia/Kolkata"),
    StockSecurity("TECHM", "Tech Mahindra Limited", "NSE", "India", "INR", "₹", "TECHM.NS", "IT Services", timezone="Asia/Kolkata"),
    StockSecurity("NESTLEIND", "Nestle India Limited", "NSE", "India", "INR", "₹", "NESTLEIND.NS", "Consumer Goods", timezone="Asia/Kolkata"),
    StockSecurity("ULTRACEMCO", "UltraTech Cement Limited", "NSE", "India", "INR", "₹", "ULTRACEMCO.NS", "Materials & Cement", timezone="Asia/Kolkata"),
    StockSecurity("GRASIM", "Grasim Industries Limited", "NSE", "India", "INR", "₹", "GRASIM.NS", "Materials & Chemicals", timezone="Asia/Kolkata"),
    StockSecurity("CIPLA", "Cipla Limited", "NSE", "India", "INR", "₹", "CIPLA.NS", "Healthcare", timezone="Asia/Kolkata"),
    StockSecurity("DRREDDY", "Dr. Reddy's Laboratories Ltd.", "NSE", "India", "INR", "₹", "DRREDDY.NS", "Healthcare", timezone="Asia/Kolkata"),
    StockSecurity("APOLLOHOSP", "Apollo Hospitals Enterprise Limited", "NSE", "India", "INR", "₹", "APOLLOHOSP.NS", "Healthcare", timezone="Asia/Kolkata"),
    StockSecurity("HEROMOTOCO", "Hero MotoCorp Limited", "NSE", "India", "INR", "₹", "HEROMOTOCO.NS", "Automobile", timezone="Asia/Kolkata"),
    StockSecurity("EICHERMOT", "Eicher Motors Limited", "NSE", "India", "INR", "₹", "EICHERMOT.NS", "Automobile", timezone="Asia/Kolkata"),
    StockSecurity("BPCL", "Bharat Petroleum Corporation Limited", "NSE", "India", "INR", "₹", "BPCL.NS", "Energy & Oil", timezone="Asia/Kolkata"),
    StockSecurity("DIVISLAB", "Divi's Laboratories Limited", "NSE", "India", "INR", "₹", "DIVISLAB.NS", "Healthcare", timezone="Asia/Kolkata"),
    StockSecurity("HINDALCO", "Hindalco Industries Limited", "NSE", "India", "INR", "₹", "HINDALCO.NS", "Metals & Mining", timezone="Asia/Kolkata"),
    StockSecurity("BRITANNIA", "Britannia Industries Limited", "NSE", "India", "INR", "₹", "BRITANNIA.NS", "Consumer Goods", timezone="Asia/Kolkata"),
    StockSecurity("TATACONSUM", "Tata Consumer Products Limited", "NSE", "India", "INR", "₹", "TATACONSUM.NS", "Consumer Goods", timezone="Asia/Kolkata"),
    StockSecurity("SBILIFE", "SBI Life Insurance Company Limited", "NSE", "India", "INR", "₹", "SBILIFE.NS", "Insurance", timezone="Asia/Kolkata"),
    StockSecurity("HDFCLIFE", "HDFC Life Insurance Company Limited", "NSE", "India", "INR", "₹", "HDFCLIFE.NS", "Insurance", timezone="Asia/Kolkata"),
    StockSecurity("BAJAJ-AUTO", "Bajaj Auto Limited", "NSE", "India", "INR", "₹", "BAJAJ-AUTO.NS", "Automobile", timezone="Asia/Kolkata"),
    StockSecurity("SHRIRAMFIN", "Shriram Finance Limited", "NSE", "India", "INR", "₹", "SHRIRAMFIN.NS", "Finance", timezone="Asia/Kolkata"),
    StockSecurity("BEL", "Bharat Electronics Limited", "NSE", "India", "INR", "₹", "BEL.NS", "Aerospace & Defence", timezone="Asia/Kolkata"),
    StockSecurity("TRENT", "Trent Limited", "NSE", "India", "INR", "₹", "TRENT.NS", "Retail & Consumer", timezone="Asia/Kolkata"),
    StockSecurity("LICI", "Life Insurance Corporation of India", "NSE", "India", "INR", "₹", "LICI.NS", "Insurance", timezone="Asia/Kolkata"),
]

# Fast Lookup Maps
_SYMBOL_MAP: Dict[str, StockSecurity] = {s.symbol.upper(): s for s in SECURITIES_REGISTRY}


class StockRegistry:
    """
    Registry management and ranked search execution engine.
    """

    @classmethod
    def get_all(cls) -> List[StockSecurity]:
        return list(SECURITIES_REGISTRY)

    @classmethod
    def get_by_symbol(cls, symbol: str) -> Optional[StockSecurity]:
        clean = symbol.strip().upper()
        if clean.endswith(".NS"):
            clean = clean[:-3]
        return _SYMBOL_MAP.get(clean)

    @classmethod
    def is_valid_symbol(cls, symbol: str) -> bool:
        return cls.get_by_symbol(symbol) is not None

    @classmethod
    def search(cls, query: str, limit: int = 12) -> List[StockSecurity]:
        q = query.strip().upper()
        if not q:
            return list(SECURITIES_REGISTRY[:limit])

        q_lower = query.strip().lower()

        # Ranking Buckets:
        # Score 100: Exact Ticker Match
        # Score 90:  Exact Company Name Match
        # Score 80:  Prefix Ticker Match
        # Score 70:  Prefix Company Name Match
        # Score 50:  Substring Ticker/Company Match
        # Score 30:  Sector Match
        scored_results: List[tuple[int, StockSecurity]] = []

        for sec in SECURITIES_REGISTRY:
            sym = sec.symbol
            comp = sec.company_name
            comp_lower = comp.lower()

            score = 0
            if sym == q:
                score = 100
            elif comp_lower == q_lower:
                score = 90
            elif sym.startswith(q):
                score = 80
            elif comp_lower.startswith(q_lower):
                score = 70
            elif q in sym or q_lower in comp_lower:
                score = 50
            elif q_lower in sec.sector.lower():
                score = 30

            if score > 0:
                scored_results.append((score, sec))

        # Sort by score descending, then alphabetically by symbol
        scored_results.sort(key=lambda item: (-item[0], item[1].symbol))
        return [sec for _, sec in scored_results[:limit]]
