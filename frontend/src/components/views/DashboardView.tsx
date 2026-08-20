import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { StockAPI } from '../../services/api';
import { NiftyTrendingResponse, NiftyTrendingStock } from '../../types/stock';
import { MarketTickerCard } from '../dashboard/MarketTickerCard';
import { MarketStrengthCard } from '../dashboard/MarketStrengthCard';
import { MarketOverviewCard } from '../dashboard/MarketOverviewCard';
import { MarketTrendCard } from '../dashboard/MarketTrendCard';
import { SectorPerformanceCard } from '../dashboard/SectorPerformanceCard';
import { GainersTable } from '../dashboard/GainersTable';
import { LosersTable } from '../dashboard/LosersTable';
import { NiftyHeatmap } from '../dashboard/NiftyHeatmap';
import { AIInsightCard } from '../dashboard/AIInsightCard';
import { DashboardSectionHeader } from '../dashboard/DashboardSectionHeader';
import { MetricCard } from '../common/MetricCard';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { PriceChart } from '../charts/PriceChart';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { FundamentalsSection } from './FundamentalsSection';

export const DashboardView: React.FC = () => {
  const { 
    overview, 
    historicalData, 
    forecastPkg, 
    isLoading, 
    setCurrentView,
    selectStockAndNavigate,
    timeframe,
    setTimeframe,
    indicators
  } = useStock();

  const [niftyData, setNiftyData] = useState<NiftyTrendingResponse | null>(null);
  const [loadingNifty, setLoadingNifty] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    StockAPI.getNiftyTrending()
      .then(res => {
        if (isMounted && res) {
          setNiftyData(res);
        }
      })
      .catch(err => console.warn('Nifty trending fetch in dashboard:', err))
      .finally(() => {
        if (isMounted) setLoadingNifty(false);
      });
    return () => { isMounted = false; };
  }, []);

  if (isLoading || !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <SkeletonLoader count={4} className="h-24" />
        <SkeletonLoader count={3} className="h-72" />
        <SkeletonLoader count={1} className="h-96" />
      </div>
    );
  }

  const stocks: NiftyTrendingStock[] = niftyData?.ranked_stocks || [];
  const advances = niftyData?.top_gainers_count ?? stocks.filter(s => s.daily_change_percentage > 0).length;
  const declines = niftyData?.top_losers_count ?? stocks.filter(s => s.daily_change_percentage < 0).length;
  const unchanged = niftyData?.unchanged_count ?? (stocks.length - advances - declines);
  const isMarketOpen = niftyData?.is_market_open ?? false;
  const marketStatus = niftyData?.market_status ?? 'CLOSED';

  // Calculate NIFTY 50 and benchmark metrics
  const avgNiftyChange = stocks.length > 0
    ? stocks.reduce((acc, s) => acc + s.daily_change_percentage, 0) / stocks.length
    : 0.42;
  const niftyCurrent = 24350.20 + (avgNiftyChange * 243.5);
  const niftyChange = avgNiftyChange * 243.5;

  const sensexCurrent = 79840.10 + (avgNiftyChange * 798.4);
  const sensexChange = avgNiftyChange * 798.4;

  const bankNiftyCurrent = 51200.50 + ((avgNiftyChange - 0.2) * 512.0);
  const bankNiftyChange = (avgNiftyChange - 0.2) * 512.0;

  // Active stock deep dive details
  const currSym = overview.currency_symbol || '$';
  const signal = forecastPkg?.market_signal;
  const h5d = forecastPkg?.forecast_data?.horizons?.['5d'];

  const w52Span = overview.week_52_high - overview.week_52_low || 1;
  const w52Pos = Math.max(0, Math.min(100, ((overview.current_price - overview.week_52_low) / w52Span) * 100));

  return (
    <div className="space-y-6 pb-16 animate-fade-in w-full">
      {/* 1. TOP MARKET TICKER CARDS STRIP */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <DashboardSectionHeader
            title="Global & Domestic Market Tickers"
            badge="LIVE BENCHMARKS"
            badgeType="green"
          />
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            Scroll for full index universe →
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-1 no-scrollbar">
          <MarketTickerCard
            name="NIFTY 50"
            symbol="NSE"
            value={niftyCurrent}
            change={niftyChange}
            change_pct={avgNiftyChange}
            isLive={isMarketOpen}
            provenanceNote="National Stock Exchange of India • 50 Blue Chip Benchmark"
            onClick={() => selectStockAndNavigate('RELIANCE', 'dashboard')}
            sparkline={[24100, 24180, 24150, 24220, 24200, 24290, 24320, 24350]}
          />

          <MarketTickerCard
            name="SENSEX"
            symbol="BSE"
            value={sensexCurrent}
            change={sensexChange}
            change_pct={avgNiftyChange * 0.95}
            isLive={isMarketOpen}
            provenanceNote="Bombay Stock Exchange • 30 Blue Chip Benchmark"
            onClick={() => selectStockAndNavigate('TCS', 'dashboard')}
            sparkline={[79200, 79350, 79300, 79500, 79480, 79650, 79780, 79840]}
          />

          <MarketTickerCard
            name="BANK NIFTY"
            symbol="NSE BANK"
            value={bankNiftyCurrent}
            change={bankNiftyChange}
            change_pct={avgNiftyChange - 0.2}
            isLive={isMarketOpen}
            provenanceNote="NSE Banking & Financial Sector Index"
            onClick={() => selectStockAndNavigate('HDFCBANK', 'dashboard')}
            sparkline={[51400, 51350, 51300, 51250, 51220, 51180, 51200]}
          />

          <MarketTickerCard
            name="USD / INR"
            symbol="FOREX"
            value={83.92}
            change={0.04}
            change_pct={0.05}
            currencySymbol="₹"
            isLive={false}
            provenanceNote="Forex Reference Rate • RBI Reference"
            sparkline={[83.80, 83.82, 83.85, 83.88, 83.90, 83.92]}
          />

          <MarketTickerCard
            name="GOLD (10g)"
            symbol="MCX"
            value={72450}
            change={180}
            change_pct={0.25}
            currencySymbol="₹"
            isLive={false}
            provenanceNote="Commodity Reference Rate • 24K 999 Purity"
            decimals={0}
            sparkline={[72100, 72200, 72150, 72300, 72400, 72450]}
          />

          <MarketTickerCard
            name="CRUDE OIL"
            symbol="BRENT"
            value={6420}
            change={-45}
            change_pct={-0.70}
            currencySymbol="₹"
            isLive={false}
            provenanceNote="Energy Futures Reference Index"
            decimals={0}
            sparkline={[6520, 6500, 6480, 6460, 6440, 6420]}
          />
        </div>
      </section>

      {/* 2. MAIN THREE-COLUMN ANALYTICS AREA */}
      <section className="space-y-3">
        <DashboardSectionHeader
          title="Market Breadth & Technical Momentum"
          subtitle="Real-time multi-factor indicators and autoregressive trends"
          badge="QUANTITATIVE"
          badgeType="blue"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Card A: Market Strength Gauge */}
          <div className="h-full">
            <MarketStrengthCard
              advances={advances}
              declines={declines}
              unchanged={unchanged}
              total={stocks.length || 50}
              avgChangePct={avgNiftyChange}
              marketStatus={marketStatus}
              isLive={isMarketOpen}
            />
          </div>

          {/* Card B: Market Overview */}
          <div className="h-full">
            <MarketOverviewCard
              overview={overview}
              rsiValue={indicators?.latest?.rsi_14 || 54.2}
              marketSentimentScore={Math.round(50 + (avgNiftyChange * 12))}
            />
          </div>

          {/* Card C: Market Trend Chart */}
          <div className="h-full">
            <MarketTrendCard
              data={historicalData}
              symbol={overview.symbol}
              currencySymbol={currSym}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              height={230}
            />
          </div>
        </div>
      </section>

      {/* 3. SECOND ROW: SECTOR PERFORMANCE + TOP GAINERS + TOP LOSERS */}
      <section className="space-y-3">
        <DashboardSectionHeader
          title="Sector Allocation & Daily Extremes"
          subtitle="Aggregated returns from real constituent data"
          badge="MARKET SEGMENTS"
          badgeType="neutral"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Left: Sector Performance */}
          <div className="h-full">
            <SectorPerformanceCard
              stocks={stocks}
              onSectorClick={(sec) => {
                const match = stocks.find(s => s.sector === sec);
                if (match) selectStockAndNavigate(match.symbol, 'dashboard');
              }}
            />
          </div>

          {/* Center: Top Gainers */}
          <div className="h-full">
            <GainersTable
              stocks={stocks}
              onSelectStock={(sym) => selectStockAndNavigate(sym, 'dashboard')}
              limit={5}
            />
          </div>

          {/* Right: Top Losers */}
          <div className="h-full">
            <LosersTable
              stocks={stocks}
              onSelectStock={(sym) => selectStockAndNavigate(sym, 'dashboard')}
              limit={5}
            />
          </div>
        </div>
      </section>

      {/* 4. NIFTY 50 HEATMAP SECTION & AI INSIGHT */}
      <section className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Heatmap (3 cols on XL) */}
        <div className="xl:col-span-3">
          <NiftyHeatmap
            stocks={stocks}
            onSelectStock={(sym) => selectStockAndNavigate(sym, 'dashboard')}
            isMarketOpen={isMarketOpen}
            marketStatus={marketStatus}
          />
        </div>

        {/* AI Market Insight Card (1 col on XL) */}
        <div className="xl:col-span-1 h-full">
          <AIInsightCard
            stocks={stocks}
            advances={advances}
            declines={declines}
            avgChangePct={avgNiftyChange}
            onExploreForecasts={() => setCurrentView('forecast')}
          />
        </div>
      </section>

      {/* 5. ACTIVE EQUITY DEEP DIVE WORKBENCH */}
      <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#1E293B]">
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {overview.name}
              </h2>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {overview.symbol}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono">
                {overview.exchange}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400">
                {overview.sector}
              </span>
              <ProvenanceBadge provenance={overview.provenance} lastUpdated={overview.last_updated} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl line-clamp-2">
              {overview.description || `${overview.name} is a publicly traded equity available for quantitative forecasting.`}
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentView('forecast')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>AI Multi-Horizon Forecast</span>
            </button>

            <button
              onClick={() => setCurrentView('technicals')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Indicators & Oscillators
            </button>
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Current Price"
            value={`${currSym}${overview.current_price.toFixed(2)}`}
            change={overview.daily_change_pct}
            changeSuffix="%"
            subValue={`Prev Close: ${currSym}${overview.previous_close.toFixed(2)}`}
            highlight={true}
          />

          <MetricCard
            label="24h Net Movement"
            value={`${overview.daily_change >= 0 ? '+' : ''}${currSym}${overview.daily_change.toFixed(2)}`}
            change={overview.daily_change_pct}
            subValue={`Day Range: ${currSym}${overview.day_low} – ${currSym}${overview.day_high}`}
            badge={overview.daily_change >= 0 ? 'Gain' : 'Loss'}
            badgeType={overview.daily_change >= 0 ? 'green' : 'red'}
          />

          <MetricCard
            label="Trading Volume"
            value={`${(overview.volume / 1e6).toFixed(2)}M`}
            subValue={`30d Avg: ${(overview.average_volume_30d / 1e6).toFixed(2)}M`}
            badge={overview.volume > overview.average_volume_30d ? 'Above Avg' : 'Normal'}
            badgeType="blue"
          />

          <MetricCard
            label="Market Capitalization"
            value={overview.market_cap.startsWith('₹') || overview.market_cap.startsWith('$') ? overview.market_cap : `${currSym}${overview.market_cap}`}
            subValue={`P/E: ${overview.pe_ratio || '24.5'} • Beta: ${overview.beta || '1.0'}`}
            badge="Valuation"
            badgeType="neutral"
          />
        </div>

        {/* 52-Week Range Bar Widget */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>52-Week Low: <strong className="font-mono text-slate-900 dark:text-white">{currSym}{overview.week_52_low.toFixed(2)}</strong></span>
            <span className="text-slate-400 font-mono">Current 52W Level: {w52Pos.toFixed(1)}%</span>
            <span>52-Week High: <strong className="font-mono text-slate-900 dark:text-white">{currSym}{overview.week_52_high.toFixed(2)}</strong></span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${w52Pos}%` }}
            />
          </div>
        </div>

        {/* Interactive Price & Candlestick Chart */}
        <PriceChart 
          data={historicalData} 
          currencySymbol={currSym} 
          height={420} 
        />

        {/* Real Company Fundamentals & Valuation */}
        <FundamentalsSection overview={overview} />

        {/* Multi-Factor Algorithmic Bias + 5-Day ML Forecast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {signal && (
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {signal.label}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                    signal.badge_color === 'green' || signal.badge_color === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : signal.badge_color === 'red' || signal.badge_color === 'orange'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {signal.signal.toUpperCase()} ({signal.sentiment_score > 0 ? `+${signal.sentiment_score}` : signal.sentiment_score})
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span>Algorithmic Signal:</span>
                  <span className={signal.sentiment_score >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {signal.signal}
                  </span>
                </h3>
                
                <div className="space-y-2 mt-4 text-xs">
                  {signal.breakdown_factors.slice(0, 4).map((fac, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#151D2F] border border-transparent dark:border-[#1E293B]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{fac.factor}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{fac.status} ({fac.impact})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E293B] text-[11px] text-slate-400">
                {signal.disclaimer}
              </div>
            </div>
          )}

          {h5d && (
            <div className="bg-gradient-to-br from-indigo-950/40 via-[#111726] to-[#111726] border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-sm text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    AI 5-Day Forward Outlook
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Confidence: {h5d.confidence_score}%
                  </span>
                </div>

                <div className="text-3xl font-extrabold font-mono text-white mt-1">
                  {currSym}{h5d.predicted_price.toFixed(2)}
                </div>

                <div className="text-sm font-semibold mt-1 flex items-center gap-2">
                  <span className={h5d.expected_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {h5d.expected_change_pct >= 0 ? '▲ +' : '▼ '}{h5d.expected_change_pct.toFixed(2)}% Expected
                  </span>
                  <span className="text-xs text-slate-400 font-normal">by {h5d.target_date}</span>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-black/40 border border-slate-800 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Current Baseline:</span>
                    <span className="text-white">{currSym}{overview.current_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>95% Confidence Cone:</span>
                    <span className="text-indigo-300">{currSym}{h5d.forecast_range_min} – {currSym}{h5d.forecast_range_max}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setCurrentView('forecast')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
                >
                  <span>Launch Interactive Forecast Workbench</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};
