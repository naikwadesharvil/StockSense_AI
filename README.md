StockSense AI V2 — Project Progress & Production Roadmap

Project: StockSense AI V2 — Intelligent Stock Forecasting & Market Analytics Platform
Repository: naikwadesharvil/StockSense_AI
Production URL: https://stock-sense-ai-eight.vercel.app

Current Status: 🟡 Release Candidate / Production Hardening in Progress

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

Institutional financial dashboard

Watchlist

Model performance and backtesting

Subscription plans

Stripe and Razorpay payment adapters

Sandbox/mock payment provider

Supabase-backed persistent payment entitlements

Automated backend regression tests

Academic holdout benchmarking

Market-data provenance and freshness tracking

Financial Disclaimer

StockSense AI is an educational and analytical platform.

Forecasts are statistical model estimates and are not financial advice.

2. Executive Status

Area

Status

Assessment

Core Backend

✅

Implemented and tested

React Frontend

✅

Implemented and production-built

Institutional Dashboard

✅

Redesigned and implemented

Stock Overview

✅

Implemented

Fundamentals

✅

Implemented

Technical Analysis

✅

Implemented

News & Sentiment

✅

Implemented

ML Forecasting

✅

Implemented; methodology frozen

Model Performance

✅

Implemented

Stock Comparison

✅

Implemented

Watchlist

✅

Implemented

NIFTY 50 Trending

✅

Implemented and production-tested

Settings

✅

Implemented

Help & Support

✅

Implemented

Pricing UI

✅

Implemented

Payment Architecture

✅

Stripe/Razorpay/mock layers implemented

Payment Security

✅

Webhook verification and idempotency implemented

Supabase Schema

✅

Created and executed

Supabase Persistence Code

✅

Implemented

Real Supabase Persistence

✅

Verified against real Supabase

Cross-Instance Persistence

✅

Verified

Webhook Idempotency

✅

Verified against real Supabase

Mock/Sandbox Infrastructure

✅

Implemented

Provider Sandbox E2E

🟡

Final lifecycle verification pending

Production Payment Configuration

🔴

Not activated

Real-Money Payments

🔴

Blocked

GitHub Frontend Checkpoint

🟡

Local commit created; push requires remote reconciliation

Final Vercel Verification

🟡

Required after latest frontend push

3. Completed Git Checkpoints

8611416 Serve static frontend bundle from FastAPI root for unified Vercel deployment
7817799 Add payment hardening and NIFTY 50 trending
db054df Fix serverless dependencies for Vercel Python runtime
cc4c7aa Add persistent payment entitlements with Supabase
789a7f5 Add persistent Supabase entitlement storage
8b36e58 Complete institutional frontend redesign

Latest Frontend Checkpoint

Commit: 8b36e58
Message: Complete institutional frontend redesign

Status:
✅ Local commit created
🟡 GitHub push rejected due to remote history divergence
🟡 GitHub synchronization pending
🟡 Final Vercel deployment verification pending

Git Safety Rules

Never commit:

.env

API keys

payment secrets

Supabase service-role keys

database passwords

node_modules

cache files

temporary test credentials

Before release checkpoints:

git status
git diff --check
git diff --stat
git log --oneline --decorate -10

4. Vercel Deployment

StockSense AI uses a unified Vercel deployment.

                    VERCEL
                      |
          +-----------+-----------+
          |                       |
       FRONTEND                  API
          |                       |
    React/Vite SPA             FastAPI
    frontend/dist             api/index.py
          |                       |
          +-----------+-----------+
                      |
                 Same Domain

Production URL

https://stock-sense-ai-eight.vercel.app

The previous deployment was successfully verified for the core backend and frontend routes.

Final Release Requirement

After the latest frontend commit is synchronized with GitHub:

Allow Vercel to deploy.

Verify deployment status.

Run production API smoke tests.

Verify all frontend routes.

5. Production API Verification

Previously verified production endpoints:

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

Previously verified core endpoints returned HTTP 200.

6. Frontend

The frontend uses:

React 18

TypeScript

Vite

Component-based architecture

SPA navigation

API service abstraction

Responsive layout

Institutional financial-terminal design system

Main Views

Landing
Dashboard
Stock Overview
Forecast
Technical Analysis
Comparison
News & Sentiment
NIFTY 50 Trending
Watchlist
Model Performance
Pricing
Settings
Help & Support
About

Frontend Production Build

The institutional frontend redesign was successfully built using:

npm run build

Verification:

✅ TypeScript compilation
✅ Vite production bundle
✅ 0 build errors
✅ Production bundle generated successfully

7. Institutional Dashboard Redesign

