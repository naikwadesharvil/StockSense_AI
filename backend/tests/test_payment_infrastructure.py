"""
StockSense AI - Payment & Subscription Infrastructure Unit Tests
Validates plan configurations, entitlement state machine, webhook HMAC signatures,
idempotency guarantees, and unconfigured safety guards.
"""

import unittest
import hmac
import hashlib
import json
import time

from backend.services.payments.models import (
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionRecord,
    WebhookEventResult
)
from backend.services.payments.entitlements import (
    SUBSCRIPTION_PLANS,
    EntitlementManager
)
from backend.services.payments.stripe_provider import StripePaymentProvider
from backend.services.payments.razorpay_provider import RazorpayPaymentProvider
from backend.services.payments.mock_sandbox_provider import MockSandboxPaymentProvider
from backend.services.payments.factory import get_payment_provider


class TestPaymentInfrastructure(unittest.TestCase):

    def setUp(self):
        # Reset entitlement manager state
        EntitlementManager._user_subscriptions.clear()
        EntitlementManager._processed_events.clear()

    def test_subscription_plans_configured(self):
        """Verifies Free, Pro, and Premium plans exist with correct pricing in USD & INR."""
        self.assertIn("free", SUBSCRIPTION_PLANS)
        self.assertIn("pro", SUBSCRIPTION_PLANS)
        self.assertIn("premium", SUBSCRIPTION_PLANS)

        free = SUBSCRIPTION_PLANS["free"]
        self.assertEqual(free.price_usd, 0.0)
        self.assertEqual(free.price_inr, 0.0)
        self.assertFalse(free.access_full_universe)

        pro = SUBSCRIPTION_PLANS["pro"]
        self.assertEqual(pro.price_usd, 29.0)
        self.assertEqual(pro.price_inr, 2400.0)
        self.assertTrue(pro.access_full_universe)
        self.assertTrue(pro.access_advanced_models)

        premium = SUBSCRIPTION_PLANS["premium"]
        self.assertEqual(premium.price_usd, 79.0)
        self.assertEqual(premium.price_inr, 6500.0)
        self.assertEqual(premium.max_watchlist_items, 100)

    def test_default_user_entitlement(self):
        """Verifies default user starts with Free plan entitlement."""
        sub = EntitlementManager.get_user_subscription("test_user_1")
        self.assertEqual(sub.plan_id, "free")
        self.assertEqual(sub.status, SubscriptionStatus.ACTIVE)
        self.assertFalse(EntitlementManager.check_entitlement("test_user_1", "full_universe"))

    def test_subscription_upgrade_and_state_machine(self):
        """Verifies upgrading subscription unlocks entitlements and handles state transitions."""
        EntitlementManager.update_subscription(
            user_id="test_user_2",
            plan_id="pro",
            provider="stripe",
            subscription_id="sub_test_pro_123",
            status=SubscriptionStatus.ACTIVE,
            currency="USD",
            amount=29.0,
            event_id="evt_001"
        )

        sub = EntitlementManager.get_user_subscription("test_user_2")
        self.assertEqual(sub.plan_id, "pro")
        self.assertEqual(sub.status, SubscriptionStatus.ACTIVE)
        self.assertTrue(EntitlementManager.check_entitlement("test_user_2", "full_universe"))
        self.assertTrue(EntitlementManager.check_entitlement("test_user_2", "advanced_models"))

        # Test cancellation
        success = EntitlementManager.cancel_subscription("test_user_2")
        self.assertTrue(success)
        sub_canceled = EntitlementManager.get_user_subscription("test_user_2")
        self.assertEqual(sub_canceled.status, SubscriptionStatus.CANCELED)

    def test_webhook_idempotency(self):
        """Verifies duplicate webhook events are recognized and not double-processed."""
        event_id = "evt_duplicate_test_123"
        self.assertFalse(EntitlementManager.is_event_processed(event_id))

        EntitlementManager.update_subscription(
            user_id="user_idem",
            plan_id="premium",
            provider="stripe",
            subscription_id="sub_prem_1",
            status=SubscriptionStatus.ACTIVE,
            currency="USD",
            amount=79.0,
            event_id=event_id
        )

        self.assertTrue(EntitlementManager.is_event_processed(event_id))

        # Re-applying same event should be idempotent
        sub = EntitlementManager.update_subscription(
            user_id="user_idem",
            plan_id="premium",
            provider="stripe",
            subscription_id="sub_prem_1",
            status=SubscriptionStatus.ACTIVE,
            currency="USD",
            amount=79.0,
            event_id=event_id
        )
        self.assertEqual(sub.subscription_id, "sub_prem_1")

    def test_unconfigured_stripe_provider_guard(self):
        """Verifies unconfigured Stripe provider raises PAYMENTS_NOT_CONFIGURED and rejects checkout."""
        provider = StripePaymentProvider(secret_key="", webhook_secret="")
        self.assertFalse(provider.is_configured())

        pro_plan = SUBSCRIPTION_PLANS["pro"]
        with self.assertRaises(RuntimeError) as ctx:
            provider.create_checkout_session(
                plan=pro_plan,
                user_id="u1",
                currency="USD",
                success_url="http://localhost/success",
                cancel_url="http://localhost/cancel"
            )
        self.assertIn("PAYMENTS_NOT_CONFIGURED", str(ctx.exception))

    def test_unconfigured_razorpay_provider_guard(self):
        """Verifies unconfigured Razorpay provider raises PAYMENTS_NOT_CONFIGURED."""
        provider = RazorpayPaymentProvider(key_id="", key_secret="", webhook_secret="")
        self.assertFalse(provider.is_configured())

        pro_plan = SUBSCRIPTION_PLANS["pro"]
        with self.assertRaises(RuntimeError) as ctx:
            provider.create_checkout_session(
                plan=pro_plan,
                user_id="u1",
                currency="INR",
                success_url="http://localhost/success",
                cancel_url="http://localhost/cancel"
            )
        self.assertIn("PAYMENTS_NOT_CONFIGURED", str(ctx.exception))

    def test_stripe_webhook_signature_verification(self):
        """Verifies valid HMAC SHA256 Stripe signatures are accepted and invalid signatures rejected."""
        webhook_secret = "whsec_test_stripe_secret_key_456"
        provider = StripePaymentProvider(secret_key="sk_test_dummy", webhook_secret=webhook_secret)

        payload_dict = {
            "id": "evt_stripe_test_1",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_session_123",
                    "subscription": "sub_stripe_abc"
                }
            }
        }
        payload_bytes = json.dumps(payload_dict).encode('utf-8')
        t = str(int(time.time()))
        signed_payload = f"{t}.".encode("utf-8") + payload_bytes
        valid_sig = hmac.new(webhook_secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()

        # Valid signature
        headers = {"stripe-signature": f"t={t},v1={valid_sig}"}
        result = provider.verify_webhook(payload_bytes, headers)
        self.assertTrue(result.success)
        self.assertEqual(result.event_id, "evt_stripe_test_1")
        self.assertEqual(result.subscription_id, "sub_stripe_abc")

        # Forged/invalid signature
        invalid_headers = {"stripe-signature": f"t={t},v1=forged_signature_hex_12345"}
        bad_result = provider.verify_webhook(payload_bytes, invalid_headers)
        self.assertFalse(bad_result.success)
        self.assertIn("Invalid webhook signature", bad_result.message)

    def test_razorpay_webhook_signature_verification(self):
        """Verifies valid HMAC SHA256 Razorpay signatures are accepted and invalid rejected."""
        webhook_secret = "rzp_whsec_test_secret_789"
        provider = RazorpayPaymentProvider(key_id="rzp_test_123", key_secret="sec_123", webhook_secret=webhook_secret)

        payload_dict = {
            "id": "evt_rzp_test_1",
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_rzp_xyz",
                        "amount": 240000
                    }
                }
            }
        }
        payload_bytes = json.dumps(payload_dict).encode('utf-8')
        valid_sig = hmac.new(webhook_secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()

        # Valid signature
        headers = {"x-razorpay-signature": valid_sig}
        result = provider.verify_webhook(payload_bytes, headers)
        self.assertTrue(result.success)
        self.assertEqual(result.event_id, "evt_rzp_test_1")
        self.assertEqual(result.subscription_id, "pay_rzp_xyz")

        # Invalid signature
        bad_result = provider.verify_webhook(payload_bytes, {"x-razorpay-signature": "bad_sig_hex"})
        self.assertFalse(bad_result.success)
        self.assertIn("Invalid Razorpay signature", bad_result.message)

    def test_mock_sandbox_provider(self):
        """Verifies MockSandboxPaymentProvider generates test sessions and verifies mock signatures."""
        mock_prov = MockSandboxPaymentProvider()
        self.assertTrue(mock_prov.is_configured())

        plan = SUBSCRIPTION_PLANS["pro"]
        session = mock_prov.create_checkout_session(
            plan=plan,
            user_id="user_sandbox",
            currency="USD",
            success_url="http://localhost/success",
            cancel_url="http://localhost/cancel"
        )
        self.assertTrue(session.is_sandbox)
        self.assertIn("cs_test_pro", session.session_id)
        self.assertEqual(session.amount, 29.0)

    def test_payment_factory(self):
        """Verifies factory resolves correct provider instances."""
        p_stripe = get_payment_provider("stripe")
        self.assertIsInstance(p_stripe, StripePaymentProvider)

        p_rzp = get_payment_provider("razorpay")
        self.assertIsInstance(p_rzp, RazorpayPaymentProvider)

        p_mock = get_payment_provider("sandbox_mock")
        self.assertIsInstance(p_mock, MockSandboxPaymentProvider)


if __name__ == "__main__":
    unittest.main()
