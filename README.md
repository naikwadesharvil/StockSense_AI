# StockSense AI V2

**Production Release & Validation Roadmap**

**Project:** StockSense AI V2 — Intelligent Stock Forecasting & Market Analytics Platform
**Repository:** `naikwadesharvil/StockSense_AI`
**Production URL:** `https://stock-sense-ai-eight.vercel.app`

> **Current Status:** 🟡 Release Candidate / Final Product Validation

---

## 1. Project Overview

StockSense AI V2 is an institutional-grade financial analytics and machine learning time-series forecasting platform designed for quantitative market research, technical equity screening, and econometric time-series benchmarking.

The platform provides a comprehensive suite of market intelligence capabilities:
- Interactive financial terminal interface with real-time domestic and global market benchmarks
- NIFTY 50 real-time constituent tracking with multi-factor trend ranking (50/50 constituents verified)
- Multi-model quantitative price forecasting (Ridge Regression, Gradient Boosted Trees, LSTM Neural Networks)
- Transparent walk-forward out-of-sample backtesting and Diebold-Mariano statistical model comparisons
- Technical analysis oscillators (Wilder RSI, MACD Histogram, Bollinger Bands, Moving Averages)
- Financial news ingestion with domain-specific Natural Language Processing (NLP) sentiment scoring
- Multi-asset correlation and comparative equity analysis
- Personal watchlist management with local storage and structured JSON data export
- Zero-financial-risk sandbox payment simulation with persistent entitlement management

---

## 2. Current Executive Status

| Subsystem / Area | Status | Verification Summary |
|---|:---:|---|
| **Core Application & Backend** | ✅ COMPLETE | FastAPI serverless runtime deployed and smoke-tested |
| **Frontend UI / UX** | ✅ COMPLETE | Institutional terminal interface, production-built (`npm run build` PASS) |
| **Browser QA** | ✅ COMPLETE | All 11 primary application views interactively verified |
| **Backend Regression Suite** | ✅ COMPLETE | 122 / 122 automated unit and integration tests PASS |
| **Academic Holdout Benchmarks** | ✅ COMPLETE | 100% invariant RMSE metrics across all 8 benchmark equities |
| **Market Data & Provenance** | ✅ COMPLETE | Strict data lineage with explicit fallback watermarking (no fake live claims) |
| **NIFTY 50 Universe** | ✅ COMPLETE | 50/50 constituents verified with deterministic ranking and NSE timestamps |
| **Supabase Persistence** | ✅ COMPLETE | Real-world database persistence and webhook idempotency verified |
| **Sandbox / Mock Payments** | 🟡 PENDING | Infrastructure complete; end-to-end provider lifecycle validation is the next checkpoint |
| **Production Provider Credentials** | 🔴 BLOCKED | Stripe / Razorpay live production credentials intentionally unconfigured |
| **Real-Money Payment Activation** | 🔴 BLOCKED | Live real-money payment transactions strictly disabled |
| **Final Documentation & Demo** | 🔵 NEXT PHASE | Comprehensive user guide, video walkthrough, and portfolio demo artifacts |

---

## 3. Technology Stack

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Custom TailwindCSS utility layer with institutional OLED Dark, Light, and System theme synchronization
- **State Management:** React Context (`StockContext`, `ThemeContext`) with local and session storage persistence
- **Visualization:** Interactive HTML5 Canvas candlestick and line charts with uncertainty variance cones

### Backend & ML Architecture
- **API Framework:** FastAPI (Python 3.11+) with Pydantic schema validation
- **Deployment Runtime:** Vercel Serverless Functions (`api/index.py` with 60s execution limit)
- **Machine Learning:** `scikit-learn` (Ridge Regression, TimeSeriesSplit), `xgboost` (GBDT), `numpy`, `scipy` (Diebold-Mariano test)
- **Data Ingestion:** Yahoo Finance API integration with deterministic benchmark fallback provider
- **NLP & Sentiment:** Rule-based and financial lexicon sentiment scoring engine

### Persistence & Data Storage
- **Database:** Supabase (PostgreSQL) with RESTful PostgREST and service-role backend client
- **Tables:** `user_subscriptions`, `processed_webhook_events`
- **Client Cache:** Partitioned in-memory TTL caching manager with thread-safe access

---

## 4. Core Features

