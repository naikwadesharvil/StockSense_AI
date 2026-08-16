"""
StockSense AI - Mock Sandbox Payment Provider
Deterministic, isolated mock payment provider strictly for unit testing and test coverage.
Does not process real payments or make network calls.
"""

import time
import hmac
import hashlib
import json
from typing import Dict, Any, Optional

from backend.services.payments.base import BasePaymentProvider
from backend.services.payments.models import (
    SubscriptionPlan,
    SubscriptionStatus,
    CheckoutSession,
    WebhookEventResult
)


class MockSandboxPaymentProvider(BasePaymentProvider):
    """
    Simulated sandbox payment provider for unit test validation.
    """

    def __init__(self, test_secret: str = "mock_secret_test_key_123"):
        self.test_secret = test_secret

    def get_provider_name(self) -> str:
        return "sandbox_mock"

    def is_configured(self) -> bool:
        return True

    def create_checkout_session(
        self,
        plan: SubscriptionPlan,
        user_id: str,
        currency: str,
        success_url: str,
        cancel_url: str
    ) -> CheckoutSession:
        curr = currency.upper()
        amount = plan.price_inr if curr == "INR" else plan.price_usd
        sess_id = f"cs_test_{plan.plan_id}_{int(time.time())}"

        return CheckoutSession(
            session_id=sess_id,
            provider="sandbox_mock",
            plan_id=plan.plan_id,
            currency=curr,
            amount=amount,
            checkout_url=f"https://sandbox.checkout.example.com/{sess_id}",
            client_reference_id=user_id,
            created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            is_sandbox=True
        )

    def verify_webhook(self, payload: bytes, headers: Dict[str, str]) -> WebhookEventResult:
        sig = headers.get("x-mock-signature", "")
        expected = hmac.new(self.test_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()

        if not sig or not hmac.compare_digest(sig, expected):
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="sandbox_mock",
                success=False,
                message="Invalid mock signature"
            )

        data = json.loads(payload.decode('utf-8'))
        return WebhookEventResult(
            event_id=data.get("id", "evt_test"),
            event_type=data.get("type", "checkout.completed"),
            provider="sandbox_mock",
            success=True,
            subscription_id=data.get("subscription_id", "sub_test_123"),
            status=SubscriptionStatus.ACTIVE,
            message="Mock webhook verified",
            user_id=data.get("user_id", "default_user"),
            plan_id=data.get("plan_id", "pro")
        )
