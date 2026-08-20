import React from 'react';
import { NiftyTrendingStock } from '../../types/stock';

interface GainersTableProps {
  stocks: NiftyTrendingStock[];
  onSelectStock: (symbol: string) => void;
  limit?: number;
}

export const GainersTable: React.FC<GainersTableProps> = ({
  stocks,
  onSelectStock,
  limit = 5
}) => {
  const gainers = [...stocks]
    .filter(s => s.daily_change_percentage > 0)
    .sort((a, b) => b.daily_change_percentage - a.daily_change_percentage)
    .slice(0, limit);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-[#1E293B]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Top Gainers
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            ▲ Advancing
          </span>
        </div>

        {/* Table list */}
        {gainers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No advancing securities in current session.
          </div>
        ) : (
          <div className="space-y-1.5">
            {gainers.map((stk, idx) => (
              <div
                key={stk.symbol}
                onClick={() => onSelectStock(stk.symbol)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center border border-emerald-500/20">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-mono font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                      {stk.symbol}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[110px] sm:max-w-[130px]">
                      {stk.company_name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    ₹{stk.current_price.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center justify-end gap-1">
                    <span>+{stk.daily_change.toFixed(2)}</span>
                    <span>(+{stk.daily_change_percentage.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 text-[10px] text-slate-400 font-mono text-right border-t border-slate-100 dark:border-[#1E293B] mt-2">
        Click row to inspect forecast
      </div>
    </div>
  );
};
