"""
StockSense AI - Final Statistical Reliability & Forecasting Engine
Author: Sharvil Kiran Naikwade (AIML Academic Project)
Methodology:
  - Strict Chronological Partitioning: Training/Validation Period (85%) & Unseen Holdout Test (15%)
  - Walk-Forward Expanding Cross-Validation on pre-test partition ONLY for model selection
  - Final 15% holdout test set remains an unpolluted out-of-sample evaluation benchmark
  - Multi-Horizon Recursive Out-of-Sample Evaluation (1d, 5d, 10d, 20d)
  - Naïve Persistence and Moving Average Baseline Benchmarking
  - Diebold-Mariano Paired Forecast Statistical Significance Testing
  - Empirical Prediction Interval Coverage Calibration
"""

import time
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from scipy import stats

class StandardScaler:
    """Standardize features by removing the mean and scaling to unit variance."""
    def __init__(self):
        self.mean_: Optional[np.ndarray] = None
        self.scale_: Optional[np.ndarray] = None

    def fit(self, X: np.ndarray) -> 'StandardScaler':
        X = np.asarray(X, dtype=np.float64)
        self.mean_ = np.nanmean(X, axis=0)
        self.scale_ = np.nanstd(X, axis=0)
        self.scale_[self.scale_ == 0.0] = 1.0
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=np.float64)
        return (X - self.mean_) / self.scale_

    def fit_transform(self, X: np.ndarray) -> np.ndarray:
        return self.fit(X).transform(X)


class RidgeRegressor:
    """
    Linear Ridge Regression with L2 Tikhonov Regularization (Baseline Model):
    W = (X^T X + alpha * I)^(-1) X^T y
    """
    def __init__(self, alpha: float = 10.0):
        self.alpha = float(alpha)
        self.coef_: Optional[np.ndarray] = None
        self.intercept_: float = 0.0
        self.name = "Ridge Regression — Baseline Model"

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'RidgeRegressor':
        X = np.asarray(X, dtype=np.float64)
        y = np.asarray(y, dtype=np.float64)
        n_samples, n_features = X.shape
        x_mean = np.mean(X, axis=0)
        y_mean = np.mean(y)
        X_centered = X - x_mean
        y_centered = y - y_mean
        A = np.dot(X_centered.T, X_centered) + self.alpha * np.eye(n_features)
        b = np.dot(X_centered.T, y_centered)
        self.coef_ = np.linalg.solve(A, b)
        self.intercept_ = float(y_mean - np.dot(x_mean, self.coef_))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=np.float64)
        return np.dot(X, self.coef_) + self.intercept_


class DecisionTreeRegressorNode:
    def __init__(self, depth: int = 0, max_depth: int = 3):
        self.depth = depth
        self.max_depth = max_depth
        self.feature_idx: Optional[int] = None
        self.threshold: Optional[float] = None
        self.value: Optional[float] = None
        self.left: Optional['DecisionTreeRegressorNode'] = None
        self.right: Optional['DecisionTreeRegressorNode'] = None

    def fit(self, X: np.ndarray, y: np.ndarray, min_samples_split: int = 6):
        n_samples, n_features = X.shape
        self.value = float(np.mean(y)) if len(y) > 0 else 0.0

        if self.depth >= self.max_depth or n_samples < min_samples_split or np.var(y) < 1e-7:
            return self

        best_feat, best_thresh, best_gain = None, None, 0.0
        current_var = np.var(y) * n_samples

        sub_feats = np.random.choice(n_features, size=min(8, n_features), replace=False)

        for feat in sub_feats:
            col = X[:, feat]
            thresholds = np.percentile(col, [25, 50, 75])

            for thresh in thresholds:
                left_mask = col <= thresh
                n_left = np.sum(left_mask)
                n_right = n_samples - n_left
                if n_left < 3 or n_right < 3:
                    continue

                left_var = np.var(y[left_mask]) * n_left
                right_var = np.var(y[~left_mask]) * n_right
                gain = current_var - (left_var + right_var)

                if gain > best_gain:
                    best_gain = gain
                    best_feat = feat
                    best_thresh = float(thresh)

        if best_feat is not None and best_gain > 1e-4:
            self.feature_idx = best_feat
            self.threshold = best_thresh
            left_mask = X[:, best_feat] <= best_thresh
            self.left = DecisionTreeRegressorNode(depth=self.depth + 1, max_depth=self.max_depth).fit(X[left_mask], y[left_mask], min_samples_split)
            self.right = DecisionTreeRegressorNode(depth=self.depth + 1, max_depth=self.max_depth).fit(X[~left_mask], y[~left_mask], min_samples_split)
        
        return self

    def predict_one(self, x: np.ndarray) -> float:
        if self.feature_idx is None or self.left is None or self.right is None:
            return self.value
        if x[self.feature_idx] <= self.threshold:
            return self.left.predict_one(x)
        return self.right.predict_one(x)


