import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { SentimentData } from '../../types/stock';
import { StockAPI } from '../../services/api';
import { MetricCard } from '../common/MetricCard';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { SkeletonLoader } from '../common/SkeletonLoader';

export const SentimentView: React.FC = () => {
  const { selectedSymbol, overview, isLoading: stockLoading } = useStock();
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSentiment() {
      setLoading(true);
      try {
        const res = await StockAPI.getNewsSentiment(selectedSymbol);
        setSentiment(res);
      } catch (e) {
        console.error("Failed to load sentiment:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSentiment();
  }, [selectedSymbol]);

  if (stockLoading || loading || !sentiment || !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <SkeletonLoader count={3} className="h-28" />
        <SkeletonLoader count={1} className="h-96" />
      </div>
    );
  }

  const dist = sentiment.distribution;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Market News & NLP Sentiment Analytics
            </h1>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {overview.symbol}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated financial headline ingestion, sentiment polarity scoring, and 7-day trend analysis.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          NLP Model: Lexicon & Transformer Sentiment Scorer
        </div>
      </div>

      {/* Sentiment Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Overall Sentiment Rating"
          value={sentiment.overall_sentiment}
          subValue={`Average Polarity: ${sentiment.average_score > 0 ? '+' : ''}${sentiment.average_score}`}
          badge={sentiment.overall_sentiment}
          badgeType={sentiment.overall_sentiment.includes('Positive') ? 'green' : sentiment.overall_sentiment.includes('Negative') ? 'red' : 'blue'}
          highlight={true}
        />

        <MetricCard
          label="Positive Headline Share"
          value={`${dist.positive_pct}%`}
          subValue="Bullish tone / expansion news"
          badge="Bullish News"
          badgeType="green"
        />

        <MetricCard
          label="Neutral / Objective Share"
          value={`${dist.neutral_pct}%`}
          subValue="Standard filing & factual data"
          badge="Neutral"
          badgeType="blue"
        />

        <MetricCard
          label="Negative Headline Share"
          value={`${dist.negative_pct}%`}
          subValue="Sector headwinds / caution"
          badge="Bearish Tone"
          badgeType={dist.negative_pct > 20 ? 'red' : 'neutral'}
        />
      </div>

      {/* 7-Day Sentiment Trend & Distribution Gauge Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Distribution Bar */}
        <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Sentiment Polarity Distribution
          </h3>

          <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-[#0B0F17] overflow-hidden flex border border-transparent dark:border-[#1E293B]">
            <div style={{ width: `${dist.positive_pct}%` }} className="bg-emerald-500 transition-all" title={`Positive: ${dist.positive_pct}%`} />
            <div style={{ width: `${dist.neutral_pct}%` }} className="bg-blue-500 transition-all" title={`Neutral: ${dist.neutral_pct}%`} />
            <div style={{ width: `${dist.negative_pct}%` }} className="bg-rose-500 transition-all" title={`Negative: ${dist.negative_pct}%`} />
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Pos: {dist.positive_pct}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Neu: {dist.neutral_pct}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Neg: {dist.negative_pct}%</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#151D2F] rounded-xl border border-slate-200 dark:border-[#1E293B] text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Headlines are parsed using financial sentiment lexicons that evaluate contextual vocabulary such as <em>earnings beats, revenue expansion, regulatory headwinds, and macro inflation</em>.
          </div>
        </div>

        {/* 7-Day Trend Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
            7-Day Media Sentiment Trend Score
          </h3>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono">
            {sentiment.sentiment_trend.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] flex flex-col justify-between h-32">
                <span className="text-slate-400 text-[11px]">{t.date}</span>
                <div className="my-2">
                  <span className={`text-base font-bold ${
                    t.sentiment_score > 0.15 ? 'text-emerald-400' : t.sentiment_score < -0.15 ? 'text-rose-400' : 'text-blue-400'
                  }`}>
                    {t.sentiment_score > 0 ? '+' : ''}{t.sentiment_score}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  t.sentiment_score > 0.15 ? 'bg-emerald-500/10 text-emerald-400' : t.sentiment_score < -0.15 ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {t.sentiment_score > 0.15 ? 'Bullish' : t.sentiment_score < -0.15 ? 'Bearish' : 'Neutral'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parsed News Articles Feed */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Classified Real-Time Financial Articles
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live external media coverage with algorithmic NLP polarity scoring.
            </p>
          </div>

          <div className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#0B0F17] text-slate-400 border border-slate-200 dark:border-[#1E293B]">
            Feed: {sentiment.provider || 'Financial News Ingestion'}
          </div>
        </div>

        {(!sentiment.recent_articles || sentiment.recent_articles.length === 0) ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-[#151D2F] rounded-xl border border-dashed border-slate-200 dark:border-[#1E293B] text-xs text-slate-400">
            NEWS DATA UNAVAILABLE for {overview.symbol}. No recent articles indexed by the provider.
          </div>
        ) : (
          <div className="space-y-3">
            {sentiment.recent_articles.map(art => (
              <div
                key={art.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#1E293B] hover:border-emerald-500/30 dark:hover:border-emerald-500/30 bg-slate-50/50 dark:bg-[#151D2F]/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{art.source}</span>
                    <span>•</span>
                    <span>{art.published_at}</span>
                  </div>

                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sm text-slate-900 dark:text-white hover:text-emerald-400 dark:hover:text-emerald-400 transition-colors block"
                  >
                    {art.headline || art.title}
                  </a>

                  {art.summary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto font-mono text-xs flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full font-bold border ${
                    art.sentiment_class === 'Positive'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : art.sentiment_class === 'Negative'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {art.sentiment_class} ({art.sentiment_score > 0 ? '+' : ''}{art.sentiment_score})
                  </span>

                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white dark:bg-[#0B0F17] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-[#1E293B] transition-colors flex items-center gap-1 text-[11px]"
                  >
                    <span>Read</span>
                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 text-center">
        {sentiment.disclaimer || "Sentiment is algorithmically estimated from retrieved news and should not be interpreted as investment advice."}
      </div>

      <DisclaimerBanner />
    </div>
  );
};
