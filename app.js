// ===== STATE =====
let currentStock = null, currentDetail = null, priceChart = null, radarChart = null;
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let searchTimeout = null;
let preferredCurrency = localStorage.getItem('preferredCurrency') || 'AUTO'; // AUTO | USD | INR
let compareChart = null; // for dual-line comparison chart
let voiceRecognition = null; // Web Speech API instance
let isListening = false;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadTickerTape();
  loadSuggestedStocks();
  loadQuickPicks();
  loadMarketsWidget();
  loadAlsoWatch();
  renderWatchlist();
  if (currentUser) updateUserUI(currentUser);
  initCurrencyToggle();
  initVoiceAssistant();
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-box-hero')) hide('heroSearchResults');
    if (!e.target.closest('.rs-search')) { const el = document.getElementById('sidebarSearchResults'); if(el) el.innerHTML = ''; }
  });
});

// ===== HELPERS =====
function $(id) { return document.getElementById(id); }
function show(id) { const el = $(id); if(el) el.style.display = ''; }
function hide(id) { const el = $(id); if(el) el.style.display = 'none'; }
function fmt(n) { if(!n && n!==0) return '-'; if(Math.abs(n)>=1e12) return (n/1e12).toFixed(1)+'T'; if(Math.abs(n)>=1e9) return (n/1e9).toFixed(1)+'B'; if(Math.abs(n)>=1e6) return (n/1e6).toFixed(1)+'M'; if(Math.abs(n)>=1e3) return (n/1e3).toFixed(1)+'K'; return n.toFixed?n.toFixed(2):n; }

// Currency-aware currency symbol + price conversion
function cs(stock) {
  if (!stock) return '$';
  if (preferredCurrency === 'USD') return '$';
  if (preferredCurrency === 'INR') return '₹';
  return stock.isIndian ? '₹' : '$'; // AUTO
}
function displayPrice(stock, rawPrice) {
  if (!stock) return rawPrice;
  const rate = stock.exchangeRate || 83.12;
  if (preferredCurrency === 'USD' && stock.isIndian) return +(rawPrice / rate).toFixed(2);
  if (preferredCurrency === 'INR' && !stock.isIndian) return +(rawPrice * rate).toFixed(2);
  return rawPrice;
}

function chgClass(v) { return v >= 0 ? 'clr-green' : 'clr-red'; }
function chgSign(v) { return v >= 0 ? '+' : ''; }
function showLoading() { $('loadingOverlay')?.classList.add('active'); }
function hideLoading() { $('loadingOverlay')?.classList.remove('active'); }

async function api(url, opts) {
  try {
    const r = await fetch(url, opts);
    const j = await r.json();
    if (!j.success) throw new Error(j.error || 'API error');
    return j.data;
  } catch(e) { console.error('API Error:', e); throw e; }
}

// ===== CURRENCY TOGGLE =====
function initCurrencyToggle() {
  // Inject currency toggle into top nav if not present
  if ($('currencyToggle')) return;
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;
  const div = document.createElement('div');
  div.id = 'currencyToggle';
  div.style.cssText = 'display:flex;align-items:center;gap:4px;background:#1a1a1a;border:1px solid #333;border-radius:20px;padding:3px 4px;margin-right:8px;';
  div.innerHTML = ['USD','INR','AUTO'].map(c =>
    `<button onclick="setCurrency('${c}')" id="curr-btn-${c}" style="padding:3px 10px;border-radius:16px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;background:${preferredCurrency===c?'#0078d4':'transparent'};color:${preferredCurrency===c?'#fff':'#888'};">${c}</button>`
  ).join('');
  navRight.insertBefore(div, navRight.firstChild);
}

function setCurrency(c) {
  preferredCurrency = c;
  localStorage.setItem('preferredCurrency', c);
  // Update toggle button styles
  ['USD','INR','AUTO'].forEach(btn => {
    const el = $('curr-btn-' + btn);
    if (!el) return;
    el.style.background = c === btn ? '#0078d4' : 'transparent';
    el.style.color = c === btn ? '#fff' : '#888';
  });
  // Re-render whichever view is currently active
  if (currentDetail) {
    renderStockHeader(currentDetail.stock);
    renderSummaryTab(currentDetail);
  }
  // Re-render comparison cards if comparison is visible
  const cmpSection = $('comparisonSection');
  if (cmpSection && cmpSection.style.display !== 'none') {
    const cards = document.querySelectorAll('.cmp-card');
    cards.forEach(card => {
      // Find the symbol from the card's sym element and re-price it
      const symEl = card.querySelector('.cmp-card-sym');
      const priceEl = card.querySelector('.cmp-card-price');
      const chgEl = card.querySelector('.clr-green, .clr-red');
      if (!symEl || !priceEl) return;
      const sym = symEl.textContent.split('·')[0].trim();
      // Re-fetch and re-render just the price display
      api('/api/stock/' + encodeURIComponent(sym) + '/detail').then(data => {
        const s = data.stock;
        const curr = cs(s);
        const p = displayPrice(s, s.price);
        priceEl.textContent = curr + p.toFixed(2);
        // Update stats grid values too
        const statStrongs = card.querySelectorAll('.cmp-stats-grid strong');
        const labels = card.querySelectorAll('.cmp-stat-label');
        labels.forEach((lbl, i) => {
          const strong = statStrongs[i];
          if (!strong) return;
          const key = lbl.textContent.trim();
          if (key === 'EPS') strong.textContent = curr + displayPrice(s, s.eps).toFixed(2);
          else if (key === '52W High') strong.textContent = curr + displayPrice(s, s.yearHigh).toFixed(2);
        });
      }).catch(() => {});
    });
  }
}

// ===== TICKER TAPE =====
async function loadTickerTape() {
  try {
    const data = await api('/api/market/overview');
    const scroll = $('tickerScroll');
    if(!scroll) return;
    const html = data.map(t => `<div class="ticker-item"><span class="t-sym">${t.symbol}</span><span class="t-price">${t.price.toFixed(2)}</span><span class="t-chg ${t.change>=0?'t-up':'t-down'}">${t.change>=0?'+':''}${t.change.toFixed(2)}%</span></div>`).join('');
    scroll.innerHTML = html + html;
  } catch(e) { console.error('Ticker error:', e); }
}

// ===== SEARCH =====
function onHeroSearch(q) {
  clearTimeout(searchTimeout);
  if(!q || q.length < 1) { $('heroSearchResults').classList.remove('show'); return; }
  searchTimeout = setTimeout(() => doSearch(q, 'heroSearchResults', true), 200);
}
function onSidebarSearch(q) {
  clearTimeout(searchTimeout);
  if(!q || q.length < 1) { $('sidebarSearchResults').innerHTML = ''; return; }
  searchTimeout = setTimeout(() => doSearch(q, 'sidebarSearchResults', false), 200);
}

async function doSearch(q, targetId, isDropdown) {
  try {
    const data = await api('/api/stocks?q=' + encodeURIComponent(q));
    const el = $(targetId);
    if(!data.length) { el.innerHTML = '<div style="padding:12px;color:var(--text2);font-size:13px">No results found</div>'; if(isDropdown) el.classList.add('show'); return; }
    el.innerHTML = data.slice(0, 8).map(s => `<div class="search-result-item" onclick="selectStock('${s.symbol}')"><span class="sr-icon">${s.icon||'📊'}</span><div class="sr-info"><div class="sr-name">${s.name}</div><div class="sr-detail">${s.symbol} · ${s.sector}</div></div></div>`).join('');
    if(isDropdown) el.classList.add('show');
  } catch(e) { console.error('Search error:', e); }
}

function selectFirstResult() {
  const item = document.querySelector('#heroSearchResults .search-result-item');
  if(item) item.click();
}

// ===== STOCK SELECTION =====
async function selectStock(symbol) {
  showLoading();
  $('heroSearchResults')?.classList.remove('show');
  $('sidebarSearchResults') && ($('sidebarSearchResults').innerHTML = '');
  $('heroSearch') && ($('heroSearch').value = '');
  $('sidebarSearch') && ($('sidebarSearch').value = '');
  // Hide comparison section when viewing individual stock
  const cs_el = $('comparisonSection');
  if (cs_el) cs_el.style.display = 'none';
  try {
    const data = await api('/api/stock/' + encodeURIComponent(symbol) + '/detail');
    currentStock = symbol;
    currentDetail = data;
    renderStockHeader(data.stock);
    show('stockHeaderBar');
    show('tabNav');
    $('panel-welcome')?.classList.remove('active');
    switchTab('summary');
    renderSummaryTab(data);
    renderFinancialsTab(data.financials, data.stock);
    renderAnalysisTab(data);
    renderEarningsTab(data.earnings, data.stock);
    renderCompanyTab(data.company, data.stock);
    loadChart('1D');
    loadAlsoWatch();
    document.querySelectorAll('.wl-stock-item').forEach(el => {
      el.classList.toggle('active', el.dataset.symbol === symbol);
    });
  } catch(e) { alert('Error loading stock: ' + e.message); }
  hideLoading();
}

