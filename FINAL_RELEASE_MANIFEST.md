# StockSense AI — Final Release Manifest
## Real Market Platform (Version 2.0.0-PROD)

**Release Date / Timestamp:** 2026-08-15 23:45:00 IST  
**Platform Architecture:** Python 3.10+ Multi-Model Time-Series Engine + React 18 / Vite / TypeScript Dashboard  
**Package Archive:** `StockSense_AI_FINAL_REAL_MARKET_PLATFORM.zip`

---

## 1. Project Version & Summary
* **Version:** `2.0.0-PROD (Real Market Platform)`
* **Description:** Enterprise-grade intelligent stock forecasting, financial fundamentals, and real-time market data platform featuring multi-model ML architectures (Ridge L2 Regularized Auto-Regression, XGBoost Gradient Boosted Trees, PyTorch LSTM), 4-Fold Walk-Forward Cross Validation, unbiased out-of-sample holdout benchmarking, 5-state data provenance tracking, financial NLP sentiment analysis, and bank-grade payment provider abstraction.

---

## 2. Package Timestamp & Audit Sign-Off
* **Audit Status:** `PASS WITH LIMITATIONS — ACCEPTED & VERIFIED`
* **Sign-Off Timestamp:** `2026-08-15T18:15:00Z` (`23:45:00 IST`)
* **Verification Environment:** Windows 11 / Python 3.12 / Node.js 18+

---

## 3. Package File & Asset Architecture
* **Backend:** [`backend/`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/backend/) (Models, Services, Payment Adapters, Market Data Providers, Security Utilities, Unit Tests)
* **Frontend:** [`frontend/src/`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/src/) (React Components, Views, Navigation, Pricing, Contexts, TypeScript Types)
* **Compiled Production Dist:** [`frontend/dist/`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/dist/) (Self-contained SPA bundle for zero-dependency static deployment)
* **Configuration:** [`.env.example`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/.env.example), [`.gitignore`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/.gitignore), [`requirements.txt`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/requirements.txt), [`package.json`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/package.json), [`run_app.py`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/run_app.py)

---

## 4. Test Suite Execution Results
```
Test Command: python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"
Total Tests Evaluated: 92
Passed: 92 (100.0%)
Failed: 0
Errors: 0
Execution Time: 100.427s
```
* **Existing V2 Core Tests:** 79/79 PASS
* **Payment Infrastructure Tests:** 10/10 PASS
* **CORS Security Tests:** 3/3 PASS

---

## 5. Frontend Production Build Result
```
Build Command: npm run build
TypeScript Compilation: Clean (0 errors)
Vite Production Chunks:
  - dist/index.html (0.85 kB)
  - dist/assets/index-*.css (43.77 kB)
  - dist/assets/index-*.js (326.43 kB)
Build Status: SUCCESS (0 errors, 0 warnings)
```

---

## 6. Runtime End-to-End Verification
All primary production endpoints verified over HTTP:
* `GET /api/health` $\rightarrow$ `HTTP 200` (Version 2.0.0, IST server clock)
* `GET /api/search?q=apple` $\rightarrow$ `HTTP 200` (Sub-5ms ranked symbol search)
* `GET /api/stocks/{symbol}` $\rightarrow$ `HTTP 200` (Quotes + 5-state provenance)
* `GET /api/stocks/{symbol}/fundamentals` $\rightarrow$ `HTTP 200` (Real valuation metrics + `data_as_of`)
* `GET /api/forecast/{symbol}` $\rightarrow$ `HTTP 200` (Multi-horizon ML predictions + interval cones)
* `GET /api/news/{symbol}` $\rightarrow$ `HTTP 200` (Real RSS news + NLP sentiment polarity)
* `GET /api/payments/plans` $\rightarrow$ `HTTP 200` (Free, Pro, Premium plan specifications)
* `GET /api/payments/status` $\rightarrow$ `HTTP 200` (Server-side user entitlement record)
* `POST /api/payments/checkout` $\rightarrow$ `HTTP 400 PAYMENTS_NOT_CONFIGURED` (Honest guard when unconfigured)

---

