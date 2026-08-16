"""
StockSense AI - Payment & Subscription Data Models
Defines immutable models for subscription plans, checkout sessions,
entitlements, and normalized subscription lifecycle states.
"""

from dataclasses import dataclass, asdict, field
from enum import Enum
from typing import Dict, List, Optional, Any


class SubscriptionStatus(str, Enum):
    INCOMPLETE = "INCOMPLETE"
    TRIALING = "TRIALING"
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELED = "CANCELED"
    EXPIRED = "EXPIRED"
    UNPAID = "UNPAID"


class PaymentProviderType(str, Enum):
    STRIPE = "stripe"
    RAZORPAY = "razorpay"
    SANDBOX_MOCK = "sandbox_mock"


@dataclass(frozen=True)
class SubscriptionPlan:
    plan_id: str
    display_name: str
    description: str
    price_usd: float
    price_inr: float
    billing_interval: str  # "month" | "year"
    features: List[str]
    max_watchlist_items: int
    allowed_forecast_horizons: List[str]
    access_advanced_models: bool
    access_full_universe: bool

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class CheckoutSession:
    session_id: str
    provider: str
    plan_id: str
    currency: str
    amount: float
    checkout_url: Optional[str] = None
    client_reference_id: Optional[str] = None
    created_at: Optional[str] = None
    expires_at: Optional[str] = None
    is_sandbox: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SubscriptionRecord:
    subscription_id: str
    user_id: str
    plan_id: str
    provider: str
    status: SubscriptionStatus
    currency: str
    amount: float
    current_period_start: str
    current_period_end: str
    cancel_at_period_end: bool = False
    customer_id: Optional[str] = None
    last_event_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["status"] = self.status.value
        return d


@dataclass
class WebhookEventResult:
    event_id: str
    event_type: str
    provider: str
    success: bool
    subscription_id: Optional[str] = None
    status: Optional[SubscriptionStatus] = None
    message: str = ""
    is_duplicate: bool = False
    user_id: Optional[str] = None
    plan_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        if self.status:
            d["status"] = self.status.value
        return d