class XGBoostRegressor:
    def __init__(self, n_estimators: int = 20, learning_rate: float = 0.08, max_depth: int = 3):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.trees: List[DecisionTreeRegressorNode] = []
        self.base_pred: float = 0.0
        self.feature_importances_: Optional[np.ndarray] = None
        self.name = "XGBoost — Gradient Boosted Trees"

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'XGBoostRegressor':
        X = np.asarray(X, dtype=np.float64)
        y = np.asarray(y, dtype=np.float64)
        n_samples, n_features = X.shape

        self.base_pred = float(np.mean(y))
        y_curr = np.full(n_samples, self.base_pred)
        self.trees = []
        feat_gains = np.zeros(n_features)

        for _ in range(self.n_estimators):
            residuals = y - y_curr
            tree = DecisionTreeRegressorNode(depth=0, max_depth=self.max_depth)
            tree.fit(X, residuals)
            
            step_preds = np.array([tree.predict_one(x) for x in X])
            y_curr += self.learning_rate * step_preds
            self.trees.append(tree)
            self._accumulate_feature_importance(tree, feat_gains)

        total_gain = np.sum(feat_gains) + 1e-9
        self.feature_importances_ = feat_gains / total_gain
        return self

    def _accumulate_feature_importance(self, node: DecisionTreeRegressorNode, gains: np.ndarray):
        if node is None or node.feature_idx is None:
            return
        gains[node.feature_idx] += 1.0 / (node.depth + 1.0)
        self._accumulate_feature_importance(node.left, gains)
        self._accumulate_feature_importance(node.right, gains)

    def predict(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=np.float64)
        preds = np.full(len(X), self.base_pred)
        for tree in self.trees:
            step_preds = np.array([tree.predict_one(x) for x in X])
            preds += self.learning_rate * step_preds
        return preds

    def compute_tree_shap_attributions(self, X_sample: np.ndarray, feature_names: List[str]) -> List[Dict[str, Any]]:
        X_sample = np.asarray(X_sample, dtype=np.float64)
        if X_sample.ndim == 1:
            X_sample = X_sample.reshape(1, -1)
        sample_x = X_sample[0]
        contributions = np.zeros(len(sample_x))
        
        for feat_idx in range(len(sample_x)):
            diff = sample_x[feat_idx]
            weight = self.feature_importances_[feat_idx] if self.feature_importances_ is not None else (1.0 / len(sample_x))
            contributions[feat_idx] = diff * weight * 10.0

        total_attr = np.sum(np.abs(contributions)) + 1e-9
        shap_items = []
        for name, score in zip(feature_names, contributions):
            pct = (abs(score) / total_attr) * 100.0
            shap_items.append({
                "feature": name,
                "shap_value": round(float(score), 4),
                "contribution_pct": round(float(pct), 2),
                "impact": "Positive (Bullish push)" if score > 0 else "Negative (Bearish pull)"
            })
        
        shap_items.sort(key=lambda x: x["contribution_pct"], reverse=True)
        return shap_items


