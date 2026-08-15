/**
 * StockSense AI - Static Security Identity Registry (Frontend)
 * Provides identity metadata, country/exchange tags, and ranked local autocomplete.
 */

export interface SecurityItem {
  symbol: string;
  company_name: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  currency_symbol: string;
  sector: string;
  provider_symbol: string;
}

export const VERIFIED_SECURITIES: SecurityItem[] = [
  // US Equities (NASDAQ)
  { symbol: 'AAPL', company_name: 'Apple Inc.', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'AAPL' },
  { symbol: 'MSFT', company_name: 'Microsoft Corporation', name: 'Microsoft Corporation', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'MSFT' },
  { symbol: 'NVDA', company_name: 'NVIDIA Corporation', name: 'NVIDIA Corporation', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'NVDA' },
  { symbol: 'TSLA', company_name: 'Tesla, Inc.', name: 'Tesla, Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Automobile', provider_symbol: 'TSLA' },
  { symbol: 'AMZN', company_name: 'Amazon.com, Inc.', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Consumer Discretionary', provider_symbol: 'AMZN' },
  { symbol: 'GOOGL', company_name: 'Alphabet Inc. (Google)', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'GOOGL' },
  { symbol: 'META', company_name: 'Meta Platforms, Inc.', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'META' },
  { symbol: 'NFLX', company_name: 'Netflix, Inc.', name: 'Netflix, Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Communication Services', provider_symbol: 'NFLX' },
  { symbol: 'AMD', company_name: 'Advanced Micro Devices, Inc.', name: 'Advanced Micro Devices', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'AMD' },
  { symbol: 'AVGO', company_name: 'Broadcom Inc.', name: 'Broadcom Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'AVGO' },
  { symbol: 'COST', company_name: 'Costco Wholesale Corporation', name: 'Costco Wholesale', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Consumer Staples', provider_symbol: 'COST' },
  { symbol: 'INTC', company_name: 'Intel Corporation', name: 'Intel Corporation', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'INTC' },
  { symbol: 'QCOM', company_name: 'Qualcomm Incorporated', name: 'Qualcomm Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'QCOM' },
  { symbol: 'ADBE', company_name: 'Adobe Inc.', name: 'Adobe Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Technology', provider_symbol: 'ADBE' },

  // US Equities (NYSE)
  { symbol: 'JPM', company_name: 'JPMorgan Chase & Co.', name: 'JPMorgan Chase', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Banking & Finance', provider_symbol: 'JPM' },
  { symbol: 'BAC', company_name: 'Bank of America Corporation', name: 'Bank of America', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Banking & Finance', provider_symbol: 'BAC' },
  { symbol: 'V', company_name: 'Visa Inc.', name: 'Visa Inc.', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Finance', provider_symbol: 'V' },
  { symbol: 'MA', company_name: 'Mastercard Incorporated', name: 'Mastercard Inc.', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Finance', provider_symbol: 'MA' },
  { symbol: 'WMT', company_name: 'Walmart Inc.', name: 'Walmart Inc.', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Consumer Staples', provider_symbol: 'WMT' },
  { symbol: 'DIS', company_name: 'The Walt Disney Company', name: 'The Walt Disney Company', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Communication Services', provider_symbol: 'DIS' },
  { symbol: 'KO', company_name: 'The Coca-Cola Company', name: 'The Coca-Cola Company', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Consumer Staples', provider_symbol: 'KO' },
  { symbol: 'JNJ', company_name: 'Johnson & Johnson', name: 'Johnson & Johnson', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Healthcare', provider_symbol: 'JNJ' },
  { symbol: 'PFE', company_name: 'Pfizer Inc.', name: 'Pfizer Inc.', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Healthcare', provider_symbol: 'PFE' },
  { symbol: 'LLY', company_name: 'Eli Lilly and Company', name: 'Eli Lilly', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Healthcare', provider_symbol: 'LLY' },
  { symbol: 'UNH', company_name: 'UnitedHealth Group Incorporated', name: 'UnitedHealth Group', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Healthcare', provider_symbol: 'UNH' },
  { symbol: 'XOM', company_name: 'Exxon Mobil Corporation', name: 'ExxonMobil', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Energy', provider_symbol: 'XOM' },
  { symbol: 'CVX', company_name: 'Chevron Corporation', name: 'Chevron Corporation', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Energy', provider_symbol: 'CVX' },
  { symbol: 'CAT', company_name: 'Caterpillar Inc.', name: 'Caterpillar Inc.', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Industrials', provider_symbol: 'CAT' },
  { symbol: 'BA', company_name: 'The Boeing Company', name: 'The Boeing Company', exchange: 'NYSE', country: 'US', currency: 'USD', currency_symbol: '$', sector: 'Industrials', provider_symbol: 'BA' },

  // Indian Equities (NSE)
  { symbol: 'RELIANCE', company_name: 'Reliance Industries Limited', name: 'Reliance Industries', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Energy & Telecom', provider_symbol: 'RELIANCE.NS' },
  { symbol: 'TCS', company_name: 'Tata Consultancy Services Limited', name: 'Tata Consultancy Services', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'IT Services', provider_symbol: 'TCS.NS' },
  { symbol: 'INFY', company_name: 'Infosys Limited', name: 'Infosys Limited', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'IT Services', provider_symbol: 'INFY.NS' },
  { symbol: 'HDFCBANK', company_name: 'HDFC Bank Limited', name: 'HDFC Bank', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Banking & Finance', provider_symbol: 'HDFCBANK.NS' },
  { symbol: 'ICICIBANK', company_name: 'ICICI Bank Limited', name: 'ICICI Bank', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Banking & Finance', provider_symbol: 'ICICIBANK.NS' },
  { symbol: 'SBIN', company_name: 'State Bank of India', name: 'State Bank of India', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Banking & Finance', provider_symbol: 'SBIN.NS' },
  { symbol: 'KOTAKBANK', company_name: 'Kotak Mahindra Bank Limited', name: 'Kotak Mahindra Bank', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Banking & Finance', provider_symbol: 'KOTAKBANK.NS' },
  { symbol: 'AXISBANK', company_name: 'Axis Bank Limited', name: 'Axis Bank', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Banking & Finance', provider_symbol: 'AXISBANK.NS' },
  { symbol: 'BHARTIARTL', company_name: 'Bharti Airtel Limited', name: 'Bharti Airtel', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Telecommunications', provider_symbol: 'BHARTIARTL.NS' },
  { symbol: 'ITC', company_name: 'ITC Limited', name: 'ITC Limited', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Consumer Goods', provider_symbol: 'ITC.NS' },
  { symbol: 'HINDUNILVR', company_name: 'Hindustan Unilever Limited', name: 'Hindustan Unilever', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Consumer Goods', provider_symbol: 'HINDUNILVR.NS' },
  { symbol: 'LT', company_name: 'Larsen & Toubro Limited', name: 'Larsen & Toubro', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Industrials & Infra', provider_symbol: 'LT.NS' },
  { symbol: 'MARUTI', company_name: 'Maruti Suzuki India Limited', name: 'Maruti Suzuki', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Automobile', provider_symbol: 'MARUTI.NS' },
  { symbol: 'TATAMOTORS', company_name: 'Tata Motors Limited', name: 'Tata Motors', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Automobile', provider_symbol: 'TATAMOTORS.NS' },
  { symbol: 'SUNPHARMA', company_name: 'Sun Pharmaceutical Industries Ltd.', name: 'Sun Pharma', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Healthcare', provider_symbol: 'SUNPHARMA.NS' },
  { symbol: 'BAJFINANCE', company_name: 'Bajaj Finance Limited', name: 'Bajaj Finance', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Finance', provider_symbol: 'BAJFINANCE.NS' },
  { symbol: 'WIPRO', company_name: 'Wipro Limited', name: 'Wipro Limited', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'IT Services', provider_symbol: 'WIPRO.NS' },
  { symbol: 'TITAN', company_name: 'Titan Company Limited', name: 'Titan Company', exchange: 'NSE', country: 'India', currency: 'INR', currency_symbol: '₹', sector: 'Consumer Goods', provider_symbol: 'TITAN.NS' }
];

export function searchLocalSecurities(query: string, limit: number = 12): SecurityItem[] {
  const q = query.trim().toUpperCase();
  if (!q) return VERIFIED_SECURITIES.slice(0, limit);

  const qLower = query.trim().toLowerCase();
  const scored: Array<{ score: number; item: SecurityItem }> = [];

  for (const item of VERIFIED_SECURITIES) {
    const sym = item.symbol;
    const compLower = item.company_name.toLowerCase();
    let score = 0;

    if (sym === q) score = 100;
    else if (compLower === qLower) score = 90;
    else if (sym.startsWith(q)) score = 80;
    else if (compLower.startsWith(qLower)) score = 70;
    else if (sym.includes(q) || compLower.includes(qLower)) score = 50;
    else if (item.sector.toLowerCase().includes(qLower)) score = 30;

    if (score > 0) {
      scored.push({ score, item });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.item.symbol.localeCompare(b.item.symbol));
  return scored.slice(0, limit).map(s => s.item);
}
