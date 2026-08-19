const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config();
const { STOCKS, resolveSymbol, getStockInfo, searchStocks } = require("./stocksdb");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

let USD_TO_INR = 83.12;
let lastRateUpdate = null;

const updateExchangeRate = async () => {
  try {
    if (lastRateUpdate && Date.now() - lastRateUpdate < 3600000) return USD_TO_INR;
    const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD", { timeout: 3000 });
    if (response.data?.rates?.INR) {
      USD_TO_INR = response.data.rates.INR;
      lastRateUpdate = Date.now();
    }
  } catch (e) { console.log("Using cached exchange rate"); }
  return USD_TO_INR;
};
updateExchangeRate();

// === DATA GENERATORS ===
function genPrice(base, variance = 0.03) {
  return base * (1 + (Math.random() - 0.5) * variance);
}

function generateStockData(symbol) {
  const resolved = resolveSymbol(symbol);
  const info = getStockInfo(symbol);
  if (!info) return null;
  
  const isIndian = !!info.isIndian;
  const base = info.basePrice;
  const price = genPrice(base, 0.02);
  const prevClose = genPrice(base, 0.01);
  const change = price - prevClose;
  const changePct = (change / prevClose) * 100;
  const dayHigh = price * (1 + Math.random() * 0.015);
  const dayLow = price * (1 - Math.random() * 0.015);
  const open = genPrice(base, 0.01);
  const yearHigh = base * (1 + Math.random() * 0.35 + 0.05);
  const yearLow = base * (1 - Math.random() * 0.25 - 0.05);
  const pe = 10 + Math.random() * 50;
  const eps = price / pe;
  const mktCap = base * (1e7 + Math.random() * 5e8);
  const vol = Math.floor(1e6 + Math.random() * 5e7);
  const avgVol = Math.floor(1e6 + Math.random() * 3e7);
  const div = Math.random() * 4;
  const divYield = div / price * 100;
  const beta = 0.5 + Math.random() * 1.5;

  return {
    symbol: resolved, name: info.name, sector: info.sector, industry: info.industry,
    icon: info.icon, country: info.country, isIndian,
    price: +price.toFixed(2), priceINR: +(isIndian ? price : price * USD_TO_INR).toFixed(2),
    priceUSD: +(isIndian ? price / USD_TO_INR : price).toFixed(2),
    change: +change.toFixed(2), changePercent: +changePct.toFixed(2),
    open: +open.toFixed(2), prevClose: +prevClose.toFixed(2),
    dayHigh: +dayHigh.toFixed(2), dayLow: +dayLow.toFixed(2),
    yearHigh: +yearHigh.toFixed(2), yearLow: +yearLow.toFixed(2),
    pe: +pe.toFixed(2), eps: +eps.toFixed(2),
    marketCap: Math.floor(mktCap), volume: vol, avgVolume: avgVol,
    dividend: +div.toFixed(2), dividendYield: +divYield.toFixed(2),
    beta: +beta.toFixed(2),
    sharesOutstanding: Math.floor(mktCap / price),
    exchangeRate: USD_TO_INR,
    timestamp: new Date().toISOString()
  };
}

function generateChartData(symbol, range) {
  const info = getStockInfo(symbol);
  if (!info) return [];
  const base = info.basePrice;
  const points = { "1D": 78, "5D": 60, "1M": 30, "3M": 90, "6M": 130, "1Y": 252, "5Y": 260, "MAX": 520 };
  const n = points[range] || 30;
  const data = [];
  let p = base * (0.85 + Math.random() * 0.1);
  const now = Date.now();
  const msPerPoint = range === "1D" ? 300000 : range === "5D" ? 3600000 : 86400000;
  
  for (let i = 0; i < n; i++) {
    p += (Math.random() - 0.48) * base * 0.012;
    if (p < base * 0.5) p = base * 0.55;
    if (p > base * 1.5) p = base * 1.45;
    data.push({
      time: new Date(now - (n - i) * msPerPoint).toISOString(),
      price: +p.toFixed(2),
      volume: Math.floor(1e5 + Math.random() * 5e6)
    });
  }
  return data;
}

