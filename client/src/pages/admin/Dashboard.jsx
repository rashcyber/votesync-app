import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { EVENT_TYPES } from '../../utils/constants';
import { formatDate, formatNumber } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SkeletonCard from '../../components/common/SkeletonCard';
import { ClipboardList, Zap, Users, CheckCircle2, Plus, Upload, ChevronRight, Calendar, BarChart3, UserPlus, Clock, Bell, TrendingUp, Send, Eye, Play, Pause, AlertCircle } from 'lucide-react';

/* ────────────────────────────────────────────
   Status badge mapping using custom CSS classes
   ──────────────────────────────────────────── */

const STATUS_BADGE = {
  draft:     { label: 'Draft',     cls: 'badge badge-gray' },
  active:    { label: 'Active',    cls: 'badge badge-success' },
  paused:    { label: 'Paused',    cls: 'badge badge-warning' },
  completed: { label: 'Completed', cls: 'badge badge-primary' },
};

/* ────────────────────────────────────────────
   Dashboard component
   ──────────────────────────────────────────── */

export default function Dashboard() {
  const { admin } = useAuth();

  const [elections, setElections] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveElection, setLiveElection] = useState(null);
  const [upcomingElections, setUpcomingElections] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [electionsRes, studentsRes] = await Promise.all([
        api.get('/api/elections'),
        api.get('/api/voters/students').catch(() => ({ data: { students: [] } })),
      ]);
      
      const electionData = electionsRes.data.elections || [];
      setElections(electionData);
      setStudents(studentsRes.data.students || []);
      
      const active = electionData.find(e => e.status === 'active');
      setLiveElection(active || null);
      
      const now = new Date();
      const upcoming = electionData
        .filter(e => e.status === 'draft' && new Date(e.start_date) > now)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, 3);
      setUpcomingElections(upcoming);
      
      const recent = electionData.slice(0, 5).map(e => ({
        id: e.id,
        title: e.title,
        status: e.status,
        votes: e.total_votes || 0,
        time: e.updated_at || e.created_at,
      }));
      setActivityFeed(recent);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---- derived data ---- */
  const activeElections    = elections.filter(e => e.status === 'active');
  const totalVotesCast     = elections.reduce((sum, e) => sum + (e.total_votes || 0), 0);
  const recentElections    = elections.slice(0, 6);

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes, total: diff };
  };

  const formatTimeRemaining = (endDate) => {
    const remaining = getTimeRemaining(endDate);
    if (!remaining) return 'Starting soon';
    if (remaining.days > 0) return `${remaining.days}d ${remaining.hours}h`;
    if (remaining.hours > 0) return `${remaining.hours}h ${remaining.minutes}m`;
    return `${remaining.minutes}m`;
  };

  /* ---- date for header ---- */
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /* ---- Live Election Banner & Upcoming Elections ---- */
  const showBanner = liveElection || upcomingElections.length > 0;

  /* ---- stat card data ---- */
  const stats = [
    {
      title: 'Total Elections',
      value: elections.length,
      icon: <ClipboardList className="h-6 w-6" strokeWidth={1.5} />,
      borderColor: 'border-l-primary-500',
      iconBg: 'from-primary-50 to-primary-100',
      iconText: 'text-primary-600',
    },
    {
      title: 'Active Elections',
      value: activeElections.length,
      icon: <Zap className="h-6 w-6" strokeWidth={1.5} />,
      borderColor: 'border-l-success-500',
      iconBg: 'from-success-50 to-green-100',
      iconText: 'text-success-600',
    },
    {
      title: 'Total Students',
      value: students.length,
      icon: <Users className="h-6 w-6" strokeWidth={1.5} />,
      borderColor: 'border-l-accent-500',
      iconBg: 'from-accent-50 to-accent-100',
      iconText: 'text-accent-600',
    },
    {
      title: 'Total Votes Cast',
      value: totalVotesCast,
      icon: <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />,
      borderColor: 'border-l-warning-500',
      iconBg: 'from-warning-50 to-amber-100',
      iconText: 'text-warning-600',
    },
  ];

  /* ---- loading state ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-surface-200 p-5 space-y-3">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════
          WELCOME HEADER
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">
            Welcome back,{' '}
            <span className="gradient-text">
              {admin?.name || admin?.username || 'Admin'}
            </span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-surface-500">
            <Calendar className="h-4 w-4" />
            {today}
          </p>
        </div>

          {/* Quick actions */}
          <div className="flex items-center gap-3">
            <Link to="/admin/students" className="btn btn-secondary">
              <UserPlus className="h-5 w-5" />
              <span>Add Student</span>
            </Link>
            <Link to="/admin/students" className="btn btn-secondary">
              <Upload className="h-5 w-5" />
              <span>Import Students</span>
            </Link>
            <Link to="/admin/elections/create" className="btn btn-primary">
              <Plus className="h-5 w-5" />
              <span>Create Election</span>
            </Link>
          </div>
        </div>

      {/* Live Election Banner */}
      {showBanner && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {liveElection && (
            <Link
              to={`/admin/elections/${liveElection.id}`}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-success-500 to-success-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
            >
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Zap className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white">LIVE NOW</span>
                  <span className="text-success-100 text-xs">Votes: {liveElection.total_votes || 0}</span>
                </div>
                <h3 className="text-lg font-bold text-white truncate">{liveElection.title}</h3>
                <p className="text-success-100 text-sm">Click to view live results</p>
              </div>
              <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}

          {upcomingElections.length > 0 && (
            <div className="bg-white rounded-xl border border-surface-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-surface-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  Upcoming Elections
                </h3>
              </div>
              <div className="space-y-2">
                {upcomingElections.map((election) => (
                  <div key={election.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-surface-700 truncate">{election.title}</p>
                      <p className="text-xs text-surface-400">{formatDate(election.start_date)}</p>
                    </div>
                    <span className="text-primary-600 font-medium text-xs bg-primary-50 px-2 py-1 rounded-lg">
                      {formatTimeRemaining(election.start_date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STATS GRID  (4 cols desktop / 2 cols mobile)
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={`card-hover bg-white rounded-xl border border-surface-200 border-l-4 ${stat.borderColor} p-5 shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-surface-500 truncate">
                  {stat.title}
                </p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-surface-900">
                  {formatNumber(stat.value)}
                </p>
              </div>
              {/* Gradient icon background */}
              <div
                className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br ${stat.iconBg} ${stat.iconText}`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT AREA  —  two columns on large screens
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ---- Recent Elections (spans 2 cols) ---- */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-800">Recent Elections</h2>
            <Link
              to="/admin/elections"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {recentElections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-surface-100 flex items-center justify-center mb-4">
                <ClipboardList className="h-6 w-6 text-surface-400" strokeWidth={1.5} />
              </div>
              <p className="text-surface-500 mb-4">No elections created yet.</p>
              <Link to="/admin/elections/create" className="btn btn-primary btn-sm">
                <Plus className="h-5 w-5" />
                Create your first election
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {recentElections.map((election) => {
                const badge = STATUS_BADGE[election.status] || STATUS_BADGE.draft;
                return (
                  <Link
                    key={election.id}
                    to={`/admin/elections/${election.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-surface-800 truncate group-hover:text-primary-700 transition-colors">
                        {election.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-surface-400">
                          {EVENT_TYPES[election.event_type] || election.event_type}
                        </span>
                        {election.created_at && (
                          <>
                            <span className="text-surface-300">&middot;</span>
                            <span className="text-xs text-surface-400">
                              {formatDate(election.created_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {typeof election.total_votes === 'number' && (
                        <span className="hidden sm:inline text-xs text-surface-400">
                          {formatNumber(election.total_votes)} vote{election.total_votes !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className={badge.cls}>{badge.label}</span>
                      <ChevronRight className="h-4 w-4 text-surface-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ---- Quick Actions sidebar ---- */}
        <div className="space-y-6">
          {/* Quick Actions card */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h2 className="text-base font-semibold text-surface-800">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-3">
              <Link
                to="/admin/elections/create"
                className="card-hover flex items-center gap-3 p-3 rounded-lg border border-surface-100 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-800">Create Election</p>
                  <p className="text-xs text-surface-400">Set up a new voting event</p>
                </div>
              </Link>

              <Link
                to="/admin/students"
                className="card-hover flex items-center gap-3 p-3 rounded-lg border border-surface-100 hover:border-accent-200 hover:bg-accent-50/40 transition-colors"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-accent-50 to-accent-100 text-accent-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-800">Add Student</p>
                  <p className="text-xs text-surface-400">Register a new student</p>
                </div>
              </Link>

              <Link
                to="/admin/students"
                className="card-hover flex items-center gap-3 p-3 rounded-lg border border-surface-100 hover:border-warning-200 hover:bg-warning-50/40 transition-colors"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-warning-50 to-amber-100 text-warning-600">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-800">Import Students</p>
                  <p className="text-xs text-surface-400">Bulk upload student roster</p>
                </div>
              </Link>

              <Link
                to="/admin/elections"
                className="card-hover flex items-center gap-3 p-3 rounded-lg border border-surface-100 hover:border-success-200 hover:bg-success-50/40 transition-colors"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-success-50 to-green-100 text-success-600">
                  <ClipboardList className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-800">Manage Elections</p>
                  <p className="text-xs text-surface-400">View and edit all elections</p>
                </div>
              </Link>

              {activeElections.length > 0 && (
                <Link
                  to={`/admin/elections/${activeElections[0].id}/results`}
                  className="card-hover flex items-center gap-3 p-3 rounded-lg border border-surface-100 hover:border-purple-200 hover:bg-purple-50/40 transition-colors"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600">
                    <BarChart3 className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-800">View Live Results</p>
                    <p className="text-xs text-surface-400">See real-time voting results</p>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Active Elections summary card */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h2 className="text-base font-semibold text-surface-800">Active Now</h2>
            </div>
            {activeElections.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-surface-400">No active elections</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {activeElections.slice(0, 4).map((el) => (
                  <Link
                    key={el.id}
                    to={`/admin/elections/${el.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-surface-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-surface-700 truncate mr-2">
                      {el.title}
                    </span>
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse-dot" />
                      <span className="text-xs text-success-600 font-medium">Live</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Students summary card */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <h2 className="text-base font-semibold text-surface-800">Students</h2>
              <Link
                to="/admin/students"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                Manage <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-surface-900">{students.length}</p>
                  <p className="text-sm text-surface-500">Total Students</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent-50 to-accent-100 flex items-center justify-center">
                  <Users className="h-7 w-7 text-accent-600" />
                </div>
              </div>
              <Link
                to="/admin/students"
                className="btn btn-secondary btn-sm w-full"
              >
                <UserPlus className="h-4 w-4" />
                Add Student
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
