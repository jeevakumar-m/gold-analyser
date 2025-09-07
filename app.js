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

// Render entire dashboard
function renderDashboard() {
  const currency = currencySelect.value;
  const rate = metalsData.rates[currency] || 1;

  renderPriceCards(rate);
  renderWeeklySummary(currency);
  renderAIInsights();
  highlightNews();
  renderMainChart(currency);
  renderTopInsights();
}

// ---------------- Price Cards ----------------
function renderPriceCards(rate){
  const cardsContainer = document.getElementById("price-cards");
  cardsContainer.innerHTML = "";

  ["gold","silver"].forEach(metal => {
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
}

// ---------------- Weekly Summary ----------------
function renderWeeklySummary(currency){
  const rate = metalsData.rates[currency] || 1;
  const weeklyContainer = document.getElementById("weekly-cards");
  weeklyContainer.innerHTML="";

  ["gold","silver"].forEach(metal=>{
    const prices = metalsData[metal].slice(-7);
    const avg = (prices.reduce((a,b)=>a+b,0)/prices.length*rate).toFixed(2);
    const max = (Math.max(...prices)*rate).toFixed(2);
    const min = (Math.min(...prices)*rate).toFixed(2);
    const pctChange = (((prices[prices.length-1]-prices[0])/prices[0])*100).toFixed(2);
    const trend = pctChange>0?"positive":pctChange<0?"negative":"neutral";

    const card = document.createElement("div");
    card.className="card";
    card.innerHTML=`
      <h3>${metal.toUpperCase()}</h3>
      <p>Avg: ${avg} ${currency}</p>
      <p>Max: ${max} ${currency}</p>
      <p>Min: ${min} ${currency}</p>
      <p class="${trend}">Change: ${pctChange}% ${trend==="positive"?"🚀":trend==="negative"?"📉":"→"}</p>
      <canvas id="${metal}-weekly-sparkline" height="50"></canvas>
    `;
    weeklyContainer.appendChild(card);

    new Chart(document.getElementById(`${metal}-weekly-sparkline`),{
      type:'line',
      data:{
        labels:prices.map((_,i)=>`Day ${i+1}`),
        datasets:[{
          data:prices.map(p=>(p*rate).toFixed(2)),
          borderColor: trend==="positive"?"#28a745":trend==="negative"?"#dc3545":"#6c757d",
          fill:false,
          tension:0.3,
          pointRadius:0
        }]
      },
      options:{plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}}
    });
  });
}

// ---------------- AI Insights ----------------
async function renderAIInsights() {
  const insightsList = document.getElementById("insights-list");
  insightsList.innerHTML = "";

  ["gold","silver"].forEach(metal=>{
    const prices = metalsData[metal];
    const trend = prices[prices.length-1] > prices[0] ? "upward ↑" : prices[prices.length-1] < prices[0] ? "downward ↓" : "stable →";
    const li = document.createElement("li");
    li.textContent = `${metal.toUpperCase()} trend last ${prices.length} days: ${trend}`;
    insightsList.appendChild(li);
  });

  ["gold","silver"].forEach(metal=>{
    const prices = metalsData[metal];
    const volatility = ((Math.max(...prices)-Math.min(...prices))/((Math.max(...prices)+Math.min(...prices))/2)*100).toFixed(2);
    if(volatility>2){
      const li = document.createElement("li");
      li.textContent = `⚠️ ${metal.toUpperCase()} highly volatile: ${volatility}%`;
      insightsList.appendChild(li);
    }
  });

  const corr = correlation(metalsData.gold, metalsData.silver).toFixed(2);
  const corrLi = document.createElement("li");
  corrLi.textContent = `Gold & Silver correlation: ${corr}`;
  insightsList.appendChild(corrLi);
}

// ---------------- Highlight News ----------------
async function highlightNews(){
  const newsList = document.getElementById("news-list");
  newsList.innerHTML="";
  if(!newsData || !window.sentimentPipeline) return;

  let mostPos=null, mostNeg=null, maxScore=-1, minScore=1;
  for(const headline of newsData){
    const result = await window.sentimentPipeline(headline);
    const score = result[0].score;
    const label = result[0].label;
    const li=document.createElement("li");
    li.textContent = headline;
    li.style.backgroundColor="#fff";

    if(label==="POSITIVE" && score>maxScore){ maxScore=score; mostPos=li; }
    if(label==="NEGATIVE" && score>minScore){ minScore=score; mostNeg=li; }

    newsList.appendChild(li);
  }
  if(mostPos) mostPos.style.backgroundColor="#d4edda";
  if(mostNeg) mostNeg.style.backgroundColor="#f8d7da";
}

// ---------------- Top AI Insights ----------------
function renderTopInsights(){
  const topList = document.getElementById("top-insights-list");
  topList.innerHTML="";
  ["Gold trend strong upward 🚀", "Silver volatility high ⚠️", "Gold & Silver correlation high"].forEach(item=>{
    const li = document.createElement("li");
    li.textContent=item;
    topList.appendChild(li);
  });
}

// ---------------- Main Chart ----------------
function renderMainChart(currency){
  const ctx = document.getElementById("priceChart").getContext("2d");
  if(priceChart) priceChart.destroy();

  const rate = metalsData.rates[currency] || 1;
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: metalsData.gold.map((_,i)=>`Day ${i+1}`),
      datasets: [
        { label: 'Gold', data: metalsData.gold.map(p=> (p*rate).toFixed(2)), borderColor: '#FFD700', fill:false, tension:0.3 },
        { label: 'Silver', data: metalsData.silver.map(p=> (p*rate).toFixed(2)), borderColor: '#C0C0C0', fill:false, tension:0.3 }
      ]
    },
    options: { responsive:true, plugins:{legend:{position:'top'}} }
  });
}

// ---------------- Utilities ----------------
function correlation(x, y){
  const n=x.length;
  const avgX=x.reduce((a,b)=>a+b,0)/n;
  const avgY=y.reduce((a,b)=>a+b,0)/n;
  const num = x.map((v,i)=> (v-avgX)*(y[i]-avgY)).reduce((a,b)=>a+b,0);
  const den = Math.sqrt(x.map(v=> (v-avgX)**2).reduce((a,b)=>a+b,0) * y.map(v=> (v-avgY)**2).reduce((a,b)=>a+b,0));
  return num/den;
}

// ---------------- Events ----------------
currencySelect.addEventListener("change", renderDashboard);
refreshBtn.addEventListener("click", fetchData);

// Initial fetch
fetchData();
