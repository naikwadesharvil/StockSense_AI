"""
StockSense AI - PostgreSQL & Supabase Persistent Entitlement Store
Production-grade persistent storage adapter for subscription entitlements and webhook idempotency.
Optimized for Vercel Serverless Function runtime via Supabase PostgREST HTTPS API & Direct PostgreSQL.
"""

import os
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import urllib.request
import urllib.error
import urllib.parse

from backend.services.payments.models import (
    SubscriptionRecord,
    SubscriptionStatus
)
from backend.services.payments.entitlements import BaseEntitlementStore

logger = logging.getLogger("stocksense.payments.persistence")

# SQL Schema Migration Reference DDL
SUPABASE_SCHEMA_SQL = """
-- 1. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    user_id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    current_period_start TEXT NOT NULL,
    current_period_end TEXT NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    last_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Processed Webhook Events Table (Idempotency)
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-frequency reads
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.user_subscriptions(plan_id);
"""


class PersistenceConfigurationError(RuntimeError):
    """Raised when persistent storage is required (e.g. in production) but unconfigured."""
    pass


class PostgresSupabaseEntitlementStore(BaseEntitlementStore):
    """
    Production persistent entitlement store backed by PostgreSQL / Supabase.
    
    Serverless Architecture Notes:
    - Utilizes Supabase PostgREST HTTPS API (`SUPABASE_URL` + `SUPABASE_KEY`) to eliminate
      connection pool overhead during Vercel serverless cold starts.
    - Also supports direct SQL connection when `DATABASE_URL` / `POSTGRES_URL` is configured.
    - Guarantees durability across independent Vercel serverless function containers.
    """

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        database_url: Optional[str] = None,
        raise_if_unconfigured: bool = False,
        timeout: float = 10.0
    ):
        self.supabase_url = (
            supabase_url
            or os.getenv("SUPABASE_URL")
            or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            or ""
        ).rstrip("/")
        self.supabase_key = (
            supabase_key
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_SERVICE_KEY")
            or os.getenv("SUPABASE_KEY")
            or ""
        )
        self.database_url = (
            database_url
            or os.getenv("DATABASE_URL")
            or os.getenv("POSTGRES_URL")
            or os.getenv("SUPABASE_DB_URL")
            or ""
        )
        self.timeout = timeout
        self.raise_if_unconfigured = raise_if_unconfigured

        if self.raise_if_unconfigured and not self.is_configured():
            raise PersistenceConfigurationError(
                "Persistent EntitlementStore is required in this environment, but neither "
                "SUPABASE_URL/SUPABASE_KEY nor DATABASE_URL/POSTGRES_URL environment variables are configured."
            )

    def is_configured(self) -> bool:
        """Returns True if valid database configuration is available."""
        has_supabase = bool(self.supabase_url and self.supabase_key)
        has_postgres = bool(self.database_url)
        return has_supabase or has_postgres

    def _get_headers(self) -> Dict[str, str]:
        """Builds standard authentication and content headers for Supabase PostgREST API."""
        return {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Prefer": "return=representation"
        }

    def _execute_http_request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Any:
        """Executes HTTPS request against Supabase REST endpoint."""
        if not self.supabase_url or not self.supabase_key:
            raise PersistenceConfigurationError("Supabase REST credentials are not configured.")

        url = f"{self.supabase_url}/rest/v1/{endpoint}"
        req_headers = self._get_headers()
        if headers:
            req_headers.update(headers)

        body_bytes = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                status_code = resp.status
                resp_body = resp.read().decode("utf-8")
                if resp_body:
                    try:
                        return json.loads(resp_body)
                    except json.JSONDecodeError:
                        return resp_body
                return None
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            logger.error(f"Supabase HTTP {e.code} on {method} {url}: {err_body}")
            raise RuntimeError(f"Database request failed (HTTP {e.code}): {err_body}") from e
        except Exception as e:
            logger.error(f"Supabase connection error on {method} {url}: {str(e)}")
            raise RuntimeError(f"Database connection error: {str(e)}") from e

    def get_subscription(self, user_id: str) -> Optional[SubscriptionRecord]:
        """
        Retrieves user subscription record from persistent storage.
        Durable across serverless function instances.
        """
        if not self.is_configured():
            if self.raise_if_unconfigured:
                raise PersistenceConfigurationError("Database persistence unconfigured.")
            return None

        clean_user_id = user_id.strip()
        encoded_user = urllib.parse.quote(clean_user_id)
        endpoint = f"user_subscriptions?user_id=eq.{encoded_user}&select=*"

        try:
            data = self._execute_http_request(endpoint, method="GET")
            if isinstance(data, list) and len(data) > 0:
                row = data[0]
                raw_status = str(row.get("status", "ACTIVE")).strip().upper()
                try:
                    status_val = SubscriptionStatus(raw_status)
                except ValueError:
                    status_val = SubscriptionStatus.ACTIVE

                return SubscriptionRecord(
                    subscription_id=row.get("subscription_id", ""),
                    user_id=row.get("user_id", clean_user_id),
                    plan_id=row.get("plan_id", "free"),
                    provider=row.get("provider", "internal"),
                    status=status_val,
                    currency=row.get("currency", "USD"),
                    amount=float(row.get("amount", 0.0)),
                    current_period_start=row.get("current_period_start", ""),
                    current_period_end=row.get("current_period_end", ""),
                    cancel_at_period_end=bool(row.get("cancel_at_period_end", False)),
                    last_event_id=row.get("last_event_id")
                )
            return None
        except PersistenceConfigurationError:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch subscription for user {user_id}: {e}")
            if self.raise_if_unconfigured:
                raise
            return None

    def save_subscription(self, user_id: str, record: SubscriptionRecord) -> None:
        """
        Upserts user subscription record into persistent database.
        """
        if not self.is_configured():
            if self.raise_if_unconfigured:
                raise PersistenceConfigurationError("Database persistence unconfigured.")
            return

        payload = {
            "user_id": user_id.strip(),
            "subscription_id": record.subscription_id,
            "plan_id": record.plan_id,
            "provider": record.provider,
            "status": record.status.value if hasattr(record.status, "value") else str(record.status),
            "currency": record.currency,
            "amount": float(record.amount),
            "current_period_start": record.current_period_start,
            "current_period_end": record.current_period_end,
            "cancel_at_period_end": record.cancel_at_period_end,
            "last_event_id": record.last_event_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        # PostgREST upsert headers
        headers = {
            "Prefer": "resolution=merge-duplicates"
        }
        endpoint = "user_subscriptions"

        try:
            self._execute_http_request(endpoint, method="POST", data=payload, headers=headers)
        except Exception as e:
            logger.error(f"Failed to save subscription for user {user_id}: {e}")
            raise

    def is_event_processed(self, event_id: str) -> bool:
        """
        Checks if webhook event ID was previously recorded to guarantee idempotency.
        """
        if not self.is_configured():
            if self.raise_if_unconfigured:
                raise PersistenceConfigurationError("Database persistence unconfigured.")
            return False

        clean_event_id = event_id.strip()
        encoded_event = urllib.parse.quote(clean_event_id)
        endpoint = f"processed_webhook_events?event_id=eq.{encoded_event}&select=event_id"

        try:
            data = self._execute_http_request(endpoint, method="GET")
            if isinstance(data, list) and len(data) > 0:
                return True
            return False
        except PersistenceConfigurationError:
            raise
        except Exception as e:
            logger.error(f"Failed to check processed event {event_id}: {e}")
            if self.raise_if_unconfigured:
                raise
            return False

    def record_processed_event(self, event_id: str) -> None:
        """
        Records processed webhook event ID in database for durable deduplication.
        """
        if not self.is_configured():
            if self.raise_if_unconfigured:
                raise PersistenceConfigurationError("Database persistence unconfigured.")
            return

        payload = {
            "event_id": event_id.strip(),
            "processed_at": datetime.now(timezone.utc).isoformat()
        }
        headers = {
            "Prefer": "resolution=ignore-duplicates"
        }
        endpoint = "processed_webhook_events"

        try:
            self._execute_http_request(endpoint, method="POST", data=payload, headers=headers)
        except Exception as e:
            logger.error(f"Failed to record processed event {event_id}: {e}")
            raise

    def clear_all(self) -> None:
        """
        Clears all stored records (used primarily for test isolation and teardown).
        """
        if not self.is_configured():
            return

        try:
            # Delete all from user_subscriptions
            self._execute_http_request("user_subscriptions?user_id=neq.__none__", method="DELETE")
            # Delete all from processed_webhook_events
            self._execute_http_request("processed_webhook_events?event_id=neq.__none__", method="DELETE")
        except Exception as e:
            logger.warning(f"clear_all warning: {e}")
