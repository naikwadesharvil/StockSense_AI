"""
Test Indian Stock News via Google News RSS & Yahoo Search
"""

import urllib.request
import xml.etree.ElementTree as ET

def test_indian_news():
    queries = [
        ("RELIANCE", "Reliance Industries stock"),
        ("TCS", "Tata Consultancy Services stock"),
        ("INFY", "Infosys stock"),
        ("HDFCBANK", "HDFC Bank stock"),
        ("AAPL", "Apple stock"),
        ("NVDA", "Nvidia stock")
    ]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    
    for sym, q in queries:
        url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=en-US&gl=US&ceid=US:en"
        print(f"\n--- Google News RSS for {sym} ({q}) ---")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                channel = root.find("channel")
                items = channel.findall("item") if channel is not None else []
                print(f"Found {len(items)} items for {sym}")
                
                for i, item in enumerate(items[:2]):
                    title = item.find("title").text if item.find("title") is not None else "No Title"
                    link = item.find("link").text if item.find("link") is not None else "No Link"
                    pubDate = item.find("pubDate").text if item.find("pubDate") is not None else "No Date"
                    source_elem = item.find("source")
                    source = source_elem.text if source_elem is not None else "Financial News"
                    print(f"  [Article {i+1}] {title}")
                    print(f"    Source: {source} | Pub: {pubDate}")
                    print(f"    Link: {link[:80]}...")
        except Exception as e:
            print(f"Error fetching for {sym}: {e}")

if __name__ == "__main__":
    test_indian_news()
