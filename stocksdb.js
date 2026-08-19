const STOCKS = {
  // === US STOCKS ===
  AAPL: { name: "Apple Inc.", sector: "Technology", industry: "Consumer Electronics", country: "US", icon: "🍎", basePrice: 188.5 },
  MSFT: { name: "Microsoft Corporation", sector: "Technology", industry: "Software", country: "US", icon: "🪟", basePrice: 425.3 },
  GOOGL: { name: "Alphabet Inc.", sector: "Technology", industry: "Internet", country: "US", icon: "🔍", basePrice: 158.75 },
  AMZN: { name: "Amazon.com Inc.", sector: "Consumer Cyclical", industry: "E-Commerce", country: "US", icon: "📦", basePrice: 185.6 },
  TSLA: { name: "Tesla Inc.", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "US", icon: "⚡", basePrice: 195.8 },
  NVDA: { name: "NVIDIA Corporation", sector: "Technology", industry: "Semiconductors", country: "US", icon: "🎮", basePrice: 875.3 },
  META: { name: "Meta Platforms Inc.", sector: "Technology", industry: "Social Media", country: "US", icon: "👤", basePrice: 505.7 },
  BRK_B: { name: "Berkshire Hathaway", sector: "Financials", industry: "Conglomerates", country: "US", icon: "🏛️", basePrice: 410.2 },
  JPM: { name: "JPMorgan Chase", sector: "Financials", industry: "Banks", country: "US", icon: "🏦", basePrice: 198.5 },
  V: { name: "Visa Inc.", sector: "Financials", industry: "Payments", country: "US", icon: "💳", basePrice: 278.9 },
  JNJ: { name: "Johnson & Johnson", sector: "Healthcare", industry: "Pharmaceuticals", country: "US", icon: "💊", basePrice: 156.3 },
  WMT: { name: "Walmart Inc.", sector: "Consumer Defensive", industry: "Retail", country: "US", icon: "🛒", basePrice: 165.8 },
  PG: { name: "Procter & Gamble", sector: "Consumer Defensive", industry: "Household Products", country: "US", icon: "🧴", basePrice: 160.2 },
  MA: { name: "Mastercard Inc.", sector: "Financials", industry: "Payments", country: "US", icon: "💳", basePrice: 458.7 },
  UNH: { name: "UnitedHealth Group", sector: "Healthcare", industry: "Health Plans", country: "US", icon: "🏥", basePrice: 527.4 },
  HD: { name: "Home Depot", sector: "Consumer Cyclical", industry: "Home Improvement", country: "US", icon: "🏠", basePrice: 345.6 },
  DIS: { name: "Walt Disney Co.", sector: "Communication", industry: "Entertainment", country: "US", icon: "🏰", basePrice: 112.3 },
  NFLX: { name: "Netflix Inc.", sector: "Communication", industry: "Streaming", country: "US", icon: "🎬", basePrice: 628.5 },
  CRM: { name: "Salesforce Inc.", sector: "Technology", industry: "Cloud Software", country: "US", icon: "☁️", basePrice: 272.1 },
  ADBE: { name: "Adobe Inc.", sector: "Technology", industry: "Software", country: "US", icon: "🎨", basePrice: 485.3 },
  AMD: { name: "AMD Inc.", sector: "Technology", industry: "Semiconductors", country: "US", icon: "💻", basePrice: 165.2 },
  INTC: { name: "Intel Corporation", sector: "Technology", industry: "Semiconductors", country: "US", icon: "🔧", basePrice: 31.5 },
  CSCO: { name: "Cisco Systems", sector: "Technology", industry: "Networking", country: "US", icon: "🌐", basePrice: 50.8 },
  PEP: { name: "PepsiCo Inc.", sector: "Consumer Defensive", industry: "Beverages", country: "US", icon: "🥤", basePrice: 170.5 },
  KO: { name: "Coca-Cola Co.", sector: "Consumer Defensive", industry: "Beverages", country: "US", icon: "🥤", basePrice: 61.2 },
  MRK: { name: "Merck & Co.", sector: "Healthcare", industry: "Pharmaceuticals", country: "US", icon: "💉", basePrice: 127.8 },
  ORCL: { name: "Oracle Corporation", sector: "Technology", industry: "Software", country: "US", icon: "🗄️", basePrice: 125.4 },
  QCOM: { name: "Qualcomm Inc.", sector: "Technology", industry: "Semiconductors", country: "US", icon: "📱", basePrice: 170.3 },
  BA: { name: "Boeing Co.", sector: "Industrials", industry: "Aerospace", country: "US", icon: "✈️", basePrice: 185.9 },
  GS: { name: "Goldman Sachs", sector: "Financials", industry: "Investment Banking", country: "US", icon: "🏦", basePrice: 430.7 },
  T: { name: "AT&T Inc.", sector: "Communication", industry: "Telecom", country: "US", icon: "📞", basePrice: 17.2 },
  XOM: { name: "Exxon Mobil", sector: "Energy", industry: "Oil & Gas", country: "US", icon: "⛽", basePrice: 104.5 },
  CVX: { name: "Chevron Corp.", sector: "Energy", industry: "Oil & Gas", country: "US", icon: "⛽", basePrice: 155.8 },
  COST: { name: "Costco Wholesale", sector: "Consumer Defensive", industry: "Retail", country: "US", icon: "🏪", basePrice: 725.3 },
  PYPL: { name: "PayPal Holdings", sector: "Financials", industry: "Payments", country: "US", icon: "💰", basePrice: 63.5 },
  UBER: { name: "Uber Technologies", sector: "Technology", industry: "Ride-Sharing", country: "US", icon: "🚗", basePrice: 72.4 },
  SQ: { name: "Block Inc.", sector: "Financials", industry: "Fintech", country: "US", icon: "🔲", basePrice: 78.2 },
  SNAP: { name: "Snap Inc.", sector: "Communication", industry: "Social Media", country: "US", icon: "👻", basePrice: 11.8 },
  SHOP: { name: "Shopify Inc.", sector: "Technology", industry: "E-Commerce", country: "US", icon: "🛍️", basePrice: 78.9 },
  ZM: { name: "Zoom Video", sector: "Technology", industry: "Software", country: "US", icon: "📹", basePrice: 65.3 },
  COIN: { name: "Coinbase Global", sector: "Financials", industry: "Crypto Exchange", country: "US", icon: "🪙", basePrice: 225.1 },
  PLTR: { name: "Palantir Technologies", sector: "Technology", industry: "Data Analytics", country: "US", icon: "📊", basePrice: 24.8 },
  NKE: { name: "Nike Inc.", sector: "Consumer Cyclical", industry: "Footwear", country: "US", icon: "👟", basePrice: 97.5 },
  MCD: { name: "McDonald's Corp.", sector: "Consumer Cyclical", industry: "Restaurants", country: "US", icon: "🍔", basePrice: 290.3 },
  SBUX: { name: "Starbucks Corp.", sector: "Consumer Cyclical", industry: "Restaurants", country: "US", icon: "☕", basePrice: 92.7 },
  IBM: { name: "IBM Corporation", sector: "Technology", industry: "IT Services", country: "US", icon: "🖥️", basePrice: 188.4 },
  GE: { name: "General Electric", sector: "Industrials", industry: "Aerospace", country: "US", icon: "⚙️", basePrice: 162.5 },
  F: { name: "Ford Motor Co.", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "US", icon: "🚙", basePrice: 12.1 },
  GM: { name: "General Motors", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "US", icon: "🚗", basePrice: 39.8 },
  LLY: { name: "Eli Lilly & Co.", sector: "Healthcare", industry: "Pharmaceuticals", country: "US", icon: "💊", basePrice: 782.4 },

  // === INDIAN STOCKS ===
  "RELIANCE.NS": { name: "Reliance Industries Ltd.", sector: "Energy", industry: "Conglomerates", country: "IN", icon: "🏭", basePrice: 1461, isIndian: true },
  "TCS.NS": { name: "Tata Consultancy Services", sector: "Technology", industry: "IT Services", country: "IN", icon: "💻", basePrice: 3890, isIndian: true },
  "INFY.NS": { name: "Infosys Ltd.", sector: "Technology", industry: "IT Services", country: "IN", icon: "🔧", basePrice: 1580, isIndian: true },
  "HDFCBANK.NS": { name: "HDFC Bank Ltd.", sector: "Financials", industry: "Banks", country: "IN", icon: "🏦", basePrice: 1720, isIndian: true },
  "ICICIBANK.NS": { name: "ICICI Bank Ltd.", sector: "Financials", industry: "Banks", country: "IN", icon: "🏦", basePrice: 1050, isIndian: true },
  "SBIN.NS": { name: "State Bank of India", sector: "Financials", industry: "Banks", country: "IN", icon: "🏛️", basePrice: 780, isIndian: true },
  "BHARTIARTL.NS": { name: "Bharti Airtel Ltd.", sector: "Communication", industry: "Telecom", country: "IN", icon: "📡", basePrice: 1150, isIndian: true },
  "ITC.NS": { name: "ITC Ltd.", sector: "Consumer Defensive", industry: "Conglomerates", country: "IN", icon: "🏭", basePrice: 460, isIndian: true },
  "HINDUNILVR.NS": { name: "Hindustan Unilever", sector: "Consumer Defensive", industry: "FMCG", country: "IN", icon: "🧴", basePrice: 2450, isIndian: true },
  "LT.NS": { name: "Larsen & Toubro", sector: "Industrials", industry: "Engineering", country: "IN", icon: "🏗️", basePrice: 3200, isIndian: true },
  "KOTAKBANK.NS": { name: "Kotak Mahindra Bank", sector: "Financials", industry: "Banks", country: "IN", icon: "🏦", basePrice: 1780, isIndian: true },
  "AXISBANK.NS": { name: "Axis Bank Ltd.", sector: "Financials", industry: "Banks", country: "IN", icon: "🏦", basePrice: 1120, isIndian: true },
  "WIPRO.NS": { name: "Wipro Ltd.", sector: "Technology", industry: "IT Services", country: "IN", icon: "💻", basePrice: 480, isIndian: true },
  "HCLTECH.NS": { name: "HCL Technologies", sector: "Technology", industry: "IT Services", country: "IN", icon: "💻", basePrice: 1520, isIndian: true },
  "TATAMOTORS.NS": { name: "Tata Motors Ltd.", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "IN", icon: "🚗", basePrice: 680, isIndian: true },
  "MARUTI.NS": { name: "Maruti Suzuki India", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "IN", icon: "🚙", basePrice: 10500, isIndian: true },
  "SUNPHARMA.NS": { name: "Sun Pharmaceutical", sector: "Healthcare", industry: "Pharmaceuticals", country: "IN", icon: "💊", basePrice: 1180, isIndian: true },
  "BAJFINANCE.NS": { name: "Bajaj Finance Ltd.", sector: "Financials", industry: "NBFC", country: "IN", icon: "💰", basePrice: 7200, isIndian: true },
  "TITAN.NS": { name: "Titan Company Ltd.", sector: "Consumer Cyclical", industry: "Jewelry", country: "IN", icon: "💎", basePrice: 3400, isIndian: true },
  "ADANIENT.NS": { name: "Adani Enterprises", sector: "Industrials", industry: "Conglomerates", country: "IN", icon: "🏢", basePrice: 2800, isIndian: true },
  "ASIANPAINT.NS": { name: "Asian Paints Ltd.", sector: "Materials", industry: "Paints", country: "IN", icon: "🎨", basePrice: 2850, isIndian: true },
  "NTPC.NS": { name: "NTPC Ltd.", sector: "Utilities", industry: "Power", country: "IN", icon: "⚡", basePrice: 365, isIndian: true },
  "POWERGRID.NS": { name: "Power Grid Corp.", sector: "Utilities", industry: "Power", country: "IN", icon: "🔌", basePrice: 280, isIndian: true },
  "ONGC.NS": { name: "Oil & Natural Gas Corp.", sector: "Energy", industry: "Oil & Gas", country: "IN", icon: "⛽", basePrice: 260, isIndian: true },
  "COALINDIA.NS": { name: "Coal India Ltd.", sector: "Energy", industry: "Mining", country: "IN", icon: "⛏️", basePrice: 430, isIndian: true },
  "TATASTEEL.NS": { name: "Tata Steel Ltd.", sector: "Materials", industry: "Steel", country: "IN", icon: "🔩", basePrice: 130, isIndian: true },
  "JSWSTEEL.NS": { name: "JSW Steel Ltd.", sector: "Materials", industry: "Steel", country: "IN", icon: "🔩", basePrice: 850, isIndian: true },
  "ULTRACEMCO.NS": { name: "UltraTech Cement", sector: "Materials", industry: "Cement", country: "IN", icon: "🏗️", basePrice: 9500, isIndian: true },
  "NESTLEIND.NS": { name: "Nestle India Ltd.", sector: "Consumer Defensive", industry: "Food Products", country: "IN", icon: "🍫", basePrice: 24500, isIndian: true },
  "TECHM.NS": { name: "Tech Mahindra Ltd.", sector: "Technology", industry: "IT Services", country: "IN", icon: "💻", basePrice: 1350, isIndian: true },
  "M_M.NS": { name: "Mahindra & Mahindra", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "IN", icon: "🚜", basePrice: 1650, isIndian: true },
  "HEROMOTOCO.NS": { name: "Hero MotoCorp", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "IN", icon: "🏍️", basePrice: 4200, isIndian: true },
  "BAJAJ_AUTO.NS": { name: "Bajaj Auto Ltd.", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "IN", icon: "🏍️", basePrice: 5800, isIndian: true },
  "EICHERMOT.NS": { name: "Eicher Motors Ltd.", sector: "Consumer Cyclical", industry: "Auto Manufacturers", country: "IN", icon: "🏍️", basePrice: 3900, isIndian: true },
  "DRREDDY.NS": { name: "Dr. Reddy's Labs", sector: "Healthcare", industry: "Pharmaceuticals", country: "IN", icon: "💊", basePrice: 5600, isIndian: true },
  "CIPLA.NS": { name: "Cipla Ltd.", sector: "Healthcare", industry: "Pharmaceuticals", country: "IN", icon: "💊", basePrice: 1280, isIndian: true },
  "APOLLOHOSP.NS": { name: "Apollo Hospitals", sector: "Healthcare", industry: "Hospitals", country: "IN", icon: "🏥", basePrice: 5500, isIndian: true },
  "DIVISLAB.NS": { name: "Divi's Laboratories", sector: "Healthcare", industry: "Pharmaceuticals", country: "IN", icon: "🧪", basePrice: 3800, isIndian: true },
  "GRASIM.NS": { name: "Grasim Industries", sector: "Materials", industry: "Cement", country: "IN", icon: "🏗️", basePrice: 2100, isIndian: true },
  "HINDALCO.NS": { name: "Hindalco Industries", sector: "Materials", industry: "Metals", country: "IN", icon: "🔩", basePrice: 520, isIndian: true },
  "INDUSINDBK.NS": { name: "IndusInd Bank", sector: "Financials", industry: "Banks", country: "IN", icon: "🏦", basePrice: 1420, isIndian: true },
  "BPCL.NS": { name: "Bharat Petroleum", sector: "Energy", industry: "Oil & Gas", country: "IN", icon: "⛽", basePrice: 580, isIndian: true },
  "TATACONSUM.NS": { name: "Tata Consumer Products", sector: "Consumer Defensive", industry: "Food Products", country: "IN", icon: "🍵", basePrice: 1050, isIndian: true },
  "BRITANNIA.NS": { name: "Britannia Industries", sector: "Consumer Defensive", industry: "Food Products", country: "IN", icon: "🍪", basePrice: 5200, isIndian: true },
  "PIDILITIND.NS": { name: "Pidilite Industries", sector: "Materials", industry: "Chemicals", country: "IN", icon: "🧪", basePrice: 2650, isIndian: true },
  "DABUR.NS": { name: "Dabur India Ltd.", sector: "Consumer Defensive", industry: "FMCG", country: "IN", icon: "🧴", basePrice: 540, isIndian: true },
  "GODREJCP.NS": { name: "Godrej Consumer Products", sector: "Consumer Defensive", industry: "FMCG", country: "IN", icon: "🧴", basePrice: 1180, isIndian: true },
  "HAVELLS.NS": { name: "Havells India Ltd.", sector: "Industrials", industry: "Electrical Equipment", country: "IN", icon: "💡", basePrice: 1450, isIndian: true },
  "SIEMENS.NS": { name: "Siemens India", sector: "Industrials", industry: "Electrical Equipment", country: "IN", icon: "⚙️", basePrice: 4800, isIndian: true },
  "ADANIPORTS.NS": { name: "Adani Ports", sector: "Industrials", industry: "Ports", country: "IN", icon: "🚢", basePrice: 1150, isIndian: true },
  "SONACOMS.NS": { name: "Sona BLW Precision Forgings", sector: "Consumer Cyclical", industry: "Auto Parts", country: "IN", icon: "⚙️", basePrice: 600, isIndian: true },
  "YESBANK.NS": { name: "Yes Bank Ltd.", sector: "Financials", industry: "Banks", country: "IN", icon: "🏦", basePrice: 20, isIndian: true },
  "IDFCFIRSTB.NS": { name: "IDFC First Bank", sector: "Financials", industry: "Banks", country: "IN", icon: "🏦", basePrice: 75, isIndian: true },
  "ZOMATO.NS": { name: "Zomato Ltd.", sector: "Technology", industry: "Food Delivery", country: "IN", icon: "🍕", basePrice: 180, isIndian: true },
  "PAYTM.NS": { name: "One97 Communications", sector: "Technology", industry: "Fintech", country: "IN", icon: "📱", basePrice: 650, isIndian: true },
};

