const currencySelect = document.getElementById("currency");
const refreshBtn = document.getElementById("refresh");

let metalsData = null;
let newsData = null;
let priceChart = null;

// Fetch metals.json and news.json
async function fetchData() {
  try {
    metalsData = await fetch('data/metals.json').then(res => res.json());
    newsData = await fetch('data/news.json').then(res => res.json());
    renderDashboard();
  } catch(e) {
    console.error("Failed to fetch data", e);
  }
}

// Render price cards + analytics
function renderDashboard() {
  const currency = currencySelect.value;
  const rate = metalsData.rates[currency] || 1;

  // Price Cards
  const cardsContainer = document.getElementById("price-cards");
  cardsContainer.innerHTML = "";

  ["gold", "silver"].forEach(metal => {
    const pricesUSD = metalsData[metal];
    const currentPrice = (pricesUSD[pricesUSD.length - 1] * rate).toFixed(2);
    const prevPrice = (pricesUSD[pricesUSD.length - 2] * rate).toFixed(2);
    const diff = (currentPrice - prevPrice).toFixed(2);
    const diffPercent = ((diff / prevPrice) * 100).toFixed(2);
    const trend = diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral";

    const card = document.createElement("div");
    card.className = `card`;

    card.innerHTML = `
      <h2>${metal.toUpperCase()}</h2>
      <p class="price ${trend}">${currentPrice} ${currency} <span class="change">${diffPercent}%</span></p>
      <canvas id="${metal}-sparkline" height="50"></canvas>
    `;

    cardsContainer.appendChild(card);

    // Sparkline
    new Chart(document.getElementById(`${metal}-sparkline`), {
      type: 'line',
      data: {
        labels: pricesUSD.map((_, i) => i+1),
        datasets: [{
          data: pricesUSD.map(p => (p*rate).toFixed(2)),
          borderColor: trend==="positive"?"#28a745":trend==="negative"?"#dc3545":"#6c757d",
          fill: false,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: { plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false}} }
    });
  });

  // AI Insights
  renderAIInsights();

  // Main Chart
  renderMainChart(currency);
}

// AI Insights
async function renderAIInsights() {
  const insightsList = document.getElementById("insights-list");
  insightsList.innerHTML = "";

  // Trend Prediction
  ["gold","silver"].forEach(metal=>{
    const prices = metalsData[metal];
    const trend = prices[prices.length-1] > prices[0] ? "upward ↑" : prices[prices.length-1] < prices[0] ? "downward ↓" : "stable →";
    const li = document.createElement("li");
    li.textContent = `${metal.toUpperCase()} trend in last ${prices.length} days: ${trend}`;
    insightsList.appendChild(li);
  });

  // Volatility Alerts
  ["gold","silver"].forEach(metal=>{
    const prices = metalsData[metal];
    const volatility = ((Math.max(...prices)-Math.min(...prices))/((Math.max(...prices)+Math.min(...prices))/2)*100).toFixed(2);
    if(volatility>2){
      const li = document.createElement("li");
      li.textContent = `⚠️ ${metal.toUpperCase()} is highly volatile: ${volatility}%`;
      insightsList.appendChild(li);
    }
  });

  // Correlation
  const goldPrices = metalsData.gold;
  const silverPrices = metalsData.silver;
  const corr = correlation(goldPrices, silverPrices).toFixed(2);
  const corrLi = document.createElement("li");
  corrLi.textContent = `Gold & Silver correlation: ${corr}`;
  insightsList.appendChild(corrLi);

  // News Sentiment
  if(window.sentimentPipeline && newsData){
    let pos=0, neg=0, neu=0;
    for(const headline of newsData){
      const result = await window.sentimentPipeline(headline);
      if(result[0].label==="POSITIVE") pos++;
      else if(result[0].label==="NEGATIVE") neg++;
      else neu++;
    }
    const sentimentLi = document.createElement("li");
    sentimentLi.textContent = `News sentiment: Positive ${pos}, Negative ${neg}, Neutral ${neu}`;
    insightsList.appendChild(sentimentLi);
  }

  // Display news headlines
  const newsList = document.getElementById("news-list");
  newsList.innerHTML="";
  newsData.forEach(h=>{ const li=document.createElement("li"); li.textContent=h; newsList.appendChild(li); });
}

// Main Chart
function renderMainChart(currency){
  const ctx = document.getElementById("priceChart").getContext("2d");
  if(priceChart) priceChart.destroy();

  const rate = metalsData.rates[currency] || 1;
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: metalsData.gold.map((_,i)=>`Day ${i+1}`),
      datasets: [
        {
          label: 'Gold',
          data: metalsData.gold.map(p=> (p*rate).toFixed(2)),
          borderColor: '#FFD700',
          fill: false,
          tension: 0.3
        },
        {
          label: 'Silver',
          data: metalsData.silver.map(p=> (p*rate).toFixed(2)),
          borderColor: '#C0C0C0',
          fill: false,
          tension: 0.3
        }
      ]
    },
    options: { responsive:true, plugins:{legend:{position:'top'}} }
  });
}

// Pearson correlation
function correlation(x, y){
  const n=x.length;
  const avgX=x.reduce((a,b)=>a+b,0)/n;
  const avgY=y.reduce((a,b)=>a+b,0)/n;
  const num = x.map((v,i)=> (v-avgX)*(y[i]-avgY)).reduce((a,b)=>a+b,0);
  const den = Math.sqrt(x.map(v=> (v-avgX)**2).reduce((a,b)=>a+b,0) * y.map(v=> (v-avgY)**2).reduce((a,b)=>a+b,0));
  return num/den;
}

// Events
currencySelect.addEventListener("change", renderDashboard);
refreshBtn.addEventListener("click", fetchData);

// Initial fetch
fetchData();
