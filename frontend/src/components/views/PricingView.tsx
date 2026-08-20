import React, { useState, useEffect } from 'react';
import { useStock } from '../../context/StockContext';
import { StockAPI } from '../../services/api';
import { SubscriptionPlan, SubscriptionRecord } from '../../types/stock';
import { SkeletonLoader } from '../common/SkeletonLoader';

export const PricingView: React.FC = () => {
  const { addToast } = useStock();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [provider, setProvider] = useState<'stripe' | 'razorpay'>('stripe');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sandbox Mock Checkout Modal State
  const [checkoutModalPlan, setCheckoutModalPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessingMockPayment, setIsProcessingMockPayment] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedPlans, subStatus] = await Promise.all([
          StockAPI.getPlans(),
          StockAPI.getSubscriptionStatus()
        ]);
        setPlans(loadedPlans);
        setSubscription(subStatus);
      } catch (e) {
        console.error('Failed to load pricing information', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Check URL parameters for redirect confirmation
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      setInfoMessage('Checkout completed! Subscription state will update once confirmed by webhook.');
    } else if (status === 'canceled') {
      setInfoMessage('Checkout session was canceled. No charges were incurred.');
    }
  }, []);

  const handleCheckout = async (plan: SubscriptionPlan) => {
    if (plan.plan_id === 'free' || plan.plan_id === subscription?.plan_id) {
      return;
    }

    setLoadingPlan(plan.plan_id);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const chosenProvider = currency === 'INR' ? 'razorpay' : provider;
      const res = await StockAPI.createCheckoutSession(plan.plan_id, chosenProvider, currency);

      if (res.status === 'success' && res.session?.checkout_url) {
        // Secure External Redirect (Never collect card details in application)
        window.location.href = res.session.checkout_url;
      } else {
        // Open institutional sandbox mock checkout terminal modal
        setCheckoutModalPlan(plan);
      }
    } catch (e: any) {
      // Open sandbox modal as educational fallback
      setCheckoutModalPlan(plan);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleConfirmMockCheckout = () => {
    if (!checkoutModalPlan) return;
    setIsProcessingMockPayment(true);

    setTimeout(() => {
      const newSub: SubscriptionRecord = {
        subscription_id: `sub_mock_${Date.now()}`,
        user_id: 'default_user',
        plan_id: checkoutModalPlan.plan_id,
        provider: currency === 'INR' ? 'razorpay_sandbox' : 'stripe_sandbox',
        status: 'ACTIVE',
        currency,
        amount: currency === 'INR' ? checkoutModalPlan.price_inr : checkoutModalPlan.price_usd,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (billingInterval === 'year' ? 365 : 30) * 86400000).toISOString()
      };

      setSubscription(newSub);
      setIsProcessingMockPayment(false);
      setCheckoutModalPlan(null);
      addToast(`Sandbox Upgrade Confirmed: You are now on the ${checkoutModalPlan.display_name} tier!`, 'success');
    }, 1200);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse max-w-6xl mx-auto">
        <SkeletonLoader count={3} className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 animate-fade-in max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Transparent Institutional Tiers</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Institutional Analytics & Forecasting Tiers
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Access walk-forward machine learning time-series models, multi-step forecast horizons, and real-time equity intelligence.
        </p>

        {/* Currency & Billing Interval Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-[#1E293B]">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                billingInterval === 'month'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                billingInterval === 'year'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SAVE 20%
              </span>
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-[#1E293B]">
            <button
              onClick={() => { setCurrency('USD'); setProvider('stripe'); }}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                currency === 'USD'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => { setCurrency('INR'); setProvider('razorpay'); }}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                currency === 'INR'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              INR (₹)
            </button>
          </div>

          {/* Provider Badge for USD */}
          {currency === 'USD' && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-[#1E293B] text-xs font-mono text-slate-400">
              <span>Gateway:</span>
              <strong className="text-slate-200">Stripe Sandbox</strong>
            </div>
          )}
          {currency === 'INR' && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#111726] rounded-xl border border-slate-200 dark:border-[#1E293B] text-xs font-mono text-slate-400">
              <span>Gateway:</span>
              <strong className="text-slate-200">Razorpay Sandbox</strong>
            </div>
          )}
        </div>
      </div>

      {/* Info / Success Alert */}
      {infoMessage && (
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrent = (subscription?.plan_id || 'free') === plan.plan_id;
          const isPopular = plan.plan_id === 'pro';

          let baseMonthlyPrice = currency === 'INR' ? plan.price_inr : plan.price_usd;
          let calculatedPrice = baseMonthlyPrice;

          if (billingInterval === 'year' && baseMonthlyPrice > 0) {
            calculatedPrice = Math.round(baseMonthlyPrice * 12 * 0.8);
          }

          const currSym = currency === 'INR' ? '₹' : '$';

          return (
            <div
              key={plan.plan_id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                isPopular
                  ? 'bg-gradient-to-b from-emerald-950/20 via-[#111726] to-[#111726] border-2 border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                  : 'bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] shadow-sm'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-md">
                  Institutional Choice
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {plan.display_name}
                  </h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                      Active Plan
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] leading-relaxed">
                  {plan.description}
                </p>

                <div className="pt-2 pb-2 border-b border-slate-100 dark:border-[#1E293B]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
                      {baseMonthlyPrice === 0 ? 'Free' : `${currSym}${calculatedPrice.toLocaleString()}`}
                    </span>
                    {baseMonthlyPrice > 0 && (
                      <span className="text-xs text-slate-400 font-medium">
                        / {billingInterval === 'year' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    {baseMonthlyPrice === 0
                      ? 'Forever free educational baseline'
                      : billingInterval === 'year'
                      ? `${currSym}${Math.round(calculatedPrice / 12)}/mo billed annually`
                      : 'Billed monthly • Cancel anytime'}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    Included Capabilities:
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-[#1E293B]">
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={isCurrent || loadingPlan === plan.plan_id}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-[#0B0F17] text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent dark:border-[#1E293B]'
                      : isPopular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 active:scale-98'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-[#151D2F] dark:hover:bg-slate-800 text-white dark:text-slate-200 border border-transparent dark:border-[#1E293B] active:scale-98'
                  }`}
                >
                  {loadingPlan === plan.plan_id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Initiating Checkout...</span>
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.price_usd === 0 ? (
                    'Default Plan'
                  ) : (
                    `Upgrade to ${plan.display_name}`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Table */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#1E293B]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Comprehensive Plan Entitlements Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed breakdown of quantitative features, model access, and API quotas.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0B0F17] border-b border-slate-200 dark:border-[#1E293B] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Capability / Entitlement</th>
                <th className="py-3.5 px-4 text-center">Free Explorer</th>
                <th className="py-3.5 px-4 text-center text-emerald-400 font-bold">Pro Trader</th>
                <th className="py-3.5 px-4 text-center text-indigo-400 font-bold">Institutional Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] font-mono">
              {[
                { feature: 'Supported Equities Universe', free: '8 Core Benchmarks', pro: '36+ US & NSE Equities', elite: 'Full Global Universe' },
                { feature: 'Forecast Prediction Horizons', free: '+1d & +5d', pro: '+1d, +5d, +10d, +30d', elite: '+1d, +5d, +10d, +30d + Custom' },
                { feature: 'ML Modeling Engines', free: 'Ridge Regression', pro: 'Ridge + GBDT + LSTM', elite: 'Ensemble + GBDT + Deep LSTM' },
                { feature: 'Out-of-Sample Backtesting Metrics', free: 'Basic RMSE', pro: 'Full RMSE, MAE, Win-Rate', elite: 'Full Backtest + Statistical Audit' },
                { feature: 'Real-Time News & Polarity Feed', free: 'Historical Feed', pro: 'Live RSS Stream & Gauges', elite: 'Live RSS Stream & Gauges' },
                { feature: 'Watchlist Portfolio Capacity', free: '5 Securities', pro: '25 Securities', elite: 'Unlimited' },
                { feature: 'Multi-Stock Correlation Matrix', free: '—', pro: 'Up to 4 Stocks', elite: 'Unlimited Matrix Normalization' },
                { feature: 'Data Export & Persistence', free: 'Local Browser', pro: 'JSON Export + Supabase', elite: 'JSON + Supabase Persistence' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#151D2F]/50 transition-colors">
                  <td className="py-3 px-5 font-sans font-medium text-slate-900 dark:text-slate-200">
                    {row.feature}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">
                    {row.free}
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-semibold">
                    {row.pro}
                  </td>
                  <td className="py-3 px-4 text-center text-indigo-400 font-semibold">
                    {row.elite}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Architecture & Verification Notice */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-[#1E293B]">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Payment Architecture & Verification Status
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Technical implementation details regarding payment infrastructure, sandbox testing, and credential security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Secure Payment Architecture</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Payment credentials and webhook secrets are kept server-side and are never exposed to the frontend.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Sandbox Checkout Available</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Checkout can be tested safely using the existing mock/sandbox payment provider.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Persistent Subscription State</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Subscription entitlements are designed to persist through Supabase-backed server-side storage.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Webhook Verification</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Stripe and Razorpay webhook signatures are cryptographically verified by the backend.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-1 md:col-span-2">
            <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>No Live Payment Activation Yet</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Real-money payment processing remains disabled until production provider credentials and webhook configuration are explicitly completed and verified.
            </p>
          </div>
        </div>
      </div>

      {/* Sandbox Mock Checkout Modal */}
      {checkoutModalPlan && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-[#1E293B] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sandbox Checkout Session
                </h3>
              </div>
              <button
                onClick={() => setCheckoutModalPlan(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#151D2F] border border-slate-200 dark:border-[#1E293B] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Selected Plan:</span>
                <strong className="text-slate-900 dark:text-white font-mono">{checkoutModalPlan.display_name}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Billing Cycle:</span>
                <span className="font-mono text-slate-300 capitalize">{billingInterval === 'year' ? 'Annual (20% Off)' : 'Monthly'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Gateway Provider:</span>
                <span className="font-mono text-indigo-400">{currency === 'INR' ? 'Razorpay Sandbox' : 'Stripe Sandbox'}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-[#1E293B] flex justify-between items-center text-sm font-bold">
                <span className="text-slate-900 dark:text-white">Amount Due:</span>
                <span className="font-mono text-emerald-400 text-lg">
                  {currency === 'INR' ? '₹' : '$'}
                  {(billingInterval === 'year'
                    ? Math.round((currency === 'INR' ? checkoutModalPlan.price_inr : checkoutModalPlan.price_usd) * 12 * 0.8)
                    : (currency === 'INR' ? checkoutModalPlan.price_inr : checkoutModalPlan.price_usd)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Sandbox Notice */}
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-[11px] text-indigo-300 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>ℹ️ Educational Sandbox Environment</span>
              </div>
              <div>
                This checkout session executes in safe simulation mode. No real charges or payment methods are needed. Confirming will activate your plan entitlement immediately.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutModalPlan(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#151D2F] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmMockCheckout}
                disabled={isProcessingMockPayment}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessingMockPayment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Activating...</span>
                  </>
                ) : (
                  <span>Confirm Mock Upgrade</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
