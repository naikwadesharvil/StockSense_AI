# StockSense AI V2 — Intelligent Stock Forecasting & Market Analytics

> **Quantitative Financial Machine Learning Platform with Walk-Forward Cross-Validation, Naïve Persistence Benchmarking, and Diebold-Mariano Statistical Testing.**

---

## ⚡ Performance Statement

> **"StockSense AI V2 delivers first-content rendering in approximately 116 ms and cached repeat forecasts in approximately 21 ms, while preserving the full validated ML pipeline for the first uncached forecast (approximately 12 seconds)."**

> **"The performance improvement comes from progressive rendering, request deduplication, vectorized indicator calculations, and partitioned TTL caching. The underlying ML methodology and benchmark results were not changed."**

---

## 🚀 Key Architectural Features

- **Multi-Model Machine Learning Engine**: Closed-form L2 Regularized Ridge Regression, Gradient Boosted Decision Trees (GBDT) with TreeSHAP explanations, and Vectorized Sequence-to-Value Long Short-Term Memory (LSTM) Recurrent Neural Networks.
- **Strict Chronological Data Splitting**: 85% Pre-Test Partition (Training & Validation) and an unpolluted 15% Holdout Test Set.
- **Walk-Forward Cross-Validation**: 4 expanding chronological folds evaluated exclusively on the pre-test partition for unbiased model architecture selection.
- **Zero-Parameter Naïve Persistence Baseline**: Persistent benchmark ($\hat{y}_{t+1} = \text{Close}_t$) evaluated under the identical chronological framework.
- **Diebold-Mariano Hypothesis Testing**: Formal paired forecast error statistical significance comparison ($p < 0.05$).
- **Multi-Horizon Recursive Forecasting**: Recursive forecasts across 1, 5, 10, 20, and 30 trading days with calibrated prediction interval coverage.
- **Progressive UI Architecture**: Instantaneous initial rendering (<120 ms cold / <11 ms warm) with staged background forecast updates.

---

## 📊 V1 vs. V2 Performance Benchmarks

| Metric / Endpoint | V1 Baseline | V2 Cold Start | V2 Warm Cache | Speedup |
|---|---|---|---|---|
| **First-Content Render (Hero, Price, Chart)** | ~12,713 ms | **~115.90 ms** | **~10.13 ms** | **99.9% faster** |
| **Technical Snapshot (RSI, MACD, BB)** | ~12,713 ms | **~173.94 ms** | **~17.07 ms** | **99.8% faster** |
| **Full Forecast Readiness (Trajectory & Bands)**| ~12,713 ms | **~12,139.54 ms** | **~21.21 ms** | **Instant repeat switching** |

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run All Automated Tests (37 Tests)
```bash
python3 -m unittest discover -s backend/tests -p "test_*.py"
```

### 3. Start StockSense AI V2
```bash
python3 run_app.py
```
Open **http://localhost:8000** in your browser.

---

## 🧪 Scientific Benchmark Summary

Across all 8 evaluated equities (US: `AAPL`, `MSFT`, `NVDA`, `TSLA` | India: `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`):
- **Ridge Regression** is the validation-selected architecture among candidate ML models on nominal daily price levels.
- **Naïve Persistence** achieves lower sample squared error than Ridge because zero-parameter persistence incurs zero parameter estimation variance on near-martingale asset price series.
- **Diebold-Mariano Test** confirms that this loss differential is statistically significant ($p < 0.05$).

*Disclaimer: StockSense AI V2 is an academic educational machine-learning project. All projections are statistical estimates and do not constitute financial advice.*