The frontend was redesigned into an institutional-style financial analytics terminal.

Dashboard components

Market ticker strip

Market strength gauge

Market overview

Market trend chart

Sector performance

Top gainers

Top losers

NIFTY 50 heatmap

AI market insight

Active equity workbench

Stock analytics

Forecast integration

Design system

Primary visual tokens:

#0B0F17
#111726
#151D2F
#1E293B
#10B981

8. Settings

The Settings page provides:

Dark, light, and system themes

Chart presentation

Compact density

Reduced motion

Prediction horizon

Model selection

Confidence interval

Technical lookback periods

Exchange priority

Polling interval

Data provenance badges

RVOL alerts

Watchlist export

Cache purge

Factory reset

API latency diagnostics

ML engine status

Payment sandbox status

Persistence readiness

9. Help & Support

The Help & Support page includes:

Searchable knowledge base

FAQ categories

ML forecasting explanations

Technical indicator references

Market-data information

Sandbox billing information

Keyboard shortcuts

Mathematical references

Support inquiry form

Ticket generation

10. Pricing

Pricing includes:

Free Explorer

Pro Trader

Institutional Elite

Monthly billing

Annual billing

USD

INR

Plan comparison

Feature comparison

Sandbox checkout

Pricing Security Claims

✅ Factual security/architecture descriptions
❌ No unsupported PCI-DSS certification claims
❌ No unsupported "bank-grade encryption" claims
❌ No unsupported security certifications

Only verified security properties should be presented as guarantees.

11. Market Data

The backend contains provider abstractions for:

Yahoo Finance

Commercial provider adapters

Deterministic fallback/benchmark provider

Market responses expose:

Provider

Symbol

Exchange

Currency

Timestamp

Timezone

Market status

Freshness

Live/fallback state

The application must never claim fallback or historical data is live.

12. Stock Analytics

Implemented functionality includes:

Current price

Previous close

Daily change

Daily change %

Open / High / Low

Volume / Average volume

52-week range

Market capitalization

P/E

Beta

Dividend information

Company description

Fundamentals

Provenance

Previously verified examples:

AAPL
RELIANCE

13. ML Forecasting

Models

Ridge Regression

Gradient Boosted Decision Trees

LSTM

Model comparison and validation logic

Validation Methodology

Chronological splitting

Pre-test training/validation partition

Untouched holdout test set

Expanding walk-forward validation

Validation-selected model architecture

Multi-horizon forecasting

Prediction intervals

Baseline comparisons

Critical Rule

ML methodology is frozen.

Do not modify the forecasting methodology during deployment, payment, or frontend work.

14. Academic Holdout Benchmarks

Frozen final holdout RMSE values:

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

These values must remain invariant unless an explicitly approved ML research change is made.

15. NIFTY 50 Trending

Backend:

backend/services/nifty_service.py

Frontend:

frontend/src/components/views/TrendingView.tsx

Production endpoint:

/api/stocks/trending/nifty50

Frontend route:

/trending

Previously verified:

✅ HTTP 200

✅ 50 returned stocks

✅ 50 unique symbols

✅ Multi-factor trend scoring

✅ Ordinal ranking

✅ Constituent-level resilience

✅ Market-status reporting

✅ Data provenance

During closed-market periods the system must correctly indicate that quotes are not live.

16. News & Sentiment

Implemented:

Financial news ingestion

RSS/news providers

Publisher attribution

Publication timestamps

Sentiment scoring

Financial/contextual sentiment

Fallback behavior

Production endpoint:

/api/news/{symbol}

17. Payment Architecture

Payment modules:

backend/services/payments/

Important modules:

base.py
factory.py
models.py
entitlements.py
stripe_provider.py
razorpay_provider.py
mock_sandbox_provider.py
supabase_store.py
supabase_schema.sql

Supported providers:

Stripe
Razorpay
Mock Sandbox

18. Payment Security

Implemented safeguards:

HMAC-SHA256 webhook verification

Stripe timestamp replay protection

Invalid signature rejection

Webhook idempotency

Subscription activation

Cancellation handling

Expiration handling

Safe unconfigured-payment responses

No card/CVV storage

Secret scanning

Production payment credentials must never be hardcoded.

19. Payment Readiness

Component

Status

Mock/Sandbox infrastructure

✅

Payment architecture

✅

Payment security

✅

Supabase persistence

✅

Real Supabase persistence

✅

Cross-instance persistence

✅

Webhook idempotency

✅

Provider sandbox E2E

🟡

Production Stripe/Razorpay configuration

🔴

Real-money payment activation

🔴

