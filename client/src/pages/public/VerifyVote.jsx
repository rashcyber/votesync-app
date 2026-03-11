import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';

export default function VerifyVote() {
  const { hash: urlHash } = useParams();
  const [hash, setHash] = useState(urlHash || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (urlHash) {
      handleVerify(urlHash);
    }
  }, [urlHash]);

  const handleVerify = async (receiptHash) => {
    const h = (receiptHash || hash).trim();
    if (!h) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/api/verify/${h}`);
      setResult(res.data);
    } catch {
      setResult({ verified: false, message: 'Error verifying receipt' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-surface-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold text-surface-800">VoteSync Pro</span>
          </Link>
          <Link to="/" className="btn btn-secondary btn-sm">Home</Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-900">Verify Your Vote</h1>
            <p className="text-surface-500 mt-1">Enter your receipt hash to verify your vote was recorded</p>
          </div>

          <div className="bg-white rounded-xl border border-surface-200 p-6 shadow-sm">
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Receipt Hash</label>
                <input
                  type="text"
                  value={hash}
                  onChange={(e) => setHash(e.target.value.toUpperCase())}
                  placeholder="Enter your receipt hash..."
                  className="input w-full font-mono text-center text-lg tracking-wider"
                  maxLength={16}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !hash.trim()}
                className="btn btn-primary w-full"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            {/* Result */}
            {searched && !loading && result && (
              <div className="mt-6">
                {result.verified ? (
                  <div className="bg-success-50 border border-success-200 rounded-xl p-5 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-success-800">Vote Verified!</h3>
                    <p className="text-sm text-success-700 mt-1">Your vote was successfully recorded.</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-surface-500">Election:</span>
                        <span className="font-medium text-surface-800">{result.election_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-surface-500">Voted at:</span>
                        <span className="font-medium text-surface-800">{new Date(result.voted_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-danger-50 border border-danger-200 rounded-xl p-5 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-danger-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-danger-800">Not Found</h3>
                    <p className="text-sm text-danger-700 mt-1">No vote receipt found with this hash. Please check and try again.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
