"""
StockSense AI - API Request/Response Pydantic Schemas
"""

from typing import List, Dict, Any, Optional

# Dict-like schema helpers for FastAPI / OpenAPI documentation
class StockOverviewResponse:
    symbol: str
    name: str
    exchange: str
    currency: str
    currency_symbol: str
    sector: str
    current_price: float
    previous_close: float
    daily_change: float
    daily_change_pct: float
    volume: int
    market_cap: str
    week_52_high: float
    week_52_low: float

class ForecastHorizonDetail:
    horizon_days: int
    target_date: str
    current_price: float
    predicted_price: float
    expected_change_pct: float
    forecast_range_min: float
    forecast_range_max: float
    direction: str
    confidence_score: float

class ForecastResponse:
    symbol: str
    current_price: float
    horizons: Dict[str, Any]
    forecast_trajectory: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    feature_importance: List[Dict[str, Any]]
    disclaimer: str

class CompareRequest:
    symbols: List[str]
    timeframe: Optional[str] = "6M"
