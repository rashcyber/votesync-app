import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { EVENT_TYPES, ELECTION_STATUSES, VOTING_TYPES, AUTH_METHODS } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CountdownTimer from '../../components/common/CountdownTimer';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Layers, Users, UserCheck, BarChart3, CreditCard,
  PlayCircle, PauseCircle, CheckCircle2, Calendar, Info, Pencil,
  QrCode, Copy, FileText, BarChart2, ChevronRight, Eye, EyeOff, Bell, Clock,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Status badge mapping using custom CSS classes
   ──────────────────────────────────────────── */

const STATUS_BADGE = {
  draft:     { label: 'Draft',     cls: 'badge badge-gray' },
  active:    { label: 'Active',    cls: 'badge badge-success' },
  paused:    { label: 'Paused',    cls: 'badge badge-warning' },
  completed: { label: 'Completed', cls: 'badge badge-primary' },
};

export default function ElectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [duplicating, setDuplicating] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const fetchData = () => {
    api.get(`/api/elections/${id}`)
      .then(res => {
        setElection(res.data.election);
        setPositions(res.data.positions);
        setCandidates(res.data.candidates);
      })
      .catch(() => toast.error('Failed to load election'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.patch(`/api/elections/${id}/status`, { status: newStatus });
      setElection(res.data.election);
      toast.success(`Election ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleQRCode = async () => {
    try {
      const res = await api.get(`/api/elections/${id}/qrcode`);
      setQrData(res.data);
      setQrModal(true);
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleDuplicate = async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    setDuplicating(true);
    try {
      const res = await api.post(`/api/elections/${id}/duplicate`, { start_date: startDate, end_date: endDate });
      toast.success('Election duplicated as draft');
      navigate(`/admin/elections/${res.data.election.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to duplicate');
    } finally {
      setDuplicating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!election) return;
    setSavingTemplate(true);
    try {
      await api.post('/api/templates', {
        name: `${election.title} Template`,
        description: `Template from election: ${election.title}`,
        config: {
          title: election.title,
          event_type: election.event_type,
          voting_type: election.voting_type,
          auth_method: election.auth_method,
          price_per_vote: election.price_per_vote,
          positions: positions.map(p => ({ title: p.title, description: p.description, max_votes: p.max_votes })),
        },
      });
      toast.success('Saved as template');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleToggleResults = async () => {
    try {
      const res = await api.put(`/api/elections/${id}`, { results_public: election.results_public ? 0 : 1 });
      setElection(res.data.election);
      toast.success(res.data.election.results_public ? 'Results are now public' : 'Results hidden from public');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    }
  };

  const handleToggleLanding = async () => {
    const token = localStorage.getItem('adminToken');
    console.log('Admin token present:', !!token);
    console.log('Election current show_on_landing:', election.show_on_landing);
    try {
      const res = await api.put(`/api/elections/${id}`, { show_on_landing: election.show_on_landing ? 0 : 1 });
      console.log('Toggle success:', res.data);
      setElection(res.data.election);
      toast.success(res.data.election.show_on_landing ? 'Shown on landing page' : 'Hidden from landing page');
    } catch (err) {
      console.error('Toggle landing error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.error?.message || `Failed to update (${err.response?.status})`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="h-14 w-14 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <Info className="h-6 w-6 text-surface-400" strokeWidth={1.5} />
        </div>
        <p className="text-surface-500">Election not found.</p>
      </div>
    );
  }

  const badge = STATUS_BADGE[election.status] || STATUS_BADGE.draft;

  /* ---- Quick links data ---- */
  const quickLinks = [
    {
      to: `/admin/elections/${id}/positions`,
      value: positions.length,
      label: 'Positions',
      icon: <Layers className="h-6 w-6" strokeWidth={1.5} />,
      iconBg: 'from-primary-50 to-primary-100',
      iconText: 'text-primary-600',
      borderColor: 'border-l-primary-500',
    },
    {
      to: `/admin/elections/${id}/candidates`,
      value: candidates.length,
      label: 'Candidates',
      icon: <Users className="h-6 w-6" strokeWidth={1.5} />,
      iconBg: 'from-accent-50 to-accent-100',
      iconText: 'text-accent-600',
      borderColor: 'border-l-accent-500',
    },
    {
      to: `/admin/elections/${id}/voters`,
      value: 'Manage',
      label: 'Voters',
      icon: <UserCheck className="h-6 w-6" strokeWidth={1.5} />,
      iconBg: 'from-success-50 to-green-100',
      iconText: 'text-success-600',
      borderColor: 'border-l-success-500',
      isAction: true,
    },
    {
      to: `/admin/elections/${id}/results`,
      value: 'View',
      label: 'Results',
      icon: <BarChart3 className="h-6 w-6" strokeWidth={1.5} />,
      iconBg: 'from-warning-50 to-amber-100',
      iconText: 'text-warning-600',
      borderColor: 'border-l-warning-500',
      isAction: true,
    },
    {
      to: `/admin/elections/${id}/messages`,
      value: 'Send',
      label: 'Messages',
      icon: <Bell className="h-6 w-6" strokeWidth={1.5} />,
      iconBg: 'from-purple-50 to-purple-100',
      iconText: 'text-purple-600',
      borderColor: 'border-l-purple-500',
      isAction: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════
          BACK LINK
          ═══════════════════════════════════════════ */}
      <Link
        to="/admin/elections"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Elections
      </Link>

      {/* ═══════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900">{election.title}</h2>
            <span className={badge.cls}>{badge.label}</span>
          </div>
          <p className="text-sm text-surface-500 flex items-center gap-1.5">
            {EVENT_TYPES[election.event_type]} &middot; {VOTING_TYPES[election.voting_type]} &middot; {AUTH_METHODS[election.auth_method]}
          </p>
          {election.voting_type === 'paid' && (
            <p className="text-sm text-success-600 font-semibold mt-1.5 flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              {election.currency || 'GHS'} {election.price_per_vote} per vote
            </p>
          )}
          
          {/* Countdown Timer */}
          {election.status === 'active' && election.end_date && (
            <div className="mt-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning-500" />
              <CountdownTimer targetDate={election.end_date} label="Ends in" />
            </div>
          )}
          {election.status === 'draft' && election.start_date && (
            <div className="mt-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" />
              <CountdownTimer targetDate={election.start_date} label="Starts in" />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/admin/elections/${id}/edit`} className="btn btn-secondary">
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </Link>
          {election.status === 'draft' && (
            <button onClick={() => handleStatusChange('active')} className="btn btn-success">
              <PlayCircle className="w-4 h-4" />
              <span>Activate</span>
            </button>
          )}
          {election.status === 'active' && (
            <>
              <button onClick={() => handleStatusChange('paused')} className="btn bg-warning-500 text-white hover:bg-warning-600 transition-colors text-sm font-medium px-4 py-2.5 rounded-lg inline-flex items-center gap-2">
                <PauseCircle className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button onClick={() => handleStatusChange('completed')} className="btn btn-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete</span>
              </button>
            </>
          )}
          {election.status === 'paused' && (
            <button onClick={() => handleStatusChange('active')} className="btn btn-success">
              <PlayCircle className="w-4 h-4" />
              <span>Resume</span>
            </button>
          )}
          {election.status === 'completed' && (
            <button onClick={() => handleStatusChange('active')} className="btn btn-success">
              <PlayCircle className="w-4 h-4" />
              <span>Reactivate</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          EXTRA ACTIONS
          ═══════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={handleQRCode} className="btn btn-secondary btn-sm">
          <QrCode className="w-4 h-4" />
          QR Code
        </button>
        <button onClick={handleDuplicate} disabled={duplicating} className="btn btn-secondary btn-sm">
          <Copy className="w-4 h-4" />
          {duplicating ? 'Duplicating...' : 'Duplicate'}
        </button>
        <button onClick={handleSaveTemplate} disabled={savingTemplate} className="btn btn-secondary btn-sm">
          <FileText className="w-4 h-4" />
          {savingTemplate ? 'Saving...' : 'Save as Template'}
        </button>
        <Link to={`/admin/elections/${id}/analytics`} className="btn btn-secondary btn-sm">
          <BarChart2 className="w-4 h-4" />
          Analytics
        </Link>
        <button
          onClick={handleToggleResults}
          className={`btn btn-sm ${
            election.results_public
              ? '!bg-success-50 !text-success-700 !border-success-200 hover:!bg-success-100'
              : 'btn-secondary'
          }`}
          title={election.results_public ? 'Click to hide results from public' : 'Click to make results public'}
        >
          {election.results_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {election.results_public ? 'Results Public' : 'Results Hidden'}
        </button>
        <button
          onClick={handleToggleLanding}
          className={`btn btn-sm ${
            election.show_on_landing
              ? '!bg-primary-50 !text-primary-700 !border-primary-200 hover:!bg-primary-100'
              : 'btn-secondary'
          }`}
          title={election.show_on_landing ? 'Click to hide from landing page' : 'Click to show on landing page'}
        >
          {election.show_on_landing ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {election.show_on_landing ? 'On Landing' : 'Off Landing'}
        </button>
      </div>

      {/* QR Code Modal */}
      {qrModal && qrData && (
        <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQrModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-surface-900 mb-2">Election QR Code</h3>
              <p className="text-sm text-surface-500 mb-4">Scan to access the voting page</p>
              <img src={qrData.qrcode} alt="QR Code" className="mx-auto w-64 h-64 rounded-lg" />
              <p className="text-xs text-surface-400 mt-3 font-mono break-all">{qrData.url}</p>
              <div className="flex gap-2 mt-4">
                <a
                  href={qrData.qrcode}
                  download={`qr-election-${id}.png`}
                  className="btn btn-primary flex-1"
                >
                  Download
                </a>
                <button onClick={() => setQrModal(false)} className="btn btn-secondary flex-1">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          QUICK LINKS GRID
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className={`card-hover bg-white rounded-xl border border-surface-200 border-l-4 ${link.borderColor} p-5 shadow-sm transition-all group`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${link.isAction ? 'text-primary-600 group-hover:text-primary-700' : 'text-surface-900'} transition-colors`}>
                  {link.value}
                </p>
                <p className="text-sm text-surface-500 mt-1">{link.label}</p>
              </div>
              <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br ${link.iconBg} ${link.iconText}`}>
                {link.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          PAYMENTS LINK (paid elections only)
          ═══════════════════════════════════════════ */}
      {election.voting_type === 'paid' && (
        <Link
          to={`/admin/elections/${id}/payments`}
          className="card-hover flex items-center justify-between bg-white rounded-xl border border-surface-200 p-5 shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-success-50 to-green-100 text-success-600">
              <CreditCard className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-medium text-surface-800 group-hover:text-primary-700 transition-colors">Manage Payments</p>
              <p className="text-xs text-surface-400">View and approve payment transactions</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-surface-400 group-hover:text-primary-600 transition-colors" />
        </Link>
      )}

      {/* ═══════════════════════════════════════════
          USSD SETTINGS CARD
          ═══════════════════════════════════════════ */}
      {election.ussd_enabled ? (
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-purple-100 bg-purple-50">
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
            <h3 className="text-base font-semibold text-purple-800">USSD Voting Enabled</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-purple-100 text-purple-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-surface-500">Service Code</p>
                <p className="text-lg font-bold font-mono text-surface-900">{election.ussd_service_code || 'Not set'}</p>
              </div>
            </div>
            <p className="text-xs text-surface-400 mt-3">Voters can dial this code to vote via USSD on any phone</p>
          </div>
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════
          ELECTION DETAILS CARD
          ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-100">
          <Info className="h-5 w-5 text-surface-400" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-surface-800">Election Details</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-surface-400" />
              <span className="text-surface-500">Start:</span>
              <span className="font-medium text-surface-800">{formatDate(election.start_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-surface-400" />
              <span className="text-surface-500">End:</span>
              <span className="font-medium text-surface-800">{formatDate(election.end_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-surface-500">Code Prefix:</span>
              <span className="font-mono font-medium text-surface-800 bg-surface-50 px-2 py-0.5 rounded">{election.code_prefix || 'Auto'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-surface-400" />
              <span className="text-surface-500">Public Results:</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${election.results_public ? 'bg-success-50 text-success-700' : 'bg-surface-100 text-surface-500'}`}>
                {election.results_public ? 'Visible to voters' : 'Hidden from voters'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-surface-400" />
              <span className="text-surface-500">Landing Page:</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${election.show_on_landing ? 'bg-primary-50 text-primary-700' : 'bg-surface-100 text-surface-500'}`}>
                {election.show_on_landing ? 'Shown' : 'Hidden'}
              </span>
            </div>
          </div>
          {election.description && (
            <div className="mt-4 pt-4 border-t border-surface-100">
              <p className="text-sm text-surface-600 leading-relaxed">{election.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
