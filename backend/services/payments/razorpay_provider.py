"""
StockSense AI - Razorpay Payment Provider Implementation
Implements Razorpay payment link generation, HMAC SHA256 webhook validation,
and INR subscription support.
"""

import os
import json
import hmac
import hashlib
import time
import base64
import urllib.request
from typing import Dict, Any, Optional

from backend.services.payments.base import BasePaymentProvider
from backend.services.payments.models import (
    SubscriptionPlan,
    SubscriptionStatus,
    CheckoutSession,
    WebhookEventResult
)


class RazorpayPaymentProvider(BasePaymentProvider):
    """
    Razorpay payment gateway adapter with INR native support and HMAC signature verification.
    """

    def __init__(
        self,
        key_id: Optional[str] = None,
        key_secret: Optional[str] = None,
        webhook_secret: Optional[str] = None
    ):
        self.key_id = key_id or os.getenv("RAZORPAY_KEY_ID", "")
        self.key_secret = key_secret or os.getenv("RAZORPAY_KEY_SECRET", "")
        self.webhook_secret = webhook_secret or os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    def get_provider_name(self) -> str:
        return "razorpay"

    def is_configured(self) -> bool:
        return bool(self.key_id and self.key_secret and self.key_id.startswith("rzp_"))

    def create_checkout_session(
        self,
        plan: SubscriptionPlan,
        user_id: str,
        currency: str,
        success_url: str,
        cancel_url: str
    ) -> CheckoutSession:
        if not self.is_configured():
            raise RuntimeError("PAYMENTS_NOT_CONFIGURED: Razorpay API keys are not configured in environment.")

        curr = "INR" if currency.upper() == "INR" else "USD"
        amount = plan.price_inr if curr == "INR" else plan.price_usd
        amount_subunits = int(amount * 100)  # Paise

        payload = {
            "amount": amount_subunits,
            "currency": curr,
            "accept_partial": False,
            "description": f"StockSense AI — {plan.display_name} Subscription",
            "notes": {
                "user_id": user_id,
                "plan_id": plan.plan_id
            },
            "callback_url": success_url,
            "callback_method": "get"
        }

        auth_str = f"{self.key_id}:{self.key_secret}"
        b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')

        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            "https://api.razorpay.com/v1/payment_links",
            data=data,
            headers={
                "Authorization": f"Basic {b64_auth}",
                "Content-Type": "application/json",
                "User-Agent": "StockSenseAI/2.0"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                return CheckoutSession(
                    session_id=res_data.get("id", ""),
                    provider="razorpay",
                    plan_id=plan.plan_id,
                    currency=curr,
                    amount=amount,
                    checkout_url=res_data.get("short_url"),
                    client_reference_id=user_id,
                    created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                )
        except Exception as e:
            raise RuntimeError(f"Razorpay link creation failed: {e}")

    def verify_webhook(self, payload: bytes, headers: Dict[str, str]) -> WebhookEventResult:
        """
        Validates Razorpay webhook signature header via HMAC SHA256 over raw payload.
        """
        signature = headers.get("x-razorpay-signature") or headers.get("X-Razorpay-Signature", "")
        if not signature:
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="razorpay",
                success=False,
                message="Missing X-Razorpay-Signature header"
            )

        if not self.webhook_secret:
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="razorpay",
                success=False,
                message="Razorpay webhook secret unconfigured on server"
            )

        computed_sig = hmac.new(
            self.webhook_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(computed_sig, signature):
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="razorpay",
                success=False,
                message="Invalid Razorpay signature"
            )

        try:
            event = json.loads(payload.decode('utf-8'))
            event_id = event.get("id", "unknown")
            event_type = event.get("event", "")
            entity = event.get("payload", {}).get("payment", {}).get("entity", {})

            status = SubscriptionStatus.ACTIVE
            sub_id = entity.get("id") or event.get("payload", {}).get("subscription", {}).get("entity", {}).get("id")

            if "halted" in event_type or "cancelled" in event_type:
                status = SubscriptionStatus.CANCELED

            return WebhookEventResult(
                event_id=event_id,
                event_type=event_type,
                provider="razorpay",
                success=True,
                subscription_id=sub_id,
                status=status,
                message=f"Razorpay event {event_type} verified"
            )
        except Exception as e:
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="razorpay",
                success=False,
                message=f"Payload parsing error: {e}"
            )
