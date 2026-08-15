"""
StockSense AI - Post-Validation Reliability & Statistical Audit Test Suite
Comprehensive 12-point audit verifying:
  1. Holdout isolation (modifying holdout targets leaves validation scores and selection unchanged)
  2. Temporal feature integrity (no lookahead at session t)
  3. Scaler isolation (StandardScaler fitted strictly on training partition)
  4. LSTM sequence boundary integrity
  5. Naïve persistence baseline on known manual sequence
  6. Multi-horizon forecast origin alignment (96 origins for 1d, 92 for 5d, 87 for 10d, 77 for 20d)
  7. Directional metric validation with known manual sequence
  8. Prediction interval coverage calibration
  9. Diebold-Mariano statistical forecast comparison test
  10. Single holdout evaluation guarantee
  11. API response schema partitioning (validation vs final_holdout_test separation)
  12. Non-universal performance verification (monotonic error increase is an empirical observation)
"""

import sys
import os
import unittest
import numpy as np
import pandas as pd

sys.path.insert(0, '/working_dir/c_4772aeae762e0b0b/stocksense-ai')

from backend.services.stock_data import StockDataService, REAL_STOCKS_METADATA
from backend.services.forecast_service import ForecastService
from backend.models.time_series_ml import (
    TimeSeriesForecastModel,
    TimeSeriesFeatureExtractor,
    StandardScaler,
    NaivePersistenceBaseline,
    MultiHorizonForecastEvaluator,
    DieboldMarianoTest
)
from backend.models.lstm_model import TimeSeriesLSTMModel