function generateFinancials(symbol) {
  const info = getStockInfo(symbol);
  if (!info) return null;
  const base = info.basePrice;
  const rev = base * 1e6 * (5 + Math.random() * 20);
  const ni = rev * (0.05 + Math.random() * 0.2);
  const years = [2022, 2023, 2024, 2025];
  
  return {
    income: years.map((y, i) => ({
      year: y, revenue: +(rev * (0.8 + i * 0.1)).toFixed(0),
      netIncome: +(ni * (0.7 + i * 0.15)).toFixed(0),
      grossProfit: +(rev * (0.8 + i * 0.1) * 0.4).toFixed(0),
      operatingIncome: +(rev * (0.8 + i * 0.1) * 0.2).toFixed(0),
      ebitda: +(rev * (0.8 + i * 0.1) * 0.25).toFixed(0)
    })),
    balance: {
      totalAssets: +(rev * 3).toFixed(0), totalLiabilities: +(rev * 1.8).toFixed(0),
      totalEquity: +(rev * 1.2).toFixed(0), cash: +(rev * 0.3).toFixed(0),
      totalDebt: +(rev * 1.2).toFixed(0), currentRatio: +(0.5 + Math.random() * 2).toFixed(2),
      quickRatio: +(0.3 + Math.random() * 1.5).toFixed(2)
    },
    ratios: {
      netMargin: +(5 + Math.random() * 20).toFixed(2),
      grossMargin: +(25 + Math.random() * 35).toFixed(2),
      operatingMargin: +(10 + Math.random() * 20).toFixed(2),
      roe: +(5 + Math.random() * 25).toFixed(2),
      roa: +(2 + Math.random() * 15).toFixed(2),
      roic: +(5 + Math.random() * 20).toFixed(2),
      debtToEquity: +(0.2 + Math.random() * 2).toFixed(2),
      debtToEbitda: +(1 + Math.random() * 5).toFixed(2),
      priceToSales: +(1 + Math.random() * 15).toFixed(2),
      priceToBook: +(1 + Math.random() * 10).toFixed(2),
      evToEbitda: +(5 + Math.random() * 20).toFixed(2),
      peg: +(0.5 + Math.random() * 3).toFixed(2)
    },
    valuation: {
      priceToEarnings: +(10 + Math.random() * 50).toFixed(2),
      industryAvgPE: +(15 + Math.random() * 25).toFixed(2),
      peerAvgPE: +(12 + Math.random() * 30).toFixed(2)
    }
  };
}

function generateEarnings(symbol) {
  const info = getStockInfo(symbol);
  if (!info) return null;
  const base = info.basePrice;
  const baseEPS = base / (15 + Math.random() * 30);
  const quarters = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026"];
  
  return {
    nextEarningsDate: "30 Apr 2026",
    history: quarters.map((q, i) => ({
      quarter: q,
      forecastEPS: +(baseEPS * (0.9 + i * 0.04)).toFixed(2),
      reportedEPS: i < 4 ? +(baseEPS * (0.85 + i * 0.05 + (Math.random() - 0.3) * 0.1)).toFixed(2) : null,
      surprise: i < 4 ? +((Math.random() - 0.3) * 15).toFixed(2) : null,
      lastYearEPS: +(baseEPS * (0.75 + i * 0.03)).toFixed(2)
    })),
    epsGrowthVsPeers: +(5 + Math.random() * 30).toFixed(2),
    peerAvgGrowth: +(Math.random() * 20 - 5).toFixed(2),
    consensusEPS: +(baseEPS * 1.1).toFixed(2),
    consensusRevenue: +(base * 1e5 * (8 + Math.random() * 10)).toFixed(0),
    performance: {
      fiveDay: +((Math.random() - 0.3) * 10).toFixed(2),
      oneMonth: +((Math.random() - 0.2) * 25).toFixed(2),
      sinceLast: +((Math.random() - 0.2) * 35).toFixed(2),
      sixMonth: +((Math.random() - 0.2) * 30).toFixed(2),
      oneYear: +((Math.random() - 0.1) * 40).toFixed(2)
    }
  };
}

function generateInsights(stock) {
  const insights = [];
  const pe = stock.pe;
  const changePct = stock.changePercent;
  
  if (pe < 20) insights.push({ type: "positive", text: "P/E ratio below industry average — potentially undervalued" });
  else if (pe > 35) insights.push({ type: "negative", text: "P/E multiple above peer average" });
  else insights.push({ type: "neutral", text: "P/E ratio in line with sector average" });
  
  if (changePct > 1) insights.push({ type: "positive", text: "Stock showing strong upward momentum today" });
  else if (changePct < -1) insights.push({ type: "negative", text: "Stock under selling pressure today" });
  
  insights.push({ type: "positive", text: "Net profit margin grown above peers" });
  insights.push({ type: "positive", text: "Revenue YoY is forecast to grow" });
  insights.push({ type: "negative", text: "EPS YoY forecast is below industry average" });
  insights.push({ type: "negative", text: "Net profit YoY grew below peer average" });
  insights.push({ type: "positive", text: "Revenue YoY grew better than peers" });
  
  const scores = {
    valuation: Math.floor(1 + Math.random() * 6),
    health: Math.floor(1 + Math.random() * 6),
    earnings: Math.floor(1 + Math.random() * 6),
    performance: Math.floor(1 + Math.random() * 6),
    growth: Math.floor(1 + Math.random() * 6)
  };
  
  return { insights, scores, maxScore: 6 };
}

