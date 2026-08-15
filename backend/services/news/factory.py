"""
StockSense AI - News Provider Factory & Resilient News Failover
"""

import os
from typing import List, Optional
from backend.services.news.base import BaseNewsProvider, NewsArticle
from backend.services.news.yahoo_news import YahooNewsProvider
from backend.services.news.fallback_news import FallbackBenchmarkNewsProvider


class ResilientNewsProvider(BaseNewsProvider):
    """
    Wraps primary news feed with failover to cached articles or honest empty state.
    """

    def __init__(self, primary: BaseNewsProvider, fallback: BaseNewsProvider):
        self.primary = primary
        self.fallback = fallback

    def get_provider_name(self) -> str:
        return self.primary.get_provider_name()

    def get_news(self, symbol: str) -> List[NewsArticle]:
        try:
            articles = self.primary.get_news(symbol)
            if articles:
                return articles
        except Exception:
            pass
        return self.fallback.get_news(symbol)

    def search_news(self, query: str) -> List[NewsArticle]:
        try:
            return self.primary.search_news(query)
        except Exception:
            return self.fallback.search_news(query)


def get_news_provider(force_benchmark: bool = False) -> BaseNewsProvider:
    """
    Factory creating the appropriate news provider.
    """
    fallback_provider = FallbackBenchmarkNewsProvider()

    if force_benchmark:
        return fallback_provider

    enable_live = os.getenv("ENABLE_LIVE_DATA", "false").lower() == "true"
    if not enable_live:
        return fallback_provider

    primary_provider = YahooNewsProvider()
    return ResilientNewsProvider(primary=primary_provider, fallback=fallback_provider)