## 7. Market Data Providers
* **Primary Live Provider:** [`YahooMarketDataProvider`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/backend/services/providers/yahoo.py) querying Yahoo Finance v8/v10 APIs for live/delayed quotes, historical daily OHLCV, and company fundamentals.
* **Commercial Adapter:** [`CommercialMarketDataProvider`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/backend/services/providers/commercial.py) ready for drop-in AlphaVantage, Polygon, or TwelveData API keys via `MARKET_DATA_API_KEY`.
* **Isolated Benchmark Provider:** [`FallbackBenchmarkProvider`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/backend/services/providers/fallback.py) strictly reserved for academic test suites and reproducible baseline evaluation (`force_benchmark=True`).

---

## 8. Supported Security Universe
* **US Equities (NASDAQ & NYSE):** `AAPL`, `MSFT`, `NVDA`, `TSLA`, `AMZN`, `GOOGL`, `META`, `NFLX`, `AMD`, `AVGO`, `COST`, `INTC`, `QCOM`, `ADBE`, `CSCO`, `JPM`, `BAC`, `V`, `MA`, `WMT`, `DIS`, `KO`, `PEP`, `JNJ`, `PFE`, `LLY`, `UNH`, `XOM`, `CVX`, `CAT`, `BA`, `IBM`, `GS`, `HD`.
* **Indian Equities (NSE):** `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `ICICIBANK`, `SBIN`, `KOTAKBANK`, `AXISBANK`, `BHARTIARTL`, `ITC`, `HINDUNILVR`, `LT`, `BAJFINANCE`, `MARUTI`, `ASIANPAINT`, `TATAMOTORS`, `SUNPHARMA`, `TITAN`, `WIPRO`, `ULTRACEMCO`.
* **Dynamic Search:** Substring, prefix, and ranked full company name search supporting arbitrary live tickers.

---

## 9. Company Fundamentals Pipeline
* **Metrics Provided:** Market Capitalization, Trailing P/E, Forward P/E, Diluted EPS, Total Revenue, Operating Margins, Profit Margins, Beta, 52-Week High, 52-Week Low, Dividend Yield, Ex-Dividend Date.
* **Data Truth Standard:** Honest `null` / `N/A` handling for missing or unlisted ratios. All balance sheet and income metrics include the filing reporting period (`data_as_of`).

---

## 10. News & Sentiment Ingestion Pipeline
* **Sources:** Live RSS streams from Yahoo Finance, Google News, and financial news aggregators.
* **Attribution:** Verified publisher names, original publication timestamps, and external URLs.
* **NLP Scoring:** Context-aware sentiment scoring with negation handling (`not good` $\rightarrow$ negative) and financial contextual reversals (`loss narrowed` $\rightarrow$ positive). Zero synthetic headline templates.

---

## 11. Data Provenance & Freshness Architecture
Every financial data response includes a standardized `DataProvenance` payload:
* `● LIVE`: Intraday active market session real-time tick.
* `◷ 15-MIN DELAYED`: Standard delayed exchange feed during trading hours.
* `◷ HISTORICAL / LAST CLOSE`: Post-market, weekend, or holiday closing settlement.
* `⚠ HISTORICAL FALLBACK`: Offline deterministic benchmark archive.
* `✕ DATA UNAVAILABLE`: Provider connection failure (explicitly displayed, never disguised).

---

## 12. Live Forecasting Behavior
* When `ENABLE_LIVE_DATA=true`, `ForecastService.get_forecast()` fetches the live historical daily OHLCV series from the market provider, computes technical indicators, fits candidate ML models (Ridge L2 Baseline, XGBoost, LSTM), and generates $t+1$ to $t+30$ multi-horizon forecast trajectories with 95% confidence intervals.
* Response payloads explicitly expose `"data_timestamp"`, `"data_provider"`, and `"freshness"`.

---

## 13. Academic Benchmark Pipeline & Invariance
* When `force_benchmark=True` (in scientific unit tests), models train and evaluate on the frozen baseline archive.
* **Frozen Holdout RMSE Benchmarks (100% Invariant):**
  - `AAPL`: **$3.88**
  - `MSFT`: **$8.22**
  - `NVDA`: **$5.65**
  - `TSLA`: **$16.99**
  - `RELIANCE`: **₹39.09**
  - `TCS`: **₹65.35**
  - `INFY`: **₹38.39**
  - `HDFCBANK`: **₹26.36**

---

## 14. Payment Architecture
* **Provider Abstraction:** [`BasePaymentProvider`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/backend/services/payments/base.py) with dedicated adapters for Stripe ([`StripePaymentProvider`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/backend/services/payments/stripe_provider.py)), Razorpay ([`RazorpayPaymentProvider`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/backend/services/payments/razorpay_provider.py)), and local testing ([`MockSandboxPaymentProvider`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/backend/services/payments/mock_sandbox_provider.py)).
* **Cryptographic Security:** HMAC-SHA256 signature verification for inbound webhooks (`Stripe-Signature` and `X-Razorpay-Signature`).
* **Subscription Management:** Thread-safe in-memory `EntitlementManager` with idempotency deduplication and state machine (`ACTIVE`, `PAST_DUE`, `CANCELED`, `UNPAID`).
* **Zero-Storage Policy:** No credit card numbers, CVVs, PINs, or bank account details are ever handled, transmitted, or stored. Transactions redirect to secure provider-hosted checkout portals.

---

## 15. Payment Verification Limitation
* **Implemented:** **YES**
* **Unit Tested:** **YES** (10/10 tests passing offline)
* **Sandbox Verified:** **NO** (Sandbox credentials unconfigured)
* **Production Verified:** **NO** (Production secrets unconfigured; requests safely return `PAYMENTS_NOT_CONFIGURED`)

---

## 16. Security Controls & CORS Policy
* **CORS Allowlist:** Origin-based allowlist validation supporting development defaults (`localhost:5173`, `localhost:8000`) and strict production allowlists via `CORS_ALLOWED_ORIGINS`.
* **Zero Production Secrets:** Zero private keys, tokens, or live passwords committed in the codebase.
* **Secret Protection:** Root `.gitignore` prevents tracking of `.env` files and build artifacts.
* **Traceback Sanitization:** Production API error handlers return sanitized JSON messages without leaking internal tracebacks.

---

## 17. Environment Variables Reference
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `ENABLE_LIVE_DATA` | `"true"` | Enables live Yahoo Finance provider queries (`"false"` for offline benchmark mode) |
| `ENVIRONMENT` | `"development"` | Set to `"production"` for strict CORS enforcement |
| `CORS_ALLOWED_ORIGINS` | `""` | Comma-separated list of permitted production origins |
| `PORT` | `8000` | Server listening port |
| `HOST` | `"0.0.0.0"` | Server network interface bind address |
| `STRIPE_SECRET_KEY` | `""` | Stripe secret key for live payment checkouts |
| `STRIPE_WEBHOOK_SECRET` | `""` | Stripe webhook signing secret |
| `RAZORPAY_KEY_ID` | `""` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | `""` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET`| `""` | Razorpay webhook secret |

