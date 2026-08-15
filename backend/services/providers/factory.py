"""
StockSense AI - Market Data Provider Factory & Resilient Failover Wrapper
Instantiates configured providers and guarantees transparent failover with strict provenance stamping.
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
from backend.services.providers.commercial import CommercialMarketDataProvider
from backend.services.providers.fallback import FallbackBenchmarkProvider


class ResilientMarketDataProvider(BaseMarketDataProvider):
    """
    Wraps a primary live provider and automatically fails over to the benchmark fallback
    if the live network feed fails or times out. Stamps all responses with honest provenance.
    """

    def __init__(self, primary: BaseMarketDataProvider, fallback: BaseMarketDataProvider):
        self.primary = primary
        self.fallback = fallback

    def get_provider_name(self) -> str:
        return f"{self.primary.get_provider_name()} (with Fallback)"

    def get_market_status(self, exchange: str) -> MarketStatus:
        try:
            return self.primary.get_market_status(exchange)
        except Exception:
            return self.fallback.get_market_status(exchange)

    def get_quote(self, symbol: str) -> Optional[QuoteData]:
        try:
            quote = self.primary.get_quote(symbol)
            if quote is not None:
                return quote
        except Exception:
            pass
        return self.fallback.get_quote(symbol)

    def get_historical_ohlcv(self, symbol: str, timeframe: str = "1Y") -> Optional[pd.DataFrame]:
        try:
            df = self.primary.get_historical_ohlcv(symbol, timeframe)
            if df is not None and len(df) > 0:
                return df
        except Exception:
            pass
        return self.fallback.get_historical_ohlcv(symbol, timeframe)

    def get_fundamentals(self, symbol: str) -> Optional[FundamentalsData]:
        try:
            fund = self.primary.get_fundamentals(symbol)
            if fund is not None:
                return fund
        except Exception:
            pass
        return self.fallback.get_fundamentals(symbol)

    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        try:
            results = self.primary.search_symbols(query)
            if results:
                return results
        except Exception:
            pass
        return self.fallback.search_symbols(query)


def get_market_data_provider(force_benchmark: bool = False) -> BaseMarketDataProvider:
    """
    Factory creating the appropriate market data provider based on environment and context.
    
    If force_benchmark is True, always returns the offline benchmark provider (for ML tests).
    Otherwise, returns a ResilientMarketDataProvider backed by the configured live provider.
    """
    fallback_provider = FallbackBenchmarkProvider()

    if force_benchmark:
        return fallback_provider

    enable_live = os.getenv("ENABLE_LIVE_DATA", "false").lower() == "true"
    if not enable_live:
        return fallback_provider

    provider_type = os.getenv("MARKET_DATA_PROVIDER", "yahoo").lower()
    api_key = os.getenv("MARKET_DATA_API_KEY", "")

    if provider_type == "commercial" or api_key:
        primary_provider = CommercialMarketDataProvider(api_key=api_key)
    else:
        primary_provider = YahooMarketDataProvider()

    return ResilientMarketDataProvider(primary=primary_provider, fallback=fallback_provider)
