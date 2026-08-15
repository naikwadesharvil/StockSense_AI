"""
StockSense AI - Subscription Plans, Entitlements & Idempotency Manager
Defines centralized subscription plans and manages user access tiers,
subscription state transitions, and webhook event deduplication.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import threading

from backend.services.payments.models import (
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionRecord,
    WebhookEventResult
)

# Centralized Subscription Plan Registry
SUBSCRIPTION_PLANS: Dict[str, SubscriptionPlan] = {
    "free": SubscriptionPlan(
        plan_id="free",
        display_name="Free Explorer",
        description="Fundamental market exploration and educational baseline forecasting.",
        price_usd=0.0,
        price_inr=0.0,
        billing_interval="month",
        features=[
          "Core 8 benchmark equities",
          "1-Day & 5-Day ML forecast horizons",
          "Quantitative indicators (SMA, RSI, MACD, BB)",
          "5 watchlist securities",
          "NLP sentiment headline polarity"
        ],
        max_watchlist_items=5,
        allowed_forecast_horizons=["1d", "5d"],
        access_advanced_models=False,
        access_full_universe=False
    ),
    "pro": SubscriptionPlan(
        plan_id="pro",
        display_name="Pro Trader",
        description="Expanded global equity universe, full multi-horizon forecasting, and real-time news analytics.",
        price_usd=29.0,
        price_inr=2400.0,
        billing_interval="month",
        features=[
          "Full 36+ US & Indian equity universe",
          "All forecast horizons (1d, 5d, 10d, 30d)",
          "Multi-model engine (Ridge, GBDT, LSTM comparisons)",
          "Real-time external news feeds & sentiment analysis",
          "25 watchlist securities",
          "Out-of-sample backtesting & error metrics"
        ],
        max_watchlist_items=25,
        allowed_forecast_horizons=["1d", "5d", "10d", "30d"],
        access_advanced_models=True,
        access_full_universe=True
    ),
    "premium": SubscriptionPlan(
        plan_id="premium",
        display_name="Institutional Elite",
        description="Complete quantitative suite with unlimited watchlist tracking and portfolio correlation matrices.",
        price_usd=79.0,
        price_inr=6500.0,
        billing_interval="month",
        features=[
          "Everything in Pro",
          "Unlimited watchlist securities",
          "Multi-stock correlation heatmap & normalization",
          "Full company valuation & fundamental metrics suite",
          "Custom risk interval parameter tuning",
          "Priority real-time market data feed allocation"
        ],
        max_watchlist_items=100,
        allowed_forecast_horizons=["1d", "5d", "10d", "30d"],
        access_advanced_models=True,
        access_full_universe=True
    )
}


class EntitlementManager:
    """
    Thread-safe subscription entitlement and webhook idempotency store.
    """

    _lock = threading.Lock()
    _user_subscriptions: Dict[str, SubscriptionRecord] = {}
    _processed_events: Dict[str, datetime] = {}

    @classmethod
    def get_all_plans(cls) -> List[SubscriptionPlan]:
        return list(SUBSCRIPTION_PLANS.values())

    @classmethod
    def get_plan(cls, plan_id: str) -> Optional[SubscriptionPlan]:
        return SUBSCRIPTION_PLANS.get(plan_id.lower())

    @classmethod
    def is_event_processed(cls, event_id: str) -> bool:
        with cls._lock:
            return event_id in cls._processed_events

    @classmethod
    def record_processed_event(cls, event_id: str):
        with cls._lock:
            cls._processed_events[event_id] = datetime.utcnow()

    @classmethod
    def get_user_subscription(cls, user_id: str = "default_user") -> SubscriptionRecord:
        with cls._lock:
            if user_id in cls._user_subscriptions:
                sub = cls._user_subscriptions[user_id]
                # Check for automatic expiry
                try:
                    end_dt = datetime.fromisoformat(sub.current_period_end)
                    if datetime.utcnow() > end_dt and sub.status == SubscriptionStatus.ACTIVE:
                        sub.status = SubscriptionStatus.EXPIRED
                except Exception:
                    pass
                return sub

            # Default Free Tier Record
            free_sub = SubscriptionRecord(
                subscription_id="sub_free_default",
                user_id=user_id,
                plan_id="free",
                provider="internal",
                status=SubscriptionStatus.ACTIVE,
                currency="USD",
                amount=0.0,
                current_period_start=datetime.utcnow().isoformat(),
                current_period_end=(datetime.utcnow() + timedelta(days=3650)).isoformat()
            )
            cls._user_subscriptions[user_id] = free_sub
            return free_sub

    @classmethod
    def update_subscription(
        cls,
        user_id: str,
        plan_id: str,
        provider: str,
        subscription_id: str,
        status: SubscriptionStatus,
        currency: str,
        amount: float,
        duration_days: int = 30,
        event_id: Optional[str] = None
    ) -> SubscriptionRecord:
        with cls._lock:
            if event_id and event_id in cls._processed_events:
                # Idempotency guard: directly return existing record without re-locking
                if user_id in cls._user_subscriptions:
                    return cls._user_subscriptions[user_id]
                free_sub = SubscriptionRecord(
                    subscription_id="sub_free_default",
                    user_id=user_id,
                    plan_id="free",
                    provider="internal",
                    status=SubscriptionStatus.ACTIVE,
                    currency="USD",
                    amount=0.0,
                    current_period_start=datetime.utcnow().isoformat(),
                    current_period_end=(datetime.utcnow() + timedelta(days=3650)).isoformat()
                )
                cls._user_subscriptions[user_id] = free_sub
                return free_sub

            now = datetime.utcnow()
            record = SubscriptionRecord(
                subscription_id=subscription_id,
                user_id=user_id,
                plan_id=plan_id,
                provider=provider,
                status=status,
                currency=currency,
                amount=amount,
                current_period_start=now.isoformat(),
                current_period_end=(now + timedelta(days=duration_days)).isoformat(),
                last_event_id=event_id
            )
            cls._user_subscriptions[user_id] = record

            if event_id:
                cls._processed_events[event_id] = now

            return record

    @classmethod
    def cancel_subscription(cls, user_id: str = "default_user") -> bool:
        with cls._lock:
            if user_id in cls._user_subscriptions:
                sub = cls._user_subscriptions[user_id]
                sub.status = SubscriptionStatus.CANCELED
                sub.cancel_at_period_end = True
                return True
            return False

    @classmethod
    def check_entitlement(cls, user_id: str, feature: str) -> bool:
        """
        Validates whether user has access to a specific feature flag based on their active plan.
        """
        sub = cls.get_user_subscription(user_id)
        if sub.status != SubscriptionStatus.ACTIVE and sub.status != SubscriptionStatus.TRIALING:
            plan = SUBSCRIPTION_PLANS["free"]
        else:
            plan = SUBSCRIPTION_PLANS.get(sub.plan_id, SUBSCRIPTION_PLANS["free"])

        if feature == "full_universe":
            return plan.access_full_universe
        elif feature == "advanced_models":
            return plan.access_advanced_models
        elif feature == "horizon_30d":
            return "30d" in plan.allowed_forecast_horizons
        return True
