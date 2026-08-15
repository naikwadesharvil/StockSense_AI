"""
StockSense AI - Comprehensive AIML Upgrade Test Suite
Automated validation of:
  - Real market data provider (US & Indian Equities)
  - Data Quality Lineage reports
  - Ridge Regression Baseline Model
  - XGBoost (Gradient Boosted Trees) Model
  - LSTM (Long Short-Term Memory) Sequence Model
  - Walk-Forward Validation Model Selection
  - TreeSHAP Feature Attributions
  - All API routes and demo fallbacks
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd

sys.path.insert(0, '/working_dir/c_4772aeae762e0b0b/stocksense-ai')

from backend.services.stock_data import StockDataService, REAL_STOCKS_METADATA
from backend.services.indicators import IndicatorService
from backend.services.forecast_service import ForecastService
from backend.models.time_series_ml import TimeSeriesForecastModel, XGBoostRegressor, RidgeRegressor
from backend.models.lstm_model import TimeSeriesLSTMModel

class TestStockSenseAIMLUpgrade(unittest.TestCase):

    def test_01_real_market_data_us_and_india(self):
        """Verify real historical data generation and quality reports for US and Indian equities."""
        us_tickers = ["AAPL", "MSFT", "NVDA", "TSLA"]
        in_tickers = ["RELIANCE", "TCS", "INFY", "HDFCBANK"]
        
        for sym in us_tickers + in_tickers:
            df = StockDataService.get_historical_data(sym, "5Y")
            ov = StockDataService.get_stock_overview(sym)
            dq = StockDataService.get_data_quality_report(sym)

            self.assertGreater(len(df), 200)
            self.assertEqual(ov["data_mode"], "REAL MARKET DATA")
            self.assertEqual(dq["missing_values"], 0)
            self.assertTrue(dq["is_real"])
            self.assertTrue((df["high"] >= df["low"]).all())
            self.assertTrue((df["close"] > 0).all())

    def test_02_data_quality_report_and_demo_fallback(self):
        """Verify demo fallback for custom ticker."""
        dq_real = StockDataService.get_data_quality_report("NVDA")
        self.assertEqual(dq_real["data_mode"], "REAL MARKET DATA")
        self.assertEqual(dq_real["symbol"], "NVDA")

        dq_demo = StockDataService.get_data_quality_report("CUSTOM_XYZ")
        self.assertEqual(dq_demo["data_mode"], "DEMO / SIMULATED DATA")
        self.assertFalse(dq_demo["is_real"])

    def test_03_ridge_baseline_model(self):
        """Verify Ridge Baseline model on chronological train/test split."""
        df = StockDataService.get_historical_data("AAPL", "5Y")
        model = TimeSeriesForecastModel(model_type="ridge", alpha=10.0)
        res = model.fit_and_evaluate(df, test_ratio=0.15)
        
        self.assertIn("Ridge", res["model_name"])
        self.assertGreater(res["train_samples"], res["test_samples"])
        self.assertGreater(res["final_holdout_test"]["mae"], 0.0)
        self.assertGreater(res["final_holdout_test"]["rmse"], 0.0)
        self.assertGreater(res["final_holdout_test"]["mape"], 0.0)
        self.assertGreater(res["final_holdout_test"]["directional_accuracy_pct"], 0.0)
        self.assertIn("walk_forward_rmse", res["validation"])

    def test_04_xgboost_model_and_tree_shap(self):
        """Verify XGBoost GBDT model and TreeSHAP feature attributions."""
        df = StockDataService.get_historical_data("NVDA", "5Y")
        model = TimeSeriesForecastModel(model_type="xgboost")
        res = model.fit_and_evaluate(df, test_ratio=0.15)
        
        self.assertIn("XGBoost", res["model_name"])
        self.assertGreater(res["final_holdout_test"]["mae"], 0.0)
        self.assertGreater(res["final_holdout_test"]["rmse"], 0.0)
        self.assertTrue(len(model.feature_importance) > 0)
        self.assertTrue(len(model.shap_attributions) > 0)
        
        top_shap = model.shap_attributions[0]
        self.assertIn("feature", top_shap)
        self.assertIn("shap_value", top_shap)
        self.assertIn("contribution_pct", top_shap)
        self.assertIn("impact", top_shap)

    def test_05_lstm_sequence_neural_network(self):
        """Verify LSTM sequence lookback window and out-of-sample prediction."""
        df = StockDataService.get_historical_data("RELIANCE", "5Y")
        model = TimeSeriesLSTMModel(lookback_window=15, epochs=10)
        res = model.fit_and_evaluate(df, test_ratio=0.15)
        
        self.assertEqual(res["model_type"], "lstm")
        self.assertGreater(res["final_holdout_test"]["mae"], 0.0)
        self.assertGreater(res["final_holdout_test"]["rmse"], 0.0)
        self.assertGreater(res["train_samples"], res["test_samples"])
        
        fc = model.generate_forecast(df, horizons=[1, 5, 10, 30])
        self.assertIn("1d", fc["horizons"])
        self.assertIn("30d", fc["horizons"])
        self.assertEqual(len(fc["forecast_trajectory"]), 30)

    def test_06_model_comparison_service(self):
        """Verify benchmarking of Ridge, XGBoost, and LSTM side-by-side."""
        comparison = ForecastService.get_model_comparison("TCS")
        self.assertIn("models_comparison", comparison)
        self.assertEqual(len(comparison["models_comparison"]), 3)
        self.assertIn("validation_selected_model", comparison)
        self.assertIn(comparison["validation_selected_model"]["model_type"], ["ridge", "xgboost", "lstm"])
        
        for m in comparison["models_comparison"]:
            self.assertIn("validation", m)
            self.assertIn("final_holdout_test", m)
            self.assertIn("walk_forward_rmse", m["validation"])
            self.assertIn("walk_forward_mae", m["validation"])
            self.assertIn("mae", m["final_holdout_test"])
            self.assertIn("rmse", m["final_holdout_test"])
            self.assertIn("mape", m["final_holdout_test"])
            self.assertIn("r2", m["final_holdout_test"])
            self.assertIn("directional_accuracy_pct", m["final_holdout_test"])

    def test_07_forecast_model_selection(self):
        """Verify user model selection: ridge, xgboost, lstm, validation_selected."""
        for m_choice in ["ridge", "xgboost", "lstm", "validation_selected"]:
            fc = ForecastService.get_forecast("MSFT", model_type=m_choice)
            self.assertIn("forecast_data", fc)
            self.assertIn("horizons", fc["forecast_data"])
            self.assertIn("5d", fc["forecast_data"]["horizons"])
            self.assertIn("confidence_score", fc["forecast_data"]["horizons"]["5d"])

    def test_08_walk_forward_cross_validation(self):
        """Verify expanding window walk-forward validation (TimeSeriesSplit)."""
        df = StockDataService.get_historical_data("INFY", "5Y")
        model = TimeSeriesForecastModel(model_type="ridge")
        res = model.fit_and_evaluate(df)
        wf = res.get("validation")
        
        self.assertIsNotNone(wf)
        self.assertGreater(wf["walk_forward_rmse"], 0.0)
        self.assertGreater(wf["walk_forward_mae"], 0.0)

if __name__ == "__main__":
    unittest.main()
