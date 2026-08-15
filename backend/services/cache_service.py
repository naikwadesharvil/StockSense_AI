"""
StockSense AI V2 - High-Performance In-Memory TTL Cache Service
Thread-safe, partitioned TTL cache manager for market data, indicators,
model comparisons, forecasts, and multi-stock analytics.
"""

import time
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Callable

# Indian Standard Time (IST) is UTC+5:30
IST_OFFSET = timezone(timedelta(hours=5, minutes=30))

def get_current_ist_timestamp() -> str:
    """Returns current formatted Indian Standard Time (IST) timestamp."""
    return datetime.now(IST_OFFSET).strftime("%H:%M:%S IST")

def get_current_ist_datetime() -> str:
    """Returns full formatted IST date and time string."""
    return datetime.now(IST_OFFSET).strftime("%Y-%m-%d %H:%M:%S IST")


class TTLCache:
    """Thread-safe generic TTL in-memory cache partition."""
    def __init__(self, default_ttl_seconds: int = 300, max_entries: int = 256):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl_seconds
        self.max_entries = max_entries
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self.misses += 1
                return None
            if time.time() > entry["expires_at"]:
                del self._cache[key]
                self.misses += 1
                return None
            self.hits += 1
            return entry["data"]

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        with self._lock:
            # Evict oldest entry if capacity reached
            if len(self._cache) >= self.max_entries and key not in self._cache:
                oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k]["created_at"])
                del self._cache[oldest_key]

            now = time.time()
            self._cache[key] = {
                "data": value,
                "created_at": now,
                "expires_at": now + ttl,
                "cached_at_ist": get_current_ist_timestamp()
            }

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            total = self.hits + self.misses
            hit_ratio = (self.hits / total * 100.0) if total > 0 else 0.0
            return {
                "entries": len(self._cache),
                "hits": self.hits,
                "misses": self.misses,
                "hit_ratio_pct": round(hit_ratio, 2)
            }


class CacheManager:
    """Centralized partitioned cache manager for StockSense AI V2."""
    
    # TTL Definitions (in seconds):
    # Historical data: 30 mins for historical archive, 5 mins for live feeds
    HISTORICAL_ARCHIVE_TTL = 1800
    HISTORICAL_LIVE_TTL = 300
    
    # Technical Indicators: 5 mins
    INDICATORS_TTL = 300
    
    # Stock Overview: 5 mins for archive, 1 min for live
    OVERVIEW_ARCHIVE_TTL = 300
    OVERVIEW_LIVE_TTL = 60
    
    # Model Comparison & Validation Evidence: 30 mins
    MODEL_COMPARISON_TTL = 1800
    
    # Forecast Projections & Intervals: 15 mins
    FORECAST_TTL = 900
    
    # News & NLP Sentiment: 15 mins
    SENTIMENT_TTL = 900
    
    # Multi-Stock Comparison: 15 mins
    COMPARISON_TTL = 900

    # Company Fundamentals & Balance Sheet Metrics: 12 hours
    FUNDAMENTALS_TTL = 43200

    def __init__(self):
        self.historical_cache = TTLCache(default_ttl_seconds=self.HISTORICAL_ARCHIVE_TTL)
        self.indicators_cache = TTLCache(default_ttl_seconds=self.INDICATORS_TTL)
        self.overview_cache = TTLCache(default_ttl_seconds=self.OVERVIEW_ARCHIVE_TTL)
        self.fundamentals_cache = TTLCache(default_ttl_seconds=self.FUNDAMENTALS_TTL)
        self.model_comparison_cache = TTLCache(default_ttl_seconds=self.MODEL_COMPARISON_TTL)
        self.forecast_cache = TTLCache(default_ttl_seconds=self.FORECAST_TTL)
        self.sentiment_cache = TTLCache(default_ttl_seconds=self.SENTIMENT_TTL)
        self.comparison_cache = TTLCache(default_ttl_seconds=self.COMPARISON_TTL)

    def get_or_compute(self, cache: TTLCache, key: str, compute_fn: Callable[[], Any], ttl_seconds: Optional[int] = None) -> Any:
        """Retrieves cached value or executes compute_fn, caches result, and returns it."""
        cached_val = cache.get(key)
        if cached_val is not None:
            return cached_val
        
        result = compute_fn()
        cache.set(key, result, ttl_seconds=ttl_seconds)
        return result

    def get_all_stats(self) -> Dict[str, Any]:
        return {
            "historical": self.historical_cache.get_stats(),
            "indicators": self.indicators_cache.get_stats(),
            "overview": self.overview_cache.get_stats(),
            "model_comparison": self.model_comparison_cache.get_stats(),
            "forecast": self.forecast_cache.get_stats(),
            "sentiment": self.sentiment_cache.get_stats(),
            "comparison": self.comparison_cache.get_stats()
        }

    def clear_all(self) -> None:
        self.historical_cache.clear()
        self.indicators_cache.clear()
        self.overview_cache.clear()
        self.model_comparison_cache.clear()
        self.forecast_cache.clear()
        self.sentiment_cache.clear()
        self.comparison_cache.clear()

# Global Singleton Cache Instance
cache_manager = CacheManager()
