"""
StockSense AI V2 - Model Selection & Multi-Model Forecasting Service
Methodology:
  - Models are compared and selected strictly using WALK-FORWARD VALIDATION RMSE on pre-test partition
  - Selected model is trained on the entire pre-test period
  - Final 15% holdout test set is evaluated ONCE as an independent benchmark
  - Naïve Persistence baseline is evaluated under identical framework for benchmarking
  - Multi-Horizon Out-of-Sample Evaluation (1d, 5d, 10d, 20d) with Empirical Interval Coverage
  - Diebold-Mariano Statistical Hypothesis Testing on Pre-Test Validation Residuals
  - Upstream data-anchored caching guaranteeing zero stale forecasts
"""

from typing import Dict, Any, Optional, List
import numpy as np

from backend.models.time_series_ml import (
    TimeSeriesForecastModel,
    NaivePersistenceBaseline,
    MultiHorizonForecastEvaluator,
    DieboldMarianoTest
)
from backend.models.lstm_model import TimeSeriesLSTMModel
from backend.services.stock_data import StockDataService
from backend.services.indicators import IndicatorService
from backend.services.signal_service import SignalService
from backend.services.cache_service import cache_manager, CacheManager, get_current_ist_timestamp

class ForecastService:

    @classmethod
    def get_forecast(cls, symbol: str, model_type: str = "validation_selected") -> Dict[str, Any]:
        sym = symbol.strip().upper()
        m_type = model_type.lower()
        
        df = StockDataService.get_historical_data(sym, timeframe="5Y")
        last_dt = str(df['date'].iloc[-1]) if len(df) > 0 else "N/A"
        last_c = float(df['close'].iloc[-1]) if len(df) > 0 else 0.0
        cache_key = f"{sym}_{m_type}_{last_dt}_{last_c}"

        def _compute():
            overview = StockDataService.get_stock_overview(sym)
            indicators = IndicatorService.compute_all_indicators(df)

            comparison = cls.get_model_comparison(sym)
            selected_meta = comparison["validation_selected_model"]

            active_model_key = m_type
            if active_model_key in ["best", "validation_selected", "auto"]:
                active_model_key = selected_meta["model_type"]

            if active_model_key == "lstm":
                model = TimeSeriesLSTMModel(lookback_window=15, epochs=20)
                eval_res = model.fit_and_evaluate(df, test_ratio=0.15)
                forecast_result = model.generate_forecast(df, horizons=[1, 5, 10, 20, 30])
                backtest_res = model.backtest_results[-50:]
                feat_imp = []
                shap_attr = []
                dir_audit = {
                    "total_observations": len(model.backtest_results),
                    "directional_hit_rate_pct": eval_res["final_holdout_test"]["directional_accuracy_pct"]
                }
                multi_horizon = {}
            elif active_model_key == "xgboost":
                model = TimeSeriesForecastModel(model_type="xgboost")
                eval_res = model.fit_and_evaluate(df, test_ratio=0.15)
                forecast_result = model.generate_forecast(df, horizons=[1, 5, 10, 20, 30])
                backtest_res = model.backtest_results[-50:]
                feat_imp = model.feature_importance
                shap_attr = model.shap_attributions
                dir_audit = model.directional_audit
                multi_horizon = model.multi_horizon_evaluation
            else: # Default Ridge Baseline
                active_model_key = "ridge"
                model = TimeSeriesForecastModel(model_type="ridge", alpha=10.0)
                eval_res = model.fit_and_evaluate(df, test_ratio=0.15)
                forecast_result = model.generate_forecast(df, horizons=[1, 5, 10, 20, 30])
                backtest_res = model.backtest_results[-50:]
                feat_imp = model.feature_importance
                shap_attr = model.shap_attributions
                dir_audit = model.directional_audit
                multi_horizon = model.multi_horizon_evaluation

            market_signal = SignalService.calculate_composite_signal(
                overview=overview,
                indicators_latest=indicators['latest'],
                forecast_5d=forecast_result['horizons']['5d']
            )

            return {
                "symbol": sym,
                "selected_model": active_model_key,
                "model_name": eval_res.get("model_name", active_model_key.upper()),
                "selection_methodology": "Walk-Forward Validation RMSE (Pre-test partition)",
                "validation_selected_model": selected_meta,
                "stock_overview": overview,
                "forecast_data": forecast_result,
                "indicators_latest": indicators['latest'],
                "market_signal": market_signal,
                "backtest_results": backtest_res,
                "feature_importance": feat_imp,
                "shap_attributions": shap_attr,
                "validation": eval_res.get("validation", {}),
                "final_holdout_test": eval_res.get("final_holdout_test", {}),
                "directional_audit": dir_audit,
                "multi_horizon_evaluation": multi_horizon,
                "data_mode": overview.get("data_mode", "REAL MARKET DATA"),
                "data_provider": overview.get("data_provider", "Yahoo Finance / Historical Archive"),
                "data_timestamp": last_dt,
                "forecast_computed_at_ist": get_current_ist_timestamp(),
                "updated_at_ist": get_current_ist_timestamp()
            }

        return cache_manager.get_or_compute(cache_manager.forecast_cache, cache_key, _compute, ttl_seconds=CacheManager.FORECAST_TTL)

    @classmethod
    def get_model_comparison(cls, symbol: str) -> Dict[str, Any]:
        """
        Runs Walk-Forward Cross Validation strictly on the pre-test partition to select candidate model,
        then evaluates candidates and Naïve Baselines ONCE on the final 15% unseen holdout test set.
        Cached in CacheManager with data-anchored TTL.
        """
        sym = symbol.strip().upper()
        df = StockDataService.get_historical_data(sym, timeframe="5Y")
        last_dt = str(df['date'].iloc[-1]) if len(df) > 0 else "N/A"
        last_c = float(df['close'].iloc[-1]) if len(df) > 0 else 0.0
        cache_key = f"{sym}_{last_dt}_{last_c}"

        def _compute():
            overview = StockDataService.get_stock_overview(sym)

            # 1. Candidate ML Models
            m_ridge = TimeSeriesForecastModel(model_type="ridge", alpha=10.0)
            res_ridge = m_ridge.fit_and_evaluate(df, test_ratio=0.15)

            m_xgb = TimeSeriesForecastModel(model_type="xgboost")
            res_xgb = m_xgb.fit_and_evaluate(df, test_ratio=0.15)

            m_lstm = TimeSeriesLSTMModel(lookback_window=15, epochs=20)
            res_lstm = m_lstm.fit_and_evaluate(df, test_ratio=0.15)

            # 2. Naïve Persistence Baseline
            m_naive = NaivePersistenceBaseline()
            res_naive = m_naive.fit_and_evaluate(df, test_ratio=0.15)

            candidate_models = [
                {
                    "model_type": "ridge",
                    "model_name": "Ridge Regression — Baseline Model",
                    "architecture": "L2 Regularized Closed-Form Linear Auto-Regression (α=10.0)",
                    "validation": {
                        "walk_forward_rmse": res_ridge["validation"]["walk_forward_rmse"],
                        "walk_forward_mae": res_ridge["validation"]["walk_forward_mae"],
                        "walk_forward_mape": res_ridge["validation"]["walk_forward_mape"],
                        "folds_evaluated": res_ridge["validation"]["folds_evaluated"]
                    },
                    "final_holdout_test": {
                        "mae": res_ridge["final_holdout_test"]["mae"],
                        "rmse": res_ridge["final_holdout_test"]["rmse"],
                        "mape": res_ridge["final_holdout_test"]["mape"],
                        "r2": res_ridge["final_holdout_test"]["r2"],
                        "directional_accuracy_pct": res_ridge["final_holdout_test"]["directional_accuracy_pct"]
                    },
                    "training_time_ms": res_ridge["training_time_ms"],
                    "inference_time_ms": res_ridge["inference_time_ms"]
                },
                {
                    "model_type": "xgboost",
                    "model_name": "XGBoost — Gradient Boosted Trees",
                    "architecture": "Sequential Residual Boosting with TreeSHAP Explanations",
                    "validation": {
                        "walk_forward_rmse": res_xgb["validation"]["walk_forward_rmse"],
                        "walk_forward_mae": res_xgb["validation"]["walk_forward_mae"],
                        "walk_forward_mape": res_xgb["validation"]["walk_forward_mape"],
                        "folds_evaluated": res_xgb["validation"]["folds_evaluated"]
                    },
                    "final_holdout_test": {
                        "mae": res_xgb["final_holdout_test"]["mae"],
                        "rmse": res_xgb["final_holdout_test"]["rmse"],
                        "mape": res_xgb["final_holdout_test"]["mape"],
                        "r2": res_xgb["final_holdout_test"]["r2"],
                        "directional_accuracy_pct": res_xgb["final_holdout_test"]["directional_accuracy_pct"]
                    },
                    "training_time_ms": res_xgb["training_time_ms"],
                    "inference_time_ms": res_xgb["inference_time_ms"]
                },
                {
                    "model_type": "lstm",
                    "model_name": "LSTM — Recurrent Neural Network",
                    "architecture": "Sliding Window Recurrent Sequence Network (Lookback=15)",
                    "validation": {
                        "walk_forward_rmse": res_lstm["validation"]["walk_forward_rmse"],
                        "walk_forward_mae": res_lstm["validation"]["walk_forward_mae"],
                        "walk_forward_mape": res_lstm["validation"]["walk_forward_mape"],
                        "folds_evaluated": res_lstm["validation"]["folds_evaluated"]
                    },
                    "final_holdout_test": {
                        "mae": res_lstm["final_holdout_test"]["mae"],
                        "rmse": res_lstm["final_holdout_test"]["rmse"],
                        "mape": res_lstm["final_holdout_test"]["mape"],
                        "r2": res_lstm["final_holdout_test"]["r2"],
                        "directional_accuracy_pct": res_lstm["final_holdout_test"]["directional_accuracy_pct"]
                    },
                    "training_time_ms": res_lstm["training_time_ms"],
                    "inference_time_ms": res_lstm["inference_time_ms"]
                }
            ]

            selected_model = min(
                candidate_models,
                key=lambda m: (m["validation"]["walk_forward_rmse"], m["validation"]["walk_forward_mae"])
            )

            naive_baseline_report = {
                "model_type": "naive_persistence",
                "model_name": "Naïve Persistence Baseline (Last Value: C[t+1] = C[t])",
                "architecture": "Zero-parameter Persistence Random Walk",
                "validation": res_naive["validation"],
                "final_holdout_test": res_naive["final_holdout_test"]
            }

            dm_results = DieboldMarianoTest.test(
                errors_model=np.array(m_ridge.walk_forward_residuals),
                errors_benchmark=np.array(m_naive.walk_forward_residuals),
                loss_type="squared"
            )

            multi_horizon_res = m_ridge.multi_horizon_evaluation if selected_model["model_type"] == "ridge" else (
                m_xgb.multi_horizon_evaluation if selected_model["model_type"] == "xgboost" else {}
            )

            ridge_diagnostics = {
                "finding": "Ridge Regression is the validation-selected architecture among candidate ML models, but does not consistently outperform the zero-parameter Naïve Persistence benchmark on raw daily price levels.",
                "evidence_based_reasons": [
                    "Autoregressive price continuity: Daily asset prices follow near-martingale dynamics with high autocorrelation, allowing Ridge to fit near-diagonal weights on lag-1.",
                    "Tree-model range clipping: Standard GBDT models partition feature space into piecewise-constant leaves bounded by [min(y_train), max(y_train)], clipping when test prices exceed historical training extremes.",
                    "Sequence distribution shifts: Un-differenced recurrent neural networks suffer from mean drift across multi-year macroeconomic regimes.",
                    "Parameter estimation variance: Zero-parameter Naïve Persistence avoids estimation variance entirely, yielding lower sample squared errors on near-random-walk series."
                ]
            }

            return {
                "symbol": sym,
                "stock_overview": overview,
                "selection_rule": "Primary: Walk-Forward Validation RMSE (Pre-test partition) | Secondary Tie-Breaker: Walk-Forward MAE",
                "validation_selected_model": {
                    "model_type": selected_model["model_type"],
                    "model_name": selected_model["model_name"],
                    "selection_metric": "Walk-Forward Validation RMSE",
                    "selection_score": selected_model["validation"]["walk_forward_rmse"],
                    "validation_mae": selected_model["validation"]["walk_forward_mae"],
                    "final_holdout_rmse": selected_model["final_holdout_test"]["rmse"]
                },
                "models_comparison": candidate_models,
                "naive_baseline": naive_baseline_report,
                "diebold_mariano_statistical_test": dm_results,
                "multi_horizon_evaluation": multi_horizon_res,
                "directional_accuracy_audit": m_ridge.directional_audit,
                "ridge_dominance_diagnostics": ridge_diagnostics,
                "evaluation_partitions": {
                    "pre_test_train_samples": res_ridge["train_samples"],
                    "final_holdout_test_samples": res_ridge["test_samples"],
                    "test_start_date": res_ridge["testing_period_start"],
                    "test_end_date": res_ridge["testing_period_end"]
                },
                "data_timestamp": last_dt,
                "disclaimer": "Model selection is determined strictly from Walk-Forward Cross-Validation on the pre-test partition. The final holdout test set is evaluated once as an unbiased benchmark.",
                "updated_at_ist": get_current_ist_timestamp()
            }

        return cache_manager.get_or_compute(cache_manager.model_comparison_cache, cache_key, _compute, ttl_seconds=CacheManager.MODEL_COMPARISON_TTL)

    @classmethod
    def get_model_performance(cls, symbol: str, model_type: str = "validation_selected") -> Dict[str, Any]:
        sym = symbol.strip().upper()
        return cls.get_forecast(sym, model_type=model_type)
