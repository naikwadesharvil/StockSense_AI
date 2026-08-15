"""
StockSense AI - Fallback & Benchmark News Provider
Provides deterministic, frozen news articles strictly for unit testing and offline demo mode.
Isolated from the live production pipeline.
"""

from typing import Dict, List
from backend.services.news.base import BaseNewsProvider, NewsArticle
from backend.services.news.sentiment_engine import FinancialSentimentAnalyzer

BENCHMARK_HEADLINES: Dict[str, List[Dict[str, str]]] = {
    "AAPL": [
        {"title": "Apple Reports Quarterly Services Revenue Growth", "source": "Bloomberg", "date": "2026-08-14 14:00", "url": "https://www.bloomberg.com/news/articles/apple-services"},
        {"title": "Apple Hardware Silicon Roadmap Expands Enterprise AI Infrastructure", "source": "Reuters", "date": "2026-08-14 10:30", "url": "https://www.reuters.com/technology/apple-ai"},
        {"title": "Analysts Maintain Constructive Outlook on Apple Operating Margins", "source": "Wall Street Journal", "date": "2026-08-13 16:15", "url": "https://www.wsj.com/market-data/apple"}
    ],
    "MSFT": [
        {"title": "Microsoft Cloud Azure Adoption Shows Constructive Momentum", "source": "CNBC", "date": "2026-08-14 15:00", "url": "https://www.cnbc.com/microsoft-cloud"},
        {"title": "Enterprise Software Workflows Integrate Copilot Features", "source": "TechCrunch", "date": "2026-08-14 11:20", "url": "https://techcrunch.com/microsoft-copilot"}
    ],
    "NVDA": [
        {"title": "NVIDIA Data Center Hardware Demand Sustained Globally", "source": "MarketWatch", "date": "2026-08-14 13:45", "url": "https://www.marketwatch.com/story/nvidia-datacenter"},
        {"title": "Semiconductor Supply Chain Execution Evaluated by Analysts", "source": "Barron's", "date": "2026-08-14 09:10", "url": "https://www.barrons.com/articles/nvidia"}
    ],
    "TSLA": [
        {"title": "Tesla Energy Storage Deployments Reach New Quarterly Milestone", "source": "Electrek", "date": "2026-08-14 12:00", "url": "https://electrek.co/tesla-energy"},
        {"title": "Automotive Production Scaled Across Global Gigafactories", "source": "Reuters", "date": "2026-08-13 18:30", "url": "https://www.reuters.com/business/autos/tesla"}
    ],
    "RELIANCE": [
        {"title": "Reliance Jio Expands 5G Network Infrastructure and Digital Services", "source": "Economic Times", "date": "2026-08-14 11:00", "url": "https://economictimes.indiatimes.com/reliance-jio"},
        {"title": "Retail Arm Deepens Tier-2 Store Footprint Across India", "source": "Mint", "date": "2026-08-13 15:20", "url": "https://www.livemint.com/companies/reliance-retail"}
    ],
    "TCS": [
        {"title": "TCS Secures Large Multi-Year Cloud Migration Engagement", "source": "Business Standard", "date": "2026-08-14 10:15", "url": "https://www.business-standard.com/companies/tcs"},
        {"title": "Attrition Rates Moderate Across Global Delivery Centers", "source": "Financial Express", "date": "2026-08-13 14:00", "url": "https://www.financialexpress.com/industry/tcs"}
    ],
    "INFY": [
        {"title": "Infosys Topaz AI Suite Drives Enterprise Deal Momentum", "source": "Economic Times", "date": "2026-08-14 09:30", "url": "https://economictimes.indiatimes.com/infosys"},
        {"title": "Digital Transformation Solutions Expanded for European Clients", "source": "Mint", "date": "2026-08-13 16:45", "url": "https://www.livemint.com/companies/infosys"}
    ],
    "HDFCBANK": [
        {"title": "HDFC Bank Deposit Mobilization Demonstrates Steady Trajectory", "source": "Moneycontrol", "date": "2026-08-14 12:30", "url": "https://www.moneycontrol.com/news/business/hdfc-bank"},
        {"title": "Net Interest Margins Stabilize with Healthy Asset Quality", "source": "Business Standard", "date": "2026-08-13 11:15", "url": "https://www.business-standard.com/finance/hdfc-bank"}
    ]
}


class FallbackBenchmarkNewsProvider(BaseNewsProvider):
    """
    Deterministic offline news provider strictly for test suite execution and offline demo mode.
    """

    def get_provider_name(self) -> str:
        return "Deterministic Offline Benchmark Feed"

    def get_news(self, symbol: str) -> List[NewsArticle]:
        sym_clean = symbol.strip().upper()
        raw_list = BENCHMARK_HEADLINES.get(sym_clean, [
            {"title": f"{sym_clean} Corporate Operations and Strategy Update", "source": "Financial Archive", "date": "2026-08-14 10:00", "url": f"https://example.com/{sym_clean.lower()}"}
        ])

        articles = []
        for idx, item in enumerate(raw_list):
            title = item["title"]
            sentiment_class, score, conf = FinancialSentimentAnalyzer.analyze_text(title)
            articles.append(NewsArticle(
                id=f"benchmark-{sym_clean.lower()}-{idx+1}",
                symbol=sym_clean,
                headline=title,
                summary=f"Historical benchmark documentation for {sym_clean}.",
                source=item["source"],
                url=item["url"],
                published_at=item["date"],
                provider="Offline Benchmark Archive",
                sentiment=sentiment_class,
                sentiment_score=score,
                confidence=conf
            ))
        return articles

    def search_news(self, query: str) -> List[NewsArticle]:
        return self.get_news("GENERAL")