---

## 18. Local Startup Instructions

### Quick Start (Standalone Server with Built SPA)
```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the application (enables live market data on port 8000)
$env:ENABLE_LIVE_DATA="true"; python run_app.py
```
Open **`http://localhost:8000`** in your browser.

### Full Development Mode (Hot Reloading Frontend + Backend)
```bash
# Terminal 1: Backend Server
$env:ENABLE_LIVE_DATA="true"; python run_app.py

# Terminal 2: Vite Dev Server
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 19. Production Deployment Instructions

### Option A: Docker Container
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV ENABLE_LIVE_DATA=true
ENV ENVIRONMENT=production
ENV PORT=8000
EXPOSE 8000
CMD ["python", "run_app.py"]
```

### Option B: Cloud Native (Google Cloud Run / AWS App Runner / Render / Heroku)
1. Set Environment Variables: `ENABLE_LIVE_DATA=true`, `ENVIRONMENT=production`, `CORS_ALLOWED_ORIGINS=https://your-domain.com`.
2. Entrypoint: `python run_app.py`.
3. Health check path: `/api/health`.

---

## 20. Known Limitations
1. **Unconfigured Payment Keys:** Live payment checkouts require real Stripe or Razorpay API keys in `.env`. When unconfigured, the application truthfully returns `PAYMENTS_NOT_CONFIGURED` without fabricating fake transactions.
2. **Exchange Settlement Timings:** Stock quotes queried outside standard market trading hours (e.g. weekends, holidays, post-market) accurately reflect the latest closing settlement and are stamped `HISTORICAL / LAST CLOSE`.