function renderStockHeader(s) {
  $('shbExchange').textContent = s.isIndian ? 'NSE' : 'NASDAQ';
  $('shbName').textContent = s.name + ' (' + s.symbol.replace('.NS','') + ')';
  const p = displayPrice(s, s.price);
  $('shbPrice').textContent = cs(s) + p.toFixed(2);
  const ch = $('shbChange');
  ch.textContent = chgSign(s.change) + s.change.toFixed(2) + ' (' + chgSign(s.changePercent) + s.changePercent.toFixed(2) + '%)';
  ch.className = 'shb-change ' + chgClass(s.changePercent);
  ch.style.background = s.changePercent >= 0 ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)';
}

// ===== CHART =====
async function loadChart(range) {
  document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', b.dataset.range === range));
  try {
    const data = await api('/api/stock/' + encodeURIComponent(currentStock) + '/chart?range=' + range);
    const ctx = $('priceChart')?.getContext('2d');
    if(!ctx) return;
    if(priceChart) priceChart.destroy();
    const labels = data.map(d => { const dt = new Date(d.time); return range==='1D' ? dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : dt.toLocaleDateString([],{month:'short',day:'numeric'}); });
    const prices = data.map(d => displayPrice(currentDetail.stock, d.price));
    const isUp = prices[prices.length-1] >= prices[0];
    const color = isUp ? '#10b981' : '#ef4444';
    const curr = cs(currentDetail.stock);
    priceChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ data: prices, borderColor: color, borderWidth: 2, fill: true, backgroundColor: color + '15', pointRadius: 0, tension: 0.3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, callbacks: { label: c => curr + c.parsed.y.toFixed(2) } } }, scales: { x: { display: true, grid: { color: '#333' }, ticks: { color: '#999', maxTicksLimit: 6, font: { size: 10 } } }, y: { display: true, grid: { color: '#333' }, ticks: { color: '#999', font: { size: 10 }, callback: v => curr + v.toFixed(0) } } }, interaction: { mode: 'nearest', axis: 'x' } }
    });
  } catch(e) { console.error('Chart error:', e); }
}

function renderRadarChart(scores) {
  const ctx = $('radarChart')?.getContext('2d');
  if(!ctx) return;
  if(radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Valuation', 'Health', 'Earnings', 'Performance', 'Growth'],
      datasets: [{ data: [scores.valuation, scores.health, scores.earnings, scores.performance, scores.growth], backgroundColor: 'rgba(0,120,212,.2)', borderColor: '#0078d4', borderWidth: 2, pointBackgroundColor: '#0078d4', pointRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 6, ticks: { stepSize: 1, color: '#999', backdropColor: 'transparent', font: { size: 9 } }, grid: { color: '#333' }, angleLines: { color: '#333' }, pointLabels: { color: '#e4e4e4', font: { size: 11, weight: '600' } } } } }
  });
}

// ===== TAB SWITCHING =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panel = $('panel-' + tab);
  if(panel) panel.classList.add('active');
}

// ===== SUMMARY TAB =====
function renderSummaryTab(data) {
  const s = data.stock, ins = data.insights, an = data.analyst, earn = data.earnings, fin = data.financials, rec = data.recommendation;
  const c = cs(s);
  const dp = (v) => displayPrice(s, v).toFixed(2);
  const stats = [
    ['Open', c+dp(s.open)], ['Prev Close', c+dp(s.prevClose)],
    ['Day High', c+dp(s.dayHigh)], ['Day Low', c+dp(s.dayLow)],
    ['52W High', c+dp(s.yearHigh)], ['52W Low', c+dp(s.yearLow)],
    ['Volume', fmt(s.volume)], ['Avg Volume', fmt(s.avgVolume)],
    ['Market Cap', fmt(s.marketCap)], ['P/E Ratio', s.pe.toFixed(2)],
    ['EPS', c+dp(s.eps)], ['Beta', s.beta.toFixed(2)],
    ['Dividend', c+dp(s.dividend)], ['Div Yield', s.dividendYield.toFixed(2)+'%'],
    ['Shares Out', fmt(s.sharesOutstanding)], ['Sector', s.sector]
  ];
  $('keyStatsGrid').innerHTML = stats.map(([l,v]) => `<div class="key-stat"><span class="ks-label">${l}</span><span class="ks-value">${v}</span></div>`).join('');

  const peers = data.peers || [];
  $('peerCards').innerHTML = peers.length ? peers.map(p => `<div class="peer-card" onclick="selectStock('${p.symbol}')"><div class="pc-name">${p.icon||''} ${p.name}</div><div class="pc-price">${p.price.toFixed(2)}</div><div class="pc-change ${chgClass(p.changePercent)}">${chgSign(p.changePercent)}${p.changePercent.toFixed(2)}%</div></div>`).join('') : '<div style="color:var(--text2);font-size:13px">No peers found</div>';

  $('insightsList').innerHTML = ins.insights.map(i => `<div class="insight-item"><div class="insight-dot ${i.type}"></div><div class="insight-text">${i.text}</div><div class="insight-arrow">›</div></div>`).join('');
  renderRadarChart(ins.scores);

  $('analystCard').innerHTML = `<h4>📊 Analyst Rating</h4><div class="sc-big" style="color:${rec.color}">${rec.action}</div><div class="sc-sub">Confidence: ${rec.confidence}</div><div style="margin-top:8px">${rec.reasons.map(r=>'<div class="sc-row"><span class="sc-label">• '+r+'</span></div>').join('')}</div><div class="sc-row" style="margin-top:8px"><span class="sc-label">Target Price</span><span class="sc-value">${c}${dp(an.targetPrice)}</span></div><div class="sc-row"><span class="sc-label">Analysts</span><span class="sc-value">${an.numAnalysts}</span></div>`;

  const lastE = earn.history.filter(h=>h.reportedEPS!==null).pop();
  $('earningsPreviewCard').innerHTML = `<h4>📅 Earnings</h4><div class="sc-row"><span class="sc-label">Next Report</span><span class="sc-value">${earn.nextEarningsDate}</span></div><div class="sc-row"><span class="sc-label">Consensus EPS</span><span class="sc-value">${c}${earn.consensusEPS}</span></div>${lastE?`<div class="sc-row"><span class="sc-label">Last Surprise</span><span class="sc-value ${chgClass(lastE.surprise)}">${chgSign(lastE.surprise)}${lastE.surprise}%</span></div>`:''}`;

  const latestIncome = fin.income[fin.income.length - 1];
  $('financialsPreviewCard').innerHTML = `<h4>💰 Financials</h4><div class="sc-row"><span class="sc-label">Revenue</span><span class="sc-value">${fmt(latestIncome.revenue)}</span></div><div class="sc-row"><span class="sc-label">Net Income</span><span class="sc-value">${fmt(latestIncome.netIncome)}</span></div><div class="sc-row"><span class="sc-label">Gross Margin</span><span class="sc-value">${fin.ratios.grossMargin}%</span></div><div class="sc-row"><span class="sc-label">Net Margin</span><span class="sc-value">${fin.ratios.netMargin}%</span></div>`;

  $('tradingCard').innerHTML = `<h4>📈 Trading Info</h4><div class="sc-row"><span class="sc-label">Day Range</span><span class="sc-value">${c}${dp(s.dayLow)} - ${c}${dp(s.dayHigh)}</span></div><div class="sc-row"><span class="sc-label">52W Range</span><span class="sc-value">${c}${dp(s.yearLow)} - ${c}${dp(s.yearHigh)}</span></div><div class="sc-row"><span class="sc-label">Volume</span><span class="sc-value">${fmt(s.volume)}</span></div>`;

  $('profitabilityCard').innerHTML = `<h4>🏆 Profitability</h4><div class="sc-row"><span class="sc-label">ROE</span><span class="sc-value">${fin.ratios.roe}%</span></div><div class="sc-row"><span class="sc-label">ROA</span><span class="sc-value">${fin.ratios.roa}%</span></div><div class="sc-row"><span class="sc-label">ROIC</span><span class="sc-value">${fin.ratios.roic}%</span></div><div class="sc-row"><span class="sc-label">Op. Margin</span><span class="sc-value">${fin.ratios.operatingMargin}%</span></div>`;

  $('companyPreviewCard').innerHTML = `<h4>🏢 Company</h4><div class="sc-row"><span class="sc-label">Sector</span><span class="sc-value">${s.sector}</span></div><div class="sc-row"><span class="sc-label">Industry</span><span class="sc-value">${s.industry}</span></div><div class="sc-row"><span class="sc-label">Country</span><span class="sc-value">${s.country==='IN'?'India 🇮🇳':'USA 🇺🇸'}</span></div>`;
}