// Short aliases for Indian stocks
const ALIASES = {
  RELIANCE: "RELIANCE.NS", TCS: "TCS.NS", INFY: "INFY.NS", HDFCBANK: "HDFCBANK.NS",
  ICICIBANK: "ICICIBANK.NS", SBIN: "SBIN.NS", BHARTIARTL: "BHARTIARTL.NS", ITC: "ITC.NS",
  HINDUNILVR: "HINDUNILVR.NS", LT: "LT.NS", KOTAKBANK: "KOTAKBANK.NS", AXISBANK: "AXISBANK.NS",
  WIPRO: "WIPRO.NS", HCLTECH: "HCLTECH.NS", TATAMOTORS: "TATAMOTORS.NS", MARUTI: "MARUTI.NS",
  SUNPHARMA: "SUNPHARMA.NS", BAJFINANCE: "BAJFINANCE.NS", TITAN: "TITAN.NS", ADANIENT: "ADANIENT.NS",
  ASIANPAINT: "ASIANPAINT.NS", NTPC: "NTPC.NS", POWERGRID: "POWERGRID.NS", ONGC: "ONGC.NS",
  COALINDIA: "COALINDIA.NS", TATASTEEL: "TATASTEEL.NS", JSWSTEEL: "JSWSTEEL.NS", ULTRACEMCO: "ULTRACEMCO.NS",
  NESTLEIND: "NESTLEIND.NS", TECHM: "TECHM.NS", HEROMOTOCO: "HEROMOTOCO.NS", DRREDDY: "DRREDDY.NS",
  CIPLA: "CIPLA.NS", APOLLOHOSP: "APOLLOHOSP.NS", SONACOMS: "SONACOMS.NS", YESBANK: "YESBANK.NS",
  ZOMATO: "ZOMATO.NS", PAYTM: "PAYTM.NS",
};

function resolveSymbol(sym) {
  const u = sym.toUpperCase();
  return ALIASES[u] || u;
}

function getStockInfo(sym) {
  const resolved = resolveSymbol(sym);
  return STOCKS[resolved] || null;
}

function searchStocks(query, category) {
  const q = query.toLowerCase();
  return Object.entries(STOCKS)
    .filter(([sym, s]) => {
      const matchQuery = !q || sym.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q);
      const matchCat = !category || (category === "IN" ? s.isIndian : !s.isIndian);
      return matchQuery && matchCat;
    })
    .map(([symbol, s]) => ({ symbol, ...s }));
}

module.exports = { STOCKS, ALIASES, resolveSymbol, getStockInfo, searchStocks };
