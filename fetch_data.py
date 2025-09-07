import yfinance as yf
import json
import feedparser
import requests

# -------------------------
# 1️⃣ Metals & Commodities Prices
# -------------------------
commodities = {
    "gold": "GC=F",
    "silver": "SI=F",
    "platinum": "PL=F",
    "palladium": "PA=F",
    "copper": "HG=F",
    "crude_oil": "CL=F"
}

data = {"rates": {"USD": 1}}

for commodity, symbol in commodities.items():
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="5y")
    data[commodity] = hist['Close'].round(2).tolist()

# -------------------------
# 2️⃣ Forex Rates for Multi-Currency Conversion
# -------------------------
currencies = ["INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"]

try:
    res = requests.get(f"https://api.exchangerate.host/latest?base=USD&symbols={','.join(currencies)}")
    fx = res.json()["rates"]
    data["rates"].update(fx)
except Exception as e:
    print("⚠️ Forex fetch failed:", e)

# -------------------------
# 3️⃣ Cryptocurrency Prices (USD)
# -------------------------
try:
    res = requests.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd")
    crypto = res.json()
    data["bitcoin"] = [crypto["bitcoin"]["usd"]]
    data["ethereum"] = [crypto["ethereum"]["usd"]]
except Exception as e:
    print("⚠️ Crypto fetch failed:", e)

# -------------------------
# 4️⃣ Save metals.json
# -------------------------
with open("data/metals.json", "w") as f:
    json.dump(data, f, indent=2)

# -------------------------
# 5️⃣ Gold & Silver News
# -------------------------
# Alternative RSS Feed for Commodities News
rss_url = "https://www.investing.com/news/commodities-news/8"

try:
    feed = feedparser.parse(rss_url)
    headlines = [
        {"title": entry.title, "link": entry.link, "summary": ""}
        for entry in feed.entries
        if "gold" in entry.title.lower() or "silver" in entry.title.lower()
    ][:10]
except Exception as e:
    print("⚠️ News fetch failed:", e)
    headlines = []

# -------------------------
# 6️⃣ Save news.json
# -------------------------
with open("data/news.json", "w") as f:
    json.dump(headlines, f, indent=2)

print("✅ Metals, Crypto & Gold/Silver News fetched successfully!")
