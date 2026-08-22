"""
StockSense AI - Payment Persistence & Database Store Unit Tests
Validates PostgreSQL/Supabase EntitlementStore implementation, interface fidelity,
fail-safe unconfigured guards, mock serverless persistence, and webhook idempotency.
"""

import unittest
from unittest.mock import patch, MagicMock
import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

from backend.services.payments.models import (
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionRecord
)
from backend.services.payments.entitlements import (
    BaseEntitlementStore,
    EntitlementStoreInterface,
    InMemoryEntitlementStore,
    EntitlementManager,
    get_default_entitlement_store
)
from backend.services.payments.supabase_store import (
    PostgresSupabaseEntitlementStore,
    PersistenceConfigurationError,
    SUPABASE_SCHEMA_SQL
)


class TestPaymentPersistence(unittest.TestCase):

    def setUp(self):
        # Always reset EntitlementManager to default in-memory store before each test
        self.in_memory = InMemoryEntitlementStore()
        EntitlementManager.set_store(self.in_memory)

    def tearDown(self):
        EntitlementManager.set_store(InMemoryEntitlementStore())

    def test_01_interface_compatibility(self):
        """Verifies EntitlementStoreInterface is an exact alias and both stores inherit from it."""
        self.assertIs(EntitlementStoreInterface, BaseEntitlementStore)
        self.assertTrue(issubclass(InMemoryEntitlementStore, BaseEntitlementStore))
        self.assertTrue(issubclass(PostgresSupabaseEntitlementStore, BaseEntitlementStore))
        self.assertTrue(issubclass(PostgresSupabaseEntitlementStore, EntitlementStoreInterface))

    def test_02_schema_ddl_validity(self):
        """Verifies Supabase DDL contains required table definitions and indexes."""
        self.assertIn("CREATE TABLE IF NOT EXISTS public.user_subscriptions", SUPABASE_SCHEMA_SQL)
        self.assertIn("CREATE TABLE IF NOT EXISTS public.processed_webhook_events", SUPABASE_SCHEMA_SQL)
        self.assertIn("user_id TEXT PRIMARY KEY", SUPABASE_SCHEMA_SQL)
        self.assertIn("event_id TEXT PRIMARY KEY", SUPABASE_SCHEMA_SQL)

    def test_03_unconfigured_persistent_store_safety(self):
        """Verifies unconfigured store reports False for is_configured and fails safely."""
        with patch.dict(os.environ, {}, clear=True):
            store = PostgresSupabaseEntitlementStore(raise_if_unconfigured=False)
            self.assertFalse(store.is_configured())
            # In non-strict mode, returns None for get and does not raise for unconfigured
            self.assertIsNone(store.get_subscription("any_user"))
            self.assertFalse(store.is_event_processed("any_event"))

    def test_04_strict_production_unconfigured_fails_explicitly(self):
        """Verifies strict production mode raises PersistenceConfigurationError without silent fallback."""
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(PersistenceConfigurationError):
                PostgresSupabaseEntitlementStore(raise_if_unconfigured=True)

    def test_05_store_factory_routing(self):
        """Verifies get_default_entitlement_store returns appropriate store per environment."""
        # 1. Dev / Test default -> InMemory
        with patch.dict(os.environ, {"APP_ENV": "development"}, clear=True):
            dev_store = get_default_entitlement_store()
            self.assertIsInstance(dev_store, InMemoryEntitlementStore)

        # 2. Configured Supabase -> PostgresSupabaseEntitlementStore
        with patch.dict(os.environ, {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_KEY": "test_service_key_mock_123"
        }, clear=True):
            prod_store = get_default_entitlement_store()
            self.assertIsInstance(prod_store, PostgresSupabaseEntitlementStore)
            self.assertTrue(prod_store.is_configured())

        # 3. Production mode without DB -> raises PersistenceConfigurationError
        with patch.dict(os.environ, {"APP_ENV": "production"}, clear=True):
            with self.assertRaises(PersistenceConfigurationError):
                get_default_entitlement_store()

    @patch("urllib.request.urlopen")
    def test_06_mocked_supabase_subscription_lifecycle(self, mock_urlopen):
        """Simulates REST API calls to Supabase for saving and retrieving subscriptions."""
        store = PostgresSupabaseEntitlementStore(
            supabase_url="https://mockproject.supabase.co",
            supabase_key="mock_key_abc",
            raise_if_unconfigured=True
        )

        # 1. Mock GET user_subscriptions returning empty list (not found)
        mock_resp_empty = MagicMock()
        mock_resp_empty.status = 200
        mock_resp_empty.read.return_value = json.dumps([]).encode("utf-8")

        # 2. Mock POST user_subscriptions returning created record
        mock_resp_created = MagicMock()
        mock_resp_created.status = 201
        mock_resp_created.read.return_value = json.dumps([{
            "user_id": "usr_supabase_1",
            "subscription_id": "sub_sb_100",
            "plan_id": "pro",
            "provider": "stripe",
            "status": "ACTIVE",
            "currency": "USD",
            "amount": 29.0,
            "current_period_start": "2026-08-16T00:00:00",
            "current_period_end": "2026-09-16T00:00:00",
            "cancel_at_period_end": False,
            "last_event_id": "evt_sb_1"
        }]).encode("utf-8")

        mock_urlopen.return_value.__enter__.side_effect = [
            mock_resp_empty,    # First GET
            mock_resp_created,  # POST save
            mock_resp_created   # Second GET
        ]

        # Initial check
        sub1 = store.get_subscription("usr_supabase_1")
        self.assertIsNone(sub1)

        # Save subscription
        record = SubscriptionRecord(
            subscription_id="sub_sb_100",
            user_id="usr_supabase_1",
            plan_id="pro",
            provider="stripe",
            status=SubscriptionStatus.ACTIVE,
            currency="USD",
            amount=29.0,
            current_period_start="2026-08-16T00:00:00",
            current_period_end="2026-09-16T00:00:00",
            last_event_id="evt_sb_1"
        )
        store.save_subscription("usr_supabase_1", record)

        # Retrieve saved subscription
        sub2 = store.get_subscription("usr_supabase_1")
        self.assertIsNotNone(sub2)
        self.assertEqual(sub2.plan_id, "pro")
        self.assertEqual(sub2.subscription_id, "sub_sb_100")
        self.assertEqual(sub2.status, SubscriptionStatus.ACTIVE)

    @patch("urllib.request.urlopen")
    def test_07_mocked_supabase_webhook_idempotency(self, mock_urlopen):
        """Verifies webhook event checking and recording via Supabase PostgREST endpoints."""
        store = PostgresSupabaseEntitlementStore(
            supabase_url="https://mockproject.supabase.co",
            supabase_key="mock_key_abc"
        )

        mock_resp_not_found = MagicMock()
        mock_resp_not_found.status = 200
        mock_resp_not_found.read.return_value = json.dumps([]).encode("utf-8")

        mock_resp_recorded = MagicMock()
        mock_resp_recorded.status = 201
        mock_resp_recorded.read.return_value = json.dumps([{"event_id": "evt_test_sb_999"}]).encode("utf-8")

        mock_resp_found = MagicMock()
        mock_resp_found.status = 200
        mock_resp_found.read.return_value = json.dumps([{"event_id": "evt_test_sb_999"}]).encode("utf-8")

        mock_urlopen.return_value.__enter__.side_effect = [
            mock_resp_not_found,  # Check before record
            mock_resp_recorded,   # Record event
            mock_resp_found       # Check after record
        ]

        self.assertFalse(store.is_event_processed("evt_test_sb_999"))
        store.record_processed_event("evt_test_sb_999")
        self.assertTrue(store.is_event_processed("evt_test_sb_999"))

    def test_08_cross_instance_durability_simulation(self):
        """
        Simulates two independent serverless function instances connecting to a shared persistent store.
        Proves state written by Instance A is readable and preserved by Instance B.
        """
        # In a test environment, simulate the shared database layer using a shared backend dict
        shared_db = {
            "subscriptions": {},
            "events": set()
        }

        class MockSharedPersistentStore(BaseEntitlementStore):
            def get_subscription(self, user_id: str):
                return shared_db["subscriptions"].get(user_id)
            def save_subscription(self, user_id: str, record: SubscriptionRecord):
                shared_db["subscriptions"][user_id] = record
            def is_event_processed(self, event_id: str):
                return event_id in shared_db["events"]
            def record_processed_event(self, event_id: str):
                shared_db["events"].add(event_id)
            def delete_subscription(self, user_id: str):
                shared_db["subscriptions"].pop(user_id, None)
            def clear_all(self):
                shared_db["subscriptions"].clear()
                shared_db["events"].clear()

        # Instance A: Receives Stripe webhook and activates subscription
        instance_a_store = MockSharedPersistentStore()
        EntitlementManager.set_store(instance_a_store)
        EntitlementManager.update_subscription(
            user_id="serverless_user_42",
            plan_id="premium",
            provider="stripe",
            subscription_id="sub_cross_instance_42",
            status=SubscriptionStatus.ACTIVE,
            currency="USD",
            amount=79.0,
            event_id="evt_cross_42"
        )

        # Instance B: Cold start on completely separate container
        instance_b_store = MockSharedPersistentStore()
        EntitlementManager.set_store(instance_b_store)

        # Instance B reads user entitlement
        sub_b = EntitlementManager.get_user_subscription("serverless_user_42")
        self.assertEqual(sub_b.plan_id, "premium")
        self.assertEqual(sub_b.status, SubscriptionStatus.ACTIVE)
        self.assertTrue(EntitlementManager.check_entitlement("serverless_user_42", "full_universe"))
        self.assertTrue(EntitlementManager.check_entitlement("serverless_user_42", "advanced_models"))

        # Instance B attempts duplicate webhook delivery
        self.assertTrue(EntitlementManager.is_event_processed("evt_cross_42"))


if __name__ == "__main__":
    unittest.main()
