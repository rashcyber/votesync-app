import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CountdownTimer from '../../components/common/CountdownTimer';
import {
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  AlertCircle,
  Vote,
  Loader2,
  Clock,
  BadgeCheck,
  User,
} from 'lucide-react';

export default function BallotPage() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { voterToken } = useAuth();
  const [ballot, setBallot] = useState(null);
  const [election, setElection] = useState(null);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/api/voting/elections/${electionId}/ballot`, {
      headers: { Authorization: `Bearer ${voterToken}` },
    })
      .then(res => {
        setElection(res.data.election);
        setBallot(res.data.ballot);
      })
      .catch(err => toast.error(err.response?.data?.error?.message || 'Failed to load ballot'))
      .finally(() => setLoading(false));
  }, [electionId, voterToken]);

  const handleSelect = (positionId, candidateId, maxVotes) => {
    if (maxVotes > 1) {
      setSelections(prev => {
        const current = Array.isArray(prev[positionId]) ? prev[positionId] : [];
        if (current.includes(candidateId)) {
          const updated = current.filter(id => id !== candidateId);
          const next = { ...prev };
          if (updated.length === 0) delete next[positionId];
          else next[positionId] = updated;
          return next;
        }
        if (current.length >= maxVotes) {
          toast.error(`You can only select up to ${maxVotes} candidates for this position`);
          return prev;
        }
        return { ...prev, [positionId]: [...current, candidateId] };
      });
    } else {
      setSelections(prev => ({ ...prev, [positionId]: candidateId }));
    }
  };

  const isSelected = (positionId, candidateId, maxVotes) => {
    if (maxVotes > 1) {
      const arr = selections[positionId];
      return Array.isArray(arr) && arr.includes(candidateId);
    }
    return selections[positionId] === candidateId;
  };

  const positionHasSelection = (positionId) => {
    const sel = selections[positionId];
    if (Array.isArray(sel)) return sel.length > 0;
    return sel !== undefined;
  };

  const completedPositions = ballot ? ballot.filter(p => positionHasSelection(p.id)).length : 0;
  const totalPositions = ballot?.length || 0;

  const handleSubmit = () => {
    if (completedPositions < totalPositions) {
      toast.error('Please make a selection for every position');
      return;
    }

    navigate(`/vote/${electionId}/review`, {
      state: { selections, ballot, election },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" text="Loading ballot..." />
      </div>
    );
  }

  if (!ballot) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6 text-danger-600" />
        </div>
        <p className="text-surface-500">Failed to load ballot.</p>
      </div>
    );
  }

  const progressPercent = totalPositions > 0 ? (completedPositions / totalPositions) * 100 : 0;
  const allDone = completedPositions === totalPositions;

  return (
    <div className="pb-40">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold gradient-text">{election.title}</h2>
        <p className="text-sm text-surface-500 mt-1">Select your preferred candidate for each position below</p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            allDone ? 'bg-success-50 text-success-700' : 'bg-primary-50 text-primary-700'
          }`}>
            {allDone
              ? <BadgeCheck className="w-3.5 h-3.5" />
              : <Circle className="w-3.5 h-3.5" />}
            {completedPositions}/{totalPositions} positions done
          </span>
          {election.end_date && (
            <span className="inline-flex items-center gap-1.5 text-xs text-surface-500">
              <Clock className="w-3.5 h-3.5" />
              <CountdownTimer targetDate={election.end_date} label="Ends in" compact />
            </span>
          )}
        </div>
      </div>

      {/* Ballot positions */}
      <div className="space-y-8">
        {ballot.map((position, posIdx) => {
          const maxVotes = position.max_votes || 1;
          const multi = maxVotes > 1;
          const selCount = multi
            ? (Array.isArray(selections[position.id]) ? selections[position.id].length : 0)
            : (selections[position.id] !== undefined ? 1 : 0);
          const done = positionHasSelection(position.id);

          return (
            <div key={position.id} className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
              {/* Position header */}
              <div className={`px-5 py-4 flex items-center justify-between border-b ${
                done ? 'bg-success-50 border-success-100' : 'bg-surface-50 border-surface-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                    done
                      ? 'bg-success-500 text-white'
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    {done ? <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={2.5} /> : posIdx + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-surface-900">{position.title}</h3>
                    {position.description && (
                      <p className="text-xs text-surface-500 mt-0.5">{position.description}</p>
                    )}
                  </div>
                </div>
                {multi ? (
                  <span className="text-xs font-medium text-surface-500 bg-white border border-surface-200 px-2.5 py-1 rounded-full">
                    {selCount}/{maxVotes} selected
                  </span>
                ) : (
                  <span className="text-xs text-surface-400">Choose one</span>
                )}
              </div>

              {/* Candidate grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {position.candidates.map(candidate => {
                  const selected = isSelected(position.id, candidate.id, maxVotes);
                  const SelectIcon = multi
                    ? (selected ? CheckSquare : Square)
                    : (selected ? CheckCircle2 : Circle);

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleSelect(position.id, candidate.id, maxVotes)}
                      className={`relative w-full text-left rounded-xl border-2 transition-all duration-200 overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        selected
                          ? 'border-primary-500 shadow-md shadow-primary-100 bg-primary-50/40'
                          : 'border-surface-100 hover:border-primary-200 hover:shadow-sm bg-white'
                      }`}
                    >
                      {/* Selected indicator ribbon */}
                      {selected && (
                        <div className="absolute top-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                          SELECTED
                        </div>
                      )}

                      {/* Photo area */}
                      <div className={`w-full aspect-[4/3] overflow-hidden ${selected ? 'bg-primary-100' : 'bg-surface-100'}`}>
                        {candidate.photo_url ? (
                          <img
                            src={candidate.photo_url}
                            alt={candidate.full_name}
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
                              selected
                                ? 'bg-primary-500 text-white'
                                : 'bg-surface-200 text-surface-500'
                            }`}>
                              {candidate.full_name.charAt(0)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info area */}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm leading-tight ${selected ? 'text-primary-700' : 'text-surface-900'}`}>
                              {candidate.full_name}
                            </p>
                            {candidate.contestant_code && (
                              <p className="text-xs text-surface-400 font-mono mt-0.5">{candidate.contestant_code}</p>
                            )}
                          </div>
                          <SelectIcon
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selected ? 'text-primary-500' : 'text-surface-300'}`}
                            strokeWidth={selected ? 2.5 : 1.5}
                          />
                        </div>
                        {candidate.portfolio && (
                          <p className="text-xs text-surface-500 mt-1.5 leading-relaxed line-clamp-2">
                            {candidate.portfolio}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-surface-200 px-4 py-4 shadow-2xl shadow-surface-900/10 z-50">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-surface-600 font-medium">
              {completedPositions} of {totalPositions} positions selected
            </span>
            <span className={`text-sm font-bold ${allDone ? 'text-success-600' : 'text-primary-600'}`}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                allDone
                  ? 'bg-gradient-to-r from-success-500 to-success-400'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!allDone}
            className={`btn btn-lg w-full transition-all ${
              allDone
                ? 'btn-primary shadow-lg shadow-primary-500/25'
                : 'bg-surface-100 text-surface-400 cursor-not-allowed'
            }`}
          >
            <Vote className="w-5 h-5" />
            {allDone ? 'Review Selections' : `Select ${totalPositions - completedPositions} more position${totalPositions - completedPositions > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
