import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { CheckCircle2, ArrowLeft, Vote, Loader2, User } from 'lucide-react';

export default function ReviewPage() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { voterToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { selections, ballot, election } = location.state || {};

  // Redirect to ballot if accessed directly without state
  if (!selections || !ballot || !election) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Vote className="w-6 h-6 text-surface-400" />
        </div>
        <p className="text-surface-500 mb-4">No selections found. Please complete the ballot first.</p>
        <button
          onClick={() => navigate(`/vote/${electionId}/ballot`)}
          className="btn btn-primary"
        >
          Go to Ballot
        </button>
      </div>
    );
  }

  // Build summary from selections
  const getSummary = () => {
    return ballot.map(position => {
      const sel = selections[position.id];
      let selectedCandidates = [];

      if (Array.isArray(sel)) {
        selectedCandidates = position.candidates.filter(c => sel.includes(c.id));
      } else if (sel !== undefined) {
        const found = position.candidates.find(c => c.id === sel);
        if (found) selectedCandidates = [found];
      }

      return { position, candidates: selectedCandidates };
    });
  };

  const summary = getSummary();

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const voteSelections = [];
      for (const [position_id, value] of Object.entries(selections)) {
        if (Array.isArray(value)) {
          for (const candidate_id of value) {
            voteSelections.push({ position_id: parseInt(position_id), candidate_id: parseInt(candidate_id) });
          }
        } else {
          voteSelections.push({ position_id: parseInt(position_id), candidate_id: parseInt(value) });
        }
      }

      const voteRes = await api.post(`/api/voting/elections/${electionId}/vote`, {
        selections: voteSelections,
      }, {
        headers: { Authorization: `Bearer ${voterToken}` },
      });

      toast.success('Vote cast successfully!');
      navigate(`/vote/${electionId}/thank-you`, {
        state: { receipt_hash: voteRes.data.receipt_hash },
      });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/vote/${electionId}/ballot`, { state: { selections, ballot, election } })}
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ballot
        </button>
        <h2 className="text-2xl font-bold text-surface-900">Review Your Selections</h2>
        <p className="text-sm text-surface-500 mt-1">{election.title} &mdash; Please confirm your choices before submitting</p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4 mb-8">
        {summary.map(({ position, candidates }) => (
          <div key={position.id} className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-success-50 border-b border-success-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-500" strokeWidth={2.5} />
              <h3 className="font-semibold text-surface-900 text-sm">{position.title}</h3>
            </div>
            <div className="p-4">
              {candidates.map(candidate => (
                <div key={candidate.id} className="flex items-center gap-3 py-2">
                  {candidate.photo_url ? (
                    <img
                      src={candidate.photo_url}
                      alt={candidate.full_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm border-2 border-primary-200">
                      {candidate.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-surface-900 text-sm">{candidate.full_name}</p>
                    {candidate.contestant_code && (
                      <p className="text-xs text-surface-400 font-mono">{candidate.contestant_code}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Notice */}
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-warning-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-warning-800">This action is final</p>
            <p className="text-xs text-warning-700 mt-0.5">Once you submit your vote, it cannot be changed or undone. Please review your selections carefully.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/vote/${electionId}/ballot`)}
          className="btn btn-secondary btn-lg flex-1"
        >
          <ArrowLeft className="w-5 h-5" />
          Change Selections
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="btn btn-primary btn-lg flex-1 shadow-lg shadow-primary-500/25"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Vote...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Confirm & Submit Vote
            </>
          )}
        </button>
      </div>
    </div>
  );
}
