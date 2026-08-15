"""
All 8-Stock Live Financial News & Sentiment Verification Script
Queries running server /api/news/{symbol} endpoint for all 8 stocks and displays full audit results.
"""

import urllib.request
import json

def verify_news_all_8():
    symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "RELIANCE", "TCS", "INFY", "HDFCBANK"]
    
    print("=" * 165)
    print(f"{'SYMBOL':<9} | {'COUNT':<6} | {'NEWEST PUB':<16} | {'OLDEST PUB':<16} | {'OVERALL':<8} | {'SCORE':<6} | {'PROVIDER':<28} | {'SAMPLE SOURCE & HEADLINE'}")
    print("=" * 165)
    
    detailed_samples = []
    
    for sym in symbols:
        url = f"http://localhost:8000/api/news/{sym}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "NewsAudit/2.0"})
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                articles = data.get("articles", [])
                summary = data.get("sentiment_summary", {})
                provider = data.get("provider", "Unknown")
                overall = summary.get("overall", data.get("overall_sentiment", "Neutral"))
                score = summary.get("score", data.get("average_score", 0.0))
                
                count = len(articles)
                newest = articles[0].get("published_at", "N/A") if count > 0 else "N/A"
                oldest = articles[-1].get("published_at", "N/A") if count > 0 else "N/A"
                
                sample_text = "No articles"
                if count > 0:
                    a0 = articles[0]
                    src = a0.get("source", "Media")
                    hl = a0.get("headline") or a0.get("title", "")
                    sample_text = f"[{src}] {hl[:55]}..."
                    detailed_samples.append({
                        "symbol": sym,
                        "headline": hl,
                        "source": src,
                        "published_at": a0.get("published_at"),
                        "url": a0.get("url"),
                        "sentiment": a0.get("sentiment") or a0.get("sentiment_class"),
                        "score": a0.get("sentiment_score")
                    })
                
                print(f"{sym:<9} | {count:<6} | {newest:<16} | {oldest:<16} | {overall:<8} | {score:<6} | {provider:<28} | {sample_text}")
        except Exception as e:
            print(f"{sym:<9} | ERROR: {e}")
            
    print("=" * 165)
    print("\n--- SAMPLE ARTICLE AUDIT DETAILS ---")
    for s in detailed_samples:
        print(f"\n[{s['symbol']}]")
        print(f"  Headline:     {s['headline']}")
        print(f"  Publisher:    {s['source']}")
        print(f"  Published At: {s['published_at']}")
        print(f"  Article URL:  {s['url']}")
        print(f"  Sentiment:    {s['sentiment']} (Score: {s['score']})")

if __name__ == "__main__":
    verify_news_all_8()