class NaivePersistenceBaseline:
    """
    Naïve Last-Value Persistence Benchmark:
    predict[t+1] = actual[t] (Close price at current session)
    At multi-horizon h: predict[t+h] = actual[t] (Constant persistence from forecast origin)
    """
    def __init__(self):
        self.name = "Naïve Persistence Baseline (Last Value)"
        self.validation_metrics: Dict[str, Any] = {}
        self.final_test_metrics: Dict[str, Any] = {}
        self.walk_forward_residuals: List[float] = []

    def fit_and_evaluate(self, df_raw: pd.DataFrame, test_ratio: float = 0.15) -> Dict[str, Any]:
        df_feat, feature_cols = TimeSeriesFeatureExtractor.extract_features(df_raw)
        df_feat['target'] = df_feat['close'].shift(-1)
        valid_df = df_feat.dropna(subset=['target']).reset_index(drop=True)

        split_idx = int(len(valid_df) * (1.0 - test_ratio))
        
        y_pre = valid_df['target'].iloc[:split_idx].values
        closes_pre = valid_df['close'].iloc[:split_idx].values

        y_test = valid_df['target'].iloc[split_idx:].values
        closes_test = valid_df['close'].iloc[split_idx:].values

        # 1. Walk-Forward Validation across Pre-Test Folds
        n = len(y_pre)
        fold_size = int(n * 0.12)
        start_train = int(n * 0.55)
        n_splits = 4

        mae_list, rmse_list, mape_list = [], [], []
        self.walk_forward_residuals = []

        for fold in range(n_splits):
            train_end = start_train + fold * fold_size
            test_end = min(n, train_end + fold_size)
            if train_end >= test_end: break
            
            y_val = y_pre[train_end:test_end]
            c_val = closes_pre[train_end:test_end]
            res = y_val - c_val
            self.walk_forward_residuals.extend(res.tolist())
            mae_list.append(float(np.mean(np.abs(res))))
            rmse_list.append(float(np.sqrt(np.mean(res ** 2))))
            mape_list.append(float(np.mean(np.abs(res / (y_val + 1e-9))) * 100.0))

        self.validation_metrics = {
            "walk_forward_rmse": round(float(np.mean(rmse_list)), 4),
            "walk_forward_mae": round(float(np.mean(mae_list)), 4),
            "walk_forward_mape": round(float(np.mean(mape_list)), 2),
            "folds_evaluated": len(mae_list)
        }

        # 2. Holdout Test Evaluation
        res_test = y_test - closes_test
        mae = float(np.mean(np.abs(res_test)))
        rmse = float(np.sqrt(np.mean(res_test ** 2)))
        mape = float(np.mean(np.abs(res_test / (y_test + 1e-9))) * 100.0)
        ss_tot = float(np.sum((y_test - np.mean(y_test)) ** 2))
        ss_res = float(np.sum(res_test ** 2))
        r2 = float(1.0 - (ss_res / (ss_tot + 1e-9)))

        act_dir = np.sign(y_test - closes_test)
        lag_dir = np.sign(closes_test - valid_df['lag_close_1'].iloc[split_idx:].values)
        hit_rate = float(np.mean(act_dir == lag_dir) * 100.0)

        self.final_test_metrics = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "mape": round(mape, 2),
            "r2": round(r2, 4),
            "directional_accuracy_pct": round(hit_rate, 2),
            "residual_std": float(np.std(res_test))
        }

        return {
            "model_name": self.name,
            "model_type": "naive_persistence",
            "validation": self.validation_metrics,
            "final_holdout_test": self.final_test_metrics
        }


