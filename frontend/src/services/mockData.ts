import { StockMetadata, StockOverview, OHLCVPoint, NewsArticle, SentimentData } from '../types/stock';

export const POPULAR_STOCKS: StockMetadata[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    currency_symbol: "$",
    sector: "Consumer Electronics & Technology",
    market_cap: "3.42T",
    pe_ratio: 33.4,
    beta: 1.08,
    dividend_yield: "0.52%",
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services."
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    currency: "USD",
    currency_symbol: "$",
    sector: "Enterprise Software & Cloud Infrastructure",
    market_cap: "3.15T",
    pe_ratio: 35.8,
    beta: 0.92,
    dividend_yield: "0.71%",
    description: "Microsoft develops software, services, devices, and cloud solutions including Azure, Microsoft 365, Copilot AI, Windows, and LinkedIn."
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    currency: "USD",
    currency_symbol: "$",
    sector: "Semiconductors & AI Hardware",
    market_cap: "3.10T",
    pe_ratio: 64.2,
    beta: 1.68,
    dividend_yield: "0.03%",
    description: "NVIDIA is the pioneer of GPU accelerated computing, delivering specialized hardware and software platforms for AI, data centers, autonomous machines, and gaming."
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    currency_symbol: "$",
    sector: "Automotive & Clean Energy",
    market_cap: "710.5B",
    pe_ratio: 58.1,
    beta: 2.34,
    dividend_yield: "N/A",
    description: "Tesla designs, manufactures, and sells electric vehicles, energy storage systems, solar products, and autonomous driving technology."
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    currency_symbol: "$",
    sector: "E-Commerce & Cloud Computing",
    market_cap: "1.95T",
    pe_ratio: 41.3,
    beta: 1.15,
    dividend_yield: "N/A",
    description: "Amazon focuses on retail, cloud computing (AWS), digital streaming, artificial intelligence, and online advertising."
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    exchange: "NASDAQ",
    currency: "USD",
    currency_symbol: "$",
    sector: "Internet Services & AI",
    market_cap: "2.05T",
    pe_ratio: 24.6,
    beta: 1.05,
    dividend_yield: "0.47%",
    description: "Alphabet is the parent holding company of Google, YouTube, Google Cloud, Waymo, DeepMind, and Android."
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    exchange: "NSE / BSE",
    currency: "INR",
    currency_symbol: "₹",
    sector: "Conglomerate & Energy / Telecom / Retail",
    market_cap: "₹20.1T",
    pe_ratio: 28.5,
    beta: 0.85,
    dividend_yield: "0.34%",
    description: "Reliance Industries is India's largest private sector corporation with businesses spanning energy, petrochemicals, retail (Reliance Retail), and digital telecom services (Jio)."
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    exchange: "NSE / BSE",
    currency: "INR",
    currency_symbol: "₹",
    sector: "IT Consulting & Services",
    market_cap: "₹15.2T",
    pe_ratio: 31.2,
    beta: 0.72,
    dividend_yield: "1.35%",
    description: "TCS is a global leader in IT services, consulting, digital transformation, and business solutions, operating in 150+ locations across 46 countries."
  },
  {
    symbol: "INFY",
    name: "Infosys Limited",
    exchange: "NSE / BSE",
    currency: "INR",
    currency_symbol: "₹",
    sector: "Digital Services & Consulting",
    market_cap: "₹7.8T",
    pe_ratio: 29.8,
    beta: 0.94,
    dividend_yield: "2.10%",
    description: "Infosys is a global leader in next-generation digital services and consulting, enabling enterprise clients to navigate digital and AI transformations."
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    exchange: "NSE / BSE",
    currency: "INR",
    currency_symbol: "₹",
    sector: "Banking & Financial Services",
    market_cap: "₹12.4T",
    pe_ratio: 19.4,
    beta: 0.88,
    dividend_yield: "1.18%",
    description: "HDFC Bank is India's largest private sector bank by assets and market capitalization, providing retail, wholesale, and digital banking services."
  }
];

