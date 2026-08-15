"""
StockSense AI - Financial News & Sentiment Provider Interface
Defines the standard data structures, sentiment summary, and contract for all news providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from typing import Dict, List, Any, Optional


@dataclass
class NewsArticle:
    id: str
    symbol: str
    headline: str
    summary: str
    source: str
    url: str
    published_at: str
    author: Optional[str] = None
    image_url: Optional[str] = None
    language: str = "en"
    provider: str = "Financial News Feed"
    sentiment: str = "neutral"
    sentiment_score: float = 0.0
    confidence: float = 0.5

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SentimentSummary:
    positive: int
    neutral: int
    negative: int
    overall: str
    score: float
    confidence: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class NewsResponse:
    symbol: str
    provider: str
    retrieved_at: str
    freshness: str
    articles: List[NewsArticle]
    sentiment_summary: SentimentSummary
    disclaimer: str

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["articles"] = [a.to_dict() for a in self.articles]
        d["sentiment_summary"] = self.sentiment_summary.to_dict()
        return d


class BaseNewsProvider(ABC):
    """
    Abstract interface for financial news providers.
    """

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the canonical news provider identifier."""
        pass

    @abstractmethod
    def get_news(self, symbol: str) -> List[NewsArticle]:
        """Fetches and normalizes financial news articles for the given symbol."""
        pass

    @abstractmethod
    def search_news(self, query: str) -> List[NewsArticle]:
        """Searches financial news articles matching query string."""
        pass
