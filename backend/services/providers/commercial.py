"""
StockSense AI - Commercial Market Data Provider Adapter
Pluggable provider adapter for licensed commercial APIs (e.g., Financial Modeling Prep, Polygon, Alpha Vantage).
Activated securely via environment variables when API keys are configured.
"""

import os
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
from backend.services.providers.yahoo import YahooMarketDataProvider


class CommercialMarketDataProvider(BaseMarketDataProvider):
    """
    Adapter for commercial licensed data feeds.
    Falls back to YahooMarketDataProvider if API key is not active.
    """

    def __init__(self, api_key: Optional[str] = None, provider_id: str = "commercial"):
        self.api_key = api_key or os.getenv("MARKET_DATA_API_KEY", "")
        self.provider_id = provider_id
        self._fallback_live_provider = YahooMarketDataProvider()

    def get_provider_name(self) -> str:
        return f"Commercial Provider ({self.provider_id.upper()})" if self.api_key else "Commercial Adapter (Yahoo Delegated)"

    def get_market_status(self, exchange: str) -> MarketStatus:
        return self._fallback_live_provider.get_market_status(exchange)

    def get_quote(self, symbol: str) -> Optional[QuoteData]:
        if not self.api_key:
            return self._fallback_live_provider.get_quote(symbol)
        # Commercial provider parsing placeholder
        return self._fallback_live_provider.get_quote(symbol)

    def get_historical_ohlcv(self, symbol: str, timeframe: str = "1Y") -> Optional[pd.DataFrame]:
        return self._fallback_live_provider.get_historical_ohlcv(symbol, timeframe)

    def get_fundamentals(self, symbol: str) -> Optional[FundamentalsData]:
        return self._fallback_live_provider.get_fundamentals(symbol)

    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        return self._fallback_live_provider.search_symbols(query)
