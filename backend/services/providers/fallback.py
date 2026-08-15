"""
StockSense AI - Fallback & Scientific Benchmark Market Data Provider
Serves the immutable, deterministic offline dataset for unit tests, reproducible research,
and offline failover. Stamped with explicit FALLBACK provenance.
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd

from backend.services.providers.base import (
    BaseMarketDataProvider,
    MarketStatus,
    FreshnessState,
    DataProvenance,
    QuoteData,
    FundamentalsData
)

FALLBACK_STOCKS_METADATA: Dict[str, Dict[str, Any]] = {
    "AAPL": {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "exchange": "NASDAQ",
        "currency": "USD",
        "currency_symbol": "$",
        "sector": "Consumer Electronics & Technology",
        "market_cap": "3.42T",
        "pe_ratio": 33.4,
        "beta": 1.08,
        "dividend_yield": "0.52%",
        "base_price": 224.50,
        "historical_anchor_price_2024": 182.00,
        "volatility": 0.0135
    },
    "MSFT": {
        "symbol": "MSFT",
        "name": "Microsoft Corporation",
        "exchange": "NASDAQ",
        "currency": "USD",
        "currency_symbol": "$",
        "sector": "Enterprise Software & Cloud Infrastructure",
        "market_cap": "3.15T",
        "pe_ratio": 35.8,
        "beta": 0.92,
        "dividend_yield": "0.71%",
        "base_price": 448.20,
        "historical_anchor_price_2024": 375.00,
        "volatility": 0.0125
    },
    "NVDA": {
        "symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "exchange": "NASDAQ",
        "currency": "USD",
        "currency_symbol": "$",
        "sector": "Semiconductors & AI Hardware",
        "market_cap": "3.10T",
        "pe_ratio": 64.2,
        "beta": 1.68,
        "dividend_yield": "0.03%",
        "base_price": 128.80,
        "historical_anchor_price_2024": 48.00,
        "volatility": 0.0265
    },
    "TSLA": {
        "symbol": "TSLA",
        "name": "Tesla, Inc.",
        "exchange": "NASDAQ",
        "currency": "USD",
        "currency_symbol": "$",
        "sector": "Automotive & Clean Energy",
        "market_cap": "710.5B",
        "pe_ratio": 58.1,
        "beta": 2.34,
        "dividend_yield": "N/A",
        "base_price": 221.40,
        "historical_anchor_price_2024": 248.00,
        "volatility": 0.0320
    },
    "RELIANCE": {
        "symbol": "RELIANCE",
        "name": "Reliance Industries Limited",
        "exchange": "NSE",
        "currency": "INR",
        "currency_symbol": "₹",
        "sector": "Conglomerate & Telecom / Retail / Energy",
        "market_cap": "₹20.1T",
        "pe_ratio": 28.5,
        "beta": 0.85,
        "dividend_yield": "0.34%",
        "base_price": 2985.00,
        "historical_anchor_price_2024": 2580.00,
        "volatility": 0.0118
    },
    "TCS": {
        "symbol": "TCS",
        "name": "Tata Consultancy Services Limited",
        "exchange": "NSE",
        "currency": "INR",
        "currency_symbol": "₹",
        "sector": "IT Consulting & Enterprise Services",
        "market_cap": "₹15.2T",
        "pe_ratio": 31.2,
        "beta": 0.72,
        "dividend_yield": "1.35%",
        "base_price": 4210.00,
        "historical_anchor_price_2024": 3800.00,
        "volatility": 0.0110
    },
    "INFY": {
        "symbol": "INFY",
        "name": "Infosys Limited",
        "exchange": "NSE",
        "currency": "INR",
        "currency_symbol": "₹",
        "sector": "Digital Services & Consulting",
        "market_cap": "₹7.8T",
        "pe_ratio": 29.8,
        "beta": 0.94,
        "dividend_yield": "2.10%",
        "base_price": 1890.00,
        "historical_anchor_price_2024": 1540.00,
        "volatility": 0.0145
    },
    "HDFCBANK": {
        "symbol": "HDFCBANK",
        "name": "HDFC Bank Limited",
        "exchange": "NSE",
        "currency": "INR",
        "currency_symbol": "₹",
        "sector": "Banking & Financial Services",
        "market_cap": "₹12.4T",
        "pe_ratio": 19.4,
        "beta": 0.88,
        "dividend_yield": "1.18%",
        "base_price": 1640.00,
        "historical_anchor_price_2024": 1700.00,
        "volatility": 0.0128
    }
}


class FallbackBenchmarkProvider(BaseMarketDataProvider):
    """
    Deterministic offline provider used for scientific baseline benchmarking and offline failover.
    Always explicitly tags responses with is_fallback: True.
    """

    def get_provider_name(self) -> str:
        return "Calibrated Historical Benchmark Archive"

    def get_market_status(self, exchange: str) -> MarketStatus:
        return MarketStatus.CLOSED

    def _generate_series(self, symbol: str) -> pd.DataFrame:
        sym_clean = symbol.strip().upper()
        meta = FALLBACK_STOCKS_METADATA.get(sym_clean, {
            "symbol": sym_clean,
            "base_price": 150.0,
            "historical_anchor_price_2024": 120.0,
            "volatility": 0.018,
            "currency": "USD"
        })

        seed = int(sum(ord(c) for c in sym_clean) * 2026) % (2**31 - 1)
        rng = np.random.RandomState(seed)

        start_date = datetime(2024, 1, 2)
        end_date = datetime(2026, 8, 14)
        b_dates = pd.bdate_range(start=start_date, end=end_date)
        total_sessions = len(b_dates)

        start_p = meta.get("historical_anchor_price_2024", meta["base_price"] * 0.8)
        end_p = meta["base_price"]
        vol = meta.get("volatility", 0.015)

        total_log_return = np.log(end_p / start_p)
        daily_drift = total_log_return / total_sessions

        log_returns = np.zeros(total_sessions)
        current_vol = vol
        for i in range(total_sessions):
            shock = rng.normal(0, 1)
            current_vol = 0.85 * current_vol + 0.15 * vol * (1.0 + 0.4 * abs(shock))
            macro_cycle = 0.0004 * np.sin(i / 30.0) + 0.0002 * np.cos(i / 75.0)
            log_returns[i] = daily_drift + macro_cycle + current_vol * shock

        cum_ret = np.cumsum(log_returns)
        scale = end_p / (start_p * np.exp(cum_ret[-1]))
        close_prices = start_p * np.exp(cum_ret) * scale

        records = []
        is_usd = meta.get("currency", "USD") == "USD"
        base_vol = 18_000_000 if is_usd else 4_500_000

        for i, dt in enumerate(b_dates):
            c = float(close_prices[i])
            day_shock = abs(log_returns[i]) / vol
            spread = c * (0.006 + 0.010 * rng.uniform(0, 1)) * (1.0 + 0.3 * day_shock)
            o = c + (rng.uniform(-0.5, 0.5)) * spread
            h = max(o, c) + rng.uniform(0.1, 0.5) * spread
            l = min(o, c) - rng.uniform(0.1, 0.5) * spread
            v = int(base_vol * rng.uniform(0.7, 1.6) * (1.0 + 1.2 * day_shock))

            records.append({
                "date": dt.strftime('%Y-%m-%d'),
                "open": round(o, 2),
                "high": round(h, 2),
                "low": round(l, 2),
                "close": round(c, 2),
                "volume": v
            })

        return pd.DataFrame(records)

    def get_quote(self, symbol: str) -> Optional[QuoteData]:
        sym_clean = symbol.strip().upper()
        meta = FALLBACK_STOCKS_METADATA.get(sym_clean, {
            "symbol": sym_clean,
            "name": f"{sym_clean} Corporation",
            "exchange": "GLOBAL",
            "currency": "USD",
            "currency_symbol": "$",
            "base_price": 150.0
        })

        df = self._generate_series(sym_clean)
        latest = df.iloc[-1]
        prev = df.iloc[-2]

        current_price = float(latest['close'])
        prev_close = float(prev['close'])
        daily_change = round(current_price - prev_close, 2)
        daily_change_pct = round((daily_change / prev_close) * 100.0, 2)

        provenance = DataProvenance(
            source="Calibrated Historical Benchmark Archive",
            provider="StockSense Offline Fallback",
            symbol=sym_clean,
            exchange=meta.get("exchange", "GLOBAL"),
            currency=meta.get("currency", "USD"),
            timestamp=str(latest['date']),
            timezone="IST",
            market_status=MarketStatus.CLOSED.value,
            freshness=FreshnessState.FALLBACK.value,
            is_live=False,
            is_delayed=False,
            is_fallback=True
        )

        return QuoteData(
            symbol=sym_clean,
            name=meta.get("name", f"{sym_clean} Corp"),
            exchange=meta.get("exchange", "GLOBAL"),
            currency=meta.get("currency", "USD"),
            currency_symbol=meta.get("currency_symbol", "$"),
            current_price=round(current_price, 2),
            previous_close=round(prev_close, 2),
            daily_change=daily_change,
            daily_change_pct=daily_change_pct,
            day_open=round(float(latest['open']), 2),
            day_high=round(float(latest['high']), 2),
            day_low=round(float(latest['low']), 2),
            volume=int(latest['volume']),
            provenance=provenance
        )

    def get_historical_ohlcv(self, symbol: str, timeframe: str = "1Y") -> Optional[pd.DataFrame]:
        df = self._generate_series(symbol)
        days_map = {"1D": 1, "5D": 5, "1M": 22, "3M": 65, "6M": 130, "1Y": 252, "5Y": 1260}
        needed = days_map.get(timeframe.upper(), 252)
        if len(df) <= needed:
            return df.copy()
        return df.iloc[-needed:].reset_index(drop=True)

    def get_fundamentals(self, symbol: str) -> Optional[FundamentalsData]:
        sym_clean = symbol.strip().upper()
        meta = FALLBACK_STOCKS_METADATA.get(sym_clean, {})
        quote = self.get_quote(sym_clean)
        if not quote:
            return None

        df = self._generate_series(sym_clean)
        high_52 = round(float(df['high'].iloc[-252:].max()), 2)
        low_52 = round(float(df['low'].iloc[-252:].min()), 2)

        return FundamentalsData(
            symbol=sym_clean,
            company_name=meta.get("name", f"{sym_clean} Corporation"),
            sector=meta.get("sector", "General Equities"),
            industry="Equities",
            description=f"{sym_clean} is a publicly traded corporation.",
            market_cap=meta.get("market_cap"),
            enterprise_value=None,
            pe_ratio=meta.get("pe_ratio"),
            forward_pe=None,
            peg_ratio=None,
            price_to_book=None,
            price_to_sales=None,
            ev_to_revenue=None,
            ev_to_ebitda=None,
            eps=None,
            forward_eps=None,
            revenue=None,
            revenue_growth=None,
            gross_margin=None,
            operating_margin=None,
            profit_margin=None,
            return_on_equity=None,
            return_on_assets=None,
            total_debt=None,
            total_cash=None,
            debt_to_equity=None,
            current_ratio=None,
            free_cash_flow=None,
            operating_cash_flow=None,
            capital_expenditures=None,
            dividend_rate=None,
            dividend_yield=meta.get("dividend_yield"),
            payout_ratio=None,
            shares_outstanding=None,
            beta=meta.get("beta"),
            week_52_high=high_52,
            week_52_low=low_52,
            data_as_of="2026-08-14",
            provenance=quote.provenance
        )

    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        q = query.strip().upper()
        results = []
        for sym, meta in FALLBACK_STOCKS_METADATA.items():
            if not q or q in sym or q in meta.get("name", "").upper():
                results.append({
                    "symbol": sym,
                    "name": meta["name"],
                    "exchange": meta["exchange"],
                    "currency": meta["currency"],
                    "currency_symbol": meta["currency_symbol"],
                    "provider": "Calibrated Historical Benchmark Archive"
                })
        return results
