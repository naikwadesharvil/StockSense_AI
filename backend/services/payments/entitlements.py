"""
StockSense AI - Subscription Plans, Entitlements & Idempotency Manager
Defines centralized subscription plans and manages user access tiers,
subscription state transitions, and webhook event deduplication.

ARCHITECTURE & PERSISTENCE NOTICE:
----------------------------------
The default store provided in this module is `InMemoryEntitlementStore`, which is
designed for local development, integration tests, and sandbox demonstrations.
In a multi-instance or serverless deployment (e.g. Vercel Serverless / AWS Lambda),
in-memory state is ephemeral and NOT shared or durable across separate function instances.

For production real-money payment launches with durable cross-instance state:
Implement a database-backed adapter (e.g., PostgreSQL, Redis, DynamoDB) implementing
`BaseEntitlementStore` and configure `EntitlementManager.set_store(...)`.
"""

from abc import ABC, abstractmethod
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


class BaseEntitlementStore(ABC):
    """
    Abstract storage adapter interface for user subscriptions and webhook idempotency events.
    """

    @abstractmethod
    def get_subscription(self, user_id: str) -> Optional[SubscriptionRecord]:
        pass

    @abstractmethod
    def save_subscription(self, user_id: str, record: SubscriptionRecord) -> None:
        pass

    @abstractmethod
    def is_event_processed(self, event_id: str) -> bool:
        pass

    @abstractmethod
    def record_processed_event(self, event_id: str) -> None:
        pass

    @abstractmethod
    def clear_all(self) -> None:
        """Clears all stored records (useful for test teardowns)."""
        pass


# Explicit alias for architecture clarity
EntitlementStoreInterface = BaseEntitlementStore


class InMemoryEntitlementStore(BaseEntitlementStore):
    """
    Thread-safe in-memory entitlement and idempotency store.
    Notice: Ephemeral across serverless containers and process restarts.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._user_subscriptions: Dict[str, SubscriptionRecord] = {}
        self._processed_events: Dict[str, datetime] = {}

    def get_subscription(self, user_id: str) -> Optional[SubscriptionRecord]:
        with self._lock:
            return self._user_subscriptions.get(user_id)

    def save_subscription(self, user_id: str, record: SubscriptionRecord) -> None:
        with self._lock:
            self._user_subscriptions[user_id] = record

    def is_event_processed(self, event_id: str) -> bool:
        with self._lock:
            return event_id in self._processed_events

    def record_processed_event(self, event_id: str) -> None:
        with self._lock:
            self._processed_events[event_id] = datetime.utcnow()

    def clear_all(self) -> None:
        with self._lock:
            self._user_subscriptions.clear()
            self._processed_events.clear()


def get_default_entitlement_store() -> BaseEntitlementStore:
    """
    Instantiates and returns the appropriate entitlement store based on environment variables.
    If database credentials (Supabase/PostgreSQL) are present, returns PostgresSupabaseEntitlementStore.
    If in production mode (APP_ENV=production) without credentials, raises PersistenceConfigurationError.
    Otherwise defaults to InMemoryEntitlementStore for local testing/sandbox.
    """
    import os
    from backend.services.payments.supabase_store import (
        PostgresSupabaseEntitlementStore,
        PersistenceConfigurationError
    )

    persistence_mode = os.getenv("PAYMENT_PERSISTENCE", "").strip().lower()
    app_env = os.getenv("APP_ENV", "development").strip().lower()
    require_persistence = (
        os.getenv("REQUIRE_PERSISTENCE", "false").strip().lower() == "true"
        or app_env == "production"
        or persistence_mode in ["postgres", "postgresql", "supabase"]
    )

    has_supabase = bool(os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
    has_postgres = bool(os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("SUPABASE_DB_URL"))

    if has_supabase or has_postgres:
        return PostgresSupabaseEntitlementStore(raise_if_unconfigured=require_persistence)
    elif require_persistence:
        return PostgresSupabaseEntitlementStore(raise_if_unconfigured=True)
    else:
        return InMemoryEntitlementStore()


class EntitlementManager:
    """
    Subscription entitlement and webhook idempotency manager.
    Delegates to a configured BaseEntitlementStore instance (defaults to InMemoryEntitlementStore).
    """

    _store: BaseEntitlementStore = InMemoryEntitlementStore()
    _user_subscriptions: Dict[str, SubscriptionRecord] = _store._user_subscriptions
    _processed_events: Dict[str, datetime] = _store._processed_events

    @classmethod
    def set_store(cls, store: BaseEntitlementStore) -> None:
        """Configures a custom backing store (e.g. persistent DB store for production)."""
        cls._store = store
        if isinstance(store, InMemoryEntitlementStore):
            cls._user_subscriptions = store._user_subscriptions
            cls._processed_events = store._processed_events

    @classmethod
    def clear_all(cls) -> None:
        """Clears all stored records (useful for test isolation)."""
        cls._store.clear_all()

    @classmethod
    def get_store(cls) -> BaseEntitlementStore:
        return cls._store

    @classmethod
    def get_all_plans(cls) -> List[SubscriptionPlan]:
        return list(SUBSCRIPTION_PLANS.values())

    @classmethod
    def get_plan(cls, plan_id: str) -> Optional[SubscriptionPlan]:
        return SUBSCRIPTION_PLANS.get(plan_id.lower())

    @classmethod
    def is_event_processed(cls, event_id: str) -> bool:
        return cls._store.is_event_processed(event_id)

    @classmethod
    def record_processed_event(cls, event_id: str):
        cls._store.record_processed_event(event_id)

    @classmethod
    def get_user_subscription(cls, user_id: str = "default_user") -> SubscriptionRecord:
        sub = cls._store.get_subscription(user_id)
        if sub is not None:
            # Check for automatic expiry
            try:
                end_dt = datetime.fromisoformat(sub.current_period_end)
                if datetime.utcnow() > end_dt and sub.status == SubscriptionStatus.ACTIVE:
                    sub.status = SubscriptionStatus.EXPIRED
                    cls._store.save_subscription(user_id, sub)
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
        cls._store.save_subscription(user_id, free_sub)
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
        if event_id and cls._store.is_event_processed(event_id):
            # Idempotency guard: directly return existing record
            existing = cls._store.get_subscription(user_id)
            if existing is not None:
                return existing
            return cls.get_user_subscription(user_id)

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
        cls._store.save_subscription(user_id, record)

        if event_id:
            cls._store.record_processed_event(event_id)

        return record

    @classmethod
    def cancel_subscription(cls, user_id: str = "default_user") -> bool:
        sub = cls._store.get_subscription(user_id)
        if sub is not None:
            sub.status = SubscriptionStatus.CANCELED
            sub.cancel_at_period_end = True
            cls._store.save_subscription(user_id, sub)
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
