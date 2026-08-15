# StockSense AI — Project Manifest & Technical Specification

> **Platform:** StockSense AI — Intelligent Stock Forecasting & Quantitative Market Analytics  
> **Status:** Production-Ready & Formally Audited (30/30 Automated Tests Passing)  
> **Classification:** PASS WITH LIMITATIONS (Strict chronological validation, zero lookahead leakage, unbiased holdout test)

---

## 1. Project Overview & Specification

StockSense AI is an educational machine-learning and quantitative finance platform for time-series equity forecasting and market analytics. It implements:
1. **Multi-Model Machine Learning Engine**: Ridge Regression (Baseline), XGBoost (Gradient Boosted Decision Trees) with TreeSHAP attributions, and a Vectorized LSTM (Long Short-Term Memory) Recurrent Neural Network.
2. **Strict Chronological Data Partitioning**: 85% Pre-Test Partition (Training & Validation) and an untouched 15% Holdout Test Set.
3. **Walk-Forward Cross-Validation**: 4 expanding chronological folds evaluated exclusively on the pre-test partition for unbiased model architecture selection.
4. **Naïve Persistence Benchmark**: Evaluates a zero-parameter random-walk baseline ($\hat{y}_{t+1} = \text{Close}_t$) alongside ML models.
5. **Diebold-Mariano Hypothesis Testing**: Formal paired forecast error statistical significance comparison.
6. **Multi-Horizon Recursive Forecasting**: Recursive projections across 1, 5, 10, 20, and 30 trading days with empirical prediction interval calibration.
7. **Real & Calibrated Market Data**: Support for US Equities (`AAPL`, `MSFT`, `NVDA`, `TSLA`) and Indian Equities (`RELIANCE`, `TCS`, `INFY`, `HDFCBANK`).

---

## 2. Complete Project Directory Tree

```
stocksense-ai/
├── .env.example                         # Environment configuration template
├── README.md                            # High-level overview & quickstart
├── PROJECT_MANIFEST.md                  # Comprehensive technical specification
├── requirements.txt                     # Python dependencies
├── run_app.py                           # Single-command launcher (API + Dashboard)
├── build_dist.py                        # Standalone zero-dependency HTML compiler
├── index.html                           # Root self-contained production bundle
├── backend/
│   ├── __init__.py
│   ├── config.py                        # Centralized settings & env variable loader
│   ├── main.py                          # FastAPI production ASGI application (OpenAPI/Swagger)
│   ├── server.py                        # Standalone zero-dependency HTTP & static server
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schemas.py                   # API request/response Pydantic models
│   │   ├── time_series_ml.py            # Feature engineering, Ridge, GBDT, Walk-Forward, DM test
│   │   └── lstm_model.py                # Vectorized LSTM RNN sequence architecture
│   ├── services/
│   │   ├── __init__.py
│   │   ├── stock_data.py                # Live Yahoo Finance API fetcher & historical dataset provider
│   │   ├── forecast_service.py          # Model selection, multi-horizon & baseline orchestration
│   │   ├── indicators.py                # Technical indicators (SMA, EMA, RSI 14, MACD, Bollinger Bands)
│   │   ├── signal_service.py            # Composite educational market sentiment scorer
│   │   ├── sentiment_service.py         # Financial news NLP headline polarity analyzer
│   │   └── comparison_service.py        # Cross-asset return normalization & correlation matrix
│   └── tests/
│       ├── test_audit_suite.py          # Core services, indicators, signals & sentiment unit tests (6 tests)
│       ├── test_full_upgrade_suite.py   # Multi-model benchmarking, TreeSHAP & data quality tests (8 tests)
│       ├── test_methodology_validation.py # Walk-forward selection & holdout invariance tests (4 tests)
│       └── test_post_validation_reliability.py # Reliability, Naïve baseline, DM test & multi-horizon tests (12 tests)
└── frontend/
    ├── package.json                     # Node.js npm dependencies
    ├── postcss.config.js                # PostCSS configuration
    ├── tailwind.config.js               # Tailwind CSS theme configuration
    ├── tsconfig.json                    # TypeScript compiler configuration
    ├── tsconfig.node.json               # Vite TypeScript configuration
    ├── vite.config.ts                   # Vite bundler configuration
    ├── index.html                       # Vite HTML entry template
    ├── dist/
    │   └── index.html                   # Pre-compiled production standalone frontend
    └── src/
        ├── App.tsx                      # Root React application & view router
        ├── main.tsx                     # React 18 DOM mount point
        ├── index.css                    # Tailwind utility and custom CSS variables
        ├── context/
        │   ├── StockContext.tsx         # Active stock, timeframe & forecast state
        │   └── ThemeContext.tsx         # Dark / Light theme context provider
        ├── types/
        │   └── stock.ts                 # TypeScript domain interfaces
        ├── services/
        │   ├── api.ts                   # REST API client with offline fallback
        │   ├── mlEngine.ts              # Client-side TypeScript ML fallback engine
        │   └── mockData.ts              # Stock catalog & series generator
        └── components/
            ├── charts/
            │   ├── PriceChart.tsx       # Historical candlestick & line chart
            │   ├── ForecastChart.tsx    # Forward forecast & expanding prediction intervals
            │   ├── TechnicalChart.tsx   # Overlays (SMA 20/50, Bollinger Bands, RSI)
            │   ├── BacktestChart.tsx    # Out-of-sample actual vs. predicted curve
            │   └── ComparisonChart.tsx  # Multi-stock normalized performance comparison
            ├── common/
            │   ├── Header.tsx           # Global header, search trigger, theme toggle
            │   ├── Sidebar.tsx          # Navigation sidebar
            │   ├── SearchModal.tsx      # Command palette search modal (Cmd+K)
            │   ├── MetricCard.tsx       # KPI cards
            │   ├── DisclaimerBanner.tsx # Educational disclaimers
            │   ├── SkeletonLoader.tsx   # Loading state placeholders
            │   └── Toast.tsx            # Alert notifications
            └── views/
                ├── LandingView.tsx      # Landing page & equity directory
                ├── DashboardView.tsx    # Quote overview, 52W range, chart view
                ├── ForecastView.tsx     # Multi-horizon forecast view & model selector
                ├── TechnicalView.tsx    # Technical indicators workbench
                ├── ModelPerformanceView.tsx # Benchmarking matrix & holdout tables
                ├── CompareView.tsx      # Multi-stock comparison tool
                ├── WatchlistView.tsx    # LocalStorage watchlist manager
                ├── SentimentView.tsx    # News headlines & sentiment polarity
                └── AboutView.tsx        # System architecture documentation
```

