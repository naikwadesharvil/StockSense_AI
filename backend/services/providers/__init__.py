"""
StockSense AI - Market Data Provider Architecture Module
"""

from backend.services.providers.base import (
    BaseMarketDataProvider,
    MarketStatus,
    FreshnessState,
    DataProvenance,
    QuoteData,
    FundamentalsData
)
from backend.services.providers.yahoo import YahooMarketDataProvider
from backend.services.providers.commercial import CommercialMarketDataProvider
from backend.services.providers.fallback import FallbackBenchmarkProvider, FALLBACK_STOCKS_METADATA
from backend.services.providers.factory import ResilientMarketDataProvider, get_market_data_provider

__all__ = [
    "BaseMarketDataProvider",
    "MarketStatus",
    "FreshnessState",
    "DataProvenance",
    "QuoteData",
    "FundamentalsData",
    "YahooMarketDataProvider",
    "CommercialMarketDataProvider",
    "FallbackBenchmarkProvider",
    "FALLBACK_STOCKS_METADATA",
    "ResilientMarketDataProvider",
    "get_market_data_provider"
]
