import React, { useState } from 'react';
import { useStock } from '../../context/StockContext';
import { StockAPI } from '../../services/api';

interface FAQItem {
  id: string;
  category: 'ml' | 'indicators' | 'data' | 'billing' | 'general';
  question: string;
  answer: string;
  tags: string[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'ml',
    question: 'How does the Machine Learning Forecasting Model generate price projections?',
    answer: 'StockSense AI employs a walk-forward out-of-sample validation architecture. For any given equity, the system computes autoregressive time-lag features (L1–L10), rolling momentum indicators, exponential moving averages, and historical volatility. The models (Ridge Regression, Gradient Boosted Decision Trees, and LSTM networks) are trained strictly on past data and evaluated on holdout periods to prevent look-ahead bias and data leakage.',
    tags: ['ML', 'Validation', 'Algorithms', 'Ridge', 'LSTM', 'GBDT']
  },
  {
    id: 'faq-2',
    category: 'ml',
    question: 'What do the 1-Day, 5-Day, 10-Day, and 30-Day forecast horizons represent?',
    answer: 'Each forecast horizon represents an independent multi-step forward projection. The 1-Day and 5-Day horizons capture short-term mean-reversion and momentum continuation with tight confidence bounds. The 10-Day and 30-Day horizons capture broader cyclical trends. Note that the uncertainty confidence band (shaded area) expands with horizon length to reflect cumulative time-series variance.',
    tags: ['Horizons', 'Confidence Bands', 'Multi-step', 'Uncertainty']
  },
  {
    id: 'faq-3',
    category: 'indicators',
    question: 'How are the Technical Indicators (RSI, MACD, Bollinger Bands) calculated?',
    answer: 'Indicators are calculated on adjusted historical closing prices. Relative Strength Index (RSI) uses a 14-period Wilder smoothing. Moving Average Convergence Divergence (MACD) uses 12-day and 26-day EMAs with a 9-day signal line. Bollinger Bands are computed using a 20-day Simple Moving Average with ±2.0 standard deviations (2σ).',
    tags: ['RSI', 'MACD', 'Bollinger Bands', 'Technical Analysis']
  },
  {
    id: 'faq-4',
    category: 'data',
    question: 'How does the NIFTY 50 Market Heatmap and Relative Volume (RVOL) work?',
    answer: 'The NIFTY 50 Heatmap displays real-time price changes across all 50 index constituents, categorized by sector and return magnitude. Relative Volume (RVOL) compares current session volume against the 20-day average volume for the same time window. An RVOL > 2.0x indicates significant institutional accumulation or distribution.',
    tags: ['NIFTY 50', 'Heatmap', 'RVOL', 'NSE', 'Volume']
  },
  {
    id: 'faq-5',
    category: 'billing',
    question: 'How does the subscription checkout and sandbox mode work?',
    answer: 'StockSense AI features a zero-financial-risk sandbox payment infrastructure. All checkout flows utilize sandbox mock gateways or test mode credentials (Stripe and Razorpay). No real money is charged, and no credit card details are ever stored or processed on StockSense AI servers.',
    tags: ['Pricing', 'Stripe', 'Razorpay', 'Sandbox', 'Security']
  },
  {
    id: 'faq-6',
    category: 'general',
    question: 'Is StockSense AI an automated trading bot or financial advisor?',
    answer: 'No. StockSense AI is strictly an institutional-grade quantitative educational and research platform. All forecasts, signals, and statistical metrics are provided for quantitative analysis and educational demonstration only. Past performance and machine learning projections do not guarantee future market returns.',
    tags: ['Disclaimer', 'Educational', 'Research', 'Risk']
  }
];

