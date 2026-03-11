import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ThankYouPage() {
  const { electionId } = useParams();
  const location = useLocation();
  const receiptHash = location.state?.receipt_hash || null;
  const [copied, setCopied] = useState(false);

  const copyReceipt = () => {
    if (receiptHash) {
      navigator.clipboard.writeText(receiptHash).then(() => {
        setCopied(true);
        toast.success('Receipt copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 to-accent-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti-like decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-3 h-3 bg-primary-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-[15%] right-[20%] w-2 h-2 bg-success-400 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
        <div className="absolute top-[25%] left-[25%] w-4 h-4 bg-warning-400 rounded-sm opacity-40 animate-bounce rotate-45" style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
        <div className="absolute top-[20%] right-[10%] w-3 h-3 bg-accent-400 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.8s' }} />
        <div className="absolute top-[30%] left-[50%] w-2 h-2 bg-danger-400 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '3.2s' }} />
        <div className="absolute top-[12%] left-[60%] w-3 h-3 bg-success-300 rounded-sm opacity-50 animate-bounce rotate-12" style={{ animationDelay: '1.2s', animationDuration: '2.6s' }} />
        <div className="absolute top-[35%] right-[30%] w-2 h-2 bg-primary-300 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '3.1s' }} />
        <div className="absolute top-[8%] left-[40%] w-4 h-4 bg-accent-300 rounded-sm opacity-30 animate-bounce rotate-45" style={{ animationDelay: '0.4s', animationDuration: '3.4s' }} />

        {/* Large blurred background shapes */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-success-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md">
        {/* Success Icon */}
        <div className="relative inline-flex mb-8">
          <div className="absolute inset-0 w-28 h-28 bg-success-200 rounded-full animate-ping opacity-20" />
          <div className="relative w-28 h-28 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center shadow-lg shadow-success-200">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold gradient-text mb-3">Vote Cast Successfully!</h2>
        <p className="text-surface-500 text-lg mb-2">Thank you for participating in the election.</p>
        <p className="text-surface-400 text-sm mb-6">Your vote has been securely recorded and encrypted.</p>

        {/* Vote Receipt */}
        {receiptHash && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-surface-200 p-5 mb-8 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span className="text-sm font-semibold text-surface-800">Your Vote Receipt</span>
            </div>
            <p className="text-xs text-surface-500 mb-3">Save this code to verify your vote later</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-xl font-mono font-bold tracking-widest text-primary-700 bg-primary-50 px-4 py-2 rounded-lg">
                {receiptHash}
              </code>
              <button
                onClick={copyReceipt}
                className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <Link
              to={`/verify/${receiptHash}`}
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-3 transition-colors"
            >
              Verify your vote
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="btn btn-primary btn-lg inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
          {receiptHash && (
            <Link
              to={`/verify/${receiptHash}`}
              className="btn btn-secondary btn-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Verify Vote
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
