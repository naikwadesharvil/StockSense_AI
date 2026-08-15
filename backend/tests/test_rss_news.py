"""
Test Yahoo Finance RSS News Feed
"""

import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

def test_rss():
    symbols = ["AAPL", "NVDA", "RELIANCE.NS", "TCS.NS"]
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    
    for sym in symbols:
        url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={sym}&region=US&lang=en-US"
        print(f"\n--- Testing RSS for {sym} ({url}) ---")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                
                channel = root.find("channel")
                items = channel.findall("item") if channel is not None else []
                print(f"Found {len(items)} items for {sym}")
                
                for i, item in enumerate(items[:3]):
                    title = item.find("title").text if item.find("title") is not None else "No Title"
                    link = item.find("link").text if item.find("link") is not None else "No Link"
                    pubDate = item.find("pubDate").text if item.find("pubDate") is not None else "No Date"
                    desc = item.find("description").text if item.find("description") is not None else ""
                    source = item.find("source").text if item.find("source") is not None else "Yahoo Finance"
                    print(f"\n[Article {i+1}]")
                    print(f"  Title: {title}")
                    print(f"  Link: {link}")
                    print(f"  Published: {pubDate}")
                    print(f"  Source: {source}")
                    print(f"  Summary snippet: {desc[:120]}...")
        except Exception as e:
            print(f"Error fetching RSS for {sym}: {e}")

if __name__ == "__main__":
    test_rss()
