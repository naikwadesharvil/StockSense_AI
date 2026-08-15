"""
StockSense AI - Financial News & Sentiment Module
"""

from backend.services.news.base import NewsArticle, SentimentSummary, NewsResponse, BaseNewsProvider
from backend.services.news.sentiment_engine import FinancialSentimentAnalyzer
from backend.services.news.yahoo_news import YahooNewsProvider
from backend.services.news.fallback_news import FallbackBenchmarkNewsProvider
from backend.services.news.factory import get_news_provider, ResilientNewsProvider

__all__ = [
    "NewsArticle",
    "SentimentSummary",
    "NewsResponse",
    "BaseNewsProvider",
    "FinancialSentimentAnalyzer",
    "YahooNewsProvider",
    "FallbackBenchmarkNewsProvider",
    "get_news_provider",
    "ResilientNewsProvider"
]