Payment architecture being complete does not mean live payments are enabled.

20. Supabase Payment Persistence

Original Problem

The original entitlement system used:

InMemoryEntitlementStore

This is unsuitable as the durable source of truth for real-money production on serverless infrastructure because serverless instances are ephemeral.

Implemented Solution

Persistent adapter:

backend/services/payments/supabase_store.py

Integrated with:

backend/services/payments/entitlements.py

Architecture:

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

The in-memory implementation remains available for:

Unit tests

Local development

Sandbox/mock operation

21. Supabase Database

Schema:

backend/services/payments/supabase_schema.sql

Required tables:

public.user_subscriptions
public.processed_webhook_events

The schema has been successfully executed in Supabase.

Required production environment variables:

SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PAYMENT_PERSISTENCE=supabase

Security Rule

SUPABASE_SERVICE_ROLE_KEY is server-side only.

Never:

Print it

Commit it

Expose it to React/Vite

Place it in frontend JavaScript

Return it through an API

Log it

22. Real Supabase Persistence Verification

Status: ✅ COMPLETE

Real Supabase persistence was successfully tested.

Real Supabase verification:

✅ Subscription write
✅ Fresh-process read
✅ Cross-instance persistence
✅ Subscription update
✅ Cancellation persistence
✅ Webhook event persistence
✅ Duplicate webhook idempotency
✅ Temporary test cleanup

The test used temporary records and removed them after verification.

No production credentials were written to the repository.

23. Production Fail-Closed Payment Requirement

Production must never silently fall back to:

InMemoryEntitlementStore

when persistent storage is required.

If:

APP_ENV=production

or:

REQUIRE_PERSISTENCE=true

and persistent credentials are missing, the application must explicitly raise a persistence configuration error.

This is a hard requirement before real-money payments are activated.

24. Webhook Idempotency

The persistence design uses:

processed_webhook_events

with a unique event identifier.

Lifecycle:

Webhook
   |
   v
Verify signature
   |
   v
Check event ID
   |
   +---- Already processed
   |          |
   |          v
   |        Ignore
   |
   v
Update subscription
   |
   v
Record processed event

If subscription persistence fails, the event must not be marked as successfully processed so the payment provider can retry.

25. Testing

Latest reported backend test checkpoint:

122 / 122 PASS
0 failures
0 errors

Payment persistence tests:

8 / 8 PASS

Commands:

python -X utf8 -m unittest -v backend.tests.test_payment_persistence

python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"

Frontend build:

cd frontend
npm run build

Verified:

✅ TypeScript compilation
✅ Vite build
✅ 0 build errors

26. Secret Scanning

Previous audits found:

0 production Stripe secrets
0 production Razorpay secrets
0 Supabase credentials committed
0 known live credentials in frontend bundles

Never commit:

STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
SUPABASE_SERVICE_ROLE_KEY

Run a secret scan before every production release.

27. Current Remaining Work

Phase A — GitHub Synchronization

Status: 🟡

Latest frontend commit:

8b36e58 Complete institutional frontend redesign

The commit exists locally.

The previous push was rejected because the GitHub remote contains commits not present in the local branch.

Required:

git fetch origin
git log --oneline --graph --decorate --all -10
git status
git pull --rebase origin main

Resolve conflicts if required.

Then:

git push origin main

Do not force-push.

28. Phase B — Vercel Verification

Status: 🟡

After GitHub synchronization:

Allow Vercel to deploy.

Confirm deployment is Ready.

Test /api/health.

Test /api/payments/plans.

Test stock APIs.

Test forecasting.

Test NIFTY 50 Trending.

Test /.

Test /trending.

Test /settings.

Test /help.

Test /pricing.

Check browser console for frontend errors.

Do not activate live payments during this phase.

29. Phase C — Sandbox Payment Testing

Status: 🟡 NEXT MAJOR PAYMENT PHASE

Use only:

Stripe test/sandbox mode
Razorpay test mode
Mock provider

Never use live payment credentials during sandbox testing.

Required lifecycle:

Create Checkout
      ↓
Sandbox Payment
      ↓
Provider Webhook
      ↓
Signature Verification
      ↓
Idempotency Check
      ↓
Supabase Entitlement Write
      ↓
Fresh-Process Entitlement Read

Test:

Successful payment

Failed payment

Invalid signature

Duplicate webhook

Expired/replayed webhook

Cancellation

Expiration

Entitlement activation

Entitlement persistence after fresh process

30. Production Payment Activation

Status: 🔴 BLOCKED

Real-money payment activation must remain blocked until every required operational gate passes.

Completed

Supabase schema created

Supabase service-role access verified

