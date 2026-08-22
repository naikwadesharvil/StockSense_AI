"""
StockSense AI - Payment Provider Factory
Instantiates the appropriate payment provider (Stripe, Razorpay, or Sandbox Mock).
"""

import os
from typing import Optional

from backend.services.payments.base import BasePaymentProvider
from backend.services.payments.stripe_provider import StripePaymentProvider
from backend.services.payments.razorpay_provider import RazorpayPaymentProvider
from backend.services.payments.mock_sandbox_provider import MockSandboxPaymentProvider


def get_payment_provider(provider_name: Optional[str] = None) -> BasePaymentProvider:
    """
    Returns the configured payment provider instance.
    Defaults to 'stripe' or configured system default.
    Raises ValueError if an unsupported provider name is specified.
    """
    p_name = (provider_name or os.getenv("DEFAULT_PAYMENT_PROVIDER", "stripe")).strip().lower()

    if p_name == "stripe":
        return StripePaymentProvider()
    elif p_name == "razorpay":
        return RazorpayPaymentProvider()
    elif p_name in ["sandbox", "mock", "sandbox_mock", "stripe_sandbox", "razorpay_sandbox"]:
        return MockSandboxPaymentProvider()

    raise ValueError(f"Unsupported payment provider '{p_name}'. Supported providers: stripe, razorpay, sandbox_mock")
