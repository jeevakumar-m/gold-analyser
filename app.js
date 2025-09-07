// ====================
// Global Variables
// ====================
let metalsData = null;
let currencyRates = null;
let summarizer = null;

// ====================
// Initialize AI Summarizer
// ====================
async function initSummarizer() {
  summarizer = await window.xenova.pipeline("summarization");
  console.log("✅ Summarizer loaded");
}

// ====================
// Fetch Metals & News Data
// ====================
async function fetchData() {
  try {
    const res = await fetch("data/metals.json");
    metalsData = await res.json();
    currencyRates = metalsData.rates;

    const newsRes = await fetch("data/news.json");
    const news = await newsRes.json();
    renderNews(news);
    renderPriceCards();
    renderChart();
  } catch (e) {
    console.error("Failed to fetch data", e);
  }
}

// ====================
// Render Price Cards
// ====================
function renderPriceCards() {
  const container = document.getElementById("price-cards");
  container.innerHTML = "";

  const currency = document.getElementById("currency").value;
  for (let metal of Object.keys(metalsData)) {
    if (metal === "rates") continue;
    const priceUSD = metalsData[metal].slice(-1)[0];
    const convertedPrice = (priceUSD * (currencyRates[currency] || 1)).toFixed(2);

    const card = document.createElement("div");
    card.className = "p-4 bg-white shadow rounded";
    card.innerHTML = `
      <h3 class="font-bold text-lg">${metal.toUpperCase()}</h3>
      <p class="text-2xl">${convertedPrice} ${currency}</p>
    `;
    container.appendChild(card);
  }
}

// ====================
// Render 5-Year Chart
// ====================
function renderChart() {
  const currency = document.getElementById("currency").value;
  const traces = [];

  for (let metal of Object.keys(metalsData)) {
    if (metal === "rates") continue;
    const pricesUSD = metalsData[metal];
    const prices = pricesUSD.map(p => p * (currencyRates[currency] || 1));

    traces.push({
      y: prices,
      name: metal.toUpperCase(),
      type: 'scatter'
    });
  }

  Plotly.newPlot("priceChart", traces, {margin:{t:20}});
}

// ====================
// Portfolio Calculator
// ====================
function calcPortfolio() {
  const amt = parseFloat(document.getElementById("invest-amt").value);
  const metal = document.getElementById("invest-metal").value;
  const currency = document.getElementById("currency").value;
  if (!amt || !metal || !metalsData) return;

  const priceUSD = metalsData[metal].slice(-1)[0];
  const convertedPrice = priceUSD * (currencyRates[currency] || 1);
  const units = (amt / convertedPrice).toFixed(4);

  document.getElementById("portfolio-result").innerText = `You could buy ${units} units of ${metal.toUpperCase()} at current price (${convertedPrice.toFixed(2)} ${currency})`;
}

// ====================
// Render AI Summarized News
// ====================
async function renderNews(news) {
  const ul = document.getElementById("news-list");
  ul.innerHTML = "";

  for (let item of news) {
    let summary = item.summary || item.title;
    try {
      if (summarizer) {
        const result = await summarizer(item.title, { max_length: 25 });
        summary = result[0].summary_text;
      }
    } catch (e) {
      summary = item.title;
    }

    const li = document.createElement("li");
    li.className = "p-2 bg-white shadow rounded";
    li.innerHTML = `
      <a href="${item.link}" target="_blank" class="font-semibold text-blue-600 hover:underline">${item.title}</a>
      <p class="text-gray-600 text-sm mt-1">${summary}</p>
    `;
    ul.appendChild(li);
  }
}

// ====================
// Inject JSON-LD Structured Data for SEO
// ====================
function injectNewsJSONLD(news) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": news.map((item, index) => ({
      "@type": "NewsArticle",
      "position": index + 1,
      "headline": item.title,
      "url": item.link,
      "datePublished": new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": "Gold & Silver Dashboard"
      },
      "description": item.summary || item.title
    }))
  };

  // Remove existing JSON-LD if any
  const existing = document.getElementById("json-ld-news");
  if (existing) existing.remove();

  // Create new script tag
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "json-ld-news";
  script.text = JSON.stringify(structuredData, null, 2);
  document.head.appendChild(script);
}


// ====================
// Event Listeners
// ====================
document.getElementById("refresh").addEventListener("click", fe
