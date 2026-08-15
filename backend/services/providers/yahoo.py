"""
StockSense AI - Yahoo Finance Market Data Provider (Production Upgraded)
Implements real-time / 15-minute delayed market data querying, company fundamentals,
exchange session tracking, timezone localization, and honest freshness determination.
"""

import json
import urllib.request
import urllib.parse
import http.cookiejar
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import pandas as pd

from backend.services.providers.base import (
    BaseMarketDataProvider,
    MarketStatus,
    FreshnessState,
    DataProvenance,
    QuoteData,
    FundamentalsData
)
from backend.services.stock_registry import StockRegistry

TICKER_EXCHANGE_MAP = {
    "AAPL": ("AAPL", "NASDAQ", "USD", "$", "America/New_York"),
    "MSFT": ("MSFT", "NASDAQ", "USD", "$", "America/New_York"),
    "NVDA": ("NVDA", "NASDAQ", "USD", "$", "America/New_York"),
    "TSLA": ("TSLA", "NASDAQ", "USD", "$", "America/New_York"),
    "AMZN": ("AMZN", "NASDAQ", "USD", "$", "America/New_York"),
    "GOOGL": ("GOOGL", "NASDAQ", "USD", "$", "America/New_York"),
    "META": ("META", "NASDAQ", "USD", "$", "America/New_York"),
    "NFLX": ("NFLX", "NASDAQ", "USD", "$", "America/New_York"),
    "AMD": ("AMD", "NASDAQ", "USD", "$", "America/New_York"),
    "AVGO": ("AVGO", "NASDAQ", "USD", "$", "America/New_York"),
    "JPM": ("JPM", "NYSE", "USD", "$", "America/New_York"),
    "V": ("V", "NYSE", "USD", "$", "America/New_York"),
    "MA": ("MA", "NYSE", "USD", "$", "America/New_York"),
    "WMT": ("WMT", "NYSE", "USD", "$", "America/New_York"),
    "COST": ("COST", "NASDAQ", "USD", "$", "America/New_York"),
    "KO": ("KO", "NYSE", "USD", "$", "America/New_York"),
    "RELIANCE": ("RELIANCE.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "TCS": ("TCS.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "INFY": ("INFY.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "HDFCBANK": ("HDFCBANK.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "ICICIBANK": ("ICICIBANK.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "SBIN": ("SBIN.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "ITC": ("ITC.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "BHARTIARTL": ("BHARTIARTL.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "LT": ("LT.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "AXISBANK": ("AXISBANK.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "KOTAKBANK": ("KOTAKBANK.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "HINDUNILVR": ("HINDUNILVR.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "MARUTI": ("MARUTI.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "TATAMOTORS": ("TATAMOTORS.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
    "SUNPHARMA": ("SUNPHARMA.NS", "NSE", "INR", "₹", "Asia/Kolkata"),
}


class YahooMarketDataProvider(BaseMarketDataProvider):
    """
    Live/Delayed market data provider integrating with Yahoo Finance v8 and v10 APIs.
    Features robust session handling, real fundamentals parsing, and honest N/A handling.
    """

    def __init__(self, timeout_seconds: float = 6.0):
        self.timeout = timeout_seconds
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        self._cookie_jar = http.cookiejar.CookieJar()
        self._opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self._cookie_jar))
        self._crumb: Optional[str] = None

    def get_provider_name(self) -> str:
        return "Yahoo Finance"

    def _resolve_ticker(self, symbol: str) -> tuple[str, str, str, str, str]:
        """Resolves symbol into (ticker, exchange, currency, currency_symbol, timezone)."""
        sym_clean = symbol.strip().upper()
        sec = StockRegistry.get_by_symbol(sym_clean)
        if sec:
            return (sec.provider_symbol, sec.exchange, sec.currency, sec.currency_symbol, sec.timezone)
        if sym_clean in TICKER_EXCHANGE_MAP:
            return TICKER_EXCHANGE_MAP[sym_clean]
        if sym_clean.endswith(".NS") or sym_clean.endswith(".BO"):
            return (sym_clean, "NSE" if sym_clean.endswith(".NS") else "BSE", "INR", "₹", "Asia/Kolkata")
        return (sym_clean, "US Market", "USD", "$", "America/New_York")

    def _get_crumb(self) -> Optional[str]:
        if self._crumb:
            return self._crumb

        headers = {"User-Agent": self.user_agent}
        try:
            req1 = urllib.request.Request("https://fc.yahoo.com", headers=headers)
            self._opener.open(req1, timeout=self.timeout)
        except Exception:
            pass

        try:
            req2 = urllib.request.Request("https://query2.finance.yahoo.com/v1/test/getcrumb", headers=headers)
            with self._opener.open(req2, timeout=self.timeout) as resp:
                self._crumb = resp.read().decode('utf-8').strip()
                return self._crumb
        except Exception:
            pass

        try:
            req1b = urllib.request.Request("https://finance.yahoo.com/quote/AAPL", headers=headers)
            self._opener.open(req1b, timeout=self.timeout)
            req2b = urllib.request.Request("https://query1.finance.yahoo.com/v1/test/getcrumb", headers=headers)
            with self._opener.open(req2b, timeout=self.timeout) as resp:
                self._crumb = resp.read().decode('utf-8').strip()
                return self._crumb
        except Exception:
            return None

    def _fetch_chart_data(self, ticker: str, range_str: str = "2y", interval: str = "1d") -> Optional[Dict[str, Any]]:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range={range_str}&interval={interval}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": self.user_agent})
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    payload = json.loads(resp.read().decode('utf-8'))
                    result = payload.get("chart", {}).get("result")
                    if result and len(result) > 0:
                        return result[0]
        except Exception:
            return None
        return None

    def get_market_status(self, exchange: str) -> MarketStatus:
        now_utc = datetime.now(timezone.utc)
        weekday = now_utc.weekday()  # 0=Monday, 6=Sunday
        if weekday >= 5:
            return MarketStatus.CLOSED

        hour_utc = now_utc.hour + now_utc.minute / 60.0

        if exchange in ["NSE", "BSE", "INDIA"]:
            # IST is UTC+5:30. Market hours: 09:15 - 15:30 IST -> 03:45 - 10:00 UTC
            if 3.75 <= hour_utc < 10.0:
                return MarketStatus.OPEN
            elif 3.25 <= hour_utc < 3.75:
                return MarketStatus.PRE_MARKET
            else:
                return MarketStatus.CLOSED
        else:
            # US Markets (NYSE, NASDAQ): 09:30 - 16:00 EDT (13:30 - 20:00 UTC)
            if 13.5 <= hour_utc < 20.0:
                return MarketStatus.OPEN
            elif 8.0 <= hour_utc < 13.5:
                return MarketStatus.PRE_MARKET
            elif 20.0 <= hour_utc < 24.0:
                return MarketStatus.AFTER_HOURS
            else:
                return MarketStatus.CLOSED

    def get_quote(self, symbol: str) -> Optional[QuoteData]:
        sym_clean = symbol.strip().upper()
        ticker, exchange, currency, curr_sym, tz_name = self._resolve_ticker(sym_clean)
        data = self._fetch_chart_data(ticker, range_str="5d", interval="1d")
        if not data:
            return None

        meta = data.get("meta", {})
        indicators = data.get("indicators", {}).get("quote", [{}])[0]
        closes = [c for c in indicators.get("close", []) if c is not None]
        opens = [o for o in indicators.get("open", []) if o is not None]
        highs = [h for h in indicators.get("high", []) if h is not None]
        lows = [l for l in indicators.get("low", []) if l is not None]
        volumes = [v for v in indicators.get("volume", []) if v is not None]

        if not closes:
            return None

        current_price = round(float(meta.get("regularMarketPrice") or closes[-1]), 2)
        prev_close = round(float(meta.get("chartPreviousClose") or (closes[-2] if len(closes) > 1 else current_price)), 2)
        daily_change = round(current_price - prev_close, 2)
        daily_change_pct = round((daily_change / (prev_close + 1e-9)) * 100.0, 2)
        day_open = round(float(opens[-1] if opens else current_price), 2)
        day_high = round(float(highs[-1] if highs else current_price), 2)
        day_low = round(float(lows[-1] if lows else current_price), 2)
        volume = int(volumes[-1] if volumes else meta.get("regularMarketVolume", 0))

        # Evaluate real market state and freshness
        market_status = self.get_market_status(exchange)
        timestamp_sec = meta.get("regularMarketTime", int(datetime.now().timestamp()))
        timestamp_dt = datetime.fromtimestamp(timestamp_sec)
        timestamp_str = timestamp_dt.strftime("%Y-%m-%d %H:%M:%S")

        # Determine freshness: If market is closed, data is HISTORICAL; if open, it's DELAYED (15m public Yahoo feed)
        if market_status == MarketStatus.CLOSED:
            freshness = FreshnessState.HISTORICAL.value
            is_live = False
            is_delayed = False
        else:
            freshness = FreshnessState.DELAYED.value
            is_live = False
            is_delayed = True

        provenance = DataProvenance(
            source="Yahoo Finance v8 API",
            provider="Yahoo Finance",
            symbol=sym_clean,
            exchange=exchange,
            currency=currency,
            timestamp=timestamp_str,
            timezone=tz_name,
            market_status=market_status.value,
            freshness=freshness,
            is_live=is_live,
            is_delayed=is_delayed,
            is_fallback=False
        )

        name = meta.get("shortName") or meta.get("longName") or f"{sym_clean} Corporation"

        return QuoteData(
            symbol=sym_clean,
            name=name,
            exchange=exchange,
            currency=currency,
            currency_symbol=curr_sym,
            current_price=current_price,
            previous_close=prev_close,
            daily_change=daily_change,
            daily_change_pct=daily_change_pct,
            day_open=day_open,
            day_high=day_high,
            day_low=day_low,
            volume=volume,
            provenance=provenance
        )

    def get_historical_ohlcv(self, symbol: str, timeframe: str = "1Y") -> Optional[pd.DataFrame]:
        sym_clean = symbol.strip().upper()
        ticker, _, _, _, _ = self._resolve_ticker(sym_clean)

        range_map = {
            "1D": "1d",
            "5D": "5d",
            "1M": "1mo",
            "3M": "3mo",
            "6M": "6mo",
            "1Y": "2y",
            "5Y": "5y",
            "MAX": "max"
        }
        range_param = range_map.get(timeframe.upper(), "2y")
        interval = "15m" if timeframe.upper() == "1D" else "1d"

        data = self._fetch_chart_data(ticker, range_str=range_param, interval=interval)
        if not data:
            return None

        timestamps = data.get("timestamp", [])
        quote = data.get("indicators", {}).get("quote", [{}])[0]
        closes = quote.get("close", [])
        opens = quote.get("open", [])
        highs = quote.get("high", [])
        lows = quote.get("low", [])
        volumes = quote.get("volume", [])

        records = []
        for i, ts in enumerate(timestamps):
            c = closes[i] if i < len(closes) else None
            o = opens[i] if i < len(opens) else None
            h = highs[i] if i < len(highs) else None
            l = lows[i] if i < len(lows) else None
            v = volumes[i] if i < len(volumes) else None

            if c is not None and o is not None and h is not None and l is not None:
                dt_str = datetime.fromtimestamp(ts).strftime('%Y-%m-%d')
                records.append({
                    "date": dt_str,
                    "open": round(float(o), 2),
                    "high": round(float(h), 2),
                    "low": round(float(l), 2),
                    "close": round(float(c), 2),
                    "volume": int(v or 0)
                })

        if not records:
            return None

        df = pd.DataFrame(records).drop_duplicates(subset=["date"]).reset_index(drop=True)
        return df

    def get_fundamentals(self, symbol: str) -> Optional[FundamentalsData]:
        sym_clean = symbol.strip().upper()
        ticker, exchange, currency, curr_sym, tz_name = self._resolve_ticker(sym_clean)
        quote = self.get_quote(sym_clean)
        if not quote:
            return None

        crumb = self._get_crumb()
        modules = "defaultKeyStatistics,financialData,summaryDetail,assetProfile"
        url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules={modules}"
        if crumb:
            url += f"&crumb={crumb}"

        try:
            req = urllib.request.Request(url, headers={"User-Agent": self.user_agent})
            with self._opener.open(req, timeout=self.timeout) as resp:
                payload = json.loads(resp.read().decode('utf-8'))
                res_list = payload.get("quoteSummary", {}).get("result", [])
                if not res_list:
                    return None
                res = res_list[0]
                stats = res.get("defaultKeyStatistics", {})
                fin = res.get("financialData", {})
                summ = res.get("summaryDetail", {})
                profile = res.get("assetProfile", {})

                # Helper to extract raw or fmt value safely without fabrication
                def _val(d: Dict[str, Any], key: str) -> Any:
                    item = d.get(key)
                    if isinstance(item, dict):
                        return item.get("raw")
                    return item

                def _fmt(d: Dict[str, Any], key: str) -> Optional[str]:
                    item = d.get(key)
                    if isinstance(item, dict):
                        return item.get("fmt") or (str(item.get("raw")) if item.get("raw") is not None else None)
                    return str(item) if item is not None else None

                # Extract Valuation
                m_cap = _fmt(summ, "marketCap")
                ev = _fmt(stats, "enterpriseValue")
                trailing_pe = _val(summ, "trailingPE")
                forward_pe = _val(summ, "forwardPE")
                peg = _val(stats, "pegRatio")
                p_book = _val(stats, "priceToBook")
                p_sales = _val(summ, "priceToSalesTrailing12Months")
                ev_rev = _val(stats, "enterpriseToRevenue")
                ev_ebitda = _val(stats, "enterpriseToEbitda")

                # Extract Profitability
                eps = _val(stats, "trailingEps")
                f_eps = _val(stats, "forwardEps")
                revenue = _fmt(fin, "totalRevenue")
                rev_growth = _fmt(fin, "revenueGrowth")
                gross_margin = _fmt(fin, "grossMargins")
                op_margin = _fmt(fin, "operatingMargins")
                profit_margin = _fmt(fin, "profitMargins")
                roe = _fmt(fin, "returnOnEquity")
                roa = _fmt(fin, "returnOnAssets")

                # Extract Balance Sheet & Cash Flow
                total_debt = _fmt(fin, "totalDebt")
                total_cash = _fmt(fin, "totalCash")
                debt_eq = _val(fin, "debtToEquity")
                curr_ratio = _val(fin, "currentRatio")
                fcf = _fmt(fin, "freeCashflow")
                op_cf = _fmt(fin, "operatingCashflow")
                capex = _fmt(fin, "capitalExpenditures")

                # Extract Dividends
                div_rate = _val(summ, "dividendRate")
                div_yield = _fmt(summ, "dividendYield")
                payout = _fmt(summ, "payoutRatio")

                # Extract Market Stats
                shares_out = _fmt(stats, "sharesOutstanding")
                beta = _val(stats, "beta") or _val(summ, "beta")
                h52 = _val(summ, "fiftyTwoWeekHigh") or quote.day_high
                l52 = _val(summ, "fiftyTwoWeekLow") or quote.day_low

                # Data As Of / Reporting Period
                as_of = _fmt(fin, "mostRecentQuarter") or _fmt(stats, "lastFiscalYearEnd") or quote.provenance.timestamp.split(' ')[0]

                fund_provenance = DataProvenance(
                    source="Yahoo Finance v10 API (quoteSummary)",
                    provider="Yahoo Finance",
                    symbol=sym_clean,
                    exchange=exchange,
                    currency=currency,
                    timestamp=quote.provenance.timestamp,
                    timezone=tz_name,
                    market_status=quote.provenance.market_status,
                    freshness=FreshnessState.HISTORICAL.value,
                    is_live=False,
                    is_delayed=False,
                    is_fallback=False
                )

                return FundamentalsData(
                    symbol=sym_clean,
                    company_name=profile.get("longName") or quote.name,
                    sector=profile.get("sector") or "General Equities",
                    industry=profile.get("industry") or "Equities",
                    description=profile.get("longBusinessSummary") or f"{sym_clean} operates in {profile.get('sector', 'equities')}.",
                    market_cap=m_cap,
                    enterprise_value=ev,
                    pe_ratio=round(float(trailing_pe), 2) if trailing_pe is not None else None,
                    forward_pe=round(float(forward_pe), 2) if forward_pe is not None else None,
                    peg_ratio=round(float(peg), 2) if peg is not None else None,
                    price_to_book=round(float(p_book), 2) if p_book is not None else None,
                    price_to_sales=round(float(p_sales), 2) if p_sales is not None else None,
                    ev_to_revenue=round(float(ev_rev), 2) if ev_rev is not None else None,
                    ev_to_ebitda=round(float(ev_ebitda), 2) if ev_ebitda is not None else None,
                    eps=round(float(eps), 2) if eps is not None else None,
                    forward_eps=round(float(f_eps), 2) if f_eps is not None else None,
                    revenue=revenue,
                    revenue_growth=rev_growth,
                    gross_margin=gross_margin,
                    operating_margin=op_margin,
                    profit_margin=profit_margin,
                    return_on_equity=roe,
                    return_on_assets=roa,
                    total_debt=total_debt,
                    total_cash=total_cash,
                    debt_to_equity=round(float(debt_eq), 2) if debt_eq is not None else None,
                    current_ratio=round(float(curr_ratio), 2) if curr_ratio is not None else None,
                    free_cash_flow=fcf,
                    operating_cash_flow=op_cf,
                    capital_expenditures=capex,
                    dividend_rate=round(float(div_rate), 2) if div_rate is not None else None,
                    dividend_yield=div_yield,
                    payout_ratio=payout,
                    shares_outstanding=shares_out,
                    beta=round(float(beta), 2) if beta is not None else None,
                    week_52_high=round(float(h52), 2) if h52 is not None else None,
                    week_52_low=round(float(l52), 2) if l52 is not None else None,
                    data_as_of=as_of,
                    provenance=fund_provenance
                )
        except Exception:
            return None

    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        q = query.strip().upper()
        results = []
        for sym, (ticker, exch, curr, curr_sym, tz) in TICKER_EXCHANGE_MAP.items():
            if not q or q in sym or q in ticker:
                results.append({
                    "symbol": sym,
                    "ticker": ticker,
                    "exchange": exch,
                    "currency": curr,
                    "currency_symbol": curr_sym,
                    "timezone": tz,
                    "provider": "Yahoo Finance"
                })
        return results
