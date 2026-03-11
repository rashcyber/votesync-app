import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { formatCurrency } from '../../utils/formatters';

export default function ContestantLookup() {
  const { electionId } = useParams();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.get(`/api/lookup/${code.trim().toUpperCase()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Contestant not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-accent-200/20 rounded-full blur-3xl" />
      </div>

      <header className="relative bg-white/80 backdrop-blur-sm shadow-sm border-b border-surface-200/60">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-2 inline-flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold gradient-text mt-1">Contestant Lookup</h1>
          <p className="text-surface-500 mt-1">Enter a contestant code to find and vote for them</p>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-4 py-8">
        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-surface-200/60 p-6 mb-6">
          <label className="block text-sm font-medium text-surface-700 mb-2">Contestant Code</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., PGT-001, SRC-005"
              className="input flex-1 text-lg font-mono text-center tracking-wider"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn btn-primary px-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-surface-200/60 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-6">
                {result.candidate.photo_url ? (
                  <img
                    src={result.candidate.photo_url}
                    alt={result.candidate.full_name}
                    className="w-32 h-32 rounded-xl object-cover ring-2 ring-surface-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-4xl font-bold text-primary-600">
                    {result.candidate.full_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <span className="badge badge-primary font-mono mb-2">
                    {result.candidate.contestant_code}
                  </span>
                  <h2 className="text-2xl font-bold text-surface-900">{result.candidate.full_name}</h2>
                  <p className="text-surface-500 mt-1">
                    {result.candidate.position.title} - {result.election.title}
                  </p>
                  {result.candidate.portfolio && (
                    <p className="text-surface-600 mt-3 text-sm leading-relaxed">{result.candidate.portfolio}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-surface-100 p-4 bg-surface-50/50 flex gap-3">
              {result.election.voting_type === 'paid' ? (
                <Link
                  to={`/vote/${result.election.id}/paid?candidate=${result.candidate.id}`}
                  className="btn btn-success flex-1 text-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Vote for {result.candidate.full_name} ({formatCurrency(result.election.price_per_vote, result.election.currency)}/vote)
                </Link>
              ) : (
                <Link
                  to={`/vote/${result.election.id}`}
                  className="btn btn-primary flex-1 text-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Vote Now
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