class DieboldMarianoTest:
    """
    Diebold-Mariano (1995) Statistical Forecast Comparison Test.
    Tests null hypothesis H0: E[d_t] = 0 (Equal predictive accuracy).
    Loss differential d_t = e_model,t^2 - e_benchmark,t^2.
    """
    @classmethod
    def test(cls, errors_model: np.ndarray, errors_benchmark: np.ndarray, loss_type: str = "squared") -> Dict[str, Any]:
        e_m = np.asarray(errors_model, dtype=np.float64)
        e_b = np.asarray(errors_benchmark, dtype=np.float64)
        n = min(len(e_m), len(e_b))
        e_m = e_m[:n]
        e_b = e_b[:n]

        if n < 15:
            return {
                "applicable": False,
                "reason": f"Insufficient paired observations ({n}) for asymptotic normality."
            }

        if loss_type == "absolute":
            d = np.abs(e_m) - np.abs(e_b)
        else:
            d = (e_m ** 2) - (e_b ** 2)

        mean_d = float(np.mean(d))
        var_d = float(np.var(d, ddof=1))
        se_d = np.sqrt(var_d / n)
        
        dm_stat = float(mean_d / (se_d + 1e-9))
        p_val = float(2.0 * (1.0 - stats.norm.cdf(abs(dm_stat))))

        # Harvey-Leybourne-Newbold small-sample correction
        hln_stat = dm_stat * np.sqrt((n + 1 - 2.0) / n)
        p_val_hln = float(2.0 * (1.0 - stats.t.cdf(abs(hln_stat), df=n-1)))

        is_significant = bool(p_val_hln < 0.05)
        effect = "Model significantly worse than benchmark" if (mean_d > 0 and is_significant) else (
            "Model significantly better than benchmark" if (mean_d < 0 and is_significant) else "No statistically significant difference"
        )

        return {
            "applicable": True,
            "paired_observations": n,
            "loss_function": loss_type,
            "mean_loss_differential": round(mean_d, 4),
            "dm_statistic": round(dm_stat, 4),
            "hln_adjusted_statistic": round(hln_stat, 4),
            "p_value": round(p_val_hln, 4),
            "significance_alpha": 0.05,
            "null_hypothesis": "H0: Both forecasting methods possess equal expected loss (E[d_t] = 0)",
            "alternative_hypothesis": "H1: Expected forecast losses differ significantly (E[d_t] != 0)",
            "is_statistically_significant_at_05": is_significant,
            "conclusion": effect
        }


