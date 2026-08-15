import React, { useState, useEffect } from 'react';
import { StockAPI } from '../../services/api';
import { SubscriptionPlan, SubscriptionRecord } from '../../types/stock';
import { SkeletonLoader } from '../common/SkeletonLoader';

export const PricingView: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [provider, setProvider] = useState<'stripe' | 'razorpay'>('stripe');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } else if (res.error === 'PAYMENTS_NOT_CONFIGURED') {
        setErrorMessage(
          `Payments Not Configured: ${res.message || 'Payment provider keys (STRIPE_SECRET_KEY / RAZORPAY_KEY_ID) are unconfigured in server environment.'}`
        );
      } else {
        setErrorMessage(res.message || res.error || 'Failed to initiate secure checkout session.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Network error while reaching payment gateway.');
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <SkeletonLoader count={3} className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
          Transparent Pricing & Entitlements
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Choose the Perfect Analytics Tier
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Institutional-grade machine learning time-series models, multi-horizon forecasts, and real-time global market intelligence.
        </p>

        {/* Currency & Provider Selectors */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {/* Currency Toggle */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setCurrency('USD'); setProvider('stripe'); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currency === 'USD'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => { setCurrency('INR'); setProvider('razorpay'); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currency === 'INR'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              INR (₹)
            </button>
          </div>

          {/* Provider Selector for USD */}
          {currency === 'USD' && (
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setProvider('stripe')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  provider === 'stripe'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Stripe Gateway
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info / Success / Error Alerts */}
      {infoMessage && (
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs sm:text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{infoMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="space-y-1">
            <div className="font-bold">Payment Configuration Notice</div>
            <div>{errorMessage}</div>
            <div className="text-[11px] opacity-85">
              StockSense AI strictly adheres to zero-fake payments: when API credentials are unset, checkout safely halts rather than fabricating transactions.
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrent = (subscription?.plan_id || 'free') === plan.plan_id;
          const isPopular = plan.plan_id === 'pro';
          const price = currency === 'INR' ? plan.price_inr : plan.price_usd;
          const currSym = currency === 'INR' ? '₹' : '$';

          return (
            <div
              key={plan.plan_id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                isPopular
                  ? 'bg-gradient-to-b from-indigo-900/10 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {plan.display_name}
                  </h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                      Current Plan
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px]">
                  {plan.description}
                </p>

                <div className="pt-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {price === 0 ? 'Free' : `${currSym}${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        / {plan.billing_interval}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {price === 0 ? 'Forever free educational baseline' : 'Cancel or upgrade anytime'}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    Included Features:
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={isCurrent || loadingPlan === plan.plan_id}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-98'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 active:scale-98'
                  }`}
                >
                  {loadingPlan === plan.plan_id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Creating Checkout...</span>
                    </>
                  ) : isCurrent ? (
                    'Active Plan'
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

      {/* Security & Zero-Leakage Notice Footer */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            <strong>Bank-Grade Zero-Storage Policy:</strong> All payment transactions are handled exclusively through PCI-DSS compliant Stripe/Razorpay external checkouts. No credit card details are ever processed or stored on StockSense AI servers.
          </span>
        </div>
      </div>
    </div>
  );
};
