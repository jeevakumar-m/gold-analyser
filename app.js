let chartInstance;

async function fetchJSON(path) {
  try {
    const res = await fetch(path + '?_cachebust=' + Date.now());
    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch', path, e);
    return null;
  }
}

function formatNumber(v, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(v);
}

async function loadData(selectedCurrency = 'USD') {
  const metals = await fetchJSON('data/metals.json');
  const news = await fetchJSON('data/news.json');

  if (!metals) {
    alert('No metals data found.');
    return;
  }

  // Latest values
  const gold = metals.gold[metals.gold.length - 1];
  const silver = metals.silver[metals.silver.length - 1];
  const rate = metals.rates[selectedCurrency] || 1;

  document.getElementById('gold-price').innerText = gold ? formatNumber(gold * rate, selectedCurrency) : '—';
  document.getElementById('silver-price').innerText = silver ? formatNumber(silver * rate, selectedCurrency) : '—';

  // News + sentiment
  const list = document.getElementById('news-list');
  list.innerHTML = '';
  if (news && Array.isArray(news)) {
    for (let headline of news.slice(0, 5)) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${headline}</strong><br/><em>Sentiment:</em> computing...`;
      list.appendChild(li);

      // Run sentiment locally
      if (window.sentimentPipeline) {
        window.sentimentPipeline(headline).then(result => {
          li.innerHTML = `<strong>${headline}</strong><br/><em>Sentiment:</em> ${result[0].label} (${(result[0].score*100).toFixed(1)}%)`;
        });
      }
    }
  }

  // Chart
  const ctx = document.getElementById('priceChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: metals.gold.length}, (_, i) => `Day ${i+1}`),
      datasets: [
        {
          label: `Gold (${selectedCurrency})`,
          data: metals.gold.map(v => v * rate),
          borderColor: 'gold',
          fill: false
        },
        {
          label: `Silver (${selectedCurrency})`,
          data: metals.silver.map(v => v * rate),
          borderColor: 'silver',
          fill: false
        }
      ]
    }
  });
}

document.getElementById('currency').addEventListener('change', (e) => {
  loadData(e.target.value);
});
document.getElementById('refresh').addEventListener('click', () => loadData(document.getElementById('currency').value));

loadData();