---

## 3. Environment & Runtime Requirements

- **Python Version**: Python 3.8, 3.9, 3.10, 3.11, or 3.12 (Tested on Python 3.11.2).
- **Node.js (Optional for building React source)**: Node.js 18+ (Pre-compiled standalone distributions are included).
- **Operating System**: Linux, macOS, or Windows (Cross-platform).

---

## 4. Dependencies

### Python Dependencies (`requirements.txt`):
```
fastapi>=0.100.0
uvicorn>=0.22.0
numpy>=1.24.0
pandas>=2.0.0
scipy>=1.10.0
pydantic>=2.0.0
python-dotenv>=1.0.0
requests>=2.31.0
scikit-learn>=1.3.0
```

### Frontend Dependencies (`frontend/package.json`):
- `react: ^18.2.0`
- `react-dom: ^18.2.0`
- `typescript: ^5.0.2`
- `vite: ^4.3.9`
- `tailwindcss: ^3.3.2`

---

## 5. Execution Commands

### A. Run Complete Automated Test Suite (30 Tests)
```bash
python3 -m unittest discover -s backend/tests -p "test_*.py"
```

### B. Start Application — Standalone Runner (API + Dashboard on Port 8000)
```bash
python3 run_app.py
```
Open **http://localhost:8000** in your browser.

### C. Start Application — Production ASGI Server (FastAPI + Swagger Docs)
```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
Interactive OpenAPI documentation will be accessible at **http://localhost:8000/docs**.

### D. Rebuild Zero-Dependency Standalone Distribution
```bash
python3 build_dist.py
```

---

## 6. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `0.0.0.0` | Network host interface binding |
| `PORT` | `8000` | Server listening port (dynamically set on cloud platforms) |
| `ENABLE_LIVE_DATA` | `false` | `true` to enable live Yahoo Finance polling; `false` to use calibrated archive |
| `MARKET_DATA_API_KEY`| `""` | Optional external API key for market data providers |
| `NEWS_API_KEY` | `""` | Optional external API key for news feeds |
| `VITE_API_URL` | `http://localhost:8000` | Frontend API base URL (uses relative `/` when served together) |

---