function generateAnalystData(stock) {
  const ratings = ["Strong Sell", "Sell", "Hold", "Buy", "Strong Buy"];
  const idx = Math.floor(2 + Math.random() * 3);
  const numAnalysts = Math.floor(8 + Math.random() * 20);
  const targetPrice = stock.price * (0.85 + Math.random() * 0.4);
  
  return {
    recommendation: ratings[idx],
    numAnalysts,
    targetPrice: +targetPrice.toFixed(2),
    breakdown: {
      strongBuy: Math.floor(Math.random() * 8),
      buy: Math.floor(Math.random() * 6) + 1,
      hold: Math.floor(Math.random() * 5) + 1,
      sell: Math.floor(Math.random() * 3),
      strongSell: Math.floor(Math.random() * 2)
    },
    priceVolatility: Math.random() > 0.5 ? "High" : "Moderate"
  };
}

function generateCompanyProfile(symbol) {
  const info = getStockInfo(symbol);
  if (!info) return null;
  
  const executives = [
    { name: "John Smith", title: "Chief Executive Officer" },
    { name: "Sarah Johnson", title: "Chief Financial Officer" },
    { name: "Michael Chen", title: "Chief Technology Officer" },
    { name: "Emily Davis", title: "Chief Operating Officer" },
    { name: "Robert Wilson", title: "VP of Engineering" }
  ];
  
  return {
    description: `${info.name} is a leading ${info.country === "IN" ? "Indian" : "global"} company in the ${info.industry} industry within the ${info.sector} sector. The company designs, manufactures, and provides innovative products and services to customers worldwide. With a strong track record of growth and innovation, the company continues to expand its market presence and deliver value to shareholders.`,
    sector: info.sector, industry: info.industry,
    founded: 1980 + Math.floor(Math.random() * 30),
    employees: Math.floor(5000 + Math.random() * 200000),
    headquarters: info.country === "IN" ? "Mumbai, Maharashtra, India" : "United States",
    website: `https://www.${info.name.split(" ")[0].toLowerCase()}.com`,
    executives
  };
}

function generatePeers(symbol) {
  const info = getStockInfo(symbol);
  if (!info) return [];
  const allStocks = Object.entries(STOCKS);
  return allStocks
    .filter(([s, d]) => d.industry === info.industry && s !== resolveSymbol(symbol))
    .slice(0, 5)
    .map(([s, d]) => {
      const p = genPrice(d.basePrice, 0.02);
      const ch = (Math.random() - 0.5) * 5;
      return { symbol: s, name: d.name, price: +p.toFixed(2), changePercent: +ch.toFixed(2), icon: d.icon };
    });
}

// === RECOMMENDATION ENGINE ===
function generateRecommendation(stock) {
  let score = 0;
  const reasons = [];
  if (stock.pe < 15) { score += 2; reasons.push("Attractive P/E ratio suggests undervaluation"); }
  else if (stock.pe > 30) { score -= 2; reasons.push("High P/E ratio indicates overvaluation"); }
  if (stock.changePercent > 3) { score += 2; reasons.push("Strong positive momentum"); }
  else if (stock.changePercent < -3) { score -= 2; reasons.push("Negative price momentum"); }
  if (stock.volume > stock.avgVolume * 1.5) { score += 1; reasons.push("High trading volume"); }
  
  const pricePos = ((stock.price - stock.yearLow) / (stock.yearHigh - stock.yearLow)) * 100;
  if (pricePos < 30) { score += 2; reasons.push("Trading near 52-week low"); }
  else if (pricePos > 80) { score -= 1; reasons.push("Trading near 52-week high"); }

  let action, confidence, color;
  if (score >= 4) { action = "STRONG BUY"; confidence = "High"; color = "#10b981"; }
  else if (score >= 2) { action = "BUY"; confidence = "Moderate"; color = "#3b82f6"; }
  else if (score >= -1) { action = "HOLD"; confidence = "Neutral"; color = "#f59e0b"; }
  else if (score >= -3) { action = "SELL"; confidence = "Moderate"; color = "#ef4444"; }
  else { action = "STRONG SELL"; confidence = "High"; color = "#dc2626"; }
  return { action, confidence, color, score, reasons: reasons.slice(0, 3) };
}

