"""
StockSense AI - Stripe Payment Provider Implementation
Implements Stripe Checkout session creation, HMAC SHA256 webhook signature validation,
and subscription lifecycle mapping.
"""

import os
import json
import hmac
import hashlib
import time
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional

from backend.services.payments.base import BasePaymentProvider
from backend.services.payments.models import (
    SubscriptionPlan,
    SubscriptionStatus,
    CheckoutSession,
    WebhookEventResult
)


class StripePaymentProvider(BasePaymentProvider):
    """
    Stripe payment integration with server-side signature validation and zero client-side secrets.
    """

    def __init__(
        self,
        secret_key: Optional[str] = None,
        webhook_secret: Optional[str] = None,
        tolerance_seconds: int = 300
    ):
        self.secret_key = secret_key or os.getenv("STRIPE_SECRET_KEY", "")
        self.webhook_secret = webhook_secret or os.getenv("STRIPE_WEBHOOK_SECRET", "")
        self.tolerance_seconds = tolerance_seconds

    def get_provider_name(self) -> str:
        return "stripe"

    def is_configured(self) -> bool:
        return bool(self.secret_key and self.secret_key.startswith("sk_"))

    def create_checkout_session(
        self,
        plan: SubscriptionPlan,
        user_id: str,
        currency: str,
        success_url: str,
        cancel_url: str
    ) -> CheckoutSession:
        if not self.is_configured():
            raise RuntimeError("PAYMENTS_NOT_CONFIGURED: Stripe API keys are not configured in environment.")

        curr_upper = currency.strip().upper()
        amount = plan.price_inr if curr_upper == "INR" else plan.price_usd
        unit_amount = int(amount * 100)  # In cents / paise

        params = {
            "mode": "subscription",
            "payment_method_types[]": "card",
            "line_items[0][price_data][currency]": curr_upper.lower(),
            "line_items[0][price_data][unit_amount]": str(unit_amount),
            "line_items[0][price_data][recurring][interval]": plan.billing_interval,
            "line_items[0][price_data][product_data][name]": f"StockSense AI — {plan.display_name}",
            "line_items[0][price_data][product_data][description]": plan.description,
            "line_items[0][quantity]": "1",
            "client_reference_id": user_id,
            "metadata[plan_id]": plan.plan_id,
            "metadata[user_id]": user_id,
            "success_url": f"{success_url}?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": cancel_url,
        }

        data = urllib.parse.urlencode(params).encode('utf-8')
        req = urllib.request.Request(
            "https://api.stripe.com/v1/checkout/sessions",
            data=data,
            headers={
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "StockSenseAI/2.0"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                return CheckoutSession(
                    session_id=res_data.get("id", ""),
                    provider="stripe",
                    plan_id=plan.plan_id,
                    currency=curr_upper,
                    amount=amount,
                    checkout_url=res_data.get("url"),
                    client_reference_id=user_id,
                    created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                )
        except Exception as e:
            raise RuntimeError(f"Stripe checkout creation failed: {e}")

    def verify_webhook(self, payload: bytes, headers: Dict[str, str]) -> WebhookEventResult:
        """
        Validates Stripe webhook signature header (t=...,v1=...) via HMAC-SHA256
        with strict timestamp validation and 300s replay tolerance protection.
        """
        sig_header = headers.get("stripe-signature") or headers.get("Stripe-Signature", "")
        if not sig_header:
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="stripe",
                success=False,
                message="Missing Stripe-Signature header"
            )

        if not self.webhook_secret:
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="stripe",
                success=False,
                message="Stripe webhook secret unconfigured on server"
            )

        # Parse signature elements
        sig_map = {}
        for item in sig_header.split(","):
            parts = item.split("=", 1)
            if len(parts) == 2:
                sig_map[parts[0].strip()] = parts[1].strip()

        timestamp = sig_map.get("t")
        expected_sig = sig_map.get("v1")

        if not timestamp or not expected_sig:
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="stripe",
                success=False,
                message="Malformed Stripe-Signature header"
            )

        # 1. Strict numeric timestamp parsing
        try:
            ts_int = int(timestamp)
        except (ValueError, TypeError):
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="stripe",
                success=False,
                message="Malformed non-numeric Stripe-Signature timestamp"
            )

        # 2. Timestamp tolerance / replay window check (default 300 seconds)
        current_time = int(time.time())
        time_diff = abs(current_time - ts_int)
        if time_diff > self.tolerance_seconds:
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="stripe",
                success=False,
                message=f"Webhook timestamp outside tolerance window ({time_diff}s > {self.tolerance_seconds}s)"
            )

        # 3. Recompute HMAC SHA256 over timestamp.payload
        signed_payload = f"{timestamp}.".encode("utf-8") + payload
        computed_sig = hmac.new(
            self.webhook_secret.encode("utf-8"),
            signed_payload,
            hashlib.sha256
        ).hexdigest()

        # 4. Constant-time signature comparison
        if not hmac.compare_digest(computed_sig, expected_sig):
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="stripe",
                success=False,
                message="Invalid webhook signature"
            )

        # Parse event JSON
        try:
            event = json.loads(payload.decode('utf-8'))
            event_id = event.get("id", "unknown")
            event_type = event.get("type", "")
            data_obj = event.get("data", {}).get("object", {})

            status = SubscriptionStatus.ACTIVE
            sub_id = data_obj.get("subscription") or data_obj.get("id")

            if event_type == "customer.subscription.deleted":
                status = SubscriptionStatus.CANCELED
            elif event_type == "invoice.payment_failed":
                status = SubscriptionStatus.PAST_DUE

            # Extract user and plan context
            metadata = data_obj.get("metadata", {})
            user_id = data_obj.get("client_reference_id") or metadata.get("user_id") or "default_user"
            plan_id = metadata.get("plan_id", "pro")

            return WebhookEventResult(
                event_id=event_id,
                event_type=event_type,
                provider="stripe",
                success=True,
                subscription_id=sub_id,
                status=status,
                message=f"Event {event_type} verified",
                user_id=user_id,
                plan_id=plan_id
            )
        except Exception as e:
            return WebhookEventResult(
                event_id="unknown",
                event_type="error",
                provider="stripe",
                success=False,
                message=f"Payload decode error: {e}"
            )
