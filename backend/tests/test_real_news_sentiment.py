"""
StockSense AI - Real Financial News & Sentiment Engine Unit Tests
Validates news provider contract, financial NLP sentiment scoring, contextual reversals,
deduplication, recency weighting, cache partitioning, and fallback isolation.
"""

import unittest
import os

from backend.services.news.base import NewsArticle, SentimentSummary, NewsResponse
from backend.services.news.sentiment_engine import FinancialSentimentAnalyzer
from backend.services.news.fallback_news import FallbackBenchmarkNewsProvider
from backend.services.news.yahoo_news import YahooNewsProvider
from backend.services.news.factory import get_news_provider
from backend.services.sentiment_service import SentimentService
from backend.services.cache_service import cache_manager


class TestRealNewsAndSentiment(unittest.TestCase):

    def test_news_article_schema(self):
        art = NewsArticle(
            id="test-1",
            symbol="AAPL",
            headline="Apple Services Revenue Surges 14% to New Record",
            summary="Apple Inc reported strong quarterly services revenue surpassing expectations.",
            source="Reuters",
            url="https://www.reuters.com/technology/apple-services",
            published_at="2026-08-15 10:30",
            sentiment="positive",
            sentiment_score=0.78,
            confidence=0.85
        )
        d = art.to_dict()
        self.assertEqual(d["symbol"], "AAPL")
        self.assertEqual(d["source"], "Reuters")
        self.assertEqual(d["sentiment"], "positive")
        self.assertGreater(d["sentiment_score"], 0.5)

    def test_financial_sentiment_positive_phrases(self):
        """Verifies directional boost on positive corporate earnings and guidance."""
        headline = "NVIDIA Reports Record Data Center Revenue and Raises Full-Year Guidance"
        sentiment_class, score, conf = FinancialSentimentAnalyzer.analyze_text(headline)
        self.assertEqual(sentiment_class, "positive")
        self.assertGreaterEqual(score, 0.50)
        self.assertGreaterEqual(conf, 0.60)

    def test_financial_sentiment_negative_phrases(self):
        """Verifies detection of regulatory headwinds, missed estimates, and target cuts."""
        headline = "Company Misses Analyst Expectations as Regulatory Scrutiny Deepens"
        sentiment_class, score, conf = FinancialSentimentAnalyzer.analyze_text(headline)
        self.assertEqual(sentiment_class, "negative")
        self.assertLessEqual(score, -0.40)

    def test_financial_sentiment_contextual_reversals(self):
        """Verifies context-aware reversal where 'lower loss' is recognized as positive."""
        headline = "Automaker Reports Lower Loss Than Expected in Commercial EV Division"
        sentiment_class, score, conf = FinancialSentimentAnalyzer.analyze_text(headline)
        self.assertEqual(sentiment_class, "positive")
        self.assertGreater(score, 0.0)

    def test_financial_sentiment_negations(self):
        """Verifies negation handling flips positive tokens to negative."""
        headline = "Firm Fails to Achieve Growth Targets Amid Supply Bottlenecks"
        sentiment_class, score, conf = FinancialSentimentAnalyzer.analyze_text(headline)
        self.assertEqual(sentiment_class, "negative")
        self.assertLess(score, 0.0)

    def test_sentiment_aggregation_weighting(self):
        """Verifies aggregation correctly weights articles and classifies overall market bias."""
        articles = [
            NewsArticle(id="1", symbol="MSFT", headline="Azure AI Expands", summary="", source="CNBC", url="http://1", published_at="2026-08-15", sentiment="positive", sentiment_score=0.80, confidence=0.85),
            NewsArticle(id="2", symbol="MSFT", headline="Enterprise Adoption Accelerates", summary="", source="TechCrunch", url="http://2", published_at="2026-08-15", sentiment="positive", sentiment_score=0.70, confidence=0.80),
            NewsArticle(id="3", symbol="MSFT", headline="Regulatory Filing Submitted", summary="", source="Reuters", url="http://3", published_at="2026-08-14", sentiment="neutral", sentiment_score=0.05, confidence=0.50),
        ]
        summary = FinancialSentimentAnalyzer.aggregate_sentiment(articles)
        self.assertEqual(summary.positive, 2)
        self.assertEqual(summary.neutral, 1)
        self.assertEqual(summary.negative, 0)
        self.assertEqual(summary.overall, "Bullish")
        self.assertGreater(summary.score, 0.40)

    def test_news_deduplication(self):
        provider = YahooNewsProvider()
        articles = [
            NewsArticle(id="1", symbol="AAPL", headline="Apple Expands AI Facility in Asia", summary="", source="Bloomberg", url="https://example.com/art1", published_at="2026-08-15"),
            NewsArticle(id="2", symbol="AAPL", headline="Apple Expands AI Facility in Asia - Reuters", summary="", source="Reuters", url="https://example.com/art1", published_at="2026-08-15"),
            NewsArticle(id="3", symbol="AAPL", headline="Apple Expands AI Facility in Asia", summary="", source="CNBC", url="https://example.com/art3", published_at="2026-08-15"),
            NewsArticle(id="4", symbol="AAPL", headline="Distinct Other Headline on Services", summary="", source="WSJ", url="https://example.com/art4", published_at="2026-08-14")
        ]
        deduped = provider._deduplicate_articles(articles)
        self.assertEqual(len(deduped), 2)

    def test_benchmark_mode_isolation(self):
        """Verifies that force_benchmark=True returns deterministic offline benchmark news."""
        provider = get_news_provider(force_benchmark=True)
        self.assertIsInstance(provider, FallbackBenchmarkNewsProvider)
        articles = provider.get_news("AAPL")
        self.assertGreaterEqual(len(articles), 2)
        self.assertEqual(articles[0].provider, "Offline Benchmark Archive")

    def test_sentiment_service_caching(self):
        """Verifies that news responses are cached in sentiment_cache partition."""
        cache_manager.sentiment_cache.clear()
        res = SentimentService.get_stock_sentiment("NVDA", force_benchmark=True)
        self.assertIsNotNone(res)
        self.assertEqual(res["symbol"], "NVDA")
        self.assertIn("articles", res)
        self.assertIn("distribution", res)

        stats = cache_manager.sentiment_cache.get_stats()
        self.assertGreater(stats["entries"], 0)


if __name__ == "__main__":
    unittest.main()