1. **Global & Domestic Market Telemetry:** Live index tracking for NIFTY 50, SENSEX, BANK NIFTY, USD/INR, Gold, and Crude Oil.
2. **NIFTY 50 Constituents Engine:** Real-time constituent monitoring with deterministic volume and momentum scoring.
3. **Active Equity Deep-Dive Workbench:** Real-time quote cards, 52-week position range bar, valuation fundamentals, and forward forecast outlook.
4. **Multi-Model Forecast Engine:** 1-day, 5-day, 10-day, and 30-day forward price projections with expanding uncertainty cones.
5. **Quantitative Backtesting Suite:** Walk-forward validation metrics, out-of-sample holdout errors (MAE, RMSE, MAPE), and Diebold-Mariano tests.
6. **Technical Indicators:** Wilder 14-period RSI, MACD Line / Signal / Histogram, Bollinger Bands (20, 2σ), and SMAs (20/50).
7. **News Sentiment Engine:** Aggregated corporate headlines with directional sentiment polarity and source attribution.
8. **Multi-Stock Comparator:** Normalized percentage performance charts and comparative correlation metrics.
9. **Watchlist & Data Portability:** Local watchlist persistence with one-click JSON export.
10. **Terminal Configuration:** Customizable chart types, forecast horizons, model presets, and diagnostic telemetry.

---

## 5. Institutional Dashboard

The StockSense AI dashboard provides an institutional Bloomberg/Refinitiv-style terminal layout:

- **Market Tickers Strip:** Responsive sparkline cards displaying real-time levels, absolute net change, and percentage returns.
- **Market Breadth Gauge:** Visual distribution of Advances, Declines, and Unchanged equities with market status indicators.
- **Market Overview Card:** Composite market sentiment score, technical RSI level, and constituent sector allocation.
- **Market Trend Chart:** Interactive area chart supporting 1W, 1M, 3M, 1Y, and ALL timeframes.
- **Sector Allocation & Extremes:** Sector-by-sector performance bars alongside Top 5 Gainers and Top 5 Losers tables.
- **Interactive NIFTY 50 Heatmap:** 50-tile color-coded visualization of returns across the index.
- **AI Market Insight:** Algorithmic market commentary synthesizing momentum, breadth, and sector leadership.
- **Active Equity Workbench:** Comprehensive deep-dive container embedding candlestick charts, company fundamentals, and forward ML forecasts.

---

## 6. Stock Analytics

The Stock Analytics engine computes and displays key valuation and market data:
- **Price Action:** Current price, previous close, day open, day high, day low, 24-hour net movement.
- **Volume Metrics:** Current session volume, 30-day average volume, Relative Volume (RVOL) spike indicator.
- **Valuation Metrics:** Market capitalization, Price-to-Earnings (P/E) ratio, Beta volatility factor, 52-week high / low.
- **Company Fundamentals:** Detailed corporate profiles, exchange metadata, sector classification, and provenance tags.
- **Data Lineage:** Transparent metadata stamping indicating data origin (`YAHOO_FINANCE` vs. `FALLBACK_BENCHMARK`).

---

## 7. Technical Analysis

StockSense AI implements standardized econometric technical indicators calculated on historical price series:

- **Relative Strength Index (RSI):**
  $$\text{RSI} = 100 - \left[ \frac{100}{1 + \text{RS}} \right]$$
  Calculated using a 14-period Wilder exponential smoothing technique with overbought (70) and oversold (30) threshold bands.

- **Moving Average Convergence Divergence (MACD):**
  $$\text{MACD Line} = \text{EMA}_{12}(\text{Close}) - \text{EMA}_{26}(\text{Close})$$
  $$\text{Signal Line} = \text{EMA}_{9}(\text{MACD Line})$$
  $$\text{Histogram} = \text{MACD Line} - \text{Signal Line}$$

- **Bollinger Bands:**
  $$\text{Upper Band} = \text{SMA}_{20} + (2.0 \times \sigma_{20})$$
  $$\text{Lower Band} = \text{SMA}_{20} - (2.0 \times \sigma_{20})$$

---

## 8. News & Sentiment

- **Headline Aggregation:** Real-time financial headline ingestion categorized by individual equity symbols.
- **Financial NLP Scoring:** Contextual sentiment classification identifying regulatory events, corporate earnings reports, and management guidance.
- **Sentiment Polarity:** Weighted aggregate sentiment index ranging from -100 (Strong Bearish) to +100 (Strong Bullish).
- **Attribution & Timestamps:** Direct publisher attribution and article publication timestamps.

---

## 9. ML Forecasting

### Model Architectures
- **Ridge Regression (Baseline):** L2-regularized linear model with analytical closed-form optimization:
  $$W = (X^T X + \alpha I)^{-1} X^T y$$
