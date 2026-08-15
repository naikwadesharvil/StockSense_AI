"""
StockSense AI - Financial Domain NLP Sentiment Analyzer
Deterministic, rule-augmented financial lexicon analyzer (Loughran-McDonald & VADER financial principles)
with contextual modifier parsing, phrase-level directional heuristics, and aggregate weighting.
"""

import re
from typing import Dict, List, Tuple, Any
from backend.services.news.base import NewsArticle, SentimentSummary

# Financial Domain Sentiment Lexicons
POSITIVE_FINANCIAL_TERMS = {
    "beat": 0.75, "beats": 0.75, "beating": 0.70, "outperform": 0.70, "outperformed": 0.70,
    "surge": 0.80, "surges": 0.80, "surged": 0.80, "soar": 0.85, "soars": 0.85, "soaring": 0.85,
    "jump": 0.65, "jumps": 0.65, "jumped": 0.65, "rally": 0.75, "rallies": 0.75, "rallied": 0.75,
    "growth": 0.60, "growing": 0.60, "record": 0.70, "profit": 0.65, "profitable": 0.70,
    "upgrade": 0.80, "upgraded": 0.80, "upgrades": 0.80, "bullish": 0.75, "gain": 0.60,
    "gains": 0.60, "gained": 0.60, "dividend": 0.50, "buyback": 0.65, "acquisition": 0.55,
    "expansion": 0.60, "innovation": 0.65, "momentum": 0.60, "synergy": 0.60, "higher": 0.45,
    "win": 0.70, "wins": 0.70, "won": 0.70, "contract": 0.50, "licensing": 0.50, "rebound": 0.65
}

NEGATIVE_FINANCIAL_TERMS = {
    "miss": -0.75, "misses": -0.75, "missed": -0.75, "underperform": -0.70, "slump": -0.80,
    "slumps": -0.80, "slumped": -0.80, "plunge": -0.85, "plunges": -0.85, "plunged": -0.85,
    "drop": -0.65, "drops": -0.65, "dropped": -0.65, "fall": -0.60, "falls": -0.60, "fell": -0.60,
    "loss": -0.70, "losses": -0.70, "downgrade": -0.80, "downgraded": -0.80, "bearish": -0.75,
    "decline": -0.60, "declines": -0.60, "declined": -0.60, "headwind": -0.65, "headwinds": -0.65,
    "cut": -0.65, "cuts": -0.65, "probe": -0.75, "investigation": -0.75, "regulatory": -0.50,
    "lawsuit": -0.70, "fine": -0.65, "sanction": -0.80, "antitrust": -0.75, "scrutiny": -0.55,
    "layoff": -0.60, "layoffs": -0.60, "warning": -0.65, "inflation": -0.45, "debt": -0.40,
    "lower": -0.45, "pressure": -0.50, "stalls": -0.60, "sliding": -0.65, "weaker": -0.60
}

# Directional Multi-Word Financial Phrases (Higher Precedence)
COMPOUND_FINANCIAL_PATTERNS: List[Tuple[re.Pattern, float]] = [
    (re.compile(r"\bbeats?\s+(analyst\s+)?expectations?\b", re.I), 0.85),
    (re.compile(r"\btop(s|ped)?\s+estimates?\b", re.I), 0.85),
    (re.compile(r"\braises?\s+(full[- ]year\s+)?guidance\b", re.I), 0.90),
    (re.compile(r"\brecord\s+(quarterly\s+)?revenue\b", re.I), 0.85),
    (re.compile(r"\bstrong\s+(demand|sales|growth|margin)\b", re.I), 0.75),
    (re.compile(r"\bprice\s+target\s+raised\b", re.I), 0.80),
    (re.compile(r"\blower\s+loss\s+than\s+expected\b", re.I), 0.65),  # Contextual reversal
    (re.compile(r"\bloss\s+narrows?\b", re.I), 0.60),
    (re.compile(r"\bmiss(es|ed)?\s+(analyst\s+)?expectations?\b", re.I), -0.85),
    (re.compile(r"\bcuts?\s+(full[- ]year\s+)?guidance\b", re.I), -0.90),
    (re.compile(r"\bcuts?\s+price\s+target\b", re.I), -0.80),
    (re.compile(r"\brevenue\s+decline\b", re.I), -0.70),
    (re.compile(r"\bmargin\s+pressure\b", re.I), -0.65),
    (re.compile(r"\bantitrust\s+(suit|probe|charges)\b", re.I), -0.80),
    (re.compile(r"\bexport\s+restrictions?\b", re.I), -0.60),
]


