import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { formatDate } from '../../utils/formatters';
import CountdownTimer from '../../components/common/CountdownTimer';
import SkeletonCard from '../../components/common/SkeletonCard';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  Search,
  Lock,
  Zap,
  Smartphone,
  User,
  Calendar,
  CircleDollarSign,
  Check,
  Vote,
  BarChart3,
  ShieldCheck,
  Inbox,
  ArrowRight,
  Users,
  RefreshCw,
  Bell,
  Mail,
  Sun,
  Moon,
} from 'lucide-react';

const EVENT_TYPE_BADGES = {
  src: 'badge-primary',
  class_rep: 'badge-success',
  hall: 'badge-warning',
  pageant: 'badge-danger',
  custom: 'badge-gray',
};

const EVENT_TYPE_LABELS = {
  src: 'SRC',
  class_rep: 'Class Rep',
  hall: 'Hall',
  pageant: 'Pageant',
  custom: 'Custom',
};

const STATUS_BADGES = {
  active: 'badge-success',
  paused: 'badge-warning',
  completed: 'badge-gray',
  draft: 'badge-gray',
};

const STATUS_LABELS = {
  active: 'Live',
  paused: 'Paused',
  completed: 'Ended',
  draft: 'Draft',
};

export default function LandingPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contestantCode, setContestantCode] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const fetchElections = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    api.get('/api/elections')
      .then(res => setElections(res.data.elections))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const fetchNotifications = () => {
    api.get('/api/public/notifications')
      .then(res => setNotifications(res.data.notifications || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchElections();
    fetchNotifications();
    const interval = setInterval(() => { fetchElections(true); fetchNotifications(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filterElections = (electionList) => {
    return electionList.filter(e => {
      const matchesSearch = searchQuery === '' ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = eventTypeFilter === 'all' || e.event_type === eventTypeFilter;
      return matchesSearch && matchesType;
    });
  };

  const activeElections = filterElections(elections.filter(e => e.status === 'active'));
  const completedElections = filterElections(elections.filter(e => e.status === 'completed'));

  const handleLookup = (e) => {
    e.preventDefault();
    if (contestantCode.trim()) {
      navigate(`/lookup?code=${encodeURIComponent(contestantCode.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 transition-colors duration-300">
      {/* ===== Navbar ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
              <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-surface-900 text-lg tracking-tight">VoteSync<span className="text-primary-600">Pro</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/verify" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 font-medium transition-colors">
              <ShieldCheck className="w-4 h-4" />
              Verify Vote
            </Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/admin/login" className="btn btn-sm btn-secondary">
              <User className="w-4 h-4" />
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-surface-900" />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-accent-500/30 to-primary-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-primary-400/20 to-accent-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-accent-300/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-32 sm:pt-28 sm:pb-40">
          <div className="text-center max-w-4xl mx-auto">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
              </span>
              <span className="text-sm font-medium text-primary-100">
                {activeElections.length > 0
                  ? `${activeElections.length} election${activeElections.length > 1 ? 's' : ''} live now`
                  : 'Secure school voting platform'}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              Your Voice,{' '}
              <span className="bg-gradient-to-r from-accent-300 via-accent-400 to-primary-300 bg-clip-text text-transparent">
                Your Vote
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-200/90 mb-12 leading-relaxed max-w-2xl mx-auto">
              The modern platform for school elections, contests, and pageants.
              Secure, transparent, and effortless voting for every institution.
            </p>

            {/* Search bar */}
            <form onSubmit={handleLookup} className="max-w-xl mx-auto mb-12">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity" />
                <div className="relative flex bg-white dark:bg-surface-800 rounded-xl shadow-2xl shadow-primary-900/20">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 pointer-events-none" />
                    <input
                      type="text"
                      value={contestantCode}
                      onChange={(e) => setContestantCode(e.target.value)}
                      placeholder="Look up a contestant by code..."
                      className="w-full border-0 bg-transparent pl-12 pr-4 py-4 text-base text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-0"
                    />
                  </div>
                  <button type="submit" className="m-1.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:from-primary-500 hover:to-primary-600 transition-all shadow-md shadow-primary-600/30 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Lookup
                  </button>
                </div>
              </div>
            </form>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-8 sm:gap-12">
              <Stat value={elections.length} label="Elections" />
              <div className="w-px h-8 bg-white/10" />
              <Stat value={activeElections.length} label="Live Now" />
              <div className="w-px h-8 bg-white/10" />
              <Stat value={completedElections.length} label="Completed" />
            </div>
          </div>
        </div>

        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 80V40C360 0 1080 0 1440 40V80H0Z" fill="var(--color-surface-50)" />
          </svg>
        </div>
      </section>

      {/* ===== Features Strip ===== */}
      <section className="relative -mt-2 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Lock className="w-5 h-5" />}
              title="End-to-End Secure"
              desc="Every vote is encrypted and verified with tamper-proof receipts"
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              title="Instant Results"
              desc="Real-time vote tallying with live updates as votes come in"
            />
            <FeatureCard
              icon={<Smartphone className="w-5 h-5" />}
              title="Vote Anywhere"
              desc="Mobile-friendly design so voters can cast ballots from any device"
            />
          </div>
        </div>
      </section>

      {/* ===== Elections Section ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {loading ? (
          <div className="py-4">
            <SkeletonCard count={6} />
          </div>
        ) : (
          <>
            {/* Section header with tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-surface-900">Elections</h2>
                <p className="text-surface-500 mt-1">Browse and participate in ongoing elections</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchElections(true)}
                  disabled={refreshing}
                  className="p-2 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 transition-colors disabled:opacity-50"
                  title="Refresh elections"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <div className="bg-surface-100 dark:bg-surface-200 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      activeTab === 'active'
                        ? 'bg-white dark:bg-surface-100 text-surface-900 shadow-sm'
                        : 'text-surface-500 hover:text-surface-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {activeTab === 'active' && activeElections.length > 0 && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
                        </span>
                      )}
                      Active
                      {activeElections.length > 0 && (
                        <span className="bg-success-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                          {activeElections.length}
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      activeTab === 'completed'
                        ? 'bg-white dark:bg-surface-100 text-surface-900 shadow-sm'
                        : 'text-surface-500 hover:text-surface-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      Completed
                      {completedElections.length > 0 && (
                        <span className="bg-surface-300 text-surface-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                          {completedElections.length}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-8 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search elections..."
                  className="input w-full !pl-10"
                />
              </div>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="input w-full sm:w-48"
              >
                <option value="all">All Types</option>
                <option value="src">SRC</option>
                <option value="class_rep">Class Rep</option>
                <option value="hall">Hall</option>
                <option value="pageant">Pageant</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Public Notifications/Messages */}
            {notifications.length > 0 && (
              <div className="mb-8 space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border ${
                      notification.type === 'alert'
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                        : notification.type === 'reminder'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        notification.type === 'alert'
                          ? 'bg-red-100 dark:bg-red-900/50 text-red-600'
                          : notification.type === 'reminder'
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                      }`}>
                        {notification.type === 'alert' ? <Bell className="w-5 h-5" /> :
                         notification.type === 'reminder' ? <Mail className="w-5 h-5" /> :
                         <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-surface-800">{notification.title}</h4>
                        <p className="text-sm text-surface-600 mt-1">{notification.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active tab */}
            {activeTab === 'active' && (
              <>
                {activeElections.length === 0 ? (
                  <EmptyState
                    title="No active elections"
                    description="There are no elections currently accepting votes. Check back soon or browse completed elections."
                    action={completedElections.length > 0 ? () => setActiveTab('completed') : undefined}
                    actionLabel="View completed"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeElections.map(election => (
                      <ElectionCard key={election.id} election={election} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Completed tab */}
            {activeTab === 'completed' && (
              <>
                {completedElections.length === 0 ? (
                  <EmptyState
                    title="No completed elections"
                    description="Completed elections and their results will appear here."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {completedElections.map(election => (
                      <ElectionCard key={election.id} election={election} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ===== CTA Section ===== */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-surface-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Have a receipt? Verify your vote.
          </h2>
          <p className="text-primary-200/80 mb-8 max-w-lg mx-auto">
            Every vote generates a unique receipt hash. Use it to confirm your vote was recorded correctly.
          </p>
          <Link to="/verify" className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50 font-semibold shadow-xl shadow-primary-900/30 transition-all">
            <ShieldCheck className="w-5 h-5" />
            Verify a Vote
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-surface-900 text-surface-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <CheckCircle className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight">VoteSync<span className="text-primary-400">Pro</span></span>
                <p className="text-xs text-surface-500 mt-0.5">Secure voting for every institution</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/verify" className="hover:text-white transition-colors flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Verify Vote
              </Link>
              <Link to="/admin/login" className="hover:text-white transition-colors flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Admin Portal
              </Link>
            </div>
          </div>
          <div className="border-t border-surface-800 mt-8 pt-8 text-center">
            <p className="text-xs text-surface-500">
              &copy; {new Date().getFullYear()} VoteSync Pro. Built for transparent and secure elections.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ===== Sub-components ===== */

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs sm:text-sm text-primary-300/70 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white dark:bg-surface-100 rounded-xl border border-surface-100 dark:border-surface-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-100 text-primary-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-surface-900 text-sm">{title}</h3>
        <p className="text-surface-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, description, action, actionLabel }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-surface-200 p-16 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
        <Inbox className="w-7 h-7 text-surface-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-surface-700 mb-1">{title}</h3>
      <p className="text-surface-500 text-sm max-w-md mx-auto">{description}</p>
      {action && (
        <button onClick={action} className="btn btn-secondary btn-sm mt-4">
          {actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function ElectionCard({ election }) {
  const typeBadgeClass = EVENT_TYPE_BADGES[election.event_type] || 'badge-gray';
  const typeLabel = EVENT_TYPE_LABELS[election.event_type] || election.event_type;
  const statusBadgeClass = STATUS_BADGES[election.status] || 'badge-gray';
  const statusLabel = STATUS_LABELS[election.status] || election.status;
  const isActive = election.status === 'active';
  const isCompleted = election.status === 'completed';
  const isPaid = election.voting_type === 'paid';

  const totalVotes = election.total_votes || 0;
  const positionCount = election.position_count || 0;
  const candidateCount = election.candidate_count || 0;

  return (
    <div className="group bg-white dark:bg-surface-100 rounded-2xl border border-surface-100 dark:border-surface-200 shadow-sm hover:shadow-xl hover:border-surface-200 dark:hover:border-surface-300 transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden">
      {/* Colored top accent */}
      <div className={`h-1 ${isActive ? 'bg-gradient-to-r from-success-500 to-success-400' : isCompleted ? 'bg-gradient-to-r from-surface-300 to-surface-400' : 'bg-surface-200'}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header badges */}
        <div className="flex items-center justify-between mb-3">
          <span className={`badge ${typeBadgeClass}`}>{typeLabel}</span>
          <div className="flex items-center gap-1.5">
            {isActive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
              </span>
            )}
            <span className={`badge ${statusBadgeClass}`}>{statusLabel}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-surface-900 mb-1 leading-snug group-hover:text-primary-700 transition-colors">
          {election.title}
        </h3>
        {election.description && (
          <p className="text-sm text-surface-500 mb-3 line-clamp-2 leading-relaxed">{election.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-surface-500 mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium">{candidateCount}</span>
            <span className="hidden sm:inline">candidates</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="font-medium">{positionCount}</span>
            <span className="hidden sm:inline">positions</span>
          </div>
          <div className="flex items-center gap-1">
            <Vote className="w-3.5 h-3.5" />
            <span className="font-medium">{totalVotes}</span>
            <span className="hidden sm:inline">votes</span>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(election.start_date)} &mdash; {formatDate(election.end_date)}</span>
          </div>
          {isPaid ? (
            <span className="inline-flex items-center gap-1 bg-warning-50 text-warning-600 px-2 py-0.5 rounded-full font-medium">
              <CircleDollarSign className="w-3 h-3" />
              {election.currency || 'GHS'} {election.price_per_vote}/vote
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-success-50 text-success-600 px-2 py-0.5 rounded-full font-medium">
              <Check className="w-3 h-3" />
              Free
            </span>
          )}
        </div>

        {/* Countdown */}
        {isActive && election.end_date && (
          <div className="bg-surface-50 dark:bg-surface-200 rounded-lg px-3 py-2 mb-4">
            <CountdownTimer targetDate={election.end_date} label="Ends in" compact />
          </div>
        )}

        {/* Spacer */}
        <div className="mt-auto" />

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {isActive && (
            <Link
              to={isPaid ? `/vote/${election.id}/paid` : `/vote/${election.id}`}
              className="btn btn-primary flex-1 text-center group-hover:shadow-lg group-hover:shadow-primary-500/20 transition-shadow"
            >
              <Vote className="w-4 h-4" />
              Vote Now
            </Link>
          )}
          {election.results_public ? (
            <Link
              to={`/election/${election.id}/results`}
              className="btn btn-secondary flex-1 text-center"
            >
              <BarChart3 className="w-4 h-4" />
              View Results
            </Link>
          ) : isCompleted ? (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-50 dark:bg-surface-200 text-surface-400 text-sm">
              <Lock className="w-3.5 h-3.5" />
              Results pending
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