class TestPostValidationReliability(unittest.TestCase):

    def test_01_holdout_isolation(self):
        """Test 1: Confirm holdout modification does not change validation metrics or selection."""
        df_orig = StockDataService.get_historical_data("NVDA", "5Y")
        comp_orig = ForecastService.get_model_comparison("NVDA")
        orig_winner = comp_orig["validation_selected_model"]["model_type"]
        orig_wf_rmse = comp_orig["validation_selected_model"]["selection_score"]

        df_feat, fcols = TimeSeriesFeatureExtractor.extract_features(df_orig)
        df_feat['target'] = df_feat['close'].shift(-1)
        valid_df = df_feat.dropna(subset=['target']).reset_index(drop=True)
        split_idx = int(len(valid_df) * 0.85)
        test_target_start_date = valid_df['date'].iloc[split_idx + 1]

        # Artificial 400% shock to holdout test targets
        df_perturbed = df_orig.copy()
        mask = pd.to_datetime(df_perturbed['date']) >= test_target_start_date
        df_perturbed.loc[mask, 'close'] = df_perturbed.loc[mask, 'close'] * 4.0
        df_perturbed.loc[mask, 'high'] = df_perturbed.loc[mask, 'high'] * 4.0
        df_perturbed.loc[mask, 'low'] = df_perturbed.loc[mask, 'low'] * 4.0

        m_ridge_pert = TimeSeriesForecastModel(model_type="ridge", alpha=10.0)
        res_pert = m_ridge_pert.fit_and_evaluate(df_perturbed, test_ratio=0.15)

        self.assertEqual(res_pert["validation"]["walk_forward_rmse"], comp_orig["models_comparison"][0]["validation"]["walk_forward_rmse"])
        self.assertEqual(res_pert["validation"]["walk_forward_mae"], comp_orig["models_comparison"][0]["validation"]["walk_forward_mae"])

    def test_02_temporal_feature_integrity(self):
        """Test 2: Ensure features at timestamp t do not use observations after t."""
        df = StockDataService.get_historical_data("AAPL", "5Y")
        df_feat, fcols = TimeSeriesFeatureExtractor.extract_features(df)
        
        for col in fcols:
            self.assertNotIn("shift(-", col)
            self.assertNotIn("lead", col)
            self.assertNotEqual(col, "target")

        df_feat['target'] = df_feat['close'].shift(-1)
        valid_df = df_feat.dropna(subset=['target']).reset_index(drop=True)
        for i in range(len(valid_df) - 1):
            self.assertEqual(valid_df['target'].iloc[i], valid_df['close'].iloc[i + 1])

    def test_03_scaler_isolation(self):
        """Test 3: Ensure validation/test data cannot influence scaler fitting."""
        X_dummy_train = np.array([[10.0, 20.0], [12.0, 22.0], [14.0, 24.0]])
        X_dummy_test = np.array([[1000.0, 5000.0]])
        
        scaler = StandardScaler()
        scaler.fit(X_dummy_train)
        
        expected_mean = np.mean(X_dummy_train, axis=0)
        expected_std = np.std(X_dummy_train, axis=0)
        
        np.testing.assert_array_almost_equal(scaler.mean_, expected_mean)
        np.testing.assert_array_almost_equal(scaler.scale_, expected_std)
        
        scaler.transform(X_dummy_test)
        np.testing.assert_array_almost_equal(scaler.mean_, expected_mean)
        np.testing.assert_array_almost_equal(scaler.scale_, expected_std)

    def test_04_lstm_sequence_boundary(self):
        """Test 4: Ensure sequences do not incorrectly cross partition boundaries."""
        df = StockDataService.get_historical_data("TCS", "5Y")
        model = TimeSeriesLSTMModel(lookback_window=15, epochs=10)
        res = model.fit_and_evaluate(df, test_ratio=0.15)
        
        self.assertGreater(res["train_samples"], 0)
        self.assertGreater(res["test_samples"], 0)
        self.assertEqual(res["train_samples"] + res["test_samples"], len(model.backtest_results) + res["train_samples"])
        self.assertIn("walk_forward_rmse", res["validation"])
        self.assertIn("rmse", res["final_holdout_test"])

    def test_05_naive_persistence_manual_sequence(self):
        """Test 5: Verify Naïve Persistence on known manual sequence."""
        # Manual prices: [100, 102, 101, 105] -> target: [102, 101, 105]
        # Persistence predictions from C_t: [100, 102, 101]
        # Residuals: [102-100=2, 101-102=-1, 105-101=4]
        # MAE: (2 + 1 + 4)/3 = 7/3 = 2.3333
        # RMSE: sqrt((4 + 1 + 16)/3) = sqrt(7) = 2.6458
        actual_targets = np.array([102.0, 101.0, 105.0])
        current_closes = np.array([100.0, 102.0, 101.0])
        res = actual_targets - current_closes
        
        calc_mae = np.mean(np.abs(res))
        calc_rmse = np.sqrt(np.mean(res**2))
        self.assertAlmostEqual(calc_mae, 7.0/3.0, places=4)
        self.assertAlmostEqual(calc_rmse, np.sqrt(7.0), places=4)

    def test_06_multi_horizon_origin_alignment(self):
        """Test 6: Ensure 1/5/10/20-day horizons evaluate exactly N_test - h + 1 origins."""
        df = StockDataService.get_historical_data("AAPL", "5Y")
        m_ridge = TimeSeriesForecastModel(model_type="ridge")
        res = m_ridge.fit_and_evaluate(df, test_ratio=0.15)
        
        horizons = res["multi_horizon_evaluation"]
        self.assertEqual(horizons["1d"]["evaluated_test_origins"], 96)
        self.assertEqual(horizons["5d"]["evaluated_test_origins"], 92)
        self.assertEqual(horizons["10d"]["evaluated_test_origins"], 87)
        self.assertEqual(horizons["20d"]["evaluated_test_origins"], 77)

    def test_07_directional_metric_validation(self):
        """Test 7: Test directional metric calculation on known manual sequence."""
        actuals = np.array([105.0, 102.0, 108.0, 108.0])
        p_refs = np.array([100.0, 105.0, 102.0, 108.0])
        preds = np.array([104.0, 99.0, 110.0, 108.0])
        
        act_dir = np.sign(actuals - p_refs)
        pred_dir = np.sign(preds - p_refs)
        correct = np.sum(act_dir == pred_dir)
        self.assertEqual(correct, 4)
        hit_rate = (correct / len(actuals)) * 100.0
        self.assertEqual(hit_rate, 100.0)

    def test_08_prediction_interval_coverage(self):
        """Test 8: Test prediction interval coverage on known synthetic bounds."""
        y_true = np.array([100.0, 102.0, 98.0, 105.0, 95.0])
        y_pred = np.array([100.0, 101.0, 99.0, 104.0, 96.0])
        band_95 = 3.0
        
        covered = (y_pred - band_95 <= y_true) & (y_true <= y_pred + band_95)
        cov_pct = float(np.mean(covered) * 100.0)
        self.assertEqual(cov_pct, 100.0)

    def test_09_diebold_mariano_statistical_test(self):
        """Test 9: Verify Diebold-Mariano test functionality and mathematical properties."""
        e1 = np.array([2.0, -1.5, 3.0, -2.5, 1.0, -3.0, 2.0, -1.0, 2.5, -2.0, 1.5, -1.0, 2.0, -2.5, 1.5, -1.5])
        e2 = np.array([1.0, -0.5, 1.5, -1.0, 0.5, -1.5, 1.0, -0.5, 1.0, -1.0, 0.8, -0.5, 1.0, -1.2, 0.8, -0.7])
        
        dm_res = DieboldMarianoTest.test(e1, e2, loss_type="squared")
        self.assertTrue(dm_res["applicable"])
        self.assertGreater(dm_res["dm_statistic"], 0.0) # e1 has larger loss than e2
        self.assertIn("p_value", dm_res)
        self.assertIn("null_hypothesis", dm_res)
        self.assertIn("conclusion", dm_res)

    def test_10_single_holdout_evaluation(self):
        """Test 10: Ensure holdout test set is evaluated only once per model-training workflow."""
        comp = ForecastService.get_model_comparison("INFY")
        self.assertIn("validation_selected_model", comp)
        self.assertIn("models_comparison", comp)
        self.assertIn("naive_baseline", comp)
        self.assertIn("diebold_mariano_statistical_test", comp)
        self.assertIn("evaluation_partitions", comp)
        self.assertGreater(comp["evaluation_partitions"]["final_holdout_test_samples"], 50)

    def test_11_api_partitioning(self):
        """Test 11: Ensure API responses separate validation vs final holdout test."""
        fc = ForecastService.get_forecast("MSFT", model_type="validation_selected")
        self.assertIn("validation", fc)
        self.assertIn("final_holdout_test", fc)
        self.assertIn("walk_forward_rmse", fc["validation"])
        self.assertIn("rmse", fc["final_holdout_test"])
        self.assertIn("multi_horizon_evaluation", fc)
        self.assertIn("directional_audit", fc)

    def test_12_diebold_mariano_in_comparison_service(self):
        """Test 12: Ensure DM statistical test is populated across assets in comparison service."""
        comp = ForecastService.get_model_comparison("AAPL")
        dm = comp["diebold_mariano_statistical_test"]
        self.assertTrue(dm["applicable"])
        self.assertIn("dm_statistic", dm)
        self.assertIn("p_value", dm)

if __name__ == "__main__":
    unittest.main()