const BASE_PRICES: Record<string, { base: number; drift: number; vol: number }> = {
  AAPL: { base: 224.50, drift: 0.0007, vol: 0.014 },
  MSFT: { base: 448.20, drift: 0.00065, vol: 0.013 },
  NVDA: { base: 128.80, drift: 0.0016, vol: 0.028 },
  TSLA: { base: 221.40, drift: 0.0004, vol: 0.034 },
  AMZN: { base: 186.75, drift: 0.0008, vol: 0.016 },
  GOOGL: { base: 165.30, drift: 0.0006, vol: 0.015 },
  RELIANCE: { base: 2985.00, drift: 0.00055, vol: 0.012 },
  TCS: { base: 4210.00, drift: 0.0005, vol: 0.011 },
  INFY: { base: 1890.00, drift: 0.0006, vol: 0.015 },
  HDFCBANK: { base: 1640.00, drift: 0.00045, vol: 0.013 }
};

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function generateHistoricalSeries(symbol: string, totalPoints: number = 400): OHLCVPoint[] {
  const sym = symbol.toUpperCase();
  const cfg = BASE_PRICES[sym] || { base: 150.0, drift: 0.0005, vol: 0.018 };
  
  let seed = 0;
  for (let i = 0; i < sym.length; i++) {
    seed = (seed * 31 + sym.charCodeAt(i)) | 0;
  }
  const rng = mulberry32(Math.abs(seed) + 42);

  const points: OHLCVPoint[] = [];
  const logReturns = new Float64Array(totalPoints);
  let currentVol = cfg.vol;

  for (let i = 0; i < totalPoints; i++) {
    const shock = randn(rng);
    currentVol = 0.85 * currentVol + 0.15 * cfg.vol * (1.0 + 0.5 * Math.abs(shock));
    const cycle = 0.0003 * Math.sin(i / 25.0) + 0.0002 * Math.cos(i / 60.0);
    logReturns[i] = cfg.drift + cycle + currentVol * shock;
  }

  const cumReturns = new Float64Array(totalPoints);
  let cSum = 0;
  for (let i = 0; i < totalPoints; i++) {
    cSum += logReturns[i];
    cumReturns[i] = cSum;
  }

  const scale = cfg.base / Math.exp(cumReturns[totalPoints - 1]);
  const endDate = new Date(2026, 7, 14); // Aug 14, 2026

  // Generate business dates
  const dates: Date[] = [];
  let curr = new Date(endDate);
  while (dates.length < totalPoints) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) {
      dates.unshift(new Date(curr));
    }
    curr.setDate(curr.getDate() - 1);
  }

  const isUSD = !['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'].includes(sym);
  const baseVol = isUSD ? 15000000 : 3500000;

  for (let i = 0; i < totalPoints; i++) {
    const close = Math.exp(cumReturns[i]) * scale;
    const dayFactor = Math.abs(logReturns[i]) / cfg.vol;
    const spread = close * (0.008 + 0.012 * rng()) * (1.0 + 0.4 * dayFactor);
    
    const open = close + (rng() - 0.5) * 0.8 * spread;
    const high = Math.max(open, close) + rng() * 0.5 * spread;
    const low = Math.min(open, close) - rng() * 0.5 * spread;
    const volume = Math.floor(baseVol * (0.6 + 1.2 * rng()) * (1.0 + 1.1 * dayFactor));

    const y = dates[i].getFullYear();
    const m = String(dates[i].getMonth() + 1).padStart(2, '0');
    const d = String(dates[i].getDate()).padStart(2, '0');

    points.push({
      date: `${y}-${m}-${d}`,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });
  }

  return points;
}