// === AUTH (in-memory) ===
const users = {
  'ds@stockai.com': { username: 'Data Science', email: 'ds@stockai.com', password: 'batla', watchlist: [], createdAt: new Date().toISOString() }
};

// === CHATBOT ===
function chatbotResponse(msg) {
  const m = msg.toLowerCase().trim();
  if (/^(hi|hello|hey|howdy)/.test(m)) return "Hey there! 👋 I'm your stock market assistant. Ask me about any stock, compare companies, or just chat!";
  if (/how are you/.test(m)) return "I'm doing great, thanks for asking! 📈 Ready to help you analyze stocks. What would you like to know?";
  if (/joke/.test(m)) {
    const jokes = [
      "Why did the stock market investor bring a ladder? Because they heard the market was going up! 📈",
      "What's a bear market's favorite movie? The Big Short! 🐻",
      "Why don't stock traders ever get lost? They always follow the trends! 😄"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (/what can you do|help|capabilities/.test(m)) return "I can help you with:\n• Stock prices & analysis\n• Compare two stocks\n• Market insights & recommendations\n• Company information\nTry asking: 'Tell me about AAPL' or 'Compare TCS vs INFY'";
  if (/thank/.test(m)) return "You're welcome! Happy investing! 🎯";
  if (/bye|goodbye/.test(m)) return "Goodbye! May your portfolio always be green! 📈💚";
  
  const stockMatch = m.match(/(?:price|about|tell|info|analyze)\s+(?:of\s+|me\s+about\s+)?([A-Z0-9.]+)/i);
  if (stockMatch) {
    const sym = stockMatch[1].toUpperCase();
    const data = generateStockData(sym);
    if (data) return `📊 **${data.name} (${data.symbol})**\nPrice: ${data.isIndian ? "₹" : "$"}${data.price}\nChange: ${data.changePercent >= 0 ? "+" : ""}${data.changePercent}%\nP/E: ${data.pe}\nMarket Cap: ${(data.marketCap / 1e9).toFixed(1)}B`;
    return `Sorry, I couldn't find data for "${sym}". Try a symbol like AAPL, TCS, or RELIANCE.`;
  }
  
  return "I can help with stock analysis! Try:\n• 'Tell me about AAPL'\n• 'Price of TCS'\n• 'What can you do'\n• 'Tell me a joke'";
}

// ==================
// API ROUTES
// ==================

// Stock list with search
app.get("/api/stocks", (req, res) => {
  const { q, category } = req.query;
  const results = searchStocks(q || "", category);
  res.json({ success: true, data: results, total: results.length });
});

// Single stock data
app.get("/api/stock/:symbol", async (req, res) => {
  try {
    await updateExchangeRate();
    const data = generateStockData(req.params.symbol);
    if (!data) return res.status(404).json({ success: false, error: "Stock not found" });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Full stock detail
app.get("/api/stock/:symbol/detail", async (req, res) => {
  try {
    await updateExchangeRate();
    const stock = generateStockData(req.params.symbol);
    if (!stock) return res.status(404).json({ success: false, error: "Stock not found" });
    res.json({
      success: true,
      data: {
        stock, financials: generateFinancials(req.params.symbol),
        earnings: generateEarnings(req.params.symbol),
        insights: generateInsights(stock),
        analyst: generateAnalystData(stock),
        company: generateCompanyProfile(req.params.symbol),
        peers: generatePeers(req.params.symbol),
        recommendation: generateRecommendation(stock)
      }
    });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Chart data
app.get("/api/stock/:symbol/chart", (req, res) => {
  const range = req.query.range || "1M";
  const data = generateChartData(req.params.symbol, range);
  if (!data.length) return res.status(404).json({ success: false, error: "Stock not found" });
  res.json({ success: true, data });
});

// Peers
app.get("/api/stock/:symbol/peers", (req, res) => {
  const peers = generatePeers(req.params.symbol);
  res.json({ success: true, data: peers });
});

// Insights
app.get("/api/stock/:symbol/insights", (req, res) => {
  const stock = generateStockData(req.params.symbol);
  if (!stock) return res.status(404).json({ success: false, error: "Stock not found" });
  res.json({ success: true, data: generateInsights(stock) });
});

// Compare
app.post("/api/compare", async (req, res) => {
  try {
    const { stock1, stock2 } = req.body;
    if (!stock1 || !stock2) return res.status(400).json({ success: false, error: "Both symbols required" });
    await updateExchangeRate();
    const [d1, d2] = [generateStockData(stock1), generateStockData(stock2)];
    if (!d1 || !d2) return res.status(404).json({ success: false, error: "Stock not found" });
    res.json({
      success: true,
      data: {
        stock1: d1, stock2: d2,
        analysis: {
          summary: d1.changePercent > d2.changePercent
            ? `${d1.symbol} outperforming ${d2.symbol} by ${Math.abs(d1.changePercent - d2.changePercent).toFixed(2)}%`
            : `${d2.symbol} outperforming ${d1.symbol} by ${Math.abs(d1.changePercent - d2.changePercent).toFixed(2)}%`,
          recommendations: { stock1: generateRecommendation(d1), stock2: generateRecommendation(d2) },
          performance: { winner: d1.changePercent > d2.changePercent ? d1.symbol : d2.symbol },
          valuation: { peComparison: d1.pe < d2.pe ? `${d1.symbol} has lower P/E` : `${d2.symbol} has lower P/E` }
        }
      }
    });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Analyze
const analyzeHandler = async (symbol, res) => {
  if (!symbol) return res.status(400).json({ success: false, error: "Symbol required" });
  await updateExchangeRate();
  const stock = generateStockData(symbol);
  if (!stock) return res.status(404).json({ success: false, error: "Stock not found" });
  const cs = stock.isIndian ? "₹" : "$";
  const dp = stock.price;
  res.json({
    success: true,
    data: {
      stock,
      analysis: {
        overview: `${stock.name} trading at ${cs}${dp}, ${stock.change >= 0 ? "up" : "down"} ${Math.abs(stock.changePercent).toFixed(2)}%`,
        technical: `Trading between ${cs}${stock.dayLow} - ${cs}${stock.dayHigh}`,
        fundamental: `P/E ratio ${stock.pe}, EPS ${cs}${stock.eps}`,
        volume: `Volume ${(stock.volume / 1e6).toFixed(2)}M ${stock.volume > stock.avgVolume ? "above" : "below"} average`,
        sentiment: stock.changePercent > 2 ? "Strong bullish" : stock.changePercent > 0 ? "Positive" : stock.changePercent > -2 ? "Slightly negative" : "Bearish",
        recommendation: generateRecommendation(stock)
      }
    }
  });
};

app.get("/api/analyze", async (req, res) => analyzeHandler(req.query.symbol, res));
app.post("/api/analyze", async (req, res) => analyzeHandler(req.body.symbol, res));

// Auth
app.post("/api/auth/signup", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ success: false, error: "All fields required" });
  if (users[email]) return res.status(400).json({ success: false, error: "User already exists" });
  users[email] = { username, email, password, watchlist: [], createdAt: new Date().toISOString() };
  res.json({ success: true, data: { username, email, token: "tok_" + Date.now() } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user || user.password !== password) return res.status(401).json({ success: false, error: "Invalid credentials" });
  res.json({ success: true, data: { username: user.username, email, token: "tok_" + Date.now() } });
});

// Chatbot
app.post("/api/chatbot", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, error: "Message required" });
  res.json({ success: true, data: { reply: chatbotResponse(message) } });
});

// Market overview
app.get("/api/market/overview", (req, res) => {
  const indices = [
    { symbol: "SENSEX", name: "SENSEX", price: 76770 + Math.random() * 500, change: -0.95 + Math.random() * 2 },
    { symbol: "NIFTY", name: "NIFTY 50", price: 23940 + Math.random() * 200, change: -1 + Math.random() * 2 },
    { symbol: "DJI", name: "DOW", price: 48860 + Math.random() * 300, change: -0.6 + Math.random() * 1.5 },
    { symbol: "FTSE", name: "FTSE 100", price: 10223 + Math.random() * 100, change: 0.1 + Math.random() },
    { symbol: "NIKKEI", name: "NIKKEI 225", price: 39285 + Math.random() * 200, change: -1 + Math.random() * 2 },
    { symbol: "BTC", name: "BITCOIN", price: 72380 + Math.random() * 1000, change: -1.5 + Math.random() * 3 },
    { symbol: "ETH", name: "ETHEREUM", price: 214976 + Math.random() * 5000, change: -3 + Math.random() * 4 },
    { symbol: "INRUSD", name: "INR/USD", price: 0.012, change: -0.4 + Math.random() * 0.8 }
  ];
  res.json({ success: true, data: indices });
});

// Main routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/health", (req, res) => res.json({ status: "ok", exchangeRate: USD_TO_INR, stockCount: Object.keys(STOCKS).length }));

app.listen(PORT, () => {
  console.log(`🚀 Stock Analyzer running on http://localhost:${PORT}`);
  console.log(`📊 ${Object.keys(STOCKS).length} stocks loaded`);
  console.log(`💱 Exchange rate: 1 USD = ₹${USD_TO_INR.toFixed(2)}`);
});
