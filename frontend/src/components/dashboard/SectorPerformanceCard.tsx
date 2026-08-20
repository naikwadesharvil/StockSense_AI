import React from 'react';
import { NiftyTrendingStock } from '../../types/stock';

interface SectorPerformanceCardProps {
  stocks: NiftyTrendingStock[];
  onSectorClick?: (sector: string) => void;
}

export const SectorPerformanceCard: React.FC<SectorPerformanceCardProps> = ({
  stocks,
  onSectorClick
}) => {
  // Aggregate real sector returns
  const sectorMap = new Map<string, { totalPct: number; count: number; symbols: string[] }>();

  stocks.forEach(stock => {
    const sec = stock.sector || 'General';
    const existing = sectorMap.get(sec) || { totalPct: 0, count: 0, symbols: [] };
    existing.totalPct += stock.daily_change_percentage;
    existing.count += 1;
    existing.symbols.push(stock.symbol);
    sectorMap.set(sec, existing);
  });

  const sectorList = Array.from(sectorMap.entries()).map(([sector, data]) => {
    const avgPct = Number((data.totalPct / data.count).toFixed(2));
    return {
      sector,
      avgPct,
      count: data.count,
      symbols: data.symbols
    };
  });

  // Sort descending by avg percentage return
  sectorList.sort((a, b) => b.avgPct - a.avgPct);

  const maxAbsPct = Math.max(...sectorList.map(s => Math.abs(s.avgPct)), 1.5);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-[#1E293B]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sector Performance
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {sectorList.length} Sectors
          </span>
        </div>

        {/* Horizontal Bars List */}
        <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
          {sectorList.map(item => {
            const isPositive = item.avgPct >= 0;
            const barWidth = Math.min(100, (Math.abs(item.avgPct) / maxAbsPct) * 100);

            return (
              <div
                key={item.sector}
                onClick={() => onSectorClick?.(item.sector)}
                className="group cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {item.sector}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({item.count})
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}{item.avgPct.toFixed(2)}%
                  </span>
                </div>

                {/* Performance progress bar */}
                <div className="w-full bg-slate-100 dark:bg-[#0B0F17] h-1.5 rounded-full overflow-hidden border border-transparent dark:border-[#1E293B]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPositive
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : 'bg-gradient-to-r from-rose-500 to-rose-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 text-[10px] text-slate-400 font-mono text-right border-t border-slate-100 dark:border-[#1E293B] mt-2">
        Real-time constituent market average
      </div>
    </div>
  );
};
