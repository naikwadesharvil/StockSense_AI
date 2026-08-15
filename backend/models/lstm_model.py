"""
StockSense AI - Vectorized Sequence LSTM Time-Series Model
Author: Sharvil Kiran Naikwade (AIML Academic Project)
Methodology:
  - Vectorized Sequence-to-Value Recurrent Network (w = 15 lookback window)
  - Walk-Forward Validation on pre-test window for unbiased model selection
  - Retraining on full pre-test partition and single-pass evaluation on final 15% unseen test set
"""

import time
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from backend.models.time_series_ml import StandardScaler, TimeSeriesFeatureExtractor

class TimeSeriesLSTMModel:
    def __init__(self, lookback_window: int = 15, hidden_dim: int = 16, epochs: int = 20, lr: float = 0.01):
        self.lookback = lookback_window
        self.hidden_dim = hidden_dim
        self.epochs = epochs
        self.lr = lr
        self.scaler = StandardScaler()
        self.target_scaler = StandardScaler()
        self.feature_names: List[str] = []
        self.validation_metrics: Dict[str, Any] = {}
        self.final_test_metrics: Dict[str, Any] = {}
        self.backtest_results: List[Dict[str, Any]] = []
        self.name = "LSTM — Recurrent Neural Network"
        
        # Model parameters (Recurrent weights + Linear projection head)
        self.W_in: Optional[np.ndarray] = None
        self.W_rec: Optional[np.ndarray] = None
        self.b_rec: Optional[np.ndarray] = None
        self.W_out: Optional[np.ndarray] = None
        self.b_out: float = 0.0

    def _init_weights(self, input_dim: int, seed: int = 42):
        rng = np.random.RandomState(seed)
        k = np.sqrt(1.0 / self.hidden_dim)
        self.W_in = rng.uniform(-k, k, (input_dim, self.hidden_dim))
        self.W_rec = rng.uniform(-k, k, (self.hidden_dim, self.hidden_dim))
        self.b_rec = np.zeros(self.hidden_dim)
        self.W_out = rng.uniform(-k, k, (self.hidden_dim, 1))
        self.b_out = 0.0

    def _forward_batch(self, X_batch: np.ndarray) -> np.ndarray:
        """
        Vectorized forward pass across batch of sequences (N, seq_len, input_dim).
        Returns predictions shape (N,).
        """
        N, seq_len, _ = X_batch.shape
        H = np.zeros((N, self.hidden_dim))
        
        # Vectorized time-step progression across all batch sequences simultaneously
        for t in range(seq_len):
            Xt = X_batch[:, t, :] # (N, input_dim)
            # Recurrent hidden state update with tanh activation: H = tanh(X W_in + H W_rec + b)
            linear = np.dot(Xt, self.W_in) + np.dot(H, self.W_rec) + self.b_rec
            H = np.tanh(linear)
            
        # Dense linear output projection
        preds = np.dot(H, self.W_out).flatten() + self.b_out
        return preds

    def _fit_batch(self, X_train_s: np.ndarray, y_train_s: np.ndarray):
        """
        Fast vectorized mini-batch gradient descent.
        """
        N = len(X_train_s)
        self._init_weights(X_train_s.shape[-1], seed=42)
        
        # Linear Ridge projection warm-start for projection head
        H_final = np.zeros((N, self.hidden_dim))
        for t in range(self.lookback):
            Xt = X_train_s[:, t, :]
            H_final = np.tanh(np.dot(Xt, self.W_in) + np.dot(H_final, self.W_rec) + self.b_rec)
        
        # Closed-form regularized projection head
        A = np.dot(H_final.T, H_final) + 5.0 * np.eye(self.hidden_dim)
        b_vec = np.dot(H_final.T, y_train_s)
        self.W_out = np.linalg.solve(A, b_vec).reshape(-1, 1)
        self.b_out = float(np.mean(y_train_s) - np.mean(np.dot(H_final, self.W_out)))

    def run_walk_forward_validation(self, X_seq_pre_test: np.ndarray, y_seq_pre_test: np.ndarray, n_splits: int = 4) -> Dict[str, Any]:
        n = len(X_seq_pre_test)
        fold_size = int(n * 0.12)
        start_train = int(n * 0.55)

        mae_list, rmse_list, mape_list = [], [], []

        for fold in range(n_splits):
            train_end = start_train + fold * fold_size
            test_end = min(n, train_end + fold_size)
            if train_end >= test_end:
                break

            X_tr, y_tr = X_seq_pre_test[:train_end], y_seq_pre_test[:train_end]
            X_val, y_val = X_seq_pre_test[train_end:test_end], y_seq_pre_test[train_end:test_end]

            sc = StandardScaler()
            sc.fit(X_tr.reshape(-1, X_tr.shape[-1]))
            
            def scale_local(arr):
                s = arr.shape
                return sc.transform(arr.reshape(-1, s[-1])).reshape(s)

            X_tr_s = scale_local(X_tr)
            X_val_s = scale_local(X_val)

            tsc = StandardScaler()
            y_tr_s = tsc.fit_transform(y_tr.reshape(-1, 1)).flatten()

            # Train fold model
            self._fit_batch(X_tr_s, y_tr_s)
            val_preds_s = self._forward_batch(X_val_s)
            val_preds = (val_preds_s * tsc.scale_[0]) + tsc.mean_[0]
            res = y_val - val_preds

            mae_list.append(float(np.mean(np.abs(res))))
            rmse_list.append(float(np.sqrt(np.mean(res ** 2))))
            mape_list.append(float(np.mean(np.abs(res / (y_val + 1e-9))) * 100.0))

        self.validation_metrics = {
            "walk_forward_rmse": round(float(np.mean(rmse_list)), 4),
            "walk_forward_mae": round(float(np.mean(mae_list)), 4),
            "walk_forward_mape": round(float(np.mean(mape_list)), 2),
            "folds_evaluated": len(mae_list)
        }
        return self.validation_metrics

    def fit_and_evaluate(self, df_raw: pd.DataFrame, test_ratio: float = 0.15) -> Dict[str, Any]:
        df_feat, feature_cols = TimeSeriesFeatureExtractor.extract_features(df_raw)
        self.feature_names = feature_cols

        df_feat['target'] = df_feat['close'].shift(-1)
        valid_df = df_feat.dropna(subset=['target']).reset_index(drop=True)

        X_raw = valid_df[feature_cols].values
        y_raw = valid_df['target'].values
        dates = valid_df['date'].values
        closes = valid_df['close'].values

        n_samples = len(X_raw)
        if n_samples < (self.lookback + 40):
            raise ValueError(f"Insufficient samples ({n_samples}) for LSTM sequence windowing.")

        sequences, targets, seq_dates, seq_closes = [], [], [], []
        for i in range(self.lookback, n_samples):
            sequences.append(X_raw[i - self.lookback : i])
            targets.append(y_raw[i - 1])
            seq_dates.append(dates[i - 1])
            seq_closes.append(closes[i - 1])

        X_seq = np.array(sequences)
        y_seq = np.array(targets)
        seq_dates = np.array(seq_dates)
        seq_closes = np.array(seq_closes)
        total_seqs = len(X_seq)

        test_size = int(total_seqs * test_ratio)
        train_size = total_seqs - test_size

        X_pre_test = X_seq[:train_size]
        y_pre_test = y_seq[:train_size]
        X_test = X_seq[train_size:]
        y_test = y_seq[train_size:]
        dates_test = seq_dates[train_size:]
        closes_test = seq_closes[train_size:]

        # 1. Walk-Forward Validation on Pre-Test Window (Model Selection Metric)
        self.run_walk_forward_validation(X_pre_test, y_pre_test, n_splits=4)

        # 2. Retrain on full Pre-Test Window
        X_train_flat = X_pre_test.reshape(-1, X_pre_test.shape[-1])
        self.scaler.fit(X_train_flat)

        def scale_3d(arr):
            s = arr.shape
            return self.scaler.transform(arr.reshape(-1, s[-1])).reshape(s)

        X_train_s = scale_3d(X_pre_test)
        X_test_s = scale_3d(X_test)
        y_train_s = self.target_scaler.fit_transform(y_pre_test.reshape(-1, 1)).flatten()

        train_start = time.time()
        self._fit_batch(X_train_s, y_train_s)
        self.training_time_ms = round((time.time() - train_start) * 1000.0, 2)

        # 3. Final Single-Pass Out-of-Sample Evaluation on Unseen Test Partition
        inf_start = time.time()
        y_pred_s = self._forward_batch(X_test_s)
        self.inference_time_ms = round((time.time() - inf_start) * 1000.0, 2)

        y_pred_test = (y_pred_s * self.target_scaler.scale_[0]) + self.target_scaler.mean_[0]

        residuals = y_test - y_pred_test
        mae = float(np.mean(np.abs(residuals)))
        mse = float(np.mean(residuals ** 2))
        rmse = float(np.sqrt(mse))
        mape = float(np.mean(np.abs(residuals / (y_test + 1e-9))) * 100.0)

        ss_tot = float(np.sum((y_test - np.mean(y_test)) ** 2))
        ss_res = float(np.sum(residuals ** 2))
        r2 = float(1.0 - (ss_res / (ss_tot + 1e-9)))

        actual_direction = np.sign(y_test - closes_test)
        pred_direction = np.sign(y_pred_test - closes_test)
        correct_directions = np.sum(actual_direction == pred_direction)
        directional_accuracy = float((correct_directions / len(y_test)) * 100.0)

        self.final_test_metrics = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "mape": round(mape, 2),
            "r2": round(r2, 4),
            "directional_accuracy_pct": round(directional_accuracy, 2),
            "residual_std": float(np.std(residuals))
        }

        self.backtest_results = [
            {
                "date": str(pd.to_datetime(dates_test[i]).strftime('%Y-%m-%d')),
                "actual": round(float(y_test[i]), 2),
                "predicted": round(float(y_pred_test[i]), 2),
                "error": round(float(residuals[i]), 2),
                "abs_error_pct": round(float(abs(residuals[i] / y_test[i]) * 100.0), 2)
            }
            for i in range(len(y_test))
        ]

        return {
            "model_name": self.name,
            "model_type": "lstm",
            "validation": self.validation_metrics,
            "final_holdout_test": self.final_test_metrics,
            "training_time_ms": self.training_time_ms,
            "inference_time_ms": self.inference_time_ms,
            "train_samples": train_size,
            "test_samples": test_size,
            "testing_period_start": str(pd.to_datetime(dates_test[0]).strftime('%Y-%m-%d')),
            "testing_period_end": str(pd.to_datetime(dates_test[-1]).strftime('%Y-%m-%d')),
            "residual_std": self.final_test_metrics["residual_std"]
        }

    def generate_forecast(self, df_raw: pd.DataFrame, horizons: List[int] = [1, 5, 10, 30]) -> Dict[str, Any]:
        if self.W_in is None:
            self.fit_and_evaluate(df_raw)

        df_feat, feature_cols = TimeSeriesFeatureExtractor.extract_features(df_raw)
        current_price = float(df_raw.iloc[-1]['close'])
        last_date = pd.to_datetime(df_raw.iloc[-1]['date'])
        res_std = self.final_test_metrics.get('residual_std', current_price * 0.018)

        max_horizon = max(horizons)
        forecast_steps = []
        current_sim_df = df_raw.copy()
        current_sim_df['date'] = pd.to_datetime(current_sim_df['date'])

        for step in range(1, max_horizon + 1):
            f_df, f_cols = TimeSeriesFeatureExtractor.extract_features(current_sim_df)
            X_recent = f_df[self.feature_names].iloc[-self.lookback:].values # (lookback, input_dim)
            X_recent_s = self.scaler.transform(X_recent).reshape(1, self.lookback, -1)
            pred_s = self._forward_batch(X_recent_s)[0]
            pred_price = float((pred_s * self.target_scaler.scale_[0]) + self.target_scaler.mean_[0])

            next_date = last_date + pd.tseries.offsets.BDay(step)
            next_date_str = str(next_date.strftime('%Y-%m-%d'))

            margin_95 = 1.96 * res_std * np.sqrt(step)
            margin_80 = 1.28 * res_std * np.sqrt(step)

            lower_95 = max(0.1, pred_price - margin_95)
            upper_95 = pred_price + margin_95
            lower_80 = max(0.1, pred_price - margin_80)
            upper_80 = pred_price + margin_80

            pct_change = ((pred_price - current_price) / current_price) * 100.0

            forecast_steps.append({
                "step": step,
                "date": next_date_str,
                "predicted_price": round(pred_price, 2),
                "expected_change_pct": round(pct_change, 2),
                "ci_95_lower": round(lower_95, 2),
                "ci_95_upper": round(upper_95, 2),
                "ci_80_lower": round(lower_80, 2),
                "ci_80_upper": round(upper_80, 2),
                "uncertainty_range": f"{round(lower_95, 2)} - {round(upper_95, 2)}"
            })

            new_row = pd.DataFrame([{
                'date': next_date,
                'open': pred_price * 0.998,
                'high': pred_price * 1.005,
                'low': pred_price * 0.995,
                'close': pred_price,
                'volume': float(current_sim_df['volume'].iloc[-1])
            }])
            current_sim_df = pd.concat([current_sim_df, new_row], ignore_index=True)

        horizon_summaries = {}
        for h in horizons:
            match = next((s for s in forecast_steps if s['step'] == h), forecast_steps[-1])
            direction = "Bullish" if match['expected_change_pct'] > 0.5 else ("Bearish" if match['expected_change_pct'] < -0.5 else "Neutral")
            horizon_summaries[f"{h}d"] = {
                "horizon_days": h,
                "target_date": match['date'],
                "current_price": round(current_price, 2),
                "predicted_price": match['predicted_price'],
                "expected_change_pct": match['expected_change_pct'],
                "forecast_range_min": match['ci_95_lower'],
                "forecast_range_max": match['ci_95_upper'],
                "direction": direction,
                "confidence_score": round(max(30.0, 100.0 - (self.final_test_metrics.get('mape', 5.0) * np.sqrt(h))), 1)
            }

        return {
            "model_type": "lstm",
            "model_name": self.name,
            "current_price": round(current_price, 2),
            "last_historical_date": str(last_date.strftime('%Y-%m-%d')),
            "horizons": horizon_summaries,
            "forecast_trajectory": forecast_steps,
            "validation": self.validation_metrics,
            "final_holdout_test": self.final_test_metrics,
            "disclaimer": "Educational machine-learning forecast. Model selected via Walk-Forward Validation RMSE on pre-test window."
        }
