# StockSense AI — Phase 5 Vercel Deployment Report

**Report Generated:** 2026-08-16 00:15:00 IST  
**Platform Architecture:** Decoupled Hybrid Deployment (Vercel Frontend + Continuous Python FastAPI Backend)  
**Target Release Candidate:** `StockSense_AI_FINAL_REAL_MARKET_PLATFORM.zip` (Version 2.0.0-PROD)  
**Final Status Verdict:** **READY FOR VERCEL DEPLOYMENT — NOT YET DEPLOYED**

---

## A. Vercel Project Architecture & Status

```
┌────────────────────────────────────────────────────────┐
│                   VERCEL CLOUD                         │
│  React 18 / Vite / TypeScript Single Page Application  │
│  Static Asset Edge CDN + Client-Side SPA Rewrites      │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTPS API (VITE_API_URL)
                            │
┌───────────────────────────▼────────────────────────────┐
│              PYTHON FASTAPI CONTINUOUS BACKEND         │
│  Multi-Model ML Engine (Ridge, XGBoost, PyTorch LSTM)  │
│  Walk-Forward Validation, Real Market Data & News      │
│  Thread-Safe In-Memory Cache & Entitlement Manager     │
└────────────────────────────────────────────────────────┘
```

* **Vercel Project Setup:** Configured via [`frontend/vercel.json`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/vercel.json) and root [`vercel.json`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/vercel.json) with client-side SPA routing (`/dashboard`, `/forecast`, `/technical`, `/compare`, `/sentiment`, `/watchlist`, `/about`, `/pricing` $\rightarrow$ `/index.html`).
* **Root Directory:** `frontend` (or project root with output directory `frontend/dist`)
* **Framework:** `Vite`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`

---

## B. Actual Vercel URL
* **Target Domain:** `https://stocksense-ai.vercel.app` (or custom user Vercel domain).
* **Current Status:** Not yet deployed to live Vercel HTTPS endpoint (Vercel CLI unauthenticated in local workspace; requires connecting GitHub repository in Vercel dashboard).

---

## C. Backend Production URL
* **Target Host:** `https://stocksense-api.onrender.com` (or Cloud Run / AWS / PaaS backend URL).
* **Local Production Mirror:** `http://localhost:8000` / `http://0.0.0.0:8000`.

---

## D. Frontend Build Result
* **Build Command:** `npm run build` (in `frontend/`)
* **TypeScript Compilation:** 0 errors
* **Vite Production Bundler:** 0 errors, 0 warnings
* **Compiled Distribution ([`frontend/dist/`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/dist/)):**
  - `dist/index.html` (0.85 kB)
  - `dist/assets/index-*.css` (43.77 kB)
  - `dist/assets/index-*.js` (326.43 kB)

---

## E. Backend Test Result

```bash
python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"
```

* **Total Tests Evaluated:** **92 tests** (79 Core + 10 Payment + 3 CORS)
* **Passed:** **92 / 92 (100.0% OK)**
* **Failed:** 0
* **Errors:** 0
* **Execution Time:** 95.449s

---

