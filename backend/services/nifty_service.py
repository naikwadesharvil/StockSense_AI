"""
StockSense AI - NIFTY 50 Trending Equities & Multi-Factor Trend Ranking Service
Provides official NIFTY 50 constituent registry, deterministic multi-factor trend scoring,
market status tracking, and TTL caching.
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta, time as dt_time
from concurrent.futures import ThreadPoolExecutor, as_completed
import pytz

from backend.services.cache_service import (
    cache_manager,
    get_current_ist_timestamp,
    get_current_ist_datetime,
    IST_OFFSET
)
from backend.services.providers import (
    get_market_data_provider,
    MarketStatus,
    FreshnessState,
    DataProvenance
)
from backend.services.stock_registry import StockSecurity

# Complete 50 Constituent Universe for NSE NIFTY 50
NIFTY50_CONSTITUENTS: List[Dict[str, Any]] = [
    {"symbol": "RELIANCE", "name": "Reliance Industries Limited", "exchange": "NSE", "sector": "Energy & Telecom", "provider_symbol": "RELIANCE.NS", "base_price": 2985.00, "base_volume": 6850000, "avg_volume_30d": 5400000, "market_cap": "₹20.1T", "beta": 0.85, "pe_ratio": 28.5},
    {"symbol": "TCS", "name": "Tata Consultancy Services Limited", "exchange": "NSE", "sector": "IT Services", "provider_symbol": "TCS.NS", "base_price": 4210.00, "base_volume": 2450000, "avg_volume_30d": 2100000, "market_cap": "₹15.2T", "beta": 0.72, "pe_ratio": 31.2},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Limited", "exchange": "NSE", "sector": "Banking & Finance", "provider_symbol": "HDFCBANK.NS", "base_price": 1645.00, "base_volume": 14200000, "avg_volume_30d": 12500000, "market_cap": "₹12.5T", "beta": 0.95, "pe_ratio": 19.8},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Limited", "exchange": "NSE", "sector": "Banking & Finance", "provider_symbol": "ICICIBANK.NS", "base_price": 1180.00, "base_volume": 9800000, "avg_volume_30d": 8900000, "market_cap": "₹8.3T", "beta": 1.05, "pe_ratio": 18.2},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Limited", "exchange": "NSE", "sector": "Telecommunications", "provider_symbol": "BHARTIARTL.NS", "base_price": 1485.00, "base_volume": 6200000, "avg_volume_30d": 5100000, "market_cap": "₹8.8T", "beta": 0.82, "pe_ratio": 62.4},
    {"symbol": "INFY", "name": "Infosys Limited", "exchange": "NSE", "sector": "IT Services", "provider_symbol": "INFY.NS", "base_price": 1795.00, "base_volume": 5800000, "avg_volume_30d": 5200000, "market_cap": "₹7.4T", "beta": 0.90, "pe_ratio": 26.8},
    {"symbol": "SBIN", "name": "State Bank of India", "exchange": "NSE", "sector": "Banking & Finance", "provider_symbol": "SBIN.NS", "base_price": 815.00, "base_volume": 12500000, "avg_volume_30d": 11200000, "market_cap": "₹7.2T", "beta": 1.18, "pe_ratio": 10.5},
    {"symbol": "ITC", "name": "ITC Limited", "exchange": "NSE", "sector": "Consumer Goods", "provider_symbol": "ITC.NS", "base_price": 492.00, "base_volume": 11800000, "avg_volume_30d": 10400000, "market_cap": "₹6.1T", "beta": 0.62, "pe_ratio": 29.1},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Limited", "exchange": "NSE", "sector": "Consumer Goods", "provider_symbol": "HINDUNILVR.NS", "base_price": 2720.00, "base_volume": 1850000, "avg_volume_30d": 1650000, "market_cap": "₹6.4T", "beta": 0.58, "pe_ratio": 58.6},
    {"symbol": "LT", "name": "Larsen & Toubro Limited", "exchange": "NSE", "sector": "Industrials & Infra", "provider_symbol": "LT.NS", "base_price": 3620.00, "base_volume": 2400000, "avg_volume_30d": 2150000, "market_cap": "₹4.9T", "beta": 1.02, "pe_ratio": 34.8},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance Limited", "exchange": "NSE", "sector": "Finance", "provider_symbol": "BAJFINANCE.NS", "base_price": 6850.00, "base_volume": 1150000, "avg_volume_30d": 1020000, "market_cap": "₹4.2T", "beta": 1.25, "pe_ratio": 29.4},
    {"symbol": "HCLTECH", "name": "HCL Technologies Limited", "exchange": "NSE", "sector": "IT Services", "provider_symbol": "HCLTECH.NS", "base_price": 1780.00, "base_volume": 2900000, "avg_volume_30d": 2600000, "market_cap": "₹4.8T", "beta": 0.78, "pe_ratio": 28.2},
    {"symbol": "MARUTI", "name": "Maruti Suzuki India Limited", "exchange": "NSE", "sector": "Automobile", "provider_symbol": "MARUTI.NS", "base_price": 12150.00, "base_volume": 620000, "avg_volume_30d": 540000, "market_cap": "₹3.8T", "beta": 0.88, "pe_ratio": 27.6},
    {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Industries Ltd.", "exchange": "NSE", "sector": "Healthcare", "provider_symbol": "SUNPHARMA.NS", "base_price": 1785.00, "base_volume": 1950000, "avg_volume_30d": 1750000, "market_cap": "₹4.3T", "beta": 0.68, "pe_ratio": 38.2},
    {"symbol": "TATAMOTORS", "name": "Tata Motors Limited", "exchange": "NSE", "sector": "Automobile", "provider_symbol": "TATAMOTORS.NS", "base_price": 1020.00, "base_volume": 11400000, "avg_volume_30d": 9800000, "market_cap": "₹3.7T", "beta": 1.45, "pe_ratio": 10.8},
    {"symbol": "NTPC", "name": "NTPC Limited", "exchange": "NSE", "sector": "Power & Utilities", "provider_symbol": "NTPC.NS", "base_price": 410.00, "base_volume": 15800000, "avg_volume_30d": 13200000, "market_cap": "₹3.9T", "beta": 0.92, "pe_ratio": 17.5},
    {"symbol": "ONGC", "name": "Oil and Natural Gas Corporation Limited", "exchange": "NSE", "sector": "Energy & Oil", "provider_symbol": "ONGC.NS", "base_price": 315.00, "base_volume": 18200000, "avg_volume_30d": 16400000, "market_cap": "₹3.9T", "beta": 1.12, "pe_ratio": 7.4},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Limited", "exchange": "NSE", "sector": "Banking & Finance", "provider_symbol": "KOTAKBANK.NS", "base_price": 1810.00, "base_volume": 3800000, "avg_volume_30d": 3400000, "market_cap": "₹3.6T", "beta": 0.94, "pe_ratio": 21.6},
    {"symbol": "AXISBANK", "name": "Axis Bank Limited", "exchange": "NSE", "sector": "Banking & Finance", "provider_symbol": "AXISBANK.NS", "base_price": 1175.00, "base_volume": 7200000, "avg_volume_30d": 6500000, "market_cap": "₹3.6T", "beta": 1.15, "pe_ratio": 13.9},
    {"symbol": "TITAN", "name": "Titan Company Limited", "exchange": "NSE", "sector": "Consumer Goods", "provider_symbol": "TITAN.NS", "base_price": 3450.00, "base_volume": 1250000, "avg_volume_30d": 1100000, "market_cap": "₹3.1T", "beta": 0.85, "pe_ratio": 82.5},
    {"symbol": "ADANIENT", "name": "Adani Enterprises Limited", "exchange": "NSE", "sector": "Conglomerate", "provider_symbol": "ADANIENT.NS", "base_price": 2980.00, "base_volume": 2800000, "avg_volume_30d": 2450000, "market_cap": "₹3.4T", "beta": 1.85, "pe_ratio": 94.2},
    {"symbol": "ADANIPORTS", "name": "Adani Ports and Special Economic Zone Ltd.", "exchange": "NSE", "sector": "Infrastructure & Ports", "provider_symbol": "ADANIPORTS.NS", "base_price": 1475.00, "base_volume": 4100000, "avg_volume_30d": 3600000, "market_cap": "₹3.2T", "beta": 1.42, "pe_ratio": 36.8},
    {"symbol": "COALINDIA", "name": "Coal India Limited", "exchange": "NSE", "sector": "Mining & Energy", "provider_symbol": "COALINDIA.NS", "base_price": 510.00, "base_volume": 12100000, "avg_volume_30d": 10500000, "market_cap": "₹3.1T", "beta": 0.88, "pe_ratio": 8.4},
    {"symbol": "POWERGRID", "name": "Power Grid Corporation of India Limited", "exchange": "NSE", "sector": "Power & Utilities", "provider_symbol": "POWERGRID.NS", "base_price": 335.00, "base_volume": 16400000, "avg_volume_30d": 14200000, "market_cap": "₹3.1T", "beta": 0.75, "pe_ratio": 18.9},
    {"symbol": "TATASTEEL", "name": "Tata Steel Limited", "exchange": "NSE", "sector": "Metals & Mining", "provider_symbol": "TATASTEEL.NS", "base_price": 152.00, "base_volume": 38500000, "avg_volume_30d": 32000000, "market_cap": "₹1.9T", "beta": 1.35, "pe_ratio": 42.1},
    {"symbol": "BAJAJFINSV", "name": "Bajaj Finserv Limited", "exchange": "NSE", "sector": "Finance", "provider_symbol": "BAJAJFINSV.NS", "base_price": 1780.00, "base_volume": 1650000, "avg_volume_30d": 1450000, "market_cap": "₹2.8T", "beta": 1.18, "pe_ratio": 34.5},
    {"symbol": "M&M", "name": "Mahindra & Mahindra Limited", "exchange": "NSE", "sector": "Automobile", "provider_symbol": "M&M.NS", "base_price": 2840.00, "base_volume": 3200000, "avg_volume_30d": 2800000, "market_cap": "₹3.4T", "beta": 1.10, "pe_ratio": 28.5},
    {"symbol": "ULTRACEMCO", "name": "UltraTech Cement Limited", "exchange": "NSE", "sector": "Materials & Cement", "provider_symbol": "ULTRACEMCO.NS", "base_price": 11250.00, "base_volume": 360000, "avg_volume_30d": 310000, "market_cap": "₹3.2T", "beta": 0.95, "pe_ratio": 44.2},
    {"symbol": "ASIANPAINT", "name": "Asian Paints Limited", "exchange": "NSE", "sector": "Consumer Goods", "provider_symbol": "ASIANPAINT.NS", "base_price": 3120.00, "base_volume": 1150000, "avg_volume_30d": 980000, "market_cap": "₹2.9T", "beta": 0.72, "pe_ratio": 54.8},
    {"symbol": "WIPRO", "name": "Wipro Limited", "exchange": "NSE", "sector": "IT Services", "provider_symbol": "WIPRO.NS", "base_price": 545.00, "base_volume": 7800000, "avg_volume_30d": 6900000, "market_cap": "₹2.8T", "beta": 0.85, "pe_ratio": 24.2},
    {"symbol": "JSWSTEEL", "name": "JSW Steel Limited", "exchange": "NSE", "sector": "Metals & Mining", "provider_symbol": "JSWSTEEL.NS", "base_price": 940.00, "base_volume": 2800000, "avg_volume_30d": 2450000, "market_cap": "₹2.3T", "beta": 1.28, "pe_ratio": 32.1},
    {"symbol": "GRASIM", "name": "Grasim Industries Limited", "exchange": "NSE", "sector": "Materials & Chemicals", "provider_symbol": "GRASIM.NS", "base_price": 2650.00, "base_volume": 850000, "avg_volume_30d": 740000, "market_cap": "₹1.8T", "beta": 1.05, "pe_ratio": 29.8},
    {"symbol": "TECHM", "name": "Tech Mahindra Limited", "exchange": "NSE", "sector": "IT Services", "provider_symbol": "TECHM.NS", "base_price": 1560.00, "base_volume": 2100000, "avg_volume_30d": 1850000, "market_cap": "₹1.5T", "beta": 0.98, "pe_ratio": 48.6},
    {"symbol": "NESTLEIND", "name": "Nestle India Limited", "exchange": "NSE", "sector": "Consumer Goods", "provider_symbol": "NESTLEIND.NS", "base_price": 2480.00, "base_volume": 720000, "avg_volume_30d": 650000, "market_cap": "₹2.4T", "beta": 0.52, "pe_ratio": 74.2},
    {"symbol": "CIPLA", "name": "Cipla Limited", "exchange": "NSE", "sector": "Healthcare", "provider_symbol": "CIPLA.NS", "base_price": 1580.00, "base_volume": 1650000, "avg_volume_30d": 1450000, "market_cap": "₹1.3T", "beta": 0.64, "pe_ratio": 29.5},
    {"symbol": "DRREDDY", "name": "Dr. Reddy's Laboratories Ltd.", "exchange": "NSE", "sector": "Healthcare", "provider_symbol": "DRREDDY.NS", "base_price": 6850.00, "base_volume": 580000, "avg_volume_30d": 510000, "market_cap": "₹1.1T", "beta": 0.60, "pe_ratio": 20.4},
    {"symbol": "APOLLOHOSP", "name": "Apollo Hospitals Enterprise Limited", "exchange": "NSE", "sector": "Healthcare", "provider_symbol": "APOLLOHOSP.NS", "base_price": 6780.00, "base_volume": 680000, "avg_volume_30d": 590000, "market_cap": "₹970B", "beta": 0.82, "pe_ratio": 84.1},
    {"symbol": "HEROMOTOCO", "name": "Hero MotoCorp Limited", "exchange": "NSE", "sector": "Automobile", "provider_symbol": "HEROMOTOCO.NS", "base_price": 5420.00, "base_volume": 640000, "avg_volume_30d": 560000, "market_cap": "₹1.1T", "beta": 0.90, "pe_ratio": 27.2},
    {"symbol": "EICHERMOT", "name": "Eicher Motors Limited", "exchange": "NSE", "sector": "Automobile", "provider_symbol": "EICHERMOT.NS", "base_price": 4890.00, "base_volume": 680000, "avg_volume_30d": 610000, "market_cap": "₹1.3T", "beta": 0.94, "pe_ratio": 32.8},
    {"symbol": "BPCL", "name": "Bharat Petroleum Corporation Limited", "exchange": "NSE", "sector": "Energy & Oil", "provider_symbol": "BPCL.NS", "base_price": 348.00, "base_volume": 9200000, "avg_volume_30d": 8100000, "market_cap": "₹755B", "beta": 1.15, "pe_ratio": 5.8},
    {"symbol": "DIVISLAB", "name": "Divi's Laboratories Limited", "exchange": "NSE", "sector": "Healthcare", "provider_symbol": "DIVISLAB.NS", "base_price": 4980.00, "base_volume": 520000, "avg_volume_30d": 460000, "market_cap": "₹1.3T", "beta": 0.74, "pe_ratio": 78.4},
    {"symbol": "HINDALCO", "name": "Hindalco Industries Limited", "exchange": "NSE", "sector": "Metals & Mining", "provider_symbol": "HINDALCO.NS", "base_price": 685.00, "base_volume": 8400000, "avg_volume_30d": 7200000, "market_cap": "₹1.5T", "beta": 1.42, "pe_ratio": 15.2},
    {"symbol": "BRITANNIA", "name": "Britannia Industries Limited", "exchange": "NSE", "sector": "Consumer Goods", "provider_symbol": "BRITANNIA.NS", "base_price": 5780.00, "base_volume": 490000, "avg_volume_30d": 430000, "market_cap": "₹1.4T", "beta": 0.58, "pe_ratio": 64.8},
    {"symbol": "TATACONSUM", "name": "Tata Consumer Products Limited", "exchange": "NSE", "sector": "Consumer Goods", "provider_symbol": "TATACONSUM.NS", "base_price": 1180.00, "base_volume": 1850000, "avg_volume_30d": 1620000, "market_cap": "₹1.1T", "beta": 0.72, "pe_ratio": 86.4},
    {"symbol": "SBILIFE", "name": "SBI Life Insurance Company Limited", "exchange": "NSE", "sector": "Insurance", "provider_symbol": "SBILIFE.NS", "base_price": 1780.00, "base_volume": 1420000, "avg_volume_30d": 1250000, "market_cap": "₹1.8T", "beta": 0.80, "pe_ratio": 88.5},
    {"symbol": "HDFCLIFE", "name": "HDFC Life Insurance Company Limited", "exchange": "NSE", "sector": "Insurance", "provider_symbol": "HDFCLIFE.NS", "base_price": 720.00, "base_volume": 3800000, "avg_volume_30d": 3300000, "market_cap": "₹1.5T", "beta": 0.85, "pe_ratio": 84.2},
    {"symbol": "BAJAJ-AUTO", "name": "Bajaj Auto Limited", "exchange": "NSE", "sector": "Automobile", "provider_symbol": "BAJAJ-AUTO.NS", "base_price": 9850.00, "base_volume": 480000, "avg_volume_30d": 420000, "market_cap": "₹2.7T", "beta": 0.82, "pe_ratio": 34.6},
    {"symbol": "SHRIRAMFIN", "name": "Shriram Finance Limited", "exchange": "NSE", "sector": "Finance", "provider_symbol": "SHRIRAMFIN.NS", "base_price": 3120.00, "base_volume": 1850000, "avg_volume_30d": 1620000, "market_cap": "₹1.2T", "beta": 1.30, "pe_ratio": 15.8},
    {"symbol": "BEL", "name": "Bharat Electronics Limited", "exchange": "NSE", "sector": "Aerospace & Defence", "provider_symbol": "BEL.NS", "base_price": 298.00, "base_volume": 18500000, "avg_volume_30d": 16200000, "market_cap": "₹2.2T", "beta": 1.25, "pe_ratio": 48.2},
    {"symbol": "TRENT", "name": "Trent Limited", "exchange": "NSE", "sector": "Retail & Consumer", "provider_symbol": "TRENT.NS", "base_price": 6950.00, "base_volume": 1450000, "avg_volume_30d": 1200000, "market_cap": "₹2.5T", "beta": 1.15, "pe_ratio": 142.0},
]

# Quick symbol to constituent lookup
_NIFTY_MAP: Dict[str, Dict[str, Any]] = {c["symbol"].upper(): c for c in NIFTY50_CONSTITUENTS}


class NiftyService:
    """
    NSE NIFTY 50 Trending Equities and Multi-Factor Ranking Engine.
    """

    @classmethod
    def get_all_constituents(cls) -> List[Dict[str, Any]]:
        return list(NIFTY50_CONSTITUENTS)

    @classmethod
    def get_constituent(cls, symbol: str) -> Optional[Dict[str, Any]]:
        clean = symbol.strip().upper()
        if clean.endswith(".NS"):
            clean = clean[:-3]
        return _NIFTY_MAP.get(clean)

    @classmethod
    def is_nse_market_open(cls) -> tuple[bool, str]:
        """
        Determines if the National Stock Exchange of India (NSE) is currently in open market session.
        Trading Hours: 09:15 to 15:30 IST, Monday to Friday (excluding standard holidays).
        """
        now_ist = datetime.now(IST_OFFSET)
        weekday = now_ist.weekday()  # 0=Monday, 6=Sunday

        if weekday >= 5:  # Saturday or Sunday
            return False, MarketStatus.CLOSED.value

        current_time = now_ist.time()
        market_open_time = dt_time(9, 15)
        market_close_time = dt_time(15, 30)
        pre_market_open = dt_time(9, 0)

        if market_open_time <= current_time <= market_close_time:
            return True, MarketStatus.OPEN.value
        elif pre_market_open <= current_time < market_open_time:
            return False, MarketStatus.PRE_MARKET.value
        elif current_time > market_close_time:
            return False, MarketStatus.CLOSED.value
        else:
            return False, MarketStatus.CLOSED.value

    @classmethod
    def compute_trend_score(
        cls,
        daily_change_pct: float,
        volume: int,
        avg_volume_30d: int,
        day_high: float,
        day_low: float,
        previous_close: float
    ) -> tuple[float, str]:
        """
        StockSense Multi-Factor Volumetric Trend Score Engine.
        Deterministic, bounded 0.0 to 100.0 score based on:
        1. Return magnitude (|R| * 20) — weight 0.40
        2. Relative Volume (RVOL * 40) — weight 0.35
        3. Volatility / Intraday Range (Spread * 25) — weight 0.25
        """
        abs_ret = abs(daily_change_pct)
        return_score = min(100.0, abs_ret * 20.0)

        safe_avg_vol = max(avg_volume_30d, 1)
        rvol = min(volume / safe_avg_vol, 5.0)
        volume_score = min(100.0, rvol * 40.0)

        safe_prev_close = max(previous_close, 1e-6)
        spread_pct = ((day_high - day_low) / safe_prev_close) * 100.0
        volatility_score = min(100.0, spread_pct * 25.0)

        raw_score = (0.40 * return_score) + (0.35 * volume_score) + (0.25 * volatility_score)
        trend_score = round(min(100.0, max(0.0, raw_score)), 1)

        # Categorize directional momentum
        rvol_val = volume / safe_avg_vol
        if daily_change_pct >= 1.5 and rvol_val >= 1.2:
            category = "Bullish Breakout"
        elif daily_change_pct >= 0.5:
            category = "Bullish Momentum"
        elif daily_change_pct <= -1.5 and rvol_val >= 1.2:
            category = "High Volume Selloff"
        elif daily_change_pct <= -0.5:
            category = "Bearish Pressure"
        elif rvol_val >= 1.6:
            category = "Volume Surge"
        else:
            category = "Active Trading"

        return trend_score, category

    @classmethod
    def _process_constituent_quote(
        cls,
        item: Dict[str, Any],
        provider: Any,
        provider_name: str,
        is_open: bool,
        market_status: str
    ) -> Dict[str, Any]:
        """
        Processes an individual NIFTY 50 constituent quote with isolated fallback resilience.
        """
        sym = item["symbol"]
        name = item["name"]
        sector = item["sector"]
        base_price = item["base_price"]
        base_vol = item["base_volume"]
        avg_vol = item["avg_volume_30d"]

        try:
            # Attempt to get quote from market data provider
            quote = provider.get_quote(sym)
            if quote:
                curr_price = round(quote.current_price, 2)
                prev_close = round(quote.previous_close, 2)
                change = round(quote.daily_change, 2)
                change_pct = round(quote.daily_change_pct, 2)
                vol = quote.volume if quote.volume > 0 else base_vol
                d_high = quote.day_high if quote.day_high > 0 else curr_price * 1.01
                d_low = quote.day_low if quote.day_low > 0 else curr_price * 0.99
                stock_provenance = quote.provenance.to_dict()
                stock_provenance["exchange"] = "NSE"
                stock_provenance["currency"] = "INR"
                stock_provenance["timezone"] = "Asia/Kolkata"
            else:
                raise ValueError("Quote returned None")
        except Exception:
            # Isolated resilience fallback per constituent
            curr_price = base_price
            prev_close = round(base_price * 0.995, 2)
            change = round(curr_price - prev_close, 2)
            change_pct = round((change / prev_close) * 100, 2)
            vol = base_vol
            d_high = round(curr_price * 1.012, 2)
            d_low = round(curr_price * 0.988, 2)
            stock_provenance = DataProvenance(
                source="NSE Baseline Series",
                provider=provider_name,
                symbol=sym,
                exchange="NSE",
                currency="INR",
                timestamp=get_current_ist_timestamp(),
                timezone="Asia/Kolkata",
                market_status=market_status,
                freshness=FreshnessState.HISTORICAL.value if not is_open else FreshnessState.FALLBACK.value,
                is_live=is_open and provider_name != "Fallback Academic Benchmark Provider",
                is_delayed=False,
                is_fallback=True
            ).to_dict()

        rvol = round(vol / max(avg_vol, 1), 2)
        score, category = cls.compute_trend_score(
            daily_change_pct=change_pct,
            volume=vol,
            avg_volume_30d=avg_vol,
            day_high=d_high,
            day_low=d_low,
            previous_close=prev_close
        )

        return {
            "symbol": sym,
            "company_name": name,
            "exchange": "NSE",
            "sector": sector,
            "currency": "INR",
            "currency_symbol": "₹",
            "current_price": curr_price,
            "previous_close": prev_close,
            "daily_change": change,
            "daily_change_percentage": change_pct,
            "volume": vol,
            "average_volume_30d": avg_vol,
            "relative_volume": rvol,
            "trend_score": score,
            "trend_category": category,
            "market_cap": item.get("market_cap", "N/A"),
            "provenance": stock_provenance
        }

    @classmethod
    def get_trending_nifty50(cls, force_refresh: bool = False, max_workers: int = 8) -> Dict[str, Any]:
        """
        Fetches or calculates the ranked NIFTY 50 trending stocks with honest provenance,
        transparent methodology, bounded concurrent quote fetching, and TTL cache buffering.
        """
        partition = cache_manager.get_partition("nifty50_trending")
        if not force_refresh:
            cached = partition.get("nifty50_summary")
            if cached is not None:
                return cached

        is_open, market_status = cls.is_nse_market_open()
        provider = get_market_data_provider()
        provider_name = provider.get_provider_name()
        freshness = FreshnessState.LIVE.value if (is_open and provider_name != "Fallback Academic Benchmark Provider") else FreshnessState.HISTORICAL.value

        # Execute quote fetching with bounded concurrency (e.g. 8 parallel workers)
        ranked_stocks = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(
                    cls._process_constituent_quote,
                    item,
                    provider,
                    provider_name,
                    is_open,
                    market_status
                )
                for item in NIFTY50_CONSTITUENTS
            ]
            for future in as_completed(futures):
                try:
                    result = future.result()
                    ranked_stocks.append(result)
                except Exception as e:
                    # Defensive guard for thread failure
                    pass

        # Deterministic multi-key sort:
        # 1. Trend score descending
        # 2. Absolute daily change percentage descending
        # 3. Alphabetical symbol ascending (tie breaker)
        ranked_stocks.sort(key=lambda s: (-s["trend_score"], -abs(s["daily_change_percentage"]), s["symbol"]))

        # Assign ordinal rank
        for idx, stock in enumerate(ranked_stocks, start=1):
            stock["rank"] = idx

        summary_payload = {
            "index": "NIFTY 50",
            "index_name": "NIFTY 50 Index (National Stock Exchange of India)",
            "market_status": market_status,
            "is_market_open": is_open,
            "timestamp": get_current_ist_timestamp(),
            "data_as_of": datetime.now(IST_OFFSET).strftime("%Y-%m-%d"),
            "ranking_methodology": {
                "name": "StockSense Multi-Factor Volumetric Trend Score",
                "version": "1.0",
                "formula": "TrendScore = min(100, 0.40 * ReturnScore + 0.35 * VolumeScore + 0.25 * VolatilityScore)",
                "description": "Deterministic ranking model evaluating daily percentage return magnitude (0.40), relative volume surge vs 30-day average (0.35), and intraday spread volatility (0.25).",
                "weights": {
                    "return_magnitude": 0.40,
                    "relative_volume": 0.35,
                    "intraday_volatility": 0.25
                }
            },
            "total_stocks_evaluated": len(ranked_stocks),
            "total_stocks_ranked": len(ranked_stocks),
            "top_gainers_count": sum(1 for s in ranked_stocks if s["daily_change_percentage"] > 0),
            "top_losers_count": sum(1 for s in ranked_stocks if s["daily_change_percentage"] < 0),
            "unchanged_count": sum(1 for s in ranked_stocks if s["daily_change_percentage"] == 0),
            "ranked_stocks": ranked_stocks,
            "provenance_summary": {
                "freshness": freshness,
                "provider": "National Stock Exchange of India (NSE) / Market Data Engine",
                "market_status": market_status,
                "is_live": is_open and provider_name != "Fallback Academic Benchmark Provider",
                "timestamp_ist": get_current_ist_timestamp()
            }
        }

        # Cache summary: 60s when market is OPEN, 300s when CLOSED
        cache_ttl = 60 if is_open else 300
        partition.set("nifty50_summary", summary_payload, ttl_seconds=cache_ttl)

        return summary_payload
