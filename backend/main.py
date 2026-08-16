"""
StockSense AI V2 - FastAPI Main Application
Production REST API supporting Ridge, XGBoost, LSTM models,
model benchmarking comparison, data quality lineage, Swagger OpenAPI, and TTL caching.
Supports both Vercel Serverless Function routing (sub-path invocation) and standalone prefixed routing.
"""

from fastapi import FastAPI, APIRouter, Query, HTTPException, Body, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any

from backend.config import settings
from backend.services.stock_data import StockDataService
from backend.services.stock_registry import StockRegistry
from backend.services.indicators import IndicatorService
from backend.services.forecast_service import ForecastService
from backend.services.sentiment_service import SentimentService
from backend.services.comparison_service import ComparisonService
from backend.services.cache_service import cache_manager, get_current_ist_timestamp
from backend.services.nifty_service import NiftyService
from backend.services.payments import (
    SUBSCRIPTION_PLANS,
    EntitlementManager,
    get_payment_provider,
    StripePaymentProvider,
    RazorpayPaymentProvider,
    SubscriptionStatus
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Intelligent Stock Forecasting & Multi-Model Market Analytics API (Ridge, XGBoost, LSTM, Walk-Forward Validation, TreeSHAP, TTL Caching)."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()

import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIST = os.path.join(REPO_ROOT, "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/")
@app.get("/index.html")
def root():
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "name": settings.PROJECT_NAME,
        "version": "2.0.0",
        "supported_models": ["ridge", "xgboost", "lstm", "validation_selected"],
        "status": "online",
        "docs_url": "/docs",
        "updated_at_ist": get_current_ist_timestamp(),
        "disclaimer": "StockSense AI is an educational machine-learning platform. All forecasts are statistical model estimates and not financial advice."
    }

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "stocksense-ai-backend",
        "version": "2.0.0",
        "timestamp_ist": get_current_ist_timestamp(),
        "cache_stats": cache_manager.get_all_stats()
    }

@router.get("/search")
def unified_search(q: str = Query("", description="Stock name, symbol, or market sector")):
    results = StockRegistry.search(q)
    return {
        "query": q,
        "count": len(results),
        "results": [s.to_dict() for s in results]
    }

@router.get("/stocks/search")
def search_stocks(q: str = Query("", description="Stock name, symbol, or market sector")):
    results = StockRegistry.search(q)
    return [s.to_dict() for s in results]

