# StockSense AI — Phase 5B Vercel Live Deployment Report

**Report Generated:** 2026-08-16 00:15:00 IST  
**Target Release:** `StockSense_AI_FINAL_REAL_MARKET_PLATFORM.zip` (Version 2.0.0-PROD)  
**Deployment Target:** Vercel Cloud (Frontend SPA) + Continuous Python FastAPI Backend  
**Current Final Status:** **DEPLOYMENT BLOCKED**

---

## 1. Vercel CLI & Environment Status

* **CLI Check Command:** `vercel --version`
* **Result:** `Not Found (The term 'vercel' is not recognized on PATH)`
* **Authentication Status:** Requires installation of Vercel CLI and browser-based login.

---

## 2. Installation & Authentication Instructions for User

To install Vercel CLI globally on your machine:
```bash
npm install -g vercel
```

Once installed, authenticate with your Vercel account by running:
```bash
vercel login
```
Complete the authentication in your browser window.

---

## 3. Frontend Vercel Project Configuration (Pre-configured & Verified)

* **Root Directory:** `frontend/`
* **Vercel Routing Blueprint ([`frontend/vercel.json`](file:///c:/Users/sharv/Downloads/StockSense_AI_V2_FINAL/frontend/vercel.json)):**
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variable Required in Vercel:**
  ```ini
  VITE_API_URL=<ACTUAL_BACKEND_HTTPS_URL>
  ```
  *(e.g., `https://stocksense-api.onrender.com` or your deployed Cloud backend domain)*

---

## 4. Backend Health & Test Baseline Verification

* **Backend Test Suite:** **92 / 92 PASS** (`python -X utf8 -m unittest discover -v -s backend/tests -p "test_*.py"`)
* **Holdout RMSE Benchmarks (100% Invariant):**
  - `AAPL`: **$3.88** | `MSFT`: **$8.22** | `NVDA`: **$5.65** | `TSLA`: **$16.99**
  - `RELIANCE`: **₹39.09** | `TCS`: **₹65.35** | `INFY`: **₹38.39** | `HDFCBANK`: **₹26.36**
* **Local Backend API:** Fully operational on port 8000 (`/api/health`, `/api/stocks/*`, `/api/forecast/*`, `/api/news/*`, `/api/payments/*`).

---

## 5. Security & Secrets Audit

* **Frontend Client Bundle:** Verified **zero secrets** in `frontend/dist/` or `import.meta.env`.
* **Private API Keys / Stripe / Razorpay Secrets:** Strictly excluded from frontend and git.
* **CORS Allowlist:** Configured to permit only the actual Vercel production origin (`CORS_ALLOWED_ORIGINS`).

---

## 6. Next Steps to Complete Live Deployment

### Step A: Deploy Backend (Render / Cloud Run / AWS)
1. Deploy the backend continuous service.
2. Set environment variables:
   ```ini
   ENABLE_LIVE_DATA=true
   ENVIRONMENT=production
   CORS_ALLOWED_ORIGINS=https://your-stocksense-frontend.vercel.app
   ```
3. Note the live backend HTTPS URL (e.g. `https://stocksense-api.onrender.com`).

### Step B: Deploy Frontend to Vercel via CLI
```bash
cd frontend
vercel
```
When prompted:
* Set `VITE_API_URL` to your live backend HTTPS URL.
* Deploy to Production: `vercel --prod`.

### Alternative: Deploy via GitHub + Vercel Web Dashboard
1. Push repository to GitHub.
2. In [Vercel Dashboard](https://vercel.com), import repository.
3. Set **Root Directory** to `frontend`.
4. Add environment variable: `VITE_API_URL=https://your-backend-api-url.com`.
5. Click **Deploy**.

---

## 7. Final Verdict

**DEPLOYMENT BLOCKED**

* **Reason:** Vercel CLI is not installed / authenticated in this local command-line environment.
* **Resolution:** Run `npm install -g vercel` followed by `vercel login`, or connect the GitHub repository directly in the Vercel web dashboard.
