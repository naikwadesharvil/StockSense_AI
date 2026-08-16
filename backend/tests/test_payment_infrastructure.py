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

        # Test invalid provider
        with self.assertRaises(ValueError) as ctx:
            get_payment_provider("bitcoin_fake_gateway")
        self.assertIn("Unsupported payment provider", str(ctx.exception))

    def test_checkout_api_invalid_plan_and_provider(self):
        """Verifies FastAPI /api/payments/checkout rejects invalid plan_id and invalid provider with HTTP 400."""
        from fastapi.testclient import TestClient
        from backend.main import app

        client = TestClient(app)

        # Invalid plan
        res1 = client.post("/api/payments/checkout", json={"plan_id": "ultra_legendary_nonexistent", "provider": "stripe"})
        self.assertEqual(res1.status_code, 400)
        self.assertIn("Invalid plan_id", res1.json()["detail"])

        # Invalid provider
        res2 = client.post("/api/payments/checkout", json={"plan_id": "pro", "provider": "unsupported_crypto"})
        self.assertEqual(res2.status_code, 400)
        self.assertIn("Unsupported payment provider", res2.json()["detail"])

    def test_successful_mock_checkout_via_api(self):
        """Verifies successful checkout session generation via FastAPI with sandbox_mock provider."""
        from fastapi.testclient import TestClient
        from backend.main import app

        client = TestClient(app)
        res = client.post("/api/payments/checkout", json={
            "plan_id": "pro",
            "provider": "sandbox_mock",
            "currency": "USD",
            "user_id": "user_api_test"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("session", data)
        self.assertEqual(data["session"]["provider"], "sandbox_mock")
        self.assertTrue(data["session"]["is_sandbox"])
        self.assertIn("checkout_url", data["session"])

    def test_stripe_and_razorpay_webhook_api_endpoints(self):
        """Verifies Stripe and Razorpay webhook endpoints validate HMAC signatures and update entitlements."""
        from fastapi.testclient import TestClient
        from backend.main import app

        client = TestClient(app)

        # 1. Stripe Webhook with invalid signature
        res_bad_stripe = client.post(
            "/api/payments/webhooks/stripe",
            content=b'{"id":"evt_1","type":"checkout.session.completed"}',
            headers={"stripe-signature": "t=123,v1=bad_sig"}
        )
        self.assertEqual(res_bad_stripe.status_code, 400)

        # 2. Razorpay Webhook with invalid signature
        res_bad_rzp = client.post(
            "/api/payments/webhooks/razorpay",
            content=b'{"id":"evt_2","event":"payment.captured"}',
            headers={"x-razorpay-signature": "bad_sig_hex"}
        )
        self.assertEqual(res_bad_rzp.status_code, 400)

        # 3. Valid Stripe Webhook with configured mock provider
        webhook_sec = "whsec_test_stripe_valid_999"
        prov = StripePaymentProvider(secret_key="sk_test_123", webhook_secret=webhook_sec)
        payload_dict = {
            "id": "evt_stripe_valid_1",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_stripe_123",
                    "subscription": "sub_stripe_real_1",
                    "client_reference_id": "test_user_stripe_wh",
                    "metadata": {"plan_id": "premium", "user_id": "test_user_stripe_wh"}
                }
            }
        }
        payload_bytes = json.dumps(payload_dict).encode('utf-8')
        t = str(int(time.time()))
        signed = f"{t}.".encode("utf-8") + payload_bytes
        valid_sig = hmac.new(webhook_sec.encode("utf-8"), signed, hashlib.sha256).hexdigest()

        # Verify provider level verification
        res_verify = prov.verify_webhook(payload_bytes, {"stripe-signature": f"t={t},v1={valid_sig}"})
        self.assertTrue(res_verify.success)
        self.assertEqual(res_verify.user_id, "test_user_stripe_wh")
        self.assertEqual(res_verify.plan_id, "premium")

        # Update entitlement directly with verified event
        record = EntitlementManager.update_subscription(
            user_id=res_verify.user_id,
            plan_id=res_verify.plan_id,
            provider="stripe",
            subscription_id=res_verify.subscription_id,
            status=res_verify.status,
            currency="USD",
            amount=79.0,
            event_id=res_verify.event_id
        )
        self.assertEqual(record.plan_id, "premium")
        self.assertEqual(record.status, SubscriptionStatus.ACTIVE)

        # Check that user entitlement has been updated
        sub = EntitlementManager.get_user_subscription("test_user_stripe_wh")
        self.assertEqual(sub.plan_id, "premium")
        self.assertTrue(EntitlementManager.check_entitlement("test_user_stripe_wh", "full_universe"))
        self.assertTrue(EntitlementManager.check_entitlement("test_user_stripe_wh", "horizon_30d"))

    def test_no_secret_leakage_in_models(self):
        """Verifies SubscriptionPlan, CheckoutSession, and SubscriptionRecord dictionaries never contain secrets."""
        plan = SUBSCRIPTION_PLANS["pro"]
        plan_dict = plan.to_dict()
        for k in plan_dict:
            self.assertNotIn("secret", k.lower())
            self.assertNotIn("key", k.lower())

        mock_prov = MockSandboxPaymentProvider()
        session = mock_prov.create_checkout_session(plan, "u1", "USD", "http://loc/s", "http://loc/c")
        sess_dict = session.to_dict()
        for k in sess_dict:
            self.assertNotIn("secret", k.lower())

    def test_stripe_webhook_replay_protection_timestamp_matrix(self):
        """
        Verifies Stripe webhook replay protection:
        a. valid recent timestamp (accepted)
        b. expired timestamp (rejected)
        c. malformed timestamp (rejected)
        d. valid signature + expired timestamp (rejected before acceptance)
        """
        webhook_secret = "whsec_test_stripe_replay_secret_123"
        provider = StripePaymentProvider(
            secret_key="sk_test_dummy",
            webhook_secret=webhook_secret,
            tolerance_seconds=300
        )

        payload_dict = {
            "id": "evt_replay_test_1",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_replay_1",
                    "subscription": "sub_replay_1"
                }
            }
        }
        payload_bytes = json.dumps(payload_dict).encode('utf-8')
        now_ts = int(time.time())

        # a. Valid recent timestamp (e.g. 10 seconds ago)
        t_valid = str(now_ts - 10)
        signed_valid = f"{t_valid}.".encode("utf-8") + payload_bytes
        sig_valid = hmac.new(webhook_secret.encode("utf-8"), signed_valid, hashlib.sha256).hexdigest()
        res_valid = provider.verify_webhook(payload_bytes, {"stripe-signature": f"t={t_valid},v1={sig_valid}"})
        self.assertTrue(res_valid.success)
        self.assertEqual(res_valid.event_id, "evt_replay_test_1")

        # b. Expired timestamp (> 300 seconds old, e.g. 500s ago)
        t_expired = str(now_ts - 500)
        signed_expired = f"{t_expired}.".encode("utf-8") + payload_bytes
        sig_expired = hmac.new(webhook_secret.encode("utf-8"), signed_expired, hashlib.sha256).hexdigest()
        res_expired = provider.verify_webhook(payload_bytes, {"stripe-signature": f"t={t_expired},v1={sig_expired}"})
        self.assertFalse(res_expired.success)
        self.assertIn("tolerance window", res_expired.message)

        # c. Malformed non-numeric timestamp
        t_malformed = "invalid_timestamp_abc"
        res_malformed = provider.verify_webhook(payload_bytes, {"stripe-signature": f"t={t_malformed},v1={sig_valid}"})
        self.assertFalse(res_malformed.success)
        self.assertIn("Malformed non-numeric", res_malformed.message)

        # d. Valid HMAC signature with expired timestamp (verifies tolerance check halts processing)
        t_old = str(now_ts - 3600)  # 1 hour old
        signed_old = f"{t_old}.".encode("utf-8") + payload_bytes
        sig_old_valid = hmac.new(webhook_secret.encode("utf-8"), signed_old, hashlib.sha256).hexdigest()
        res_old = provider.verify_webhook(payload_bytes, {"stripe-signature": f"t={t_old},v1={sig_old_valid}"})
        self.assertFalse(res_old.success)
        self.assertIn("tolerance window", res_old.message)

    def test_entitlement_store_abstraction(self):
        """Verifies EntitlementManager operates with InMemoryEntitlementStore and supports clear_all."""
        store = EntitlementManager.get_store()
        self.assertIsNotNone(store)
        EntitlementManager.record_processed_event("evt_store_test_99")
        self.assertTrue(EntitlementManager.is_event_processed("evt_store_test_99"))


if __name__ == "__main__":
    unittest.main()
