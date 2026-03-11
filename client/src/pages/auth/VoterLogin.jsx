import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function VoterLogin() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { loginVoter } = useAuth();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Student ID + PIN fields
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');

  // Voter code field
  const [code, setCode] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/api/elections/${electionId}`),
      api.get(`/api/elections/${electionId}/notifications`).catch(() => ({ data: { notifications: [] } }))
    ])
      .then(([electionRes, notificationsRes]) => {
        setElection(electionRes.data.election);
        setNotifications(notificationsRes.data.notifications || []);
      })
      .catch(() => toast.error('Election not found'))
      .finally(() => setLoading(false));
  }, [electionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = election.auth_method === 'student_id_pin'
        ? { method: 'student_id_pin', election_id: parseInt(electionId), student_id: studentId, pin }
        : { method: 'voter_code', election_id: parseInt(electionId), code };

      await loginVoter(data);
      toast.success('Authentication successful');
      navigate(`/vote/${electionId}/ballot`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading election..." />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <p className="text-surface-500 text-lg">Election not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4 py-12">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold gradient-text">VoteSync Pro</h1>
          <p className="text-surface-500 text-sm mt-1">Secure Digital Voting</p>
        </div>

        {/* Notifications/Messages */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.type === 'alert'
                    ? 'bg-red-50 border-red-200'
                    : notification.type === 'reminder'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    notification.type === 'alert'
                      ? 'bg-red-100 text-red-600'
                      : notification.type === 'reminder'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-surface-800">{notification.title}</h4>
                    <p className="text-xs text-surface-600 mt-1">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-surface-200/60 p-8">
          <h2 className="text-xl font-bold text-surface-900 mb-1">{election.title}</h2>
          <p className="text-sm text-surface-500 mb-6">Please authenticate to cast your vote</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {election.auth_method === 'student_id_pin' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter your student ID"
                    className="input text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">PIN</label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter your PIN"
                    className="input text-lg text-center tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Voter Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., VOTE-A7X9K2"
                  className="input text-lg font-mono text-center tracking-wider"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-lg w-full"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </span>
              ) : 'Proceed to Vote'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-100 text-center">
            <p className="text-xs text-surface-400">
              Your vote is anonymous and securely encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
