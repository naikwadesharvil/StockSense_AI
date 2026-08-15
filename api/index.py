"""
StockSense AI - Vercel Serverless Function Entrypoint
Exposes the FastAPI application instance `app` for Vercel Serverless Python runtime.
"""

import sys
import os

# Inject repository root into Python module search path
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Import the production FastAPI application
from backend.main import app
