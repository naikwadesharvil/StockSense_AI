"""
StockSense AI - Production Performance Response Time Measurement
Measures authentic cold, warm/cached, and ML forecast response latencies.
"""

import time
import urllib.request
import json

BASE_URL = "http://localhost:8000"

def measure_endpoint(url: str, desc: str, runs: int = 2):
    times = []
    for i in range(runs):
        start = time.perf_counter()
        req = urllib.request.Request(url, headers={"User-Agent": "PerfBenchmark/2.0"})
        with urllib.request.urlopen(req, timeout=35.0) as resp:
            resp.read()
        dur_ms = (time.perf_counter() - start) * 1000.0
        times.append(dur_ms)
    return times

def run_benchmarks():
    print("=" * 80)
    print("STOCKSENSE AI — PRODUCTION RUNTIME PERFORMANCE MEASUREMENTS")
    print("=" * 80)
    
    endpoints = [
        (f"{BASE_URL}/api/health", "Health Status (/api/health)"),
        (f"{BASE_URL}/api/stocks/AAPL", "AAPL Quote (/api/stocks/AAPL)"),
        (f"{BASE_URL}/api/stocks/NVDA", "NVDA Quote (/api/stocks/NVDA)"),
        (f"{BASE_URL}/api/stocks/RELIANCE", "RELIANCE Quote (/api/stocks/RELIANCE)"),
        (f"{BASE_URL}/api/news/AAPL", "AAPL News Feed (/api/news/AAPL)"),
        (f"{BASE_URL}/api/forecast/AAPL", "AAPL ML Multi-Model Forecast (/api/forecast/AAPL)")
    ]

    print(f"{'ENDPOINT':<45} | {'RUN 1 (INITIAL)':<16} | {'RUN 2 (CACHED)':<16}")
    print("-" * 80)

    for url, desc in endpoints:
        try:
            durations = measure_endpoint(url, desc, runs=2)
            run1_str = f"{durations[0]:.2f} ms"
            run2_str = f"{durations[1]:.2f} ms"
            print(f"{desc:<45} | {run1_str:<16} | {run2_str:<16}")
        except Exception as e:
            print(f"{desc:<45} | ERROR: {e}")

    print("=" * 80)

if __name__ == "__main__":
    run_benchmarks()
