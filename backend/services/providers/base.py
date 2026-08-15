"""
StockSense AI - Market Data Provider Interface & Provenance Model
Defines the standard contract, provenance data structures, and freshness state definitions
for all market data providers (Live, Delayed, Historical, Fallback).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Dict, List, Any, Optional
import pandas as pd


class MarketStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    PRE_MARKET = "PRE_MARKET"
    AFTER_HOURS = "AFTER_HOURS"
    UNKNOWN = "UNKNOWN"


class FreshnessState(str, Enum):
    LIVE = "LIVE"
    DELAYED = "DELAYED"
    HISTORICAL = "HISTORICAL"
    FALLBACK = "FALLBACK"
    UNAVAILABLE = "UNAVAILABLE"


@dataclass
class DataProvenance:
    source: str
    provider: str
    symbol: str
    exchange: str
    currency: str
    timestamp: str
    timezone: str
    market_status: str = MarketStatus.UNKNOWN.value
    freshness: str = FreshnessState.HISTORICAL.value
    is_live: bool = False
    is_delayed: bool = False
    is_fallback: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class QuoteData:
    symbol: str
    name: str
    exchange: str
    currency: str
    currency_symbol: str
    current_price: float
    previous_close: float
    daily_change: float
    daily_change_pct: float
    day_open: float
    day_high: float
    day_low: float
    volume: int
    provenance: DataProvenance

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["provenance"] = self.provenance.to_dict()
        return d


@dataclass
class FundamentalsData:
    symbol: str
    company_name: str
    sector: Optional[str]
    industry: Optional[str]
    description: Optional[str]
    
    # Valuation Metrics
    market_cap: Optional[str]
    enterprise_value: Optional[str]
    pe_ratio: Optional[float]
    forward_pe: Optional[float]
    peg_ratio: Optional[float]
    price_to_book: Optional[float]
    price_to_sales: Optional[float]
    ev_to_revenue: Optional[float]
    ev_to_ebitda: Optional[float]
    
    # Profitability & Financial Health
    eps: Optional[float]
    forward_eps: Optional[float]
    revenue: Optional[str]
    revenue_growth: Optional[str]
    gross_margin: Optional[str]
    operating_margin: Optional[str]
    profit_margin: Optional[str]
    return_on_equity: Optional[str]
    return_on_assets: Optional[str]
    
    # Balance Sheet & Cash Flow
    total_debt: Optional[str]
    total_cash: Optional[str]
    debt_to_equity: Optional[float]
    current_ratio: Optional[float]
    free_cash_flow: Optional[str]
    operating_cash_flow: Optional[str]
    capital_expenditures: Optional[str]
    
    # Dividends
    dividend_rate: Optional[float]
    dividend_yield: Optional[str]
    payout_ratio: Optional[str]
    
    # Market Trading Statistics
    shares_outstanding: Optional[str]
    beta: Optional[float]
    week_52_high: Optional[float]
    week_52_low: Optional[float]
    
    # Metadata & Provenance
    data_as_of: Optional[str]
    provenance: DataProvenance

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["provenance"] = self.provenance.to_dict()
        return d


class BaseMarketDataProvider(ABC):
    """
    Abstract base provider class defining required capabilities for live and fallback feeds.
    """

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the canonical provider identifier (e.g. 'Yahoo Finance', 'Polygon.io')."""
        pass

    @abstractmethod
    def get_quote(self, symbol: str) -> Optional[QuoteData]:
        """Fetches the latest quote with accurate market freshness and status."""
        pass

    @abstractmethod
    def get_historical_ohlcv(self, symbol: str, timeframe: str = "1Y") -> Optional[pd.DataFrame]:
        """Fetches historical daily OHLCV bars for the specified timeframe."""
        pass

    @abstractmethod
    def get_fundamentals(self, symbol: str) -> Optional[FundamentalsData]:
        """Fetches company fundamentals or returns None / N/A for missing metrics."""
        pass

    @abstractmethod
    def get_market_status(self, exchange: str) -> MarketStatus:
        """Evaluates whether the exchange is OPEN, CLOSED, PRE_MARKET, or AFTER_HOURS."""
        pass

    @abstractmethod
    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        """Searches the supported equity universe by ticker or company name."""
        pass