- **Gradient Boosted Decision Trees (GBDT):** Non-linear ensemble model capturing non-linear feature interactions and regime shifts.
- **LSTM Sequence Neural Network:** Recurrent sequence model operating over sliding lookback windows to capture multi-step temporal dependencies.

### Validation Methodology & Invariance
- **Strict Chronological Splitting:** 85% chronological training set followed by an untouched 15% out-of-sample holdout test set to eliminate data leakage.
- **Expanding Walk-Forward Validation:** Time-series cross-validation (`TimeSeriesSplit`) to select the optimal model architecture prior to test set evaluation.
- **Uncertainty Quantification:** Multi-horizon residual variance cones providing 80% and 95% confidence intervals expanding over time:
  $$\text{Cone Margin}(h) = Z \times \text{RMSE}_{\text{val}} \times \sqrt{h}$$

### Academic Holdout Benchmarks (100% Invariant)

| Symbol | Selected Model | Walk-Forward Val RMSE | Final Holdout RMSE | Invariance Status |
|---|---|---:|---:|:---:|
| **AAPL** | Ridge Regression | $6.47 | $3.88 | ✅ Invariant |
| **MSFT** | Ridge Regression | $7.08 | $8.22 | ✅ Invariant |
| **NVDA** | Ridge Regression | $2.60 | $5.65 | ✅ Invariant |
| **TSLA** | Ridge Regression | $6.75 | $16.99 | ✅ Invariant |
| **RELIANCE** | Ridge Regression | ₹56.69 | ₹39.09 | ✅ Invariant |
| **TCS** | Ridge Regression | ₹73.66 | ₹65.35 | ✅ Invariant |
| **INFY** | Ridge Regression | ₹42.17 | ₹38.39 | ✅ Invariant |
| **HDFCBANK** | Ridge Regression | ₹35.04 | ₹26.36 | ✅ Invariant |

---

## 10. NIFTY 50 Trending

- **Constituent Universe:** Exactly 50 blue-chip equities listed on the National Stock Exchange of India (NSE).
- **Deterministic Trend Score:** Multi-factor trend formula combining price momentum, moving average distance, and relative volume:
  $$\text{Score} = w_1 \cdot \Delta P_{1\text{d}} + w_2 \cdot \Delta P_{5\text{d}} + w_3 \cdot \left(\frac{P - \text{SMA}_{20}}{\text{SMA}_{20}}\right) + w_4 \cdot \text{RVOL}$$
- **Market Hours Awareness:** Accurate reporting of NSE market status (`OPEN` vs. `CLOSED` based on IST 09:15–15:30 schedule).
- **Verified Endpoint:** `GET /api/stocks/trending/nifty50` (HTTP 200, 50/50 constituents ranked).

---

## 11. Watchlist

- **Client-Side Persistence:** Local browser persistence storing monitored equity symbols and entry metrics.
- **Performance Overview:** Real-time price tracking, 24h percentage return, and 5-day directional forecast summary.
- **Data Portability:** Structured JSON export allowing analysts to backup and transfer saved equity watchlists.

---

## 12. Model Performance & Backtesting

- **Out-of-Sample Metrics:** Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), Mean Absolute Percentage Error (MAPE), and Directional Accuracy (Hit Rate).
- **Diebold-Mariano Hypothesis Testing:** Rigorous pairwise statistical tests comparing model forecast residuals against naive baseline models to evaluate statistical significance ($p < 0.05$).
- **Multi-Horizon Error Analysis:** Step-by-step forecast accuracy degradation analysis across 1d, 5d, 10d, and 30d horizons.

---

## 13. Settings

The Settings terminal view provides comprehensive user configuration:
- **Display & UI:** OLED Dark Mode, Light Mode, and System OS sync with live DOM class switching; compact table density and reduced motion toggles.
- **ML & Quant Engine:** Default forecast horizon presets, model selection overrides, confidence interval widths (80%/95%/99%), and indicator lookbacks.
- **Market Telemetry:** Exchange priority preferences, auto-refresh polling intervals, and provenance watermark toggles.
- **Storage & Reset:** Watchlist JSON export, in-memory cache purging, and factory defaults restoration.
- **Truthful Diagnostics:** Real-time round-trip API telemetry latency measurements without simulated or fictitious status indicators.

---

## 14. Help & Support

