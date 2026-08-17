StockSense AI V2 — Project Progress & Production Roadmap

Project: StockSense AI V2 — Intelligent Stock Forecasting & Market Analytics Platform
Repository: naikwadesharvil/StockSense_AI
Production URL: https://stock-sense-ai-eight.vercel.app
Current focus: Production hardening, durable payment persistence, sandbox payment verification, and final release readiness.

1. Project Overview

StockSense AI V2 is a financial analytics and machine-learning platform combining:

React 18 + Vite + TypeScript frontend

FastAPI Python backend

Vercel serverless deployment

Yahoo Finance market-data integration

Company fundamentals

Technical indicators

Stock search and comparison

Financial news and NLP sentiment

Multi-model stock forecasting

NIFTY 50 trending/ranking

Subscription plans

Stripe and Razorpay payment adapters

Sandbox/mock payment provider

Supabase-backed persistent payment entitlements

Automated backend regression tests

Academic holdout benchmarking and methodology protection

Financial disclaimer: StockSense AI is an educational/analytical platform. Forecasts are statistical model estimates and are not financial advice.

2. Executive Status

Area

Status

Current Assessment

Core backend

✅

Implemented and tested

React frontend

✅

Implemented and production-built

Vercel deployment

✅

Successfully deployed

API routing

✅

Serverless routing resolved

Stock data

✅

Production endpoint verified

Fundamentals

✅

Implemented

News + sentiment

✅

Implemented

ML forecasting

✅

Implemented; methodology frozen

Academic benchmarks

✅

Preserved

NIFTY 50 Trending

✅

Implemented and production-tested

Payment architecture

✅

Stripe/Razorpay/mock layers implemented

Payment security

✅

Webhook verification/idempotency implemented

Supabase schema

✅

Created successfully

Supabase persistence code

✅

Implemented

Real Supabase persistence verification

❌

Final real-world verification must be completed

Sandbox payment flow

❌

Next major verification stage

Production payment activation

❌

Must remain blocked until sandbox + persistence gates pass

Final release

❌

Payment operational verification remains

3. What Has Been Completed

3.1 Git & Repository

Major development checkpoints include:

7817799 Add payment hardening and NIFTY 50 trending

A later deployment-related descendant was also reached:

db054df Fix serverless dependencies for Vercel Python runtime

Git has been used for controlled checkpoints throughout development.

Git discipline

Before any release checkpoint:

git status
git diff --check
git diff --stat
git log --oneline --decorate -10

No secrets, .env files, node_modules, caches, or generated temporary files should be committed.

4. Vercel Deployment

4.1 Final architecture

The project uses a unified Vercel deployment:

                    VERCEL
                      |
          +-----------+-----------+
          |                       |
       Frontend                  API
          |                       |
   React/Vite SPA             FastAPI
   frontend/dist              api/index.py
          |                       |
          +-----------+-----------+
                      |
                 Same domain

Current intended root vercel.json:

{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/((?!api/|assets/).*)",
      "destination": "/index.html"
    }
  ]
}

Python runtime:

3.12

Files:

.python-version
runtime.txt
api/index.py
vercel.json

4.2 Routing problem that was solved

The original configuration manually rewrote:

/api/(.*) -> /api/index.py

which caused FastAPI path mismatches and production 404 {"detail":"Not Found"} responses.