@router.get("/stocks/{symbol}")
def get_stock_overview(symbol: str):
    try:
        return StockDataService.get_stock_overview(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/data/quality/{symbol}")
def get_data_quality(symbol: str):
    try:
        return StockDataService.get_data_quality_report(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stocks/{symbol}/history")
def get_stock_history(symbol: str, timeframe: str = Query("1Y", pattern="^(1D|5D|1M|3M|6M|1Y|5Y)$")):
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

@router.get("/stocks/{symbol}/indicators")
def get_stock_indicators(symbol: str, timeframe: str = Query("1Y")):
    try:
        df = StockDataService.get_historical_data(symbol, timeframe=timeframe)
        return IndicatorService.compute_all_indicators(df)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/model/comparison/{symbol}")
def get_model_comparison(symbol: str):
    try:
        return ForecastService.get_model_comparison(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model comparison error: {str(e)}")

@router.get("/forecast/{symbol}")
def get_stock_forecast(symbol: str, model: str = Query("validation_selected", description="Model: ridge | xgboost | lstm | validation_selected")):
    try:
        return ForecastService.get_forecast(symbol, model_type=model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@router.post("/forecast")
def post_stock_forecast(payload: Dict[str, Any] = Body(...)):
    symbol = payload.get("symbol", "AAPL")
    model_type = payload.get("model_type", "validation_selected")
    return get_stock_forecast(symbol, model=model_type)

@router.get("/model/performance/{symbol}")
def get_model_performance(symbol: str, model: str = Query("validation_selected")):
    try:
        return ForecastService.get_model_performance(symbol, model_type=model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/news/{symbol}")
def get_stock_news_sentiment(symbol: str):
    try:
        return SentimentService.get_stock_sentiment(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/compare")
def compare_stocks_get(symbols: str = Query(..., description="Comma-separated symbols, e.g. AAPL,MSFT,NVDA"), timeframe: str = Query("6M")):
    sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
    try:
        return ComparisonService.compare_stocks(sym_list, timeframe=timeframe)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/compare")
def compare_stocks_post(payload: Dict[str, Any] = Body(...)):
    symbols = payload.get("symbols", ["AAPL", "MSFT"])
    timeframe = payload.get("timeframe", "6M")
    try:
        return ComparisonService.compare_stocks(symbols, timeframe=timeframe)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# NIFTY 50 Trending Stocks Endpoint
@router.get("/stocks/trending/nifty50")
def get_nifty50_trending(refresh: bool = Query(False, description="Force cache refresh")):
    try:
        return NiftyService.get_trending_nifty50(force_refresh=refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch NIFTY 50 trending data: {str(e)}")

# Payment & Entitlement Endpoints
@router.get("/payments/plans")
def get_subscription_plans():
    plans = EntitlementManager.get_all_plans()
    return {
        "count": len(plans),
        "plans": [p.to_dict() for p in plans]
    }

@router.get("/payments/status")
def get_subscription_status(user_id: str = Query("default_user")):
    sub = EntitlementManager.get_user_subscription(user_id)
    return sub.to_dict()

@router.post("/payments/checkout")
def create_checkout(payload: Dict[str, Any] = Body(...)):
    plan_id = payload.get("plan_id", "pro").lower()
    provider_name = payload.get("provider", "stripe").lower()
    currency = payload.get("currency", "USD").upper()
    user_id = payload.get("user_id", "default_user")

    plan = EntitlementManager.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Invalid plan_id '{plan_id}'")

    try:
        provider = get_payment_provider(provider_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not provider.is_configured():
        return {
            "error": "PAYMENTS_NOT_CONFIGURED",
            "message": f"Payment provider '{provider.get_provider_name()}' credentials are not configured in this environment.",
            "is_configured": False,
            "provider": provider.get_provider_name()
        }

    try:
        success_url = payload.get("success_url", "http://localhost:8000/pricing?status=success")
        cancel_url = payload.get("cancel_url", "http://localhost:8000/pricing?status=canceled")
        session = provider.create_checkout_session(
            plan=plan,
            user_id=user_id,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url
        )
        return {
            "status": "success",
            "session": session.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout creation failed: {str(e)}")

@router.post("/payments/webhooks/stripe")
async def stripe_webhook(request: Request):
    provider = StripePaymentProvider()
    post_body = await request.body()
    headers_dict = dict(request.headers)
    result = provider.verify_webhook(post_body, headers_dict)
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)

    if result.status and result.subscription_id:
        user_id = result.user_id or "default_user"
        plan_id = result.plan_id or "pro"
        plan = EntitlementManager.get_plan(plan_id)
        amount = plan.price_usd if plan else 29.0
        EntitlementManager.update_subscription(
            user_id=user_id,
            plan_id=plan_id,
            provider="stripe",
            subscription_id=result.subscription_id,
            status=result.status,
            currency="USD",
            amount=amount,
            event_id=result.event_id
        )

    return {"received": True, "event_id": result.event_id}

@router.post("/payments/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    provider = RazorpayPaymentProvider()
    post_body = await request.body()
    headers_dict = dict(request.headers)
    result = provider.verify_webhook(post_body, headers_dict)
    if not result.success:
        raise HTTPException(status_code=400, detail=result.message)

    if result.status and result.subscription_id:
        user_id = result.user_id or "default_user"
        plan_id = result.plan_id or "pro"
        plan = EntitlementManager.get_plan(plan_id)
        amount = plan.price_inr if plan else 2400.0
        EntitlementManager.update_subscription(
            user_id=user_id,
            plan_id=plan_id,
            provider="razorpay",
            subscription_id=result.subscription_id,
            status=result.status,
            currency="INR",
            amount=amount,
            event_id=result.event_id
        )

    return {"received": True, "event_id": result.event_id}

# Mount the router under both prefix="" (for Vercel serverless /api dispatch)
# and prefix="/api" (for direct root calls or standard local proxies)
app.include_router(router, prefix="")
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