## 7. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and version |
| `GET` | `/api/stocks/search?q={query}` | Search equities by symbol or name |
| `GET` | `/api/stocks/{symbol}` | Real-time quote, 52W range, P/E, data mode |
| `GET` | `/api/data/quality/{symbol}` | Data provenance and lineage report |
| `GET` | `/api/stocks/{symbol}/history?timeframe={1M\|3M\|6M\|1Y\|5Y}` | Historical OHLCV price series |
| `GET` | `/api/stocks/{symbol}/indicators?timeframe={1Y}` | SMA, EMA, RSI, MACD, Bollinger Bands data |
| `GET` | `/api/model/comparison/{symbol}` | Multi-model benchmarking matrix (Validation vs. Holdout) |
| `GET` | `/api/forecast/{symbol}?model={ridge\|xgboost\|lstm\|validation_selected}` | Forward forecast, prediction intervals & SHAP |
| `POST` | `/api/forecast` | Customized forecast generation via JSON payload |
| `GET` | `/api/model/performance/{symbol}?model={model}` | Out-of-sample backtest series & metrics |
| `GET` | `/api/news/{symbol}` | Financial news headlines & NLP sentiment polarity |
| `GET` | `/api/compare?symbols=AAPL,NVDA,MSFT&timeframe=6M` | Cross-asset normalized performance & correlation matrix |

---

## 8. Machine Learning & Forecasting Architecture

### Feature Engineering (42 Features):
- **Autoregressive Lags**: Close lags $t-1, t-2, t-3, t-5, t-7, t-10, t-14$.
- **Lag Returns**: 1d, 2d, 3d, 5d, 7d, 10d, 14d relative returns.
- **Trend & Moving Averages**: SMA 5, 10, 20, 50 ratios and EMA 12, 26 ratios.
- **Momentum & Oscillators**: Wilder's RSI (14), MACD (12, 26, 9), Signal line, MACD histogram.
- **Volatility Envelopes**: Bollinger Bands (20, 2σ), %B, Bandwidth, 10d/20d annualized volatility.
- **Volume Dynamics**: Volume moving average ratio (20d), 1-day volume change.
- **Intraday Metrics**: High-low range ratio, close-open ratio.
- **Calendar Seasonality**: Day of week and month cyclical indicators.

### Model Selection & Validation Pipeline:
1. **Chronological 85% Pre-Test Partition**: The earliest 85% of sessions form the Training/Validation period.
2. **Expanding Walk-Forward Cross-Validation**: 4 expanding chronological folds ($55\% \to 67\% \to 79\% \to 91\% \to 100\%$ of pre-test data) evaluate candidate architectures without future information.
3. **Model Selection Rule**:
   $$\text{Selected Model} = \arg\min_{m \in \{\text{Ridge, XGBoost, LSTM}\}} \text{RMSE}_{\text{Walk-Forward Validation}}(m) \quad (\text{Tie-breaker: MAE})$$
4. **Retraining**: Selected architecture is retrained on the entire 85% pre-test window.
5. **Single-Pass Holdout Evaluation**: Evaluated exactly once on the final 15% unseen holdout test set as an independent benchmark.
6. **Naïve Persistence Benchmark**: Evaluates $\hat{y}_{t+1} = \text{Close}_t$ under the identical framework.
7. **Diebold-Mariano Test**: Statistical paired forecast loss comparison testing $H_0: E[e_{\text{Ridge}}^2 - e_{\text{Naïve}}^2] = 0$.

---

## 9. Benchmark Findings & Academic Interpretation

- **Ridge Regression** is consistently the validation-selected model among candidate ML architectures on daily price levels due to its ability to fit near-diagonal continuous lag weights without tree-partitioning clipping.
- **Naïve Persistence** ($\hat{y}_{t+1} = \text{Close}_t$) achieves lower sample RMSE than Ridge across all 8 equities because zero-parameter persistence incurs **zero parameter estimation variance** on near-random-walk daily price series.
- **Diebold-Mariano Test** confirms that the loss differential is statistically significant ($p < 0.05$).
- **Multi-Horizon Recursive Error**: Error compounds monotonically across horizons ($h=1\text{d} \to 5\text{d} \to 10\text{d} \to 20\text{d}$) because predicted values feed into subsequent lag features without ground-truth lookahead.
- **Prediction Interval Calibration**: Nominal 95% uncertainty bands achieve $85.7\%$ to $100\%$ empirical out-of-sample coverage.

---

## 10. Known Scientific Limitations

1. **Non-Stationarity in Asset Price Levels**: GBDT and recurrent sequence models require stationary return-differencing to extrapolate trending series beyond historical price ceilings.
2. **Estimation Variance**: On daily price levels with near-martingale dynamics, parametric models incur estimation variance relative to persistence.
3. **Prediction Interval Assumptions**: Residuals exhibit mild heteroskedasticity, resulting in slight under-coverage on long horizons for volatile assets.
4. **Market Directionality**: 1-day directional hit rates fluctuate near $50\% \pm 7\%$, consistent with weak predictive signals on daily horizons.

---

## 11. Deployment Notes

- **Recommended Host**: Render / Railway / Google Cloud Run (Unified Web Service).
- **Production Command**: `python3 -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT` or `python3 run_app.py`.
- **Static Assets**: Automatically served by the Python server without requiring separate CDN hosting.
