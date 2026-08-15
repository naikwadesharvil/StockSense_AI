"""
StockSense AI - Market Signal Engine (Educational Sentiment Estimator)
Combines technical indicator values with ML forecast trajectory to produce
a transparent, multi-factor sentiment assessment.
Strictly Educational - NOT Financial or Trading Advice.
"""

from typing import Dict, Any, List

class SignalService:
    @staticmethod
    def calculate_composite_signal(
        overview: Dict[str, Any],
        indicators_latest: Dict[str, Any],
        forecast_5d: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Computes multi-factor rule-based score from -100 (Strong Bearish) to +100 (Strong Bullish).
        """
        current_price = overview.get('current_price', 100.0)
        rsi = indicators_latest.get('rsi_14', 50.0)
        macd_hist = indicators_latest.get('macd_hist', 0.0)
        sma_20 = indicators_latest.get('sma_20', current_price)
        sma_50 = indicators_latest.get('sma_50', current_price)
        bb_upper = indicators_latest.get('bb_upper', current_price * 1.05)
        bb_lower = indicators_latest.get('bb_lower', current_price * 0.95)
        
        forecast_change_pct = forecast_5d.get('expected_change_pct', 0.0)
        
        factors: List[Dict[str, Any]] = []
        score = 0.0

        # 1. ML Forecast Weight (30%)
        if forecast_change_pct > 2.0:
            score += 30.0
            factors.append({"factor": "AI 5-Day Forecast", "status": "Strong Bullish", "impact": "+30 pts", "detail": f"Model projects +{forecast_change_pct:.2f}% trajectory"})
        elif forecast_change_pct > 0.5:
            score += 18.0
            factors.append({"factor": "AI 5-Day Forecast", "status": "Moderate Bullish", "impact": "+18 pts", "detail": f"Model projects +{forecast_change_pct:.2f}% trajectory"})
        elif forecast_change_pct < -2.0:
            score -= 30.0
            factors.append({"factor": "AI 5-Day Forecast", "status": "Strong Bearish", "impact": "-30 pts", "detail": f"Model projects {forecast_change_pct:.2f}% decline"})
        elif forecast_change_pct < -0.5:
            score -= 18.0
            factors.append({"factor": "AI 5-Day Forecast", "status": "Moderate Bearish", "impact": "-18 pts", "detail": f"Model projects {forecast_change_pct:.2f}% decline"})
        else:
            factors.append({"factor": "AI 5-Day Forecast", "status": "Neutral", "impact": "0 pts", "detail": f"Model projects flat {forecast_change_pct:.2f}% trajectory"})

        # 2. Moving Average Alignment (25%)
        if sma_20 and sma_50:
            if current_price > sma_20 and sma_20 > sma_50:
                score += 25.0
                factors.append({"factor": "Trend Alignment (SMA)", "status": "Bullish", "impact": "+25 pts", "detail": "Price > SMA20 > SMA50 (Golden Alignment)"})
            elif current_price < sma_20 and sma_20 < sma_50:
                score -= 25.0
                factors.append({"factor": "Trend Alignment (SMA)", "status": "Bearish", "impact": "-25 pts", "detail": "Price < SMA20 < SMA50 (Death Cross Alignment)"})
            else:
                score += 5.0 if current_price > sma_50 else -5.0
                factors.append({"factor": "Trend Alignment (SMA)", "status": "Mixed", "impact": "+5 pts" if current_price > sma_50 else "-5 pts", "detail": "Mixed price vs moving averages position"})

        # 3. RSI Momentum (20%)
        if rsi < 30:
            score += 15.0 # Oversold bounce potential
            factors.append({"factor": "RSI (14)", "status": "Oversold Bullish", "impact": "+15 pts", "detail": f"RSI is {rsi:.1f} (below 30 oversold boundary)"})
        elif rsi > 70:
            score -= 15.0 # Overbought caution
            factors.append({"factor": "RSI (14)", "status": "Overbought Caution", "impact": "-15 pts", "detail": f"RSI is {rsi:.1f} (above 70 overbought boundary)"})
        elif 50 <= rsi <= 65:
            score += 15.0 # Healthy upward momentum
            factors.append({"factor": "RSI (14)", "status": "Positive Momentum", "impact": "+15 pts", "detail": f"RSI is {rsi:.1f} in healthy expansion zone"})
        else:
            score -= 5.0
            factors.append({"factor": "RSI (14)", "status": "Subdued Momentum", "impact": "-5 pts", "detail": f"RSI is {rsi:.1f} in contraction zone"})

        # 4. MACD Histogram (15%)
        if macd_hist > 0:
            score += 15.0
            factors.append({"factor": "MACD Histogram", "status": "Bullish Expansion", "impact": "+15 pts", "detail": f"Histogram positive ({macd_hist:+.2f}) indicating accelerating momentum"})
        else:
            score -= 15.0
            factors.append({"factor": "MACD Histogram", "status": "Bearish Contraction", "impact": "-15 pts", "detail": f"Histogram negative ({macd_hist:+.2f}) indicating decelerating momentum"})

        # 5. Bollinger Band Proximity (10%)
        if current_price < bb_lower * 1.01:
            score += 10.0
            factors.append({"factor": "Bollinger Bands", "status": "Support Bounce", "impact": "+10 pts", "detail": "Price testing lower band support boundary"})
        elif current_price > bb_upper * 0.99:
            score -= 10.0
            factors.append({"factor": "Bollinger Bands", "status": "Resistance Zone", "impact": "-10 pts", "detail": "Price testing upper band resistance boundary"})
        else:
            factors.append({"factor": "Bollinger Bands", "status": "Neutral Channel", "impact": "0 pts", "detail": "Price trading comfortably within standard 2σ bands"})

        # Bound score [-100, 100]
        final_score = max(-100.0, min(100.0, score))
        
        # Categorize
        if final_score >= 45:
            signal_category = "Bullish"
            confidence_level = "High"
            badge_color = "green"
        elif final_score >= 15:
            signal_category = "Moderate Bullish"
            confidence_level = "Moderate"
            badge_color = "emerald"
        elif final_score <= -45:
            signal_category = "Bearish"
            confidence_level = "High"
            badge_color = "red"
        elif final_score <= -15:
            signal_category = "Moderate Bearish"
            confidence_level = "Moderate"
            badge_color = "orange"
        else:
            signal_category = "Neutral"
            confidence_level = "Moderate"
            badge_color = "blue"

        return {
            "signal": signal_category,
            "sentiment_score": round(final_score, 1),
            "confidence_level": confidence_level,
            "badge_color": badge_color,
            "breakdown_factors": factors,
            "label": "AI Market Sentiment — Educational Estimate",
            "disclaimer": "This indicator is synthesized for educational exploration. It is not financial advice, trading signals, or a solicitation to buy or sell securities."
        }
