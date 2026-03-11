import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useLiveResults } from '../../hooks/useSocket';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { formatNumber } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { ArrowLeft, BarChart2, Users, TrendingUp, CheckCircle, CreditCard, Download, Eye, EyeOff, List, Trophy, PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];


/* ────────────────────────────────────────────
   Live pulse indicator component
   ──────────────────────────────────────────── */

function LivePulse() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-600 bg-success-50 px-2.5 py-1 rounded-full">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
      </span>
      Live
    </span>
  );
}

const VIEW_MODES = [
  { key: 'chart', label: 'Chart', Icon: BarChart2 },
  { key: 'table', label: 'Table', Icon: List },
  { key: 'podium', label: 'Podium', Icon: Trophy },
  { key: 'pie', label: 'Pie', Icon: PieIcon },
];

export default function LiveResults() {
  const { id } = useParams();
  const { adminToken } = useAuth();
  const [election, setElection] = useState(null);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('chart');
  const liveData = useLiveResults(id, '/admin', adminToken);

  useEffect(() => {
    api.get(`/api/elections/${id}`).then(res => setElection(res.data.election));
    api.get(`/api/results/elections/${id}/stats`).then(res => setStats(res.data)).catch(() => {});
  }, [id]);

  const handleTogglePublic = async () => {
    try {
      await api.put(`/api/elections/${id}`, { results_public: election.results_public ? 0 : 1 });
      setElection(prev => ({ ...prev, results_public: prev.results_public ? 0 : 1 }));
      toast.success(election.results_public ? 'Results hidden from voters' : 'Results now visible to voters');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update visibility');
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await api.get(`/api/results/elections/${id}/export?format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: format === 'csv' ? 'text/csv' : format === 'pdf' ? 'application/pdf' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-${id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Group live results by position
  const groupedResults = {};
  if (liveData?.results) {
    for (const r of liveData.results) {
      if (!groupedResults[r.position_id]) {
        groupedResults[r.position_id] = {
          position_title: r.position_title,
          candidates: [],
        };
      }
      groupedResults[r.position_id].candidates.push(r);
    }
  }

  /* ---- Stats card data ---- */
  const statCards = [
    {
      title: 'Total Voters',
      value: formatNumber(liveData?.totalVoters ?? stats?.totalVoters ?? 0),
      icon: <Users className="h-6 w-6" strokeWidth={1.5} />,
      borderColor: 'border-l-primary-500',
      iconBg: 'from-primary-50 to-primary-100',
      iconText: 'text-primary-600',
    },
    {
      title: 'Turnout',
      value: `${stats?.turnout ?? '0'}%`,
      icon: <TrendingUp className="h-6 w-6" strokeWidth={1.5} />,
      borderColor: 'border-l-success-500',
      iconBg: 'from-success-50 to-green-100',
      iconText: 'text-success-600',
    },
    {
      title: 'Total Votes',
      value: formatNumber(stats?.totalVotes ?? 0),
      icon: <CheckCircle className="h-6 w-6" strokeWidth={1.5} />,
      borderColor: 'border-l-accent-500',
      iconBg: 'from-accent-50 to-accent-100',
      iconText: 'text-accent-600',
    },
    {
      title: 'Payments',
      value: stats?.payments?.count ?? 0,
      icon: <CreditCard className="h-6 w-6" strokeWidth={1.5} />,
      borderColor: 'border-l-warning-500',
      iconBg: 'from-warning-50 to-amber-100',
      iconText: 'text-warning-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════
          BACK LINK
          ═══════════════════════════════════════════ */}
      <Link
        to={`/admin/elections/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Election
      </Link>

      {/* ═══════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-surface-900">Live Results</h2>
              <LivePulse />
            </div>
            {election && <p className="text-sm text-surface-500">{election.title}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePublic}
            className={`btn btn-sm gap-1.5 ${
              election?.results_public
                ? 'btn-success !bg-success-100 !text-success-700 !border-success-200 hover:!bg-success-200'
                : 'btn-warning !bg-warning-100 !text-warning-700 !border-warning-200 hover:!bg-warning-200'
            }`}
            title={election?.results_public ? 'Click to hide results from voters' : 'Click to make results visible to voters'}
          >
            {election?.results_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span>{election?.results_public ? 'Public' : 'Hidden'}</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary btn-sm"
          >
            <Download className="h-4 w-4" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-secondary btn-sm"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STATS GRID
          ═══════════════════════════════════════════ */}
      {(liveData || stats) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((stat) => (
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
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br ${stat.iconBg} ${stat.iconText}`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          VIEW MODE SWITCHER
          ═══════════════════════════════════════════ */}
      {Object.entries(groupedResults).length > 0 && (
        <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1 self-start">
          {VIEW_MODES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === key
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          RESULTS PER POSITION
          ═══════════════════════════════════════════ */}
      {Object.entries(groupedResults).length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <BarChart className="h-16 w-16 text-surface-200" strokeWidth={1} />
            <p className="text-surface-500 mt-4 font-medium">Waiting for votes...</p>
            <p className="text-sm text-surface-400 mt-1 max-w-sm">
              Results will appear here in real-time as votes are cast.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedResults).map(([posId, data]) => {
            const sorted = [...data.candidates].sort((a, b) => b.total_votes - a.total_votes);
            const totalVotesInPos = sorted.reduce((s, c) => s + c.total_votes, 0);
            const chartData = sorted.map(c => ({ name: c.full_name, votes: c.total_votes, code: c.contestant_code }));

            return (
              <div key={posId} className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-surface-100">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-surface-800">{data.position_title}</h3>
                  <span className="ml-auto text-xs text-surface-400">{totalVotesInPos} total votes</span>
                </div>

                <div className="p-5">
                  {/* ── Bar Chart ── */}
                  {viewMode === 'chart' && (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v) => [`${v} votes`, 'Votes']} />
                          <Bar dataKey="votes" radius={[0, 4, 4, 0]} animationDuration={300}>
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* ── Table View ── */}
                  {viewMode === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-surface-100">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Rank</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Candidate</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Code</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Votes</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">%</th>
                            <th className="py-2 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((c, i) => {
                            const pct = totalVotesInPos > 0 ? ((c.total_votes / totalVotesInPos) * 100).toFixed(1) : '0.0';
                            return (
                              <tr key={c.candidate_id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                    i === 0 ? 'bg-warning-100 text-warning-700' :
                                    i === 1 ? 'bg-surface-100 text-surface-600' :
                                    i === 2 ? 'bg-orange-100 text-orange-600' :
                                    'bg-surface-50 text-surface-400'
                                  }`}>{i + 1}</span>
                                </td>
                                <td className="py-3 px-3 font-medium text-surface-800">{c.full_name}</td>
                                <td className="py-3 px-3 font-mono text-xs text-surface-500">{c.contestant_code || '—'}</td>
                                <td className="py-3 px-3 text-right font-bold text-surface-900 tabular-nums">{formatNumber(c.total_votes)}</td>
                                <td className="py-3 px-3 text-right text-surface-500 tabular-nums">{pct}%</td>
                                <td className="py-3 px-3 w-32">
                                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ── Podium View ── */}
                  {viewMode === 'podium' && (
                    <div className="py-4">
                      {/* Top 3 podium */}
                      {sorted.length >= 2 && (
                        <div className="flex items-end justify-center gap-3 mb-6">
                          {/* 2nd place */}
                          {sorted[1] && (
                            <div className="flex flex-col items-center gap-2 flex-1 max-w-[130px]">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center text-xl font-bold text-surface-600 border-4 border-surface-200">
                                {sorted[1].photo_url
                                  ? <img src={sorted[1].photo_url} className="w-full h-full rounded-full object-cover" alt="" />
                                  : sorted[1].full_name.charAt(0)}
                              </div>
                              <p className="text-xs font-semibold text-surface-700 text-center leading-tight line-clamp-2">{sorted[1].full_name}</p>
                              <p className="text-sm font-bold text-surface-900">{formatNumber(sorted[1].total_votes)}</p>
                              <div className="w-full bg-surface-200 rounded-t-lg flex items-end justify-center" style={{ height: 70 }}>
                                <span className="text-2xl pb-1">🥈</span>
                              </div>
                            </div>
                          )}
                          {/* 1st place */}
                          <div className="flex flex-col items-center gap-2 flex-1 max-w-[150px]">
                            <div className="relative">
                              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</span>
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-warning-100 to-warning-200 flex items-center justify-center text-2xl font-bold text-warning-700 border-4 border-warning-300">
                                {sorted[0].photo_url
                                  ? <img src={sorted[0].photo_url} className="w-full h-full rounded-full object-cover" alt="" />
                                  : sorted[0].full_name.charAt(0)}
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-surface-700 text-center leading-tight line-clamp-2">{sorted[0].full_name}</p>
                            <p className="text-base font-bold text-warning-700">{formatNumber(sorted[0].total_votes)}</p>
                            <div className="w-full bg-warning-200 rounded-t-lg flex items-end justify-center" style={{ height: 100 }}>
                              <span className="text-2xl pb-1">🥇</span>
                            </div>
                          </div>
                          {/* 3rd place */}
                          {sorted[2] && (
                            <div className="flex flex-col items-center gap-2 flex-1 max-w-[130px]">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-xl font-bold text-orange-600 border-4 border-orange-200">
                                {sorted[2].photo_url
                                  ? <img src={sorted[2].photo_url} className="w-full h-full rounded-full object-cover" alt="" />
                                  : sorted[2].full_name.charAt(0)}
                              </div>
                              <p className="text-xs font-semibold text-surface-700 text-center leading-tight line-clamp-2">{sorted[2].full_name}</p>
                              <p className="text-sm font-bold text-surface-900">{formatNumber(sorted[2].total_votes)}</p>
                              <div className="w-full bg-orange-100 rounded-t-lg flex items-end justify-center" style={{ height: 50 }}>
                                <span className="text-2xl pb-1">🥉</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Remaining candidates */}
                      {sorted.slice(3).map((c, i) => {
                        const pct = totalVotesInPos > 0 ? ((c.total_votes / totalVotesInPos) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={c.candidate_id} className="flex items-center gap-3 py-2 border-b border-surface-50 last:border-0">
                            <span className="w-6 text-center text-sm font-semibold text-surface-400">{i + 4}</span>
                            <span className="flex-1 text-sm text-surface-700 font-medium">{c.full_name}</span>
                            <span className="text-xs text-surface-400 tabular-nums">{pct}%</span>
                            <span className="text-sm font-bold text-surface-900 tabular-nums w-12 text-right">{formatNumber(c.total_votes)}</span>
                          </div>
                        );
                      })}
                      {sorted.length === 1 && (
                        <div className="flex flex-col items-center gap-2 mt-4">
                          <span className="text-4xl">🥇</span>
                          <p className="font-bold text-surface-800">{sorted[0].full_name}</p>
                          <p className="text-2xl font-extrabold text-warning-600">{formatNumber(sorted[0].total_votes)} votes</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Pie Chart ── */}
                  {viewMode === 'pie' && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="votes"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={40}
                            paddingAngle={2}
                            label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [`${v} votes`, 'Votes']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