export const HelpView: React.FC = () => {
  const { addToast } = useStock();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ml' | 'indicators' | 'data' | 'billing' | 'general'>('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');

  // Support Ticket Form State
  const [ticketCategory, setTicketCategory] = useState('Question');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'normal' | 'high' | 'critical'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // Filter FAQs
  const filteredFaqs = FAQ_ITEMS.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.tags.some(t => t.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      addToast('Please provide a subject and message for your support ticket', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicketId(generatedId);
      setIsSubmitting(false);
      setTicketSubject('');
      setTicketMessage('');
      addToast(`Support ticket #${generatedId} logged to diagnostics queue`, 'success');
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
          Knowledge Base & Technical Support
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How Can We Help You?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Explore quantitative modeling documentation, mathematical formulas, keyboard shortcuts, and submit direct inquiries.
        </p>

        {/* Search Input Bar */}
        <div className="max-w-xl mx-auto pt-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search algorithms, indicators, formulas, or billing questions..."
              className="w-full bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
            <svg
              className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'ml', label: 'ML Forecasting' },
            { id: 'indicators', label: 'Technical Indicators' },
            { id: 'data', label: 'Market Data & RVOL' },
            { id: 'billing', label: 'Sandbox Billing' },
            { id: 'general', label: 'General & FAQ' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-white dark:bg-[#111726] border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Layout: FAQs + Quantitative Reference & Ticket Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: FAQs Accordion */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Frequently Asked Questions ({filteredFaqs.length})</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Click any question to view breakdown
            </span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] text-center space-y-2">
              <div className="text-sm font-bold text-slate-400">No matching documentation found</div>
              <p className="text-xs text-slate-500">Try adjusting your search keywords or category filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map(faq => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isExpanded
                        ? 'bg-white dark:bg-[#111726] border-emerald-500/40 shadow-sm'
                        : 'bg-white dark:bg-[#111726] border-slate-200 dark:border-[#1E293B] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-[#151D2F] text-indigo-400 border border-slate-200 dark:border-[#1E293B]">
                            {faq.category.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {faq.question}
                        </h3>
                      </div>

                      <div className={`p-1 rounded-lg text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 dark:border-[#1E293B] text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
                        <p>{faq.answer}</p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          {faq.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0B0F17] text-slate-400 border border-slate-200 dark:border-[#1E293B]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mathematical Formulas Card */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Quantitative Mathematical Formulas Quick Reference
                </h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-400 font-bold">Standardized Equations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Relative Strength Index (RSI)</div>
                <div className="font-mono text-indigo-400 text-[11px]">RSI = 100 - [100 / (1 + RS)]</div>
                <div className="text-[11px] text-slate-400">RS = Average Gain / Average Loss over 14 periods</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">MACD Histogram</div>
                <div className="font-mono text-indigo-400 text-[11px]">Hist = MACD_Line - Signal_Line</div>
                <div className="text-[11px] text-slate-400">MACD = EMA(12) - EMA(26) | Signal = EMA(9) of MACD</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Bollinger Bands (20, 2σ)</div>
                <div className="font-mono text-indigo-400 text-[11px]">Bands = SMA(20) ± (2.0 * σ_20)</div>
                <div className="text-[11px] text-slate-400">σ_20 = 20-period rolling sample standard deviation</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Root Mean Squared Error (RMSE)</div>
                <div className="font-mono text-indigo-400 text-[11px]">RMSE = √[ (1/n) * Σ(y_true - y_pred)² ]</div>
                <div className="text-[11px] text-slate-400">Computed strictly on out-of-sample validation holdouts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Keyboard Shortcuts & Support Ticket Form */}
        <div className="space-y-6">
          {/* Terminal Keyboard Shortcuts Card */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Terminal Hotkeys & Shortcuts
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { key: 'Cmd/Ctrl + K', action: 'Universal Security Search' },
                { key: 'Esc', action: 'Dismiss active modal / popup' },
                { key: '1 / 2 / 3', action: 'Switch forecast horizon (1d/5d/30d)' },
                { key: 'Tab', action: 'Cycle navigation elements' }
              ].map((hk, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                  <span className="text-slate-500 dark:text-slate-400">{hk.action}</span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#151D2F] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B] text-[10px]">
                    {hk.key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Support Inquiries Ticket Form */}
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#1E293B]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Submit Support Inquiry
              </h3>
            </div>

            {submittedTicketId ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-emerald-400">Inquiry Logged Successfully</div>
                <div className="text-[11px] font-mono text-slate-300">
                  Tracking ID: <strong>{submittedTicketId}</strong>
                </div>
                <button
                  onClick={() => setSubmittedTicketId(null)}
                  className="mt-2 text-xs text-indigo-400 hover:underline block mx-auto"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Inquiry Category
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={e => setTicketCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="Question">General Question</option>
                    <option value="Model">ML Model & Mathematics</option>
                    <option value="Bug">Technical Bug Report</option>
                    <option value="Feature">Feature Request</option>
                    <option value="Billing">Sandbox Billing</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={e => setTicketSubject(e.target.value)}
                    placeholder="Brief summary of inquiry..."
                    className="w-full bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Description & Details
                  </label>
                  <textarea
                    rows={3}
                    value={ticketMessage}
                    onChange={e => setTicketMessage(e.target.value)}
                    placeholder="Describe your question or observation in detail..."
                    className="w-full bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Submit Support Ticket</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
