import React from 'react';

export const DisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>
          <strong>Educational Machine-Learning Model:</strong> Forecasts are statistical estimates and do NOT constitute financial, investment, or trading advice.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl my-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3 shadow-sm">
      <div className="p-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md mt-0.5">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
          Academic Research & Educational Forecasting Platform
        </h4>
        <p className="leading-relaxed opacity-90">
          StockSense AI is built solely for educational exploration of time-series machine learning, quantitative feature engineering, and statistical prediction intervals. Market forecasts are model approximations derived from historical price patterns. Stock markets involve risk, and past algorithmic performance does not guarantee future price action. Never trade or invest based on these forecasts.
        </p>
      </div>
    </div>
  );
};