// ===== FINANCIALS TAB =====
function renderFinancialsTab(fin, stock) {
  if(!fin) return;
  const c = cs(stock);
  let h = `<div class="fin-section"><h3>💰 Income Statement</h3><table class="fin-table"><thead><tr><th>Year</th><th>Revenue</th><th>Net Income</th><th>Gross Profit</th><th>EBITDA</th></tr></thead><tbody>`;
  fin.income.forEach(y => { h += `<tr><td>${y.year}</td><td>${fmt(y.revenue)}</td><td>${fmt(y.netIncome)}</td><td>${fmt(y.grossProfit)}</td><td>${fmt(y.ebitda)}</td></tr>`; });
  h += `</tbody></table></div>`;
  h += `<div class="fin-grid"><div class="fin-card"><h3>📋 Balance Sheet</h3><div class="sc-row"><span class="sc-label">Total Assets</span><span class="sc-value">${fmt(fin.balance.totalAssets)}</span></div><div class="sc-row"><span class="sc-label">Total Liabilities</span><span class="sc-value">${fmt(fin.balance.totalLiabilities)}</span></div><div class="sc-row"><span class="sc-label">Total Equity</span><span class="sc-value">${fmt(fin.balance.totalEquity)}</span></div><div class="sc-row"><span class="sc-label">Cash</span><span class="sc-value">${fmt(fin.balance.cash)}</span></div><div class="sc-row"><span class="sc-label">Total Debt</span><span class="sc-value">${fmt(fin.balance.totalDebt)}</span></div><div class="sc-row"><span class="sc-label">Current Ratio</span><span class="sc-value">${fin.balance.currentRatio}</span></div><div class="sc-row"><span class="sc-label">Quick Ratio</span><span class="sc-value">${fin.balance.quickRatio}</span></div></div>`;
  h += `<div class="fin-card"><h3>📊 Key Ratios</h3><div class="sc-row"><span class="sc-label">Gross Margin</span><span class="sc-value">${fin.ratios.grossMargin}%</span></div><div class="sc-row"><span class="sc-label">Net Margin</span><span class="sc-value">${fin.ratios.netMargin}%</span></div><div class="sc-row"><span class="sc-label">ROE</span><span class="sc-value">${fin.ratios.roe}%</span></div><div class="sc-row"><span class="sc-label">ROA</span><span class="sc-value">${fin.ratios.roa}%</span></div><div class="sc-row"><span class="sc-label">Debt/Equity</span><span class="sc-value">${fin.ratios.debtToEquity}</span></div><div class="sc-row"><span class="sc-label">P/S</span><span class="sc-value">${fin.ratios.priceToSales}</span></div><div class="sc-row"><span class="sc-label">P/B</span><span class="sc-value">${fin.ratios.priceToBook}</span></div><div class="sc-row"><span class="sc-label">EV/EBITDA</span><span class="sc-value">${fin.ratios.evToEbitda}</span></div><div class="sc-row"><span class="sc-label">PEG</span><span class="sc-value">${fin.ratios.peg}</span></div></div></div>`;
  h += `<div class="fin-section"><h3>💎 Valuation</h3><div class="sc-row"><span class="sc-label">P/E Ratio</span><span class="sc-value">${fin.valuation.priceToEarnings}</span></div><div class="sc-row"><span class="sc-label">Industry Avg P/E</span><span class="sc-value">${fin.valuation.industryAvgPE}</span></div><div class="sc-row"><span class="sc-label">Peer Avg P/E</span><span class="sc-value">${fin.valuation.peerAvgPE}</span></div></div>`;
  $('financialsContent').innerHTML = h;
}

