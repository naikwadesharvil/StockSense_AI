"""
StockSense AI V2 - FastAPI Main Application
Production REST API supporting Ridge, XGBoost, LSTM models,
model benchmarking comparison, data quality lineage, Swagger OpenAPI, and TTL caching.
"""

from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any

from backend.config import settings
from backend.services.stock_data import StockDataService
from backend.services.indicators import IndicatorService
from backend.services.forecast_service import ForecastService
from backend.services.sentiment_service import SentimentService
from backend.services.comparison_service import ComparisonService
from backend.services.cache_service import cache_manager, get_current_ist_timestamp

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Intelligent Stock Forecasting & Multi-Model Market Analytics API (Ridge, XGBoost, LSTM, Walk-Forward Validation, TreeSHAP, TTL Caching)."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "2.0.0",
        "supported_models": ["ridge", "xgboost", "lstm", "validation_selected"],
        "status": "online",
        "docs_url": "/docs",
        "updated_at_ist": get_current_ist_timestamp(),
        "disclaimer": "StockSense AI is an educational machine-learning platform. All forecasts are statistical model estimates and not financial advice."
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "stocksense-ai-backend",
        "version": "2.0.0",
        "timestamp_ist": get_current_ist_timestamp(),
        "cache_stats": cache_manager.get_all_stats()
    }

@app.get("/api/stocks/search")
def search_stocks(q: str = Query("", description="Stock name, symbol, or market sector")):
    return StockDataService.search_stocks(q)

@app.get("/api/stocks/{symbol}")
def get_stock_overview(symbol: str):
    try:
        return StockDataService.get_stock_overview(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/data/quality/{symbol}")
def get_data_quality(symbol: str):
    try:
        return StockDataService.get_data_quality_report(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/stocks/{symbol}/history")
def get_stock_history(symbol: str, timeframe: str = Query("1Y", regex="^(1D|5D|1M|3M|6M|1Y|5Y)$")):
    try:
        df = StockDataService.get_historical_data(symbol, timeframe=timeframe)
        return {
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "data_points": len(df),
            "historical_data": df.to_dict(orient="records"),
            "updated_at_ist": get_current_ist_timestamp()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/stocks/{symbol}/indicators")
def get_stock_indicators(symbol: str, timeframe: str = Query("1Y")):
    try:
        df = StockDataService.get_historical_data(symbol, timeframe=timeframe)
        return IndicatorService.compute_all_indicators(df)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/model/comparison/{symbol}")
def get_model_comparison(symbol: str):
    try:
        return ForecastService.get_model_comparison(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model comparison error: {str(e)}")

@app.get("/api/forecast/{symbol}")
def get_stock_forecast(symbol: str, model: str = Query("validation_selected", description="Model: ridge | xgboost | lstm | validation_selected")):
    try:
        return ForecastService.get_forecast(symbol, model_type=model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@app.post("/api/forecast")
def post_stock_forecast(payload: Dict[str, Any] = Body(...)):
    symbol = payload.get("symbol", "AAPL")
    model_type = payload.get("model_type", "validation_selected")
    return get_stock_forecast(symbol, model=model_type)

@app.get("/api/model/performance/{symbol}")
def get_model_performance(symbol: str, model: str = Query("validation_selected")):
    try:
        return ForecastService.get_model_performance(symbol, model_type=model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news/{symbol}")
def get_stock_news_sentiment(symbol: str):
    try:
        return SentimentService.get_stock_sentiment(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/compare")
def compare_stocks_get(symbols: str = Query(..., description="Comma-separated symbols, e.g. AAPL,MSFT,NVDA"), timeframe: str = Query("6M")):
    sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
    try:
        return ComparisonService.compare_stocks(sym_list, timeframe=timeframe)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/compare")
def compare_stocks_post(payload: Dict[str, Any] = Body(...)):
    symbols = payload.get("symbols", ["AAPL", "MSFT"])
    timeframe = payload.get("timeframe", "6M")
    try:
        return ComparisonService.compare_stocks(symbols, timeframe=timeframe)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
