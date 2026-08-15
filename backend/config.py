"""
StockSense AI - Backend Configuration
"""

import os

class Settings:
    PROJECT_NAME: str = "StockSense AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    MARKET_DATA_API_KEY: str = os.getenv("MARKET_DATA_API_KEY", "")
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    ENABLE_LIVE_DATA: bool = os.getenv("ENABLE_LIVE_DATA", "false").lower() == "true"
    ALLOWED_ORIGINS: list = ["*"]

settings = Settings()
