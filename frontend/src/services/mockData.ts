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
