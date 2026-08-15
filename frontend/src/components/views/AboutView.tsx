import React from 'react';
import { DisclaimerBanner } from '../common/DisclaimerBanner';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* Title & Introduction */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-mono font-semibold uppercase">
          <span>B.Tech AIML Portfolio Project</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          StockSense AI — System Architecture & Methodology
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          StockSense AI is an educational time-series forecasting and quantitative market analytics platform. It was engineered to bridge the gap between machine learning theory, financial econometric indicators, and interactive web visualization.
        </p>
      </div>

      <DisclaimerBanner />

      {/* 1. Project Objective */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>1. Project Objective & Philosophy</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Financial time-series data is notoriously non-stationary, noisy, and subject to regime shifts. Rather than presenting "black box" deterministic price predictions, StockSense AI focuses on:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-2">
          <li><strong>Rigorous chronological data splitting</strong> to eliminate future data leakage.</li>
          <li><strong>Quantitative feature engineering</strong> integrating momentum, moving averages, and volatility.</li>
          <li><strong>Uncertainty quantification</strong> via expanding residual variance cones (80% and 95% intervals).</li>
          <li><strong>Transparent out-of-sample backtesting</strong> (MAE, RMSE, MAPE, R², and Directional Accuracy).</li>
        </ul>
      </div>

      {/* 2. End-to-End ML Pipeline Architecture */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>2. End-to-End Time-Series ML Pipeline</span>
        </h2>
        
        <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-indigo-400 border border-slate-800 overflow-x-auto">
          <pre className="whitespace-pre">
{`Raw Historical Stock Data (OHLCV)
        │
        ▼
Data Preprocessing & Stationarity Transformations
        │
        ▼
Feature Engineering:
  ├─ Autoregressive Lags (t-1, t-2, t-3, t-5, t-7, t-10, t-14)
  ├─ Rolling Averages (SMA 5/10/20/50, EMA 12/20/26)
  ├─ Price / SMA Ratios & Momentum
  ├─ Wilder RSI 14 Oscillator
  ├─ MACD Line, Signal Line & Divergence Histogram
  ├─ Bollinger Bands (%B and Bandwidth)
  └─ 20-Day Annualized Volatility & Volume Momentum
        │
        ▼
Chronological Train / Test Split (85% Historical -> 15% Unseen Out-of-Sample)
        │
        ▼
StandardScaler Feature Normalization (Fit on Train ONLY)
        │
        ▼
L2 Regularized Ridge Regression Model Fit:
  W = (X^T X + α I)^(-1) X^T y
        │
        ▼
Recursive Multi-Step Forward Forecasting (Horizons: 1d, 5d, 10d, 30d)
        │
        ▼
Uncertainty Quantification (Residual RMSE * sqrt(h) Cone)
        │
        ▼
Interactive Dashboard & Visualizations (Candles, Cones, Overlays, NLP Sentiment)`}
          </pre>
        </div>
      </div>

      {/* 3. Mathematical Formulations & Evaluation Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          3. Mathematical Formulations & Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="font-bold text-indigo-500">Mean Absolute Error (MAE):</div>
            <div className="text-slate-600 dark:text-slate-300">MAE = (1/n) Σ |y_i - ŷ_i|</div>
            <p className="font-sans text-[11px] text-slate-400">Represents average error magnitude in price units.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="font-bold text-indigo-500">Root Mean Squared Error (RMSE):</div>
            <div className="text-slate-600 dark:text-slate-300">RMSE = √[(1/n) Σ (y_i - ŷ_i)²]</div>
            <p className="font-sans text-[11px] text-slate-400">Heavily penalizes large outlier forecasting errors.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="font-bold text-indigo-500">Mean Absolute % Error (MAPE):</div>
            <div className="text-slate-600 dark:text-slate-300">MAPE = (100%/n) Σ |(y_i - ŷ_i) / y_i|</div>
            <p className="font-sans text-[11px] text-slate-400">Scale-independent relative percentage precision.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="font-bold text-indigo-500">Directional Accuracy (Hit Rate):</div>
            <div className="text-slate-600 dark:text-slate-300">Hit% = (1/n) Σ I(sign(Δy) == sign(Δŷ))</div>
            <p className="font-sans text-[11px] text-slate-400">Frequency of correctly predicting the sign of the next move.</p>
          </div>
        </div>
      </div>

      {/* 4. Limitations & Real-World Realities */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          4. Scientific Limitations
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          While statistical and machine learning models are powerful for quantitative study, financial markets are subject to:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-2">
          <li><strong>Reflexivity & Efficient Market Dynamics:</strong> Market participants react to price signals in real time, altering subsequent probabilities.</li>
          <li><strong>Macroeconomic Exogenous Shocks:</strong> Unforeseen central bank interest rate decisions, geopolitical conflicts, and regulatory shifts cannot be deduced solely from historical price ticks.</li>
          <li><strong>Black Swan Events:</strong> Fat-tailed distributions mean extreme events happen far more frequently than normal Gaussian distributions assume.</li>
        </ul>
      </div>

      {/* 5. Future Roadmap & Research Additions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          5. Future Research Roadmap
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { title: 'Temporal Fusion Transformers (TFT)', desc: 'Multi-horizon self-attention networks capturing long-term dependencies.' },
            { title: 'Explainable AI (SHAP & LIME)', desc: 'Game-theoretic attribution scores for individual session feature drivers.' },
            { title: 'Deep Reinforcement Learning (RL)', desc: 'PPO and DDPG agents for algorithmic portfolio rebalancing simulations.' },
            { title: 'LLM Multi-Modal Sentiment Parsing', desc: 'Real-time corporate earnings call audio transcription and sentiment extraction.' },
            { title: 'Markowitz Mean-Variance Optimization', desc: 'Automated efficient frontier computation and asset weight allocation.' },
            { title: 'Real-Time WebSocket Ingestion', desc: 'Sub-second tick-level streaming data feeds with Kafka & FastAPI WebSockets.' }
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
              <div className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Academic Notice */}
      <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-2">
        <div className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
          StockSense AI — Academic Project Notice
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Developed as a comprehensive B.Tech Artificial Intelligence & Machine Learning capstone project demonstrating time-series data science, machine learning regression, quantitative financial analytics, and modern full-stack application architecture.
        </p>
      </div>
    </div>
  );
};
