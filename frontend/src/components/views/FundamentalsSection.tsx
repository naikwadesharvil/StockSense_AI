import React from 'react';
import { CompanyFundamentals, StockOverview } from '../../types/stock';

interface FundamentalsSectionProps {
  overview: StockOverview;
}

export const FundamentalsSection: React.FC<FundamentalsSectionProps> = ({ overview }) => {
  const funds: CompanyFundamentals | undefined = overview.fundamentals;
  const currSym = overview.currency_symbol || '$';
  const dataAsOf = funds?.data_as_of || overview.data_as_of;

  const renderVal = (val: string | number | null | undefined, suffix: string = '', prefix: string = '') => {
    if (val === null || val === undefined || val === '' || val === 'N/A') {
      return <span className="text-slate-400 font-mono italic">N/A</span>;
    }
    return <span className="font-mono font-bold text-slate-900 dark:text-white">{prefix}{val}{suffix}</span>;
  };

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header with Title and As-of metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-[#1E293B]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Company Fundamentals & Valuation Metrics</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Verified Data
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key financial ratios, profitability, balance sheet metrics, and enterprise statistics.
          </p>
        </div>

        {dataAsOf && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-[#1E293B]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Data as of {dataAsOf}</span>
          </div>
        )}
      </div>

      {/* 4-Column Grid for Metrics Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Category 1: Valuation Multiples */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-100 dark:border-[#1E293B] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
            <span>Valuation Multiples</span>
            <span className="text-[10px] text-slate-400 font-mono">P/E & EV</span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Market Cap</span>
              {renderVal(funds?.market_cap || overview.market_cap)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Enterprise Value</span>
              {renderVal(funds?.enterprise_value)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Trailing P/E</span>
              {renderVal(funds?.pe_ratio || overview.pe_ratio)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Forward P/E</span>
              {renderVal(funds?.forward_pe)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">PEG Ratio</span>
              {renderVal(funds?.peg_ratio)}
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400">Price / Book</span>
              {renderVal(funds?.price_to_book)}
            </div>
          </div>
        </div>

        {/* Category 2: Profitability & Margins */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-100 dark:border-[#1E293B] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Profitability & Margins</span>
            <span className="text-[10px] text-slate-400 font-mono">TTM</span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Trailing EPS</span>
              {renderVal(funds?.eps, '', currSym)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Forward EPS</span>
              {renderVal(funds?.forward_eps, '', currSym)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Total Revenue</span>
              {renderVal(funds?.revenue)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Profit Margin</span>
              {renderVal(funds?.profit_margin)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Operating Margin</span>
              {renderVal(funds?.operating_margin)}
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400">Return on Equity (ROE)</span>
              {renderVal(funds?.return_on_equity)}
            </div>
          </div>
        </div>

        {/* Category 3: Financial Health & Cash Flow */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-100 dark:border-[#1E293B] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center justify-between">
            <span>Financial Health</span>
            <span className="text-[10px] text-slate-400 font-mono">Balance Sheet</span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Total Cash</span>
              {renderVal(funds?.total_cash)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Total Debt</span>
              {renderVal(funds?.total_debt)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Debt / Equity</span>
              {renderVal(funds?.debt_to_equity)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Current Ratio</span>
              {renderVal(funds?.current_ratio)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Free Cash Flow</span>
              {renderVal(funds?.free_cash_flow)}
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400">Operating Cash Flow</span>
              {renderVal(funds?.operating_cash_flow)}
            </div>
          </div>
        </div>

        {/* Category 4: Dividends & Market Statistics */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-100 dark:border-[#1E293B] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Dividends & Market Stats</span>
            <span className="text-[10px] text-slate-400 font-mono">Yield & Beta</span>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Dividend Yield</span>
              {renderVal(funds?.dividend_yield || overview.dividend_yield)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Dividend Rate</span>
              {renderVal(funds?.dividend_rate, '', currSym)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Payout Ratio</span>
              {renderVal(funds?.payout_ratio)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">Beta (Volatility)</span>
              {renderVal(funds?.beta || overview.beta)}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#1E293B]">
              <span className="text-slate-500 dark:text-slate-400">52-Week High</span>
              {renderVal(overview.week_52_high, '', currSym)}
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400">52-Week Low</span>
              {renderVal(overview.week_52_low, '', currSym)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
