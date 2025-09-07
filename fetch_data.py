import yfinance as yf, json, feedparser

metals = {"gold":"GC=F","silver":"SI=F"}
data = {"rates":{"USD":1}}

for metal,symbol in metals.items():
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="5y")
    data[metal] = hist['Close'].round(2).tolist()

with open("data/metals.json","w") as f: json.dump(data,f,indent=2)

# News RSS
rss_url = "https://www.investing.com/rss/news_25.rss"
feed = feedparser.parse(rss_url)
headlines = [entry.title for entry in feed.entries][:10]
with open("data/news.json","w") as f: json.dump(headlines,f,indent=2)