Real subscription write verified

Fresh-process read verified

Cross-instance persistence verified

Cancellation persistence verified

Webhook event persistence verified

Duplicate webhook idempotency verified

Temporary test records cleaned up

Still Required

Final expiration persistence verification

Provider sandbox checkout

Provider sandbox webhook

Sandbox entitlement activation

Sandbox cancellation

Sandbox duplicate webhook test

Full regression suite after final payment changes

Final secret scan

Vercel environment verification

Production webhook configuration

Production Stripe/Razorpay credentials

Final production payment smoke test

Until all gates pass:

🔴 REAL-MONEY PAYMENTS MUST REMAIN DISABLED

31. Features Frozen During Release Hardening

Unless explicitly approved, do not modify:

ML methodology

Academic holdout datasets

Benchmark RMSE values

Walk-forward validation

Model-selection logic

NIFTY scoring methodology

Market-data provenance rules

Production routing architecture

The current priority is:

Reliability and release verification, not uncontrolled feature expansion.

32. Recommended Release Sequence

CURRENT
   |
   v
Resolve GitHub remote/local history
   |
   v
Push frontend checkpoint
   |
   v
Vercel deployment
   |
   v
Production API smoke test
   |
   v
Frontend route verification
   |
   v
Sandbox payment checkout
   |
   v
Sandbox webhook verification
   |
   v
Supabase entitlement verification
   |
   v
Duplicate/replay/cancellation tests
   |
   v
Security + regression audit
   |
   v
Production payment configuration
   |
   v
Final production smoke test
   |
   v
LIVE PAYMENT ACTIVATION

33. Leadership Assessment

Core Application

🟢 Substantially complete

Market analytics, forecasting, frontend, backend, NIFTY 50 trending, news, and provenance systems are substantially complete.

Frontend

🟢 Institutional redesign completed

Dashboard, analytics views, navigation, Settings, Help & Support, Pricing, charts, and supporting components have been redesigned.

Supabase Persistence

🟢 Real-world persistence verified

Cross-instance subscription persistence and webhook idempotency have been successfully verified against the real Supabase database.

Payment System

🟡 Technically mature but operationally incomplete

The architecture and persistence layer are implemented, but the complete provider sandbox payment lifecycle still requires verification.

Real-Money Payments

🔴 Not approved

Real-money payments must remain disabled until the complete sandbox, security, webhook, persistence, and production verification gates pass.

34. Definition of Done

Component

Status

Core Platform

✅

Backend

✅

Frontend

✅

Institutional Dashboard

✅

Stock Data

✅

Fundamentals

✅

Technical Analysis

✅

Forecasting

✅

NIFTY 50 Trending

✅

News/Sentiment

✅

Watchlist

✅

Model Performance

✅

Comparison

✅

Settings

✅

Help & Support

✅

Pricing UI

✅

Payment Architecture

✅

Payment Security

✅

Supabase Schema

✅

Supabase Persistence

✅

Real Supabase Verification

✅

Cross-Instance Persistence

✅

Webhook Idempotency

✅

Mock/Sandbox Infrastructure

✅

Provider Sandbox E2E

🟡

Full Payment Lifecycle

🟡

GitHub Release Checkpoint

🟡

Final Vercel Deployment

🟡

Final Production Smoke Test

🟡

Production Stripe/Razorpay Configuration

🔴

Production Payment Smoke Test

🔴

Real-Money Payment Activation

🔴

35. Developer Commands

Backend Tests

python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"

Payment Persistence Tests

python -X utf8 -m unittest -v backend.tests.test_payment_persistence

Frontend Build

cd frontend
npm install
npm run build
cd ..

Git Inspection

git status
git diff --check
git diff --stat
git log --oneline --decorate -10

Git Synchronization

git fetch origin
git log --oneline --graph --decorate --all -10
git pull --rebase origin main
git push origin main

Final Git Verification

git status
git log -1 --oneline

36. Final Project Principle

A subsystem is not considered production-ready merely because its code exists.

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
Rollback-Safe Git Checkpoint

Current StockSense AI V2 Position

Core Application             🟢 Substantially complete
Frontend                     🟢 Redesigned and built
Supabase Persistence         🟢 Real-world verified
Payment Architecture        🟢 Implemented
Sandbox Payment E2E          🟡 Remaining
GitHub Release Checkpoint    🟡 Remaining
Final Vercel Verification   🟡 Remaining
Production Payments         🔴 Blocked
Real-Money Activation        🔴 Not approved

Current Priority

GitHub synchronization → Vercel verification → Sandbox payment E2E → Final security/regression audit → Production readiness review.