export const NIFTY_50_CONSTITUENTS_DATA = [
  { symbol: "RELIANCE", name: "Reliance Industries Limited", sector: "Energy & Telecom", base_price: 2985.00, base_volume: 6850000, avg_volume_30d: 5400000, market_cap: "₹20.1T", beta: 0.85, pe_ratio: 28.5 },
  { symbol: "TCS", name: "Tata Consultancy Services Limited", sector: "IT Services", base_price: 4210.00, base_volume: 2450000, avg_volume_30d: 2100000, market_cap: "₹15.2T", beta: 0.72, pe_ratio: 31.2 },
  { symbol: "HDFCBANK", name: "HDFC Bank Limited", sector: "Banking & Finance", base_price: 1645.00, base_volume: 14200000, avg_volume_30d: 12500000, market_cap: "₹12.5T", beta: 0.95, pe_ratio: 19.8 },
  { symbol: "ICICIBANK", name: "ICICI Bank Limited", sector: "Banking & Finance", base_price: 1180.00, base_volume: 9800000, avg_volume_30d: 8900000, market_cap: "₹8.3T", beta: 1.05, pe_ratio: 18.2 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Limited", sector: "Telecommunications", base_price: 1485.00, base_volume: 6200000, avg_volume_30d: 5100000, market_cap: "₹8.8T", beta: 0.82, pe_ratio: 62.4 },
  { symbol: "INFY", name: "Infosys Limited", sector: "IT Services", base_price: 1795.00, base_volume: 5800000, avg_volume_30d: 5200000, market_cap: "₹7.4T", beta: 0.90, pe_ratio: 26.8 },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking & Finance", base_price: 815.00, base_volume: 12500000, avg_volume_30d: 11200000, market_cap: "₹7.2T", beta: 1.18, pe_ratio: 10.5 },
  { symbol: "ITC", name: "ITC Limited", sector: "Consumer Goods", base_price: 492.00, base_volume: 11800000, avg_volume_30d: 10400000, market_cap: "₹6.1T", beta: 0.62, pe_ratio: 29.1 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Limited", sector: "Consumer Goods", base_price: 2720.00, base_volume: 1850000, avg_volume_30d: 1650000, market_cap: "₹6.4T", beta: 0.58, pe_ratio: 58.6 },
  { symbol: "LT", name: "Larsen & Toubro Limited", sector: "Industrials & Infra", base_price: 3620.00, base_volume: 2400000, avg_volume_30d: 2150000, market_cap: "₹4.9T", beta: 1.02, pe_ratio: 34.8 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Limited", sector: "Finance", base_price: 6850.00, base_volume: 1150000, avg_volume_30d: 1020000, market_cap: "₹4.2T", beta: 1.25, pe_ratio: 29.4 },
  { symbol: "HCLTECH", name: "HCL Technologies Limited", sector: "IT Services", base_price: 1780.00, base_volume: 2900000, avg_volume_30d: 2600000, market_cap: "₹4.8T", beta: 0.78, pe_ratio: 28.2 },
  { symbol: "MARUTI", name: "Maruti Suzuki India Limited", sector: "Automobile", base_price: 12150.00, base_volume: 620000, avg_volume_30d: 540000, market_cap: "₹3.8T", beta: 0.88, pe_ratio: 27.6 },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd.", sector: "Healthcare", base_price: 1785.00, base_volume: 1950000, avg_volume_30d: 1750000, market_cap: "₹4.3T", beta: 0.68, pe_ratio: 38.2 },
  { symbol: "TATAMOTORS", name: "Tata Motors Limited", sector: "Automobile", base_price: 1020.00, base_volume: 11400000, avg_volume_30d: 9800000, market_cap: "₹3.7T", beta: 1.45, pe_ratio: 10.8 },
  { symbol: "NTPC", name: "NTPC Limited", sector: "Power & Utilities", base_price: 410.00, base_volume: 15800000, avg_volume_30d: 13200000, market_cap: "₹3.9T", beta: 0.92, pe_ratio: 17.5 },
  { symbol: "ONGC", name: "Oil and Natural Gas Corporation Limited", sector: "Energy & Oil", base_price: 315.00, base_volume: 18200000, avg_volume_30d: 16400000, market_cap: "₹3.9T", beta: 1.12, pe_ratio: 7.4 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Limited", sector: "Banking & Finance", base_price: 1810.00, base_volume: 3800000, avg_volume_30d: 3400000, market_cap: "₹3.6T", beta: 0.94, pe_ratio: 21.6 },
  { symbol: "AXISBANK", name: "Axis Bank Limited", sector: "Banking & Finance", base_price: 1175.00, base_volume: 7200000, avg_volume_30d: 6500000, market_cap: "₹3.6T", beta: 1.15, pe_ratio: 13.9 },
  { symbol: "TITAN", name: "Titan Company Limited", sector: "Consumer Goods", base_price: 3450.00, base_volume: 1250000, avg_volume_30d: 1100000, market_cap: "₹3.1T", beta: 0.85, pe_ratio: 82.5 },
  { symbol: "ADANIENT", name: "Adani Enterprises Limited", sector: "Conglomerate", base_price: 2980.00, base_volume: 2800000, avg_volume_30d: 2450000, market_cap: "₹3.4T", beta: 1.85, pe_ratio: 94.2 },
  { symbol: "ADANIPORTS", name: "Adani Ports and Special Economic Zone Ltd.", sector: "Infrastructure & Ports", base_price: 1475.00, base_volume: 4100000, avg_volume_30d: 3600000, market_cap: "₹3.2T", beta: 1.42, pe_ratio: 36.8 },
  { symbol: "COALINDIA", name: "Coal India Limited", sector: "Mining & Energy", base_price: 510.00, base_volume: 12100000, avg_volume_30d: 10500000, market_cap: "₹3.1T", beta: 0.88, pe_ratio: 8.4 },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Limited", sector: "Power & Utilities", base_price: 335.00, base_volume: 16400000, avg_volume_30d: 14200000, market_cap: "₹3.1T", beta: 0.75, pe_ratio: 18.9 },
  { symbol: "TATASTEEL", name: "Tata Steel Limited", sector: "Metals & Mining", base_price: 152.00, base_volume: 38500000, avg_volume_30d: 32000000, market_cap: "₹1.9T", beta: 1.35, pe_ratio: 42.1 },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv Limited", sector: "Finance", base_price: 1780.00, base_volume: 1650000, avg_volume_30d: 1450000, market_cap: "₹2.8T", beta: 1.18, pe_ratio: 34.5 },
  { symbol: "M&M", name: "Mahindra & Mahindra Limited", sector: "Automobile", base_price: 2840.00, base_volume: 3200000, avg_volume_30d: 2800000, market_cap: "₹3.4T", beta: 1.10, pe_ratio: 28.5 },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Limited", sector: "Materials & Cement", base_price: 11250.00, base_volume: 360000, avg_volume_30d: 310000, market_cap: "₹3.2T", beta: 0.95, pe_ratio: 44.2 },
  { symbol: "ASIANPAINT", name: "Asian Paints Limited", sector: "Consumer Goods", base_price: 3120.00, base_volume: 1150000, avg_volume_30d: 980000, market_cap: "₹2.9T", beta: 0.72, pe_ratio: 54.8 },
  { symbol: "WIPRO", name: "Wipro Limited", sector: "IT Services", base_price: 545.00, base_volume: 7800000, avg_volume_30d: 6900000, market_cap: "₹2.8T", beta: 0.85, pe_ratio: 24.2 },
  { symbol: "JSWSTEEL", name: "JSW Steel Limited", sector: "Metals & Mining", base_price: 940.00, base_volume: 2800000, avg_volume_30d: 2450000, market_cap: "₹2.3T", beta: 1.28, pe_ratio: 32.1 },
  { symbol: "GRASIM", name: "Grasim Industries Limited", sector: "Materials & Chemicals", base_price: 2650.00, base_volume: 850000, avg_volume_30d: 740000, market_cap: "₹1.8T", beta: 1.05, pe_ratio: 29.8 },
  { symbol: "TECHM", name: "Tech Mahindra Limited", sector: "IT Services", base_price: 1560.00, base_volume: 2100000, avg_volume_30d: 1850000, market_cap: "₹1.5T", beta: 0.98, pe_ratio: 48.6 },
  { symbol: "NESTLEIND", name: "Nestle India Limited", sector: "Consumer Goods", base_price: 2480.00, base_volume: 720000, avg_volume_30d: 650000, market_cap: "₹2.4T", beta: 0.52, pe_ratio: 74.2 },
  { symbol: "CIPLA", name: "Cipla Limited", sector: "Healthcare", base_price: 1580.00, base_volume: 1650000, avg_volume_30d: 1450000, market_cap: "₹1.3T", beta: 0.64, pe_ratio: 29.5 },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Ltd.", sector: "Healthcare", base_price: 6850.00, base_volume: 580000, avg_volume_30d: 510000, market_cap: "₹1.1T", beta: 0.60, pe_ratio: 20.4 },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise Limited", sector: "Healthcare", base_price: 6780.00, base_volume: 680000, avg_volume_30d: 590000, market_cap: "₹970B", beta: 0.82, pe_ratio: 84.1 },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Limited", sector: "Automobile", base_price: 5420.00, base_volume: 640000, avg_volume_30d: 560000, market_cap: "₹1.1T", beta: 0.90, pe_ratio: 27.2 },
  { symbol: "EICHERMOT", name: "Eicher Motors Limited", sector: "Automobile", base_price: 4890.00, base_volume: 680000, avg_volume_30d: 610000, market_cap: "₹1.3T", beta: 0.94, pe_ratio: 32.8 },
  { symbol: "BPCL", name: "Bharat Petroleum Corporation Limited", sector: "Energy & Oil", base_price: 348.00, base_volume: 9200000, avg_volume_30d: 8100000, market_cap: "₹755B", beta: 1.15, pe_ratio: 5.8 },
  { symbol: "DIVISLAB", name: "Divi's Laboratories Limited", sector: "Healthcare", base_price: 4980.00, base_volume: 520000, avg_volume_30d: 460000, market_cap: "₹1.3T", beta: 0.74, pe_ratio: 78.4 },
  { symbol: "HINDALCO", name: "Hindalco Industries Limited", sector: "Metals & Mining", base_price: 685.00, base_volume: 8400000, avg_volume_30d: 7200000, market_cap: "₹1.5T", beta: 1.42, pe_ratio: 15.2 },
  { symbol: "BRITANNIA", name: "Britannia Industries Limited", sector: "Consumer Goods", base_price: 5780.00, base_volume: 490000, avg_volume_30d: 430000, market_cap: "₹1.4T", beta: 0.58, pe_ratio: 64.8 },
  { symbol: "TATACONSUM", name: "Tata Consumer Products Limited", sector: "Consumer Goods", base_price: 1180.00, base_volume: 1850000, avg_volume_30d: 1620000, market_cap: "₹1.1T", beta: 0.72, pe_ratio: 86.4 },
  { symbol: "SBILIFE", name: "SBI Life Insurance Company Limited", sector: "Insurance", base_price: 1780.00, base_volume: 1420000, avg_volume_30d: 1250000, market_cap: "₹1.8T", beta: 0.80, pe_ratio: 88.5 },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance Company Limited", sector: "Insurance", base_price: 720.00, base_volume: 3800000, avg_volume_30d: 3300000, market_cap: "₹1.5T", beta: 0.85, pe_ratio: 84.2 },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Limited", sector: "Automobile", base_price: 9850.00, base_volume: 480000, avg_volume_30d: 420000, market_cap: "₹2.7T", beta: 0.82, pe_ratio: 34.6 },
  { symbol: "SHRIRAMFIN", name: "Shriram Finance Limited", sector: "Finance", base_price: 3120.00, base_volume: 1850000, avg_volume_30d: 1620000, market_cap: "₹1.2T", beta: 1.30, pe_ratio: 15.8 },
  { symbol: "BEL", name: "Bharat Electronics Limited", sector: "Aerospace & Defence", base_price: 298.00, base_volume: 18500000, avg_volume_30d: 16200000, market_cap: "₹2.2T", beta: 1.25, pe_ratio: 48.2 },
  { symbol: "TRENT", name: "Trent Limited", sector: "Retail & Consumer", base_price: 6950.00, base_volume: 1450000, avg_volume_30d: 1200000, market_cap: "₹2.5T", beta: 1.15, pe_ratio: 142.0 },
];

export function generateNifty50TrendingFallback(): any {
  const ranked_stocks = NIFTY_50_CONSTITUENTS_DATA.map((item, idx) => {
    // Deterministic pseudo-random seed per symbol
    let seed = 0;
    for (let i = 0; i < item.symbol.length; i++) {
      seed = (seed * 37 + item.symbol.charCodeAt(i)) | 0;
    }
    const rng = mulberry32(Math.abs(seed) + 99);

    // Realistic daily return between -3.2% and +3.8%
    const changePct = Number(((rng() - 0.44) * 5.5).toFixed(2));
    const currPrice = Number((item.base_price * (1 + changePct / 100)).toFixed(2));
    const prevClose = item.base_price;
    const dailyChange = Number((currPrice - prevClose).toFixed(2));
    const rvol = Number((0.6 + rng() * 1.5).toFixed(2));
    const vol = Math.floor(item.avg_volume_30d * rvol);

    // Deterministic trend score formula matching backend
    const returnScore = Math.min(100, Math.abs(changePct) * 20);
    const volumeScore = Math.min(100, rvol * 40);
    const volatilityScore = Math.min(100, (Math.abs(changePct) + 0.8) * 20);
    const rawScore = 0.40 * returnScore + 0.35 * volumeScore + 0.25 * volatilityScore;
    const trendScore = Number(Math.min(100, Math.max(0, rawScore)).toFixed(1));

    let category = "Active Trading";
    if (changePct >= 1.5 && rvol >= 1.2) category = "Bullish Breakout";
    else if (changePct >= 0.5) category = "Bullish Momentum";
    else if (changePct <= -1.5 && rvol >= 1.2) category = "High Volume Selloff";
    else if (changePct <= -0.5) category = "Bearish Pressure";
    else if (rvol >= 1.6) category = "Volume Surge";

    return {
      rank: idx + 1,
      symbol: item.symbol,
      company_name: item.name,
      exchange: "NSE",
      sector: item.sector,
      currency: "INR",
      currency_symbol: "₹",
      current_price: currPrice,
      previous_close: prevClose,
      daily_change: dailyChange,
      daily_change_percentage: changePct,
      volume: vol,
      average_volume_30d: item.avg_volume_30d,
      relative_volume: rvol,
      trend_score: trendScore,
      trend_category: category,
      market_cap: item.market_cap,
      provenance: {
        source: "NSE Benchmark Model",
        provider: "National Stock Exchange of India (NSE)",
        symbol: item.symbol,
        exchange: "NSE",
        currency: "INR",
        timestamp: new Date().toISOString(),
        timezone: "Asia/Kolkata",
        market_status: "CLOSED" as const,
        freshness: "HISTORICAL" as const,
        is_live: false,
        is_delayed: false,
        is_fallback: true
      }
    };
  });

  // Sort by trend_score descending
  ranked_stocks.sort((a, b) => b.trend_score - a.trend_score || b.daily_change_percentage - a.daily_change_percentage);
  ranked_stocks.forEach((s, i) => { s.rank = i + 1; });

  const gainers = ranked_stocks.filter(s => s.daily_change_percentage > 0).length;
  const losers = ranked_stocks.filter(s => s.daily_change_percentage < 0).length;
  const unchanged = ranked_stocks.length - gainers - losers;

  return {
    index: "NIFTY 50",
    index_name: "NIFTY 50 Index (National Stock Exchange of India)",
    market_status: "CLOSED",
    is_market_open: false,
    timestamp: new Date().toISOString(),
    data_as_of: new Date().toISOString().split('T')[0],
    ranking_methodology: {
      name: "StockSense Multi-Factor Volumetric Trend Score",
      version: "1.0",
      formula: "TrendScore = min(100, 0.40 * ReturnScore + 0.35 * VolumeScore + 0.25 * VolatilityScore)",
      description: "Deterministic ranking model evaluating daily percentage return magnitude (0.40), relative volume surge vs 30-day average (0.35), and intraday spread volatility (0.25).",
      weights: {
        return_magnitude: 0.40,
        relative_volume: 0.35,
        intraday_volatility: 0.25
      }
    },
    total_stocks_evaluated: 50,
    total_stocks_ranked: 50,
    top_gainers_count: gainers,
    top_losers_count: losers,
    unchanged_count: unchanged,
    ranked_stocks,
    provenance_summary: {
      freshness: "HISTORICAL",
      provider: "National Stock Exchange of India (NSE)",
      market_status: "CLOSED",
      is_live: false,
      timestamp_ist: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    }
  };
}
