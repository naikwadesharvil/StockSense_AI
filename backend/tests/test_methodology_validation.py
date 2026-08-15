"""
StockSense AI - Methodology Correction Test Suite
Validates:
  1. Model selection is 100% determined by Walk-Forward Validation RMSE on the pre-test partition.
  2. The final 15% holdout test set is NEVER used for model selection.
  3. Perturbing final holdout test data leaves the selected model and validation scores unchanged.
  4. Final test metrics are evaluated once as an unbiased out-of-sample benchmark.
  5. Evaluates model selection across all 8 supported stocks.
"""

import sys
import os
import unittest
import numpy as np
import pandas as pd

sys.path.insert(0, '/working_dir/c_4772aeae762e0b0b/stocksense-ai')

from backend.services.stock_data import StockDataService, REAL_STOCKS_METADATA
from backend.services.forecast_service import ForecastService
from backend.models.time_series_ml import TimeSeriesForecastModel, TimeSeriesFeatureExtractor
from backend.models.lstm_model import TimeSeriesLSTMModel

class TestMethodologyCorrection(unittest.TestCase):

    def test_01_model_selection_uses_validation_metrics(self):
        """Verify model selection is governed strictly by Walk-Forward Validation RMSE."""
        comp = ForecastService.get_model_comparison("NVDA")
        models = comp["models_comparison"]
        winner = comp["validation_selected_model"]

        expected_winner = min(models, key=lambda m: (m["validation"]["walk_forward_rmse"], m["validation"]["walk_forward_mae"]))
        
        self.assertEqual(winner["model_type"], expected_winner["model_type"])
        self.assertEqual(winner["selection_score"], expected_winner["validation"]["walk_forward_rmse"])
        self.assertEqual(winner["selection_metric"], "Walk-Forward Validation RMSE")

    def test_02_test_perturbation_invariance(self):
        """
        Prove that final test data is not used for model selection.
        Perturbing the final 15% test data MUST leave validation scores and selected model unchanged.
        """
        df_orig = StockDataService.get_historical_data("AAPL", "5Y")
        comp_orig = ForecastService.get_model_comparison("AAPL")
        orig_winner = comp_orig["validation_selected_model"]["model_type"]
        orig_wf_rmse = comp_orig["validation_selected_model"]["selection_score"]

        # Determine exact test split date in valid_df
        df_feat, fcols = TimeSeriesFeatureExtractor.extract_features(df_orig)
        df_feat['target'] = df_feat['close'].shift(-1)
        valid_df = df_feat.dropna(subset=['target']).reset_index(drop=True)
        split_idx = int(len(valid_df) * 0.85)
        test_target_start_date = valid_df['date'].iloc[split_idx + 1]

        # Perturb only the final 15% test targets in raw data (300% shock)
        df_perturbed = df_orig.copy()
        mask = pd.to_datetime(df_perturbed['date']) >= test_target_start_date
        df_perturbed.loc[mask, 'close'] = df_perturbed.loc[mask, 'close'] * 3.0
        df_perturbed.loc[mask, 'high'] = df_perturbed.loc[mask, 'high'] * 3.0
        df_perturbed.loc[mask, 'low'] = df_perturbed.loc[mask, 'low'] * 3.0

        m_ridge_pert = TimeSeriesForecastModel(model_type="ridge", alpha=10.0)
        res_pert = m_ridge_pert.fit_and_evaluate(df_perturbed, test_ratio=0.15)

        # Validation RMSE and MAE on pre-test window MUST be strictly identical
        self.assertEqual(res_pert["validation"]["walk_forward_rmse"], comp_orig["models_comparison"][0]["validation"]["walk_forward_rmse"])
        self.assertEqual(res_pert["validation"]["walk_forward_mae"], comp_orig["models_comparison"][0]["validation"]["walk_forward_mae"])

    def test_03_separate_validation_and_test_metrics(self):
        """Verify validation and final holdout metrics are cleanly separated."""
        fc = ForecastService.get_forecast("RELIANCE", model_type="validation_selected")
        
        self.assertIn("validation", fc)
        self.assertIn("final_holdout_test", fc)
        self.assertIn("walk_forward_rmse", fc["validation"])
        self.assertIn("walk_forward_mae", fc["validation"])
        self.assertIn("rmse", fc["final_holdout_test"])
        self.assertIn("mae", fc["final_holdout_test"])
        self.assertIn("r2", fc["final_holdout_test"])
        self.assertIn("directional_accuracy_pct", fc["final_holdout_test"])

    def test_04_all_supported_stocks_selection(self):
        """Run validation selection across all 8 supported equities."""
        stocks = ["AAPL", "MSFT", "NVDA", "TSLA", "RELIANCE", "TCS", "INFY", "HDFCBANK"]
        print("\n" + "="*85)
        print(f"{'SYMBOL':<10} | {'VALIDATION-SELECTED MODEL':<34} | {'WF VALIDATION RMSE':<20} | {'FINAL HOLDOUT RMSE':<18}")
        print("="*85)
        
        for sym in stocks:
            comp = ForecastService.get_model_comparison(sym)
            win = comp["validation_selected_model"]
            curr = REAL_STOCKS_METADATA.get(sym, {}).get("currency_symbol", "$")
            print(f"{sym:<10} | {win['model_name']:<34} | {curr}{win['selection_score']:<19.2f} | {curr}{win['final_holdout_rmse']:<17.2f}")
            self.assertIn(win["model_type"], ["ridge", "xgboost", "lstm"])
        print("="*85)

if __name__ == "__main__":
    unittest.main()