// ===== ANALYSIS TAB =====
function renderAnalysisTab(data) {
  const an = data.analyst, rec = data.recommendation, ins = data.insights, s = data.stock;
  const bd = an.breakdown;
  const total = bd.strongBuy + bd.buy + bd.hold + bd.sell + bd.strongSell || 1;
  let h = `<div class="fin-grid"><div class="fin-card"><h3>🎯 Analyst Recommendation</h3><div class="sc-big" style="color:${rec.color}">${rec.action}</div><div class="sc-sub">Based on ${an.numAnalysts} analysts · Confidence: ${rec.confidence}</div><div style="margin-top:12px"><div class="sc-row"><span class="sc-label">Target Price</span><span class="sc-value">${cs(s)}${an.targetPrice.toFixed(2)}</span></div><div class="sc-row"><span class="sc-label">Volatility</span><span class="sc-value">${an.priceVolatility}</span></div></div></div>`;
  h += `<div class="fin-card"><h3>📊 Rating Breakdown</h3>`;
  [['Strong Buy', bd.strongBuy, '#10b981'], ['Buy', bd.buy, '#34d399'], ['Hold', bd.hold, '#f59e0b'], ['Sell', bd.sell, '#f87171'], ['Strong Sell', bd.strongSell, '#ef4444']].forEach(([label, val, color]) => {
    h += `<div class="perf-bar"><span class="perf-label">${label}</span><div class="perf-track"><div class="perf-fill" style="width:${(val/total*100).toFixed(0)}%;background:${color}"></div></div><span class="perf-val">${val}</span></div>`;
  });
  h += `</div></div>`;
  h += `<div class="fin-section"><h3>🧠 AI Insights</h3>`;
  ins.insights.forEach(i => { h += `<div class="insight-item"><div class="insight-dot ${i.type}"></div><div class="insight-text">${i.text}</div></div>`; });
  h += `</div>`;
  h += `<div class="fin-section"><h3>📈 Scoring (out of 6)</h3><div class="fin-grid">`;
  Object.entries(ins.scores).forEach(([k,v]) => {
    const pct = (v/6*100).toFixed(0);
    const color = v >= 4 ? '#10b981' : v >= 3 ? '#f59e0b' : '#ef4444';
    h += `<div class="fin-card"><div class="sc-row"><span class="sc-label">${k.charAt(0).toUpperCase()+k.slice(1)}</span><span class="sc-value" style="color:${color}">${v}/6</span></div><div class="perf-track" style="margin-top:6px"><div class="perf-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
  });
  h += `</div></div>`;
  h += `<div class="fin-section"><h3>💡 Key Reasons</h3>${rec.reasons.map(r => '<div class="sc-row"><span class="sc-label">• ' + r + '</span></div>').join('')}</div>`;
  $('analysisContent').innerHTML = h;
}

// ===== EARNINGS TAB =====
function renderEarningsTab(earn, stock) {
  if(!earn) return;
  let h = `<div class="fin-grid"><div class="fin-card"><h3>📅 Next Earnings</h3><div class="sc-big">${earn.nextEarningsDate}</div><div class="sc-row" style="margin-top:8px"><span class="sc-label">Consensus EPS</span><span class="sc-value">${cs(stock)}${earn.consensusEPS}</span></div><div class="sc-row"><span class="sc-label">Consensus Revenue</span><span class="sc-value">${fmt(earn.consensusRevenue)}</span></div></div>`;
  h += `<div class="fin-card"><h3>📊 EPS Growth</h3><div class="sc-row"><span class="sc-label">vs Peers</span><span class="sc-value ${chgClass(earn.epsGrowthVsPeers)}">${chgSign(earn.epsGrowthVsPeers)}${earn.epsGrowthVsPeers}%</span></div><div class="sc-row"><span class="sc-label">Peer Avg</span><span class="sc-value">${chgSign(earn.peerAvgGrowth)}${earn.peerAvgGrowth}%</span></div></div></div>`;
  h += `<div class="fin-section"><h3>📋 Earnings History</h3><table class="fin-table"><thead><tr><th>Quarter</th><th>Forecast EPS</th><th>Reported EPS</th><th>Surprise %</th><th>Last Year EPS</th></tr></thead><tbody>`;
  earn.history.forEach(q => {
    const surp = q.surprise !== null ? `<span class="${chgClass(q.surprise)}">${chgSign(q.surprise)}${q.surprise}%</span>` : '<span style="color:var(--text2)">Pending</span>';
    h += `<tr><td>${q.quarter}</td><td>${cs(stock)}${q.forecastEPS}</td><td>${q.reportedEPS !== null ? cs(stock)+q.reportedEPS : '—'}</td><td>${surp}</td><td>${cs(stock)}${q.lastYearEPS}</td></tr>`;
  });
  h += `</tbody></table></div>`;
  h += `<div class="fin-section"><h3>📈 Performance Since Earnings</h3>`;
  const perf = earn.performance;
  [['5 Day', perf.fiveDay], ['1 Month', perf.oneMonth], ['Since Last', perf.sinceLast], ['6 Month', perf.sixMonth], ['1 Year', perf.oneYear]].forEach(([label, val]) => {
    const color = val >= 0 ? '#10b981' : '#ef4444';
    h += `<div class="perf-bar"><span class="perf-label">${label}</span><div class="perf-track"><div class="perf-fill" style="width:${Math.min(Math.abs(val)*2, 100)}%;background:${color}"></div></div><span class="perf-val ${chgClass(val)}">${chgSign(val)}${val}%</span></div>`;
  });
  h += `</div>`;
  $('earningsContent').innerHTML = h;
}

// ===== COMPANY TAB =====
function renderCompanyTab(company, stock) {
  if(!company) return;
  let h = `<div class="fin-section"><h3>🏢 About ${stock.name}</h3><p style="font-size:14px;line-height:1.7;color:var(--text2)">${company.description}</p></div>`;
  h += `<div class="fin-grid"><div class="fin-card"><h3>📋 Company Details</h3><div class="sc-row"><span class="sc-label">Sector</span><span class="sc-value">${company.sector}</span></div><div class="sc-row"><span class="sc-label">Industry</span><span class="sc-value">${company.industry}</span></div><div class="sc-row"><span class="sc-label">Founded</span><span class="sc-value">${company.founded}</span></div><div class="sc-row"><span class="sc-label">Employees</span><span class="sc-value">${fmt(company.employees)}</span></div><div class="sc-row"><span class="sc-label">HQ</span><span class="sc-value">${company.headquarters}</span></div><div class="sc-row"><span class="sc-label">Website</span><span class="sc-value"><a href="${company.website}" target="_blank">${company.website}</a></span></div></div>`;
  h += `<div class="fin-card"><h3>👥 Key Executives</h3>${company.executives.map(e => `<div class="exec-item"><div class="exec-name">${e.name}</div><div class="exec-title">${e.title}</div></div>`).join('')}</div></div>`;
  $('companyContent').innerHTML = h;
}

// ===== WATCHLIST =====
function toggleWatchlistManage() {
  const existing = document.getElementById('wlManageModal');
  if (existing) { existing.remove(); return; }
  if (!watchlist.length) { alert('Your watchlist is empty.'); return; }
  const modal = document.createElement('div');
  modal.id = 'wlManageModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="position:absolute;inset:0;background:rgba(0,0,0,.6);" onclick="document.getElementById('wlManageModal').remove()"></div>
    <div style="position:relative;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;width:360px;max-width:95vw;z-index:1;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:16px;">⚙️ Manage Watchlist</h3>
        <button onclick="document.getElementById('wlManageModal').remove()" style="background:none;border:none;color:var(--text1);font-size:20px;cursor:pointer;line-height:1;">×</button>
      </div>
      <p style="font-size:12px;color:var(--text2);margin:0 0 12px;">Drag to reorder • Click 🗑 to remove</p>
      <ul id="wlManageList" style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto;"></ul>
      <button onclick="saveWatchlistOrder()" style="margin-top:16px;width:100%;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">Save Order</button>
    </div>`;
  document.body.appendChild(modal);
  const list = document.getElementById('wlManageList');
  watchlist.forEach((sym, i) => {
    const li = document.createElement('li');
    li.draggable = true; li.dataset.index = i;
    li.style.cssText = 'display:flex;align-items:center;gap:10px;background:var(--surface2,#1e1e1e);border:1px solid var(--border);border-radius:8px;padding:10px 12px;cursor:grab;user-select:none;';
    li.innerHTML = `<span style="color:var(--text2);font-size:16px;">☰</span><span style="flex:1;font-size:14px;font-weight:500;">${sym}</span><button onclick="removeFromWatchlist('${sym}')" style="background:none;border:none;cursor:pointer;font-size:16px;line-height:1;padding:0;">🗑</button>`;
    li.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', i); li.style.opacity = '0.4'; });
    li.addEventListener('dragend', () => { li.style.opacity = '1'; });
    li.addEventListener('dragover', e => { e.preventDefault(); li.style.background = 'var(--accent-dim,#1a3a5c)'; });
    li.addEventListener('dragleave', () => { li.style.background = 'var(--surface2,#1e1e1e)'; });
    li.addEventListener('drop', e => {
      e.preventDefault(); li.style.background = 'var(--surface2,#1e1e1e)';
      const from = parseInt(e.dataTransfer.getData('text/plain')), to = parseInt(li.dataset.index);
      if (from === to) return;
      const moved = watchlist.splice(from, 1)[0]; watchlist.splice(to, 0, moved);
      toggleWatchlistManage(); toggleWatchlistManage();
    });
    list.appendChild(li);
  });
}

function removeFromWatchlist(sym) {
  watchlist = watchlist.filter(s => s !== sym);
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderWatchlist();
  const modal = document.getElementById('wlManageModal');
  if (modal) { modal.remove(); if (watchlist.length) { toggleWatchlistManage(); } }
}

function saveWatchlistOrder() {
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderWatchlist();
  document.getElementById('wlManageModal')?.remove();
}

function toggleCurrentWatchlist() {
  if(!currentStock) return;
  const idx = watchlist.indexOf(currentStock);
  if(idx > -1) watchlist.splice(idx, 1); else watchlist.push(currentStock);
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderWatchlist();
  if(currentStock) selectStock(currentStock);
}

async function renderWatchlist() {
  const wlCTA = document.getElementById('wlCTA');
  let wlSection = document.getElementById('watchlistStocksSection');
  if (!wlSection) {
    wlSection = document.createElement('div');
    wlSection.id = 'watchlistStocksSection'; wlSection.className = 'wl-section';
    wlSection.innerHTML = '<h4 class="wl-section-title">My Watchlist</h4><div class="wl-stock-list" id="watchlistStocks"></div>';
    const suggestedSection = document.querySelector('.wl-section');
    suggestedSection?.parentNode.insertBefore(wlSection, suggestedSection);
  }
  const container = document.getElementById('watchlistStocks');
  if (!watchlist.length) { if (wlCTA) wlCTA.style.display = 'block'; wlSection.style.display = 'none'; return; }
  if (wlCTA) wlCTA.style.display = 'none';
  wlSection.style.display = 'block';
  container.innerHTML = watchlist.map(sym => `<div class="wl-stock-item" data-symbol="${sym}" onclick="selectStock('${sym}')"><div class="wl-stock-icon">📌</div><div class="wl-stock-info"><div class="wl-stock-name">${sym}</div><div class="wl-stock-sym" id="wl-price-${sym}">Loading…</div></div><button onclick="event.stopPropagation();removeFromWatchlist('${sym}')" style="background:none;border:none;color:var(--text2);cursor:pointer;font-size:14px;padding:4px;margin-left:auto;">✕</button></div>`).join('');
  watchlist.forEach(async sym => {
    try {
      const detail = await api('/api/stock/' + encodeURIComponent(sym) + '/detail');
      const s = detail.stock;
      const priceEl = document.getElementById('wl-price-' + sym);
      if (!priceEl) return;
      const sign = s.changePercent >= 0 ? '+' : '';
      priceEl.innerHTML = `<span>${cs(s)}${displayPrice(s,s.price).toFixed(2)}</span> <span class="${chgClass(s.changePercent)}" style="font-size:11px;">${sign}${s.changePercent.toFixed(2)}%</span>`;
      const iconEl = priceEl.closest('.wl-stock-item')?.querySelector('.wl-stock-icon');
      if (iconEl && s.icon) iconEl.textContent = s.icon;
      const nameEl = priceEl.closest('.wl-stock-item')?.querySelector('.wl-stock-name');
      if (nameEl) nameEl.textContent = s.name;
    } catch(e) { const p = document.getElementById('wl-price-'+sym); if(p) p.textContent='N/A'; }
  });
}

// ===== WIDGETS =====
async function loadSuggestedStocks() {
  try {
    const data = await api('/api/stocks');
    const stocks = data.sort(() => 0.5 - Math.random()).slice(0, 5);
    const el = document.getElementById('suggestedStocks');
    if(!el) return;
    el.innerHTML = stocks.map(s => `<div class="wl-stock-item" data-symbol="${s.symbol}" onclick="selectStock('${s.symbol}')"><div class="wl-stock-icon">${s.icon||'📊'}</div><div class="wl-stock-info"><div class="wl-stock-name">${s.name}</div><div class="wl-stock-sym">${s.symbol}</div></div></div>`).join('');
  } catch(e) { console.error('Suggested error:', e); }
}

async function loadQuickPicks() {
  try {
    const data = await api('/api/stocks');
    const stocks = data.filter(s => ['AAPL','MSFT','RELIANCE.NS','TCS.NS','NVDA','TSLA'].includes(s.symbol));
    const el = document.getElementById('quickPicksGrid');
    if(!el) return;
    el.innerHTML = stocks.slice(0,6).map(s => `<div class="quick-pick" onclick="selectStock('${s.symbol}')"><div class="qp-icon">${s.icon||'📊'}</div><div class="qp-info"><div class="qp-name">${s.name}</div><div class="qp-sym">${s.symbol}</div></div><div class="qp-price"><div class="qp-val">Details ➔</div></div></div>`).join('');
  } catch(e) { console.error('Quick picks error:', e); }
}

async function loadMarketsWidget() {
  try {
    const data = await api('/api/market/overview');
    const el = document.getElementById('marketsList');
    if(!el) return;
    el.innerHTML = data.slice(0, 5).map(m => `<div class="widget-item"><div class="wi-name">${m.name}</div><div class="wi-price">${m.price.toFixed(2)}</div><div class="wi-change ${chgClass(m.change)}">${chgSign(m.change)}${m.change.toFixed(2)}%</div></div>`).join('');
  } catch(e) { console.error('Markets widget error:', e); }
}

async function loadAlsoWatch() {
  if(!currentStock) return;
  try {
    const peers = await api('/api/stock/' + encodeURIComponent(currentStock) + '/peers');
    const el = document.getElementById('alsoWatchList');
    if(!el) return;
    el.innerHTML = peers.slice(0, 4).map(p => `<div class="widget-item" onclick="selectStock('${p.symbol}')"><div class="wi-name">${p.name}</div><div class="wi-price">${p.price.toFixed(2)}</div><div class="wi-change ${chgClass(p.changePercent)}">${chgSign(p.changePercent)}${p.changePercent.toFixed(2)}%</div></div>`).join('');
  } catch(e) { console.error('Also watch error:', e); }
}

// ===== MODALS =====
function showCompareModal() { document.getElementById('compareModal').classList.add('active'); }
function closeCompareModal() { document.getElementById('compareModal').classList.remove('active'); }
function showPresetModal() { document.getElementById('presetModal').classList.add('active'); }
function closePresetModal() { document.getElementById('presetModal').classList.remove('active'); }

// ===== COMPARE STOCKS — full page view =====
async function compareStocks() {
  const s1raw = document.getElementById('stock1Input').value.trim().toUpperCase();
  const s2raw = document.getElementById('stock2Input').value.trim().toUpperCase();
  // Resolve natural-language names from input fields too
  const s1 = resolveNaturalSymbol(s1raw) || s1raw;
  const s2 = resolveNaturalSymbol(s2raw) || s2raw;
  if(!s1 || !s2) { alert('Please enter two stock symbols'); return; }

  showLoading();
  try {
    const res = await api('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock1: s1, stock2: s2 })
    });
    closeCompareModal();
    closePresetModal();

    const stocks = [res.stock1, res.stock2].filter(Boolean);
    if (!stocks.length) { alert('No stock data returned'); hideLoading(); return; }
    const an = res.analysis || {};

    // --- Switch main content area to show comparison as a full page ---
    // Hide stock tabs, show welcome panel (blank base) then overlay comparison
    $('panel-welcome')?.classList.remove('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    hide('stockHeaderBar'); hide('tabNav');

    const section = document.getElementById('comparisonSection');
    section.style.display = 'block';
    // Scroll main content to top
    document.getElementById('mainContent')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const [d1, d2] = stocks;
    const c1 = d1.isIndian ? '₹' : '$';
    const c2 = d2.isIndian ? '₹' : '$';
    const winnerSym = an.performance?.winner;

    // --- 1. STOCK CARDS ---
    document.getElementById('stockCardsContainer').innerHTML = `
      <div class="cmp-cards-wrap">
        ${stocks.map(s => {
          const curr = s.isIndian ? '₹' : '$';
          const chgCls = (s.changePercent||0) >= 0 ? 'clr-green' : 'clr-red';
          const sign = (s.changePercent||0) >= 0 ? '+' : '';
          const isWinner = winnerSym === s.symbol;
          return `<div class="cmp-card${isWinner?' cmp-card--winner':''}">
            ${isWinner?'<div class="cmp-winner-badge">🏆 RECOMMENDED</div>':''}
            <div class="cmp-card-icon">${s.icon||'📊'}</div>
            <div class="cmp-card-name">${s.name||s.symbol}</div>
            <div class="cmp-card-sym">${s.symbol} · ${s.sector||''}</div>
            <div class="cmp-card-price">${curr}${(s.price||0).toFixed(2)}</div>
            <div class="${chgCls}" style="font-size:13px;margin-bottom:12px;">${sign}${(s.changePercent||0).toFixed(2)}%</div>
            <div class="cmp-stats-grid">
              <div><span class="cmp-stat-label">P/E</span><strong>${(s.pe||0).toFixed(1)}</strong></div>
              <div><span class="cmp-stat-label">EPS</span><strong>${curr}${(s.eps||0).toFixed(2)}</strong></div>
              <div><span class="cmp-stat-label">Mkt Cap</span><strong>${fmt(s.marketCap)}</strong></div>
              <div><span class="cmp-stat-label">Beta</span><strong>${(s.beta||0).toFixed(2)}</strong></div>
              <div><span class="cmp-stat-label">Div Yield</span><strong>${(s.dividendYield||0).toFixed(2)}%</strong></div>
              <div><span class="cmp-stat-label">52W High</span><strong>${curr}${(s.yearHigh||0).toFixed(2)}</strong></div>
            </div>
          </div>`;
        }).join('<div class="cmp-vs">VS</div>')}
      </div>`;

    // --- 2. DUAL-LINE CHART ---
    document.getElementById('comparisonDetails').innerHTML = `
      <div class="section-card" style="margin-bottom:16px;">
        <h3>📈 Price Comparison Chart</h3>
        <div style="display:flex;gap:16px;align-items:center;margin:8px 0 12px;font-size:13px;">
          <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:24px;height:3px;background:#0078d4;border-radius:2px;"></span>${d1.name||d1.symbol}</span>
          <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:24px;height:3px;background:#f59e0b;border-radius:2px;"></span>${d2.name||d2.symbol}</span>
          <div style="margin-left:auto;display:flex;gap:4px;" id="cmpRangeBtns">
            ${['1D','1M','1Y'].map(r=>`<button onclick="loadCompareChart('${s1}','${s2}','${r}')" data-cmp-range="${r}" style="padding:3px 10px;border-radius:12px;border:1px solid #333;background:${r==='1D'?'#0078d4':'transparent'};color:${r==='1D'?'#fff':'#888'};font-size:11px;cursor:pointer;">${r}</button>`).join('')}
          </div>
        </div>
        <div style="height:200px;position:relative;"><canvas id="compareChartCanvas"></canvas></div>
      </div>
      <div class="section-card" style="margin-bottom:16px;" id="cmpHeadToHead">
        <h3>📋 Head-to-Head</h3>
        <table class="fin-table" style="margin-top:12px;">
          <thead><tr><th>Metric</th><th>${d1.symbol}</th><th>${d2.symbol}</th><th>Winner</th></tr></thead>
          <tbody>
            ${buildCmpRow('P/E Ratio', (d1.pe||0).toFixed(1), (d2.pe||0).toFixed(1), d1.pe < d2.pe ? d1.symbol : d2.symbol, 'lower')}
            ${buildCmpRow('Market Cap', fmt(d1.marketCap), fmt(d2.marketCap), (d1.marketCap||0) > (d2.marketCap||0) ? d1.symbol : d2.symbol, 'higher')}
            ${buildCmpRow('Beta', (d1.beta||0).toFixed(2), (d2.beta||0).toFixed(2), (d1.beta||0) < (d2.beta||0) ? d1.symbol : d2.symbol, 'lower')}
            ${buildCmpRow('Div Yield', (d1.dividendYield||0).toFixed(2)+'%', (d2.dividendYield||0).toFixed(2)+'%', (d1.dividendYield||0) > (d2.dividendYield||0) ? d1.symbol : d2.symbol, 'higher')}
            ${buildCmpRow('Today %', chgSign(d1.changePercent||0)+(d1.changePercent||0).toFixed(2)+'%', chgSign(d2.changePercent||0)+(d2.changePercent||0).toFixed(2)+'%', (d1.changePercent||0) > (d2.changePercent||0) ? d1.symbol : d2.symbol, 'higher')}
          </tbody>
        </table>
      </div>`;

    // Load the chart immediately
    loadCompareChart(s1, s2, '1D');

    // --- 3. FINANCIALS SIDE-BY-SIDE ---
    // Fetch full details for both to get financials + insights
    const [det1, det2] = await Promise.all([
      api('/api/stock/' + encodeURIComponent(s1) + '/detail'),
      api('/api/stock/' + encodeURIComponent(s2) + '/detail')
    ]);

    const f1 = det1.financials, f2 = det2.financials;
    const ins1 = det1.insights, ins2 = det2.insights;
    const rec1 = det1.recommendation, rec2 = det2.recommendation;

    let analysisHTML = `
      <div class="section-card" style="margin-bottom:16px;">
        <h3>💰 Financials Comparison</h3>
        <table class="fin-table" style="margin-top:12px;">
          <thead><tr><th>Metric</th><th>${d1.symbol}</th><th>${d2.symbol}</th></tr></thead>
          <tbody>
            ${buildFinRow('Revenue (Latest)', fmt(f1?.income?.slice(-1)[0]?.revenue), fmt(f2?.income?.slice(-1)[0]?.revenue))}
            ${buildFinRow('Net Income', fmt(f1?.income?.slice(-1)[0]?.netIncome), fmt(f2?.income?.slice(-1)[0]?.netIncome))}
            ${buildFinRow('Gross Margin', (f1?.ratios?.grossMargin||'-')+'%', (f2?.ratios?.grossMargin||'-')+'%')}
            ${buildFinRow('Net Margin', (f1?.ratios?.netMargin||'-')+'%', (f2?.ratios?.netMargin||'-')+'%')}
            ${buildFinRow('ROE', (f1?.ratios?.roe||'-')+'%', (f2?.ratios?.roe||'-')+'%')}
            ${buildFinRow('ROA', (f1?.ratios?.roa||'-')+'%', (f2?.ratios?.roa||'-')+'%')}
            ${buildFinRow('Op. Margin', (f1?.ratios?.operatingMargin||'-')+'%', (f2?.ratios?.operatingMargin||'-')+'%')}
            ${buildFinRow('Debt/Equity', f1?.ratios?.debtToEquity||'-', f2?.ratios?.debtToEquity||'-')}
            ${buildFinRow('P/B', f1?.ratios?.priceToBook||'-', f2?.ratios?.priceToBook||'-')}
            ${buildFinRow('EV/EBITDA', f1?.ratios?.evToEbitda||'-', f2?.ratios?.evToEbitda||'-')}
          </tbody>
        </table>
      </div>
      <div class="section-card" style="margin-bottom:16px;">
        <h3>🧠 AI Insights</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
          <div>
            <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--accent,#0078d4);">${d1.name||d1.symbol}</div>
            <div style="font-size:12px;font-weight:700;padding:4px 10px;border-radius:12px;display:inline-block;background:${rec1.color}22;color:${rec1.color};margin-bottom:8px;">${rec1.action} · ${rec1.confidence}</div>
            ${ins1.insights.slice(0,4).map(i=>`<div class="insight-item" style="padding:6px 0;"><div class="insight-dot ${i.type}"></div><div class="insight-text" style="font-size:12px;">${i.text}</div></div>`).join('')}
          </div>
          <div>
            <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#f59e0b;">${d2.name||d2.symbol}</div>
            <div style="font-size:12px;font-weight:700;padding:4px 10px;border-radius:12px;display:inline-block;background:${rec2.color}22;color:${rec2.color};margin-bottom:8px;">${rec2.action} · ${rec2.confidence}</div>
            ${ins2.insights.slice(0,4).map(i=>`<div class="insight-item" style="padding:6px 0;"><div class="insight-dot ${i.type}"></div><div class="insight-text" style="font-size:12px;">${i.text}</div></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="section-card" style="margin-bottom:16px;">
        <h3>🏆 Profitability Scores</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px;">
          ${['valuation','health','earnings','performance','growth'].map(k => {
            const v1 = ins1.scores[k]||0, v2 = ins2.scores[k]||0;
            const col1 = v1>=4?'#10b981':v1>=3?'#f59e0b':'#ef4444';
            const col2 = v2>=4?'#10b981':v2>=3?'#f59e0b':'#ef4444';
            return `<div style="grid-column:1/-1;">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                <span style="font-weight:600;text-transform:capitalize;">${k}</span>
                <span><span style="color:${col1};">${v1}/6</span> vs <span style="color:${col2};">${v2}/6</span></span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
                <div class="perf-track"><div class="perf-fill" style="width:${v1/6*100}%;background:${col1};"></div></div>
                <div class="perf-track"><div class="perf-fill" style="width:${v2/6*100}%;background:${col2};"></div></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="section-card">
        <h3>📝 AI Summary</h3>
        <p style="line-height:1.7;color:var(--text2);font-size:14px;margin:12px 0;">${an.summary||'Comparison complete.'}</p>
        <button onclick="document.getElementById('comparisonSection').style.display='none';document.getElementById('panel-welcome').classList.add('active')" style="margin-top:8px;padding:8px 16px;background:none;border:1px solid var(--border);border-radius:8px;color:var(--text2);cursor:pointer;font-size:13px;">✕ Close Comparison</button>
      </div>`;

    document.getElementById('comparisonAnalysis').innerHTML = analysisHTML;

  } catch(e) {
    alert('Error comparing stocks: ' + e.message);
    console.error(e);
  }
  hideLoading();
}

function buildCmpRow(metric, v1, v2, winner, dir) {
  const w1 = winner === (currentDetail?.stock?.symbol||'') ? '✓' : '';
  return `<tr><td style="font-weight:600;">${metric}</td><td>${v1}</td><td>${v2}</td><td style="color:#10b981;font-weight:600;">${winner}</td></tr>`;
}
function buildFinRow(metric, v1, v2) {
  return `<tr><td style="font-weight:600;">${metric}</td><td>${v1}</td><td>${v2}</td></tr>`;
}

async function loadCompareChart(sym1, sym2, range) {
  // Update button styles
  document.querySelectorAll('[data-cmp-range]').forEach(b => {
    const active = b.dataset.cmpRange === range;
    b.style.background = active ? '#0078d4' : 'transparent';
    b.style.color = active ? '#fff' : '#888';
  });
  try {
    const [data1, data2] = await Promise.all([
      api('/api/stock/' + encodeURIComponent(sym1) + '/chart?range=' + range),
      api('/api/stock/' + encodeURIComponent(sym2) + '/chart?range=' + range)
    ]);
    const ctx = document.getElementById('compareChartCanvas')?.getContext('2d');
    if (!ctx) return;
    if (compareChart) compareChart.destroy();
    // Normalise both to % change from first point for fair comparison
    const norm = arr => { const base = arr[0]?.price || 1; return arr.map(d => +((d.price/base - 1)*100).toFixed(3)); };
    const labels = data1.map(d => { const dt = new Date(d.time); return range==='1D' ? dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : dt.toLocaleDateString([],{month:'short',day:'numeric'}); });
    const minLen = Math.min(data1.length, data2.length);
    compareChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.slice(0, minLen),
        datasets: [
          { label: sym1, data: norm(data1).slice(0, minLen), borderColor: '#0078d4', borderWidth: 2, fill: false, pointRadius: 0, tension: 0.3 },
          { label: sym2, data: norm(data2).slice(0, minLen), borderColor: '#f59e0b', borderWidth: 2, fill: false, pointRadius: 0, tension: 0.3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y >= 0?'+':''}${c.parsed.y.toFixed(2)}%` } } },
        scales: {
          x: { display: true, grid: { color: '#333' }, ticks: { color: '#999', maxTicksLimit: 6, font: { size: 10 } } },
          y: { display: true, grid: { color: '#333' }, ticks: { color: '#999', font: { size: 10 }, callback: v => v.toFixed(1)+'%' } }
        }
      }
    });
  } catch(e) { console.error('Compare chart error:', e); }
}

function comparePreset(s1, s2) {
  document.getElementById('stock1Input').value = s1;
  document.getElementById('stock2Input').value = s2;
  closePresetModal();
  compareStocks();
}

// ===== VOICE ASSISTANT =====
function initVoiceAssistant() {
  // Upgrade chatbot window UI with voice button
  const chatHeader = document.querySelector('.chat-header');
  if (chatHeader && !document.getElementById('voiceBtn')) {
    const btn = document.createElement('button');
    btn.id = 'voiceBtn';
    btn.title = 'Voice Input';
    btn.innerHTML = '🎤';
    btn.style.cssText = 'background:none;border:none;font-size:18px;cursor:pointer;padding:0 4px;transition:transform .2s;';
    btn.onclick = toggleVoice;
    chatHeader.insertBefore(btn, chatHeader.querySelector('button'));
  }
  // Inject voice status indicator
  const chatInputArea = document.querySelector('.chat-input-area');
  if (chatInputArea && !document.getElementById('voiceStatus')) {
    const status = document.createElement('div');
    status.id = 'voiceStatus';
    status.style.cssText = 'display:none;padding:6px 12px;font-size:12px;color:#0078d4;text-align:center;background:#0078d416;border-radius:8px;margin:4px 8px;';
    status.textContent = '🎤 Listening… speak now';
    chatInputArea.parentNode.insertBefore(status, chatInputArea);
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return; // graceful fallback

  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = true;
  voiceRecognition.lang = 'en-IN'; // Indian English default

  voiceRecognition.onstart = () => {
    isListening = true;
    const btn = $('voiceBtn'); if(btn) { btn.innerHTML = '🔴'; btn.style.transform = 'scale(1.2)'; }
    const st = $('voiceStatus'); if(st) st.style.display = 'block';
  };
  voiceRecognition.onend = () => {
    isListening = false;
    const btn = $('voiceBtn'); if(btn) { btn.innerHTML = '🎤'; btn.style.transform = 'scale(1)'; }
    const st = $('voiceStatus'); if(st) st.style.display = 'none';
  };
  voiceRecognition.onerror = (e) => {
    isListening = false;
    const btn = $('voiceBtn'); if(btn) { btn.innerHTML = '🎤'; btn.style.transform='scale(1)'; }
    const st = $('voiceStatus'); if(st) st.style.display = 'none';
    if (e.error !== 'no-speech') {
      const msgs = $('chatMessages');
      if(msgs) msgs.innerHTML += `<div class="chat-msg bot" style="color:#888;font-size:12px;">🎤 Voice error: ${e.error}. Try typing instead.</div>`;
    }
  };
  voiceRecognition.onresult = (event) => {
    let interim = '', final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t; else interim += t;
    }
    // Strip trailing punctuation that speech-to-text auto-appends (. ? ! ,)
    const clean = (s) => s.replace(/[.?!,،。]+$/g, '').trim();
    const input = $('chatBotInput');
    if (input) input.value = clean(final || interim);
    if (final) {
      setTimeout(() => { sendChatMessage(); }, 300);
    }
  };
}

function toggleVoice() {
  if (!voiceRecognition) {
    const msgs = $('chatMessages');
    if(msgs) msgs.innerHTML += `<div class="chat-msg bot">🎤 Voice recognition is not supported in this browser. Please use Chrome or Edge.</div>`;
    const w = $('chatWindow'); if(w) w.style.display='flex';
    return;
  }
  if (isListening) { voiceRecognition.stop(); }
  else {
    const w = $('chatWindow'); if(w) w.style.display='flex';
    try { voiceRecognition.start(); } catch(e) { voiceRecognition.stop(); setTimeout(()=>voiceRecognition.start(),200); }
  }
}

// Also make the chat bubble pulse/speak back results using Web Speech Synthesis
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_`#]/g,'').replace(/<[^>]+>/g,'').slice(0, 300);
  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = 'en-IN'; utt.rate = 1; utt.pitch = 1;
  window.speechSynthesis.speak(utt);
}

// ===== CHATBOT =====
function toggleChatbot() {
  const w = document.getElementById('chatWindow');
  w.style.display = w.style.display === 'none' ? 'flex' : 'none';
  if (w.style.display === 'flex') initVoiceAssistant();
}

async function sendChatMessage() {
  const input = document.getElementById('chatBotInput');
  const msg = input.value.trim();
  if(!msg) return;

  const msgs = document.getElementById('chatMessages');
  msgs.innerHTML += `<div class="chat-msg user">${msg}</div>`;
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;

  const m = msg.toLowerCase().trim();

  // Compare intent: "compare X and Y" / "compare X vs Y" / "X vs Y"
  const cmpMatch = m.match(/(?:compare\s+)?(.+?)\s+(?:vs\.?|and|versus)\s+(.+)/i);
  if(cmpMatch) {
    const sym1 = resolveNaturalSymbol(cmpMatch[1].trim());
    const sym2 = resolveNaturalSymbol(cmpMatch[2].trim());
    if(sym1 && sym2) {
      const botMsg = `⚡ Comparing <strong>${sym1}</strong> vs <strong>${sym2}</strong>…`;
      msgs.innerHTML += `<div class="chat-msg bot">${botMsg}</div>`;
      msgs.scrollTop = msgs.scrollHeight;
      speakText(`Comparing ${sym1} versus ${sym2}`);
      document.getElementById('stock1Input').value = sym1;
      document.getElementById('stock2Input').value = sym2;
      // Close chat window to show comparison
      document.getElementById('chatWindow').style.display = 'none';
      await compareStocks();
      return;
    }
  }

  // Stock open/analyze intent
  const analyzeMatch = m.match(/(?:analyze|show|open|tell me about|price of|info (?:on|about)|what(?:'s| is)(?: the)? price of)?\s*(.{2,})/i);
  const naturalSym = resolveNaturalSymbol(m) || (analyzeMatch ? resolveNaturalSymbol(analyzeMatch[1].trim()) : null);
  if(naturalSym && !cmpMatch) {
    const botMsg = `📈 Opening <strong>${naturalSym}</strong>…`;
    msgs.innerHTML += `<div class="chat-msg bot">${botMsg}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
    speakText(`Opening ${naturalSym}`);
    document.getElementById('chatWindow').style.display = 'none';
    await selectStock(naturalSym);
    return;
  }

  // Fall back to server chatbot
  try {
    const res = await api('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    msgs.innerHTML += `<div class="chat-msg bot">${res.reply}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
    speakText(res.reply);
  } catch(e) {
    msgs.innerHTML += `<div class="chat-msg bot" style="color:var(--red)">Sorry, I encountered an error.</div>`;
  }
}

// ===== NATURAL LANGUAGE SYMBOL RESOLVER =====
function resolveNaturalSymbol(input) {
  if(!input) return null;
  const raw = input.trim().toUpperCase().replace(/\s+/g,'');
  const ALIASES_LOCAL = {
    'TATASTEEL':'TATASTEEL.NS','TATAMOTORS':'TATAMOTORS.NS','TCS':'TCS.NS',
    'RELIANCE':'RELIANCE.NS','INFY':'INFY.NS','INFOSYS':'INFY.NS',
    'WIPRO':'WIPRO.NS','HDFCBANK':'HDFCBANK.NS','ICICIBANK':'ICICIBANK.NS',
    'SBIN':'SBIN.NS','STATEBANK':'SBIN.NS','AXISBANK':'AXISBANK.NS',
    'ITC':'ITC.NS','BAJFINANCE':'BAJFINANCE.NS','TITAN':'TITAN.NS',
    'HCLTECH':'HCLTECH.NS','TECHM':'TECHM.NS','MARUTI':'MARUTI.NS',
    'SUNPHARMA':'SUNPHARMA.NS','ZOMATO':'ZOMATO.NS','PAYTM':'PAYTM.NS',
    'NTPC':'NTPC.NS','ONGC':'ONGC.NS','COALINDIA':'COALINDIA.NS',
    'NESTLEIND':'NESTLEIND.NS','DRREDDY':'DRREDDY.NS','CIPLA':'CIPLA.NS',
    'JSWSTEEL':'JSWSTEEL.NS','ULTRACEMCO':'ULTRACEMCO.NS','BHARTIARTL':'BHARTIARTL.NS',
    'AIRTEL':'BHARTIARTL.NS','ADANIENT':'ADANIENT.NS','SIEMENS':'SIEMENS.NS',
    'TATACONSUMER':'TATACONSUM.NS','TATACONSUM':'TATACONSUM.NS',
    'AAPL':'AAPL','APPLE':'AAPL','MSFT':'MSFT','MICROSOFT':'MSFT',
    'GOOGL':'GOOGL','GOOGLE':'GOOGL','AMZN':'AMZN','AMAZON':'AMZN',
    'TSLA':'TSLA','TESLA':'TSLA','NVDA':'NVDA','NVIDIA':'NVDA',
    'META':'META','NFLX':'NFLX','NETFLIX':'NFLX','AMD':'AMD',
    'INTC':'INTC','INTEL':'INTC','COST':'COST','COSTCO':'COST',
    'JNJ':'JNJ','JOHNSON':'JNJ','MRK':'MRK','MERCK':'MRK',
  };
  if(ALIASES_LOCAL[raw]) return ALIASES_LOCAL[raw];
  if(raw.endsWith('.NS')) return raw;
  if(['AAPL','MSFT','GOOGL','AMZN','TSLA','NVDA','META','NFLX','AMD','INTC'].includes(raw)) return raw;
  const fuzzyMap = {
    'TATASTEEL':'TATASTEEL.NS','TATAMOTO':'TATAMOTORS.NS','TATACONSUMER':'TATACONSUM.NS',
    'STATEBANK':'SBIN.NS','HDFC':'HDFCBANK.NS','ICICI':'ICICIBANK.NS',
    'AXIS':'AXISBANK.NS','KOTAK':'KOTAKBANK.NS','INFOSYS':'INFY.NS',
    'HINDUSTAN':'HINDUNILVR.NS','BHARTI':'BHARTIARTL.NS',
    'ADANI':'ADANIENT.NS','ASIAN':'ASIANPAINT.NS','ULTRACEM':'ULTRACEMCO.NS',
    'JSWS':'JSWSTEEL.NS','APOLLO':'APOLLOHOSP.NS','YESBANK':'YESBANK.NS',
  };
  for(const [k,v] of Object.entries(fuzzyMap)) {
    if(raw.includes(k) || k.includes(raw)) return v;
  }
  const nameMap = {
    'TATASTEEL':'TATASTEEL.NS','TATA STEEL':'TATASTEEL.NS',
    'TATA MOTORS':'TATAMOTORS.NS','TATA MOTOR':'TATAMOTORS.NS',
    'TATA CONSUMER':'TATACONSUM.NS','STATE BANK':'SBIN.NS',
    'RELIANCE INDUSTRIES':'RELIANCE.NS','HCL':'HCLTECH.NS','SIEMENS':'SIEMENS.NS',
  };
  const inputNorm = input.trim().toUpperCase();
  for(const [k,v] of Object.entries(nameMap)) {
    if(inputNorm.includes(k) || k.includes(inputNorm)) return v;
  }
  return null;
}

// ===== AUTH =====
function toggleUserMenu() {
  if(currentUser) { if(confirm('Log out?')) doLogout(); }
  else { document.getElementById('loginModal').classList.add('active'); }
}
function closeLoginModal() { document.getElementById('loginModal').classList.remove('active'); }
function showSignup() { document.getElementById('loginForm').style.display='none'; document.getElementById('signupForm').style.display='block'; document.getElementById('authTitle').textContent='📝 Sign Up'; }
function showLogin() { document.getElementById('signupForm').style.display='none'; document.getElementById('loginForm').style.display='block'; document.getElementById('authTitle').textContent='🔐 Sign In'; }
async function doLogin() {
  const email = document.getElementById('loginEmail').value, pass = document.getElementById('loginPassword').value;
  if(!email||!pass) return alert('Fill all fields');
  try {
    const res = await api('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
    currentUser=res; localStorage.setItem('currentUser',JSON.stringify(res)); updateUserUI(res); closeLoginModal();
  } catch(e) { alert(e.message); }
}
async function doSignup() {
  const username=document.getElementById('signupName').value, email=document.getElementById('signupEmail').value, pass=document.getElementById('signupPassword').value;
  if(!username||!email||!pass) return alert('Fill all fields');
  try {
    const res = await api('/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,email,password:pass})});
    currentUser=res; localStorage.setItem('currentUser',JSON.stringify(res)); updateUserUI(res); closeLoginModal();
  } catch(e) { alert(e.message); }
}
function updateUserUI(user) {
  const el = document.getElementById('userName');
  if(el) el.textContent = user ? user.username : 'Sign In';
}
function doLogout() {
  // Remove any existing logout modal
  const existing = document.getElementById('logoutModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'logoutModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="position:absolute;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);" onclick="document.getElementById('logoutModal').remove()"></div>
    <div style="position:relative;background:linear-gradient(145deg,#141414,#1a1a1a);border:1px solid #2a2a2a;border-radius:20px;padding:36px 32px;width:340px;max-width:92vw;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.04);">
      <div style="font-size:44px;margin-bottom:12px;">👋</div>
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e4e4e4;">Sign out?</h2>
      <p style="margin:0 0 28px;font-size:13px;color:#666;line-height:1.6;">You'll need to sign back in to access your watchlist and portfolio.</p>
      <div style="display:flex;gap:10px;">
        <button onclick="document.getElementById('logoutModal').remove()"
          style="flex:1;padding:12px;background:#1e1e1e;border:1px solid #333;border-radius:12px;color:#aaa;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;"
          onmouseover="this.style.background='#2a2a2a';this.style.color='#fff'"
          onmouseout="this.style.background='#1e1e1e';this.style.color='#aaa'">
          Cancel
        </button>
        <button onclick="localStorage.removeItem('sa_authed');localStorage.removeItem('currentUser');location.replace('/login')"
          style="flex:1;padding:12px;background:linear-gradient(135deg,#ef4444,#dc2626);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(239,68,68,.3);"
          onmouseover="this.style.opacity='.85'"
          onmouseout="this.style.opacity='1'">
          Yes, Sign Out
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

// ===== NAV =====
function setActiveNav(label) { document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.textContent.trim()===label)); }
function navMyWatchlist() { setActiveNav('My Watchlist'); document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active')); $('panel-welcome')?.classList.add('active'); hide('stockHeaderBar'); hide('tabNav'); }
function navDiscover() { setActiveNav('Discover'); document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active')); $('panel-welcome')?.classList.add('active'); hide('stockHeaderBar'); hide('tabNav'); }
function navMoney() { setActiveNav('Money'); if(currentStock&&currentDetail){switchTab('financials');show('stockHeaderBar');show('tabNav');}else{navDiscover();} }
function navMarkets() {
  setActiveNav('Markets'); loadMarketsWidget();
  const existing = document.getElementById('marketsPopup');
  if(existing) { existing.remove(); return; }
  const popup = document.createElement('div');
  popup.id = 'marketsPopup';
  popup.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:var(--surface,#141414);border:1px solid var(--border);border-radius:16px;padding:24px;z-index:8000;min-width:360px;box-shadow:0 16px 48px rgba(0,0,0,.6);';
  popup.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3 style="margin:0;">📊 Global Markets</h3><button onclick="document.getElementById('marketsPopup').remove()" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;">×</button></div><div id="marketsPopupList"><div style="color:#888;font-size:13px;">Loading…</div></div>`;
  document.body.appendChild(popup);
  api('/api/market/overview').then(data => {
    document.getElementById('marketsPopupList').innerHTML = data.map(m =>
      `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #222;"><div><div style="font-size:14px;font-weight:600;">${m.name}</div><div style="font-size:12px;color:#888;">${m.symbol}</div></div><div style="text-align:right;"><div style="font-size:14px;font-weight:600;">${m.price.toFixed(2)}</div><div style="font-size:12px;" class="${chgClass(m.change)}">${chgSign(m.change)}${m.change.toFixed(2)}%</div></div></div>`
    ).join('');
  }).catch(()=>{});
}
function navHeadlines() {
  setActiveNav('Headlines');
  const existing = document.getElementById('headlinesPopup');
  if(existing) { existing.remove(); return; }
  const popup = document.createElement('div');
  popup.id = 'headlinesPopup';
  popup.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);background:var(--surface,#141414);border:1px solid var(--border);border-radius:16px;padding:24px;z-index:8000;min-width:420px;max-width:95vw;box-shadow:0 16px 48px rgba(0,0,0,.6);max-height:80vh;overflow-y:auto;';
  const headlines = [
    {title:'Markets Rally as Fed Signals Rate Pause',time:'2h ago',tag:'Markets'},
    {title:'Reliance Industries Q4 Results Beat Estimates',time:'3h ago',tag:'India'},
    {title:'TCS Reports Strong Revenue Growth in Q4',time:'4h ago',tag:'India'},
    {title:'NVIDIA Surpasses $2 Trillion Market Cap',time:'5h ago',tag:'Tech'},
    {title:'Apple Reports Record Services Revenue',time:'6h ago',tag:'Tech'},
    {title:'Sensex Rallies 400 Points on Global Cues',time:'7h ago',tag:'India'},
    {title:'RBI Keeps Repo Rate Unchanged at 6.5%',time:'8h ago',tag:'Economy'},
    {title:'Tata Steel Reports Higher Steel Demand',time:'9h ago',tag:'India'},
    {title:'Tesla Deliveries Beat Q1 Expectations',time:'10h ago',tag:'EV'},
    {title:'Amazon AWS Revenue Grows 17% YoY',time:'12h ago',tag:'Tech'},
  ];
  popup.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3 style="margin:0;">📰 Market Headlines</h3><button onclick="document.getElementById('headlinesPopup').remove()" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;">×</button></div>
  ${headlines.map(h=>`<div style="padding:12px 0;border-bottom:1px solid #222;"><div style="display:flex;gap:8px;align-items:flex-start;"><span style="background:#1a2a1a;color:#10b981;font-size:10px;font-weight:700;padding:2px 7px;border-radius:12px;white-space:nowrap;margin-top:2px;">${h.tag}</span><div><div style="font-size:13px;font-weight:500;line-height:1.5;">${h.title}</div><div style="font-size:11px;color:#555;margin-top:3px;">${h.time}</div></div></div></div>`).join('')}`;
  document.body.appendChild(popup);
}
