const currencySelect = document.getElementById("currency");
const refreshBtn = document.getElementById("refresh");
let metalsData = null;
let priceChart = null;

// Wait for DOM
window.onload = () => { fetchData(); };

// Fetch metals + news
async function fetchData() {
  try {
    metalsData = await fetch('data/metals.json').then(r=>r.json());
    metalsData.news = await fetch('data/news.json').then(r=>r.json());
    await fetchForexRates();
    renderDashboard();
  } catch(e){ console.error("Failed to fetch data:", e); }
}

// Forex rates
async function fetchForexRates(){
  try{
    const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=INR,EUR,GBP,JPY');
    const data = await res.json();
    metalsData.rates = { USD:1, ...data.rates };
  } catch(e){ console.error("Forex fetch failed:", e); }
}

// Convert USD to selected currency
function convert(priceUSD){
  const rate = metalsData.rates[currencySelect.value] || 1;
  return (priceUSD*rate).toFixed(2);
}

// Render full dashboard
function renderDashboard(){
  renderPriceCards();
  renderMainChart();
  renderAIInsights();
  renderNews();
}

// Price Cards
function renderPriceCards(){
  const container = document.getElementById("cards-container");
  container.innerHTML = "";

  ["gold","silver"].forEach(metal=>{
    const prices = metalsData[metal];
    const latest = convert(prices[prices.length-1]);
    const prev = convert(prices[prices.length-2]);
    const diff = (latest-prev).toFixed(2);
    const pct = ((diff/prev)*100).toFixed(2);
    const trend = diff>0?"positive":diff<0?"negative":"neutral";

    const card = document.createElement("div");
    card.className="card";
    card.innerHTML=`
      <h2>${metal.toUpperCase()}</h2>
      <p class="price ${trend}">${latest} ${currencySelect.value} <span class="change">${pct}%</span></p>
      <canvas id="${metal}-sparkline" height="50"></canvas>
    `;
    container.appendChild(card);

    new Chart(document.getElementById(`${metal}-sparkline`), {
      type:'line',
      data:{ labels:prices.map((_,i)=>i+1), datasets:[{ data:prices.map(p=>convert(p)), borderColor:trend==="positive"?"#28a745":trend==="negative"?"#dc3545":"#6c757d", fill:false, tension:0.2, pointRadius:0 }] },
      options:{ plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false}} }
    });
  });
}

// 5-Year Chart
function renderMainChart(){
  const labels = metalsData.gold.map((_,i)=>{
    const d = new Date();
    d.setFullYear(d.getFullYear()-5);
    d.setDate(d.getDate()+i);
    return d;
  });

  const ctx = document.getElementById("priceChart").getContext("2d");
  if(priceChart) priceChart.destroy();

  priceChart = new Chart(ctx,{
    type:'line',
    data:{
      labels: labels,
      datasets:[
        { label:'Gold', data:metalsData.gold.map(p=>convert(p)), borderColor:'#FFD700', fill:false, tension:0.2 },
        { label:'Silver', data:metalsData.silver.map(p=>convert(p)), borderColor:'#C0C0C0', fill:false, tension:0.2 }
      ]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{position:'top'},
        zoom:{ pan:{enabled:true,mode:'x'}, zoom:{wheel:{enabled:true}, pinch:{enabled:true}, drag:{enabled:false}, mode:'x'} }
      },
      scales:{ x:{type:'time', time:{unit:'month'}} }
    }
  });
}

// AI Insights
function renderAIInsights(){
  const list = document.getElementById("insights-list");
  list.innerHTML="";
  ["gold","silver"].forEach(metal=>{
    const prices = metalsData[metal];
    const trend = prices[prices.length-1]>prices[0]?"upward 🚀":prices[prices.length-1]<prices[0]?"downward 📉":"stable →";
    const pctChange = ((prices[prices.length-1]-prices[0])/prices[0]*100).toFixed(2);
    const li = document.createElement("li");
    li.textContent = `${metal.toUpperCase()} 5-year change: ${pctChange}% (${trend})`;
    list.appendChild(li);
  });

  const corr = correlation(metalsData.gold, metalsData.silver).toFixed(2);
  const li = document.createElement("li");
  li.textContent = `Gold & Silver correlation: ${corr}`;
  list.appendChild(li);
}

function correlation(x,y){
  const n=x.length;
  const avgX=x.reduce((a,b)=>a+b,0)/n;
  const avgY=y.reduce((a,b)=>a+b,0)/n;
  const num = x.map((v,i)=> (v-avgX)*(y[i]-avgY)).reduce((a,b)=>a+b,0);
  const den = Math.sqrt(x.map(v=> (v-avgX)**2).reduce((a,b)=>a+b,0) * y.map(v=> (v-avgY)**2).reduce((a,b)=>a+b,0));
  return num/den;
}

// News Section
function renderNews(){
  const newsContainer = document.getElementById("news-list");
  newsContainer.innerHTML="";
  if(!metalsData.news) return;
  metalsData.news.forEach(item=>{
    let sentiment="➡️";
    if(/rise|gain|bull/i.test(item.title)) sentiment="📈";
    if(/fall|drop|bear/i.test(item.title)) sentiment="📉";
    const li = document.createElement("li");
    li.innerHTML=`${sentiment} <a href="${item.link}" target="_blank">${item.title}</a>`;
    newsContainer.appendChild(li);
  });
}

// Events
currencySelect.addEventListener("change", renderDashboard);
refreshBtn.addEventListener("click", fetchData);
