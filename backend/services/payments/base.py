"""
StockSense AI - Base Payment Provider Abstract Interface
Defines the standard contract for external payment gateways and checkout session creators.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from backend.services.payments.models import (
    SubscriptionPlan,
    CheckoutSession,
    WebhookEventResult,
    SubscriptionRecord
)


class BasePaymentProvider(ABC):
    """
    Abstract interface for payment service providers (Stripe, Razorpay, etc.).
    """

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the canonical provider name (e.g. 'stripe', 'razorpay')."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if valid API credentials are present in server environment."""
        pass

    @abstractmethod
    def create_checkout_session(
        self,
        plan: SubscriptionPlan,
        user_id: str,
        currency: str,
        success_url: str,
        cancel_url: str
    ) -> CheckoutSession:
        """
        Generates a secure external checkout session URL or order token.
        Never processes raw card data directly.
        """
        pass

    @abstractmethod
    def verify_webhook(self, payload: bytes, headers: Dict[str, str]) -> WebhookEventResult:
        """
        Cryptographically validates webhook signature and extracts subscription lifecycle event.
        """
        pass
