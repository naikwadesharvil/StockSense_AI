#!/usr/bin/env python3
"""
StockSense AI - Single-Command Launch Runner
Runs the high-performance Python API server and serves the frontend web dashboard.

Usage:
    python3 run_app.py
"""

import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.server import run_server

def main():
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    print("==================================================================", flush=True)
    print(" 🚀 STOCKSENSE AI — Intelligent Stock Forecasting Platform", flush=True)
    print(" Developed as an Academic AIML Machine Learning Capstone Project", flush=True)
    print("==================================================================", flush=True)
    print(f" Web Dashboard URL: http://localhost:{port}", flush=True)
    print(f" REST API Base URL: http://localhost:{port}/api", flush=True)
    print("==================================================================", flush=True)
    print(" Active Features:", flush=True)
    print("  ✓ Machine Learning Time-Series Regressor with L2 Regularization", flush=True)
    print("  ✓ Multi-Horizon Forecasting (1d, 5d, 10d, 30d) + 95% Confidence Cones", flush=True)
    print("  ✓ Quantitative Technical Indicators (SMA, EMA, RSI 14, MACD, BB)", flush=True)
    print("  ✓ Out-of-Sample Backtesting (MAE, RMSE, MAPE, R², Hit Rate)", flush=True)
    print("  ✓ Multi-Stock Normalization & Correlation Heatmap", flush=True)
    print("  ✓ NLP Financial News Sentiment Analysis", flush=True)
    print("  ✓ Persistent Portfolio Watchlist", flush=True)
    print("==================================================================", flush=True)
    print(" Press Ctrl+C to terminate the server.\n", flush=True)

    run_server(port=port, host=host)

if __name__ == "__main__":
    main()