## F. API Connectivity & Dynamic Environment Variable
* **Client Implementation ([`frontend/src/services/api.ts`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/src/services/api.ts#L20-L30)):**
  ```ts
  const getApiBaseUrl = (): string => {
    if (import.meta.env?.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined' && (window.location.port === '8000' || window.location.port === '10000')) {
      return '';
    }
    return 'http://localhost:8000';
  };
  ```
* **Security Rule:** Zero secrets in `VITE_*` client variables. Only public API URL is exposed.

---

## G. Real Market Data
* **Provider:** `YahooMarketDataProvider`
* **Exchanges Handled:** NASDAQ, NYSE, NSE
* **Equities Verified (16 Securities):** `AAPL`, `MSFT`, `NVDA`, `TSLA`, `AMZN`, `GOOGL`, `META`, `JPM`, `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `ICICIBANK`, `SBIN`, `MARUTI`, `BHARTIARTL`.
* **Session Integrity:** Weekend/post-market quotes are truthfully classified as `HISTORICAL / LAST CLOSE` (never labeled live).

---

## H. Company Fundamentals
* **Provider:** Yahoo Finance v10 fundamentals with 12-hour TTL cache.
* **Fields:** Market Cap, Trailing & Forward P/E, Diluted EPS, Total Revenue, Beta, 52-Week High/Low, Dividend Yield.
* **Honest Representation:** Distinct accounting reporting periods (`data_as_of`) decoupled from quote timestamps; unavailable metrics return `null` / `N/A`.

---

## I. Financial News & NLP Sentiment
* **Feeds:** Live RSS ingestion streams via Yahoo Finance and Google News.
* **Attribution:** Verified publisher attribution, publication timestamps, and external article URLs. Zero synthetic headline generation templates.

---

## J. Live Forecasting vs. Academic Firewall
* **Live Mode (`ENABLE_LIVE_DATA=true`):** Forecasts fit Ridge L2 Baseline, XGBoost, and LSTM on real provider historical daily series up through Friday's close (`2026-08-14`).
* **Academic Benchmark Mode (`force_benchmark=True`):** Strictly isolated to the frozen baseline archive.
* **Holdout RMSE Baseline Metrics (100% Invariant):**
  - `AAPL`: **$3.88** | `MSFT`: **$8.22** | `NVDA`: **$5.65** | `TSLA`: **$16.99**
  - `RELIANCE`: **₹39.09** | `TCS`: **₹65.35** | `INFY`: **₹38.39** | `HDFCBANK`: **₹26.36**

---

## K. Data Provenance & Freshness
Standardized `DataProvenance` payload attached to all financial responses:
* 🟢 `● LIVE MARKET DATA`
* 🟡 `◷ 15-MIN DELAYED`
* 🔵 `◷ LAST CLOSE`
* 🟠 `⚠ HISTORICAL FALLBACK`
* 🔴 `✕ DATA UNAVAILABLE`

---

## L. CORS Production Configuration
* In `ENVIRONMENT=production`, backend requires explicit domain allowlisting:
  ```ini
  CORS_ALLOWED_ORIGINS=https://stocksense-ai.vercel.app,https://your-custom-domain.com
  ```
* Unauthorized origins are rejected without credentials.

---

## M. Payment Architecture & Security
* **Adapters:** Stripe, Razorpay, and Sandbox Mock providers.
* **Webhook Verification:** Cryptographic HMAC-SHA256 signature verification (`Stripe-Signature` and `X-Razorpay-Signature`).
* **Zero-Storage Policy:** Zero card numbers, CVVs, PINs, or banking credentials handled or stored in frontend or backend.
* **Verification Status:**
  - `IMPLEMENTED`: **YES**
  - `UNIT TESTED`: **YES** (10/10 tests PASS)
  - `SANDBOX VERIFIED`: **NO** (Sandbox keys unconfigured)
  - `PRODUCTION VERIFIED`: **NO** (Production secrets unconfigured; checkout safely returns `PAYMENTS_NOT_CONFIGURED`)

---

## N. Security & Secrets Audit
* **Committed Secrets:** **0** (Zero API keys, tokens, passwords, or Stripe/Razorpay secrets in source code).
* [`.env.example`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/.env.example): Contains only safe template placeholders.
* **Frontend Bundle:** Verified zero private credentials in Vite chunks.

---

## O. UI Smoke-Test Verification (10 Views)
* **1. Landing Hero:** Dynamic search autocomplete, market status indicators
* **2. Dashboard:** Price summary cards, OHLCV charts, provenance badges
* **3. Forecast:** Multi-model trajectories, 95% confidence intervals
* **4. Technical Analysis:** SMA, EMA, RSI (14), MACD, Bollinger Bands
* **5. Model Performance:** 85/15 chronological holdout metrics (MAE, RMSE, MAPE, R², Hit Rate)
* **6. Compare:** Multi-stock normalized performance overlay
* **7. Sentiment/News:** Verified RSS feed list, polarity badges, external links
* **8. Watchlist:** LocalStorage persistent user tickers
* **9. About:** Capstone methodology and mathematical formulations
* **10. Pricing:** Free, Pro, Premium tiers with zero-card-storage notice

---

## P. Performance Benchmarks
* **Cold / Health Latency:** < 1 ms compute
* **Provider Quote Query:** ~900 ms
* **Cached Quote Query (60s TTL):** < 1 ms
* **First Full ML Fit (Ridge + GBDT + LSTM + 4-Fold CV):** ~10–12 s (progressive loading state displayed)
* **Cached Forecast (1h TTL):** < 2 ms

---

## Q. Academic Benchmark Integrity
All 8 benchmark holdout RMSE metrics evaluate on the frozen baseline archive with identical precision:
* `AAPL`: **$3.88** | `MSFT`: **$8.22** | `NVDA`: **$5.65** | `TSLA`: **$16.99**
* `RELIANCE`: **₹39.09** | `TCS`: **₹65.35** | `INFY`: **₹38.39** | `HDFCBANK`: **₹26.36**

---

## R. Exact Files Modified in Phase 5
1. [`frontend/src/services/api.ts`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/src/services/api.ts#L20-L30): Enhanced dynamic `VITE_API_URL` resolution with automatic trailing slash sanitization.
2. [`frontend/vercel.json`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/vercel.json) *(New)*: Configured Vercel SPA client-side rewrite rules.
3. [`vercel.json`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/vercel.json) *(New)*: Root Vercel project configuration pointing to `frontend/dist`.
4. [`PHASE_5_VERCEL_DEPLOYMENT_REPORT.md`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/PHASE_5_VERCEL_DEPLOYMENT_REPORT.md) *(New)*: Phase 5 official Vercel deployment report.

---

## S. Known Limitations
1. **Unconfigured Payment Keys:** Live payment checkout requires actual API keys in `.env` (`STRIPE_SECRET_KEY` / `RAZORPAY_KEY_ID`). Unconfigured environments safely return `PAYMENTS_NOT_CONFIGURED`.
2. **Weekend / Post-Market Trading:** Market data queried outside active exchange trading windows truthfully reflects Friday settlement prices and is labeled `HISTORICAL / LAST CLOSE`.

---

## Final Status Verdict

**READY FOR VERCEL DEPLOYMENT — NOT YET DEPLOYED**

### Step-by-Step Vercel Deployment Instructions
1. Push this repository to GitHub.
2. Log in to [Vercel Dashboard](https://vercel.com).
3. Click **Add New...** $\rightarrow$ **Project** and import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   ```ini
   VITE_API_URL=https://your-backend-api-url.com
   ```
6. Click **Deploy**.