- **Searchable Knowledge Base:** Instant search filtering across algorithms, technical indicators, market data feeds, and billing questions.
- **Standardized Formulas Card:** LaTeX-formatted mathematical equations for technical oscillators and forecast validation metrics.
- **Terminal Shortcuts Guide:** Quick reference for universal search (`Cmd/Ctrl + K`), modal dismissal (`Esc`), and horizon toggles (`1/2/3`).
- **Support Ticket Intake:** Validated inquiry submission form logging issues to a diagnostic queue with tracking ID generation.

---

## 15. Pricing

- **Subscription Tiers:** Free Explorer, Pro Trader, and Institutional Elite tiers.
- **Billing & Currency Toggles:** Dual currency ($ USD and ₹ INR) with dynamic monthly and annual (20% discount) calculation.
- **Entitlements Matrix:** Transparent feature comparison outlining forecast horizons, API rate limits, indicator access, and export capabilities.
- **Sandbox Checkout Modal:** Simulated zero-risk checkout experience demonstrating upgrade flows without real payment credentials.
- **Factual Security Architecture:** Clean architectural descriptions with zero unsupported claims (no fictitious PCI-DSS certifications or ungrounded security promises).

---

## 16. Payment Architecture

```text
               +----------------------------------+
               |       Frontend Pricing View      |
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |  FastAPI /api/payments/checkout  |
               +----------------------------------+
                                |
          +---------------------+---------------------+
          |                     |                     |
          v                     v                     v
   +--------------+      +--------------+      +--------------+
   | Mock Sandbox |      |    Stripe    |      |   Razorpay   |
   |   Provider   |      |   Adapter    |      |   Adapter    |
   +--------------+      +--------------+      +--------------+
          |                     |                     |
          | (Simulation)        | (HMAC-SHA256)       | (HMAC-SHA256)
          |                     | Webhook             | Webhook
          +---------------------+---------------------+
                                |
                                v
               +----------------------------------+
               |        EntitlementManager        |
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |   Supabase Persistent Storage    |
               |  - user_subscriptions            |
               |  - processed_webhook_events      |
               +----------------------------------+
```

### Security & Safety Principles
- **Sandbox / Mock Infrastructure:** ✅ ENABLED for zero-financial-risk testing and demo verification.
- **Supabase Entitlement Persistence:** ✅ ENABLED and verified against real Supabase database instances.
- **Stripe & Razorpay Adapters:** ✅ Implemented with signature verification and idempotency handling.
- **Production Provider Credentials:** 🔴 NOT CONFIGURED.
- **Real-Money Payment Activation:** 🔴 STRICTLY BLOCKED AND DISABLED.

---

## 17. Supabase Persistence

### Database Schema
Executed in Supabase PostgreSQL:
- `public.user_subscriptions`: Stores user identifiers, tier entitlements, provider references, subscription status, and expiration timestamps.
- `public.processed_webhook_events`: Stores cryptographic event IDs, provider names, event types, and processing timestamps for duplicate event rejection.

### Real Supabase Verification Summary (✅ PASS)
- **Subscription Write:** Successfully persisted test subscriber records via REST API.
- **Fresh-Process Read:** Verified entitlement retrieval across clean process restarts.
- **Cross-Instance Persistence:** Confirmed multi-instance persistence durability.
- **Cancellation Persistence:** Verified subscription status updates upon cancellation events.
- **Webhook Event Persistence:** Recorded incoming event IDs in audit tables.
- **Duplicate Webhook Idempotency:** Verified that duplicate webhook payloads are rejected without double-processing.
- **Audit Cleanup:** All temporary test records were cleanly purged following verification.

---

## 18. Testing & Validation

### Automated Backend Regression Suite
- **Command:** `python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"`
- **Result:** **122 / 122 Tests PASS** (0 failures, 0 errors, duration: 124.6s).
- **Test Areas Covered:**
  - Data quality and historical series validation
  - Ridge, XGBoost, and LSTM model execution
  - Walk-forward validation and model selection logic
  - Out-of-sample holdout isolation and invariant benchmarking
  - Diebold-Mariano statistical hypothesis testing
  - NIFTY 50 trending universe and scoring determinism
  - News NLP sentiment scoring and cache partitioning
  - Payment persistence, webhook signature verification, and idempotency
  - Vercel serverless deployment entrypoints and health endpoints

### Frontend Production Build
- **Command:** `npm run build` (within `frontend/`)
- **Result:** **PASS** (0 TypeScript errors, Vite production bundle generated).

### Browser QA
- Interactively verified across all 11 core routes: Dashboard, Forecast, Technical Analysis, Sentiment, Comparison, Watchlist, Model Performance, Pricing, Settings, Help & Support, and About.