class FinancialSentimentAnalyzer:
    """
    NLP sentiment engine tailored for financial discourse, corporate earnings,
    and market commentary.
    """

    @classmethod
    def analyze_text(cls, headline: str, summary: str = "") -> Tuple[str, float, float]:
        """
        Analyzes headline and summary text to determine sentiment class, continuous score (-1.0 to +1.0),
        and confidence metric (0.0 to 1.0).
        """
        text = f"{headline} {summary}".strip()
        if not text:
            return "neutral", 0.0, 0.50

        total_score = 0.0
        match_count = 0

        text_to_eval = text
        # 1. Match High-Confidence Multi-Word Patterns First
        for pattern, weight in COMPOUND_FINANCIAL_PATTERNS:
            if pattern.search(text):
                total_score += weight * 2.0
                match_count += 2
                text_to_eval = pattern.sub(" ", text_to_eval)

        # 2. Token-level Lexicon Evaluation with Negation Window
        words = re.findall(r"\b[a-zA-Z]{2,}\b", text_to_eval.lower())
        negation_window = 0

        for i, word in enumerate(words):
            if word in {"not", "no", "never", "neither", "fails", "without", "hardly"}:
                negation_window = 3
                continue

            multiplier = -0.75 if negation_window > 0 else 1.0

            if word in POSITIVE_FINANCIAL_TERMS:
                total_score += POSITIVE_FINANCIAL_TERMS[word] * multiplier
                match_count += 1
            elif word in NEGATIVE_FINANCIAL_TERMS:
                total_score += NEGATIVE_FINANCIAL_TERMS[word] * multiplier
                match_count += 1

            if negation_window > 0:
                negation_window -= 1

        if match_count == 0:
            return "neutral", 0.0, 0.50

        # Normalize score into [-1.0, 1.0] using hyperbolic tangent scaling
        normalized_score = round(float(total_score / max(1.0, match_count ** 0.5)), 2)
        normalized_score = max(-1.0, min(1.0, normalized_score))

        # Classify
        if normalized_score >= 0.15:
            sentiment_class = "positive"
        elif normalized_score <= -0.15:
            sentiment_class = "negative"
        else:
            sentiment_class = "neutral"

        confidence = round(min(0.95, 0.50 + 0.10 * match_count), 2)
        return sentiment_class, normalized_score, confidence

    @classmethod
    def aggregate_sentiment(cls, articles: List[NewsArticle]) -> SentimentSummary:
        """
        Aggregates individual article sentiment scores into overall market bias,
        applying recency and confidence weighting.
        """
        if not articles:
            return SentimentSummary(
                positive=0,
                neutral=0,
                negative=0,
                overall="Neutral",
                score=0.0,
                confidence=0.0
            )

        pos_count = sum(1 for a in articles if a.sentiment == "positive")
        neu_count = sum(1 for a in articles if a.sentiment == "neutral")
        neg_count = sum(1 for a in articles if a.sentiment == "negative")

        # Weighted score: Give earlier (newer) articles higher weight
        weights = [1.0 / (1.0 + 0.1 * i) for i in range(len(articles))]
        weighted_scores = [a.sentiment_score * w * a.confidence for a, w in zip(articles, weights)]
        avg_score = sum(weighted_scores) / (sum(weights) + 1e-9)
        avg_score = round(float(avg_score), 2)

        if avg_score >= 0.15:
            overall = "Bullish"
        elif avg_score <= -0.15:
            overall = "Bearish"
        else:
            overall = "Neutral"

        avg_conf = round(float(sum(a.confidence for a in articles) / len(articles)), 2)

        return SentimentSummary(
            positive=pos_count,
            neutral=neu_count,
            negative=neg_count,
            overall=overall,
            score=avg_score,
            confidence=avg_conf
        )
