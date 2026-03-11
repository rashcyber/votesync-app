import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PaidVotePage() {
  const { electionId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedCandidate = searchParams.get('candidate');

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(preselectedCandidate || '');
  const [voteCount, setVoteCount] = useState(1);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    api.get(`/api/elections/${electionId}`)
      .then(res => {
        setElection(res.data.election);
        setCandidates(res.data.candidates);
        setPositions(res.data.positions);
      })
      .catch(() => toast.error('Failed to load election'))
      .finally(() => setLoading(false));
  }, [electionId]);

  const selected = candidates.find(c => c.id === parseInt(selectedCandidate));
  const position = selected ? positions.find(p => p.id === selected.position_id) : null;
  const totalAmount = election ? voteCount * election.price_per_vote : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate || voteCount < 1) return;

    setSubmitting(true);
    try {
      const res = await api.post('/api/payments/initialize', {
        election_id: parseInt(electionId),
        candidate_id: parseInt(selectedCandidate),
        position_id: selected.position_id,
        vote_count: voteCount,
        voter_name: voterName,
        voter_phone: voterPhone,
        voter_email: voterEmail || undefined,
        provider: 'mtn',
      });

      setPaymentResult(res.data);

      if (res.data.authorization_url) {
        // Redirect to Paystack
        window.location.href = res.data.authorization_url;
      } else {
        toast.success('Payment recorded! Awaiting approval.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-success-50 to-accent-50">
        <LoadingSpinner size="lg" text="Loading election..." />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-success-50 to-accent-50">
        <p className="text-surface-500 text-lg">Election not found.</p>
      </div>
    );
  }

  if (paymentResult && !paymentResult.authorization_url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success-50 to-accent-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-warning-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-success-200/20 rounded-full blur-3xl" />
        </div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-surface-200/60 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-warning-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Payment Pending</h2>
          <p className="text-surface-500 mb-2">Reference: <span className="font-mono badge badge-gray">{paymentResult.reference}</span></p>
          <p className="text-surface-500 mb-6">Amount: <span className="font-semibold text-surface-900">{formatCurrency(paymentResult.amount)}</span></p>
          <p className="text-sm text-surface-400 mb-6">Your payment is awaiting admin approval. Your votes will be counted once confirmed.</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 to-accent-50">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-success-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-accent-200/20 rounded-full blur-3xl" />
      </div>

      <header className="relative bg-white/80 backdrop-blur-sm shadow-sm border-b border-surface-200/60">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-xl font-bold gradient-text mt-1">{election.title}</h1>
          <p className="text-sm text-surface-500">Buy votes for your favorite contestant</p>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Candidate selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-surface-200/60 p-5">
            <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Select Contestant
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {candidates.map(candidate => {
                const isSelected = parseInt(selectedCandidate) === candidate.id;
                return (
                  <label
                    key={candidate.id}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center ${
                      isSelected
                        ? 'border-success-500 bg-success-50/80 shadow-sm shadow-success-100'
                        : 'border-surface-100 hover:border-surface-200 hover:bg-surface-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="candidate"
                      value={candidate.id}
                      checked={isSelected}
                      onChange={(e) => setSelectedCandidate(e.target.value)}
                      className="sr-only"
                    />
                    {candidate.photo_url ? (
                      <img src={candidate.photo_url} alt="" className="w-16 h-16 rounded-full object-cover mb-2 ring-2 ring-surface-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-success-100 to-accent-100 flex items-center justify-center text-xl font-semibold text-success-600 mb-2">
                        {candidate.full_name.charAt(0)}
                      </div>
                    )}
                    <p className="text-sm font-medium text-surface-900">{candidate.full_name}</p>
                    <p className="text-xs text-surface-400 font-mono mt-0.5">{candidate.contestant_code}</p>
                    {isSelected && (
                      <svg className="w-5 h-5 text-success-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Vote quantity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-surface-200/60 p-5">
            <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Number of Votes
            </h3>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                className="w-12 h-12 rounded-xl bg-surface-100 text-surface-700 text-xl font-bold hover:bg-surface-200 transition-all active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                value={voteCount}
                onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center text-3xl font-bold border-b-2 border-surface-200 focus:border-success-500 outline-none bg-transparent"
                min="1"
              />
              <button
                type="button"
                onClick={() => setVoteCount(voteCount + 1)}
                className="w-12 h-12 rounded-xl bg-surface-100 text-surface-700 text-xl font-bold hover:bg-surface-200 transition-all active:scale-95"
              >
                +
              </button>
            </div>
            <p className="text-center mt-4 text-surface-500">
              {formatCurrency(election.price_per_vote)} per vote
            </p>
            <div className="text-center mt-2">
              <span className="text-3xl font-bold text-success-600">
                Total: {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payer info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-surface-200/60 p-5">
            <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Information
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Your name (optional)"
                className="input"
              />
              <input
                type="tel"
                value={voterPhone}
                onChange={(e) => setVoterPhone(e.target.value)}
                placeholder="Mobile money number (e.g., 0241234567)"
                className="input"
                required
              />
              <input
                type="email"
                value={voterEmail}
                onChange={(e) => setVoterEmail(e.target.value)}
                placeholder="Email (for payment receipt)"
                className="input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedCandidate}
            className="btn btn-success btn-lg w-full"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pay {formatCurrency(totalAmount)} & Vote
              </span>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