---

## 19. Production Verification

- **Live Production URL:** `https://stock-sense-ai-eight.vercel.app`
- **Smoke Test Status:** **20 / 20 Endpoints & Routes Verified HTTP 200**

| Endpoint / Route | Method / Type | Live Status | Response Summary |
|---|:---:|:---:|---|
| `/api/health` | GET (API) | HTTP 200 | System healthy, FastAPI online |
| `/api/search?q=rel` | GET (API) | HTTP 200 | Ranked equity search results |
| `/api/stocks/AAPL` | GET (API) | HTTP 200 | US equity overview & provenance |
| `/api/stocks/RELIANCE` | GET (API) | HTTP 200 | Indian equity overview & provenance |
| `/api/forecast/AAPL` | GET (API) | HTTP 200 | Multi-horizon ML price predictions |
| `/api/news/AAPL` | GET (API) | HTTP 200 | Sentiment-scored news headlines |
| `/api/stocks/trending/nifty50` | GET (API) | HTTP 200 | 50/50 NIFTY constituent ranking |
| `/api/payments/plans` | GET (API) | HTTP 200 | Subscription tiers and feature matrix |
| `/` | SPA Route | HTTP 200 | Landing & Terminal view loaded |
| `/dashboard` | SPA Route | HTTP 200 | Institutional Dashboard loaded |
| `/trending` | SPA Route | HTTP 200 | NIFTY 50 Trending view loaded |
| `/forecast` | SPA Route | HTTP 200 | Forecast Workbench loaded |
| `/technical` | SPA Route | HTTP 200 | Technical Oscillators view loaded |
| `/sentiment` | SPA Route | HTTP 200 | News & Sentiment view loaded |
| `/compare` | SPA Route | HTTP 200 | Stock Comparison view loaded |
| `/watchlist` | SPA Route | HTTP 200 | Watchlist view loaded |
| `/model-performance` | SPA Route | HTTP 200 | Model Performance view loaded |
| `/pricing` | SPA Route | HTTP 200 | Pricing & Sandbox view loaded |
| `/settings` | SPA Route | HTTP 200 | Settings view loaded |
| `/help` | SPA Route | HTTP 200 | Help & Support view loaded |
| `/about` | SPA Route | HTTP 200 | System Architecture view loaded |

---

## 20. Git Release Checkpoints

```text
41b121f Finalize UI polish and release hardening
47bcd4b Configure 60s maxDuration for serverless ML execution in vercel.json
5af8be3 Add model-performance route alias for seamless deep-linking
553ee61 Revise README.md for improved project documentation
6ae6916 Update README with project status and details
8611416 Serve static frontend bundle from FastAPI root for unified Vercel deployment
7817799 Add payment hardening and NIFTY 50 trending
db054df Fix serverless dependencies for Vercel Python runtime
cc4c7aa Add persistent payment entitlements with Supabase
789a7f5 Add persistent Supabase entitlement storage
8b36e58 Complete institutional frontend redesign
```

---

## 21. Current Remaining Work

1. **Sandbox Payment End-to-End Validation** 🟡
   Conduct simulated checkout and webhook lifecycle testing across all tier transitions.
2. **Final Vercel Deployment & Commit Correspondence Verification** 🟡
   Confirm deployment synchronicity with the latest documentation commit.
3. **Final Documentation & Portfolio Demo Preparation** 🔵
   Prepare final demonstration videos and architecture walkthrough documents.
4. **Real-Money Stripe / Razorpay Activation** 🔴
   Strictly blocked and intentionally disabled.

---

## 22. Future Roadmap

- **Temporal Fusion Transformers (TFT):** Attention-based multi-horizon forecasting with interpretable feature weights.
- **SHAP & LIME Feature Attribution:** Game-theoretic attribution scores explaining individual session price predictions.
- **Deep Reinforcement Learning (RL):** Policy gradient agents (PPO/DDPG) for simulated algorithmic portfolio rebalancing.
- **Markowitz Mean-Variance Optimization:** Automated efficient frontier calculation and risk-adjusted asset allocation.
- **Streaming Tick Ingestion:** Low-latency WebSocket feeds for sub-second quote updates.

---

## 23. Financial Disclaimer

StockSense AI is strictly an educational and quantitative market research platform.

All machine learning forecasts, statistical price projections, technical indicators, and algorithmic sentiment scores are mathematical model estimates intended for research and educational demonstration only. They do **not** constitute financial, investment, tax, or trading advice. Past market performance and statistical model backtests do not guarantee future market returns.
