"""
StockSense AI - Real Financial News Provider (RSS & Live Feed Ingestion)
Fetches authentic financial news from Yahoo Finance RSS and Google Financial Feeds,
cleans summaries, dedupes articles, and annotates with NLP financial sentiment.
"""

import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Dict, List, Any, Optional

from backend.services.news.base import BaseNewsProvider, NewsArticle
from backend.services.news.sentiment_engine import FinancialSentimentAnalyzer

# Symbol to search query mapping
SYMBOL_SEARCH_QUERIES = {
    "AAPL": "Apple Inc stock",
    "MSFT": "Microsoft stock",
    "NVDA": "Nvidia stock",
    "TSLA": "Tesla stock",
    "RELIANCE": "Reliance Industries stock",
    "TCS": "Tata Consultancy Services stock",
    "INFY": "Infosys stock",
    "HDFCBANK": "HDFC Bank stock",
    "AMZN": "Amazon stock",
    "GOOGL": "Alphabet Google stock",
    "META": "Meta Platforms stock",
    "NFLX": "Netflix stock",
    "AMD": "AMD stock",
    "AVGO": "Broadcom stock",
    "JPM": "JPMorgan Chase stock",
}


class YahooNewsProvider(BaseNewsProvider):
    """
    Live financial news feed provider integrating with external financial RSS feeds.
    Provides genuine article URLs, publisher attribution, and publication timestamps.
    """

    def __init__(self, timeout_seconds: float = 6.0):
        self.timeout = timeout_seconds
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    def get_provider_name(self) -> str:
        return "Yahoo & Global Financial News Feeds"

    def _clean_html(self, raw_html: str) -> str:
        """Strips HTML tags and unescapes text."""
        cleanr = re.compile('<.*?>')
        cleantext = re.sub(cleanr, '', raw_html)
        return cleantext.replace('&amp;', '&').replace('&quot;', '"').replace('&apos;', "'").replace('&#39;', "'").strip()

    def _parse_published_date(self, date_str: str) -> str:
        """Parses RFC-822 date formats into clean ISO-like date string."""
        if not date_str:
            return datetime.now().strftime("%Y-%m-%d %H:%M")
        try:
            dt = parsedate_to_datetime(date_str)
            return dt.strftime("%Y-%m-%d %H:%M")
        except Exception:
            return date_str

    def get_news(self, symbol: str) -> List[NewsArticle]:
        sym_clean = symbol.strip().upper()
        search_query = SYMBOL_SEARCH_QUERIES.get(sym_clean, f"{sym_clean} stock")

        # 1. Try Yahoo Finance Ticker Feed First
        articles = self._fetch_yahoo_ticker_rss(sym_clean)
        
        # 2. If Yahoo feed has < 3 articles (common for Indian equities), query Google Financial News feed
        if len(articles) < 3:
            google_articles = self._fetch_google_news_rss(sym_clean, search_query)
            articles.extend(google_articles)

        # 3. Deduplicate by headline similarity and URL
        deduped = self._deduplicate_articles(articles)

        # 4. Sort newest first
        deduped.sort(key=lambda x: x.published_at, reverse=True)
        return deduped[:12]

    def _fetch_yahoo_ticker_rss(self, symbol: str) -> List[NewsArticle]:
        ticker = f"{symbol}.NS" if symbol in ["RELIANCE", "TCS", "INFY", "HDFCBANK"] else symbol
        url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US"
        
        try:
            req = urllib.request.Request(url, headers={"User-Agent": self.user_agent})
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                xml_data = resp.read()
                return self._parse_rss_xml(xml_data, symbol, "Yahoo Finance")
        except Exception:
            return []

    def _fetch_google_news_rss(self, symbol: str, query: str) -> List[NewsArticle]:
        encoded_q = urllib.parse.quote(query)
        url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-US&gl=US&ceid=US:en"

        try:
            req = urllib.request.Request(url, headers={"User-Agent": self.user_agent})
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                xml_data = resp.read()
                return self._parse_rss_xml(xml_data, symbol, "Global Financial Media")
        except Exception:
            return []

    def _parse_rss_xml(self, xml_bytes: bytes, symbol: str, default_source: str) -> List[NewsArticle]:
        articles: List[NewsArticle] = []
        try:
            root = ET.fromstring(xml_bytes)
            channel = root.find("channel")
            if channel is None:
                return []

            for idx, item in enumerate(channel.findall("item")):
                title_elem = item.find("title")
                link_elem = item.find("link")
                pub_date_elem = item.find("pubDate")
                desc_elem = item.find("description")
                source_elem = item.find("source")

                title = self._clean_html(title_elem.text if title_elem is not None and title_elem.text else "")
                link = link_elem.text.strip() if link_elem is not None and link_elem.text else ""
                pub_date = self._parse_published_date(pub_date_elem.text if pub_date_elem is not None and pub_date_elem.text else "")
                summary = self._clean_html(desc_elem.text if desc_elem is not None and desc_elem.text else "")
                
                # Extract publisher name
                source_name = default_source
                if source_elem is not None and source_elem.text:
                    source_name = source_elem.text.strip()
                elif " - " in title:
                    parts = title.rsplit(" - ", 1)
                    if len(parts) == 2 and len(parts[1]) < 35:
                        title = parts[0].strip()
                        source_name = parts[1].strip()

                if not title or not link:
                    continue

                # Run NLP Sentiment Engine on actual text
                sentiment_class, score, conf = FinancialSentimentAnalyzer.analyze_text(title, summary)

                articles.append(NewsArticle(
                    id=f"{symbol.lower()}-{idx+1}-{abs(hash(link)) % 100000}",
                    symbol=symbol,
                    headline=title,
                    summary=summary[:280] + ("..." if len(summary) > 280 else ""),
                    source=source_name,
                    url=link,
                    published_at=pub_date,
                    provider="Yahoo/Google Financial Feeds",
                    sentiment=sentiment_class,
                    sentiment_score=score,
                    confidence=conf
                ))
        except Exception:
            pass
        return articles

    def _deduplicate_articles(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        seen_titles = set()
        seen_urls = set()
        unique = []

        for a in articles:
            norm_title = re.sub(r'[^a-zA-Z0-9]', '', a.headline.lower())[:40]
            if a.url in seen_urls or norm_title in seen_titles:
                continue
            seen_urls.add(a.url)
            seen_titles.add(norm_title)
            unique.append(a)
        return unique

    def search_news(self, query: str) -> List[NewsArticle]:
        return self._fetch_google_news_rss("GENERAL", query)
