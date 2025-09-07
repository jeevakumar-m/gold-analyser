import yfinance as yf
import json
import feedparser
import requests

# -------------------------
# 1️⃣ Metals Prices
# -------------------------
metals = {"gold": "GC=F", "silver": "SI=F"}
data = {"rates": {"USD": 1}}

# Fetch 5-year historical prices
for metal, symbol in metals.items():
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="5y")
    data[metal] = hist['Close'].round(2).tolist()

# -------------------------
# 2️⃣ Forex Rates for Multi-Currency Conversion
# -------------------------
try:
    res = requests.get("https://api.exchangerate.host/latest?base=USD&symbols=INR,EUR,GBP,JPY")
    fx = res.json()["rates"]
    data["rates"].update(fx)
except Exception as e:
    print("⚠️ Forex fetch failed:", e)

# -------------------------
# 3️⃣ Save metals.json
# -------------------------
with open("data/metals.json", "w") as f:
    json.dump(data, f, indent=2)

# -------------------------
# 4️⃣ Gold & Silver News
# -------------------------
rss_url = "https://www.investing.com/rss/commodities-news.rss"
feed = feedparser.parse(rss_url)

# Keep only articles containing "gold" or "silver"
headlines = [
    {"title": entry.title, "link": entry.link}
    for entry in feed.entries
    if "gold" in entry.title.lower() or "silver" in entry.title.lower()
][:10]

# -------------------------
# 5️⃣ Optional: Add Basic AI Summary Field Placeholder
# (Front-end will run summarization using Transformers.js)
# -------------------------
for h in headlines:
    h["summary"] = ""  # Placeholder; actual summary in browser

# -------------------------
# 6️⃣ Save news.json
# -------------------------
with open("data/news.json", "w") as f:
    json.dump(headlines, f, indent=2)

print("✅ Metals & Gold/Silver News fetched successfully!")