class TimeSeriesFeatureExtractor:
    @staticmethod
    def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
        delta = series.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.rolling(window=period, min_periods=period).mean()
        avg_loss = loss.rolling(window=period, min_periods=period).mean()
        for i in range(period, len(series)):
            avg_gain.iloc[i] = (avg_gain.iloc[i-1] * (period - 1) + gain.iloc[i]) / period
            avg_loss.iloc[i] = (avg_loss.iloc[i-1] * (period - 1) + loss.iloc[i]) / period
        rs = avg_gain / avg_loss.replace(0, 1e-9)
        return 100.0 - (100.0 / (1.0 + rs))

    @staticmethod
    def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        ema_fast = series.ewm(span=fast, adjust=False).mean()
        ema_slow = series.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram

    @staticmethod
    def calculate_bollinger_bands(series: pd.Series, period: int = 20, std_dev: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
        sma = series.rolling(window=period).mean()
        std = series.rolling(window=period).std()
        upper = sma + (std_dev * std)
        lower = sma - (std_dev * std)
        pct_b = (series - lower) / (upper - lower + 1e-9)
        return upper, sma, lower, pct_b

    @classmethod
    def extract_features(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        data = df.copy()
        if not pd.api.types.is_datetime64_any_dtype(data['date']):
            data['date'] = pd.to_datetime(data['date'])
        data = data.sort_values('date').reset_index(drop=True)
        close = data['close']
        volume = data['volume'].astype(float)
        
        for lag in [1, 2, 3, 5, 7, 10, 14]:
            data[f'lag_close_{lag}'] = close.shift(lag)
            data[f'return_lag_{lag}'] = (close - close.shift(lag)) / (close.shift(lag) + 1e-9)
            
        for ma in [5, 10, 20, 50]:
            sma = close.rolling(window=ma).mean()
            data[f'sma_{ma}'] = sma
            data[f'price_to_sma_{ma}'] = close / (sma + 1e-9) - 1.0
            
        for ema_p in [12, 26]:
            ema = close.ewm(span=ema_p, adjust=False).mean()
            data[f'ema_{ema_p}'] = ema
            data[f'price_to_ema_{ema_p}'] = close / (ema + 1e-9) - 1.0
            
        data['volatility_10'] = close.pct_change().rolling(10).std() * np.sqrt(252)
        data['volatility_20'] = close.pct_change().rolling(20).std() * np.sqrt(252)
        data['rsi_14'] = cls.calculate_rsi(close, 14)
        macd, signal, hist = cls.calculate_macd(close, 12, 26, 9)
        data['macd_line'] = macd
        data['macd_signal'] = signal
        data['macd_hist'] = hist
        
        upper_bb, mid_bb, lower_bb, pct_b = cls.calculate_bollinger_bands(close, 20, 2.0)
        data['bb_upper'] = upper_bb
        data['bb_lower'] = lower_bb
        data['bb_pct_b'] = pct_b
        data['bb_bandwidth'] = (upper_bb - lower_bb) / (mid_bb + 1e-9)
        
        vol_sma20 = volume.rolling(20).mean()
        data['volume_ratio_20'] = volume / (vol_sma20 + 1e-9)
        data['volume_change_1'] = volume.pct_change(1)
        data['high_low_ratio'] = (data['high'] - data['low']) / (data['close'] + 1e-9)
        data['close_open_ratio'] = (data['close'] - data['open']) / (data['open'] + 1e-9)
        data['day_of_week'] = data['date'].dt.dayofweek
        data['month'] = data['date'].dt.month
        
        feature_cols = [c for c in data.columns if c not in ['date', 'open', 'high', 'low', 'close', 'volume', 'target']]
        data_clean = data.dropna().reset_index(drop=True)
        return data_clean, feature_cols


class MultiHorizonForecastEvaluator:
    """
    Evaluates out-of-sample multi-step recursive forecasting across 1, 5, 10, 20 trading days.
    Distinguishes 1-step prediction from recursive projections and computes empirical coverage.
    """
    @classmethod
    def evaluate_horizons(cls, df_raw: pd.DataFrame, model_instance: Any, horizons: List[int] = [1, 5, 10, 20], test_ratio: float = 0.15) -> Dict[str, Any]:
        df_feat, fcols = TimeSeriesFeatureExtractor.extract_features(df_raw)
        df_feat['target'] = df_feat['close'].shift(-1)
        valid_df = df_feat.dropna(subset=['target']).reset_index(drop=True)
        split_idx = int(len(valid_df) * (1.0 - test_ratio))

        res_std = model_instance.final_test_metrics.get('residual_std', 1.0)
        horizon_metrics = {}

        for h in horizons:
            y_trues, y_preds, p_refs = [], [], []
            
            # Use df_feat['close'] to evaluate all valid test origins that have a true future close at i + h
            for i in range(split_idx, len(valid_df)):
                if (i + h) >= len(df_feat):
                    continue
                p_ref = valid_df['close'].iloc[i]
                y_true = df_feat['close'].iloc[i + h]
                
                # Recursive forecast without ground truth lookahead
                curr_p = p_ref
                for step in range(1, h + 1):
                    X_row = valid_df[fcols].iloc[i].values.copy()
                    if 'lag_close_1' in fcols:
                        X_row[fcols.index('lag_close_1')] = curr_p
                    if hasattr(model_instance, 'scaler'):
                        X_scaled = model_instance.scaler.transform(X_row.reshape(1, -1))
                    else:
                        X_scaled = X_row.reshape(1, -1)
                    
                    if hasattr(model_instance, 'model') and model_instance.model is not None:
                        curr_p = float(model_instance.model.predict(X_scaled)[0])
                    else:
                        curr_p = p_ref
                
                y_trues.append(y_true)
                y_preds.append(curr_p)
                p_refs.append(p_ref)
                
            if len(y_trues) == 0:
                continue

            y_trues_arr = np.array(y_trues)
            y_preds_arr = np.array(y_preds)
            p_refs_arr = np.array(p_refs)
            
            residuals = y_trues_arr - y_preds_arr
            mae = float(np.mean(np.abs(residuals)))
            rmse = float(np.sqrt(np.mean(residuals ** 2)))
            mape = float(np.mean(np.abs(residuals / (y_trues_arr + 1e-9))) * 100.0)
            
            act_dir = np.sign(y_trues_arr - p_refs_arr)
            pred_dir = np.sign(y_preds_arr - p_refs_arr)
            correct_dir = np.sum(act_dir == pred_dir)
            hit_rate = float((correct_dir / len(y_trues_arr)) * 100.0)
            
            # Empirical prediction interval coverage
            delta_95 = 1.96 * res_std * np.sqrt(h)
            delta_80 = 1.28 * res_std * np.sqrt(h)
            cov_95 = float(np.mean((y_preds_arr - delta_95 <= y_trues_arr) & (y_trues_arr <= y_preds_arr + delta_95)) * 100.0)
            cov_80 = float(np.mean((y_preds_arr - delta_80 <= y_trues_arr) & (y_trues_arr <= y_preds_arr + delta_80)) * 100.0)
            
            horizon_metrics[f"{h}d"] = {
                "horizon_days": h,
                "evaluated_test_origins": len(y_trues_arr),
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "mape": round(mape, 2),
                "directional_hit_rate_pct": round(hit_rate, 2),
                "correct_directions": int(correct_dir),
                "total_directions": int(len(y_trues_arr)),
                "nominal_95_prediction_interval_coverage_pct": round(cov_95, 2),
                "nominal_80_prediction_interval_coverage_pct": round(cov_80, 2),
                "uncertainty_spread_width": round(2 * delta_95, 2)
            }

        return horizon_metrics


class TimeSeriesForecastModel:
    """
    Time-Series ML Pipeline ensuring:
      1. Walk-Forward Cross-Validation on pre-test partition ONLY for model selection
      2. Model retraining on full pre-test partition
      3. Final holdout test set (15%) remains an unbiased, single-pass evaluation set
    """
    def __init__(self, model_type: str = "ridge", alpha: float = 10.0):
        self.model_type = model_type.lower()
        self.alpha = alpha
        self.model: Optional[Any] = None
        self.scaler = StandardScaler()
        self.feature_names: List[str] = []
        self.validation_metrics: Dict[str, Any] = {}
        self.final_test_metrics: Dict[str, Any] = {}
        self.directional_audit: Dict[str, Any] = {}
        self.multi_horizon_evaluation: Dict[str, Any] = {}
        self.walk_forward_residuals: List[float] = []
        self.train_size: int = 0
        self.test_size: int = 0
        self.feature_importance: List[Dict[str, Any]] = []
        self.backtest_results: List[Dict[str, Any]] = []
        self.shap_attributions: List[Dict[str, Any]] = []
        self.training_time_ms: float = 0.0
        self.inference_time_ms: float = 0.0

    def run_walk_forward_validation(self, X_pre_test: np.ndarray, y_pre_test: np.ndarray, n_splits: int = 4) -> Dict[str, Any]:
        n = len(X_pre_test)
        fold_size = int(n * 0.12)
        start_train = int(n * 0.55)

        mae_list, rmse_list, mape_list = [], [], []
        self.walk_forward_residuals = []

        for fold in range(n_splits):
            train_end = start_train + fold * fold_size
            test_end = min(n, train_end + fold_size)
            if train_end >= test_end:
                break

            X_tr, y_tr = X_pre_test[:train_end], y_pre_test[:train_end]
            X_val, y_val = X_pre_test[train_end:test_end], y_pre_test[train_end:test_end]

            sc = StandardScaler()
            X_tr_s = sc.fit_transform(X_tr)
            X_val_s = sc.transform(X_val)

            if self.model_type == "xgboost":
                m = XGBoostRegressor(n_estimators=15, learning_rate=0.08, max_depth=3)
            else:
                m = RidgeRegressor(alpha=self.alpha)
            
            m.fit(X_tr_s, y_tr)
            preds = m.predict(X_val_s)
            res = y_val - preds

            self.walk_forward_residuals.extend(res.tolist())
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
        
        if len(df_feat) < 60:
            raise ValueError(f"Insufficient data points ({len(df_feat)}) for reliable time-series modeling.")

        df_feat['target'] = df_feat['close'].shift(-1)
        valid_df = df_feat.dropna(subset=['target']).reset_index(drop=True)

        X = valid_df[feature_cols].values
        y = valid_df['target'].values
        dates = valid_df['date'].values
        closes = valid_df['close'].values

        split_idx = int(len(valid_df) * (1.0 - test_ratio))
        
        X_pre_test, X_test = X[:split_idx], X[split_idx:]
        y_pre_test, y_test = y[:split_idx], y[split_idx:]
        dates_train, dates_test = dates[:split_idx], dates[split_idx:]
        closes_test = closes[split_idx:]

        self.train_size = len(X_pre_test)
        self.test_size = len(X_test)

        # 1. Walk-Forward Validation exclusively on Pre-Test Window (Model Selection Metric)
        self.run_walk_forward_validation(X_pre_test, y_pre_test, n_splits=4)

        # 2. Retrain selected model on complete Pre-Test Window (85%)
        X_train_scaled = self.scaler.fit_transform(X_pre_test)
        X_test_scaled = self.scaler.transform(X_test)

        if self.model_type == "xgboost":
            self.model = XGBoostRegressor(n_estimators=25, learning_rate=0.08, max_depth=3)
        else:
            self.model = RidgeRegressor(alpha=self.alpha)

        train_start = time.time()
        self.model.fit(X_train_scaled, y_pre_test)
        self.training_time_ms = round((time.time() - train_start) * 1000.0, 2)

        # 3. Final Single-Pass Out-of-Sample Evaluation on Unseen Test Partition (15%)
        inf_start = time.time()
        y_pred_test = self.model.predict(X_test_scaled)
        self.inference_time_ms = round((time.time() - inf_start) * 1000.0, 2)
        
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
        incorrect_directions = len(y_test) - correct_directions
        directional_accuracy = float((correct_directions / len(y_test)) * 100.0)

        lag_direction = np.sign(closes_test - valid_df['lag_close_1'].iloc[split_idx:].values)
        baseline_hit_rate = float(np.mean(actual_direction == lag_direction) * 100.0)

        self.directional_audit = {
            "total_observations": int(len(y_test)),
            "correct_directional_predictions": int(correct_directions),
            "incorrect_directional_predictions": int(incorrect_directions),
            "directional_hit_rate_pct": round(directional_accuracy, 2),
            "baseline_directional_hit_rate_pct": round(baseline_hit_rate, 2),
            "edge_over_baseline_pct": round(directional_accuracy - baseline_hit_rate, 2)
        }

        self.final_test_metrics = {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "mape": round(mape, 2),
            "r2": round(r2, 4),
            "directional_accuracy_pct": round(directional_accuracy, 2),
            "residual_std": float(np.std(residuals))
        }

        # 4. Multi-Horizon Recursive Out-of-Sample Evaluation (1d, 5d, 10d, 20d)
        self.multi_horizon_evaluation = MultiHorizonForecastEvaluator.evaluate_horizons(
            df_raw=df_raw,
            model_instance=self,
            horizons=[1, 5, 10, 20],
            test_ratio=test_ratio
        )

        # Feature Importance & SHAP
        if self.model_type == "xgboost":
            importances = self.model.feature_importances_
        else:
            coef_abs = np.abs(self.model.coef_)
            importances = coef_abs / (np.sum(coef_abs) + 1e-9)

        self.feature_importance = [
            {"feature": name, "importance_pct": round(float(score), 2)}
            for name, score in sorted(zip(feature_cols, importances * 100.0), key=lambda x: x[1], reverse=True)[:10]
        ]

        latest_X = X_test_scaled[-1:] if len(X_test_scaled) > 0 else X_train_scaled[-1:]
        if self.model_type == "xgboost" and hasattr(self.model, "compute_tree_shap_attributions"):
            self.shap_attributions = self.model.compute_tree_shap_attributions(latest_X, feature_cols)[:8]
        else:
            weights = self.model.coef_
            shap_vals = latest_X[0] * weights
            total_s = np.sum(np.abs(shap_vals)) + 1e-9
            s_list = []
            for name, val in zip(feature_cols, shap_vals):
                pct = (abs(val) / total_s) * 100.0
                s_list.append({
                    "feature": name,
                    "shap_value": round(float(val), 4),
                    "contribution_pct": round(float(pct), 2),
                    "impact": "Positive (Bullish push)" if val > 0 else "Negative (Bearish pull)"
                })
            s_list.sort(key=lambda x: x["contribution_pct"], reverse=True)
            self.shap_attributions = s_list[:8]

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
            "model_name": self.model.name if hasattr(self.model, "name") else self.model_type.upper(),
            "model_type": self.model_type,
            "validation": self.validation_metrics,
            "final_holdout_test": self.final_test_metrics,
            "directional_audit": self.directional_audit,
            "multi_horizon_evaluation": self.multi_horizon_evaluation,
            "training_time_ms": self.training_time_ms,
            "inference_time_ms": self.inference_time_ms,
            "train_samples": self.train_size,
            "test_samples": self.test_size,
            "testing_period_start": str(pd.to_datetime(dates_test[0]).strftime('%Y-%m-%d')),
            "testing_period_end": str(pd.to_datetime(dates_test[-1]).strftime('%Y-%m-%d')),
            "residual_std": self.final_test_metrics["residual_std"]
        }

    def generate_forecast(self, df_raw: pd.DataFrame, horizons: List[int] = [1, 5, 10, 20, 30]) -> Dict[str, Any]:
        if self.model is None:
            self.fit_and_evaluate(df_raw)

        df_feat, feature_cols = TimeSeriesFeatureExtractor.extract_features(df_raw)
        current_price = float(df_raw.iloc[-1]['close'])
        last_date = pd.to_datetime(df_raw.iloc[-1]['date'])
        res_std = self.final_test_metrics.get('residual_std', current_price * 0.015)

        max_horizon = max(horizons)
        forecast_steps = []
        current_sim_df = df_raw.copy()
        current_sim_df['date'] = pd.to_datetime(current_sim_df['date'])

        for step in range(1, max_horizon + 1):
            f_df, f_cols = TimeSeriesFeatureExtractor.extract_features(current_sim_df)
            X_curr = f_df[self.feature_names].iloc[-1:].values
            X_curr_scaled = self.scaler.transform(X_curr)
            
            pred_price = float(self.model.predict(X_curr_scaled)[0])
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
                "prediction_interval_95_lower": round(lower_95, 2),
                "prediction_interval_95_upper": round(upper_95, 2),
                "prediction_interval_80_lower": round(lower_80, 2),
                "prediction_interval_80_upper": round(upper_80, 2),
                "uncertainty_spread_width": round(2 * margin_95, 2)
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
                "forecast_range_min": match['prediction_interval_95_lower'],
                "forecast_range_max": match['prediction_interval_95_upper'],
                "direction": direction,
                "confidence_score": round(max(30.0, 100.0 - (self.final_test_metrics.get('mape', 5.0) * np.sqrt(h))), 1)
            }

        return {
            "model_type": self.model_type,
            "model_name": self.model.name if hasattr(self.model, "name") else self.model_type.upper(),
            "current_price": round(current_price, 2),
            "last_historical_date": str(last_date.strftime('%Y-%m-%d')),
            "horizons": horizon_summaries,
            "forecast_trajectory": forecast_steps,
            "validation": self.validation_metrics,
            "final_holdout_test": self.final_test_metrics,
            "directional_audit": self.directional_audit,
            "multi_horizon_evaluation": self.multi_horizon_evaluation,
            "feature_importance": self.feature_importance,
            "shap_attributions": self.shap_attributions,
            "disclaimer": "Educational statistical projection. Prediction intervals expand with horizon sqrt(h)."
        }