The architecture was changed so Vercel can route /api/* naturally while the SPA rewrite handles only non-API/non-asset routes.

4.3 Production verification previously completed

Verified production endpoints included:

/api/health
/api/search?q=Apple
/api/stocks/AAPL
/api/stocks/RELIANCE
/api/forecast/AAPL
/api/news/AAPL
/api/payments/plans
/api/stocks/trending/nifty50
/
/trending

5. FastAPI Serverless Architecture

api/index.py exposes:

from backend.main import app

and adds the repository root to the Python module path.

backend/main.py supports both:

/health
/api/health

and equivalent API paths for compatibility with Vercel serverless invocation and direct/local execution.

Static frontend serving was also added to support the unified deployment architecture.

6. Frontend

The frontend is:

React 18

TypeScript

Vite

component-based views

SPA navigation

API service abstraction

Important views include:

Landing

Dashboard

Stock overview

Forecast

Technical analysis

Comparison

News/sentiment

Pricing

Trending

Production Vite builds have completed successfully.

7. Market Data

7.1 Provider architecture

The backend contains provider abstractions for:

Yahoo Finance

commercial provider adapters

deterministic fallback/benchmark provider

The benchmark provider must remain isolated from live-market production behavior.

7.2 Data provenance

Market responses expose provenance such as:

provider

symbol

exchange

currency

timestamp

timezone

market status

freshness

live/fallback state

The application must never claim that historical/fallback data is live.

8. Stock Analytics

Implemented functionality includes:

current price

previous close

daily change

daily change %

open/high/low

volume

average volume

52-week range

market capitalization

P/E

beta

dividend information

company description

fundamentals

provenance

Examples previously verified:

AAPL
RELIANCE

9. ML Forecasting

9.1 Models

The platform contains:

Ridge Regression

Gradient Boosted Decision Trees / XGBoost-style GBDT

LSTM

model comparison/validation logic

9.2 Validation methodology

The project uses:

chronological splitting

pre-test training/validation partition

untouched holdout test set

expanding walk-forward validation

validation-selected model architecture

multi-horizon forecasting

prediction intervals

baseline comparisons

9.3 CRITICAL: ML methodology is frozen

Do not modify the forecasting methodology while working on deployment or payments.

Frozen academic holdout RMSE values:

Symbol

Final Holdout RMSE

AAPL

$3.88

MSFT

$8.22

NVDA

$5.65

TSLA

$16.99

RELIANCE

₹39.09

TCS

₹65.35

INFY

₹38.39

HDFCBANK

₹26.36

These values must remain invariant unless a separate, explicitly approved ML research change is being made.

10. NIFTY 50 Trending

Completed

Backend:

backend/services/nifty_service.py

Frontend:

frontend/src/components/views/TrendingView.tsx

Production endpoint:

/api/stocks/trending/nifty50

Frontend route:

/trending

Previously verified:

HTTP 200

50 returned stocks

50 unique symbols

deterministic multi-factor trend scoring

ordinal ranking

constituent-level resilience

honest market-status/provenance reporting

During closed-market periods the system must correctly indicate that quotes are not live.

11. News & Sentiment

Implemented:

external financial news ingestion

RSS/news providers

publisher attribution

publication timestamps

sentiment scoring

contextual/financial sentiment handling

fallback behavior

Production endpoint:

/api/news/{symbol}

Previously verified successfully for:

AAPL

12. Payment System

12.1 Plans

The application contains subscription tiers including:

Free Explorer

core benchmark equities

1-day and 5-day forecasts

indicators

limited watchlist

headline sentiment

Pro Trader

expanded universe

all forecast horizons

multi-model comparisons

news analytics

larger watchlist

backtesting/error metrics

Institutional Elite / Premium

advanced analytics

unlimited/larger watchlist

correlation analysis

full fundamentals/valuation

risk parameter controls

Exact plan names/features should be taken from the current application configuration rather than duplicated manually elsewhere.

13. Payment Providers

Implemented provider layers:

backend/services/payments/base.py
backend/services/payments/factory.py
backend/services/payments/models.py
backend/services/payments/stripe_provider.py
backend/services/payments/razorpay_provider.py
backend/services/payments/mock_sandbox_provider.py

Supported configuration includes:

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET

Do not commit these values.

14. Payment Security

Implemented/verified payment safeguards include:

HMAC-SHA256 webhook verification

Stripe timestamp replay protection

invalid signature rejection

webhook idempotency

subscription activation

cancellation handling

expiration handling

safe unconfigured-payment responses

no card/CVV storage

secret scanning

The application should return a controlled configuration error when live payment credentials are unavailable rather than pretending payment is active.

15. Payment Persistence — Major Current Work

Original problem

The initial entitlement store was:

InMemoryEntitlementStore

This is unsafe for real-money production on Vercel because serverless instances are ephemeral.

Implemented solution

A persistent adapter was added:

backend/services/payments/supabase_store.py

and integrated into:

backend/services/payments/entitlements.py

The architecture is:

Payment Provider
      |
      v
Webhook Verification
      |
      v
EntitlementManager
      |
      v
Supabase/PostgreSQL
      |
      +--> user_subscriptions
      |
      +--> processed_webhook_events

The in-memory implementation remains available for tests/local/sandbox use.

16. Supabase Database

Schema file:

backend/services/payments/supabase_schema.sql

Required tables:

public.user_subscriptions
public.processed_webhook_events

The schema was executed successfully in Supabase.

The intended production environment variables are:

SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PAYMENT_PERSISTENCE=supabase

Security rule

SUPABASE_SERVICE_ROLE_KEY is server-side only.

Never:

print it

commit it

expose it to React/Vite

place it in frontend JavaScript

return it through an API

log it

17. Production Fail-Closed Payment Requirement

Production must never silently fall back to:

InMemoryEntitlementStore

when persistent storage is required.

If:

APP_ENV=production

or:

REQUIRE_PERSISTENCE=true

and persistent credentials are missing, the application must fail explicitly with a persistence configuration error.

This is a hard requirement before activating real-money payments.

18. Webhook Idempotency

The persistence design uses:

processed_webhook_events

with a unique event identifier.

Desired lifecycle:

Webhook
   |
   v
Verify signature
   |
   v
Check event ID
   |
   +--> Already processed -> ignore safely
   |
   v
Update subscription
   |
   v
Record processed event

If subscription persistence fails, the event must not be marked as successfully processed so the payment provider can retry.

19. Testing History

The backend test suite has grown as features were added.

Reported checkpoints include:

101 / 101 PASS
114 / 114 PASS
122 / 122 PASS

The latest reported full suite was:

122 / 122 PASS

However, the current repository should always be rerun before a new release is declared.

Primary command:

python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"

Persistence-specific test:

python -X utf8 -m unittest -v backend.tests.test_payment_persistence

20. Secret Scanning

Previous audits found:

0 production Stripe secrets
0 production Razorpay secrets
0 Supabase credentials committed
0 known live credentials in frontend bundles

This must remain true after every payment-related change.

21. CURRENT REMAINING WORK

Phase A — Finish Supabase Verification

Status: 🟡

The code and schema exist, but final real-world persistence verification must be completed.

Verify with real Supabase configuration:

create temporary subscription

write to Supabase

start a fresh process

read the subscription

update the subscription

start another fresh process

verify updated state

test cancellation persistence

test expiration persistence where applicable

record webhook event

submit duplicate webhook event

verify duplicate is ignored

clean up temporary records

Do not report success unless this actually succeeds.

22. Review entitlements.py

Status: 🟡

backend/services/payments/entitlements.py was modified during the persistence work.

Before committing the final persistence implementation:

git diff -- backend/services/payments/entitlements.py

Confirm that every change is intentional.

Do not retain unrelated edits.

23. Full Regression Test

After persistence changes:

python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"

Required result:

0 failures
0 errors

Then:

git diff --check

24. Git Release Checkpoint

After all verification passes:

git status
git diff --check
git diff --stat
git diff -- backend/services/payments/entitlements.py

Stage only intended payment-persistence files.

Then:

git add backend/services/payments
git add backend/tests/test_payment_persistence.py

git commit -m "Add persistent Supabase payment entitlements"

git push origin main

Finally:

git status
git log -1 --oneline

25. Vercel Deployment Verification

After GitHub push, allow Vercel to deploy.

Verify:

/api/health
/api/payments/plans
/api/stocks/trending/nifty50
/api/stocks/AAPL
/api/stocks/RELIANCE
/api/forecast/AAPL
/api/news/AAPL
/
/trending

Do not activate live payments during this phase.

26. Sandbox Payment Phase

Status: 🟡 NEXT MAJOR PHASE

Use only:

Stripe test/sandbox mode

Razorpay test mode

mock provider where appropriate

Never use live payment credentials during sandbox testing.

Test:

Create checkout
      ↓
Sandbox payment
      ↓
Provider webhook
      ↓
Signature verification
      ↓
Idempotency check
      ↓
Supabase entitlement write
      ↓
Fresh-process entitlement read

Test at minimum:

successful payment

failed payment

invalid signature

duplicate webhook

replayed/expired webhook

cancellation

expiration

entitlement activation

27. Production Payment Activation

Status: 🔴 BLOCKED

Real-money payment activation must remain blocked until ALL gates pass.

Required checklist:

❌ Supabase schema verified

❌ Supabase service-role access verified

❌ Real subscription write verified

❌ Fresh-process read verified

❌ Cross-instance update verified

❌ Cancellation persistence verified

❌ Expiration persistence verified

❌ Webhook idempotency verified

❌ Duplicate webhook safely ignored

❌ Failed DB write does not mark event processed

❌ Full test suite passes

❌ Secret scan clean

❌ Vercel environment variables verified

❌ Sandbox checkout succeeds

❌ Sandbox webhook succeeds

❌ Sandbox entitlement activation succeeds

❌ Sandbox cancellation succeeds

❌ Sandbox duplicate webhook succeeds safely

❌ Production webhook configured

❌ Production payment credentials configured

❌ Final production smoke test passes

Only then should real-money payments be enabled.

28. Features That Should NOT Be Changed During Release Hardening

Unless a separate change is explicitly approved, freeze:

ML methodology

academic holdout datasets

benchmark RMSE values

walk-forward validation

model-selection logic

NIFTY scoring methodology

market-data provenance rules

production routing architecture

The current priority is reliability, not feature expansion.

29. Recommended Release Sequence

CURRENT
   |
   v
Review Git state
   |
   v
Review entitlements.py diff
   |
   v
Real Supabase persistence test
   |
   v
Full regression suite
   |
   v
Secret scan
   |
   v
Git checkpoint
   |
   v
Push GitHub
   |
   v
Vercel deployment
   |
   v
Production API smoke test
   |
   v
Stripe/Razorpay sandbox
   |
   v
Sandbox webhook verification
   |
   v
Supabase entitlement verification
   |
   v
Security review
   |
   v
LIVE PAYMENT ACTIVATION

30. Current Leadership Assessment

🟢 Core application

Production-capable

The core market analytics, forecasting, frontend, backend, NIFTY 50 trending, news, and data-provenance systems are substantially complete.

🟡 Payment system

Technically mature but operationally incomplete

The architecture is appropriate, but durable Supabase behavior and sandbox payment lifecycle need final proof.

🔴 Real-money payments

Not approved yet

Do not activate real-money payments until the complete sandbox and persistence gates pass.

31. Definition of Done

StockSense AI V2 is considered fully release-ready only when:

Core platform                 PASS
Frontend                      PASS
Backend                       PASS
Vercel                        PASS
Stock data                    PASS
Forecasting                   PASS
NIFTY 50 Trending             PASS
News/Sentiment                PASS
Payment architecture         PASS
Payment security              PASS
Supabase schema               PASS
Supabase persistence          PASS
Cross-instance persistence    PASS
Sandbox checkout              PASS
Sandbox webhook               PASS
Sandbox entitlement           PASS
Full regression suite         PASS
Secret scan                   PASS
Production payment smoke test PASS

Until then, the correct release status is:

StockSense AI V2 — Release Candidate / Production Hardening in Progress

32. Developer Commands Reference

Run backend tests

python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"

Run persistence tests

python -X utf8 -m unittest -v backend.tests.test_payment_persistence

Build frontend

cd frontend
npm install
npm run build
cd ..

Check Git

git status
git diff --check
git diff --stat
git log --oneline --decorate -10

Commit verified changes

git add <intended-files>
git commit -m "Describe verified change"
git push origin main

Final Principle

Do not declare a subsystem production-ready because the code exists.

Production readiness requires:

Implementation
+
Automated Tests
+
Real External-Service Verification
+
Security Verification
+
Deployment Verification
+
Rollback-safe Git Checkpoint

For StockSense AI, the remaining work is primarily the payment operational verification chain. The ML and core market platform should remain stable while that work is completed.
